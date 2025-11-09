import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
} from '@mui/material';

const FormDialog = ({ open, onClose, title, onSubmit, submitText = 'Save', children, isSubmitDisabled = false }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {children}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSubmit} variant="contained" disabled={isSubmitDisabled}>
          {submitText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormDialog;
