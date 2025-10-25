import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSnackbar } from "../context/SnackbarContext";
import { useCustomers } from "../hooks/useCustomers";
import { useBooks } from "../hooks/useBooks";
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
  DialogActions,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { Add, Edit, Delete, Payment, Search, ArrowBack } from "@mui/icons-material";
import { addCustomer, editCustomer, deleteCustomer } from "../services/api";
import StyledDataGrid from "../components/StyledDataGrid";
import StyledSearchBar from "../components/StyledSearchBar";
import SummaryBox from "../components/SummaryBox";
import ConfirmationDialog from "../components/ConfirmationDialog";

// Utility: debounce function to delay API calls
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export default function CustomersPage() {
  const { token } = useAuth();
  const { bookId } = useParams();
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // debounce search input to avoid excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchText]);

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
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
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

    const handleDelete = useCallback((customerId, customerName) => {
        setConfirmDialog({
            open: true,
            title: `Delete Customer "${customerName}"?`,
            message: 'Are you sure you want to delete this customer and all their associated payments? This action cannot be undone.',
            onConfirm: async () => {
                try {
                    await deleteCustomer(bookId, customerId, token);
                    refetchCustomers();
                    showSnackbar('Customer deleted successfully.', 'success');
                } catch (error) {
                    showSnackbar(error.response?.data?.error || "Failed to delete customer", 'error');
                }
            }
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
        { field: 'address', headerName: 'Address', width: 200 },
        {
            field: 'status',
            headerName: 'Status',
            width: 150,
            renderCell: (params) => {
                if (params.row.isFrozen) {
                    return <Typography color="success.main">Winner</Typography>;
                } 
    
                if (params.row.missedPayments > 1) {
                    return <Typography color="error">Not Eligible</Typography>;
                }

                return <Typography color="primary">Eligible</Typography>;
            }    
        },

        {
            field: 'actions',
            headerName: 'Actions',
            width: 225,
            renderCell: (params) => (
                <Stack direction="row" spacing={0.5}>
                    <Button
                        startIcon={<Payment fontSize="small" />}
                        onClick={() => navigate(`/books/${bookId}/customers/${params.row.id}/payments`)}
                        sx={{
                            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                            "&:hover": { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2), transform: "scale(1.05)" },
                            borderRadius: 1.5,
                            padding: 0.7,
                            color: "primary.main",
                            transition: "all 0.2s",
                          }}
                    >
                        Payments
                    </Button>
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
                        onClick={() => handleDelete(params.row.id, params.row.name)}
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
                </Stack>
            )
        }
    ], [bookId, navigate, handleEdit, handleDelete]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: 4,
        px: 2,
        background: "linear-gradient(to right, #f0f4f8, #d9e2ec)",
      }}
    >
      <Container maxWidth="lg">
        {!token && <Navigate to="/login" replace />}
        {!bookId && <Navigate to="/books" replace />}
        {bookId && !book && <Alert severity="error">Book not found or you do not have access to it.</Alert>}

        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <IconButton onClick={() => navigate('/books')} sx={{ color: '#000' }}>
              <ArrowBack />
            </IconButton>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 1.5,
                flexGrow: 1,
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: "bold", color: "#000" }}>
                Customers
              </Typography>
              <Typography variant="h5" sx={{ color: "#000" }} >
                for Book: {book?.name}
              </Typography>
            </Box>
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: 'center' }}
          sx={{ mb: 2 }}
        >
          {/* Left side: Search and Add Button */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: '70%' } }}>
              <StyledSearchBar
                label="Search Customers"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button
                variant="contained"
                startIcon={<Add />}
                color="primary"
                onClick={() => setOpen(true)}
              >
                Add Customer
              </Button>
          </Box>

          {/* Right side: Summary Box */}
          <SummaryBox
            sx={{ width: { xs: '100%', sm: '30%' }, boxSizing: 'border-box' }}
            items={[
              { label: 'Total', value: customerSummary.total },
              { label: 'Winners', value: customerSummary.winners, color: 'success.main' },
              { label: 'Eligible', value: customerSummary.eligible, color: 'primary.main' },
              { label: 'Not Eligible', value: customerSummary.notEligible, color: 'error.main' },
            ]}
          />
        </Stack>

        <Paper elevation={6} sx={{ p: 2, borderRadius: 3, backgroundColor: "#fff" }}>
          <Box sx={{ height: 500, width: "100%" }}>
            <StyledDataGrid
                rows={customers}
                columns={columns}
                loading={customersLoading}
                onRowClick={(params) => navigate(`/books/${bookId}/customers/${params.row.id}/payments`)}
                pageSizeOptions={[5, 10, 20, 100]}
                sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
            />
          </Box>
        </Paper>

        {customersError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to load customers.
          </Alert>
        )}

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
                    label="S/o, D/o, W/o"
                    fullWidth
                    margin="normal"
                    value={form.relationInfo}
                    onChange={e => setForm({ ...form, relationInfo: e.target.value })}
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
                <TextField autoFocus label="S/o, D/o, W/o" fullWidth margin="normal" value={editForm.relationInfo} onChange={e => setEditForm({ ...editForm, relationInfo: e.target.value })} />
                <TextField label="Name" fullWidth margin="normal" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                <TextField
                    label="Phone"
                    fullWidth
                    margin="normal"
                    value={editForm.phone}
                    onChange={e => {
                        const value = e.target.value.replace(/\D/g, ""); // keep only digits
                        setEditForm({ ...editForm, phone: value });
                    }}
                    inputProps={{ minLength: 10, maxLength: 10, inputMode: "numeric", pattern: "[0-9]*" }}
                    error={editForm.phone.length > 0 && editForm.phone.length !== 10}
                    helperText={
                        editForm.phone.length > 0 && editForm.phone.length !== 10
                            ? "Phone number must be exactly 10 digits"
                            : ""
                    }
                />
                <TextField label="Address" fullWidth margin="normal" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button onClick={handleEditSave} variant="contained"
                    disabled={
                        !editForm.name.trim() || !editForm.address.trim() || editForm.phone.length !== 10
                    }
                >Save</Button>
            </DialogActions>
        </Dialog>
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
      </Container>
    </Box>
  )
}
