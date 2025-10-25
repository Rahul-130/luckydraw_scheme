import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  createBook,
  editBook,
  deleteBook,
  toggleBookActive,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { DataGrid } from "@mui/x-data-grid";
import { useBooks } from "../hooks/useBooks";
import {
  TextField,
  Button,
  Container,
  Typography,  Dialog,
  DialogActions,  DialogContent,
  DialogTitle,
  Alert,
  Box,
  Stack,
  Paper,
  IconButton,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useNavigate } from "react-router-dom";
import {
  Add,
  Backup,
  Edit,
  Delete,
  Visibility,
  ToggleOn,
  ToggleOff,
  Search,
} from "@mui/icons-material";
import ConfirmationDialog from "../components/ConfirmationDialog";

// Utility: debounce function to delay API calls
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export default function BooksPage() {
  const { token } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState();

  // debounce search input to avoid excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchText]);

  const {
    books,
    loading: booksLoading,
    error: booksError,
    rowCount,
    paginationModel,
    setPaginationModel,
    refetch: refetchBooks,
  } = useBooks(debouncedSearch);

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    maxCustomers: "",
    startMonthIso: "",
  });
  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    maxCustomers: "",
    startMonthIso: "",
  });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });

  const navigate = useNavigate();

  // create book
  const handleCreate = async () => {
    try {
      await createBook(form, token);
      setOpen(false);
      refetchBooks();
    } catch (err) {
      console.error(err.response?.data?.message || "Failed to create book");
    }
  };

  // edit book
  const handleEdit = async () => {
    try {
      await editBook(editForm.id, editForm, token);
      setEditOpen(false);
      refetchBooks();
    } catch (err) {
      console.error(err.response?.data?.message || "Failed to edit book");
    }
  };

  const handleDelete = useCallback((bookId, bookName) => {
    setConfirmDialog({
        open: true,
        title: `Delete Book "${bookName}"?`,
        message: 'Are you sure you want to delete this book and all its related data? This action cannot be undone.',
        onConfirm: async () => {
            try {
                await deleteBook(bookId, token);
                refetchBooks();
            } catch (err) {
                console.error(err.response?.data?.message || "Failed to delete book");
            }
        },
        confirmColor: 'error',
        confirmText: 'Delete'
    });
  }, [token, refetchBooks]);

  // toggle book active status
  const handleToggle = useCallback((bookId, bookName, isActive) => {
    const action = isActive ? "deactivate" : "activate";
    setConfirmDialog({
      open: true,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} "${bookName}"?`,
      message: `Are you sure you want to ${action} this book?`,
      onConfirm: async () => {
        try {
          await toggleBookActive(bookId, token);
          refetchBooks();
        } catch (err) {
          console.error(err.response?.data?.message || "Failed to toggle book");
        }
      },
      confirmColor: isActive ? 'warning' : 'success',
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
    });
  }, [token, refetchBooks]);


  const handleBackup = () => {
    alert("Backup triggered!");
  };

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 80 },
      { field: "name", headerName: "Name", width: 200 },
      { field: "maxCustomers", headerName: "Max Customers", width: 150 },
      { field: "isActive", headerName: "Active", width: 100, type: "boolean" },
      { field: "startMonthIso", headerName: "Start Month", width: 150 },
      {
        field: "actions",
        headerName: "Actions",
        width: 350,
        sortable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={0.5}>
            {/* View */}
            <Button
              onClick={() => navigate(`/books/${params.row.id}/customers`)}
              sx={{
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                "&:hover": { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2), transform: "scale(1.05)" },
                borderRadius: 1.5,
                padding: 0.7,
                color: "primary.main",
                transition: "all 0.2s",
              }}
            >
              <Visibility fontSize="small" className="px-1" /> customers
            </Button>

            {/* Edit */}
            <IconButton
              onClick={() => {
                setEditForm(params.row);
                setEditOpen(true);
              }}
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

            {/* Delete */}
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

            {/* Toggle Active */}
            <IconButton
              onClick={() => handleToggle(params.row.id, params.row.name, params.row.isActive)}
              sx={{
                backgroundColor: (theme) => params.row.isActive ? alpha(theme.palette.warning.main, 0.1) : alpha(theme.palette.success.main, 0.1),
                "&:hover": { 
                  backgroundColor: (theme) => params.row.isActive ? alpha(theme.palette.warning.main, 0.2) : alpha(theme.palette.success.main, 0.2),
                  transform: "scale(1.05)",
                },
                borderRadius: 1.5,
                padding: 0.7,
                color: params.row.isActive ? "warning.main" : "success.main",
                transition: "all 0.2s",
              }}
            >
              {params.row.isActive ? (
                <ToggleOff fontSize="small" />
              ) : (
                <ToggleOn fontSize="small" />
              )}
            </IconButton>
          </Stack>
        ),
      },
    ],
    [navigate, handleToggle, handleDelete]
  );

  const bookSummary = useMemo(() => {
    const active = books.filter(b => b.isActive).length;
    const inactive = books.filter(b => !b.isActive).length;

    return {
        total: rowCount, // Use rowCount from the hook for the true total
        active,
        inactive
    };
  }, [books, rowCount]);

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
          <Typography
            variant="h4"
            sx={{
              mb: 2,
              fontWeight: "bold",
              textAlign: "center",
              color: "#000",
            }}
          >
            My Books
          </Typography>

          {/* Toolbar */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ sm: 'center' }}
            sx={{ mb: 2 }}
          >
            {/* Left side: Search and Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: '70%' } }}>
                <TextField
                  label="Search Books"
                  variant="outlined"
                  size="small"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  sx={{
                    flexGrow: 1,
                    "& .MuiOutlinedInput-root": { borderRadius: 1.5 },
                    "& .MuiInputBase-input": {
                      color: '#000', // Force black text color
                    },
                    "& .MuiInputLabel-root": {
                      color: '#000', // Force black label color
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: '#000', // Keep label black when focused
                    },
                    "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
                      borderColor: '#000',
                    },
                    "&:hover .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
                      borderColor: '#000',
                    },
                    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: '#000',
                    }
                  }}
                  InputProps={{
                    startAdornment: <Search fontSize="small" sx={{ mr: 0.5, color: '#000' }} />,
                  }}
                />
                <Button variant="contained" startIcon={<Add />} color="primary" onClick={() => setOpen(true)}>
                  Add Book
                </Button>
            </Box>

            {/* Right side: Summary Box */}
            <Paper elevation={2} sx={{ p: 1.5, borderRadius: 2, width: { xs: '100%', sm: '30%' }, boxSizing: 'border-box' }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 2,
                  textAlign: 'center',
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">Total</Typography>
                  <Typography variant="body1" fontWeight="bold">{bookSummary.total}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="success.main">Active</Typography>
                  <Typography variant="body1" fontWeight="bold" color="success.main">{bookSummary.active}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="error">Inactive</Typography>
                  <Typography variant="body1" fontWeight="bold" color="error">{bookSummary.inactive}</Typography>
                </Box>
              </Box>
            </Paper>
          </Stack>

          <Paper
            elevation={6}
            sx={{ p: 2, borderRadius: 3, backgroundColor: "#fff" }}
          >
            <Box sx={{ height: 500, width: "100%" }}>
              <DataGrid
                rows={books || []}
                rowCount={rowCount || 0}
                columns={columns}
                loading={booksLoading}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                paginationMode="server"
                getRowClassName={(params) =>
                  params.row.isActive
                    ? "super-app-theme--active"
                    : "super-app-theme--inactive"
                }
                pageSizeOptions={[5, 10, 20, 100]}
                sx={{
                  "& .MuiDataGrid-row:hover": {
                    backgroundColor: "rgba(0, 123, 255, 0.08)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  },
                  "& .MuiDataGrid-row.Mui-even": { backgroundColor: "#f9f9f9" },
                  "& .MuiDataGrid-columnHeaders": {
                    color: (theme) => theme.palette.text.primary,
                    fontWeight: "bold",
                  },
                  borderRadius: 2,
                  "& .MuiDataGrid-cell": { py: 1.2 },
                  "& .super-app-theme--active": {
                    "&:hover": { backgroundColor: "rgba(46, 125, 50, 0.2)" },
                  },
                  "& .super-app-theme--inactive": {
                    backgroundColor: "rgba(211, 47, 47, 0.1)",
                    "&:hover": { backgroundColor: "rgba(211, 47, 47, 0.2)" },
                  },
                }}
              />
            </Box>
          </Paper>

          {booksError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Failed to load books.
            </Alert>
          )}

          {/* Add Book Dialog */}
          <Dialog open={open} onClose={() => setOpen(false)}>
            <DialogTitle>Add Book</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="Name"
                  fullWidth
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <TextField
                  label="Max Customers"
                  type="number"
                  fullWidth
                  value={form.maxCustomers}
                  onChange={(e) =>
                    setForm({ ...form, maxCustomers: e.target.value })
                  }
                />
                <DatePicker
                  label="Start Month (YYYY-MM)"
                  views={["year", "month"]}
                  value={
                    form.startMonthIso ? new Date(form.startMonthIso) : null
                  }
                  onChange={(newValue) => {
                    if (newValue) {
                      const year = newValue.getFullYear();
                      const month = (newValue.getMonth() + 1)
                        .toString()
                        .padStart(2, "0");
                      setForm({ ...form, startMonthIso: `${year}-${month}` });
                    } else setForm({ ...form, startMonthIso: "" });
                  }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleCreate}>
                Create
              </Button>
            </DialogActions>
          </Dialog>

          {/* Edit Book Dialog */}
          <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
            <DialogTitle>Edit Book</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="Name"
                  fullWidth
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
                <TextField
                  label="Max Customers"
                  type="number"
                  fullWidth
                  value={editForm.maxCustomers}
                  onChange={(e) =>
                    setEditForm({ ...editForm, maxCustomers: e.target.value })
                  }
                />
                <DatePicker
                  label="Start Month (YYYY-MM)"
                  views={["year", "month"]}
                  value={
                    editForm.startMonthIso
                      ? new Date(editForm.startMonthIso)
                      : null
                  }
                  onChange={(newValue) => {
                    if (newValue) {
                      const year = newValue.getFullYear();
                      const month = (newValue.getMonth() + 1)
                        .toString()
                        .padStart(2, "0");
                      setEditForm({
                        ...editForm,
                        startMonthIso: `${year}-${month}`,
                      });
                    } else setEditForm({ ...editForm, startMonthIso: "" });
                  }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleEdit}>
                Save
              </Button>
            </DialogActions>
          </Dialog>

          <ConfirmationDialog
              open={confirmDialog.open}
              title={confirmDialog.title}
              message={confirmDialog.message}
              onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
              onConfirm={async () => {
                if (confirmDialog.onConfirm) {
                    await confirmDialog.onConfirm();
                }
                setConfirmDialog({ ...confirmDialog, open: false });
              }}
              confirmColor={confirmDialog.confirmColor}
              confirmText={confirmDialog.confirmText}
          />
        </Container>
      </Box>
    </LocalizationProvider>
  );
}
