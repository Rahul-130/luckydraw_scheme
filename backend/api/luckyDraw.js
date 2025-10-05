const express = require('express');
const { getConnection, oracledb } = require('../db');
const requireAuth = require('../middleware/requireAuth');
const router = express.Router();

// Hardcoded password for lucky draw. TODO: Move to environment variable.
const LUCKY_DRAW_PASSWORD = "password";

router.post('/', requireAuth, async (req, res) => {
  const { password } = req.body;

  if (password !== LUCKY_DRAW_PASSWORD) {
    console.log(password, LUCKY_DRAW_PASSWORD);
    return res.status(401).json({ error: 'Invalid password' });
  }

  const conn = await getConnection();
  try {
    // 1. Get active books that are at least 1 month old
    const booksR = await conn.execute(
      `SELECT id, name, start_month_iso FROM books WHERE owner_id=:oid AND is_active=1`,
      { oid: Number(req.user.id) }
    );
    const now = new Date();
    const eligibleBooks = booksR.rows.filter(book => {
      const [sy, sm] = book.START_MONTH_ISO.split('-').map(Number);
      const bookStart = new Date(sy, sm - 1, 1);
      const diffMonths = (now.getFullYear() - bookStart.getFullYear()) * 12 + (now.getMonth() - bookStart.getMonth());
      return diffMonths >= 1;
    });

    const winners = [];

    for (const book of eligibleBooks) {
      // 2. Get non-frozen customers for this book
      const custR = await conn.execute(
        `SELECT id, name, phone, address FROM customers WHERE book_id=:bid AND is_frozen=0`,
        { bid: Number(book.ID) }
      );

      const eligibleCustomers = [];
      for (const cust of custR.rows) {
        // 3. Check eligibility based on payments
        const [sy, sm] = book.START_MONTH_ISO.split('-').map(Number);
        const bookStart = new Date(sy, sm - 1, 1);
        const totalMonths = (now.getFullYear() - bookStart.getFullYear()) * 12 + (now.getMonth() - bookStart.getMonth()) + 1;

        const payR = await conn.execute(
          `SELECT COUNT(*) AS CNT FROM payments WHERE customer_id=:cid AND book_id=:bid`,
          { cid: cust.ID, bid: Number(book.ID) }
        );
        const paidCount = Number(payR.rows[0].CNT);

        if (totalMonths - paidCount <= 1) {
            eligibleCustomers.push(cust);
        }
      }

      if (eligibleCustomers.length) {
        // 4. Pick a random winner
        const winner = eligibleCustomers[Math.floor(Math.random() * eligibleCustomers.length)];
        const winnerId = winner.ID;

        // 5. Freeze winner for this book
        await conn.execute(
          `UPDATE customers SET is_frozen=1 WHERE id=:cid AND book_id=:bid`,
          { cid: winnerId, bid: Number(book.ID) }
        );

        // 6. Insert into winner table
        await conn.execute(
          `INSERT INTO winner (book_id, book_name, customer_id, customer_name, address, phone)
           VALUES (:bid, :bname, :cid, :cname, :addr, :phone)`,
          { 
            bid: Number(book.ID), 
            bname: book.NAME, 
            cid: Number(winnerId), 
            cname: winner.NAME, 
            addr: winner.ADDRESS, 
            phone: winner.PHONE 
          }
        );
        
        winners.push({
            bookId: String(book.ID),
            bookName: book.NAME,
            customerId: String(winnerId),
            customerName: winner.NAME,
            address: winner.ADDRESS,
            phone: winner.PHONE
        });
      }
    }
    await conn.commit();
    res.json({ winners });
  } catch (e) {
    console.error('Lucky draw error:', e);
    res.status(500).json({ error: 'internal error', details: e.message });
  } finally { 
    if (conn) {
      await conn.close(); 
    }
  }
});

module.exports = router;
