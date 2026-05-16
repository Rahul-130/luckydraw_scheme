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

    resultQuery = `SELECT b.id, b.name, b.max_customers, b.is_active, b.start_month_iso, b.total_amount,
                   (SELECT COUNT(*) FROM customers c WHERE c.book_id = b.id) as customer_count
                   FROM books b
                   WHERE b.owner_id = :owner_id ${searchClause}
                   ORDER BY b.id OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`;
    countQuery = `SELECT COUNT(*) AS CNT FROM books WHERE owner_id = :owner_id ${searchClause}`;

    binds.offset = offset;
    binds.pageSize = Number(pageSize);

    const result = await conn.execute(resultQuery, binds);
    const countResult = await conn.execute(countQuery, { owner_id: req.user.id, ...(search && { search: binds.search }) });

    const books = result.rows.map(row => ({
      id: row.ID,
      name: row.NAME,
      maxCustomers: row.MAX_CUSTOMERS,
      customerCount: row.CUSTOMER_COUNT,
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

// Get all unique agents used in payments for the authenticated user
router.get('/agents', requireAuth, async (req, res) => {
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `SELECT DISTINCT UPPER(agent_name) as agent_name FROM (
         SELECT agent_name FROM payments p JOIN books b ON p.book_id = b.id WHERE b.owner_id = :oid
         UNION
         SELECT settlement_agent_name as agent_name FROM customers c JOIN books b ON c.book_id = b.id WHERE b.owner_id = :oid
       ) WHERE agent_name IS NOT NULL`,
      { oid: Number(req.user.id) }
    );
    const agents = result.rows.map(row => row.AGENT_NAME).filter(name => name && name.trim() !== '').sort();
    res.json(agents);
  } catch (e) {
    console.error('Get agents error:', e);
    res.status(500).json({ error: 'internal error' });
  } finally {
    if (conn) await conn.close();
  }
});

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

// Get stats for a single book (collected, settled, bonus)
router.get('/:bookId/stats', requireAuth, async (req, res) => {
  const conn = await getConnection();
  try {
    const bid = Number(req.params.bookId);
    const oid = Number(req.user.id);

    // Check ownership
    const bookCheck = await conn.execute('SELECT id FROM books WHERE id=:bid AND owner_id=:oid', { bid, oid });
    if (!bookCheck.rows.length) return res.status(404).json({ error: 'Book not found' });

    const result = await conn.execute(`
      SELECT
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE book_id = :bid) AS total_collected,
        (SELECT COALESCE(SUM(bonus_amount), 0) FROM customers WHERE book_id = :bid AND settled_date IS NOT NULL) AS total_bonus,
        (SELECT COALESCE(SUM(p.amount), 0) FROM payments p JOIN customers c ON p.customer_id = c.id AND p.book_id = c.book_id WHERE p.book_id = :bid AND c.settled_date IS NOT NULL) AS total_settled_principal
      FROM dual
    `, { bid });

    const row = result.rows[0];
    res.json({
      totalCollected: row.TOTAL_COLLECTED,
      totalBonus: row.TOTAL_BONUS,
      totalSettled: row.TOTAL_SETTLED_PRINCIPAL
    });
  } catch (e) {
    console.error('Get book stats error:', e);
    res.status(500).json({ error: 'internal error' });
  } finally {
    if (conn) await conn.close();
  }
});

// Books - create a new book for the authenticated user
router.post('/', requireAuth, async (req, res) => {
  const { name, maxCustomers, startMonthIso, totalAmount } = req.body || {};
  if (!name || !maxCustomers || !startMonthIso) return res.status(400).json({ error: 'name, maxCustomers, startMonthIso required' });
  const conn = await getConnection();
  try {
    // Check if a book with the same details already exists for this user
    const upperName = String(name).trim().toUpperCase();
    const existingBook = await conn.execute(
      `SELECT id FROM books WHERE owner_id = :owner_id AND UPPER(name) = :name`,
      { owner_id: Number(req.user.id), name: upperName }
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
        name: upperName,
        max_customers: Number(maxCustomers),
        start_month_iso: String(startMonthIso),
        total_amount: Number(totalAmount || 0),
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    await conn.commit();
    const id = String(result.outBinds.id[0]);
    res.status(201).json({ id, ownerId: req.user.id, name: upperName, maxCustomers: Number(maxCustomers), isActive: true, startMonthIso, totalAmount: Number(totalAmount || 0) });
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
    let upperName;
    if (name) {
      upperName = String(name).trim().toUpperCase();
      const duplicateCheck = await conn.execute(
        `SELECT id FROM books WHERE owner_id = :owner_id AND UPPER(name) = :name AND id != :id`,
        { owner_id: Number(req.user.id), name: upperName, id: Number(req.params.bookId) }
      );
      if (duplicateCheck.rows.length > 0) {
        return res.status(409).json({ error: 'A book with this name already exists.' });
      }
      updates.push('name=:name');
      params.name = upperName;
    }
    if (maxCustomers) { updates.push('max_customers=:max_customers'); params.max_customers = Number(maxCustomers); }
    if (startMonthIso) { updates.push('start_month_iso=:start_month_iso'); params.start_month_iso = String(startMonthIso); }
    if (totalAmount !== undefined) { updates.push('total_amount=:total_amount'); params.total_amount = Number(totalAmount); }
    const sql = `UPDATE books SET ${updates.join(', ')} WHERE id=:id`;
    await conn.execute(sql, params);
    await conn.commit();
    res.json({ id: String(req.params.bookId), name: upperName || name, maxCustomers: maxCustomers ? Number(maxCustomers) : undefined, startMonthIso, totalAmount: totalAmount ? Number(totalAmount) : undefined });
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