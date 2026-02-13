import React, { useState, useMemo, useCallback } from 'react';
import { addPayment, getPayments, getCustomers, editPayment, deletePayment, getBook } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useConfirmationDialog } from '../hooks/useConfirmationDialog';
import { usePayments } from '../hooks/usePayments';
import { useKeyShortcut } from '../hooks/useKeyShortcut';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from '../context/SnackbarContext';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Button, Typography, Box, Stack, ButtonGroup, Tooltip} from '@mui/material';
import { Add, Edit, Delete, ArrowBack, Print } from "@mui/icons-material";
import PageLayout from '../components/PageLayout';
import BulkPaymentReceipt from '../components/BulkPaymentReceipt';
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
    const {token, user} = useAuth();
    const {bookId, customerId} = useParams();
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [form, setForm] = useState({ amount: '', monthIso: '', receiptNo: '', paymentType: 'cash', agentName: '' });
    const [editForm, setEditForm] = useState({ id: '', amount: '', monthIso: '', receiptNo: '', paymentType: 'cash', agentName: ''});
    const { showSnackbar } = useSnackbar();
    const { dialogConfig, showConfirmation, handleClose, handleConfirm } = useConfirmationDialog();
    const { payments, customer, book, loading, error, refetch } = usePayments(bookId, customerId);
    const navigate = useNavigate();
    const [selectionModel, setSelectionModel] = useState([]);

    const agentOptions = useMemo(() => {
        const optionsMap = new Map();
        if (payments) {
            payments.forEach(p => {
                if (p.agentName) {
                    const lower = p.agentName.toLowerCase();
                    const current = p.agentName;
                    // Deduplicate case-insensitively, preferring capitalized names (e.g. "Rahul" over "rahul")
                    if (!optionsMap.has(lower) || (optionsMap.get(lower)[0] === optionsMap.get(lower)[0].toLowerCase() && current[0] === current[0].toUpperCase())) {
                        optionsMap.set(lower, current);
                    }
                }
            });
        }
        return Array.from(optionsMap.values()).sort();
    }, [payments]);

    const getNextPaymentDetails = useCallback(() => {
        const fixedAmount = book?.totalAmount || '';
        if (!book || payments.length === 0) {
            // If no payments, default to book start month and no amount
            return { month: book?.startMonthIso || '', amount: fixedAmount };
        }

        // Find the most recent payment
        const sortedPayments = [...payments].sort((a, b) => b.monthIso.localeCompare(a.monthIso));
        const lastPayment = sortedPayments[0];

        // Calculate next month
        const [year, month] = lastPayment.monthIso.split('-').map(Number);
        const nextMonthDate = new Date(year, month, 1); // month is 0-indexed for Date object
        const nextYear = nextMonthDate.getFullYear();
        const nextMonth = (nextMonthDate.getMonth() + 1).toString().padStart(2, '0');

        return { month: `${nextYear}-${nextMonth}`, amount: fixedAmount || lastPayment.amount };
    }, [book, payments]);

    const handleOpenAddDialog = useCallback(() => {
        const { month, amount } = getNextPaymentDetails();
        // Auto-generate a unique receipt number
        const uniqueReceiptNo = `R-${customerId}-${Date.now()}`;
        setForm({
            amount,
            monthIso: month,
            receiptNo: uniqueReceiptNo,
            splits: [{ amount: amount, paymentType: 'cash' }], // Initialize with splits
            agentName: user?.name
        });
        setOpen(true);
    }, [customerId, getNextPaymentDetails, user]);

    // Add keyboard shortcut for "Add Payment" (Ctrl + / or Cmd + /)
    useKeyShortcut(handleOpenAddDialog, { key: '/', ctrl: true, meta: true, disabled: customer?.isFrozen });


    const handleCreate = async () => {
      try {
        let payload = { ...form };

        if (!payload.agentName || payload.agentName.trim() === '') {
            showSnackbar('Agent name is required.', 'error');
            return;
        }

        // Calculate amounts based on splits or fallback to single amount/type
        let cash = 0, online = 0, instore = 0;

        if (form.splits && form.splits.length > 0) {
            cash = form.splits.filter(s => s.paymentType === 'cash').reduce((sum, s) => sum + Number(s.amount || 0), 0);
            online = form.splits.filter(s => s.paymentType === 'online').reduce((sum, s) => sum + Number(s.amount || 0), 0);
            instore = form.splits.filter(s => s.paymentType === 'instore').reduce((sum, s) => sum + Number(s.amount || 0), 0);
        } else {
            // Fallback if splits are missing (Single mode)
            const amt = Number(form.amount || 0);
            const type = form.paymentType || 'cash';
            if (type === 'cash') cash = amt;
            else if (type === 'online') online = amt;
            else if (type === 'instore') instore = amt;
        }

        payload.amountCash = cash;
        payload.amountOnline = online;
        payload.amountInstore = instore;
        payload.amount = cash + online + instore;
        delete payload.splits;

        // Validate against book total_amount
        const requiredAmount = Number(book?.totalAmount || 0);
        if (requiredAmount > 0 && payload.amount !== requiredAmount) {
            showSnackbar(`Total amount must be ₹${requiredAmount} for this book.`, 'error');
            return;
        }

        // paymentType will be derived by backend or we can omit it, but let's clean it up
        delete payload.paymentType; 

        await addPayment(bookId, customerId, payload, token);
        setOpen(false);
        refetch();
        showSnackbar('Payment successfully completed.', 'success');
      } catch (error) {
        showSnackbar(error.response?.data?.error || "Failed to add payment", 'error');
      }
    };

    const handleEdit = useCallback((payment) => {
        // Reconstruct splits from separate columns for the UI
        let splits = [];
        if (Number(payment.amountCash) > 0) splits.push({ paymentType: 'cash', amount: payment.amountCash });
        if (Number(payment.amountOnline) > 0) splits.push({ paymentType: 'online', amount: payment.amountOnline });
        if (Number(payment.amountInstore) > 0) splits.push({ paymentType: 'instore', amount: payment.amountInstore });

        // Fallback for legacy data that might not have separate columns yet
        if (splits.length === 0) {
             splits.push({ paymentType: payment.paymentType || 'cash', amount: payment.amount });
        }

        setEditForm({ ...payment, splits });
        setEditOpen(true);
    }, []);

    const handleEditSave = async () => {
        let payload = { ...editForm };

        if (!payload.agentName || payload.agentName.trim() === '') {
            showSnackbar('Agent name is required.', 'error');
            return;
        }

        let cash = 0, online = 0, instore = 0;

        if (payload.splits && payload.splits.length > 0) {
             cash = payload.splits.filter(s => s.paymentType === 'cash').reduce((sum, s) => sum + Number(s.amount || 0), 0);
             online = payload.splits.filter(s => s.paymentType === 'online').reduce((sum, s) => sum + Number(s.amount || 0), 0);
             instore = payload.splits.filter(s => s.paymentType === 'instore').reduce((sum, s) => sum + Number(s.amount || 0), 0);
        } else {
             const amt = Number(payload.amount || 0);
             const type = payload.paymentType || 'cash';
             if (type === 'cash') cash = amt;
             else if (type === 'online') online = amt;
             else if (type === 'instore') instore = amt;
        }

        payload.amountCash = cash;
        payload.amountOnline = online;
        payload.amountInstore = instore;
        payload.amount = cash + online + instore;
        delete payload.splits;

        // Validate against book total_amount
        const requiredAmount = Number(book?.totalAmount || 0);
        if (requiredAmount > 0 && payload.amount !== requiredAmount) {
            showSnackbar(`Total amount must be ₹${requiredAmount} for this book.`, 'error');
            return;
        }

        delete payload.paymentType;

        await editPayment(bookId, customerId, editForm.id, payload, token);
        setEditOpen(false);
        refetch();
        showSnackbar('Payment edit successfully.', 'success');
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

    const handlePrint = (payment) => {
        // Use BulkPaymentReceipt for single prints by wrapping the payment in an array
        renderComponentInNewWindow(<BulkPaymentReceipt payments={[payment]} customer={customer} book={book} user={user} />, 'Payment Receipt');
    };

    const handlePrintSelected = () => {
        const selectedPayments = payments.filter(p => selectionModel.includes(p.id));
        if (selectedPayments.length === 0) {
            showSnackbar('No payments selected to print.', 'warning');
            return;
        }

        renderComponentInNewWindow(<BulkPaymentReceipt payments={selectedPayments} customer={customer} book={book} user={user} />, 'Consolidated Receipt');
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
        const totals = {
            totalAmount: 0,
            paymentCount: payments.length,
            cash: 0,
            online: 0,
            instore: 0,
            agentTotals: {},
        };

        payments.forEach(payment => {
            totals.totalAmount += Number(payment.amount);

            // Use specific columns if available
            if (payment.amountCash || payment.amountOnline || payment.amountInstore) {
                totals.cash += Number(payment.amountCash || 0);
                totals.online += Number(payment.amountOnline || 0);
                totals.instore += Number(payment.amountInstore || 0);
            } else {
                // Legacy fallback for old records
                const type = String(payment.paymentType).toLowerCase();
                // Check if the type matches one of our keys (cash, online, instore)
                if (totals[type] !== undefined) {
                    totals[type] += Number(payment.amount);
                }
            }

            // Agent Totals
            const agentName = payment.agentName || 'Unknown';
            const key = agentName.toLowerCase();
            if (!totals.agentTotals[key]) {
                totals.agentTotals[key] = { name: agentName, amount: 0 };
            }
            // Prefer capitalized name for display if encountered (e.g. "Rahul" over "rahul")
            if (agentName && agentName[0] === agentName[0].toUpperCase() && totals.agentTotals[key].name[0] !== totals.agentTotals[key].name[0].toUpperCase()) {
                totals.agentTotals[key].name = agentName;
            }
            totals.agentTotals[key].amount += Number(payment.amount);
        });

        return totals;
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
      { field: 'agentName', headerName: 'Agent', width: 120 },
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
            <Typography variant="h4" component="h1" sx={{ color: 'text.primary', fontWeight: 'bold', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 1, width: '100%', textAlign: 'center' }}>
                <Box component="span" sx={{ fontWeight: 'bold', color:"text.primary"}}>
                  Payments
                </Box>
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 'normal' }}>for</Box>
                <Box component="span" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  {customer?.name}
                </Box>
                <Typography variant="subtitle1" component="span" sx={{ color: 'text.secondary', pt: 0.5, width: '100%' }}>
                  in Book: {book?.name}
                </Typography>
            </Typography>
          </PageHeader>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Tooltip title="Add Payment (Ctrl + /)">
              <span> {/* Tooltip needs a span wrapper for disabled buttons */}
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  color="primary"
                  onClick={handleOpenAddDialog}
                  disabled={customer?.isFrozen}
                >
                  Add Payment
                </Button>
              </span>
            </Tooltip>
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
              { label: 'Total Amount Paid', value: `₹ ${paymentSummary.totalAmount.toLocaleString('en-IN')}`, color: 'primary.main' },
              { label: 'Total Payments', value: paymentSummary.paymentCount, color: 'text.secondary' },
              { label: 'Cash Paid', value: `₹ ${paymentSummary.cash.toLocaleString('en-IN')}`, color: 'success.main' },
              { label: 'Online Paid', value: `₹ ${paymentSummary.online.toLocaleString('en-IN')}`, color: 'info.main' },
              { label: 'In-Store Paid', value: `₹ ${paymentSummary.instore.toLocaleString('en-IN')}`, color: 'warning.main' },
              ...Object.values(paymentSummary.agentTotals).sort((a, b) => b.amount - a.amount).map(agent => ({
                label: `By ${agent.name}`,
                value: `₹ ${agent.amount.toLocaleString('en-IN')}`,
                color: 'secondary.main'
              })),
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
          <PaymentFormFields formState={form} onFormChange={setForm} agentOptions={agentOptions} />
        </FormDialog>

        <FormDialog open={editOpen} onClose={() => setEditOpen(false)} title="Edit Payment" onSubmit={handleEditSave}>
          <PaymentFormFields formState={editForm} onFormChange={setEditForm} isMonthDisabled={true} agentOptions={agentOptions} />
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
