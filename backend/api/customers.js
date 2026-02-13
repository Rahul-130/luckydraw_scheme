const express = require('express');
const { getConnection, oracledb } = require('../db');
const requireAuth = require('../middleware/requireAuth');
const router = express.Router();

// Customers - to list all customers for a book
router.get('/:bookId', requireAuth, async (req, res) => {
  const { search = '' } = req.query;
  const conn = await getConnection();
  try {

    const book = await conn.execute(`SELECT id FROM books WHERE id=:id AND owner_id=:oid`, { id: Number(req.params.bookId), oid: Number(req.user.id) });
    if (!book.rows.length) return res.status(404).json({ error: 'book not found' });

    let query;
    const binds = { bid: Number(req.params.bookId) };

    if (search) {
      query = `
        SELECT c.id, c.name, c.relation_info, c.phone, c.address, c.is_frozen, c.settled_date,
               COUNT(p.id) as payment_count,
               FLOOR(MONTHS_BETWEEN(TRUNC(SYSDATE, 'MM'), TO_DATE(b.START_MONTH_ISO, 'YYYY-MM'))) + 1 AS total_months,
               (SELECT COUNT(*) FROM winner w WHERE w.customer_id = c.id AND w.book_id = c.book_id) as is_winner
        FROM customers c
        JOIN books b ON c.book_id = b.id
        LEFT JOIN payments p ON p.customer_id = c.id
        WHERE c.book_id = :bid
          AND (
            LOWER(c.name) LIKE LOWER(:search) OR
            LOWER(c.phone) LIKE LOWER(:search) OR
            LOWER(c.address) LIKE LOWER(:search)
          )
        GROUP BY c.id, c.name, c.relation_info, c.phone, c.address, c.is_frozen, c.settled_date, b.START_MONTH_ISO, c.book_id
        UNION ALL
        SELECT c.id, c.name, c.relation_info, c.phone, c.address, c.is_frozen, c.settled_date,
               COUNT(p.id) as payment_count,
               FLOOR(MONTHS_BETWEEN(TRUNC(SYSDATE, 'MM'), TO_DATE(b.START_MONTH_ISO, 'YYYY-MM'))) + 1 AS total_months,
               (SELECT COUNT(*) FROM winner w WHERE w.customer_id = c.id AND w.book_id = c.book_id) as is_winner
        FROM customers c
        JOIN books b ON c.book_id = b.id
        LEFT JOIN payments p ON p.customer_id = c.id
        WHERE c.book_id = :bid AND TO_CHAR(c.id) LIKE :search
        GROUP BY c.id, c.name, c.relation_info, c.phone, c.address, c.is_frozen, c.settled_date, b.START_MONTH_ISO, c.book_id
        ORDER BY id
      `;
      binds.search = `%${search}%`;
    } else {
      query = `
      SELECT 
        c.id, c.name, c.relation_info, c.phone, c.address, c.is_frozen, c.settled_date,
        COUNT(p.id) as payment_count,
        FLOOR(MONTHS_BETWEEN(TRUNC(SYSDATE, 'MM'), TO_DATE(b.START_MONTH_ISO, 'YYYY-MM'))) + 1 AS total_months,
        (SELECT COUNT(*) FROM winner w WHERE w.customer_id = c.id AND w.book_id = c.book_id) as is_winner
      FROM customers c
      JOIN books b ON c.book_id = b.id
      LEFT JOIN payments p ON p.customer_id = c.id
      WHERE c.book_id = :bid
      GROUP BY c.id, c.name, c.relation_info, c.phone, c.address, c.is_frozen, c.settled_date, b.START_MONTH_ISO, c.book_id
      ORDER BY c.id
      `;
    }

    const r = await conn.execute(query, binds);
    
    const rows = r.rows.map(row => ({
      id: String(row.ID),
      bookId: String(req.params.bookId),
      name: row.NAME,
      relationInfo: row.RELATION_INFO,
      phone: row.PHONE,
      address: row.ADDRESS,
      isFrozen: row.IS_FROZEN === 1,
      settledDate: row.SETTLED_DATE,
      TOTAL_MONTHS: row.TOTAL_MONTHS,
      isWinner: row.IS_WINNER > 0,
      PAYMENT_COUNT: row.PAYMENT_COUNT,
      missedPayments: Math.max(0, (row.TOTAL_MONTHS || 0) - row.PAYMENT_COUNT)
    }));
    res.json(rows);
  } catch (e) { console.error('List customers error:', e); res.status(500).json({ error: 'internal error' }); }
  finally { await conn.close(); }
});

