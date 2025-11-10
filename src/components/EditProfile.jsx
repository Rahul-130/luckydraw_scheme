import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { AccountCircle, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { getProfile, updateProfile, verifyPassword } from '../services/api';
import PasswordOrRecoveryCodeOrOTP from './PasswordOrRecoveryCodeOrOTP';

const EditProfile = ({ token, showSnackbar }) => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    company_address: '',
    company_cell: '',
    company_phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  // State for confirmation dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmOtp, setConfirmOtp] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Fetch initial profile data
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getProfile(token);
        setProfile(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Open the confirmation dialog instead of submitting directly
    setConfirmError('');
    setConfirmPassword('');
    setConfirmOtp('');
    setConfirmOpen(true);
  };

  const handleConfirmAndUpdate = async () => {
    if (!token) {
      showSnackbar('Authentication error. Please log in again.', 'error');
      return;
    }

    setConfirmLoading(true);
    setConfirmError('');

    try {
      // 1. Verify credentials
      await verifyPassword(token, confirmPassword, confirmOtp);

      // 2. If verification is successful, proceed with the update
      setUpdating(true);
      setConfirmOpen(false); // Close dialog on success

      const response = await updateProfile(profile, token);
      showSnackbar(response.data.message || 'Profile updated successfully!', 'success');
    } catch (err) {
      // If verification fails, show error inside the dialog
      const errorMessage = err.response?.data?.message || 'An unknown error occurred.';
      setConfirmError(errorMessage);
    } finally {
      setConfirmLoading(false);
      setUpdating(false);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Container component="main" maxWidth="sm" sx={{ p: 0 }}>
      <Paper
        elevation={8}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderRadius: 3,
        }}
      >
        <AccountCircle color="primary" sx={{ fontSize: 40, mb: 1 }} />
        <Typography component="h1" variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
          Edit Profile
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField margin="normal" required fullWidth id="name" label="Name" name="name" value={profile.name} onChange={handleChange} autoFocus />
          <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" value={profile.email} disabled />
          <TextField margin="normal" required fullWidth id="phone" label="Phone Number" name="phone" type="tel" value={profile.phone} onChange={handleChange} />

          <Accordion sx={{ mt: 2, boxShadow: 'none', '&:before': { display: 'none' }, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Company Details (for Billing)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                <TextField margin="normal" fullWidth id="company_name" label="Company Name" name="company_name" value={profile.company_name || ''} onChange={handleChange} />
                <TextField margin="normal" fullWidth id="company_address" label="Company Address" name="company_address" value={profile.company_address || ''} onChange={handleChange} multiline rows={2} />
                <TextField margin="normal" fullWidth id="company_cell" label="Company Cell" name="company_cell" value={profile.company_cell || ''} onChange={handleChange} />
                <TextField margin="normal" fullWidth id="company_phone" label="Company Phone" name="company_phone" value={profile.company_phone || ''} onChange={handleChange} />
              </Box>
            </AccordionDetails>
          </Accordion>

          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, py: 1.5, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }} disabled={updating}>
            {updating ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </Box>
      </Paper>

      {/* Security Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Changes</DialogTitle>
        <DialogContent>
          {confirmError && <Alert severity="error" sx={{ mb: 2 }}>{confirmError}</Alert>}
          <PasswordOrRecoveryCodeOrOTP
            descriptionText="For your security, please confirm your identity by entering your password or an OTP/Recovery code."
            passwordValue={confirmPassword}
            onPasswordChange={(e) => setConfirmPassword(e.target.value)}
            otpValue={confirmOtp}
            onOtpChange={(e) => setConfirmOtp(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmAndUpdate} variant="contained" disabled={confirmLoading || (!confirmPassword && !confirmOtp)}>
            {confirmLoading ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EditProfile;
