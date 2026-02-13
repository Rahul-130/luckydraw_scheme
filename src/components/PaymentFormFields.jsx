import React from 'react';
import {
  TextField,
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
  Button,
  IconButton,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { CurrencyRupee, ReceiptLong, CalendarMonth, Add, Delete } from '@mui/icons-material';
import PreviewCopy from './PreviewCopyComponent';


const PaymentFormFields = ({ formState, onFormChange, isMonthDisabled = false }) => {
  const isSplitMode = Array.isArray(formState.splits);

  const handleFieldChange = (field, value) => {
    onFormChange({ ...formState, [field]: value });
  };

  const handleSplitChange = (index, field, value) => {
    const newSplits = [...formState.splits];
    newSplits[index] = { ...newSplits[index], [field]: value };
    onFormChange({ ...formState, splits: newSplits });
  };

  const addSplit = () => {
    onFormChange({
      ...formState,
      splits: [...formState.splits, { amount: '', paymentType: 'cash' }]
    });
  };

  const removeSplit = (index) => {
    if (formState.splits.length > 1) {
      const newSplits = formState.splits.filter((_, i) => i !== index);
      onFormChange({ ...formState, splits: newSplits });
    }
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

  const renderAmountField = (amount, onChange, label = "Amount") => (
    <TextField
      label={label}
      type="number"
      fullWidth
      variant="outlined"
      value={amount}
      onChange={(e) => onChange(e.target.value)}
      sx={commonSx}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start" sx={{ mr: 1 }}>
            <CurrencyRupee color="primary" />
          </InputAdornment>
        ),
      }}
      placeholder="Enter amount"
      required
    />
  );

  const renderPaymentType = (paymentType, onChange) => (
    <ToggleButtonGroup
      value={paymentType}
      exclusive
      onChange={(e, newVal) => {
        if (newVal !== null) onChange(newVal);
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
  );

  // Calculate derived values for preview
  const totalAmount = isSplitMode
    ? formState.splits.reduce((sum, s) => sum + Number(s.amount || 0), 0)
    : formState.amount;

  const activeSplits = isSplitMode ? formState.splits.filter(s => s.amount && Number(s.amount) > 0) : [];
  const displayPaymentType = isSplitMode
    ? (activeSplits.length > 1 
        ? activeSplits.map(s => `${s.paymentType} (${s.amount})`).join(' + ')
        : (activeSplits[0]?.paymentType || formState.paymentType))
    : formState.paymentType;

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
        {isSplitMode ? (
          <Box>
            <Stack spacing={2}>
              {formState.splits.map((split, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2" color="text.secondary">Split {index + 1}</Typography>
                      {formState.splits.length > 1 && (
                        <IconButton size="small" onClick={() => removeSplit(index)} color="error">
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                    {renderAmountField(split.amount, (val) => handleSplitChange(index, 'amount', val))}
                    {renderPaymentType(split.paymentType, (val) => handleSplitChange(index, 'paymentType', val))}
                  </Stack>
                </Paper>
              ))}
            </Stack>
            <Button
              startIcon={<Add />}
              onClick={addSplit}
              sx={{ mt: 2 }}
              variant="outlined"
              fullWidth
              size="small"
            >
              Add Payment Split
            </Button>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Typography fontWeight="bold">Total Amount</Typography>
              <Typography fontWeight="bold">₹ {totalAmount}</Typography>
            </Box>
          </Box>
        ) : (
          <>
            {/* Amount (select) */}
            <Box>
              {renderAmountField(formState.amount, (val) => handleFieldChange('amount', val))}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Enter the payment amount for the month.
              </Typography>
            </Box>

            {/* Payment Type */}
            <Box>
              {renderPaymentType(formState.paymentType, (val) => handleFieldChange('paymentType', val))}
            </Box>
          </>
        )}

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
        <PreviewCopy
          formState={{ ...formState, amount: totalAmount, paymentType: displayPaymentType }}
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
