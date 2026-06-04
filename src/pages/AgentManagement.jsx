import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LockResetIcon from '@mui/icons-material/LockReset';

const AgentManagement = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newAgent, setNewAgent] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Ensure only admins can access this page
  useEffect(() => {
    if (user && user.userRole !== 'admin') {
      setError('Access Denied: Only administrators can manage agents.');
      setLoading(false);
    } else if (!user) {
      setError('Authentication Required.');
      setLoading(false);
    }
  }, [user]);

  const fetchAgents = async () => {
    if (!user || user.userRole !== 'admin') return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/auth/agents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAgents(response.data);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('Failed to fetch agents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.userRole === 'admin') {
      fetchAgents();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAgent((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' })); // Clear error on input change
  };

  const validateForm = () => {
    const errors = {};
    if (!newAgent.name.trim()) errors.name = 'Name is required';
    if (!newAgent.phone.trim()) errors.phone = 'Phone is required';
    if (!newAgent.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(newAgent.email)) {
      errors.email = 'Email is invalid';
    }
    if (!newAgent.password.trim()) {
      errors.password = 'Password is required';
    } else if (newAgent.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAgent = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsAddingAgent(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/auth/agents', newAgent, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Agent added successfully!');
      setNewAgent({ name: '', phone: '', email: '', password: '' });
      fetchAgents(); // Refresh the list
    } catch (err) {
      console.error('Error adding agent:', err);
      const errorMessage = err.response?.data?.error || 'Failed to add agent. Please try again.';
      setError(errorMessage);
    } finally {
      setIsAddingAgent(false);
    }
  };

  const handleOpenResetDialog = (agent) => {
    setSelectedAgent(agent);
    setResetPasswordValue('');
    setResetDialogOpen(true);
  };

  const handleResetPasswordSubmit = async () => {
    if (!resetPasswordValue.trim() || resetPasswordValue.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    setIsResetting(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/auth/agents/${selectedAgent.id}/reset-password`, {
        password: resetPasswordValue,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Password reset successfully!');
      setResetDialogOpen(false);
    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteAgent = async (agentId) => {
    if (!window.confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return;
    }

    setError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/auth/agents/${agentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Agent deleted successfully!');
      fetchAgents(); // Refresh the list
    } catch (err) {
      console.error('Error deleting agent:', err);
      const errorMessage = err.response?.data?.error || 'Failed to delete agent. Please try again.';
      setError(errorMessage);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom component="h1" sx={{ fontWeight: 'bold', mb: 4 }}>
        Agent Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {!user || user.userRole !== 'admin' ? (
        <Alert severity="warning">You do not have permission to view this page.</Alert>
      ) : (
        <>
          {/* Add New Agent Form */}
          <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Add New Agent
            </Typography>
            <Box component="form" onSubmit={handleAddAgent} noValidate>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    required
                    fullWidth
                    id="name"
                    label="Name"
                    name="name"
                    value={newAgent.name}
                    onChange={handleInputChange}
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    required
                    fullWidth
                    id="phone"
                    label="Phone"
                    name="phone"
                    value={newAgent.phone}
                    onChange={handleInputChange}
                    error={!!formErrors.phone}
                    helperText={formErrors.phone}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    value={newAgent.email}
                    onChange={handleInputChange}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    value={newAgent.password}
                    onChange={handleInputChange}
                    error={!!formErrors.password}
                    helperText={formErrors.password}
                  />
                </Grid>
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    disabled={isAddingAgent}
                    sx={{ px: 4, py: 1 }}
                  >
                    {isAddingAgent ? 'Adding...' : 'Add Agent'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* Existing Agents List */}
          <TableContainer component={Paper} elevation={3}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6">Existing Agents</Typography>
            </Box>
            <Divider />
            {agents.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="textSecondary">No agents found.</Typography>
              </Box>
            ) : (
              <Table sx={{ minWidth: 650 }} aria-label="agents table">
                <TableHead sx={{ backgroundColor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>2FA Enabled</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {agents.map((agent) => (
                    <TableRow key={agent.id} hover>
                      <TableCell component="th" scope="row">
                        {agent.name}
                      </TableCell>
                      <TableCell>{agent.email}</TableCell>
                      <TableCell>{agent.phone}</TableCell>
                      <TableCell>{agent.is2FAEnabled ? 'Yes' : 'No'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          aria-label="reset password"
                          color="primary"
                          onClick={() => handleOpenResetDialog(agent)}
                          title="Reset Password"
                        >
                          <LockResetIcon />
                        </IconButton>
                        <IconButton
                          aria-label="delete"
                          color="error"
                          onClick={() => handleDeleteAgent(agent.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        </>
      )}

      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>Reset Password for {selectedAgent?.name}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="reset-password"
            label="New Password"
            type="password"
            fullWidth
            variant="outlined"
            value={resetPasswordValue}
            onChange={(e) => setResetPasswordValue(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleResetPasswordSubmit} 
            variant="contained" 
            disabled={isResetting || !resetPasswordValue}
          >
            {isResetting ? 'Resetting...' : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AgentManagement;
