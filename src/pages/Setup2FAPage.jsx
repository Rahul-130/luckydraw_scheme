import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generate2FA, enable2FA } from '../services/api';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';

export default function Setup2FAPage() {
  const { token, user, login: updateUser } = useAuth();
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect if user already has 2FA enabled or is not logged in
    if (!token || user?.is2FAEnabled) {
      navigate('/books');
      return;
    }

    const fetchQRCode = async () => {
      try {
        const response = await generate2FA(token);
        setQrCode(response.data.qrCodeDataUrl);
      } catch (err) {
        setError('Could not generate QR code. Please try logging in again.');
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();
  }, [token, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await enable2FA(token, otp);
      // Update user context to reflect that 2FA is now enabled
      updateUser(response.data.user, token);
      navigate('/books');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Set Up Two-Factor Authentication
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
          For enhanced security, you must enable 2FA.
        </Typography>
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          {loading && <CircularProgress />}
          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
          {qrCode && (
            <>
              <Typography variant="body1" gutterBottom>
                1. Scan this QR code with your authenticator app (e.g., Google Authenticator).
              </Typography>
              <img src={qrCode} alt="2FA QR Code" style={{ margin: '16px 0' }} />
              <Typography variant="body1" gutterBottom>
                2. Enter the 6-digit code from your app below.
              </Typography>
              <form onSubmit={handleSubmit}>
                <TextField margin="normal" required fullWidth label="6-Digit OTP Code" value={otp} onChange={(e) => setOtp(e.target.value)} autoFocus />
                <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
                  Verify & Enable
                </Button>
              </form>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
