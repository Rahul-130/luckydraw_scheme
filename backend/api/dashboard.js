const express = require('express');
const { getConnection } = require('../db');
const requireAuth = require('../middleware/requireAuth');
const router = express.Router();

router.get('/stats', requireAuth, async (req, res) => {
  const { startDate, endDate } = req.query;
  const conn = await getConnection();
  try {
    const ownerId = req.user.id;
    const dateFilterClause = startDate && endDate ? 'AND p.payment_date >= TO_DATE(:startDate, \'YYYY-MM-DD\') AND p.payment_date < TO_DATE(:endDate, \'YYYY-MM-DD\') + 1' : '';
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
         SUM(CASE WHEN c.is_frozen = 0 AND b.is_active = 1 THEN 1 ELSE 0 END) as active_customers,
         SUM(CASE WHEN c.is_frozen = 1 OR b.is_active = 0 THEN 1 ELSE 0 END) as inactive_customers
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
       FROM winner w -- This table does not have a date filter, so it's intentionally omitted.
       JOIN books b ON w.book_id = b.id
       WHERE b.owner_id = :ownerId`,
      { ownerId }
    );
    const winnerCounts = winnerCountsResult.rows[0];

    // 4. Eligibility Counts (from active books)
    const eligibilityResult = await conn.execute(
      `SELECT
         c.id,
         FLOOR(MONTHS_BETWEEN(TRUNC(CURRENT_TIMESTAMP, 'MM'), TO_DATE(b.START_MONTH_ISO, 'YYYY-MM'))) + 1 AS total_months, -- This is a lifetime calculation
         (SELECT COUNT(*) FROM payments p WHERE p.customer_id = c.id ${dateFilterClause}) as payment_count
       FROM customers c
       JOIN books b ON c.book_id = b.id
       WHERE b.owner_id = :ownerId AND b.is_active = 1 AND c.is_frozen = 0 `,
      { ownerId, ...dateBinds }
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
         -- Current Month
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'MM') THEN 1 ELSE 0 END) as cm_count,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'MM') THEN p.amount ELSE 0 END) as cm_amount,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'MM') AND p.amount_online > 0 THEN 1 ELSE 0 END) as cm_online_count,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'MM') THEN p.amount_online ELSE 0 END) as cm_online_amount,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'MM') AND p.amount_cash > 0 THEN 1 ELSE 0 END) as cm_cash_count,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'MM') THEN p.amount_cash ELSE 0 END) as cm_cash_amount,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'MM') AND p.amount_instore > 0 THEN 1 ELSE 0 END) as cm_instore_count,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'MM') THEN p.amount_instore ELSE 0 END) as cm_instore_amount,

         -- Previous Month
         SUM(CASE WHEN p.payment_date >= ADD_MONTHS(TRUNC(CURRENT_TIMESTAMP, 'MM'), -1) AND p.payment_date < TRUNC(CURRENT_TIMESTAMP, 'MM') THEN 1 ELSE 0 END) as pm_count,
         SUM(CASE WHEN p.payment_date >= ADD_MONTHS(TRUNC(CURRENT_TIMESTAMP, 'MM'), -1) AND p.payment_date < TRUNC(CURRENT_TIMESTAMP, 'MM') THEN p.amount ELSE 0 END) as pm_amount,
         SUM(CASE WHEN p.payment_date >= ADD_MONTHS(TRUNC(CURRENT_TIMESTAMP, 'MM'), -1) AND p.payment_date < TRUNC(CURRENT_TIMESTAMP, 'MM') AND p.amount_online > 0 THEN 1 ELSE 0 END) as pm_online_count,
         SUM(CASE WHEN p.payment_date >= ADD_MONTHS(TRUNC(CURRENT_TIMESTAMP, 'MM'), -1) AND p.payment_date < TRUNC(CURRENT_TIMESTAMP, 'MM') THEN p.amount_online ELSE 0 END) as pm_online_amount,
         SUM(CASE WHEN p.payment_date >= ADD_MONTHS(TRUNC(CURRENT_TIMESTAMP, 'MM'), -1) AND p.payment_date < TRUNC(CURRENT_TIMESTAMP, 'MM') AND p.amount_cash > 0 THEN 1 ELSE 0 END) as pm_cash_count,
         SUM(CASE WHEN p.payment_date >= ADD_MONTHS(TRUNC(CURRENT_TIMESTAMP, 'MM'), -1) AND p.payment_date < TRUNC(CURRENT_TIMESTAMP, 'MM') THEN p.amount_cash ELSE 0 END) as pm_cash_amount,
         SUM(CASE WHEN p.payment_date >= ADD_MONTHS(TRUNC(CURRENT_TIMESTAMP, 'MM'), -1) AND p.payment_date < TRUNC(CURRENT_TIMESTAMP, 'MM') AND p.amount_instore > 0 THEN 1 ELSE 0 END) as pm_instore_count,
         SUM(CASE WHEN p.payment_date >= ADD_MONTHS(TRUNC(CURRENT_TIMESTAMP, 'MM'), -1) AND p.payment_date < TRUNC(CURRENT_TIMESTAMP, 'MM') THEN p.amount_instore ELSE 0 END) as pm_instore_amount
       FROM payments p
       JOIN books b ON p.book_id = b.id 
       WHERE b.owner_id = :ownerId AND p.payment_date >= ADD_MONTHS(TRUNC(CURRENT_TIMESTAMP, 'MM'), -1) ${dateFilterClause}`,
      { ownerId, ...dateBinds }
    );

    const psRow = paymentStatsResult.rows[0] || {};
    const paymentStats = {
        all: { currentMonth: { count: psRow.CM_COUNT || 0, amount: psRow.CM_AMOUNT || 0 }, previousMonth: { count: psRow.PM_COUNT || 0, amount: psRow.PM_AMOUNT || 0 } },
        online: { currentMonth: { count: psRow.CM_ONLINE_COUNT || 0, amount: psRow.CM_ONLINE_AMOUNT || 0 }, previousMonth: { count: psRow.PM_ONLINE_COUNT || 0, amount: psRow.PM_ONLINE_AMOUNT || 0 } },
        cash: { currentMonth: { count: psRow.CM_CASH_COUNT || 0, amount: psRow.CM_CASH_AMOUNT || 0 }, previousMonth: { count: psRow.PM_CASH_COUNT || 0, amount: psRow.PM_CASH_AMOUNT || 0 } },
        instore: { currentMonth: { count: psRow.CM_INSTORE_COUNT || 0, amount: psRow.CM_INSTORE_AMOUNT || 0 }, previousMonth: { count: psRow.PM_INSTORE_COUNT || 0, amount: psRow.PM_INSTORE_AMOUNT || 0 } },
    };

    // 6. Daily Payment Stats (Today vs Yesterday)
    const dailyPaymentStatsResult = await conn.execute(
      `SELECT
         -- Today
         SUM(CASE WHEN TRUNC(p.payment_date) = TRUNC(CURRENT_TIMESTAMP) THEN 1 ELSE 0 END) as today_count,
         SUM(CASE WHEN TRUNC(p.payment_date) = TRUNC(CURRENT_TIMESTAMP) THEN p.amount ELSE 0 END) as today_amount,
         SUM(CASE WHEN TRUNC(p.payment_date) = TRUNC(CURRENT_TIMESTAMP) AND p.amount_online > 0 THEN 1 ELSE 0 END) as today_online_count,
         SUM(CASE WHEN TRUNC(p.payment_date) = TRUNC(CURRENT_TIMESTAMP) THEN p.amount_online ELSE 0 END) as today_online_amount,
         SUM(CASE WHEN TRUNC(p.payment_date) = TRUNC(CURRENT_TIMESTAMP) AND p.amount_cash > 0 THEN 1 ELSE 0 END) as today_cash_count,
         SUM(CASE WHEN TRUNC(p.payment_date) = TRUNC(CURRENT_TIMESTAMP) THEN p.amount_cash ELSE 0 END) as today_cash_amount,
         SUM(CASE WHEN TRUNC(p.payment_date) = TRUNC(CURRENT_TIMESTAMP) AND p.amount_instore > 0 THEN 1 ELSE 0 END) as today_instore_count,
         SUM(CASE WHEN TRUNC(p.payment_date) = TRUNC(CURRENT_TIMESTAMP) THEN p.amount_instore ELSE 0 END) as today_instore_amount,

         -- Yesterday
         SUM(CASE WHEN TRUNC(p.payment_date) = TRUNC(CURRENT_TIMESTAMP) - 1 THEN 1 ELSE 0 END) as yesterday_count,
         SUM(CASE WHEN TRUNC(p.payment_date) = TRUNC(CURRENT_TIMESTAMP) - 1 THEN p.amount ELSE 0 END) as yesterday_amount,
         SUM(CASE WHEN TRUNC(p.payment_date) = TRUNC(CURRENT_TIMESTAMP) - 1 AND p.amount_online > 0 THEN 1 ELSE 0 END) as yesterday_online_count,
         SUM(CASE WHEN TRUNC(p.payment_date) = TRUNC(CURRENT_TIMESTAMP) - 1 THEN p.amount_online ELSE 0 END) as yesterday_online_amount,
         SUM(CASE WHEN TRUNC(p.payment_date) = TRUNC(CURRENT_TIMESTAMP) - 1 AND p.amount_cash > 0 THEN 1 ELSE 0 END) as yesterday_cash_count,
         SUM(CASE WHEN TRUNC(p.payment_date) = TRUNC(CURRENT_TIMESTAMP) - 1 THEN p.amount_cash ELSE 0 END) as yesterday_cash_amount,
         SUM(CASE WHEN TRUNC(p.payment_date) = TRUNC(CURRENT_TIMESTAMP) - 1 AND p.amount_instore > 0 THEN 1 ELSE 0 END) as yesterday_instore_count,
         SUM(CASE WHEN TRUNC(p.payment_date) = TRUNC(CURRENT_TIMESTAMP) - 1 THEN p.amount_instore ELSE 0 END) as yesterday_instore_amount
       FROM payments p 
       JOIN books b ON p.book_id = b.id 
       WHERE b.owner_id = :ownerId AND p.payment_date >= TRUNC(CURRENT_TIMESTAMP) - 1 ${dateFilterClause}`,
      { ownerId, ...dateBinds }
    );

    const dpsRow = dailyPaymentStatsResult.rows[0] || {};
    const dailyPaymentStats = {
      all: { today: { count: dpsRow.TODAY_COUNT || 0, amount: dpsRow.TODAY_AMOUNT || 0 }, yesterday: { count: dpsRow.YESTERDAY_COUNT || 0, amount: dpsRow.YESTERDAY_AMOUNT || 0 } },
      online: { today: { count: dpsRow.TODAY_ONLINE_COUNT || 0, amount: dpsRow.TODAY_ONLINE_AMOUNT || 0 }, yesterday: { count: dpsRow.YESTERDAY_ONLINE_COUNT || 0, amount: dpsRow.YESTERDAY_ONLINE_AMOUNT || 0 } },
      cash: { today: { count: dpsRow.TODAY_CASH_COUNT || 0, amount: dpsRow.TODAY_CASH_AMOUNT || 0 }, yesterday: { count: dpsRow.YESTERDAY_CASH_COUNT || 0, amount: dpsRow.YESTERDAY_CASH_AMOUNT || 0 } },
      instore: { today: { count: dpsRow.TODAY_INSTORE_COUNT || 0, amount: dpsRow.TODAY_INSTORE_AMOUNT || 0 }, yesterday: { count: dpsRow.YESTERDAY_INSTORE_COUNT || 0, amount: dpsRow.YESTERDAY_INSTORE_AMOUNT || 0 } },
    };


    // 7. Weekly Payment Stats (This week vs last week, starting Monday)
    const weeklyPaymentStatsResult = await conn.execute(
      `SELECT
         -- Current Week
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'IW') THEN 1 ELSE 0 END) as current_week_count,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'IW') THEN p.amount ELSE 0 END) as current_week_amount,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'IW') AND p.amount_online > 0 THEN 1 ELSE 0 END) as cw_online_count,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'IW') THEN p.amount_online ELSE 0 END) as cw_online_amount,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'IW') AND p.amount_cash > 0 THEN 1 ELSE 0 END) as cw_cash_count,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'IW') THEN p.amount_cash ELSE 0 END) as cw_cash_amount,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'IW') AND p.amount_instore > 0 THEN 1 ELSE 0 END) as cw_instore_count,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'IW') THEN p.amount_instore ELSE 0 END) as cw_instore_amount,

         -- Previous Week
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'IW') - 7 AND p.payment_date < TRUNC(CURRENT_TIMESTAMP, 'IW') THEN 1 ELSE 0 END) as previous_week_count,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'IW') - 7 AND p.payment_date < TRUNC(CURRENT_TIMESTAMP, 'IW') THEN p.amount ELSE 0 END) as previous_week_amount,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'IW') - 7 AND p.payment_date < TRUNC(CURRENT_TIMESTAMP, 'IW') AND p.amount_online > 0 THEN 1 ELSE 0 END) as pw_online_count,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'IW') - 7 AND p.payment_date < TRUNC(CURRENT_TIMESTAMP, 'IW') THEN p.amount_online ELSE 0 END) as pw_online_amount,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'IW') - 7 AND p.payment_date < TRUNC(CURRENT_TIMESTAMP, 'IW') AND p.amount_cash > 0 THEN 1 ELSE 0 END) as pw_cash_count,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'IW') - 7 AND p.payment_date < TRUNC(CURRENT_TIMESTAMP, 'IW') THEN p.amount_cash ELSE 0 END) as pw_cash_amount,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'IW') - 7 AND p.payment_date < TRUNC(CURRENT_TIMESTAMP, 'IW') AND p.amount_instore > 0 THEN 1 ELSE 0 END) as pw_instore_count,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'IW') - 7 AND p.payment_date < TRUNC(CURRENT_TIMESTAMP, 'IW') THEN p.amount_instore ELSE 0 END) as pw_instore_amount
       FROM payments p 
       JOIN books b ON p.book_id = b.id 
       WHERE b.owner_id = :ownerId AND p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'IW') - 7 ${dateFilterClause}`,
      { ownerId, ...dateBinds }
    );

    const wpsRow = weeklyPaymentStatsResult.rows[0] || {};
    const weeklyPaymentStats = {
      all: { current: { count: wpsRow.CURRENT_WEEK_COUNT || 0, amount: wpsRow.CURRENT_WEEK_AMOUNT || 0 }, previous: { count: wpsRow.PREVIOUS_WEEK_COUNT || 0, amount: wpsRow.PREVIOUS_WEEK_AMOUNT || 0 } },
      online: { current: { count: wpsRow.CW_ONLINE_COUNT || 0, amount: wpsRow.CW_ONLINE_AMOUNT || 0 }, previous: { count: wpsRow.PW_ONLINE_COUNT || 0, amount: wpsRow.PW_ONLINE_AMOUNT || 0 } },
      cash: { current: { count: wpsRow.CW_CASH_COUNT || 0, amount: wpsRow.CW_CASH_AMOUNT || 0 }, previous: { count: wpsRow.PW_CASH_COUNT || 0, amount: wpsRow.PW_CASH_AMOUNT || 0 } },
      instore: { current: { count: wpsRow.CW_INSTORE_COUNT || 0, amount: wpsRow.CW_INSTORE_AMOUNT || 0 }, previous: { count: wpsRow.PW_INSTORE_COUNT || 0, amount: wpsRow.PW_INSTORE_AMOUNT || 0 } },
    };

    // 8. Yearly Overview Stats (This year vs last year)
    const yearlyOverviewStatsResult = await conn.execute(
      `SELECT
         -- Current Year
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'YYYY') THEN 1 ELSE 0 END) as current_year_count,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'YYYY') THEN p.amount ELSE 0 END) as current_year_amount,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'YYYY') AND p.amount_online > 0 THEN 1 ELSE 0 END) as cy_online_count,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'YYYY') THEN p.amount_online ELSE 0 END) as cy_online_amount,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'YYYY') AND p.amount_cash > 0 THEN 1 ELSE 0 END) as cy_cash_count,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'YYYY') THEN p.amount_cash ELSE 0 END) as cy_cash_amount,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'YYYY') AND p.amount_instore > 0 THEN 1 ELSE 0 END) as cy_instore_count,
         SUM(CASE WHEN p.payment_date >= TRUNC(CURRENT_TIMESTAMP, 'YYYY') THEN p.amount_instore ELSE 0 END) as cy_instore_amount,

         -- Previous Year
         SUM(CASE WHEN p.payment_date >= ADD_MONTHS(TRUNC(CURRENT_TIMESTAMP, 'YYYY'), -12) AND p.payment_date < TRUNC(CURRENT_TIMESTAMP, 'YYYY') THEN 1 ELSE 0 END) as previous_year_count,
         SUM(CASE WHEN p.payment_date >= ADD_MONTHS(TRUNC(CURRENT_TIMESTAMP, 'YYYY'), -12) AND p.payment_date < TRUNC(CURRENT_TIMESTAMP, 'YYYY') THEN p.amount ELSE 0 END) as previous_year_amount,
         SUM(CASE WHEN p.payment_date >= ADD_MONTHS(TRUNC(CURRENT_TIMESTAMP, 'YYYY'), -12) AND p.payment_date < TRUNC(CURRENT_TIMESTAMP, 'YYYY') AND p.amount_online > 0 THEN 1 ELSE 0 END) as py_online_count,
         SUM(CASE WHEN p.payment_date >= ADD_MONTHS(TRUNC(CURRENT_TIMESTAMP, 'YYYY'), -12) AND p.payment_date < TRUNC(CURRENT_TIMESTAMP, 'YYYY') THEN p.amount_online ELSE 0 END) as py_online_amount,
         SUM(CASE WHEN p.payment_date >= ADD_MONTHS(TRUNC(CURRENT_TIMESTAMP, 'YYYY'), -12) AND p.payment_date < TRUNC(CURRENT_TIMESTAMP, 'YYYY') AND p.amount_cash > 0 THEN 1 ELSE 0 END) as py_cash_count,
         SUM(CASE WHEN p.payment_date >= ADD_MONTHS(TRUNC(CURRENT_TIMESTAMP, 'YYYY'), -12) AND p.payment_date < TRUNC(CURRENT_TIMESTAMP, 'YYYY') THEN p.amount_cash ELSE 0 END) as py_cash_amount,
         SUM(CASE WHEN p.payment_date >= ADD_MONTHS(TRUNC(CURRENT_TIMESTAMP, 'YYYY'), -12) AND p.payment_date < TRUNC(CURRENT_TIMESTAMP, 'YYYY') AND p.amount_instore > 0 THEN 1 ELSE 0 END) as py_instore_count,
         SUM(CASE WHEN p.payment_date >= ADD_MONTHS(TRUNC(CURRENT_TIMESTAMP, 'YYYY'), -12) AND p.payment_date < TRUNC(CURRENT_TIMESTAMP, 'YYYY') THEN p.amount_instore ELSE 0 END) as py_instore_amount
       FROM payments p 
       JOIN books b ON p.book_id = b.id 
       WHERE b.owner_id = :ownerId AND p.payment_date >= ADD_MONTHS(TRUNC(CURRENT_TIMESTAMP, 'YYYY'), -12) ${dateFilterClause}`,
      { ownerId, ...dateBinds }
    );

    const yosRow = yearlyOverviewStatsResult.rows[0] || {};
    const yearlyOverviewStats = {
      all: { current: { count: yosRow.CURRENT_YEAR_COUNT || 0, amount: yosRow.CURRENT_YEAR_AMOUNT || 0 }, previous: { count: yosRow.PREVIOUS_YEAR_COUNT || 0, amount: yosRow.PREVIOUS_YEAR_AMOUNT || 0 } },
      online: { current: { count: yosRow.CY_ONLINE_COUNT || 0, amount: yosRow.CY_ONLINE_AMOUNT || 0 }, previous: { count: yosRow.PY_ONLINE_COUNT || 0, amount: yosRow.PY_ONLINE_AMOUNT || 0 } },
      cash: { current: { count: yosRow.CY_CASH_COUNT || 0, amount: yosRow.CY_CASH_AMOUNT || 0 }, previous: { count: yosRow.PY_CASH_COUNT || 0, amount: yosRow.PY_CASH_AMOUNT || 0 } },
      instore: { current: { count: yosRow.CY_INSTORE_COUNT || 0, amount: yosRow.CY_INSTORE_AMOUNT || 0 }, previous: { count: yosRow.PY_INSTORE_COUNT || 0, amount: yosRow.PY_INSTORE_AMOUNT || 0 } },
    };


    // 7. Monthly payment stats for the last 12 months
    const monthlyPaymentsResult = await conn.execute(
      `SELECT 
         TO_CHAR(TRUNC(p.payment_date, 'MM'), 'YYYY-MM') as payment_month,
         SUM(p.amount) as total_amount,
         SUM(p.amount_cash) as amount_cash,
         SUM(p.amount_online) as amount_online,
         SUM(p.amount_instore) as amount_instore,
         COUNT(*) as payment_count
       FROM payments p
       JOIN books b ON p.book_id = b.id 
       WHERE b.owner_id = :ownerId AND p.payment_date >= ADD_MONTHS(TRUNC(CURRENT_TIMESTAMP, 'MM'), -11) ${dateFilterClause}
       GROUP BY TRUNC(p.payment_date, 'MM'), b.owner_id
       ORDER BY payment_month ASC`,
      { ownerId, ...dateBinds }
    );
    const monthlyPayments = monthlyPaymentsResult.rows;

    // 8. Yearly payment stats
    const yearlyPaymentsResult = await conn.execute(
      `SELECT 
         TO_CHAR(TRUNC(p.payment_date, 'YYYY'), 'YYYY') as payment_year,
         SUM(p.amount) as total_amount,
         SUM(p.amount_cash) as amount_cash,
         SUM(p.amount_online) as amount_online,
         SUM(p.amount_instore) as amount_instore,
         COUNT(*) as payment_count
       FROM payments p
       JOIN books b ON p.book_id = b.id 
       WHERE b.owner_id = :ownerId ${dateFilterClause}
       GROUP BY TRUNC(p.payment_date, 'YYYY'), b.owner_id
       ORDER BY payment_year ASC`,
      { ownerId, ...dateBinds }
    );
    const yearlyPayments = yearlyPaymentsResult.rows;

    // 9. Daily payment stats for the last 7 days
    const dailyPaymentsResult = await conn.execute(
      `SELECT
         TO_CHAR(TRUNC(p.payment_date), 'YYYY-MM-DD') as payment_day,
         SUM(p.amount) as total_amount,
         SUM(p.amount_cash) as amount_cash,
         SUM(p.amount_online) as amount_online,
         SUM(p.amount_instore) as amount_instore,
         COUNT(*) as payment_count
       FROM payments p
       JOIN books b ON p.book_id = b.id 
       WHERE b.owner_id = :ownerId AND p.payment_date >= TRUNC(CURRENT_TIMESTAMP) - 6 ${dateFilterClause}
       GROUP BY TO_CHAR(TRUNC(p.payment_date), 'YYYY-MM-DD'), b.owner_id
       ORDER BY payment_day ASC`,
      { ownerId, ...dateBinds }
    );

    const dailyPayments = dailyPaymentsResult.rows;

    // 10. Customer growth trend
    const customerGrowthResult = await conn.execute(
      `SELECT
         TO_CHAR(TRUNC(c.created_at, 'MM'), 'YYYY-MM') as creation_month,
         COUNT(c.id) as new_customers
       FROM customers c
       JOIN books b ON c.book_id = b.id
       WHERE b.owner_id = :ownerId AND c.created_at >= ADD_MONTHS(TRUNC(CURRENT_TIMESTAMP, 'MM'), -11)
       GROUP BY TRUNC(c.created_at, 'MM')
       ORDER BY creation_month ASC`,
      { ownerId }
    );
    const customerGrowth = customerGrowthResult.rows;

    // 11. Wins per book (for active books)
    const winsPerBookResult = await conn.execute(
      `SELECT b.name as book_name, COUNT(w.id) as win_count 
       FROM winner w 
       JOIN books b ON w.book_id = b.id 
       WHERE b.owner_id = :ownerId AND b.is_active = 1
       GROUP BY b.name ORDER BY win_count DESC`, { ownerId }
    );

    res.json({
      bookCounts: {
        total: bookCounts.TOTAL || 0,
        active: bookCounts.ACTIVE || 0,
        inactive: bookCounts.INACTIVE || 0,
      },
      customerCounts: {
        total: customerCounts.TOTAL || 0,
        active: customerCounts.ACTIVE_CUSTOMERS || 0,
        inactive: customerCounts.INACTIVE_CUSTOMERS || 0,
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
      dailyPaymentStats,
      weeklyPaymentStats,
      yearlyOverviewStats,
      dailyPayments,
      monthlyPayments,
      yearlyPayments,
      customerGrowth,
      winsPerBook: winsPerBookResult.rows,
    });

  } catch (e) {
    console.error('Dashboard stats error:', e);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (conn) await conn.close();
  }
});

