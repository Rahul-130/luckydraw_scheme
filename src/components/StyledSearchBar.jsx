import React from 'react';
import { TextField } from '@mui/material';
import { Search } from '@mui/icons-material';

const StyledSearchBar = ({ label, value, onChange, sx, ...props }) => {
    return (
        <TextField
            label={label}
            variant="outlined"
            size="small"
            value={value}
            onChange={onChange}
            sx={{
                flexGrow: 1,
                '& .MuiOutlinedInput-root': {
                    borderRadius: '50px', // Pill shape
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    transition: 'all 0.3s',
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    },
                    '&.Mui-focused': {
                        boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.light}`,
                    },
                },
                '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none', // Remove the default border
                },
                ...sx,
            }}
            InputProps={{
                startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            {...props}
        />
    );
};

export default StyledSearchBar;
