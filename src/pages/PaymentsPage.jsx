import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { addPayment, getPayments, getCustomers, editPayment, deletePayment, getBook } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useConfirmationDialog } from '../hooks/useConfirmationDialog';
import { usePayments } from '../hooks/usePayments';
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
  ListItemIcon,
} from '@mui/material';
import { alpha } from "@mui/material/styles";
import { Add, Edit, Delete, ArrowBack, Print } from "@mui/icons-material";
import PageLayout from '../components/PageLayout';
import PaymentReceipt from '../components/PaymentReceipt';
import BulkPaymentReceipt from '../components/BulkPaymentReceipt';
import ActionIconButton from '../components/ActionIconButton';
import StyledDataGrid from '../components/StyledDataGrid';
import ConfirmationDialog from '../components/ConfirmationDialog';
import FormDialog from '../components/FormDialog';
import SummaryBox from '../components/SummaryBox';
import { sendPaymentReceiptMessage } from '../utils/whatsapp';
import PaymentFormFields from '../components/PaymentFormFields';
import PageHeader from '../components/PageHeader';
import ActionMenu from '../components/ActionMenu';
import { renderComponentInNewWindow } from '../utils/printing';


export default function PaymentsPage() {
    const {token} = useAuth();
    const {bookId, customerId} = useParams();
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [form, setForm] = useState({ amount: '', monthIso: '', receiptNo: '', paymentType: 'cash' });
    const [editForm, setEditForm] = useState({ id: '', amount: '', monthIso: '', receiptNo: '', paymentType: 'cash'});
    const { showSnackbar } = useSnackbar();
    const { dialogConfig, showConfirmation, handleClose, handleConfirm } = useConfirmationDialog();
    const { payments, customer, book, loading, error, refetch } = usePayments(bookId, customerId);
    const navigate = useNavigate();
    const [selectionModel, setSelectionModel] = useState([]);

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
        refetch();
      } catch (error) {
        showSnackbar(error.response?.data?.error || "Failed to add payment", 'error');
      }
    };

    const handleEdit = useCallback((payment) => {
        setEditForm(payment);
        setEditOpen(true);
    }, []);

    const handleEditSave = async () => {
        await editPayment(bookId, customerId, editForm.id, editForm, token);
        setEditOpen(false);
        refetch();
    };

    const handleDelete = (paymentId) => {
        showConfirmation({
            title: 'Confirm Payment Deletion',
            message: 'Are you sure you want to delete this payment? This action cannot be undone.',
            onConfirm: async () => {
                try {
                    await deletePayment(bookId, customerId, paymentId, token);
                    refetch();
                    showSnackbar('Payment deleted successfully.', 'success');
                } catch (err) { showSnackbar(err.response?.data?.error || 'Failed to delete payment.', 'error'); }
            },
            confirmColor: 'error',
            confirmText: 'Delete'
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
            paymentType: 'cash' // Default to cash
        });
        setOpen(true);
    };

    const handlePrint = (payment) => {
        renderComponentInNewWindow(<PaymentReceipt payment={payment} customer={customer} book={book} />, 'Payment Receipt');
    };

    const handlePrintSelected = () => {
        const selectedPayments = payments.filter(p => selectionModel.includes(p.id));
        if (selectedPayments.length === 0) {
            showSnackbar('No payments selected to print.', 'warning');
            return;
        }

        renderComponentInNewWindow(<BulkPaymentReceipt payments={selectedPayments} customer={customer} book={book} />, 'Consolidated Receipt');
    };

    const handleSendWhatsApp = () => {
        const selectedPayments = payments.filter(p => selectionModel.includes(p.id));
        if (selectedPayments.length === 0) {
            showSnackbar('No payments selected to send.', 'warning');
            return;
        }
    
        sendPaymentReceiptMessage(customer, book, selectedPayments);
    };

    const paymentSummary = useMemo(() => {
        const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const paymentCount = payments.length;
        return { totalAmount, paymentCount };
    }, [payments]);

    const columns = useMemo(() => [
      { field: 'id', headerName: 'ID', width: 90 },
      { field: 'amount', headerName: 'Amount', width: 150, valueFormatter: (params) => `₹ ${params}` },
      { field: 'monthIso', headerName: 'Month', width: 150 },
      { 
        field: 'paymentDate', 
        headerName: 'Date', 
        width: 200, 
        valueFormatter: (value) => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ''
      },                  { field: 'receiptNo', headerName: 'Receipt No.', flex: 1, minWidth: 120 },
      { field: 'paymentType', headerName: 'Type', width: 120 },
      {
          field: 'actions',
          headerName: 'Actions',
          width: 200,
          sortable: false,
          renderCell: (params) => {
            const { row } = params;
            const actionItems = [
              {
                label: 'Edit',
                icon: <Edit fontSize="small" />,
                onClick: () => handleEdit(row),
              },
              {
                label: 'Delete',
                icon: <Delete fontSize="small" />,
                onClick: () => handleDelete(row.id),
                color: 'error.main',
              },
              {
                label: 'Print Receipt',
                icon: <Print fontSize="small" />,
                onClick: () => handlePrint(row),
              },
            ];
            return (
              <ActionMenu items={actionItems} />
            );
          }
      }
    ], [handleEdit, handleDelete, handlePrint]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <PageLayout>
          <PageHeader backTo={`/books/${bookId}/customers`}>
            <Typography variant="h5" component="h1" sx={{ color: 'text.primary', fontWeight: 'bold', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 0.5, width: '100%', textAlign: 'center' }}>
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
          </PageHeader>

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
              disabled={customer?.isFrozen}
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

          <SummaryBox
            sx={{ mb: 1 }}
            items={[
              { label: 'Total Payments', value: paymentSummary.paymentCount, color: 'primary.main' },
              { label: 'Total Amount Paid', value: `₹ ${paymentSummary.totalAmount.toLocaleString('en-IN')}`, color: 'primary.main' },
            ]}
          />

          <StyledDataGrid
                rows={payments}
                loading={loading}
                checkboxSelection
                onRowSelectionModelChange={(newSelectionModel) => setSelectionModel(newSelectionModel)}
                rowSelectionModel={selectionModel}
                columns={columns}
              />
      {/* Dialogs */}
        <FormDialog open={open} onClose={() => setOpen(false)} title="Add Payment" onSubmit={handleCreate} submitText="Create">
          <PaymentFormFields formState={form} onFormChange={setForm} />
        </FormDialog>

        <FormDialog open={editOpen} onClose={() => setEditOpen(false)} title="Edit Payment" onSubmit={handleEditSave}>
          <PaymentFormFields formState={editForm} onFormChange={setEditForm} isMonthDisabled={true} />
        </FormDialog>

        <ConfirmationDialog
            open={dialogConfig.open}
            title={dialogConfig.title}
            message={dialogConfig.message}
            onClose={handleClose}
            onConfirm={handleConfirm}
            confirmColor={dialogConfig.confirmColor}
            confirmText={dialogConfig.confirmText}
        />
      </PageLayout>
    </LocalizationProvider>
  )
}
