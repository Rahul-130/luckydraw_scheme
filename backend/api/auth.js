const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
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
      `INSERT INTO users (name, phone, email, password_hash, user_role, user_parent_id) VALUES (:name, :phone, :email, :hash, 'admin', NULL) RETURNING id INTO :id`,
      { name, phone, email, hash, id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } } // role and parent_id are implicitly handled by default values
    );
    await conn.commit();
    const userId = String(result.outBinds.id[0]);
    const token = jwt.sign({ id: userId, email, name, userRole: 'admin', userParentId: null }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: userId, name, phone, email, userRole: 'admin', userParentId: null } });
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
    const r = await conn.execute(
      `SELECT 
         id, name, phone, email, password_hash, is_2fa_enabled, user_role, user_parent_id,
         company_name, company_address, company_cell, company_phone
       FROM users WHERE LOWER(email)=:e`,
      { e: String(email).toLowerCase() }
    );
    if (!r.rows.length) return res.status(401).json({ message: 'Invalid credentials' });
    const row = r.rows[0];
    const userParentId = row.USER_PARENT_ID ? String(row.USER_PARENT_ID) : null;
    const ok = await bcrypt.compare(String(password), row.PASSWORD_HASH);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    let companyDataRow = row;
    // Inherit company details from admin if user is an agent
    if (row.USER_ROLE === 'agent' && userParentId) {
      const parentRes = await conn.execute(
        `SELECT company_name, company_address, company_cell, company_phone FROM users WHERE id = :pid`,
        { pid: Number(userParentId) }
      );
      if (parentRes.rows.length) {
        companyDataRow = { ...row, ...parentRes.rows[0] };
      }
    }

    const token = jwt.sign({ id: String(row.ID), email: row.EMAIL, name: row.NAME || row.EMAIL, userRole: row.USER_ROLE, userParentId: userParentId }, JWT_SECRET, { expiresIn: '1d' });
    const user = {
      id: String(row.ID),
      name: row.NAME || row.EMAIL,
      phone: row.PHONE,
      email: row.EMAIL,
      is2FAEnabled: row.IS_2FA_ENABLED === 1,
      userRole: row.USER_ROLE,
      userParentId: userParentId,
      ...getCompanyData(companyDataRow)
    };

    res.json({ token, user });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'internal error', details: e.message });
  } finally { await conn.close(); }
});

// Get current user from token
router.get('/me', requireAuth, async (req, res) => {
  const conn = await getConnection();
  try {
    const r = await conn.execute(
      `SELECT 
         id, name, phone, email, is_2fa_enabled, user_role, user_parent_id,
         company_name, company_address, company_cell, company_phone
       FROM users WHERE id=:id`,
      { id: Number(req.user.id) }
    );
    if (!r.rows.length) return res.status(404).json({ message: 'User not found' });
    const row = r.rows[0];
    const userParentId = row.USER_PARENT_ID ? String(row.USER_PARENT_ID) : null;

    let companyDataRow = row;
    // Inherit company details from admin if user is an agent
    if (row.USER_ROLE === 'agent' && userParentId) {
      const parentRes = await conn.execute(
        `SELECT company_name, company_address, company_cell, company_phone FROM users WHERE id = :pid`,
        { pid: Number(userParentId) }
      );
      if (parentRes.rows.length) {
        companyDataRow = { ...row, ...parentRes.rows[0] };
      }
    }

    const user = {
      id: String(row.ID),
      name: row.NAME || row.EMAIL,
      phone: row.PHONE,
      email: row.EMAIL,
      is2FAEnabled: row.IS_2FA_ENABLED === 1,
      userRole: row.USER_ROLE,
      userParentId: userParentId,
      ...getCompanyData(companyDataRow)
    };
    res.json({ user });
  } catch (e) { console.error('Get me error:', e); res.status(500).json({ error: 'internal error' }); }
  finally { await conn.close(); }
});

