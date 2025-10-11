import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { disable2FA, regenerate2FACodes } from '../services/api';
import {
  Container,
  Typography,
  Box,
  Button,
  Alert,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function SecurityPage() {
  const { user, token, login: updateUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // State for modals
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [newCodes, setNewCodes] = useState([]);
  const [password, setPassword] = useState('');

  const handleDisable2FA = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await disable2FA(token, password);
      updateUser(response.data.user, token);
      setSuccess('2FA has been disabled successfully.');
      setDisableModalOpen(false);
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disable 2FA.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCodes = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await regenerate2FACodes(token);
      setNewCodes(response.data.recoveryCodes);
      setSuccess('New recovery codes have been generated. Please save them.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to regenerate codes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Paper elevation={3} sx={{ mt: 8, p: 4 }}>
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          Security Settings
        </Typography>
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Typography variant="h6">Two-Factor Authentication (2FA)</Typography>
        {user?.is2FAEnabled ? (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success">2FA is currently <strong>enabled</strong> on your account.</Alert>
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button variant="outlined" color="warning" onClick={() => setRegenerateModalOpen(true)}>
                Regenerate Recovery Codes
              </Button>
              <Button variant="contained" color="error" onClick={() => setDisableModalOpen(true)}>
                Disable 2FA
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info">2FA is currently <strong>disabled</strong>. We strongly recommend enabling it.</Alert>
            <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/setup-2fa')}>
              Enable 2FA
            </Button>
          </Box>
        )}
      </Paper>

      {/* Disable 2FA Modal */}
      <Dialog open={disableModalOpen} onClose={() => setDisableModalOpen(false)}>
        <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <DialogContentText>
            For your security, please enter your current password to disable 2FA.
          </DialogContentText>
          <TextField autoFocus margin="dense" label="Password" type="password" fullWidth variant="standard" value={password} onChange={(e) => setPassword(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisableModalOpen(false)}>Cancel</Button>
          <Button onClick={handleDisable2FA} color="error" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Disable'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Regenerate Codes Modal */}
      <Dialog open={regenerateModalOpen} onClose={() => setRegenerateModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Regenerate Recovery Codes</DialogTitle>
        <DialogContent>
          {newCodes.length > 0 ? (
             <>
              <Alert severity="warning" sx={{ my: 2, textAlign: 'left' }}>
                <strong>Save these new codes!</strong> Your old codes are now invalid.
              </Alert>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, my: 2, p: 2, border: '1px solid #ccc', borderRadius: 1, background: '#f9f9f9' }}>
                {newCodes.map(code => <Typography key={code} fontFamily="monospace">{code}</Typography>)}
              </Box>
            </>
          ) : (
            <DialogContentText>
              Are you sure you want to generate new recovery codes? This will invalidate all of your old ones.
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          {newCodes.length > 0 ? (
            <Button onClick={() => { setRegenerateModalOpen(false); setNewCodes([]); }} variant="contained">Done</Button>
          ) : (
            <>
              <Button onClick={() => setRegenerateModalOpen(false)}>Cancel</Button>
              <Button onClick={handleRegenerateCodes} color="warning" disabled={loading}>{loading ? <CircularProgress size={24} /> : 'Yes, Regenerate'}</Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}
