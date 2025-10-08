const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection, oracledb } = require('../db');
const requireAuth = require('../middleware/requireAuth');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Auth
router.post('/signup', async (req, res) => {
  const { name, phone, email, password } = req.body || {};
  if (!email || !password || !name || !phone) return res.status(400).json({ error: 'name, phone, email and password required' });
  const conn = await getConnection();
  try {
    const lower = String(email).toLowerCase();
    const check = await conn.execute(`SELECT id FROM users WHERE LOWER(email)=:e`, { e: lower });
    if (check.rows.length) return res.status(409).json({ error: 'email already exists' });
    const hash = await bcrypt.hash(String(password), 10);
    const result = await conn.execute(
      `INSERT INTO users (name, phone, email, password_hash) VALUES (:name, :phone, :email, :hash) RETURNING id INTO :id`,
      { name, phone, email, hash, id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } }
    );
    await conn.commit();
    const userId = String(result.outBinds.id[0]);
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: userId, name, phone, email } });
  } catch (e) {
    console.error('Signup error:', e);
    res.status(500).json({ error: 'internal error', details: e.message });
  } finally { await conn.close(); }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const conn = await getConnection();
  try {
    const r = await conn.execute(`SELECT id, email, password_hash FROM users WHERE LOWER(email)=:e`, { e: String(email).toLowerCase() });
    if (!r.rows.length) return res.status(401).json({ error: 'invalid credentials' });
    const row = r.rows[0];
    const ok = await bcrypt.compare(String(password), row.PASSWORD_HASH);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = jwt.sign({ id: String(row.ID), email: row.EMAIL }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: String(row.ID), email: row.EMAIL } });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'internal error', details: e.message });
  } finally { await conn.close(); }
});

// Password change - if same password, return error
router.post('/change-password', requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) return res.status(400).json({ error: 'oldPassword and newPassword required' });
  const conn = await getConnection();
  try {
    const r = await conn.execute(`SELECT id, password_hash FROM users WHERE id=:id`, { id: Number(req.user.id) });
    if (!r.rows.length) return res.status(401).json({ error: 'invalid credentials' });
    const row = r.rows[0];
    const ok = await bcrypt.compare(String(oldPassword), row.PASSWORD_HASH);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    if (oldPassword === newPassword) return res.status(400).json({ error: 'oldPassword and newPassword cannot be the same' });
    const hash = await bcrypt.hash(String(newPassword), 10);
    await conn.execute(`UPDATE users SET password_hash=:hash WHERE id=:id`, { hash: hash, id: Number(req.user.id) });
    await conn.commit();
    res.json({ message: 'password changed successfully' });
  } catch (e) { console.error('Change password error:', e); res.status(500).json({ error: 'internal error' }); }
  finally { await conn.close(); }
});

// logout - to logout the user and clear the token
router.post('/logout', requireAuth, async (req, res) => {
  res.clearCookie('token');
  res.clearCookie('user');
  res.json({ message: 'logged out successfully' });
});

module.exports = router;