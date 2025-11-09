import React from 'react';
import {
  TextField,
  MenuItem,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const PaymentFormFields = ({ formState, onFormChange, isMonthDisabled = false }) => {
  const handleFieldChange = (field, value) => {
    onFormChange({ ...formState, [field]: value });
  };

  return (
    <>
      <TextField
        select
        label="Amount"
        fullWidth
        value={formState.amount}
        onChange={(e) => handleFieldChange('amount', e.target.value)}
      >
        {[500, 1000, 1500, 2000, 2500].map((amt) => (
          <MenuItem key={amt} value={amt}>
            ₹ {amt}
          </MenuItem>
        ))}
      </TextField>
      <FormControl component="fieldset">
        <FormLabel component="legend">Payment Type</FormLabel>
        <RadioGroup row value={formState.paymentType} onChange={(e) => handleFieldChange('paymentType', e.target.value)}>
          <FormControlLabel value="cash" control={<Radio />} label="Cash" />
          <FormControlLabel value="online" control={<Radio />} label="Online" />
          <FormControlLabel value="instore" control={<Radio />} label="In-Store Online" />
        </RadioGroup>
      </FormControl>
      <TextField label="Receipt No." fullWidth value={formState.receiptNo} onChange={(e) => handleFieldChange('receiptNo', e.target.value)} onFocus={(event) => event.target.select()} />
      <DatePicker
        label="Month"
        views={['year', 'month']}
        value={formState.monthIso ? new Date(formState.monthIso) : null}
        disabled={isMonthDisabled}
        onChange={(newValue) => {
          const year = newValue ? newValue.getFullYear() : '';
          const month = newValue ? (newValue.getMonth() + 1).toString().padStart(2, '0') : '';
          handleFieldChange('monthIso', newValue ? `${year}-${month}` : '');
        }}
        slotProps={{ textField: { fullWidth: true } }}
      />
    </>
  );
};

export default PaymentFormFields;
