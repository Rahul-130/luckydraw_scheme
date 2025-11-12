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
  IconButton,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Person, SupervisorAccount, Phone, Home } from '@mui/icons-material';
import ClipboardButton from './ClipboardButton';

/**
 * Visual-only enhancement of CustomerFormFields with copy-to-clipboard button.
 * - No logic changes (formState, onFormChange remain identical)
 * - ClipboardButton copies JSON.stringify(formState, null, 2)
 */
const CustomerFormFields = ({ formState, onFormChange }) => {
  // keep your phone handling logic untouched
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // keep only digits
    if (value.length <= 10) {
      onFormChange({ ...formState, phone: value });
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
        boxShadow: (theme) => `inset 0 -1px 0 ${alpha(theme.palette.common.black, 0.02)}`,
      }}
    >
      <SvgIcon fontSize="small">{children}</SvgIcon>
    </Box>
  );

  const commonSx = {
    '& .MuiOutlinedInput-root': {
      transition: (theme) => theme.transitions.create(['background-color', 'box-shadow'], { duration: 180 }),
      '&.Mui-focused': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.03) },
      '&:hover': { boxShadow: (theme) => `0 8px 26px ${alpha(theme.palette.primary.main, 0.03)}` },
      borderRadius: 2,
    },
  };

  const PreviewChip = ({ label, fallback }) => (
    <Tooltip title={label || ''}>
      <Chip
        label={label ? label : fallback}
        size="small"
        variant={label ? 'filled' : 'outlined'}
        color={label ? 'primary' : 'default'}
        sx={{
          fontWeight: 600,
          maxWidth: 240,
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
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
        background: (theme) =>
          `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(
            theme.palette.background.default,
            0.995
          )})`,
      }}
      role="region"
      aria-label="Customer details form"
    >
      {/* Header */}
      <Box mb={1}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Customer Details
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Add a new customer — their name, relation, contact number and address.
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={3}>
        {/* Name */}
        <Box>
          <TextField
            autoFocus
            label="Name"
            fullWidth
            variant="outlined"
            value={formState.name}
            helperText="Enter the customer's full name."
            onChange={(e) => onFormChange({ ...formState, name: e.target.value })}
            sx={commonSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ mr: 1 }}>
                  <Person color="primary" />
                </InputAdornment>
              ),
            }}
            required
            inputProps={{ 'aria-label': 'Customer name' }}
          />
        </Box>

        {/* Relation */}
        <Box>
          <TextField
            label="S/o, D/o, W/o"
            fullWidth
            variant="outlined"
            value={formState.relationInfo}
            helperText="e.g., Father's name or Husband's name. Optional."
            onChange={(e) => onFormChange({ ...formState, relationInfo: e.target.value })}
            sx={commonSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ mr: 1 }}>
                  <SupervisorAccount color="primary" />
                </InputAdornment>
              ),
            }}
            inputProps={{ 'aria-label': 'Relation information' }}
          />
        </Box>

        {/* Phone */}
        <Box>
          <TextField
            label="Phone"
            fullWidth
            variant="outlined"
            value={formState.phone}
            onChange={handlePhoneChange}
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', 'aria-label': 'Phone number' }}
            error={!!formState.phone && formState.phone.length !== 10}
            helperText={!!formState.phone && formState.phone.length !== 10 ? 'Phone number must be 10 digits.' : '10-digit mobile number.'}
            sx={commonSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ mr: 1 }}>
                  <Phone color="primary" />
                </InputAdornment>
              ),
            }}
            required
          />
        </Box>

        {/* Address */}
        <Box>
          <TextField
            label="Address"
            fullWidth
            variant="outlined"
            value={formState.address}
            helperText="Customer's full residential address."
            onChange={(e) => onFormChange({ ...formState, address: e.target.value })}
            sx={commonSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ mr: 1 }}>
                  <Home color="primary" />
                </InputAdornment>
              ),
            }}
            required
            inputProps={{ 'aria-label': 'Customer address' }}
          />
        </Box>

        {/* Preview chips + copy button */}
        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" justifyContent="space-between" mt={0.25}>
          <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              Preview:
            </Typography>

            <PreviewChip label={formState.name} fallback="— name" />

            <PreviewChip label={formState.phone ? `${formState.phone}` : ''} fallback="— phone" />

            <PreviewChip label={formState.address} fallback="— address" />
          </Box>

          <ClipboardButton getText={() => JSON.stringify(formState, null, 2)} tooltip="Copy preview JSON" ariaLabel="Copy preview JSON" />
        </Box>
      </Stack>
    </Paper>
  );
};

export default CustomerFormFields;
