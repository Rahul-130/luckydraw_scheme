import React from 'react';
import { TextField, Stack, InputAdornment, alpha } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Book, Groups, CalendarMonth } from '@mui/icons-material';

const BookFormFields = ({ formState, onFormChange }) => {
  return (
    <Stack spacing={3}> {/* Use Stack for consistent vertical spacing */}
      <TextField
        autoFocus // Automatically focus the first field
        label="Name"
        fullWidth
        variant="outlined" // Explicitly set variant for consistency
        value={formState.name}
        helperText="e.g., 'Morning Group' or 'Main Book'"
        sx={{
          '& .MuiOutlinedInput-root': {
            transition: (theme) => theme.transitions.create(['background-color', 'box-shadow']),
            '&.Mui-focused': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05) },
          },
        }}
        onChange={(e) => onFormChange({ ...formState, name: e.target.value })}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Book />
            </InputAdornment>
          ),
        }}
        required // Assuming name is required
      />
      <TextField
        label="Max Customers"
        type="number"
        fullWidth
        variant="outlined" // Explicitly set variant for consistency
        value={formState.maxCustomers}
        helperText="The total number of customers this book can have."
        sx={{
          '& .MuiOutlinedInput-root': {
            transition: (theme) => theme.transitions.create(['background-color', 'box-shadow']),
            '&.Mui-focused': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05) },
          },
        }}
        onChange={(e) => onFormChange({ ...formState, maxCustomers: e.target.value })}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Groups />
            </InputAdornment>
          ),
        }}
        inputProps={{ min: 1 }} // Ensure positive numbers
        required // Assuming maxCustomers is required
      />
      <DatePicker
        label="Start Month (YYYY-MM)"
        views={["year", "month"]}
        value={formState.startMonthIso ? new Date(formState.startMonthIso) : null}
        onChange={(newValue) => {
          // Ensure newValue is a valid Date object before extracting year/month
          const date = newValue instanceof Date && !isNaN(newValue) ? newValue : null;
          const year = date ? date.getFullYear() : '';
          const month = date ? (date.getMonth() + 1).toString().padStart(2, "0") : '';
          onFormChange({ ...formState, startMonthIso: newValue ? `${year}-${month}` : "" });
        }}
        components={{ OpenPickerIcon: CalendarMonth }}
        slotProps={{
          textField: {
            fullWidth: true,
            variant: "outlined",
            required: true,
            helperText: "The first month for which payments will be collected.",
            sx: { '& .MuiOutlinedInput-root': { transition: (theme) => theme.transitions.create(['background-color', 'box-shadow']), '&.Mui-focused': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05) } } }
          }
        }} // Consistent variant and required
      />
    </Stack>
  );
};

export default BookFormFields;