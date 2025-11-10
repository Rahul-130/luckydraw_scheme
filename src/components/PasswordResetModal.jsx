import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { requestPasswordReset, completePasswordReset } from '../services/api';
import { validatePassword, PASSWORD_REQUIREMENTS } from '../utils/validation';
import PasswordInput from './PasswordInput';
import PasswordStrengthMeter from './PasswordStrengthMeter';

const PasswordResetModal = ({ open, onClose }) => {
  const [step, setStep] = useState('request'); // 'request' or 'complete'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Reset state when the modal is opened
    if (open) {
      setStep('request');
      setEmail('');
      setOtp('');
      setNewPassword('');
      setError('');
      setSuccess('');
    }
  }, [open]);

  const handleResetRequest = async () => {
    setError('');
    try {
      await requestPasswordReset(email);
      setStep('complete');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not process request. Ensure user exists and has 2FA enabled.');
    }
  };

  const handleResetComplete = async () => {
    setError('');
    setSuccess('');

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    try {
      await completePasswordReset(email, otp, newPassword);
      setSuccess('Password has been reset successfully! You can now close this and log in.');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP or password. Please try again.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{step === 'request' ? 'Reset Password' : 'Enter Details'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" className="!mb-4">{error}</Alert>}
        {success && <Alert severity="success" className="!mb-4">{success}</Alert>}
        {step === 'request' ? (
          <>
            <Typography variant="body2" className="!mb-4">Enter your email to begin the reset process. 2FA must be enabled on your account.</Typography>
            <TextField autoFocus margin="dense" label="Email Address" type="email" fullWidth variant="standard" value={email} onChange={(e) => setEmail(e.target.value)} />
          </>
        ) : (
          <>
            <Typography variant="body2" className="!mb-4">An OTP has been sent to your authenticator app. Enter it below, along with your new password.</Typography>
            <PasswordInput margin="dense" label="Authenticator OTP or Recovery Code" fullWidth variant="standard" value={otp} onChange={(e) => setOtp(e.target.value)} />
            <PasswordInput margin="dense" label="New Password" fullWidth variant="standard" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} error={!!(newPassword && validatePassword(newPassword))} helperText={PASSWORD_REQUIREMENTS} />
            {newPassword && <PasswordStrengthMeter password={newPassword} />}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {step === 'request' ? <Button onClick={handleResetRequest} variant="contained">Request Reset</Button> : <Button onClick={handleResetComplete} variant="contained" disabled={!!success}>Complete Reset</Button>}
      </DialogActions>
    </Dialog>
  );
};

export default PasswordResetModal;
