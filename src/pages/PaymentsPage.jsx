import React, { useEffect, useState, useMemo } from 'react';
import { addPayment, getPayments, getCustomers, editPayment, deletePayment, getBook } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from '../context/SnackbarContext';
import { DataGrid } from '@mui/x-data-grid';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  MenuItem,
  Box,
  Paper,
  Stack,
  IconButton,
} from '@mui/material';
import { Add, Edit, Delete, ArrowBack } from "@mui/icons-material";


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
    const navigate = useNavigate();
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

    const getNextPaymentDetails = () => {
        if (!book || payments.length === 0) {
            // If no payments, default to book start month and no amount
            return { month: book?.startMonthIso || '', amount: '' };
        }

        // Find the most recent payment
        const sortedPayments = [...payments].sort((a, b) => b.monthIso.localeCompare(a.monthIso));
        const lastPayment = sortedPayments[0];

        // Calculate next month
        const [year, month] = lastPayment.monthIso.split('-').map(Number);
        const nextMonthDate = new Date(year, month, 1); // month is 0-indexed for Date object
        const nextYear = nextMonthDate.getFullYear();
        const nextMonth = (nextMonthDate.getMonth() + 1).toString().padStart(2, '0');

        return { month: `${nextYear}-${nextMonth}`, amount: lastPayment.amount };
    };

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

    const handleOpenAddDialog = () => {
        const { month, amount } = getNextPaymentDetails();
        setForm({
            amount: amount,
            monthIso: month,
            receiptNo: ''
        });
        setOpen(true);
    };

    const paymentSummary = useMemo(() => {
        const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const paymentCount = payments.length;
        return { totalAmount, paymentCount };
    }, [payments]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          minHeight: "100vh",
          py: 4,
          px: 2,
          background: "linear-gradient(to right, #f0f4f8, #d9e2ec)",
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <IconButton onClick={() => navigate(`/books/${bookId}/customers`)}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" component="h1" className='text-gray-800 font-bold justify-center flex flex-wrap items-center gap-1 w-full text-center'>
              <Box component="span" className='text-black font-semibold'>
                Payments
              </Box>
              <Box component="span" className='text-gray-500'>for customer</Box>
              <Box component="span" className='text-gray-700 font-semibold'>
                {customer?.name}
              </Box>
              <Typography variant="subtitle1" component="span" className='text-gray-500 pt-1'>
                (Book: {book?.name})
              </Typography>
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Button
              variant="contained"
              startIcon={<Add />}
              color="primary"
              onClick={handleOpenAddDialog}
              disabled={is_frozen}
            >
              Add Payment
            </Button>
          </Stack>

          <Paper elevation={3} sx={{ p: 1, mb: 1, borderRadius: 2, backgroundColor: 'primary.lightest' }}>
            <Stack direction="row" spacing={4} justifyContent="center">
              <Box textAlign="center">
                <Typography variant="h6" color="text.secondary">Total Payments</Typography>
                <Typography variant="h5" fontWeight="bold" color="primary.main">{paymentSummary.paymentCount}</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h6" color="text.secondary">Total Amount Paid</Typography>
                <Typography variant="h5" fontWeight="bold" color="primary.main">
                  ₹ {paymentSummary.totalAmount.toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper elevation={6} sx={{ p: 2, borderRadius: 3, backgroundColor: "#fff" }}>
            <Box sx={{ height: 500, width: "100%" }}>
              <DataGrid
                rows={payments}
                columns={[
                  { field: 'id', headerName: 'ID', width: 90 },
                  { field: 'amount', headerName: 'Amount', width: 150, valueFormatter: (params) => `₹ ${params}` },
                  { field: 'monthIso', headerName: 'Month', width: 150 },
                  { field: 'paymentDate', headerName: 'Date', width: 150 },
                  { field: 'receiptNo', headerName: 'Receipt No.', width: 150 },
                  {
                      field: 'actions',
                      headerName: 'Actions',
                      width: 150,
                      sortable: false,
                      renderCell: (params) => (
                        <Stack direction="row" spacing={0.5}>
                          <IconButton
                            onClick={() => handleEdit(params.row)}
                            sx={{
                                backgroundColor: "#e0f7fa",
                                "&:hover": { backgroundColor: "#b2ebf2", transform: "scale(1.05)" },
                                borderRadius: 1.5,
                                padding: 0.7,
                                color: "#0288d1",
                                transition: "all 0.2s",
                              }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDelete(params.row.id)}
                            sx={{
                                backgroundColor: "#ffebee",
                                "&:hover": { backgroundColor: "#ffcdd2", transform: "scale(1.05)" },
                                borderRadius: 1.5,
                                padding: 0.7,
                                color: "#d32f2f",
                                transition: "all 0.2s",
                              }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Stack>
                      )
                  }
                ]}
                pageSizeOptions={[5, 10, 20]}
                sx={{
                  "& .MuiDataGrid-row:hover": {
                    backgroundColor: "rgba(0, 123, 255, 0.08)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  },
                  "& .MuiDataGrid-row.Mui-even": { backgroundColor: "#f9f9f9" },
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: "#fff",
                    color: "#000",
                    fontWeight: "bold",
                  },
                  borderRadius: 2,
                  "& .MuiDataGrid-cell": { py: 1.2 },
                }}
              />
            </Box>
          </Paper>

        </Container>
      {/* Dialogs */}
        <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm"> {/* Added fullWidth and maxWidth */}
          <DialogTitle>Add Payment</DialogTitle>
          <DialogContent>
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
                disabled={true}
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
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogContent>
                <Typography>Are you sure you want to delete this payment?</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
                <Button onClick={handleConfirmDelete} variant="contained" color="error">Delete</Button>
            </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
}
