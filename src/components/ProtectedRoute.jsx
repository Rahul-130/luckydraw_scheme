import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar';

const ProtectedRoute = () => {
  const { user, token } = useAuth();

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
