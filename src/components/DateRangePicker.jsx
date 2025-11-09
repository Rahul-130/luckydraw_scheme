import React from 'react';
import { Paper } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const DateRangePicker = ({ dateRange, onDateRangeChange }) => {
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
    </Paper>
  );
};

export default DateRangePicker;
