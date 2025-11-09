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
  Box,
  Typography,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { verifyPassword, regenerate2FACodes } from '../services/api';
import { useSnackbar } from '../context/SnackbarContext';
import PasswordInput from './PasswordInput';
import { ContentCopy as ContentCopyIcon } from '@mui/icons-material';

const RegenerateCodesModal = ({ open, onClose }) => {
  const { token } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [newCodes, setNewCodes] = useState([]);

  useEffect(() => {
    if (open) {
      setPassword('');
      setOtp('');
      setError('');
      setNewCodes([]);
    }
  }, [open]);

  const handleRegenerate = async () => {
    setLoading(true);
    setError('');
    try {
      await verifyPassword(token, password, otp);
      const response = await regenerate2FACodes(token);
      setNewCodes(response.data.recoveryCodes);
      setPassword('');
      setOtp('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to regenerate codes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCodes = async () => {
    const codesText = newCodes.join('\n');
    try {
      await navigator.clipboard.writeText(codesText);
      showSnackbar('Recovery codes copied to clipboard!', 'success');
    } catch (err) {
      showSnackbar('Failed to copy codes.', 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Regenerate Recovery Codes</DialogTitle>
      <DialogContent>
        {error && !newCodes.length && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {newCodes.length > 0 ? (
          <>
            <Alert severity="warning" sx={{ my: 2, textAlign: 'left' }}><strong>Save these new codes!</strong> Your old codes are now invalid.</Alert>
            <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={handleCopyCodes} sx={{ mb: 2 }}>Copy Codes</Button>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, my: 2, p: 2, border: '1px solid #ccc', borderRadius: 1, background: '#f9f9f9' }}>
              {newCodes.map(code => <Typography key={code} fontFamily="monospace">{code}</Typography>)}
            </Box>
          </>
        ) : (
          <>
            <DialogContentText>For your security, please enter your current password OR an OTP/Recovery code to generate new recovery codes. This will invalidate all of your old ones.</DialogContentText>
            <PasswordInput autoFocus margin="dense" label="Password (optional)" fullWidth variant="standard" value={password} onChange={(e) => setPassword(e.target.value)} />
            <PasswordInput margin="dense" label="OTP or Recovery Code (optional)" fullWidth variant="standard" value={otp} onChange={(e) => setOtp(e.target.value)} />
          </>
        )}
      </DialogContent>
      <DialogActions>
        {newCodes.length > 0 ? <Button onClick={onClose} variant="contained">Done</Button> : (
          <><Button onClick={onClose}>Cancel</Button><Button onClick={handleRegenerate} color="warning" disabled={loading}>{loading ? <CircularProgress size={24} /> : 'Yes, Regenerate'}</Button></>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default RegenerateCodesModal;
