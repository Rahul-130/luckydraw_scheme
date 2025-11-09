import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const ComparisonStatCard = ({ title, value, prevValue, period = 'month' }) => {
  const diff = value - prevValue;
  const percentageChange = prevValue === 0 ? (value > 0 ? 100 : 0) : (diff / prevValue) * 100;
  const isPositive = diff >= 0;
  const color = isPositive ? 'success.main' : 'error.main';

  const formatValue = (val) => {
    if (typeof val !== 'number') return val;
    return title.toLowerCase().includes('amount') ? `₹${val.toLocaleString('en-IN')}` : val.toLocaleString('en-IN');
  };

  return (
    <Paper elevation={3} sx={{ p: 2, textAlign: 'center', height: '100%' }}>
      <Typography variant="subtitle1" color="text.secondary">{title}</Typography>
      <Typography variant="h4" fontWeight="bold">{formatValue(value)}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        {isPositive ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
        <Typography variant="body2" fontWeight="bold" sx={{ ml: 0.5 }}>
          {percentageChange.toFixed(1)}% vs last {period}
        </Typography>
      </Box>
    </Paper>
  );
};

export default ComparisonStatCard;