// Customers - to create a new customer for a book - if all the fields are same as existing customer, return error
router.post('/:bookId', requireAuth, async (req, res) => {
  const { name, relationInfo, phone, address } = req.body || {};
  const conn = await getConnection();
  try {
    // 1. Check book ownership and limits
    const bookR = await conn.execute(
      `SELECT id, max_customers 
       FROM books 
       WHERE id = :id AND owner_id = :oid`,
      { id: Number(req.params.bookId), oid: Number(req.user.id) }
    );
    
    if (!bookR.rows.length)
      return res.status(404).json({ error: 'book not found' });

    if (!name || !phone || !address)
      return res.status(400).json({ error: 'name, phone, address required' });

    // 2. Count existing customers for this book
    const cntR = await conn.execute(
      `SELECT COUNT(*) AS CNT FROM customers WHERE book_id = :bid`,
      { bid: Number(req.params.bookId) }
    );
    const cnt = Number(
      cntR.rows[0].CNT || cntR.rows[0]['COUNT(*)'] || cntR.rows[0].COUNT
    );

    if (cnt >= Number(bookR.rows[0].MAX_CUSTOMERS))
      return res.status(400).json({ error: 'book reached max customers' });

    // 3. Check if customer already exists
    const custCheck = await conn.execute(
      `SELECT id FROM customers WHERE book_id=:bid AND LOWER(name)=LOWER(:name) AND phone=:phone AND LOWER(address)=LOWER(:address)`,
      { bid: Number(req.params.bookId), name: String(name), phone: String(phone), address: String(address) }
    );
    if (custCheck.rows.length)
      return res.status(409).json({ error: 'A customer with the same name, phone, and address already exists.' });

    // 4. Insert new customer
    const result = await conn.execute(
      `INSERT INTO customers (book_id, name, relation_info, phone, address)
       VALUES (:bid, :name, :relationInfo, :phone, :address)

       RETURNING id INTO :id`,
      {
        bid: Number(req.params.bookId),
        name: String(name),
        relationInfo: String(relationInfo || ''),
        phone: String(phone),
        address: String(address),
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );

    await conn.commit();

    // 5. Return inserted customer
    res.status(201).json({
      id: String(result.outBinds.id[0]),
      bookId: String(req.params.bookId),
      name: String(name),
      relationInfo: String(relationInfo || ''),
      phone: String(phone),
      address: String(address)
    });
  } catch (e) {
    console.error('Create customer error:', e);
    res.status(500).json({ error: 'internal error' });
  } finally {
    await conn.close();
  }
});

// Edit customer - only name, phone, address can be updated
router.patch('/:bookId/customers/:customerId', requireAuth, async (req, res) => {
  const { name, relationInfo, phone, address, isFrozen } = req.body || {};
  const conn = await getConnection();
  try {
    // 1. Check book ownership
    const bookR = await conn.execute(
      `SELECT id FROM books WHERE id=:id AND owner_id=:oid`,
      { id: Number(req.params.bookId), oid: Number(req.user.id) } // Ensure user owns the book
    );
    if (!bookR.rows.length)
      return res.status(404).json({ error: 'book not found' });
    if (!name && !phone && !address && relationInfo === undefined && isFrozen === undefined)
      return res.status(400).json({ error: 'at least one field is required' });
    // 2. Check customer exists
    const custR = await conn.execute(
      `SELECT id FROM customers WHERE id=:cid AND book_id=:bid`,
      { cid: Number(req.params.customerId), bid: Number(req.params.bookId) }
    );
    if (!custR.rows.length)
      return res.status(404).json({ error: 'customer not found' });

    // 3. Check for duplicates if name, phone, or address are being changed
    if (name || phone || address) {
      const currentCustomer = await conn.execute(`SELECT name, phone, address FROM customers WHERE id = :cid`, { cid: Number(req.params.customerId) });
      const newName = name || currentCustomer.rows[0].NAME;
      const newPhone = phone || currentCustomer.rows[0].PHONE;
      const newAddress = address || currentCustomer.rows[0].ADDRESS;

      const duplicateCheck = await conn.execute(
        `SELECT id FROM customers 
         WHERE book_id = :bid 
         AND LOWER(name) = LOWER(:name) 
         AND phone = :phone 
         AND LOWER(address) = LOWER(:address)
         AND id != :cid`, // Exclude the current customer from the check
        { bid: Number(req.params.bookId), name: newName, phone: newPhone, address: newAddress, cid: Number(req.params.customerId) }
      );

      if (duplicateCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Another customer with these details already exists.' });
      }
    }
    // 3. Update customer
    const fields = [];
    const binds = { cid: Number(req.params.customerId), bid: Number(req.params.bookId) };
    if (name) { fields.push('name=:name'); binds.name = String(name); }
    if (relationInfo !== undefined) { fields.push('relation_info=:relationInfo'); binds.relationInfo = String(relationInfo); }
    if (phone) { fields.push('phone=:phone'); binds.phone = String(phone); }
    if (address) { fields.push('address=:address'); binds.address = String(address); }
    if (isFrozen !== undefined) { 
      fields.push('is_frozen=:isFrozen'); 
      binds.isFrozen = isFrozen ? 1 : 0; 
      // Automatically set or clear settled_date when freezing/unfreezing
      if (isFrozen) {
        fields.push('settled_date=CURRENT_TIMESTAMP');
      } else {
        fields.push('settled_date=NULL');
      }
    }
    const sql = `UPDATE customers SET ${fields.join(', ')} WHERE id=:cid AND book_id=:bid`;
    await conn.execute(sql, binds);
    await conn.commit();
    res.json({ message: 'customer updated' });
  } catch (e) {
    console.error('Edit customer error:', e);
    res.status(500).json({ error: 'internal error' });
  } finally {
    await conn.close();
  }
});

// Delete customer - also delete all payments of this customer
router.delete('/:bookId/customers/:customerId', requireAuth, async (req, res) => {
  const conn = await getConnection();
  try {
    // 1. Check book ownership
    const bookR = await conn.execute(
      `SELECT id FROM books WHERE id=:id AND owner_id=:oid`,
      { id: Number(req.params.bookId), oid: Number(req.user.id) } // Ensure user owns the book
    );
    if (!bookR.rows.length)
      return res.status(404).json({ error: 'book not found' });
    // 2. Check customer exists
    const custR = await conn.execute(
      `SELECT id FROM customers WHERE id=:cid AND book_id=:bid`,
      { cid: Number(req.params.customerId), bid: Number(req.params.bookId) }
    );
    if (!custR.rows.length)
      return res.status(404).json({ error: 'customer not found' });
    // 3. Delete payments
    await conn.execute(
      `DELETE FROM payments WHERE customer_id=:cid AND book_id=:bid`,
      { cid: Number(req.params.customerId), bid: Number(req.params.bookId) }
    );
    // 4. Delete customer
    await conn.execute(
      `DELETE FROM customers WHERE id=:cid AND book_id=:bid`,
      { cid: Number(req.params.customerId), bid: Number(req.params.bookId) }
    );
    await conn.commit();
    res.json({ message: 'customer and related payments deleted' });
  } catch (e) {
    console.error('Delete customer error:', e);
    res.status(500).json({ error: 'internal error' });
  } finally {
    await conn.close();
  }
});

module.exports = router;