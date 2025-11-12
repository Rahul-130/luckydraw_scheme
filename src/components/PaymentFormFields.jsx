import React from 'react';
import {
  TextField,
  MenuItem,
  Stack,
  InputAdornment,
  alpha,
  Paper,
  Typography,
  Box,
  Chip,
  Tooltip,
  SvgIcon,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { CurrencyRupee, ReceiptLong, CalendarMonth } from '@mui/icons-material';
import PreviewCopy from './PreviewCopyComponent';


const PaymentFormFields = ({ formState, onFormChange, isMonthDisabled = false }) => {
  const handleFieldChange = (field, value) => {
    onFormChange({ ...formState, [field]: value });
  };

  const IconBubble = ({ children }) => (
    <Box
      component="span"
      aria-hidden="true"
      sx={{
        width: 40,
        height: 40,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 1.5,
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.10),
        color: (theme) => theme.palette.primary.main,
        mr: 1.25,
        flexShrink: 0,
      }}
    >
      <SvgIcon fontSize="small">{children}</SvgIcon>
    </Box>
  );

  const commonSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      transition: (theme) => theme.transitions.create(['background-color', 'box-shadow'], { duration: 180 }),
      '&.Mui-focused': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.03) },
      '&:hover': { boxShadow: (theme) => `0 10px 28px ${alpha(theme.palette.primary.main, 0.03)}` },
    },
  };

  const PreviewChip = ({ label, fallback }) => (
    <Tooltip title={label || ''}>
      <Chip
        label={label ? label : fallback}
        size="small"
        variant={label ? 'filled' : 'outlined'}
        color={label ? 'primary' : 'default'}
        sx={{ fontWeight: 600, maxWidth: 220, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
      />
    </Tooltip>
  );

  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
        background: (theme) => `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(theme.palette.background.default, 0.995)})`,
      }}
      role="region"
      aria-label="Payment form"
    >
      <Box mb={1}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Payment
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Record a payment — amount, payment type, receipt number and month.
        </Typography>
      </Box>

      <Stack spacing={3}>
        {/* Amount (select) */}
        <Box>
          <TextField
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
                <InputAdornment position="start" sx={{ mr: 1 }}>
                  <CurrencyRupee color="primary" />
                </InputAdornment>
              ),
            }}
            placeholder="Enter or select amount"
            required
          >
            {[500, 1000, 1500, 2000, 2500].map((amt) => (
              <MenuItem key={amt} value={amt}>
                ₹ {amt}
              </MenuItem>
            ))}
            <MenuItem
              value={formState.amount}
              sx={{
                display:
                  formState.amount && ![500, 1000, 1500, 2000, 2500].includes(Number(formState.amount))
                    ? 'block'
                    : 'none',
              }}
            >
              Custom: ₹ {formState.amount}
            </MenuItem>
          </TextField>
        </Box>

        {/* Payment Type — ToggleButtonGroup (single-column structure like previous) */}
        <Box>
          <ToggleButtonGroup
            value={formState.paymentType}
            exclusive
            onChange={(e, newVal) => {
              if (newVal !== null) handleFieldChange('paymentType', newVal);
            }}
            aria-label="Payment Type"
            fullWidth
            sx={{
              '& .MuiToggleButton-root': {
                textTransform: 'none',
                borderRadius: 1.5,
                padding: '8px 12px',
                fontWeight: 600,
              },
              '& .MuiToggleButton-root.Mui-selected': {
                boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.08)}`,
              },
            }}
          >
            <ToggleButton value="cash" aria-label="Cash payment">
              Cash
            </ToggleButton>
            <ToggleButton value="online" aria-label="Online payment">
              Online
            </ToggleButton>
            <ToggleButton value="instore" aria-label="In-Store payment">
              In-Store
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Receipt No */}
        <Box>
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
                <InputAdornment position="start" sx={{ mr: 1 }}>
                  <ReceiptLong color="primary" />
                </InputAdornment>
              ),
            }}
            required
          />
        </Box>

        {/* Month picker */}
        <Box>
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
            slotProps={{
              textField: {
                fullWidth: true,
                variant: 'outlined',
                required: true,
                sx: commonSx,
                helperText: 'The month for which this payment is being made.',
                InputProps: {
                  startAdornment: (
                    <InputAdornment position="start" sx={{ mr: 1 }}>
                      <CalendarMonth color="primary" />
                    </InputAdornment>
                  ),
                },
              },
            }}
          />
        </Box>

        {/* Preview + copy */}
        {/* <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" justifyContent="space-between" mt={0.25}>
          <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              Preview:
            </Typography>

            <PreviewChip label={formState.amount ? `₹ ${formState.amount}` : ''} fallback="— amount" />

            <PreviewChip label={formState.paymentType ? formState.paymentType : ''} fallback="— type" />

            <PreviewChip label={formState.monthIso ? formState.monthIso : ''} fallback="— month" />

            <PreviewChip label={formState.receiptNo ? formState.receiptNo : ''} fallback="— receipt" />
          </Box>

          <ClipboardButton getText={() => JSON.stringify(formState, null, 2)} tooltip="Copy payment JSON" ariaLabel="Copy payment JSON" />
        </Box> */}
        <PreviewCopy
          formState={formState}
          fields={[
            { key: 'amount', fallback: '— amount', formatter: (v) => `₹ ${v}` },
            { key: 'paymentType', fallback: '— type' },
            { key: 'monthIso', fallback: '— month' },
            { key: 'receiptNo', fallback: '— receipt' },
          ]}
        />

      </Stack>
    </Paper>
  );
};

export default PaymentFormFields;
