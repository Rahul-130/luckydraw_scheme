import React from 'react';
import { IconButton } from '@mui/material';
import { alpha, styled } from '@mui/material/styles';

const StyledIconButton = styled(IconButton)(({ theme, color = 'primary' }) => ({
  backgroundColor: alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.1),
  '&:hover': {
    backgroundColor: alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.2),
    transform: 'scale(1.05)',
  },
  borderRadius: 1.5,
  padding: 0.7,
  color: theme.palette[color]?.main || theme.palette.primary.main,
  transition: 'all 0.2s',
}));

const ActionIconButton = ({ color, ...props }) => {
  return <StyledIconButton color={color} {...props} />;
};

export default ActionIconButton;
