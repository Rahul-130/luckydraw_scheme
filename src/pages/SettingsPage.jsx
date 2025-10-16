import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Divider,
  FormControlLabel,
  Switch,
  Alert,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import LockResetIcon from '@mui/icons-material/LockReset';
import SecurityIcon from '@mui/icons-material/Security';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { downloadBackup, backupToGoogleDrive } from '../services/api';
import { ContentCopy as ContentCopyIcon, Visibility, VisibilityOff, CloudDownload } from '@mui/icons-material';
import { useSnackbar } from '../context/SnackbarContext';


export default function SettingsPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showSnackbar } = useSnackbar();
  const [success, setSuccess] = useState('');

    const handleDownloadBackup = async () => {
      setLoading(true);
      setError('');
      showSnackbar('Backup process started... this may take a moment.', 'info');
      try {
        const response = await downloadBackup(token);
        // Create a link to download the blob
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const contentDisposition = response.headers['content-disposition'];
        let filename = 'backup.zip';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch.length === 2) filename = filenameMatch[1];
        }
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        setError('Failed to download backup.');
        showSnackbar('Failed to download backup.', 'error');
      } finally { setLoading(false); }
    };
  
    const handleGoogleDriveBackup = async () => {
      setLoading(true);
      setError('');
      showSnackbar('Initiating Google Drive backup...', 'info');
      try {
        const response = await backupToGoogleDrive(token);
        // A 200 OK status now means the entire process was successful
        showSnackbar(response.data.message, 'success');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to start Google Drive backup.');
        showSnackbar('Failed to start Google Drive backup.', 'error');
      } finally { setLoading(false); }
    };
  

  return (
    <Box sx={{ py: 4, background: (theme) => theme.palette.background.default, minHeight: 'calc(100vh - 64px)' }}>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Settings
          </Typography>

          {/* Theme Toggle Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Appearance</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Brightness7Icon sx={{ color: mode === 'light' ? 'primary.main' : 'text.disabled' }} />
              <FormControlLabel
                control={<Switch checked={mode === 'dark'} onChange={toggleTheme} />}
                label={mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                sx={{ mx: 0.5 }}
              />
              <Brightness4Icon sx={{ color: mode === 'dark' ? 'primary.main' : 'text.disabled' }} />
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Change Password Section */}
          <Typography variant="h6">Password</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Change your account password.
          </Typography>
          <Button variant="outlined" startIcon={<LockResetIcon />} onClick={() => navigate('/change-password')}>
            Change Password
          </Button>

          <Divider sx={{ my: 4 }} />

          {/* 2FA Security Section */}
          <Typography variant="h6">Two-Factor Authentication (2FA)</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {user?.is2FAEnabled ? 'Manage your 2FA settings and recovery codes.' : 'Add an extra layer of security to your account.'}
          </Typography>
          <Button variant="outlined" startIcon={<SecurityIcon />} onClick={() => navigate('/security')}>
            {user?.is2FAEnabled ? 'Manage 2FA' : 'Enable 2FA'}
          </Button>

          {/* Add other settings like backup here if desired */}
          <Typography variant="h6" sx={{ mt: 4, borderTop: '1px solid #eee', pt: 3 }}>Application Backup</Typography>
                  <Box sx={{ mt: 2 }}>
                      <Alert severity="info">Create a complete backup of your application data. You can download it directly or save it to your configured Google Drive.</Alert>
                      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                        <Button variant="contained" startIcon={<CloudDownload />} onClick={handleDownloadBackup} disabled={loading}>
                          {loading ? 'Generating...' : 'Download Backup'}
                        </Button>
                        <Button variant="outlined" startIcon={<CloudDownload />} onClick={handleGoogleDriveBackup} disabled={loading}>
                          {loading ? 'Saving...' : 'Save to Drive'}
                        </Button>
                      </Box>
                  </Box>

        </Paper>
      </Container>
    </Box>
  );
}
