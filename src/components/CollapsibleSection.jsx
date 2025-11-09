import React, { useState } from 'react';
import { Box, Typography, Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const CollapsibleSection = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          p: 1.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'transparent',
        }}
      >
        <Typography variant="h6" fontWeight="500">{title}</Typography>
        <ExpandMoreIcon sx={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
      </Box>
      <Collapse in={isOpen}>
        {children}
      </Collapse>
    </Box>
  );
};

export default CollapsibleSection;
