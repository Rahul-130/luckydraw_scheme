import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stack, IconButton, Box } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

const PageHeader = ({ backTo, children }) => {
  const navigate = useNavigate();

  return (
    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
      {backTo && (
        <IconButton onClick={() => navigate(backTo)} sx={{ color: '#000' }}>
          <ArrowBack />
        </IconButton>
      )}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 1.5,
          flexGrow: 1,
        }}
      >
        {children}
      </Box>
    </Stack>
  );
};

export default PageHeader;
