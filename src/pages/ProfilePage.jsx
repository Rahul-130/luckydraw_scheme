import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import { AccountCircle, Lock } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';
import PageLayout from '../components/PageLayout';
import ChangePassword from '../components/ChangePassword';
import EditProfile from '../components/EditProfile';

const ProfilePage = () => {
  const { token } = useAuth(); // Get token from your Auth context
  const { showSnackbar } = useSnackbar();
  const [activeSection, setActiveSection] = useState('profile');

  return (
    <PageLayout>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Grid container spacing={4} justifyContent="center">
          {/* Left Spacer - This will be empty on larger screens */}
          <Grid item md={1} sx={{ display: { xs: 'none', md: 'block' } }} />

          

          {/* Navigation Menu (Right Side) */}
          <Grid item xs={12} md={3}>
            <Paper>
              <List>
                <ListItem disablePadding>
                  <ListItemButton selected={activeSection === 'profile'} onClick={() => setActiveSection('profile')}>
                    <ListItemIcon><AccountCircle /></ListItemIcon>
                    <ListItemText primary="Edit Profile" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton selected={activeSection === 'password'} onClick={() => setActiveSection('password')}>
                    <ListItemIcon><LockResetIcon /></ListItemIcon>
                    <ListItemText primary="Change Password" />
                  </ListItemButton>
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* Main Content Area (Center) */}
          <Grid item xs={12} md={7}>
            {activeSection === 'profile' && <EditProfile token={token} showSnackbar={showSnackbar} />}
            {activeSection === 'password' && <ChangePassword token={token} showSnackbar={showSnackbar} />}
          </Grid>

          {/* Right Spacer - This will be empty on larger screens */}
          <Grid item md={1} sx={{ display: { xs: 'none', md: 'block' } }} />
        </Grid>
      </Box>
    </PageLayout>
  );
};

export default ProfilePage;
