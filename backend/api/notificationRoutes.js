const express = require('express');
const router = express.Router();
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const requireAuth = require('../middleware/requireAuth'); // Assuming you have an auth middleware

// POST /api/notifications/whatsapp
// Sends a WhatsApp message using the Cloud API
router.post(
    '/whatsapp',
    requireAuth, // Protect the route
    [
        // Basic validation for incoming data
        body('phone', 'Phone number is required').notEmpty(),
        body('customerName', 'Customer name is required').notEmpty(),
        body('bookName', 'Book name is required').notEmpty(),
        body('address', 'Address is required').notEmpty(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { phone, customerName, bookName, address } = req.body;

        // --- WhatsApp Cloud API Configuration ---
        // It's crucial to store these in environment variables (.env file)
        const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
        const API_VERSION = 'v18.0'; // Use a current or desired API version

        if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
            console.error('WhatsApp environment variables are not set.');
            return res.status(500).json({ error: 'Server is not configured for WhatsApp notifications.' });
        }

        const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

        // This payload assumes you have a pre-approved WhatsApp template.
        // Template Name: lucky_draw_winner
        // Template Body: Congratulations {{1}}! You have been selected as a winner in the lucky draw for the book "{{2}}". Your prize will be sent to your address: {{3}}.
        const data = {
            messaging_product: 'whatsapp',
            to: phone, // The recipient's phone number with country code
            type: 'template',
            template: {
                name: 'lucky_draw_winner', // The name of your approved template
                language: { code: 'en_US' },
                components: [
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: customerName },
                            { type: 'text', text: bookName },
                            { type: 'text', text: address },
                        ],
                    },
                ],
            },
        };

        try {
            await axios.post(url, data, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } });
            res.status(200).json({ message: 'WhatsApp message sent successfully.' });
        } catch (error) {
            console.error('Error sending WhatsApp message:', error.response ? error.response.data : error.message);
            res.status(500).json({ error: 'Failed to send WhatsApp message.' });
        }
    }
);


// POST /api/notifications/whatsapp/unmark
// Sends a WhatsApp message when a winner is unmarked
router.post(
    '/whatsapp/unmark',
    requireAuth, // Protect the route
    [
        body('phone', 'Phone number is required').notEmpty(),
        body('customerName', 'Customer name is required').notEmpty(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { phone, customerName } = req.body;

        const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
        const API_VERSION = 'v18.0';

        if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
            console.error('WhatsApp environment variables are not set.');
            return res.status(500).json({ error: 'Server is not configured for WhatsApp notifications.' });
        }

        const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

        // Assumes a pre-approved template named 'unmark_winner'
        // Template Body: Hello {{1}}, your winner status for the lucky draw has been revoked. Please contact us for more details.
        const data = {
            messaging_product: 'whatsapp',
            to: phone,
            type: 'template',
            template: {
                name: 'unmark_winner', // The name of your "unmark" template
                language: { code: 'en_US' },
                components: [{ type: 'body', parameters: [{ type: 'text', text: customerName }] }],
            },
        };

        try {
            await axios.post(url, data, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } });
            res.status(200).json({ message: 'Unmark WhatsApp message sent successfully.' });
        } catch (error) {
            console.error('Error sending unmark WhatsApp message:', error.response ? error.response.data : error.message);
            res.status(500).json({ error: 'Failed to send unmark WhatsApp message.' });
        }
    }
);

// --- Webhook for WhatsApp Cloud API ---

// This is the verification endpoint for Meta to confirm the webhook.
// You will set this URL in your Meta for Developers App dashboard.
// The full URL will be something like: https://your-app-domain.com/api/notifications/whatsapp/webhook
router.get('/whatsapp/webhook', (req, res) => {
    // This token must match the one you set in the Meta App dashboard.
    const verify_token = process.env.WHATSAPP_VERIFY_TOKEN;

    // Parse params from the webhook verification request
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Check if a token and mode were sent
    if (mode && token) {
        // Check the mode and token sent are correct
        if (mode === 'subscribe' && token === verify_token) {
            // Respond with 200 OK and challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

// This endpoint receives status updates from WhatsApp (e.g., sent, delivered, read).
router.post('/whatsapp/webhook', (req, res) => {
    const body = req.body;

    // Log the incoming status update for debugging
    // In a production app, you would process this data, maybe update a database,
    // and push a real-time notification to the frontend via WebSockets.
    console.log('Received WhatsApp Webhook:', JSON.stringify(body, null, 2));

    // Acknowledge receipt of the event
    res.sendStatus(200);
});

module.exports = router;

