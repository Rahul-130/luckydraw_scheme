import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getWinners, unmarkCustomerAsWinner } from '../services/api';
import { DataGrid } from '@mui/x-data-grid';
import { Container, Typography, Alert, Button, TextField, Dialog,
  DialogTitle,
  DialogContent,
  DialogActions } from '@mui/material';
import { useMemo } from 'react';
import { useSnackbar } from '../context/SnackbarContext';       


export default function WinnersListPage() {
    const { token } = useAuth();
    const [winners, setWinners] = useState([]);
    const [error, setError] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null, });

    useEffect(() => {
        if (token) {
            getWinners(token)
                .then(res => setWinners(res.data))
                .catch(err => {
                    setError(err.response?.data?.error || 'Failed to fetch winners');
                    setWinners([]);
                });
        }
    }, [token]);

    const handleUnmarkAsWinner = async (customer) => {
        const bookId = customer.bookId;
        const customerId = customer.customerId;
        console.log(customer);
        console.log(bookId, customerId);
    
        setConfirmDialog({
            open: true,
            title: `Unmark ${customer.customerName} as Winner`,
            message: `Are you sure you want to unmark ${customer.customerName} as a winner?`,
            onConfirm: async () => {
            try {
                await unmarkCustomerAsWinner(token, {
                    bookId,
                    customerId
                });
                showSnackbar(`Unmarked ${customer.customerName} as a winner!`, 'success');
                // Update the local state to remove the unmarked winner from the list
                setWinners(prev => prev.filter(c => c.id !== customer.id));
            } catch (err) {
                showSnackbar(err.response?.data?.error || 'Failed to unmark customer as winner', 'error');
            }
            }
        });  
    };

    const columns = useMemo(() => [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'customerName', headerName: 'Winner Name', width: 200 },
        { field: 'bookName', headerName: 'Book', width: 200 },
        { field: 'address', headerName: 'Address', width: 250 },
        { field: 'phone', headerName: 'Phone', width: 150 },
        { field: 'drawDate', headerName: 'Date Won', width: 150 },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 200,
            renderCell: (params) => {
                const customer = params.row;
                return (
                    <>
                        <Button
                        variant="contained"
                        color="warning"
                        onClick={() => handleUnmarkAsWinner(customer)}>
                        Unmark Winner
                        </Button>
                    </>
                );
            }
        }
    ], []);

    const { showSnackbar } = useSnackbar();

    return (
        <Container>
            <Typography variant="h4" sx={{ my: 4 }}>
                Lucky Draw Winners
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <div style={{ height: 400, width: '100%' }}>
                <DataGrid
                    rows={winners}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[10]}
                />
            </div>
            <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
                <DialogTitle>{confirmDialog.title}</DialogTitle>
                <DialogContent>
                    <Typography>{confirmDialog.message}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>Cancel</Button>
                    <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                        if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                        setConfirmDialog({ ...confirmDialog, open: false });
                    }}
                    >
                    Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
