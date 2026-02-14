const express = require('express');
const { getConnection, oracledb } = require('../db');
const requireAuth = require('../middleware/requireAuth');
const router = express.Router();


// search and pagination for books
router.get('/', requireAuth, async (req, res) => {
  const { page = 1, pageSize = 10, search = '' } = req.query;
  const conn = await getConnection();
  try {
    const offset = (Number(page) - 1) * Number(pageSize);
    const binds = { owner_id: req.user.id };
    let resultQuery, countQuery;
    let searchClause = '';

    if (search) {
      searchClause = `AND (LOWER(name) LIKE LOWER(:search) OR TO_CHAR(id) LIKE :search)`;
      binds.search = `%${search}%`;
    }

    resultQuery = `SELECT * FROM books WHERE owner_id = :owner_id ${searchClause} ORDER BY id OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`;
    countQuery = `SELECT COUNT(*) AS CNT FROM books WHERE owner_id = :owner_id ${searchClause}`;

    binds.offset = offset;
    binds.pageSize = Number(pageSize);

    const result = await conn.execute(resultQuery, binds);
    const countResult = await conn.execute(countQuery, { owner_id: req.user.id, ...(search && { search: binds.search }) });

    const books = result.rows.map(row => ({
      id: row.ID,
      name: row.NAME,
      maxCustomers: row.MAX_CUSTOMERS,
      isActive: row.IS_ACTIVE === 1,
      startMonthIso: row.START_MONTH_ISO,
      totalAmount: row.TOTAL_AMOUNT,
    }));

    res.json({ data: books, total: Number(countResult.rows[0].CNT) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch books' });
  } finally {
    if (conn) await conn.close();
  }
});


// Books - list books for the authenticated user
// router.get('/', requireAuth, async (req, res) => {
//   const page = parseInt(req.query.page, 10) || 1;
//   const pageSize = parseInt(req.query.pageSize, 10) || 10;
//   const offset = (page - 1) * pageSize;

//   const conn = await getConnection();
//   try {
//     // First, get the total count of books for the user
//     const countResult = await conn.execute(
//       `SELECT COUNT(*) AS total FROM books WHERE owner_id=:oid`,
//       { oid: Number(req.user.id) }
//     );
//     const totalItems = countResult.rows[0].TOTAL;

//     // Then, fetch the paginated data
//     const r = await conn.execute(
//       `SELECT id, owner_id, name, max_customers, is_active, start_month_iso 
//        FROM books 
//        WHERE owner_id=:oid 
//        ORDER BY id DESC
//        OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`,
//       { oid: Number(req.user.id), offset, pageSize }
//     );
//     const rows = r.rows.map(row => ({
//       id: String(row.ID),
//       ownerId: String(row.OWNER_ID),
//       name: row.NAME,
//       maxCustomers: row.MAX_CUSTOMERS,
//       isActive: row.IS_ACTIVE === 1,
//       startMonthIso: row.START_MONTH_ISO
//     }));
//     res.json({ items: rows, totalItems });
//   } catch (e) { console.error('List books error:', e); res.status(500).json({ error: 'internal error' }); }
//   finally { await conn.close(); }
// });


// Get a single book by ID
router.get('/:bookId', requireAuth, async (req, res) => {
  const conn = await getConnection();
  try {
    const r = await conn.execute(
      `SELECT id, owner_id, name, max_customers, is_active, start_month_iso, total_amount 
       FROM books 
       WHERE id = :id AND owner_id = :oid`,
      { id: Number(req.params.bookId), oid: Number(req.user.id) }
    );
    if (!r.rows.length) return res.status(404).json({ error: 'book not found' });
    const book = r.rows[0];
    res.json({ id: String(book.ID), ownerId: String(book.OWNER_ID), name: book.NAME, maxCustomers: book.MAX_CUSTOMERS, isActive: book.IS_ACTIVE === 1, startMonthIso: book.START_MONTH_ISO, totalAmount: book.TOTAL_AMOUNT });
  } catch (e) {
    console.error('Get book error:', e);
    res.status(500).json({ error: 'internal error' });
  } finally {
    await conn.close();
  }
});

// Books - create a new book for the authenticated user
router.post('/', requireAuth, async (req, res) => {
  const { name, maxCustomers, startMonthIso, totalAmount } = req.body || {};
  if (!name || !maxCustomers || !startMonthIso) return res.status(400).json({ error: 'name, maxCustomers, startMonthIso required' });
  const conn = await getConnection();
  try {
    // Check if a book with the same details already exists for this user
    const existingBook = await conn.execute(
      `SELECT id FROM books WHERE owner_id = :owner_id AND name = :name`,
      { owner_id: Number(req.user.id), name: String(name) }
    );

    if (existingBook.rows.length > 0) {
      return res.status(409).json({ error: 'A book with this name already exists.' });
    }

    const result = await conn.execute(
      `INSERT INTO books (owner_id, name, max_customers, is_active, start_month_iso, total_amount)
       VALUES (:owner_id, :name, :max_customers, 1, :start_month_iso, :total_amount)
       RETURNING id INTO :id`,
      {
        owner_id: Number(req.user.id),
        name: String(name),
        max_customers: Number(maxCustomers),
        start_month_iso: String(startMonthIso),
        total_amount: Number(totalAmount || 0),
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    await conn.commit();
    const id = String(result.outBinds.id[0]);
    res.status(201).json({ id, ownerId: req.user.id, name, maxCustomers: Number(maxCustomers), isActive: true, startMonthIso, totalAmount: Number(totalAmount || 0) });
  } catch (e) { console.error('Create book error:', e); res.status(500).json({ error: 'internal error' }); }
  finally { await conn.close(); }
});

// Toggle book - to activate or deactivate a book
router.patch('/:bookId/toggle', requireAuth, async (req, res) => {
  const conn = await getConnection();
  try {
    const r = await conn.execute(`SELECT id, is_active FROM books WHERE id=:id AND owner_id=:oid`, { id: Number(req.params.bookId), oid: Number(req.user.id) });
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    const isActive = r.rows[0].IS_ACTIVE === 1 ? 0 : 1;
    await conn.execute(`UPDATE books SET is_active=:a WHERE id=:id`, { a: isActive, id: Number(req.params.bookId) });
    await conn.commit();
    res.json({ id: String(req.params.bookId), isActive: isActive === 1 });
  } catch (e) { console.error('Toggle book error:', e); res.status(500).json({ error: 'internal error' }); }
  finally { await conn.close(); }
});

// Customers - to list all customers for a book
router.get('/:bookId/customers', requireAuth, async (req, res) => {
  const conn = await getConnection();
  try {
    const book = await conn.execute(`SELECT id FROM books WHERE id=:id AND owner_id=:oid`, { id: Number(req.params.bookId), oid: Number(req.user.id) });
    if (!book.rows.length) return res.status(404).json({ error: 'book not found' });
    const r = await conn.execute(`SELECT id, name, phone, address FROM customers WHERE book_id=:bid ORDER BY id`, { bid: Number(req.params.bookId) });
    const rows = r.rows.map(row => ({ id: String(row.ID), bookId: String(req.params.bookId), name: row.NAME, phone: row.PHONE, address: row.ADDRESS }));
    res.json(rows);
  } catch (e) { console.error('List customers error:', e); res.status(500).json({ error: 'internal error' }); }
  finally { await conn.close(); }
});

// Customers - to create a new customer for a book - if all the fields are same as existing customer, return error
router.post('/:bookId/customers', requireAuth, async (req, res) => {
  const { name, phone, address } = req.body || {};
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
      `SELECT id FROM customers WHERE book_id=:bid AND name=:name AND phone=:phone AND address=:address`,
      { bid: Number(req.params.bookId), name: String(name), phone: String(phone), address: String(address) }
    );
    if (custCheck.rows.length)
      return res.status(400).json({ error: 'customer already exists' });

    // 4. Insert new customer
    const result = await conn.execute(
      `INSERT INTO customers (book_id, name, phone, address)
       VALUES (:bid, :name, :phone, :address)
       RETURNING id INTO :id`,
      {
        bid: Number(req.params.bookId),
        name: String(name),
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


// Edit book - to change name, maxCustomers, startMonthIso
router.patch('/:bookId', requireAuth, async (req, res) => {
  const { name, maxCustomers, startMonthIso, totalAmount } = req.body || {};
  if (!name && !maxCustomers && !startMonthIso && totalAmount === undefined) return res.status(400).json({ error: 'at least one field required' });
  const conn = await getConnection();
  try {
    const r = await conn.execute(`SELECT id FROM books WHERE id=:id AND owner_id=:oid`, { id: Number(req.params.bookId), oid: Number(req.user.id) });
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    const updates = [];
    const params = { id: Number(req.params.bookId) };
    if (name) { updates.push('name=:name'); params.name = String(name); }
    if (maxCustomers) { updates.push('max_customers=:max_customers'); params.max_customers = Number(maxCustomers); }
    if (startMonthIso) { updates.push('start_month_iso=:start_month_iso'); params.start_month_iso = String(startMonthIso); }
    if (totalAmount !== undefined) { updates.push('total_amount=:total_amount'); params.total_amount = Number(totalAmount); }
    const sql = `UPDATE books SET ${updates.join(', ')} WHERE id=:id`;
    await conn.execute(sql, params);
    await conn.commit();
    res.json({ id: String(req.params.bookId), name, maxCustomers: maxCustomers ? Number(maxCustomers) : undefined, startMonthIso, totalAmount: totalAmount ? Number(totalAmount) : undefined });
  } catch (e) { console.error('Edit book error:', e); res.status(500).json({ error: 'internal error' }); }
  finally { await conn.close(); }
});

// Delete book - to delete a book and all its customers and payments
router.delete('/:bookId', requireAuth, async (req, res) => {
  const conn = await getConnection();
  try {
    const r = await conn.execute(`SELECT id FROM books WHERE id=:id AND owner_id=:oid`, { id: Number(req.params.bookId), oid: Number(req.user.id) });
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    // Delete payments
    await conn.execute(`DELETE FROM payments WHERE book_id=:bid`, { bid: Number(req.params.bookId) });
    // Delete customers
    await conn.execute(`DELETE FROM customers WHERE book_id=:bid`, { bid: Number(req.params.bookId) });
    // Delete book
    await conn.execute(`DELETE FROM books WHERE id=:id`, { id: Number(req.params.bookId) });
    await conn.commit();
    res.json({ message: 'book and related customers and payments deleted' });
  } catch (e) { console.error('Delete book error:', e); res.status(500).json({ error: 'internal error' }); }
  finally { await conn.close(); }
});

module.exports = router;