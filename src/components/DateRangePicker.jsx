import React from 'react';
import { Paper, Button } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const DateRangePicker = ({ dateRange, onDateRangeChange }) => {
  const handleReset = () => {
    // Directly set the state to its initial value
    onDateRangeChange({ start: null, end: null });
  };

  return (
    <Paper sx={{ p: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, borderRadius: 2, alignItems: 'center' }}>
      <DatePicker
        label="Start Date"
        value={dateRange.start}
        onChange={(newValue) => onDateRangeChange(prev => ({ ...prev, start: newValue }))}
        slotProps={{ textField: { size: 'small' } }}
      />
      <DatePicker
        label="End Date"
        value={dateRange.end}
        onChange={(newValue) => onDateRangeChange(prev => ({ ...prev, end: newValue }))}
        slotProps={{ textField: { size: 'small' } }}
      />
      <Button
        onClick={handleReset}
        variant="outlined"
        size="medium"
        disabled={!dateRange.start && !dateRange.end}
      >
        Reset
      </Button>
    </Paper>
  );
};

export default DateRangePicker;
