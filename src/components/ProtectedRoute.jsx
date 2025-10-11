import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = () => {
  const { user, token, loading } = useAuth();

  const location = useLocation();
  if (loading) {
    // Show a loading spinner while checking auth state
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }
  
  if (!token) {
    // User not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (!user?.is2FAEnabled) {
    // If 2FA is not enabled, only allow access to the setup page.
    if (location.pathname !== '/setup-2fa') {
      return <Navigate to="/setup-2fa" replace />;
    }
    // Render the setup page within the layout that includes the NavBar
    return <> <NavBar /> <Outlet /> </>;
  }

  return (
    <>
      <NavBar />
      <Outlet />
    </>
  );
};

export default ProtectedRoute;
