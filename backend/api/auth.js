const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection, oracledb } = require('../db');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const requireAuth = require('../middleware/requireAuth');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const APP_NAME = 'LuckyDrawApp';

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
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '1d' });
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
    const r = await conn.execute(`SELECT id, name, phone, email, password_hash, is_2fa_enabled FROM users WHERE LOWER(email)=:e`, { e: String(email).toLowerCase() });
    if (!r.rows.length) return res.status(401).json({ message: 'Invalid credentials' });
    const row = r.rows[0];
    const ok = await bcrypt.compare(String(password), row.PASSWORD_HASH);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: String(row.ID), email: row.EMAIL }, JWT_SECRET, { expiresIn: '1d' });
    const user = { id: String(row.ID), name: row.NAME, phone: row.PHONE, email: row.EMAIL, is2FAEnabled: row.IS_2FA_ENABLED === 1 };

    res.json({ token, user });
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
    if (!r.rows.length) return res.status(401).json({ message: 'User not found' });
    const row = r.rows[0];
    const ok = await bcrypt.compare(String(oldPassword), row.PASSWORD_HASH);
    if (!ok) return res.status(401).json({ message: 'Invalid old password' });
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


// --- 2FA Endpoints ---

router.post('/2fa/generate', requireAuth, async (req, res) => {
  const conn = await getConnection();
  try {
    const secret = speakeasy.generateSecret({
      name: `${APP_NAME} (${req.user.email})`,
    });

    await conn.execute(
      `UPDATE users SET two_fa_secret = :secret WHERE id = :id`,
      { secret: secret.base32, id: req.user.id }
    );
    await conn.commit();

    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) {
        console.error('QR Code generation error:', err);
        return res.status(500).json({ message: 'Could not generate QR code' });
      }
      res.json({ qrCodeDataUrl: data_url });
    });
  } catch (e) {
    console.error('2FA generate error:', e);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await conn.close();
  }
});

router.post('/2fa/enable', requireAuth, async (req, res) => {
  const { otp } = req.body;
  if (!otp) return res.status(400).json({ message: 'OTP is required' });

  const conn = await getConnection();
  try {
    const result = await conn.execute(`SELECT * FROM users WHERE id = :id`, { id: req.user.id });
    if (!result.rows.length || !result.rows[0].TWO_FA_SECRET) {
      return res.status(400).json({ message: '2FA secret not found. Please generate a QR code first.' });
    }
    const userRow = result.rows[0];

    const verified = speakeasy.totp.verify({
      secret: userRow.TWO_FA_SECRET,
      encoding: 'base32',
      token: otp,
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    await conn.execute(`UPDATE users SET is_2fa_enabled = 1 WHERE id = :id`, { id: req.user.id });
    await conn.commit();

    const user = { id: String(userRow.ID), name: userRow.NAME, phone: userRow.PHONE, email: userRow.EMAIL, is2FAEnabled: true };
    res.json({ message: '2FA enabled successfully', user });
  } catch (e) {
    console.error('2FA enable error:', e);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await conn.close();
  }
});

/**
 * Verifies a user's OTP.
 * @param {string} username The user's email.
 * @param {string} otp The one-time password.
 * @returns {Promise<{userRow: object}|{error: string, status: number}>}
 */
async function verifyUserOtp(username, otp) {
  if (!username || !otp) {
    return { error: 'Username and OTP are required', status: 400 };
  }
  const conn = await getConnection();
  try {
    const result = await conn.execute(`SELECT * FROM users WHERE LOWER(email) = :email`, { email: String(username).toLowerCase() });
    if (!result.rows.length) {
      return { error: 'Invalid credentials', status: 401 };
    }
    const userRow = result.rows[0];
    if (userRow.IS_2FA_ENABLED !== 1 || !userRow.TWO_FA_SECRET) {
      return { error: '2FA is not enabled for this account', status: 400 };
    }
    const verified = speakeasy.totp.verify({
      secret: userRow.TWO_FA_SECRET,
      encoding: 'base32',
      token: otp,
    });
    if (!verified) {
      return { error: 'Invalid OTP', status: 401 };
    }
    return { userRow };
  } finally {
    await conn.close();
  }
}

router.post('/login-otp', async (req, res) => {
  const { username, otp } = req.body;
  try {
    const { userRow, error, status } = await verifyUserOtp(username, otp);
    if (error) {
      return res.status(status).json({ message: error });
    }
    const token = jwt.sign({ id: String(userRow.ID), email: userRow.EMAIL }, JWT_SECRET, { expiresIn: '1d' });
    const user = { id: String(userRow.ID), name: userRow.NAME, phone: userRow.PHONE, email: userRow.EMAIL, is2FAEnabled: true };
    res.json({ token, user });
  } catch (e) {
    console.error('Login with OTP error:', e);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- Password Reset with 2FA ---

router.post('/reset-password/request', async (req, res) => {
  const { username } = req.body;
  const conn = await getConnection();
  try {
    const result = await conn.execute(`SELECT is_2fa_enabled FROM users WHERE LOWER(email) = :email`, { email: String(username).toLowerCase() });
    if (!result.rows.length || result.rows[0].IS_2FA_ENABLED !== 1) {
      return res.status(400).json({ message: 'User not found or 2FA is not enabled for this account.' });
    }
    res.json({ message: 'User verified. Please provide OTP to reset password.' });
  } finally {
    await conn.close();
  }
});

router.post('/reset-password/complete', async (req, res) => {
  const { username, otp, newPassword } = req.body;
  if (!newPassword) {
    return res.status(400).json({ message: 'New password is required.' });
  }

  const { error, status } = await verifyUserOtp(username, otp);
  if (error) {
    return res.status(status).json({ message: error });
  }

  const conn = await getConnection();
  try {
    const hash = await bcrypt.hash(String(newPassword), 10);
    await conn.execute(`UPDATE users SET password_hash = :hash WHERE LOWER(email) = :email`, { hash, email: String(username).toLowerCase() });
    await conn.commit();
    res.json({ message: 'Password reset successfully.' });
  } catch (e) {
    console.error('Password reset complete error:', e);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await conn.close();
  }
});

module.exports = router;