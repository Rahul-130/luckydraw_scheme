import React from 'react';
import { Box, ToggleButtonGroup, ToggleButton } from '@mui/material';

const overviewOptions = ['daily', 'weekly', 'monthly', 'yearly'];

const OverviewToggle = ({ value, onChange }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(e, newValue) => newValue && onChange(newValue)}
        aria-label="Overview Period"
        color="primary"
      >
        {overviewOptions.map(option => (
          <ToggleButton key={option} value={option} sx={{ px: 3, textTransform: 'capitalize' }}>
            {option}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
};

export default OverviewToggle;
