import React from 'react';
import { Box, ToggleButtonGroup, ToggleButton } from '@mui/material';

const overviewOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const OverviewToggle = ({ value, onChange }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(e, newValue) => newValue && onChange(newValue)}
        aria-label="Overview Period"
      >
        {overviewOptions.map(option => (
          <ToggleButton key={option.value} value={option.value} aria-label={`${option.label} overview`}>{option.label}</ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
};

export default OverviewToggle;
