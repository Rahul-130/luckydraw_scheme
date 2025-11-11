import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Typography,
  Box,
  Button,
  Alert,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '../context/SnackbarContext';
import Disable2FAModal from '../components/Disable2FAModal';
import PageLayout from '../components/PageLayout';
import RegenerateCodesModal from '../components/RegenerateCodesModal';

export default function SecurityPage() {
  const { user, token, login: updateUser } = useAuth();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // State for modals
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);

  return (
    <PageLayout>
      <Container component="main" maxWidth="md">
      <Paper elevation={3} sx={{ mt: 4, p: 4 }}>
        <Typography component="h1" variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: 'text.primary' }}>
          Security Settings
        </Typography>
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box>
          <Typography variant="h6" component="h2">Two-Factor Authentication (2FA)</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add an extra layer of security to your account. Once enabled, you will be required to enter a code from your authenticator app to log in.
          </Typography>

          {user?.is2FAEnabled ? (
            <Box sx={{ mt: 2 }}>
              <Alert severity="success" variant="outlined" sx={{ mb: 3 }}>2FA is currently <strong>enabled</strong> on your account.</Alert>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
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
              <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>2FA is currently <strong>disabled</strong>. We strongly recommend enabling it.</Alert>
              <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/setup-2fa')}>
                Enable 2FA
              </Button>
            </Box>
          )}
        </Box>

      </Paper>

      {/* Disable 2FA Modal */}
      <Disable2FAModal
        open={disableModalOpen}
        onClose={() => setDisableModalOpen(false)}
        onSuccess={(updatedUser) => {
          updateUser(updatedUser, token);
          setSuccess('2FA has been disabled successfully.');
          setDisableModalOpen(false);
        }}
      />

      {/* Regenerate Codes Modal */}
      <RegenerateCodesModal open={regenerateModalOpen} onClose={() => setRegenerateModalOpen(false)} />
      </Container>
    </PageLayout>
  );
}
