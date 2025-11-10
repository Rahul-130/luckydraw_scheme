const express = require('express');
const router = express.Router();
const { getConnection, oracledb } = require('../db');
const requireAuth = require('../middleware/requireAuth');

/**
 * @route   GET /api/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/', requireAuth, async (req, res) => {
    const userId = req.user.id;
    let conn;
    try {
        conn = await getConnection();
        const result = await conn.execute(
            `SELECT name, email, phone FROM users WHERE id = :userId`,
            { userId }
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const profile = result.rows[0];
        res.json({
            name: profile.NAME,
            email: profile.EMAIL,
            phone: profile.PHONE || ''
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) await conn.close();
    }
});

/**
 * @route   PUT /api/profile
 * @desc    Update current user's profile
 * @access  Private
 */
router.put('/', requireAuth, async (req, res) => {
    const { name, email, phone } = req.body;
    const userId = req.user.id;
    let conn;

    try {
        conn = await getConnection();
        await conn.execute(
            `UPDATE users SET name = :name, email = :email, phone = :phone WHERE id = :userId`,
            { name, email, phone, userId }
        );
        await conn.commit();
        res.json({ message: 'Profile updated successfully!' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (conn) await conn.close();
    }
});

module.exports = router;
