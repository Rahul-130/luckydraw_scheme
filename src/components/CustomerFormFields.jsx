import React from 'react';
import { TextField } from '@mui/material';

const CustomerFormFields = ({ formState, onFormChange }) => {
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // keep only digits
    onFormChange({ ...formState, phone: value });
  };

  return (
    <>
      <TextField
        autoFocus
        label="Name"
        fullWidth
        value={formState.name}
        onChange={(e) => onFormChange({ ...formState, name: e.target.value })}
      />
      <TextField
        label="S/o, D/o, W/o"
        fullWidth
        value={formState.relationInfo}
        onChange={(e) => onFormChange({ ...formState, relationInfo: e.target.value })}
      />
      <TextField
        label="Phone"
        fullWidth
        value={formState.phone}
        onChange={handlePhoneChange}
        inputProps={{ minLength: 10, maxLength: 10, inputMode: "numeric", pattern: "[0-9]*" }}
        error={formState.phone.length > 0 && formState.phone.length !== 10}
        helperText={formState.phone.length > 0 && formState.phone.length !== 10 ? "Phone number must be exactly 10 digits" : ""}
      />
      <TextField
        label="Address"
        fullWidth
        value={formState.address}
        onChange={(e) => onFormChange({ ...formState, address: e.target.value })}
      />
    </>
  );
};

export default CustomerFormFields;
