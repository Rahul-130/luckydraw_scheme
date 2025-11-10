import React from 'react';
import { DialogContentText } from '@mui/material';
import PasswordInput from './PasswordInput';

/**
 * Reusable component for inputting either a password or an OTP/Recovery Code.
 * Used for security confirmations where one of these is sufficient.
 */
const PasswordOrRecoveryCodeOrOTP = ({
  passwordValue,
  onPasswordChange,
  otpValue,
  onOtpChange,
  descriptionText,
}) => {
  return (
    <>
      <DialogContentText sx={{ mb: 2 }}>
        {descriptionText || 'For your security, please enter your current password OR an OTP/Recovery code to proceed.'}
      </DialogContentText>
      <PasswordInput
        autoFocus
        margin="dense"
        label="Password (optional)"
        fullWidth
        variant="standard"
        value={passwordValue}
        onChange={onPasswordChange}
      />
      <PasswordInput
        margin="dense"
        label="OTP or Recovery Code (optional)"
        fullWidth
        variant="standard"
        value={otpValue}
        onChange={onOtpChange}
      />
    </>
  );
};

export default PasswordOrRecoveryCodeOrOTP;
