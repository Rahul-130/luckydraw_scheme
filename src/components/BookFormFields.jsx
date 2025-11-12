import React from 'react';
import {
  TextField,
  Stack,
  InputAdornment,
  alpha,
  Paper,
  Typography,
  Divider,
  Box,
  Chip,
  Tooltip,
  SvgIcon,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Book, Groups, CalendarMonth } from '@mui/icons-material';
import ClipboardButton from './ClipboardButton';

const BookFormFields = ({ formState, onFormChange }) => {
  const IconBubble = ({ children }) => (
    <Box
      component="span"
      aria-hidden="true"
      sx={{
        width: 36,
        height: 36,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 1,
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
        color: (theme) => theme.palette.primary.main,
        mr: 1,
        flexShrink: 0,
        boxShadow: (theme) => `inset 0 -1px 0 ${alpha(theme.palette.common.black, 0.02)}`,
      }}
    >
      <SvgIcon fontSize="small">{children}</SvgIcon>
    </Box>
  );

  const PreviewChip = ({ label, fallback, color = 'default' }) => {
    const content = label ? String(label) : '';
    const short = content.length > 28 ? `${content.slice(0, 26)}…` : content || fallback;
    return (
      <Tooltip title={content || ''} placement="top">
        <Chip
          label={short}
          size="small"
          color={color}
          variant={content ? (color === 'primary' ? 'filled' : 'outlined') : 'outlined'}
          sx={{
            fontWeight: 600,
            maxWidth: 320,
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        />
      </Tooltip>
    );
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
        background: (theme) =>
          `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.96)}, ${alpha(
            theme.palette.background.default,
            0.98
          )})`,
      }}
      role="region"
      aria-label="Book details form"
    >
      {/* Header */}
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={1} alignItems="center" justifyContent="space-between" mb={1}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.2px' }}>
            Book details
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Provide the book name, capacity, and the first billing month.
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title="This value is for display & grouping only">
            <Chip label="Billing" size="small" sx={{ bgcolor: (t) => alpha(t.palette.primary.main, 0.08), border: 'none' }} />
          </Tooltip>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={3}>
        {/* Name Field */}
        <Box>
          <TextField
            autoFocus
            label="Name"
            fullWidth
            variant="outlined"
            value={formState.name}
            helperText="e.g., 'Morning Group' or 'Main Book' — useful for staff and receipts."
            onChange={(e) => onFormChange({ ...formState, name: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ mr: 1 }}>
                  <Book color="primary" />
                </InputAdornment>
              ),
            }}
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                transition: (theme) => theme.transitions.create(['box-shadow', 'transform', 'background-color']),
                '&:hover': {
                  boxShadow: (theme) => `0 6px 18px ${alpha(theme.palette.primary.main, 0.04)}`,
                },
                '&.Mui-focused': {
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.03),
                  boxShadow: (theme) => `0 8px 28px ${alpha(theme.palette.primary.main, 0.08)}`,
                  transform: 'translateY(-1px)',
                },
              },
            }}
            inputProps={{ 'aria-label': 'Book name' }}
          />
        </Box>

        {/* Max Customers */}
        <Box>
          <TextField
            label="Max Customers"
            type="number"
            fullWidth
            variant="outlined"
            value={formState.maxCustomers}
            helperText="The total number of customers this book can have. Use numeric values only."
            onChange={(e) => onFormChange({ ...formState, maxCustomers: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ mr: 1 }}>
                  <Groups color="primary" />
                </InputAdornment>
              ),
            }}
            inputProps={{ min: 1, 'aria-label': 'Maximum customers' }}
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                transition: (theme) => theme.transitions.create(['box-shadow', 'background-color']),
                '&:hover': {
                  boxShadow: (theme) => `0 6px 18px ${alpha(theme.palette.primary.main, 0.03)}`,
                },
                '&.Mui-focused': {
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.03),
                  boxShadow: (theme) => `0 8px 28px ${alpha(theme.palette.primary.main, 0.06)}`,
                },
              },
            }}
          />
        </Box>

        {/* Start Month Picker */}
        <Box>
          <DatePicker
            label="Start Month (YYYY-MM)"
            views={['year', 'month']}
            value={formState.startMonthIso ? new Date(formState.startMonthIso) : null}
            onChange={(newValue) => {
              const date = newValue instanceof Date && !isNaN(newValue) ? newValue : null;
              const year = date ? date.getFullYear() : '';
              const month = date ? (date.getMonth() + 1).toString().padStart(2, '0') : '';
              onFormChange({ ...formState, startMonthIso: newValue ? `${year}-${month}` : '' });
            }}
            components={{ OpenPickerIcon: CalendarMonth }}
            slotProps={{
              textField: {
                fullWidth: true,
                variant: 'outlined',
                required: true,
                helperText: 'The first month for which payments will be collected.',
                InputProps: {
                  startAdornment: (
                    <InputAdornment position="start" sx={{ mr: 1 }}>
                      <CalendarMonth color="primary" />
                    </InputAdornment>
                  ),
                },
                sx: {
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: (theme) => theme.transitions.create(['box-shadow', 'background-color']),
                    '&:hover': {
                      boxShadow: (theme) => `0 6px 18px ${alpha(theme.palette.primary.main, 0.03)}`,
                    },
                    '&.Mui-focused': {
                      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.03),
                      boxShadow: (theme) => `0 8px 28px ${alpha(theme.palette.primary.main, 0.06)}`,
                    },
                  },
                },
              },
            }}
          />
        </Box>

        {/* Compact preview chips for quick visual feedback */}
        <Box mt={0.5} display="flex" gap={1} flexWrap="wrap" alignItems="center" justifyContent="space-between">
          <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              Preview:
            </Typography>

            <PreviewChip label={formState.name} fallback="— name" color={formState.name ? 'primary' : 'default'} />

            <PreviewChip
              label={formState.maxCustomers ? `${formState.maxCustomers} customers` : ''}
              fallback="— capacity"
            />

            <PreviewChip label={formState.startMonthIso} fallback="— start month" />
          </Box>

          <ClipboardButton getText={() => JSON.stringify(formState, null, 2)} tooltip="Copy preview JSON" ariaLabel="Copy preview JSON" />
        </Box>
      </Stack>
    </Paper>
  );
};

export default BookFormFields;