router.get('/activity', requireAuth, async (req, res) => {
  const page = Number.parseInt(req.query.page, 10) || 1;
  const pageSize = Number.parseInt(req.query.pageSize, 10) || 10;
  const offset = (page - 1) * pageSize;
  const ownerId = req.user.id;

  const conn = await getConnection();
  try {
    const activityQuery = `
      SELECT CUSTOMER_NAME, BOOK_NAME, activity_date, activity_type, amount FROM (
        SELECT w.CUSTOMER_NAME, w.BOOK_NAME, w.WIN_DATE as activity_date, 'winner' as activity_type, NULL as amount
        FROM winner w
        JOIN books b ON w.BOOK_ID = b.ID
        WHERE b.OWNER_ID = :ownerId
        UNION ALL
        SELECT c.NAME as customer_name, b.NAME as book_name, p.PAYMENT_DATE as activity_date, 'payment' as activity_type, p.AMOUNT as amount
        FROM payments p
        JOIN customers c ON p.customer_id = c.id
        JOIN books b ON p.book_id = b.id
        WHERE b.owner_id = :ownerId
      )
      ORDER BY activity_date DESC
      OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY
    `;

    const totalQuery = `
      SELECT COUNT(*) as TOTAL FROM (
        SELECT 1 FROM winner w JOIN books b ON w.BOOK_ID = b.ID WHERE b.OWNER_ID = :ownerId
        UNION ALL
        SELECT 1 FROM payments p JOIN books b ON p.book_id = b.id WHERE b.owner_id = :ownerId
      )
    `;

    const [activityResult, totalResult] = await Promise.all([
      conn.execute(activityQuery, { ownerId, offset, pageSize }),
      conn.execute(totalQuery, { ownerId })
    ]);

    const total = totalResult.rows[0].TOTAL;

    res.json({
      activities: activityResult.rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (e) {
    console.error('Recent activity error:', e);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
