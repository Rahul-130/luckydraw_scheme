import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSnackbar } from "../context/SnackbarContext";
import { useCustomers } from "../hooks/useCustomers";
import { useBooks } from "../hooks/useBooks";
import { useDebounce } from "../hooks/useDebounce";
import { useConfirmationDialog } from "../hooks/useConfirmationDialog";
import { useKeyShortcut } from "../hooks/useKeyShortcut";
import {
  TextField,
  Button,
  Container,
  Dialog,
  Typography,
  Box,
  Stack,
  Paper,
  IconButton,
  Alert,
  DialogTitle,
  DialogContent,
  MenuItem,
  Divider,
  ListItemIcon,
  DialogActions,
  InputAdornment,
  Tooltip,
  Autocomplete,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { Add, Edit, Delete, Payment, Search, ArrowBack, CheckCircle, EmojiEvents, Print, Close } from "@mui/icons-material";
import { addCustomer, editCustomer, deleteCustomer, markCustomerAsWinner, verifyPassword } from "../services/api";
import StyledDataGrid from "../components/StyledDataGrid";
import StyledSearchBar from "../components/StyledSearchBar";
import ConfirmationDialog from "../components/ConfirmationDialog";
import ActionIconButton from "../components/ActionIconButton";
import PageLayout from "../components/PageLayout";
import FormDialog from "../components/FormDialog";
import CustomerFormFields from "../components/CustomerFormFields";
import SearchAndSummaryBox from "../components/SearchAndSummaryBox";
import PageHeader from "../components/PageHeader";
import ActionMenu from "../components/ActionMenu";
import StatusChip from "../components/StatusChip";
import { extractApiErrorMessage } from "../utils/apiUtils";
import PasswordOTPConfirmationDialog from "../components/PasswordOTPConfirmationDialog";
import { getAvailableCustomerIds } from "../services/api";
import SettlementReceipt from "../components/SettlementReceipt";
import { renderComponentInNewWindow } from "../utils/printing";

export default function CustomersPage() {
  const { token, user } = useAuth();
  const { bookId } = useParams();
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 500);

  const { customers, loading: customersLoading, error: customersError, refetch: refetchCustomers } = useCustomers(bookId, debouncedSearch);
  const { book, error: bookError } = useBooks({ bookId }); // Reliably fetch the current book's details

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
        id: '', // Add id to form state
        name: '',
        relationInfo: '',
        phone: '',
        address: ''
    });
    const [editForm, setEditForm] = useState({ id: '', name: '', relationInfo: '', phone: '', address: '' });
    const { showSnackbar } = useSnackbar();
    const { dialogConfig, showConfirmation, handleClose, handleConfirm } = useConfirmationDialog();
    const navigate = useNavigate();

    const [otpDialogOpen, setOtpDialogOpen] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    const [settleDialogOpen, setSettleDialogOpen] = useState(false);
    const [customerToSettle, setCustomerToSettle] = useState(null);
    const [bonusAmount, setBonusAmount] = useState('');
    const [settlementReceiptNo, setSettlementReceiptNo] = useState('');
    const [availableCustomerIds, setAvailableCustomerIds] = useState([]); // New state for available IDs

    // Fetch available customer IDs when bookId or customers change
    useEffect(() => {
        const fetchIds = async () => {
            if (!token || !bookId) {
                setAvailableCustomerIds([]);
                return;
            }
            try {
                const ids = await getAvailableCustomerIds(bookId, token);
                setAvailableCustomerIds(ids.data.map(String)); // Convert to string for Autocomplete options
            } catch (err) {
                console.error("Failed to fetch available customer IDs", err);
                setAvailableCustomerIds([]);
            }
        };
        fetchIds();
    }, [token, bookId, customers]); // Refetch when customers change to update available IDs

    // Add keyboard shortcut for "Add Customer" (Ctrl + / or Cmd + /)
    useKeyShortcut(() => {
        setForm({ id: '', name: '', relationInfo: '', phone: '', address: '' }); // Reset form on open
        setOpen(true);
    }, { key: '/', ctrl: true, meta: true });

    const handleCreate = async () => {
      try {
        // Validate ID if provided
        if (form.id && (isNaN(Number(form.id)) || Number(form.id) < 1 || Number(form.id) > book?.maxCustomers)) {
            showSnackbar(`Customer ID must be a number between 1 and ${book?.maxCustomers}.`, 'error');
            return;
        }
        if (form.id && !availableCustomerIds.includes(form.id)) {
            showSnackbar(`Customer ID ${form.id} is already taken or invalid.`, 'error');
            return;
        }

        await addCustomer(bookId, form, token);
        setOpen(false);
        refetchCustomers();
      } catch (error) {
        showSnackbar(extractApiErrorMessage(error, "Failed to add customer"), 'error');
      }
    };

    const isAddCustomerDisabled = useMemo(() => {
        const baseDisabled = !form.name.trim() || !form.address.trim() || form.phone.length !== 10;
        if (form.id) {
            const idNum = Number(form.id);
            return baseDisabled || isNaN(idNum) || idNum < 1 || idNum > book?.maxCustomers || !availableCustomerIds.includes(form.id);
        }
        return baseDisabled;
    }, [form, book, availableCustomerIds]);

    const handleEdit = useCallback((customer) => {
        setEditForm(customer);
        setEditOpen(true);
    }, []);

    const handleEditSave = () => {
        setPendingAction({ type: 'edit', id: editForm.id, data: editForm });
        setOtpDialogOpen(true);
    };

    const handleSettle = useCallback((customer) => {
        setCustomerToSettle(customer);
        setBonusAmount(''); // Reset bonus amount
        // Auto-generate a unique settlement receipt number
        setSettlementReceiptNo(`S-${bookId}-${customer.id}-${Date.now()}`);
        setSettleDialogOpen(true);
    }, [bookId]);

    const handleConfirmSettle = async () => {
        if (!customerToSettle) return;

        try {
            await editCustomer(bookId, customerToSettle.id, { 
                isFrozen: true,
                bonusAmount: Number(bonusAmount) || 0,
                settlementReceiptNo: settlementReceiptNo,
                settlementAgentName: user?.name || user?.email
            }, token);
            
            refetchCustomers();
            showSnackbar('Account settled and closed.', 'success');
        } catch (error) {
            showSnackbar(extractApiErrorMessage(error, "Failed to close account"), 'error');
        } finally {
            setSettleDialogOpen(false);
            setCustomerToSettle(null);
        }
    };

    const handlePrintSettlement = useCallback((customer) => {
        renderComponentInNewWindow(<SettlementReceipt customer={customer} book={book} user={user} />, 'Settlement Receipt');
    }, [book, user]);

    const handleMakeWinner = useCallback((customer) => {
         showConfirmation({
            open: true,
            title: `Mark as Winner?`,
            message: `Are you sure you want to mark ${customer.name} as a winner?`,
            onConfirm: async () => {
                try {
                    await markCustomerAsWinner(token, {
                        bookId,
                        customerId: customer.id,
                        bookName: book?.name,
                        customerName: customer.name,
                        relationInfo: customer.relationInfo,
                        address: customer.address,
                        phone: customer.phone
                    });
                    refetchCustomers();
                    showSnackbar('Customer marked as winner.', 'success');
                } catch (error) {
                    showSnackbar(extractApiErrorMessage(error, "Failed to mark as winner"), 'error');
                }
            },
            confirmColor: 'success',
            confirmText: 'Make Winner'
        });
    }, [bookId, book, token, refetchCustomers, showSnackbar, showConfirmation]);

    const handleDelete = useCallback((customerId, customerName) => {
        setPendingAction({ type: 'delete', id: customerId, name: customerName });
        setOtpDialogOpen(true);
    }, []);

    const handleConfirmOtp = async (password, otp) => {
        setOtpLoading(true);
        try {
            // Verify credentials first
            await verifyPassword(token, password, otp);

            if (pendingAction.type === 'delete') {
                await deleteCustomer(bookId, pendingAction.id, token);
                showSnackbar('Customer deleted successfully.', 'success');
            } else if (pendingAction.type === 'edit') {
                await editCustomer(bookId, pendingAction.id, pendingAction.data, token);
                setEditOpen(false);
                showSnackbar('Customer updated successfully.', 'success');
            }
            refetchCustomers();
            setOtpDialogOpen(false);
            setPendingAction(null);
        } catch (error) {
             showSnackbar(extractApiErrorMessage(error, "Action failed"), 'error');
        } finally {
            setOtpLoading(false);
        }
    };

    const customerSummary = useMemo(() => {
        const total = customers.length;
        const winners = customers.filter(c => c.isWinner && !c.settledDate).length;
        const closed = customers.filter(c => (c.isFrozen && !c.isWinner) || (c.isWinner && c.settledDate)).length;
        const completed = customers.filter(c => !c.isFrozen && (c.paymentCount || 0) >= 20).length;
        const eligible = customers.filter(c => !c.isFrozen && (c.paymentCount || 0) < 20 && c.missedPayments <= 2).length;
        const notEligible = customers.filter(c => !c.isFrozen && (c.paymentCount || 0) < 20 && c.missedPayments > 2).length;

        return {
            total,
            winners,
            closed,
            completed,
            eligible,
            notEligible
        };
    }, [customers]);

    const columns = useMemo(() => [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'name', headerName: 'Name', width: 200 },
        { field: 'relationInfo', headerName: 'S/o, D/o, W/o', width: 180 },
        { field: 'phone', headerName: 'Phone', width: 150 },
        { field: 'address', headerName: 'Address', flex: 1, minWidth: 150 },
        {
            field: 'status',
            headerName: 'Status',
            flex: 0.5,
            minWidth: 150,
            renderCell: (params) => (
                <StatusChip customer={params.row} />
            )
        },

        {
            field: 'actions',
            headerName: 'Actions',
            width: 225,
            renderCell: (params) => {
                const { row } = params;
                const actionItems = [
                  ...((user?.userRole === 'admin' && (!row.isFrozen || (row.isWinner && !row.settledDate))) ? [{
                    label: 'Edit',
                    icon: <Edit fontSize="small" />,
                    onClick: () => handleEdit(row),
                  }] : []),
                  ...((!row.isFrozen || (row.isWinner && !row.settledDate)) ? [{
                    label: row.isWinner ? 'Settle Winner' : 'Settle & Close',
                    icon: <CheckCircle fontSize="small" />,
                    onClick: () => handleSettle(row),
                    color: 'warning.main'
                  }] : []),
                  ...(row.isFrozen ? [{
                    label: 'Print Settlement',
                    icon: <Print fontSize="small" />,
                    onClick: () => handlePrintSettlement(row),
                    color: 'primary.main'
                  }] : []),
                  ...(!row.isFrozen && !row.isWinner && row.missedPayments <= 2 ? [{
                    label: 'Make Winner',
                    icon: <EmojiEvents fontSize="small" />,
                    onClick: () => handleMakeWinner(row),
                    color: 'success.main'
                  }] : []),
                  ...(user?.userRole === 'admin' ? [{
                    label: 'Delete',
                    icon: <Delete fontSize="small" />,
                    onClick: () => handleDelete(row.id, row.name),
                    color: 'error.main',
                  }] : []),
                ];
                return (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <Button
                            startIcon={<Payment fontSize="small" />}
                            onClick={() => navigate(`/books/${bookId}/customers/${row.id}/payments`)}
                            size="small"
                            variant="outlined"
                        >
                            Payments
                        </Button>
                        {actionItems.length > 0 && <ActionMenu items={actionItems} />}
                    </Stack>
                );
            }
        }
    ], [bookId, navigate, handleEdit, handleDelete, handleSettle, handleMakeWinner]);

  return (
    <PageLayout>
        {!token && <Navigate to="/login" replace />}
        {!bookId && <Navigate to="/books" replace />}
        {bookError && <Alert severity="error">Book not found or you do not have access to it.</Alert>}

        <PageHeader backTo="/books" title="Customers">
          <Typography variant="h5" sx={{ color: "text.secondary" }} >
            Customers
          </Typography>
          <Typography variant="h6" sx={{ color: "text.secondary" }} >
            for Book: {book?.name}
          </Typography>
        </PageHeader>

        <SearchAndSummaryBox
          searchLabel="Search Customers"
          searchText={searchText}
          onSearchChange={(e) => setSearchText(e.target.value)}
          summaryItems={[
            { label: 'Total', value: customerSummary.total },
            { label: 'Winners', value: customerSummary.winners, color: 'success.main' },
            { label: 'Closed', value: customerSummary.closed, color: 'text.secondary' },
            { label: 'Completed', value: customerSummary.completed, color: 'info.main' },
            { label: 'Eligible', value: customerSummary.eligible, color: 'primary.main' },
            { label: 'Not Eligible', value: customerSummary.notEligible, color: 'error.main' },
          ]}
        >
          <Tooltip title="Add Customer (Ctrl + /)">
            <Button variant="contained" startIcon={<Add />} color="primary" onClick={() => setOpen(true)}>
              Add Customer
            </Button>
          </Tooltip>
        </SearchAndSummaryBox>

        <StyledDataGrid // Ensure book?.maxCustomers is available for CustomerFormFields
                rows={customers}
                columns={columns}
                loading={customersLoading}
                onRowClick={(params) => navigate(`/books/${bookId}/customers/${params.row.id}/payments`)}
                pageSizeOptions={[5, 10, 20, 100]}
                sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
            />

        {customersError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to load customers.
          </Alert>
        )}

        <FormDialog open={open} onClose={() => setOpen(false)} title={`Add Customer to "${book?.name}"`} onSubmit={handleCreate} submitText="Create" isSubmitDisabled={isAddCustomerDisabled}>
          <CustomerFormFields formState={form} onFormChange={setForm} availableCustomerIds={availableCustomerIds} maxCustomers={book?.maxCustomers} />
        </FormDialog>

        <FormDialog open={editOpen} onClose={() => setEditOpen(false)} title="Edit Customer" onSubmit={handleEditSave} isSubmitDisabled={!editForm.name.trim() || !editForm.address.trim() || editForm.phone.length !== 10}>
          <CustomerFormFields formState={editForm} onFormChange={setEditForm} isEditing={true} />
        </FormDialog>

        <ConfirmationDialog
            open={dialogConfig.open}
            title={dialogConfig.title}
            message={dialogConfig.message}
            onClose={handleClose}
            onConfirm={handleConfirm}
            confirmColor={dialogConfig.confirmColor || "error"}
            confirmText={dialogConfig.confirmText || "Delete"}
        />

        <Dialog open={settleDialogOpen} onClose={() => setSettleDialogOpen(false)}>
            <DialogTitle>
                {customerToSettle?.isWinner ? 'Settle Winner Account' : 'Settle & Close Account'}
            </DialogTitle>
            <DialogContent>
                <Typography variant="subtitle2" sx={{ mb: 0.5, color: 'text.secondary' }}>
                    Total Paid by Customer: <strong>₹{Number(customerToSettle?.totalPaid || 0).toLocaleString('en-IN')}</strong>
                </Typography>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: 'success.main' }}>
                    Total Final Settlement: ₹{(Number(customerToSettle?.totalPaid || 0) + Number(bonusAmount || 0)).toLocaleString('en-IN')}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body1" sx={{ mb: 2 }}>
                    {customerToSettle?.isWinner 
                        ? `Confirm that ${book?.name}-${customerToSettle?.id} (${customerToSettle?.name}) has collected the prize. You can add an optional bonus amount below.` 
                        : `You are about to settle and close ${book?.name}-${customerToSettle?.id} (${customerToSettle?.name})'s account. This will freeze the account.`}
                </Typography>
                
                <Alert severity="info" sx={{ mb: 2 }}>
                    Settling as: <strong>{user?.name}</strong>
                </Alert>

                <TextField
                    margin="dense"
                    label="Settlement Receipt No"
                    fullWidth
                    variant="outlined"
                    value={settlementReceiptNo}
                    onChange={(e) => setSettlementReceiptNo(e.target.value)}
                    helperText="Reference number for this settlement"
                    sx={{ mt: 1 }}
                />
                <TextField
                    autoFocus
                    margin="dense"
                    id="bonus"
                    label="Bonus Amount (Optional)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    sx={{mt: 2}}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setSettleDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleConfirmSettle} color="warning" variant="contained">Settle & Close</Button>
            </DialogActions>
        </Dialog>

        <PasswordOTPConfirmationDialog
            open={otpDialogOpen}
            onClose={() => { setOtpDialogOpen(false); setPendingAction(null); }}
            onConfirm={handleConfirmOtp}
            loading={otpLoading}
            title={pendingAction?.type === 'delete' ? `Delete ${pendingAction.name}?` : 'Confirm Edit'}
            message={pendingAction?.type === 'delete' ? `Are you sure you want to delete ${pendingAction.name}? This action cannot be undone. Please enter your credentials to confirm.` : `Please enter your credentials to confirm changes for ${pendingAction?.data?.name}.`}
            is2FAEnabled={user?.is2FAEnabled}
        />
    </PageLayout>
  )
}
