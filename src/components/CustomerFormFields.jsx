import React from 'react';
import { TextField, Stack, InputAdornment, alpha } from '@mui/material';
import { Person, SupervisorAccount, Phone, Home } from '@mui/icons-material';

const CustomerFormFields = ({ formState, onFormChange }) => {
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // keep only digits
    if (value.length <= 10) { // Restrict to 10 digits
      onFormChange({ ...formState, phone: value });
    }
  };

  const commonSx = {
    '& .MuiOutlinedInput-root': {
      transition: (theme) => theme.transitions.create(['background-color', 'box-shadow']),
      '&.Mui-focused': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05) },
    },
  };

  return (
    <Stack spacing={3} sx={{ mt: 1 }}>
      <TextField
        autoFocus
        label="Name"
        fullWidth
        variant="outlined"
        value={formState.name}
        helperText="Enter the customer's full name."
        onChange={(e) => onFormChange({ ...formState, name: e.target.value })}
        sx={commonSx}
        InputProps={{
          startAdornment: <InputAdornment position="start"><Person /></InputAdornment>,
        }}
        required
      />
      <TextField
        label="S/o, D/o, W/o"
        fullWidth
        variant="outlined"
        value={formState.relationInfo}
        helperText="e.g., Father's Name, Husband's Name. Optional."
        onChange={(e) => onFormChange({ ...formState, relationInfo: e.target.value })}
        sx={commonSx}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SupervisorAccount /></InputAdornment>,
        }}
      />
      <TextField
        label="Phone"
        fullWidth
        variant="outlined"
        value={formState.phone}
        onChange={handlePhoneChange}
        inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
        error={!!formState.phone && formState.phone.length !== 10}
        helperText={!!formState.phone && formState.phone.length !== 10 ? "Phone number must be 10 digits." : "10-digit mobile number."}
        sx={commonSx}
        InputProps={{
          startAdornment: <InputAdornment position="start"><Phone /></InputAdornment>,
        }}
        required
      />
      <TextField
        label="Address"
        fullWidth
        variant="outlined"
        value={formState.address}
        helperText="Customer's full residential address."
        onChange={(e) => onFormChange({ ...formState, address: e.target.value })}
        sx={commonSx}
        InputProps={{
          startAdornment: <InputAdornment position="start"><Home /></InputAdornment>,
        }}
        required
      />
    </Stack>
  );
};

export default CustomerFormFields;
