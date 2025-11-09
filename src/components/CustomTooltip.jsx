import React from 'react';
import { Paper, Typography } from '@mui/material';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Paper elevation={3} sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
        <Typography variant="subtitle2" gutterBottom>{label}</Typography>
        {payload.map((pld) => (
          <Typography key={pld.dataKey} variant="body2" sx={{ color: pld.color }}>
            {pld.name}: ₹{pld.value.toLocaleString('en-IN')}
            {pld.payload[`${pld.dataKey}_count`] > 0 && ` (count: ${pld.payload[`${pld.dataKey}_count`]})`}
          </Typography>
        ))}
      </Paper>
    );
  }

  return null;
};

export default CustomTooltip;
