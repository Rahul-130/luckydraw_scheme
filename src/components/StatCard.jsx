import React from 'react';
import { Paper, Typography } from '@mui/material';

// Define keyframes for the entrance animation
const fadeInSlideUp = {
  'from': {
    opacity: 0,
    transform: 'translateY(15px)',
  },
  'to': {
    opacity: 1,
    transform: 'translateY(0)',
  },
};

const StatCard = ({ title, value, color }) => (
  <Paper
    elevation={3}
    sx={{
      p: 2,
      textAlign: 'center',
      height: '100%',
      transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
      animation: 'fadeInSlideUp 0.5s ease-out forwards',
      '@keyframes fadeInSlideUp': fadeInSlideUp,
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: (theme) => theme.shadows[6],
      },
    }}
  >
    <Typography variant="h6" color="text.secondary">{title}</Typography>
    <Typography variant="h4" fontWeight="bold" sx={{ color: color || 'primary.main' }}>
      {value}
    </Typography>
  </Paper>
);

export default StatCard;
