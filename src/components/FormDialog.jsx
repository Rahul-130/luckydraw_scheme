import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';

const FormDialog = ({ open, onClose, title, onSubmit, children, submitText = 'Submit', isSubmitDisabled = false }) => {
  const handleSubmit = (event) => {
    event.preventDefault(); // Prevent default form submission (page reload)
    if (!isSubmitDisabled) {
      onSubmit();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ component: 'form', onSubmit: handleSubmit }}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {children}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {/* The `type="submit"` is crucial here. It triggers the form's onSubmit event. */}
        <Button type="submit" variant="contained" disabled={isSubmitDisabled}>
          {submitText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormDialog;
