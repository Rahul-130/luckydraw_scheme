const express = require('express');
const { getConnection, oracledb } = require('../db');
const requireAuth = require('../middleware/requireAuth');
const router = express.Router();

// Payments - to create a payment for a customer in a book
router.post('/:bookId/customers/:customerId/payments', requireAuth, async (req, res) => {
  let { amount, monthIso, receiptNo, paymentType, amountCash, amountOnline, amountInstore, agentName } = req.body || {};
  
  // Auto-calculate total amount from splits if provided to ensure data consistency
  amountCash = Number(amountCash || 0);
  amountOnline = Number(amountOnline || 0);
  amountInstore = Number(amountInstore || 0);

  const totalSplit = amountCash + amountOnline + amountInstore;
  if (totalSplit > 0) {
    amount = totalSplit;
  }

  // Derive paymentType from the amounts
  const types = [];
  if (amountCash > 0) types.push('cash');
  if (amountOnline > 0) types.push('online');
  if (amountInstore > 0) types.push('instore');
  
  // If types are found, use them. Otherwise fallback to provided or default.
  if (types.length > 0) {
    paymentType = types.length > 1 ? 'mixed' : types[0];
  } else {
    paymentType = paymentType || 'cash';
  }

  if (!amount || !monthIso) return res.status(400).json({ error: 'amount and monthIso are required' });
  const conn = await getConnection();
  try {
    // Check book ownership
    const bookR = await conn.execute(
      `SELECT id, start_month_iso, total_amount FROM books WHERE id=:id AND owner_id=:oid AND is_active=1`,
      { id: Number(req.params.bookId), oid: Number(req.user.id) }
    );
    if (!bookR.rows.length) return res.status(404).json({ error: 'book not found or inactive' });

    // Check if payment month is not before the book's start month
    const bookStartMonth = bookR.rows[0].START_MONTH_ISO;
    if (String(monthIso) < bookStartMonth) {
      return res.status(400).json({ error: `Payment month cannot be before the book's start month (${bookStartMonth})` });
    }

    // Validate amount against book total_amount
    const bookTotalAmount = Number(bookR.rows[0].TOTAL_AMOUNT || 0);
    if (bookTotalAmount > 0 && amount !== bookTotalAmount) {
      return res.status(400).json({ error: `Invalid amount. This book requires a fixed monthly payment of ${bookTotalAmount}.` });
    }

    // Check if customer exists and is not frozen
    const custR = await conn.execute(
      `SELECT id, is_frozen FROM customers WHERE id=:cid AND book_id=:bid`,
      { cid: Number(req.params.customerId), bid: Number(req.params.bookId) }
    );
    if (!custR.rows.length) return res.status(404).json({ error: 'customer not found' });
    if (custR.rows[0].IS_FROZEN === 1)
      return res.status(403).json({ error: 'customer is frozen for this book' });

    // Check total payment count limit (Max 20)
    const countR = await conn.execute(
      `SELECT COUNT(*) AS CNT FROM payments WHERE customer_id=:cid AND book_id=:bid`,
      { cid: Number(req.params.customerId), bid: Number(req.params.bookId) }
    );
    if (countR.rows[0].CNT >= 20) {
      return res.status(400).json({ error: 'Maximum limit of 20 payments reached for this customer.' });
    }

    // Check if payment already exists for this monthIso
    const payCheck = await conn.execute(
      `SELECT id FROM payments WHERE customer_id=:cid AND book_id=:bid AND month_iso=:monthIso`,
      { cid: Number(req.params.customerId), bid: Number(req.params.bookId), monthIso: String(monthIso) }
    );
    if (payCheck.rows.length)
      return res.status(400).json({ error: 'payment already exists for this month' });

    // Insert payment
    const result = await conn.execute(
      `INSERT INTO payments (customer_id, book_id, month_iso, amount, receipt_no, payment_type, amount_cash, amount_online, amount_instore, agent_name) VALUES (:cid, :bid, :monthIso, :amount, :receiptNo, :paymentType, :amountCash, :amountOnline, :amountInstore, :agentName) RETURNING id, payment_date INTO :id, :payment_date`,
      {
        cid: Number(req.params.customerId),
        bid: Number(req.params.bookId),
        monthIso: String(monthIso),
        amount: Number(amount),
        receiptNo: receiptNo ? String(receiptNo) : null,
        paymentType: paymentType,
        amountCash: amountCash,
        amountOnline: amountOnline,
        amountInstore: amountInstore,
        agentName: agentName || null,
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
      paymentType: paymentType,
      amountCash: amountCash,
      amountOnline: amountOnline,
      amountInstore: amountInstore,
      agentName,
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
      `SELECT id, total_amount FROM books WHERE id=:id AND owner_id=:oid`,
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
      `SELECT id, month_iso, amount, payment_date, receipt_no, payment_type, is_luckydraw_winner, amount_cash, amount_online, amount_instore, agent_name
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
        isLuckyDrawWinner: row.IS_LUCKYDRAW_WINNER === 1,
        amountCash: Number(row.AMOUNT_CASH || 0),
        amountOnline: Number(row.AMOUNT_ONLINE || 0),
        amountInstore: Number(row.AMOUNT_INSTORE || 0),
        agentName: row.AGENT_NAME
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
  const { amount, paymentType, receiptNo, amountCash, amountOnline, amountInstore, agentName } = req.body || {};
  if (!amount && paymentType === undefined && receiptNo === undefined && amountCash === undefined && amountOnline === undefined && amountInstore === undefined && agentName === undefined) return res.status(400).json({ error: 'no fields to update' });
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
    
    // Validate amount against book total_amount if amount is changing
    const bookTotalAmount = Number(bookR.rows[0].TOTAL_AMOUNT || 0);
    if (amount && bookTotalAmount > 0 && Number(amount) !== bookTotalAmount) {
       return res.status(400).json({ error: `Invalid amount. This book requires a fixed monthly payment of ₹${bookTotalAmount}.` });
    }

    if (receiptNo !== undefined) { fields.push('receipt_no=:receiptNo'); binds.receiptNo = receiptNo ? String(receiptNo) : null; }
    if (amountCash !== undefined) { fields.push('amount_cash=:amountCash'); binds.amountCash = Number(amountCash); }
    if (amountOnline !== undefined) { fields.push('amount_online=:amountOnline'); binds.amountOnline = Number(amountOnline); }
    if (amountInstore !== undefined) { fields.push('amount_instore=:amountInstore'); binds.amountInstore = Number(amountInstore); }
    if (agentName !== undefined) { fields.push('agent_name=:agentName'); binds.agentName = agentName; }

    // Recalculate paymentType if amounts are being updated
    if (amountCash !== undefined || amountOnline !== undefined || amountInstore !== undefined) {
        // We need to fetch current values if not all are provided, but for simplicity, 
        // we assume the frontend sends all 3 if it sends one, or we rely on what's sent.
        // Better approach: Calculate type based on what is sent.
        const types = [];
        if (Number(amountCash || 0) > 0) types.push('cash');
        if (Number(amountOnline || 0) > 0) types.push('online');
        if (Number(amountInstore || 0) > 0) types.push('instore');
        
        if (types.length > 0) {
            const newType = types.length > 1 ? 'mixed' : types[0];
            fields.push('payment_type=:paymentType'); 
            binds.paymentType = newType;
        }
    } else if (paymentType) {
        fields.push('payment_type=:paymentType'); 
        binds.paymentType = String(paymentType);
    }

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
      `SELECT id, total_amount FROM books WHERE id=:id AND owner_id=:oid`,
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