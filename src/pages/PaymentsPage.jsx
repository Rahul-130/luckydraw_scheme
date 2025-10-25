import React, { useEffect, useState, useMemo } from 'react';
import { addPayment, getPayments, getCustomers, editPayment, deletePayment, getBook } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { createRoot } from 'react-dom/client';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from '../context/SnackbarContext';
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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  ButtonGroup,
} from '@mui/material';
import { alpha } from "@mui/material/styles";
import { Add, Edit, Delete, ArrowBack, Print } from "@mui/icons-material";
import BulkPaymentReceipt from '../components/BulkPaymentReceipt';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import StyledDataGrid from '../components/StyledDataGrid';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { sendWhatsAppMessage } from '../utils/whatsapp';


export default function PaymentsPage() {
    const {token} = useAuth();
    const {bookId, customerId} = useParams();
    const [payments, setPayments] = useState([]);
    const [customer, setCustomer] = useState(null);
    const [book, setBook] = useState(null);
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [form, setForm] = useState({ amount: '', monthIso: '', receiptNo: '', paymentType: 'online' });
    const [editForm, setEditForm] = useState({ id: '', amount: '', monthIso: '', receiptNo: '', paymentType: 'online'});
    const { showSnackbar } = useSnackbar();
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
    const navigate = useNavigate();
    const [is_frozen, setIsFrozen] = useState(false);
    const [selectionModel, setSelectionModel] = useState([]);

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

    const handleDelete = (paymentId) => {
        setConfirmDialog({
            open: true,
            title: 'Confirm Payment Deletion',
            message: 'Are you sure you want to delete this payment? This action cannot be undone.',
            onConfirm: async () => {
                try {
                    await deletePayment(bookId, customerId, paymentId, token);
                    getPayments(bookId, customerId, token).then(res => setPayments(res.data));
                    showSnackbar('Payment deleted successfully.', 'success');
                } catch (err) { showSnackbar(err.response?.data?.error || 'Failed to delete payment.', 'error'); }
            }
        });
    };

    const handleOpenAddDialog = () => {
        const { month, amount } = getNextPaymentDetails();
        // Auto-generate a unique receipt number
        const uniqueReceiptNo = `R-${customerId}-${Date.now()}`;
        setForm({
            amount: amount,
            monthIso: month,
            receiptNo: uniqueReceiptNo,
            paymentType: 'online' // Default to online
        });
        setOpen(true);
    };

    const handlePrint = (payment) => {
        const printWindow = window.open('', '_blank', 'height=600,width=800');

        // Find all stylesheet links in the current document and copy them to the new window
        const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
            .map(style => style.outerHTML)
            .join('');

        printWindow.document.write(`
            <html>
                <head><title>Payment Receipt</title>${styles}</head>
                <body><div id="print-root"></div></body>
            </html>`);
        printWindow.document.close();
        
        const printRoot = printWindow.document.getElementById('print-root');
        const root = createRoot(printRoot);
        root.render(<PaymentReceipt payment={payment} customer={customer} book={book} />);
        
        // Wait for the component to render before printing
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500); // A short delay to ensure rendering is complete
    };

    const handlePrintSelected = () => {
        const selectedPayments = payments.filter(p => selectionModel.includes(p.id));
        if (selectedPayments.length === 0) {
            showSnackbar('No payments selected to print.', 'warning');
            return;
        }

        const printWindow = window.open('', '_blank', 'height=800,width=600');
        const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
            .map(style => style.outerHTML)
            .join('');

        printWindow.document.write(`<html><head><title>Consolidated Receipt</title>${styles}</head><body><div id="print-root"></div></body></html>`);
        printWindow.document.close();

        const printRoot = printWindow.document.getElementById('print-root');
        const root = createRoot(printRoot);
        root.render(<BulkPaymentReceipt payments={selectedPayments} customer={customer} book={book} />);

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    const handleSendWhatsApp = () => {
        const selectedPayments = payments.filter(p => selectionModel.includes(p.id));
        if (selectedPayments.length === 0) {
            showSnackbar('No payments selected to send.', 'warning');
            return;
        }
    
        const totalAmount = selectedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    
        const message = `Hello ${customer.name}, here is a summary of your recent payments for book "${book.name}":\n\n` +
            selectedPayments.map(p => `- Receipt ${p.receiptNo} for ${p.monthIso}: ₹${Number(p.amount).toLocaleString('en-IN')}`).join('\n') +
            `\n\nTotal Paid: ₹${totalAmount.toLocaleString('en-IN')}\n\nThank you!`;
        
        sendWhatsAppMessage(customer.phone, message);
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
            <IconButton onClick={() => navigate(`/books/${bookId}/customers`)} sx={{ color: '#000' }}>
              <ArrowBack />
            </IconButton>
            <Typography
              variant="h5"
              component="h1"
              sx={{
                color: 'text.primary',
                fontWeight: 'bold',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                width: '100%',
                textAlign: 'center',
              }}
            >
              <Box component="span" sx={{ fontWeight: 'bold', color:"#000"}}>
                Payments
              </Box>
              <Box component="span" sx={{ color: '#000' }}>for customer</Box>
              <Box component="span" sx={{ color: '#000', fontWeight: 'semibold' }}>
                {customer?.name}
              </Box>
              <Typography variant="subtitle1" component="span" sx={{ color: '#001', pt: 0.5 }}>
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
            <ButtonGroup variant="outlined" aria-label="outlined button group">
              <Button
                startIcon={<Print />}
                onClick={handlePrintSelected}
                disabled={selectionModel.length === 0}
              >
                Print ({selectionModel.length})
              </Button>
              <Button
                onClick={handleSendWhatsApp}
                disabled={selectionModel.length === 0}
                color="success"
              >
                Send Receipt
              </Button>
            </ButtonGroup>
          </Stack>

          <Paper elevation={3} sx={{ p: 1, mb: 1, borderRadius: 2, backgroundColor: 'primary.lightest' }}>
            <Stack direction="row" spacing={4} justifyContent="center">
              <Box textAlign="center" sx={{ flex: 1 }}>
                <Typography variant="h6" color="text.secondary">Total Payments</Typography>
                <Typography variant="h5" fontWeight="bold" color="primary.main">{paymentSummary.paymentCount}</Typography>
              </Box>
              <Box textAlign="center" sx={{ flex: 1 }}>
                <Typography variant="h6" color="text.secondary">Total Amount Paid</Typography>
                <Typography variant="h5" fontWeight="bold" color="primary.main">
                  ₹ {paymentSummary.totalAmount.toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper elevation={6} sx={{ p: 2, borderRadius: 3, backgroundColor: "#fff" }}>
            <Box sx={{ height: 500, width: "100%" }}>
              <StyledDataGrid
                rows={payments}
                checkboxSelection
                onRowSelectionModelChange={(newSelectionModel) => setSelectionModel(newSelectionModel)}
                rowSelectionModel={selectionModel}
                columns={[
                  { field: 'id', headerName: 'ID', width: 90 },
                  { field: 'amount', headerName: 'Amount', width: 150, valueFormatter: (params) => `₹ ${params}` },
                  { field: 'monthIso', headerName: 'Month', width: 150 },
                  { 
                    field: 'paymentDate', 
                    headerName: 'Date', 
                    width: 200, 
                    valueFormatter: (value) => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ''
                  },
                  { field: 'receiptNo', headerName: 'Receipt No.', width: 150 },
                  { field: 'paymentType', headerName: 'Type', width: 120 },
                  {
                      field: 'actions',
                      headerName: 'Actions',
                      width: 200,
                      sortable: false,
                      renderCell: (params) => (
                        <Stack direction="row" spacing={0.5}>
                          <IconButton
                            onClick={() => handleEdit(params.row)}
                            sx={{
                                backgroundColor: (theme) => alpha(theme.palette.info.main, 0.1),
                                "&:hover": { backgroundColor: (theme) => alpha(theme.palette.info.main, 0.2), transform: "scale(1.05)" },
                                borderRadius: 1.5,
                                padding: 0.7,
                                color: "info.main",
                                transition: "all 0.2s",
                              }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDelete(params.row.id)}
                            sx={{
                                backgroundColor: (theme) => alpha(theme.palette.error.main, 0.1),
                                "&:hover": { backgroundColor: (theme) => alpha(theme.palette.error.main, 0.2), transform: "scale(1.05)" },
                                borderRadius: 1.5,
                                padding: 0.7,
                                color: "error.main",
                                transition: "all 0.2s",
                              }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={() => handlePrint(params.row)}
                            sx={{
                                backgroundColor: (theme) => alpha(theme.palette.success.main, 0.1),
                                "&:hover": { backgroundColor: (theme) => alpha(theme.palette.success.main, 0.2), transform: "scale(1.05)" },
                                borderRadius: 1.5,
                                padding: 0.7,
                                color: "success.main",
                                transition: "all 0.2s",
                              }}
                          >
                            <Print fontSize="small" />
                          </IconButton>
                        </Stack>
                      )
                  }
                ]}
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
              <FormControl component="fieldset" margin="normal">
                <FormLabel component="legend">Payment Type</FormLabel>
                <RadioGroup
                  row
                  value={form.paymentType}
                  onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
                >
                  <FormControlLabel value="online" control={<Radio />} label="Online" />
                  <FormControlLabel value="cash" control={<Radio />} label="Cash" />
                </RadioGroup>
              </FormControl>
            <TextField label="Receipt No." fullWidth margin="normal" value={form.receiptNo} onChange={e => setForm({ ...form, receiptNo: e.target.value })} onFocus={event => event.target.select()} />
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
              slotProps={{ textField: { fullWidth: true, margin: "normal" } }}
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
              <FormControl component="fieldset" margin="normal">
                <FormLabel component="legend">Payment Type</FormLabel> 
                <RadioGroup
                  row
                  value={editForm.paymentType || 'online'}
                  onChange={(e) => setEditForm({ ...editForm, paymentType: e.target.value })}
                >
                  <FormControlLabel value="online" control={<Radio />} label="Online" />
                  <FormControlLabel value="cash" control={<Radio />} label="Cash" />
                </RadioGroup>
              </FormControl>
              <TextField label="Receipt No." fullWidth margin="normal" value={editForm.receiptNo} onChange={e => setEditForm({ ...editForm, receiptNo: e.target.value })} onFocus={event => event.target.select()} />
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
                slotProps={{ textField: { fullWidth: true, margin: "normal" } }}
              />
          </DialogContent>
          <DialogActions>
              <Button onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleEditSave} variant="contained">Save</Button>
          </DialogActions>
        </Dialog> {/* Added fullWidth and maxWidth */}
        <ConfirmationDialog
            open={confirmDialog.open}
            title={confirmDialog.title}
            message={confirmDialog.message}
            onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
            onConfirm={() => {
                if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                setConfirmDialog({ ...confirmDialog, open: false });
            }}
            confirmColor="error"
            confirmText="Delete"
        />
      </Box>
    </LocalizationProvider>
  )
}
