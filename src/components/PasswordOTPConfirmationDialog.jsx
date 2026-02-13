import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import PasswordInput from './PasswordInput';

const PasswordOTPConfirmationDialog = ({ open, onClose, onConfirm, loading, title, message, is2FAEnabled = true }) => {
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  useEffect(() => {
    // Reset fields when dialog opens
    if (open) {
      setPassword('');
      setOtp('');
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm(password, otp);
  };

  const defaultMessage = is2FAEnabled
    ? 'To ensure security, please enter your password and a one-time password (OTP) from your authenticator app to proceed.'
    : 'To ensure security, please enter your password to proceed.';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title || 'Confirm Action'}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {message || defaultMessage}
        </Typography>
        <PasswordInput
          label="Password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {is2FAEnabled && (
          <PasswordInput
            label="Authenticator OTP"
            fullWidth
            margin="normal"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="primary" onClick={handleConfirm} disabled={!password.trim() || (is2FAEnabled && !otp.trim()) || loading}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PasswordOTPConfirmationDialog;