router.post('/verify-password', requireAuth, async (req, res) => {
  const { password, otp } = req.body;
  if (!password && !otp) return res.status(400).json({ message: 'Password or OTP/Recovery Code is required for verification.' });

  const conn = await getConnection();
  try {
    const result = await conn.execute(`SELECT * FROM users WHERE id = :id`, { id: req.user.id });
    const userRow = result.rows[0];

    if (password) {
      const isPasswordValid = await bcrypt.compare(String(password), userRow.PASSWORD_HASH);
      if (!isPasswordValid) return res.status(401).json({ message: 'Invalid password.' });
    }

    if (otp) {
      const { error } = await verifyUserOtp(conn, userRow.EMAIL, otp);
      if (error) return res.status(401).json({ message: error || 'Invalid OTP.' });
    }

    res.json({ message: 'Verification successful.' });
  } catch (e) { console.error('Verification error:', e); res.status(500).json({ message: 'Internal server error' }); }
  finally { await conn.close(); }
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

/** Helper to extract company data from a user row */
function getCompanyData(row) {
  return {
    company_name: row.COMPANY_NAME || '',
    company_address: row.COMPANY_ADDRESS || '',
    // Corrected property names based on schema:
    // company_cell: row.COMPANY_CELL || '',
    company_cell: row.COMPANY_CELL || '',
    company_phone: row.COMPANY_PHONE || ''
  };
}


// --- 2FA Endpoints ---

router.post('/2fa/generate', requireAuth, async (req, res) => {
  const conn = await getConnection(); // No change needed here, it uses req.user.id
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

/**
 * Generates a set of single-use recovery codes.
 * @returns {{plain: string[], hashed: Promise<string[]>}}
 */
function generateRecoveryCodes() {
  const plain = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex').toUpperCase());
  const hashed = Promise.all(plain.map(code => bcrypt.hash(code, 10)));
  return { plain, hashed };
}


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

    const { plain: plainCodes, hashed: hashedCodes } = generateRecoveryCodes();
    const hashedCodesJson = JSON.stringify(await hashedCodes);

    await conn.execute(
      `UPDATE users SET is_2fa_enabled = 1, two_fa_recovery_codes = :codes WHERE id = :id`,
      { codes: hashedCodesJson, id: req.user.id }
    );
    await conn.commit();

    const user = { id: String(userRow.ID), name: userRow.NAME, phone: userRow.PHONE, email: userRow.EMAIL, is2FAEnabled: true };
    res.json({ message: '2FA enabled successfully', user, recoveryCodes: plainCodes });
  } catch (e) {
    console.error('2FA enable error:', e);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await conn.close();
  }
});

router.post('/2fa/disable', requireAuth, async (req, res) => {
  const { password, otp } = req.body;
  if (!password && !otp) return res.status(400).json({ message: 'Password or OTP/Recovery Code is required to disable 2FA.' });

  const conn = await getConnection();
  try {
    const result = await conn.execute(`SELECT * FROM users WHERE id = :id`, { id: req.user.id });
    const userRow = result.rows[0];

    let isAuthorized = false;
    if (password) {
      isAuthorized = await bcrypt.compare(String(password), userRow.PASSWORD_HASH);
    } else if (otp) {
      // Pass the existing connection to verifyUserOtp
      const { userRow: verifiedUser } = await verifyUserOtp(conn, userRow.EMAIL, otp);
      if (verifiedUser) isAuthorized = true;
    }
    if (!isAuthorized) return res.status(401).json({ message: 'Invalid credentials provided.' });
    await conn.execute(`UPDATE users SET is_2fa_enabled = 0, two_fa_secret = NULL, two_fa_recovery_codes = NULL WHERE id = :id`, { id: req.user.id });
    await conn.commit();

    const user = { id: String(userRow.ID), name: userRow.NAME, phone: userRow.PHONE, email: userRow.EMAIL, is2FAEnabled: false };
    res.json({ message: '2FA disabled successfully.', user });
  } catch (e) {
    console.error('2FA disable error:', e); // Ensure error message is consistent
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await conn.close();
  }
});

router.post('/2fa/regenerate-codes', requireAuth, async (req, res) => {
  const conn = await getConnection();
  try {
    const { plain: plainCodes, hashed: hashedCodes } = generateRecoveryCodes();
    const hashedCodesJson = JSON.stringify(await hashedCodes);

    await conn.execute(`UPDATE users SET two_fa_recovery_codes = :codes WHERE id = :id`, { codes: hashedCodesJson, id: req.user.id });
    await conn.commit();

    res.json({ message: 'New recovery codes generated.', recoveryCodes: plainCodes });
  } catch (e) {
    console.error('2FA regenerate codes error:', e);
    res.status(500).json({ message: 'Internal server error' });
  } finally { await conn.close(); }
});

/**
 * Verifies a user's OTP.
 * @param {string} username The user's email.
 * @param {string} otp The one-time password.
 * @returns {Promise<{userRow: object}|{error: string, status: number}>}
 */
 async function verifyUserOtp(conn, username, otp) {
   if (!username || !otp) {
     return { error: 'Username and OTP are required', status: 400 };
   }
 
   try {
     const result = await conn.execute(`SELECT id, name, phone, email, password_hash, is_2fa_enabled, two_fa_secret, two_fa_recovery_codes, user_role, user_parent_id FROM users WHERE LOWER(email) = :email`, { email: String(username).toLowerCase() });
     if (!result.rows.length) {
       return { error: 'Invalid credentials', status: 401 };
     }
     const userRow = result.rows[0];
     if (userRow.IS_2FA_ENABLED !== 1) {
       return { error: '2FA is not enabled for this account', status: 400 };
     }
 
     // Try OTP first
     if (userRow.TWO_FA_SECRET) {
       const verified = speakeasy.totp.verify({ secret: userRow.TWO_FA_SECRET, encoding: 'base32', token: otp });
       if (verified) return { userRow };
     }
 
     // If OTP fails, try recovery codes
     const recoveryCodesRaw = userRow.TWO_FA_RECOVERY_CODES;
     const storedCodes = typeof recoveryCodesRaw === 'string'
        ? JSON.parse(recoveryCodesRaw || '[]')
        : (recoveryCodesRaw || []);
     let validCodeFound = false;
     const updatedCodes = [];
 
     for (const hashedCode of storedCodes) {
       const match = await bcrypt.compare(otp, hashedCode);
       if (match && !validCodeFound) {
         validCodeFound = true; // Mark as used, but don't add back to the list
       } else {
         updatedCodes.push(hashedCode);
       }
     }
 
     if (!validCodeFound) return { error: 'Invalid OTP or Recovery Code', status: 401 };
 
     await conn.execute(`UPDATE users SET two_fa_recovery_codes = :codes WHERE id = :id`, { codes: JSON.stringify(updatedCodes), id: userRow.ID });
     // The calling function will commit, but for standalone calls like login, we need to commit here.
     await conn.commit();
     return { userRow };
   } catch (e) {
     console.error("Error in verifyUserOtp:", e);
     return { error: 'An internal error occurred during OTP verification.', status: 500 };
   }
 }

router.post('/login-otp', async (req, res) => {
  const { username, otp } = req.body;
  const conn = await getConnection();
  try {
    const { userRow, error, status } = await verifyUserOtp(conn, username, otp);
    if (error) {
      await conn.close();
      return res.status(status).json({ message: error });
    }
    const userParentId = userRow.USER_PARENT_ID ? String(userRow.USER_PARENT_ID) : null;

    let companyDataRow = userRow;
    // Inherit company details from admin if user is an agent
    if (userRow.USER_ROLE === 'agent' && userParentId) {
      const parentRes = await conn.execute(
        `SELECT company_name, company_address, company_cell, company_phone FROM users WHERE id = :pid`,
        { pid: Number(userParentId) }
      );
      if (parentRes.rows.length) {
        companyDataRow = { ...userRow, ...parentRes.rows[0] };
      }
    }

    const displayName = userRow.NAME || userRow.EMAIL;
    const token = jwt.sign(
      { id: String(userRow.ID), email: userRow.EMAIL, name: displayName, userRole: userRow.USER_ROLE, userParentId: userParentId },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    const user = { // Update JWT payload and user object
      id: String(userRow.ID),
      name: displayName,
      phone: userRow.PHONE,
      email: userRow.EMAIL,
      is2FAEnabled: true,
      userRole: userRow.USER_ROLE, userParentId: userParentId, ...getCompanyData(companyDataRow) };
    res.json({ token, user });
  } catch (e) {
    console.error('Login with OTP error:', e);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    if (conn) await conn.close();
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

  const conn = await getConnection();
  try {
    const { userRow, error, status } = await verifyUserOtp(conn, username, otp);
    if (error) {
      await conn.close();
      return res.status(status).json({ message: error });
    }
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

// --- Agent Management (Admin Only) ---

// Middleware to check if the user is an admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.userRole === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

// Create a new agent (Admin Only)
router.post('/agents', requireAuth, requireAdmin,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, email, password } = req.body;
    const adminId = req.user.id; // The admin creating the agent
    const conn = await getConnection();

    try {
      const lowerEmail = String(email).toLowerCase();
      const check = await conn.execute(`SELECT id FROM users WHERE LOWER(email)=:e`, { e: lowerEmail });
      if (check.rows.length) {
        return res.status(409).json({ error: 'Email already exists' });
      }

      const hash = await bcrypt.hash(String(password), 10);
      const result = await conn.execute(
        `INSERT INTO users (name, phone, email, password_hash, user_role, user_parent_id) VALUES (:name, :phone, :email, :hash, 'agent', :userParentId) RETURNING id INTO :id`,
        { name, phone, email, hash, userParentId: Number(adminId), id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } }
      );
      await conn.commit();

      const agentId = String(result.outBinds.id[0]);
      res.status(201).json({
        id: agentId,
        name,
        phone,
        email,
        userRole: 'agent',
        userParentId: adminId,
        message: 'Agent created successfully'
      });
    } catch (e) {
      console.error('Create agent error:', e);
      res.status(500).json({ error: 'Internal server error', details: e.message });
    } finally {
      await conn.close();
    }
  }
);

// Reset an agent's password (Admin Only)
router.patch('/agents/:agentId/reset-password', requireAuth, requireAdmin, async (req, res) => {
  const { agentId } = req.params;
  const { password } = req.body;
  const adminId = req.user.id;

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  const conn = await getConnection();
  try {
    const aid = Number(agentId);
    const aidAdmin = Number(adminId);

    if (isNaN(aid) || isNaN(aidAdmin)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const hash = await bcrypt.hash(String(password), 10);
    const result = await conn.execute(
      `UPDATE users 
       SET password_hash = :hash
       WHERE id = :agentId AND user_parent_id = :adminId AND user_role = 'agent'`,
      { 
        hash: hash, 
        agentId: aid, 
        adminId: aidAdmin 
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Agent not found or not associated with this admin' });
    }
    res.json({ message: 'Agent password reset successfully' });
  } catch (e) {
    console.error('Reset agent password error:', e);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await conn.close();
  }
});

// List agents for the current admin (Admin Only)
router.get('/agents', requireAuth, requireAdmin, async (req, res) => {
  const adminId = req.user.id;
  const conn = await getConnection();
  try {
    const result = await conn.execute( // Update column names
      `SELECT id, name, phone, email, is_2fa_enabled FROM users WHERE user_parent_id = :adminId AND user_role = 'agent' ORDER BY name`,
      { adminId: Number(adminId) }
    );
    const agents = result.rows.map(row => ({
      id: String(row.ID),
      name: row.NAME,
      phone: row.PHONE,
      email: row.EMAIL,
      is2FAEnabled: row.IS_2FA_ENABLED === 1,
      userRole: 'agent',
      userParentId: adminId,
    }));
    res.json(agents);
  } catch (e) {
    console.error('List agents error:', e);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await conn.close();
  }
});

// Delete an agent (Admin Only)
router.delete('/agents/:agentId', requireAuth, requireAdmin, async (req, res) => {
  const { agentId } = req.params;
  const adminId = req.user.id;
  const conn = await getConnection();
  try { // Update column names
    const result = await conn.execute(`DELETE FROM users WHERE id = :agentId AND user_parent_id = :adminId AND user_role = 'agent'`, { agentId: Number(agentId), adminId: Number(adminId) });
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Agent not found or not associated with this admin' });
    }
    await conn.commit();
    res.json({ message: 'Agent deleted successfully' });
  } catch (e) {
    console.error('Delete agent error:', e);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await conn.close();
  }
});

module.exports = router;