import React from 'react';
import zxcvbn from 'zxcvbn';
import { Box, LinearProgress, Typography } from '@mui/material';

const PasswordStrengthMeter = ({ password }) => {
  const testResult = zxcvbn(password);
  const score = testResult.score * 100 / 4; // Scale score to 0-100

  const strengthLabel = () => {
    switch (testResult.score) {
      case 0: return 'Very Weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };

  const strengthColor = () => {
    switch (testResult.score) {
      case 0: return 'error';
      case 1: return 'error';
      case 2: return 'warning';
      case 3: return 'info';
      case 4: return 'success';
      default: return 'grey';
    }
  };

  return (
    <Box sx={{ width: '100%', mt: 1 }}>
      <LinearProgress variant="determinate" value={score} color={strengthColor()} sx={{ height: 8, borderRadius: 5 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          {strengthLabel()}
        </Typography>
        {testResult.feedback.warning && (
          <Typography variant="caption" color="error.main">
            {testResult.feedback.warning}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default PasswordStrengthMeter;
