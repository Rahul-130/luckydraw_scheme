const express = require('express');
const router = express.Router();
const path = require('path');
const os = require('os');
const fs = require('fs-extra');
const archiver = require('archiver');
const { format } = require('fast-csv');
const { getConnection } = require('../db');
const axios = require('axios');
const requireAuth = require('../middleware/requireAuth');

const TABLES_TO_BACKUP = ['users', 'books', 'customers', 'payments', 'winner'];

/**
 * Creates a formatted timestamp string.
 * @returns {string} Formatted timestamp e.g., YYYY-MM-DD_HH-mm-ss
 */
function getFormattedTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

/**
 * Creates a timestamped zip file containing CSV exports of specified tables.
 * @returns {Promise<string>} The full path to the created zip file.
 */
async function createBackupArchive() {
  const timestamp = getFormattedTimestamp();
  const backupDir = path.join(os.tmpdir(), `backup-${timestamp}`);
  const zipPath = path.join(os.tmpdir(), `backup_${timestamp}.zip`);
  await fs.ensureDir(backupDir);

  const conn = await getConnection();

  try {
    for (const table of TABLES_TO_BACKUP) {
      const csvPath = path.join(backupDir, `${table}.csv`);
      const fileStream = fs.createWriteStream(csvPath);
      const csvStream = format({ headers: true });

      csvStream.pipe(fileStream);

      const result = await conn.execute(`SELECT * FROM ${table}`);
      result.rows.forEach(row => {
        // Convert CLOBs or other complex types to string if necessary
        const sanitizedRow = {};
        for (const key in row) {
          if (row[key] instanceof Object && !(row[key] instanceof Date)) {
            sanitizedRow[key] = JSON.stringify(row[key]);
          } else {
            sanitizedRow[key] = row[key];
          }
        }
        csvStream.write(sanitizedRow);
      });

      csvStream.end();
      await new Promise((resolve, reject) => {
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
      });
    }
  } finally {
    await conn.close();
  }

  // Zip the files
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);

    archive.pipe(output);
    archive.directory(backupDir, false);
    archive.finalize();
  });

  await fs.remove(backupDir); // Clean up the temporary CSV directory
  return zipPath;
}

router.post('/download', requireAuth, async (req, res) => {
  // Expose the Content-Disposition header so the frontend can read the filename
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

  try {
    const zipFilePath = await createBackupArchive();
    
    res.download(zipFilePath, path.basename(zipFilePath), async (err) => {
      // Cleanup the zip file after download is complete or if an error occurs
      await fs.remove(zipFilePath);
      if (err) {
        console.error('Error sending backup file:', err);
      }
    });
  } catch (error) {
    console.error('Failed to create backup:', error);
    res.status(500).json({ message: 'Failed to create backup.' });
  }
});

router.post('/googledrive', requireAuth, async (req, res) => {
  const webhookUrl = process.env.N8N_BACKUP_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error('N8N_BACKUP_WEBHOOK_URL is not set in the environment variables.');
    return res.status(500).json({ message: 'Cloud backup service is not configured.' });
  }

  try {
    new URL(webhookUrl);
  } catch (error) {
    console.error('Invalid N8N_BACKUP_WEBHOOK_URL:', webhookUrl);
    return res.status(500).json({ message: 'Cloud backup service URL is invalid.' });
  }

  let zipFilePath;
  try {
    zipFilePath = await createBackupArchive();
    const fileStream = fs.createReadStream(zipFilePath);

    // Send the file as a stream to the n8n webhook and wait for the response
    const n8nResponse = await axios.post(webhookUrl, fileStream, {
      headers: {
        'Content-Type': 'application/zip',
        'File-Name': path.basename(zipFilePath),
      },
    });

    // Check if n8n responded with a success status
    if (n8nResponse.status >= 200 && n8nResponse.status < 300) {
      console.log(`Successfully created and uploaded backup: ${path.basename(zipFilePath)}`);
      res.status(200).json({ message: 'Backup successfully created and saved to Google Drive.' });
    } else {
      throw new Error(`n8n workflow responded with status ${n8nResponse.status}`);
    }
  } catch (error) {
    console.error('Error during Google Drive backup process:', error.message);
    res.status(500).json({ message: 'An error occurred during the backup process.' });
  } finally {
    // Always clean up the local zip file, regardless of success or failure
    if (zipFilePath) {
      await fs.remove(zipFilePath);
    }
  }
});

module.exports = router;
