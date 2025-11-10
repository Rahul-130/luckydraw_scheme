import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { getProfile, updateProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';
import PageLayout from '../components/PageLayout';

const ProfilePage = () => {
  const { token } = useAuth(); // Get token from your Auth context
  const { showSnackbar } = useSnackbar();
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
    if (!token) return;

    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getProfile(token);
        const data = response.data;
        setProfile(data);
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
    return (
      <PageLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Paper sx={{ maxWidth: '600px', margin: 'auto', p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Edit Profile
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Name"
            name="name"
            value={profile.name}
            onChange={handleChange}
            autoFocus
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            value={profile.email}
            disabled />
          <TextField margin="normal" required fullWidth id="phone" label="Phone Number" name="phone" type="tel" value={profile.phone} onChange={handleChange} />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={updating}>
            {updating ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </Box>
      </Paper>
    </PageLayout>
  );
};

export default ProfilePage;
