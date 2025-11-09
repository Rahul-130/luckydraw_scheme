import React from 'react';
import { Chip } from '@mui/material';

const StatusChip = ({ customer }) => {
  let color = 'primary';
  let label = 'Eligible';

  if (customer.isFrozen) {
    color = 'success';
    label = 'Winner';
  } else if (customer.missedPayments > 1) {
    color = 'error';
    label = 'Not Eligible';
  }

  return (
    <Chip
      label={label}
      color={color}
      variant="outlined"
      size="small"
    />
  );
};

export default StatusChip;
