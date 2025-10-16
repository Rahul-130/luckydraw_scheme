const express = require('express');
const { getConnection, oracledb } = require('../db');
const requireAuth = require('../middleware/requireAuth');
const router = express.Router();

// Payments - to create a payment for a customer in a book
router.post('/:bookId/customers/:customerId/payments', requireAuth, async (req, res) => {
  const { amount, monthIso, receiptNo, paymentType } = req.body || {};
  if (!amount || !monthIso) return res.status(400).json({ error: 'amount and monthIso are required' });
  const conn = await getConnection();
  try {
    // Check book ownership
    const bookR = await conn.execute(
      `SELECT id, start_month_iso FROM books WHERE id=:id AND owner_id=:oid AND is_active=1`,
      { id: Number(req.params.bookId), oid: Number(req.user.id) }
    );
    if (!bookR.rows.length) return res.status(404).json({ error: 'book not found or inactive' });

    // Check if payment month is not before the book's start month
    const bookStartMonth = bookR.rows[0].START_MONTH_ISO;
    if (String(monthIso) < bookStartMonth) {
      return res.status(400).json({ error: `Payment month cannot be before the book's start month (${bookStartMonth})` });
    }

    // Check if customer exists and is not frozen
    const custR = await conn.execute(
      `SELECT id, is_frozen FROM customers WHERE id=:cid AND book_id=:bid`,
      { cid: Number(req.params.customerId), bid: Number(req.params.bookId) }
    );
    if (!custR.rows.length) return res.status(404).json({ error: 'customer not found' });
    if (custR.rows[0].IS_FROZEN === 1)
      return res.status(403).json({ error: 'customer is frozen for this book' });

    // Check if payment already exists for this monthIso
    const payCheck = await conn.execute(
      `SELECT id FROM payments WHERE customer_id=:cid AND book_id=:bid AND month_iso=:monthIso`,
      { cid: Number(req.params.customerId), bid: Number(req.params.bookId), monthIso: String(monthIso) }
    );
    if (payCheck.rows.length)
      return res.status(400).json({ error: 'payment already exists for this month' });

    // Insert payment
    const result = await conn.execute(
      `INSERT INTO payments (customer_id, book_id, month_iso, amount, receipt_no, payment_type) VALUES (:cid, :bid, :monthIso, :amount, :receiptNo, :paymentType) RETURNING id, payment_date INTO :id, :payment_date`,
      {
        cid: Number(req.params.customerId),
        bid: Number(req.params.bookId),
        monthIso: String(monthIso),
        amount: Number(amount),
        receiptNo: receiptNo ? String(receiptNo) : null,
        paymentType: paymentType || 'online',
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        payment_date: { dir: oracledb.BIND_OUT, type: oracledb.DATE }
      }
    );
    await conn.commit();
    const paymentDate = result.outBinds.payment_date[0];
    res.status(201).json({
      id: String(result.outBinds.id[0]),
      customerId: String(req.params.customerId),
      bookId: String(req.params.bookId),
      monthIso,
      amount: Number(amount),
      receiptNo,
      paymentType: paymentType || 'online',
      paymentDate: paymentDate.toISOString() // Return full ISO string
    });
  } catch (e) {
    console.error('Create payment error:', e);
    res.status(500).json({ error: 'internal error', details: e.message });
  } finally { await conn.close(); }
});

// get payments for a customer in a book
router.get('/:bookId/customers/:customerId/payments', requireAuth, async (req, res) => {
  const conn = await getConnection();
  try {
    // Check book ownership
    const bookR = await conn.execute(
      `SELECT id FROM books WHERE id=:id AND owner_id=:oid`,
      { id: Number(req.params.bookId), oid: Number(req.user.id) }
    );
    if (!bookR.rows.length) return res.status(404).json({ error: 'book not found' });
    // Check customer exists
    const custR = await conn.execute(
      `SELECT id FROM customers WHERE id=:cid AND book_id=:bid`,
      { cid: Number(req.params.customerId), bid: Number(req.params.bookId) }
    );
    if (!custR.rows.length) return res.status(404).json({ error: 'customer not found' });
    // Get payments
    const payR = await conn.execute(
      `SELECT id, month_iso, amount, payment_date, receipt_no, payment_type, is_luckydraw_winner
        FROM payments
        WHERE customer_id=:cid AND book_id=:bid
        ORDER BY payment_date DESC`,
      { cid: Number(req.params.customerId), bid: Number(req.params.bookId) }
    );
    const rows = payR.rows.map(row => {
      return {
        id: String(row.ID),
        customerId: String(req.params.customerId),
        bookId: String(req.params.bookId),
        monthIso: row.MONTH_ISO,
        amount: Number(row.AMOUNT),
        receiptNo: row.RECEIPT_NO,
        paymentType: row.PAYMENT_TYPE,
        paymentDate: row.PAYMENT_DATE.toISOString(), // Return full ISO string
        isLuckyDrawWinner: row.IS_LUCKYDRAW_WINNER === 1
      };
    });
    res.json(rows);
  } catch (e) {
    console.error('List payments error:', e);
    res.status(500).json({ error: 'internal error', details: e.message });
  } finally { await conn.close(); }
});

