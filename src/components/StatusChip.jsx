import React from 'react';
import { Chip } from '@mui/material';
import { EmojiEvents, Block, CheckCircle, Warning } from '@mui/icons-material';

const StatusChip = ({ customer, onClick }) => {
  const chipSx = { width: '100%', justifyContent: 'center', fontWeight: 'bold', cursor: onClick ? 'pointer' : 'inherit' };
  
  let props = { label: '', color: 'default', icon: null };

  if (customer.isWinner) {
    props = { label: "Winner", color: "success", icon: <EmojiEvents fontSize="small" /> };
  } else if (customer.isFrozen) {
    props = { label: "Closed", color: "default", icon: <Block fontSize="small" /> };
  } else if ((customer.paymentCount || 0) >= 20) {
    props = { label: "Completed", color: "info", icon: <CheckCircle fontSize="small" /> };
  } else if (customer.missedPayments <= 2) {
    props = { label: "Eligible", color: "primary" };
  } else {
    props = { label: "Not Eligible", color: "error", icon: <Warning fontSize="small" /> };
  }

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) onClick(props.label);
  };

  return <Chip {...props} size="small" sx={chipSx} onClick={onClick ? handleClick : undefined} />;
};

export default StatusChip;
