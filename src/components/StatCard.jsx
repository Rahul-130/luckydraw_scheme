import React from 'react';
import { Paper, Typography } from '@mui/material';

const StatCard = ({ title, value, color }) => (
  <Paper elevation={3} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
    <Typography variant="h6" color="text.secondary">{title}</Typography>
    <Typography variant="h4" fontWeight="bold" sx={{ color: color || 'primary.main' }}>
      {value}
    </Typography>
  </Paper>
);

export default StatCard;
