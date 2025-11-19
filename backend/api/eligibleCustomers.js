const express = require('express');
const { getConnection } = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { route } = require('./books');
const router = express.Router();

const addMonths = (iso, n) => {
  const [y, m] = iso.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
};

// Get all customers eligible for the lucky draw
router.get('/', requireAuth, async (req, res) => {
  const conn = await getConnection();
  const { search = '' } = req.query;
  try {
    // console.log('Get eligible customers endpoint called');

    //1. Get active books
    const booksR = await conn.execute(
      `SELECT id, name, start_month_iso FROM books WHERE owner_id=:oid AND is_active=1`,
      { oid: Number(req.user.id) }
    );

    const now = new Date();

    // Filter books to consider only those that are at least 1 month old
    const eligibleBooks = booksR.rows.filter(book => {
      const [sy, sm] = book.START_MONTH_ISO.split('-').map(Number);
      const bookStart = new Date(sy, sm - 1, 1);
      const diffMonths = (now.getFullYear() - bookStart.getFullYear()) * 12 + (now.getMonth() - bookStart.getMonth());
      return diffMonths >= 1; //Check books which are at least 1 month old
    });
    
    //Intialize an array to hold eligible customers
    const eligibleCustomersList = [];

    const searchClause = search ? `
      AND (
        LOWER(c.name) LIKE LOWER(:search) OR 
        LOWER(c.phone) LIKE LOWER(:search) LIKE LOWER(:search) OR
        LOWER(c.address) LIKE LOWER(:search)
      )` : '';

    //Loop through each eligible book
    for (const book of eligibleBooks) {
      //Get non-frozen customers for this book
      const custR = await conn.execute(
        `SELECT id, name, relation_info, phone, address FROM customers WHERE book_id=:bid AND is_frozen=0`,
        { bid: Number(book.ID) }
      );

      //Loop through each non-frozen customer
      for (const cust of custR.rows) {
        //Get total months from book creation to current date
        const [sy, sm] = book.START_MONTH_ISO.split('-').map(Number);
        const bookStart = new Date(sy, sm - 1, 1);
        const totalMonths = (now.getFullYear() - bookStart.getFullYear()) * 12 + (now.getMonth() - bookStart.getMonth()) + 1;

        //Calculate the number of months the customer has paid for
        const payR = await conn.execute(
          `SELECT COUNT(*) AS CNT FROM payments WHERE customer_id=:cid AND book_id=:bid`,
          { cid: cust.ID, bid: Number(book.ID) }
        );
        const paidCount = Number(payR.rows[0].CNT);

        //A customer is eligible if they have missed at most 1 payment
        if (totalMonths - paidCount <= 2) {
          eligibleCustomersList.push({
            id: `${book.ID}-${cust.ID}`, //Create a unique ID
            bookName: book.NAME,
            customerName: cust.NAME,
            relationInfo: cust.RELATION_INFO,
            phone: cust.PHONE,
            address: cust.ADDRESS,
          });
        }
      }
    }

    // Apply frontend search filter if provided
    const filteredCustomers = eligibleCustomersList.filter(customer => {
      if (!search) return true;
      const lowerCaseSearch = search.toLowerCase();
      return customer.customerName.toLowerCase().includes(lowerCaseSearch) ||
             customer.phone.toLowerCase().includes(lowerCaseSearch) ||
             customer.address.toLowerCase().includes(lowerCaseSearch);
    });
    // Send the list of eligible customers as a JSON response
    res.json(filteredCustomers);
  } catch (e) { console.error('Get eligible customers error:', e); res.status(500).json({ error: 'Internal server error' }); } finally { if (conn) await conn.close(); }
}); 

module.exports = router;