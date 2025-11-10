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
} from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import { getProfile, updateProfile } from '../services/api';

const EditProfile = ({ token, showSnackbar }) => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

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
    if (!token) {
      showSnackbar('Authentication error. Please log in again.', 'error');
      return;
    }
    setUpdating(true);
    setError('');
    try {
      const response = await updateProfile(profile, token);
      showSnackbar(response.data.message || 'Profile updated successfully!', 'success');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An unknown error occurred while updating.';
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
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
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, py: 1.5, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }} disabled={updating}>
            {updating ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default EditProfile;