// Edit payment - amount and receipt number can be updated
router.patch('/:bookId/customers/:customerId/payments/:paymentId', requireAuth, async (req, res) => {
  const { amount, receiptNo } = req.body || {};
  if (!amount && receiptNo === undefined) return res.status(400).json({ error: 'amount or receiptNo is required' });
  const conn = await getConnection();
  try {
    // Check book ownership
    const bookR = await conn.execute(
      `SELECT id FROM books WHERE id=:id AND owner_id=:oid`,
      { id: Number(req.params.bookId), oid: Number(req.user.id) }
    );
    if (!bookR.rows.length) return res.status(404).json({ error: 'book not found' });
    // Check customer exists
    const custR = await conn.execute(
      `SELECT id FROM customers WHERE id=:cid AND book_id=:bid`,
      { cid: Number(req.params.customerId), bid: Number(req.params.bookId) }
    );
    if (!custR.rows.length) return res.status(404).json({ error: 'customer not found' });
    // Check payment exists
    const payR = await conn.execute(
      `SELECT id FROM payments WHERE id=:pid AND customer_id=:cid AND book_id=:bid`,
      { pid: Number(req.params.paymentId), cid: Number(req.params.customerId), bid: Number(req.params.bookId) }
    );
    if (!payR.rows.length) return res.status(404).json({ error: 'payment not found' });

    const fields = [];
    const binds = { pid: Number(req.params.paymentId) };
    if (amount) { fields.push('amount=:amount'); binds.amount = Number(amount); }
    if (receiptNo !== undefined) { fields.push('receipt_no=:receiptNo'); binds.receiptNo = receiptNo ? String(receiptNo) : null; }

    const sql = `UPDATE payments SET ${fields.join(', ')} WHERE id=:pid`;
    await conn.execute(sql, binds);
    await conn.commit();
    res.json({ message: 'payment updated' });
  } catch (e) {
    console.error('Edit payment error:', e);
    res.status(500).json({ error: 'internal error' });
  }
  finally { await conn.close(); }
});

// Delete payment
router.delete('/:bookId/customers/:customerId/payments/:paymentId', requireAuth, async (req, res) => {
  const conn = await getConnection();
  try {
    // Check book ownership
    const bookR = await conn.execute(
      `SELECT id FROM books WHERE id=:id AND owner_id=:oid`,
      { id: Number(req.params.bookId), oid: Number(req.user.id) }
    );
    if (!bookR.rows.length) return res.status(404).json({ error: 'book not found' });
    // Check customer exists
    const custR = await conn.execute(
      `SELECT id FROM customers WHERE id=:cid AND book_id=:bid`,
      { cid: Number(req.params.customerId), bid: Number(req.params.bookId) }
    );
    if (!custR.rows.length) return res.status(404).json({ error: 'customer not found' });
    // Check payment exists
    const payR = await conn.execute(
      `SELECT id FROM payments WHERE id=:pid AND customer_id=:cid AND book_id=:bid`,
      { pid: Number(req.params.paymentId), cid: Number(req.params.customerId), bid: Number(req.params.bookId) }
    );
    if (!payR.rows.length) return res.status(404).json({ error: 'payment not found' });
    // Delete payment
    await conn.execute(
      `DELETE FROM payments WHERE id=:pid`,
      { pid: Number(req.params.paymentId) }
    );
    await conn.commit();
    res.json({ message: 'payment deleted' });
  } catch (e) {
    console.error('Delete payment error:', e);
    res.status(500).json({ error: 'internal error' });
  } finally { await conn.close(); }
});

module.exports = router;