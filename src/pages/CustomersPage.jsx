import React, { useState, useMemo, useCallback } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSnackbar } from "../context/SnackbarContext";
import { useCustomers } from "../hooks/useCustomers";
import { useBooks } from "../hooks/useBooks";
import { useDebounce } from "../hooks/useDebounce";
import { useConfirmationDialog } from "../hooks/useConfirmationDialog";
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
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { Add, Edit, Delete, Payment, Search, ArrowBack } from "@mui/icons-material";
import { addCustomer, editCustomer, deleteCustomer } from "../services/api";
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

export default function CustomersPage() {
  const { token } = useAuth();
  const { bookId } = useParams();
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 500);

  const { customers, loading: customersLoading, error: customersError, refetch: refetchCustomers } = useCustomers(bookId, debouncedSearch);
  const { books } = useBooks(); // Assuming useBooks fetches all books and is available in context or similar
  const book = useMemo(() => books.find((b) => String(b.id) === bookId), [books, bookId]);

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

    const handleEditSave = async () => {
        await editCustomer(bookId, editForm.id, editForm, token);
        setEditOpen(false);
        refetchCustomers();
    };

    const handleDelete = useCallback((customerId, customerName) => {
        showConfirmation({
            open: true,
            title: `Delete Customer "${customerName}"?`,
            message: 'Are you sure you want to delete this customer and all their associated payments? This action cannot be undone.',
            onConfirm: async () => {
                try {
                    await deleteCustomer(bookId, customerId, token);
                    refetchCustomers();
                    showSnackbar('Customer deleted successfully.', 'success');
                } catch (error) {
                    showSnackbar(extractApiErrorMessage(error, "Failed to delete customer"), 'error');
                }
            },
            confirmColor: 'error',
            confirmText: 'Delete'
        });
    }, [bookId, token, refetchCustomers, showSnackbar]);

    const customerSummary = useMemo(() => {
        const total = customers.length;
        const winners = customers.filter(c => c.isFrozen).length;
        const eligible = customers.filter(c => !c.isFrozen && c.missedPayments <= 1).length;
        const notEligible = customers.filter(c => !c.isFrozen && c.missedPayments > 1).length;

        return {
            total,
            winners,
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
            width: 150,
            renderCell: (params) => <StatusChip customer={params.row} />
        },

        {
            field: 'actions',
            headerName: 'Actions',
            width: 225,
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
    ], [bookId, navigate, handleEdit, handleDelete]);

  return (
    <PageLayout>
        {!token && <Navigate to="/login" replace />}
        {!bookId && <Navigate to="/books" replace />}
        {bookId && !book && <Alert severity="error">Book not found or you do not have access to it.</Alert>}

        <PageHeader backTo="/books">
          <Typography variant="h4" sx={{ fontWeight: "bold", color: "#000" }}>
            Customers
          </Typography>
          <Typography variant="h5" sx={{ color: "#000" }} >
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
            { label: 'Eligible', value: customerSummary.eligible, color: 'primary.main' },
            { label: 'Not Eligible', value: customerSummary.notEligible, color: 'error.main' },
          ]}
        >
          <Button variant="contained" startIcon={<Add />} color="primary" onClick={() => setOpen(true)}>
            Add Customer
          </Button>
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
    </PageLayout>
  )
}
