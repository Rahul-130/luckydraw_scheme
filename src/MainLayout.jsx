import React from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from './components/NavBar';
import { Box, Container } from '@mui/material'; // Import Container

const MainLayout = () => {
  return (
    <>
      <NavBar />
      <Container component="main" sx={{ py: 3 }}> {/* Use Container for consistent max-width and padding */}
        <Outlet />
      </Container>
    </>
  );
};

export default MainLayout;