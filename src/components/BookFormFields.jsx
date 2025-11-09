import React from 'react';
import { TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const BookFormFields = ({ formState, onFormChange }) => {
  return (
    <>
      <TextField
        label="Name"
        fullWidth
        value={formState.name}
        onChange={(e) => onFormChange({ ...formState, name: e.target.value })}
      />
      <TextField
        label="Max Customers"
        type="number"
        fullWidth
        value={formState.maxCustomers}
        onChange={(e) => onFormChange({ ...formState, maxCustomers: e.target.value })}
      />
      <DatePicker
        label="Start Month (YYYY-MM)"
        views={["year", "month"]}
        value={formState.startMonthIso ? new Date(formState.startMonthIso) : null}
        onChange={(newValue) => {
          const year = newValue ? newValue.getFullYear() : '';
          const month = newValue ? (newValue.getMonth() + 1).toString().padStart(2, "0") : '';
          onFormChange({ ...formState, startMonthIso: newValue ? `${year}-${month}` : "" });
        }}
        slotProps={{ textField: { fullWidth: true } }}
      />
    </>
  );
};

export default BookFormFields;