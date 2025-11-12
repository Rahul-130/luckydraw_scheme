import React from 'react';
import {
  TextField,
  MenuItem,
  Stack,
  InputAdornment,
  alpha,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Box,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { CurrencyRupee, ReceiptLong, CalendarMonth } from '@mui/icons-material';

const PaymentFormFields = ({ formState, onFormChange, isMonthDisabled = false }) => {
  const handleFieldChange = (field, value) => {
    onFormChange({ ...formState, [field]: value });
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
        select
        label="Amount"
        fullWidth
        variant="outlined"
        value={formState.amount}
        helperText="Select the payment amount for the month."
        onChange={(e) => handleFieldChange('amount', e.target.value)}
        sx={commonSx}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <CurrencyRupee />
            </InputAdornment>
          ),
        }}
        required
      >
        {[500, 1000, 1500, 2000, 2500].map((amt) => (
          <MenuItem key={amt} value={amt}>
            ₹ {amt}
          </MenuItem>
        ))}
      </TextField>
      <Box>
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1 }}>
          Payment Type
        </Typography>
        <ToggleButtonGroup
          color="primary"
          value={formState.paymentType}
          exclusive
          onChange={(e, newValue) => {
            if (newValue !== null) {
              handleFieldChange('paymentType', newValue);
            }
          }}
          aria-label="Payment Type"
          fullWidth
        >
          <ToggleButton value="cash">Cash</ToggleButton>
          <ToggleButton value="online">Online</ToggleButton>
          <ToggleButton value="instore">In-Store</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <TextField
        label="Receipt No."
        fullWidth
        variant="outlined"
        value={formState.receiptNo}
        helperText="Auto-generated unique receipt number."
        onChange={(e) => handleFieldChange('receiptNo', e.target.value)}
        onFocus={(event) => event.target.select()}
        sx={commonSx}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <ReceiptLong />
            </InputAdornment>
          ),
        }}
        required
      />
      <DatePicker
        label="Month"
        views={['year', 'month']}
        value={formState.monthIso ? new Date(formState.monthIso) : null}
        disabled={isMonthDisabled}
        components={{ OpenPickerIcon: CalendarMonth }}
        onChange={(newValue) => {
          const year = newValue ? newValue.getFullYear() : '';
          const month = newValue ? (newValue.getMonth() + 1).toString().padStart(2, '0') : '';
          handleFieldChange('monthIso', newValue ? `${year}-${month}` : '');
        }}
        slotProps={{ textField: { fullWidth: true, variant: "outlined", required: true, sx: commonSx, helperText: "The month for which this payment is being made." } }}
      />
    </Stack>
  );
};

export default PaymentFormFields;
