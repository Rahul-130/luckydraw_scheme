const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const { initSchema, getConnection, oracledb } = require('./db');
const authRoutes = require('./api/auth');
const booksRoutes = require('./api/books');
const customersRoutes = require('./api/customers');
const paymentsRoutes = require('./api/payments');
const luckyDrawRoutes = require('./api/luckyDraw');
const winnersRoutes = require('./api/winners');
const eligibleCustomersRoutes = require('./api/eligibleCustomers');
const backupRoutes = require('./api/backup');

const app = express();
app.use(cors());
app.use(express.json());

initSchema().catch(err => console.error('Schema init failed', err));

// Health and DB checks
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/db-check', async (req, res) => {
  try {
    const conn = await getConnection();
    const r = await conn.execute('SELECT 1 AS ONE FROM dual');
    await conn.close();
    res.json({ status: 'ok', db: r.rows[0] });
  } catch (e) {
    console.error('DB check error:', e);
    res.status(500).json({ status: 'error', details: e.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/lucky-draw', luckyDrawRoutes);
app.use('/api/winners', winnersRoutes);
app.use('/api/eligible-customers', eligibleCustomersRoutes);
app.use('/api/backup', backupRoutes);


const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));