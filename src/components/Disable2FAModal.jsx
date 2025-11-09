import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { disable2FA } from '../services/api';
import PasswordInput from './PasswordInput';

const Disable2FAModal = ({ open, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword('');
      setOtp('');
      setError('');
    }
  }, [open]);

  const handleDisable = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await disable2FA(token, password, otp);
      onSuccess(response.data.user); // Pass the updated user object back to the parent
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disable 2FA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <DialogContentText>For your security, please enter your current password OR an OTP/Recovery code to disable 2FA.</DialogContentText>
        <PasswordInput autoFocus margin="dense" label="Password (optional)" fullWidth variant="standard" value={password} onChange={(e) => setPassword(e.target.value)} />
        <PasswordInput margin="dense" label="OTP or Recovery Code (optional)" fullWidth variant="standard" value={otp} onChange={(e) => setOtp(e.target.value)} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleDisable} color="error" disabled={loading || (!password && !otp)}>
          {loading ? <CircularProgress size={24} /> : 'Disable'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Disable2FAModal;
