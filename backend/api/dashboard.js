const express = require('express');
const { getConnection } = require('../db');
const requireAuth = require('../middleware/requireAuth');
const router = express.Router();

router.get('/stats', requireAuth, async (req, res) => {
  const { startDate, endDate } = req.query;
  const conn = await getConnection();
  try {
    const ownerId = req.user.id;
    const dateFilterClause = startDate && endDate ? 'AND p.payment_date BETWEEN TO_DATE(:startDate, \'YYYY-MM-DD\') AND TO_DATE(:endDate, \'YYYY-MM-DD\')' : '';
    const dateBinds = startDate && endDate ? { startDate, endDate } : {};

    // 1. Book Counts
    const bookCountsResult = await conn.execute(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
         SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive
       FROM books WHERE owner_id = :ownerId`,
      { ownerId }
    );
    const bookCounts = bookCountsResult.rows[0];

    // 2. Customer Counts
    const customerCountsResult = await conn.execute(
      `SELECT
         COUNT(c.id) as total,
         SUM(CASE WHEN b.is_active = 1 THEN 1 ELSE 0 END) as from_active_books,
         SUM(CASE WHEN b.is_active = 0 THEN 1 ELSE 0 END) as from_inactive_books
       FROM customers c
       JOIN books b ON c.book_id = b.id
       WHERE b.owner_id = :ownerId`,
      { ownerId }
    );
    const customerCounts = customerCountsResult.rows[0];

    // 3. Winner Counts
    const winnerCountsResult = await conn.execute(
      `SELECT
         COUNT(w.id) as total,
         SUM(CASE WHEN b.is_active = 1 THEN 1 ELSE 0 END) as from_active_books,
         SUM(CASE WHEN b.is_active = 0 THEN 1 ELSE 0 END) as from_inactive_books
       FROM winner w
       JOIN books b ON w.book_id = b.id
       WHERE b.owner_id = :ownerId`,
      { ownerId }
    );
    const winnerCounts = winnerCountsResult.rows[0];

    // 4. Eligibility Counts (from active books)
    const eligibilityResult = await conn.execute(
      `SELECT
         c.id,
         FLOOR(MONTHS_BETWEEN(TRUNC(SYSDATE, 'MM'), TO_DATE(b.START_MONTH_ISO, 'YYYY-MM'))) + 1 AS total_months,
         (SELECT COUNT(*) FROM payments p WHERE p.customer_id = c.id) as payment_count
       FROM customers c
       JOIN books b ON c.book_id = b.id
       WHERE b.owner_id = :ownerId AND b.is_active = 1 AND c.is_frozen = 0`,
      { ownerId }
    );

    let eligibleCount = 0;
    let notEligibleCount = 0;
    eligibilityResult.rows.forEach(row => {
      const missedPayments = Math.max(0, (row.TOTAL_MONTHS || 0) - row.PAYMENT_COUNT);
      if (missedPayments <= 1) {
        eligibleCount++;
      } else {
        notEligibleCount++;
      }
    });

    // 5. Payment Stats
    const paymentStatsResult = await conn.execute(
      `SELECT
         SUM(CASE WHEN p.payment_date >= TRUNC(SYSDATE, 'MM') ${dateFilterClause.replace(/p\./g, '')} THEN 1 ELSE 0 END) as current_month_count,
         SUM(CASE WHEN p.payment_date >= TRUNC(SYSDATE, 'MM') ${dateFilterClause.replace(/p\./g, '')} THEN p.amount ELSE 0 END) as current_month_amount,
         SUM(CASE WHEN p.payment_date >= ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -1) AND p.payment_date < TRUNC(SYSDATE, 'MM') ${dateFilterClause.replace(/p\./g, '')} THEN 1 ELSE 0 END) as previous_month_count,
         SUM(CASE WHEN p.payment_date >= ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -1) AND p.payment_date < TRUNC(SYSDATE, 'MM') ${dateFilterClause.replace(/p\./g, '')} THEN p.amount ELSE 0 END) as previous_month_amount,
         b.is_active
       FROM payments p
       JOIN books b ON p.book_id = b.id
       WHERE b.owner_id = :ownerId
       GROUP BY b.is_active`,
      { ownerId, ...dateBinds }
    );

    const paymentStats = {
        all: { currentMonth: { count: 0, amount: 0 }, previousMonth: { count: 0, amount: 0 } },
        active: { currentMonth: { count: 0, amount: 0 }, previousMonth: { count: 0, amount: 0 } },
        inactive: { currentMonth: { count: 0, amount: 0 }, previousMonth: { count: 0, amount: 0 } },
    };

    paymentStatsResult.rows.forEach(row => {
        const type = row.IS_ACTIVE === 1 ? 'active' : 'inactive';
        paymentStats[type].currentMonth.count = row.CURRENT_MONTH_COUNT || 0;
        paymentStats[type].currentMonth.amount = row.CURRENT_MONTH_AMOUNT || 0;
        paymentStats[type].previousMonth.count = row.PREVIOUS_MONTH_COUNT || 0;
        paymentStats[type].previousMonth.amount = row.PREVIOUS_MONTH_AMOUNT || 0;

        paymentStats.all.currentMonth.count += row.CURRENT_MONTH_COUNT || 0;
        paymentStats.all.currentMonth.amount += row.CURRENT_MONTH_AMOUNT || 0;
        paymentStats.all.previousMonth.count += row.PREVIOUS_MONTH_COUNT || 0;
        paymentStats.all.previousMonth.amount += row.PREVIOUS_MONTH_AMOUNT || 0;
    });

    // 6. Monthly payment stats for the last 12 months
    const monthlyPaymentsResult = await conn.execute(
      `SELECT 
         TO_CHAR(TRUNC(p.payment_date, 'MM'), 'YYYY-MM') as payment_month,
         SUM(p.amount) as total_amount
       FROM payments p
       JOIN books b ON p.book_id = b.id
       WHERE b.owner_id = :ownerId AND p.payment_date >= ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -11)
       GROUP BY TRUNC(p.payment_date, 'MM')
       ORDER BY payment_month ASC`,
      { ownerId }
    );
    const monthlyPayments = monthlyPaymentsResult.rows;

    // 7. Yearly payment stats
    const yearlyPaymentsResult = await conn.execute(
      `SELECT 
         TO_CHAR(TRUNC(p.payment_date, 'YYYY'), 'YYYY') as payment_year,
         SUM(p.amount) as total_amount
       FROM payments p
       JOIN books b ON p.book_id = b.id
       WHERE b.owner_id = :ownerId
       GROUP BY TRUNC(p.payment_date, 'YYYY')
       ORDER BY payment_year ASC`,
      { ownerId }
    );
    const yearlyPayments = yearlyPaymentsResult.rows;

    // 6. Daily payment stats for the last 7 days
    const dailyPaymentsResult = await conn.execute(
      `SELECT
         TRUNC(p.payment_date) as payment_day,
         SUM(p.amount) as total_amount
       FROM payments p
       JOIN books b ON p.book_id = b.id
       WHERE b.owner_id = :ownerId AND p.payment_date >= TRUNC(SYSDATE) - 6
       GROUP BY TRUNC(p.payment_date)
       ORDER BY payment_day ASC`,
      { ownerId }
    );

    const dailyPayments = dailyPaymentsResult.rows;

    res.json({
      bookCounts: {
        total: bookCounts.TOTAL || 0,
        active: bookCounts.ACTIVE || 0,
        inactive: bookCounts.INACTIVE || 0,
      },
      customerCounts: {
        total: customerCounts.TOTAL || 0,
        fromActiveBooks: customerCounts.FROM_ACTIVE_BOOKS || 0,
        fromInactiveBooks: customerCounts.FROM_INACTIVE_BOOKS || 0,
      },
      eligibilityCounts: {
        eligible: eligibleCount,
        notEligible: notEligibleCount,
      },
      winnerCounts: {
        total: winnerCounts.TOTAL || 0,
        fromActiveBooks: winnerCounts.FROM_ACTIVE_BOOKS || 0,
        fromInactiveBooks: winnerCounts.FROM_INACTIVE_BOOKS || 0,
      },
      paymentStats,
      dailyPayments,
      monthlyPayments,
      yearlyPayments,
    });

  } catch (e) {
    console.error('Dashboard stats error:', e);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
