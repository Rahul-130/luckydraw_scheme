import React, { useState, useMemo, useCallback } from "react";
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
  ListItemIcon,
  DialogActions,
  Tooltip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { Add, Edit, Delete, Payment, Search, ArrowBack, CheckCircle, EmojiEvents } from "@mui/icons-material";
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

    // Add keyboard shortcut for "Add Customer" (Ctrl + / or Cmd + /)
    useKeyShortcut(() => setOpen(true), { key: '/', ctrl: true, meta: true });

    const handleCreate = async () => {
      try {
        await addCustomer(bookId, form, token);
        setOpen(false);
        refetchCustomers();
      } catch (error) {
        showSnackbar(extractApiErrorMessage(error, "Failed to add customer"), 'error');
      }
    };

    const handleEdit = useCallback((customer) => {
        setEditForm(customer);
        setEditOpen(true);
    }, []);

    const handleEditSave = () => {
        setPendingAction({ type: 'edit', id: editForm.id, data: editForm });
        setOtpDialogOpen(true);
    };

    const handleSettle = useCallback((customer) => {
        const isWinner = customer.isWinner;
        showConfirmation({
            open: true,
            title: isWinner ? 'Settle Winner Account?' : `Settle & Close Account?`,
            message: isWinner ? `Has ${customer.name} collected the prize? This will settle and close the account.` : `Are you sure you want to settle and close ${customer.name}'s account? This will freeze the account.`,
            onConfirm: async () => {
                try {
                    // Use editCustomer to set isFrozen to true
                    await editCustomer(bookId, customer.id, { ...customer, isFrozen: true }, token);
                    refetchCustomers();
                    showSnackbar('Account settled and closed.', 'success');
                } catch (error) {
                    showSnackbar(extractApiErrorMessage(error, "Failed to close account"), 'error');
                }
            },
            confirmColor: 'warning',
            confirmText: 'Settle & Close'
        });
    }, [bookId, token, refetchCustomers, showSnackbar, showConfirmation]);

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
        } catch (error) {
             showSnackbar(extractApiErrorMessage(error, "Action failed"), 'error');
        } finally {
            setOtpLoading(false);
            setPendingAction(null);
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
                  ...((!row.isFrozen || (row.isWinner && !row.settledDate)) ? [{
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
                  ...(!row.isFrozen && !row.isWinner && row.missedPayments <= 2 ? [{
                    label: 'Make Winner',
                    icon: <EmojiEvents fontSize="small" />,
                    onClick: () => handleMakeWinner(row),
                    color: 'success.main'
                  }] : []),
                  {
                    label: 'Delete',
                    icon: <Delete fontSize="small" />,
                    onClick: () => handleDelete(row.id, row.name),
                    color: 'error.main',
                  },
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
                        <ActionMenu items={actionItems} />
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

        <StyledDataGrid
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

        <FormDialog open={open} onClose={() => setOpen(false)} title={`Add Customer to "${book?.name}"`} onSubmit={handleCreate} submitText="Create" isSubmitDisabled={!form.name.trim() || !form.address.trim() || form.phone.length !== 10}>
          <CustomerFormFields formState={form} onFormChange={setForm} />
        </FormDialog>

        <FormDialog open={editOpen} onClose={() => setEditOpen(false)} title="Edit Customer" onSubmit={handleEditSave} isSubmitDisabled={!editForm.name.trim() || !editForm.address.trim() || editForm.phone.length !== 10}>
          <CustomerFormFields formState={editForm} onFormChange={setEditForm} />
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
