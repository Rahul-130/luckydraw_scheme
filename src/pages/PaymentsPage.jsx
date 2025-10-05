import React from 'react';
import { addPayment, getPayments, getCustomers, editPayment, deletePayment, getBook } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import { useSnackbar } from '../context/SnackbarContext';
import { List, ListItem, ListItemText } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Button, Container, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, MenuItem } from '@mui/material';
import { useEffect, useState } from 'react';


export default function PaymentsPage() {
    const {token} = useAuth();
    const {bookId, customerId} = useParams();
    const [payments, setPayments] = useState([]);
    const [customer, setCustomer] = useState(null);
    const [book, setBook] = useState(null);
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [form, setForm] = useState({ amount: '', monthIso: '', receiptNo: '' });
    const [editForm, setEditForm] = useState({ id: '', amount: '', monthIso: '', receiptNo: '' });
    const { showSnackbar } = useSnackbar();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState(null);
    const [is_frozen, setIsFrozen] = useState(false);

    useEffect(() => {
        // Fetch payments
        getPayments(bookId, customerId, token)
            .then(res => setPayments(res.data))
            .catch(() => setPayments([]));
        // Fetch customer info to check frozen status
        getCustomers(bookId, token)
            .then(response => {
                const cust = response.data.find(c => c.id === customerId);
                setCustomer(cust);
                setIsFrozen(cust?.isFrozen);
            });
        getBook(bookId, token).then(response => {
            setBook(response.data);
        });
    }, [bookId, customerId, token, is_frozen]);

    const handleCreate = async () => {
      try {
        
        await addPayment(bookId, customerId, form, token);
        setOpen(false);
        getPayments(bookId, customerId, token)
        .then(res => setPayments(res.data))
        .catch(() => setPayments([]));
      } catch (error) {
        showSnackbar(error.response?.data?.error || "Failed to add payment", 'error');
      }
    };

    const handleEdit = (payment) => {
        setEditForm(payment);
        setEditOpen(true);
    };

    const handleEditSave = async () => {
        await editPayment(bookId, customerId, editForm.id, editForm, token);
        setEditOpen(false);
        getPayments(bookId, customerId, token).then(res => setPayments(res.data));
    };

    const handleDelete = async (paymentId) => {
        setPaymentToDelete(paymentId);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!paymentToDelete) return;
        await deletePayment(bookId, customerId, paymentToDelete, token);
        setPaymentToDelete(null);
        setConfirmOpen(false);
        getPayments(bookId, customerId, token).then(res => setPayments(res.data));
    };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ my: 2 }}>
          Payments for {customer?.name}
        </Typography>
        <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
          Book: {book?.name}
        </Typography>
        <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={() => setOpen(true)}>Add Payment</Button> {/* Consistent margin */}
        <div style={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={payments}
            columns={[
              { field: 'id', headerName: 'ID', width: 90 },
              { field: 'amount', headerName: 'Amount', width: 150 },
              { field: 'monthIso', headerName: 'Month', width: 150 },
              { field: 'paymentDate', headerName: 'Date', width: 150 },
              { field: 'receiptNo', headerName: 'Receipt No.', width: 150 },
              {
                  field: 'actions',
                  headerName: 'Actions',
                  width: 200,
                  renderCell: (params) => (
                      <>
                          <Button variant="outlined" color="primary" size="small" onClick={() => handleEdit(params.row)}>Edit</Button>
                          <Button variant="outlined" color="error" size="small" onClick={() => handleDelete(params.row.id)}>Delete</Button>
                      </>
                  )
              }
            ]}
            pageSize={10}
          />
        </div>
        <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm"> {/* Added fullWidth and maxWidth */}
          <DialogTitle>Add Payment</DialogTitle>
          <DialogContent>
            {/* <TextField label="Amount" type="number" fullWidth margin="normal" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /> */}
            <TextField select label="Amount" fullWidth margin="normal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}>
                {[500, 1000, 1500, 2000, 2500].map((amt) => (
                  <MenuItem key={amt} value={amt}>
                    ₹ {amt}
                  </MenuItem>
                ))}
            </TextField>
            <TextField label="Receipt No." fullWidth margin="normal" value={form.receiptNo} onChange={e => setForm({ ...form, receiptNo: e.target.value })} />
            <DatePicker // Label already good
              label="Month"
              views={['year', 'month']}
              inputFormat="yyyy-MM"
              value={form.monthIso ? new Date(form.monthIso) : null}
              onChange={(newValue) => {
                if (newValue) {
                  const year = newValue.getFullYear();
                  const month = (newValue.getMonth() + 1).toString().padStart(2, '0');
                  setForm({ ...form, monthIso: `${year}-${month}` });
                } else {
                  setForm({ ...form, monthIso: '' });
                }
              }}
              renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} variant="contained">Create</Button>
          </DialogActions>
        </Dialog> {/* Added fullWidth and maxWidth */}
        <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Edit Payment</DialogTitle>
          <DialogContent>
              <TextField select label="Amount" fullWidth margin="normal" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}>
                  {[500, 1000, 1500, 2000, 2500].map((amt) => (
                    <MenuItem key={amt} value={amt}>
                      ₹ {amt}
                    </MenuItem>
                  ))}
              </TextField>
              <TextField label="Receipt No." fullWidth margin="normal" value={editForm.receiptNo} onChange={e => setEditForm({ ...editForm, receiptNo: e.target.value })} />
              <DatePicker // Label already good
                label="Month"
                views={['year', 'month']}
                inputFormat="yyyy-MM"
                value={editForm.monthIso ? new Date(editForm.monthIso) : null}
                onChange={(newValue) => {
                  if (newValue) {
                    const year = newValue.getFullYear();
                    const month = (newValue.getMonth() + 1).toString().padStart(2, '0');
                    setEditForm({ ...editForm, monthIso: `${year}-${month}` });
                  } else {
                    setEditForm({ ...editForm, monthIso: '' });
                  }
                }}
                renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
              />
          </DialogContent>
          <DialogActions>
              <Button onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleEditSave} variant="contained">Save</Button>
          </DialogActions>
        </Dialog> {/* Added fullWidth and maxWidth */}
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="xs">
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogContent>
                <Typography>Are you sure you want to delete this payment?</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
                <Button onClick={handleConfirmDelete} variant="contained" color="error">Delete</Button>
            </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  )
}
