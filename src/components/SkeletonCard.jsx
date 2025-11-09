import React from 'react';
import { Paper, Typography, Box, Skeleton } from '@mui/material';

const SkeletonCard = () => (
  <Paper elevation={3} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
    <Typography variant="subtitle1"><Skeleton width="80%" sx={{ margin: '0 auto' }} /></Typography>
    <Typography variant="h4"><Skeleton width="60%" sx={{ margin: '1rem auto 0' }} /></Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Skeleton width="40%" />
    </Box>
  </Paper>
);

export default SkeletonCard;
