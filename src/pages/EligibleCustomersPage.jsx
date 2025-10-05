import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEligibleCustomers, markCustomerAsWinner } from '../services/api';
import { DataGrid } from '@mui/x-data-grid';
import { Container, Typography, Alert, Button, TextField, Dialog,
  DialogTitle,
  DialogContent,
  DialogActions } from '@mui/material';
import { useSnackbar } from '../context/SnackbarContext';


// Add the manuall winner to the winner page
export default function EligibleCustomersPage() {
    const { token } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null, });

    useEffect(() => {
        if (token) {
            getEligibleCustomers(token)
                .then(res => setCustomers(res.data))
                .catch(err => {
                    setError(err.response?.data?.error || 'Failed to fetch eligible customers');
                    setCustomers([]);
                });
        }
    }, [token]);

    const { showSnackbar } = useSnackbar();

    const handleMarkAsWinner = async (customer) => {
        const [bookId, customerId] = customer.id.split('-').map(Number);
        setConfirmDialog({
            open: true,
            title: `Mark ${customer.customerName} as Winner`,
            message: `Are you sure you want to mark ${customer.customerName} as a winner?`,
            onConfirm: async () => {
            try {
                await markCustomerAsWinner(token, {
                    bookId,
                    customerId,
                    bookName: customer.bookName,
                    customerName: customer.customerName,
                    address: customer.address,
                    phone: customer.phone
                });
                showSnackbar(`Marked ${customer.customerName} as a winner!`, 'success');
                // Update the local state to remove the marked winner from the list
                setCustomers(prev => prev.filter(c => c.id !== customer.id));
            } catch (err) {
                showSnackbar(err.response?.data?.error || 'Failed to mark customer as winner', 'error');
            }
            }
        });
        
    };

    



    const columns = useMemo(() => [

        { field: 'bookName', headerName: 'Book Name', width: 200 },
        { field: 'customerName', headerName: 'Customer Name', width: 200 },
        { field: 'phone', headerName: 'Phone', width: 150 },
        { field: 'address', headerName: 'Address', width: 300 },
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
                        color="success"
                        onClick={() => handleMarkAsWinner(customer)}
                        sx={{ mr: 1 }}
                        >
                        Mark as Winner
                        </Button>
                    </>
                );
            }
        }
    ], []);

    if (error) {
        showSnackbar(error, 'error');
    }


    return (
        <Container>
            <Typography variant="h4" sx={{ my: 4 }}>
                Eligible for Lucky Draw
            </Typography>

            <div style={{ height: 400, width: '100%' }}>
                <DataGrid
                    rows={customers}
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
