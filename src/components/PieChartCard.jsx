import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Skeleton,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const PieChartCard = ({ title, loading, data, colors, tooltipFormatter }) => {
  return (
    <Paper elevation={3} sx={{ p: 2, height: 400 }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      {loading ? (
        <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto', mt: 4 }} />
      ) : (
        <Box sx={{ height: 'calc(100% - 30px)' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius="80%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={tooltipFormatter || ((value) => [value, 'Value'])} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
};

export default PieChartCard;
