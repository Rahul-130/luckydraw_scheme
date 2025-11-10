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
        <Grid container spacing={4}>
          {/* Main Content Area (Left Side) */}
          <Grid item xs={12} sm={8} md={7}>
            {activeSection === 'profile' && <EditProfile token={token} showSnackbar={showSnackbar} />}
            {activeSection === 'password' && <ChangePassword token={token} showSnackbar={showSnackbar} />}
          </Grid>

          {/* Navigation Menu (Right Side) */}
          <Grid item xs={12} sm={4} md={4}>
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
        </Grid>
      </Box>
    </PageLayout>
  );
};

export default ProfilePage;
