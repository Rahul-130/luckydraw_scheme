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
  InputAdornment,
  IconButton,
} from '@mui/material';
import { ContentCopy as ContentCopyIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { useSnackbar } from '../context/SnackbarContext';

export default function Setup2FAPage() {
  const { token, user, login: updateUser } = useAuth();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect if user already has 2FA enabled or is not logged in
    // Do not redirect if we are showing recovery codes
    if ((!token || user?.is2FAEnabled) && recoveryCodes.length === 0) {
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
  }, [token, user, navigate, recoveryCodes.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await enable2FA(token, otp);
      // Update user context to reflect that 2FA is now enabled
      setRecoveryCodes(response.data.recoveryCodes);
      // Don't navigate away automatically, show recovery codes first.
      updateUser(response.data.user, token); 
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    }
  };

  const handleCopyCodes = async () => {
    const codesText = recoveryCodes.join('\n');
    try {
      await navigator.clipboard.writeText(codesText);
      showSnackbar('Recovery codes copied to clipboard!', 'success');
    } catch (err) {
      showSnackbar('Failed to copy codes.', 'error');
      console.error('Failed to copy codes: ', err);
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

          {recoveryCodes.length > 0 ? (
            <>
              <Typography variant="h6" color="primary">2FA Enabled Successfully!</Typography>
              <Alert severity="warning" sx={{ my: 2, textAlign: 'left' }}>
                <strong>Save these recovery codes!</strong> If you lose access to your authenticator app, you will need these codes to log in. Store them somewhere safe.
              </Alert>
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyCodes}
                sx={{ mb: 2 }}
              >
                Copy Codes
              </Button>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, my: 2, p: 2, border: '1px solid #ccc', borderRadius: 1, background: '#f9f9f9' }}>
                {recoveryCodes.map(code => <Typography key={code} fontFamily="monospace">{code}</Typography>)}
              </Box>
              <Button fullWidth variant="contained" onClick={() => navigate('/books')}>
                I have saved my codes. Continue.
              </Button>
            </>
          ) : null}

          {qrCode && recoveryCodes.length === 0 && (
            <>
              <Typography variant="body1" gutterBottom>
                1. Scan this QR code with your authenticator app (e.g., Google Authenticator).
              </Typography>
              <img src={qrCode} alt="2FA QR Code" style={{ margin: '16px 0' }} />
              <Typography variant="body1" gutterBottom>
                2. Enter the 6-digit code from your app below.
              </Typography>
              <form onSubmit={handleSubmit}>
                <TextField margin="normal" required fullWidth label="6-Digit OTP Code" value={otp} onChange={(e) => setOtp(e.target.value)} autoFocus type={showOtp ? 'text' : 'password'} InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowOtp(!showOtp)} edge="end">
                        {showOtp ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                />
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
