import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = () => {
  const { user, token, loading } = useAuth();

  if (loading) {
    // Show a loading spinner while checking auth state
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }
  
  if (!token) {
    // User not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  return user?.is2FAEnabled ? 
  <>
    <NavBar />
    <Outlet /> 
  </>
  : <Navigate to="/setup-2fa" replace />;
};

export default ProtectedRoute;
