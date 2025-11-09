import React from 'react';
import { Box, Container } from '@mui/material';

const PageLayout = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: 4,
        px: 2,
        background: "linear-gradient(to right, #f0f4f8, #d9e2ec)",
      }}
    >
      <Container>{children}</Container>
    </Box>
  );
};

export default PageLayout;
