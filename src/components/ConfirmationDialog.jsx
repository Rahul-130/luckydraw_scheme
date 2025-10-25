import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
} from '@mui/material';
import { WarningAmber } from '@mui/icons-material';

const ConfirmationDialog = ({
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmColor = 'primary'
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 'bold' }}>
                <WarningAmber color={confirmColor === 'error' ? 'error' : 'warning'} fontSize="large" />
                <Box>{title}</Box>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body1" sx={{ mt: 1, color: 'text.secondary' }}>{message}</Typography>
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px' }}>
                <Button onClick={onClose} variant="outlined">
                    {cancelText}
                </Button>
                <Button onClick={onConfirm} variant="contained" color={confirmColor} autoFocus>
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmationDialog;
