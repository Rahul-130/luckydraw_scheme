import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Skeleton,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { ResponsiveContainer } from 'recharts';

const ChartCard = ({ title, loading, chartType, onChartTypeChange, children }) => {
  return (
    <Paper elevation={3} sx={{ p: 2, pb: 4, height: 400 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        {onChartTypeChange && (
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={(e, v) => onChartTypeChange(v)}
            size="small"
          >
            <ToggleButton value="bar">Bar</ToggleButton>
            <ToggleButton value="line">Line</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>
      {loading ? (
        <Skeleton variant="rectangular" width="100%" height={320} />
      ) : (
        <ResponsiveContainer>{children}</ResponsiveContainer>
      )}
    </Paper>
  );
};

export default ChartCard;
