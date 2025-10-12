import React from 'react';
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
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import LockResetIcon from '@mui/icons-material/LockReset';
import SecurityIcon from '@mui/icons-material/Security';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

export default function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeContext();

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

        </Paper>
      </Container>
    </Box>
  );
}
