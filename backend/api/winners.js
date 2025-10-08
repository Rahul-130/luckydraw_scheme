const express = require('express');
const { getConnection } = require('../db');
const requireAuth = require('../middleware/requireAuth');
const router = express.Router();

// Get all winners across all books for the logged-in user
router.get('/', requireAuth, async (req, res) => {
  const { search = '' } = req.query;
  const conn = await getConnection();
  try {
    const searchClause = `AND (
      LOWER(w.CUSTOMER_NAME) LIKE LOWER(:search) OR
      LOWER(w.BOOK_NAME) LIKE LOWER(:search) OR
      LOWER(w.ADDRESS) LIKE LOWER(:search) OR
      LOWER(w.PHONE) LIKE LOWER(:search)
    )`;

    // This query reads directly from the denormalized winner table,
    // filtered by books owned by the user.
    const result = await conn.execute(
      `SELECT w.ID, w.BOOK_ID, w.CUSTOMER_ID, w.CUSTOMER_NAME, w.BOOK_NAME, w.ADDRESS, w.PHONE, w.WIN_DATE
       FROM winner w
       JOIN books b ON w.BOOK_ID = b.ID
       WHERE b.OWNER_ID = :owner_id ${search ? searchClause : ''}
       ORDER BY w.WIN_DATE DESC`, {
      owner_id: req.user.id,
      ...(search && { search: `%${search}%` })
    }
    );

    const winners = result.rows.map(row => ({
      id: row.ID,
      bookId: row.BOOK_ID,
      customerId: row.CUSTOMER_ID,
      customerName: row.CUSTOMER_NAME,
      bookName: row.BOOK_NAME,
      address: row.ADDRESS,
      phone: row.PHONE,
      drawDate: row.WIN_DATE.toISOString().split('T')[0] // Format date to YYYY-MM-DD
    }));

    res.json(winners);
  } catch (e) {
    console.error('Get winners error:', e);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (conn) await conn.close();
  }
});

// Manually mark a customer as a winner
router.post('/mark', requireAuth, async (req, res) => {
  const { bookId, customerId, bookName, customerName, address, phone } = req.body;
  if (!bookId || !customerId || !bookName || !customerName || !address || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const conn = await getConnection();
  try {
    await conn.execute(
      `UPDATE customers SET is_frozen=1 WHERE id=:cid AND book_id=:bid`,
      { cid: customerId, bid: bookId }
    );

    await conn.execute(
      `INSERT INTO winner (book_id, book_name, customer_id, customer_name, address, phone, win_date)
       VALUES (:book_id, :book_name, :customer_id, :customer_name, :address, :phone, SYSDATE)`,
      { book_id: bookId, book_name: bookName, customer_id: customerId, customer_name: customerName, address, phone }
    );
    await conn.commit();
    res.json({ success: true });
  } catch (e) {
    console.error('Mark customer as winner error:', e);
    res.status(500).json({ error: 'Failed to mark winner' });
  } finally {
    if (conn) await conn.close();
  }
});

// Unmark a customer as a winner
router.post('/unmark', requireAuth, async (req, res) => {
  const { bookId, customerId } = req.body;
  const conn = await getConnection();
  try {
    await conn.execute(
      `UPDATE customers SET is_frozen=0 WHERE id=:cid AND book_id=:bid`,
      { cid: customerId, bid: bookId }
    );

    await conn.execute(
      `DELETE FROM winner WHERE customer_id=:cid AND book_id=:bid`,
      { cid: customerId, bid: bookId }
    );

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to unmark winner' });
  } finally {
    if (conn) await conn.close();
  }
});


module.exports = router;
