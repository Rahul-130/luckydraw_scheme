const express = require('express');
const { getConnection, oracledb } = require('../db');
const requireAuth = require('../middleware/requireAuth');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  const conn = await getConnection();
  try {
    const { password, otp } = req.body;
    if (!password || !otp) {
      return res.status(400).json({ error: 'Password and OTP are required.' });
    }

    // 1. Verify user's credentials
    const userResult = await conn.execute(
      `SELECT password_hash, is_2fa_enabled, two_fa_secret FROM users WHERE id = :id`,
      { id: req.user.id }
    );

    if (!userResult.rows.length) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userResult.rows[0];

    const isPasswordValid = await bcrypt.compare(String(password), user.PASSWORD_HASH);
    const isOtpValid = speakeasy.totp.verify({
      secret: user.TWO_FA_SECRET,
      encoding: 'base32',
      token: otp,
    });

    if (!isPasswordValid || !isOtpValid || user.IS_2FA_ENABLED !== 1) {
      return res.status(401).json({ error: 'Invalid password or OTP.' });
    }

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
        `SELECT id, name, relation_info, phone, address FROM customers WHERE book_id=:bid AND is_frozen=0`,
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

        if (totalMonths - paidCount <= 2) {
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
          `INSERT INTO winner (book_id, book_name, customer_id, customer_name, relation_info, address, phone, win_date)
           VALUES (:bid, :bname, :cid, :cname, :relationInfo, :addr, :phone, CURRENT_TIMESTAMP)
           RETURNING win_date INTO :win_date`,
          { 
            bid: Number(book.ID), 
            bname: book.NAME, 
            cid: Number(winnerId), 
            cname: winner.NAME, 
            relationInfo: winner.RELATION_INFO,
            addr: winner.ADDRESS, 
            phone: winner.PHONE,
            win_date: { dir: oracledb.BIND_OUT, type: oracledb.DATE }
          }
        );
        
        winners.push({
            bookId: String(book.ID),
            bookName: book.NAME,
            customerId: String(winnerId),
            customerName: winner.NAME,
            relationInfo: winner.RELATION_INFO,
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
