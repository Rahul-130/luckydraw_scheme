import React, { useState, useMemo, useCallback } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSnackbar } from "../context/SnackbarContext";
import { addCustomer, getCustomers, editCustomer, deleteCustomer } from "../services/api";
import { useCustomers } from "../hooks/useCustomers";
import { useBooks } from "../hooks/useBooks";
import { DataGrid } from '@mui/x-data-grid';
import { Button, Container, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import { useNavigate } from 'react-router-dom';

export default function CustomersPage() {

    const {token} = useAuth();
    const {bookId} = useParams();
    const { customers, loading: customersLoading, error: customersError, refetch: refetchCustomers } = useCustomers(bookId);
    const { books } = useBooks();
    const book = books.find(b => b.id === bookId);
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [form, setForm] = useState({
        name: '',
        phone: '',
        address: ''
    });
    const [editForm, setEditForm] = useState({ id: '', name: '', phone: '', address: '' });
    const { showSnackbar } = useSnackbar();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const navigate = useNavigate();

    const handleCreate = async () => {
      try {
        await addCustomer(bookId, form, token);
        setOpen(false);
        refetchCustomers();
      } catch (error) {
        showSnackbar(error.response?.data?.error || "Failed to add customer", 'error');
      }
    };

    const handleEdit = useCallback((customer) => {
        setEditForm(customer);
        setEditOpen(true);
    }, []);

    const handleEditSave = async () => {
        await editCustomer(bookId, editForm.id, editForm, token);
        setEditOpen(false);
        refetchCustomers();
    };

    const handleDelete = useCallback((customerId) => {
        setCustomerToDelete(customerId);
        setConfirmOpen(true);
    }, []);

    const handleConfirmDelete = async () => {
        if (!customerToDelete) return;
      try {
        await deleteCustomer(bookId, customerToDelete, token);
      } catch (error) {
        showSnackbar(error.response?.data?.error || "Failed to delete customer", 'error');
      }
        setCustomerToDelete(null);
        setConfirmOpen(false);
        refetchCustomers();
    };

    const columns = useMemo(() => [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'name', headerName: 'Name', width: 200 },
        { field: 'phone', headerName: 'Phone', width: 150 },
        { field: 'address', headerName: 'Address', width: 200 },
        {
            field: 'status',
            headerName: 'Status',
            width: 150,
            renderCell: (params) => {
                if (params.row.isFrozen) {
                    return <Typography color="success.main">Winner</Typography>;
                } 
                console.log("missedpayments", params.row.missedPayments)
                console.log(params.row.totalMonths, params.row.paymentCount)
    
                if (params.row.missedPayments > 1) {
                    return <Typography color="error">Not Eligible</Typography>;
                }

                return <Typography color="primary">Eligible</Typography>;
            }    
        },

        {
            field: 'actions',
            headerName: 'Actions',
            width: 350,
            renderCell: (params) => (
                <>
                    <Button
                        variant="outlined"
                        color="success"
                        size="small"
                        onClick={() => navigate(`/books/${bookId}/customers/${params.row.id}/payments`)}
                        style={{ marginRight: 8 }}
                    >
                        View Payments
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => handleEdit(params.row)}
                        style={{ marginRight: 8 }}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDelete(params.row.id)}
                    >
                        Delete
                    </Button>
                </>
            )
        }
    ], [bookId, navigate, handleEdit, handleDelete]);

  return (
    <Container maxWidth="lg">
        {/* ... existing JSX ... */}
        <Typography variant="h4" sx={{ my: 2 }}>
            Customers
        </Typography>
        <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
            Book: {book?.name}
        </Typography>
        <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={() => setOpen(true)}>Add Customer</Button> {/* Consistent margin */}
        <div style={{ height: 400, width: '100%' }}>
            <DataGrid
                rows={customers}
                columns={columns}
                loading={customersLoading}
                pageSizeOptions={[5, 10, 20]} // Added pageSizeOptions
            />
        </div>
        <Dialog open={open} onClose={() => setOpen(false)}>
            <DialogTitle>Add Customer to "{book?.name}"</DialogTitle>
            <DialogContent>
                <TextField
                    label="Name"
                    fullWidth
                    margin="normal"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                />

                <TextField
                    label="Phone"
                    fullWidth
                    margin="normal"
                    value={form.phone}
                    onChange={e => {
                    const value = e.target.value.replace(/\D/g, ""); // keep only digits
                    setForm({ ...form, phone: value });
                    }}
                    inputProps={{ minLength: 10, maxLength: 10, inputMode: "numeric", pattern: "[0-9]*" }}
                    error={form.phone.length > 0 && form.phone.length !== 10}
                    helperText={
                    form.phone.length > 0 && form.phone.length !== 10
                        ? "Phone number must be exactly 10 digits"

                        : ""
                    }
                />

                <TextField
                    label="Address"
                    fullWidth
                    margin="normal"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                />

                </DialogContent>

                <DialogActions>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                    onClick={handleCreate}
                    variant="contained"
                    disabled={
                    !form.name.trim() ||               // name required
                    !form.address.trim() ||            // address required
                    form.phone.length !== 10           // phone must be 10 digits
                    }
                >
                    Create
                </Button>

                </DialogActions>

        </Dialog>
        <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm"> {/* Added fullWidth and maxWidth */}
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogContent>
                <TextField label="Name" fullWidth margin="normal" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                <TextField label="Phone" fullWidth margin="normal" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                <TextField label="Address" fullWidth margin="normal" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button onClick={handleEditSave} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
        {/* Delete Confirmation Dialog */}
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogContent>
                <Typography>Are you sure you want to delete this customer and all their payments?</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
                <Button onClick={handleConfirmDelete} variant="contained" color="error">Delete</Button>
            </DialogActions>
        </Dialog>
    </Container>
  )
}
