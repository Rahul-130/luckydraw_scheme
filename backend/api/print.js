const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const net = require('net');
const router = express.Router();

// POST /api/print/network
router.post('/network', requireAuth, async (req, res) => {
  const { printerIp, rawData } = req.body;
  
  if (!printerIp || !rawData) {
    return res.status(400).json({ error: 'Printer IP and raw data are required' });
  }

  const client = new net.Socket();
  client.setTimeout(8000); // 8 second timeout
  const buffer = Buffer.from(rawData, 'base64');

  const port = parseInt(process.env.WIFI_PORT, 10) || 9100;

  client.on('error', (err) => {
    console.error('[PRINT] Network Socket Error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Printer communication error: ' + err.message });
    }
    client.destroy();
  });

  client.on('timeout', () => {
    console.error('[PRINT] Connection timed out');
    if (!res.headersSent) {
      res.status(504).json({ error: 'Printer connection timed out. Check if the printer is on and the IP is correct.' });
    }
    client.destroy();
  });

  client.connect(port, printerIp, () => {
    console.log(`[PRINT] Connected to ${printerIp}:${port}. Sending ${buffer.length} bytes...`);
    client.write(buffer, (error) => {
      if (!error) {
        // Give the printer 1 second to process the buffer before closing
        setTimeout(() => {
          client.end();
          if (!res.headersSent) res.json({ message: 'Print job successfully transmitted' });
        }, 1000);
      }
    });
  });
});

module.exports = router;
