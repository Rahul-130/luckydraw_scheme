import React, { useState, useMemo } from "react";
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
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Alert,
  Box,
  Stack,
  Paper,
  IconButton,
} from "@mui/material";
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
} from "@mui/icons-material";

export default function BooksPage() {
  const { token } = useAuth();
  const {
    books,
    loading: booksLoading,
    error: booksError,
    rowCount,
    paginationModel,
    setPaginationModel,
    refetch: refetchBooks,
  } = useBooks();

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);

  const navigate = useNavigate();

  const handleCreate = async () => {
    try {
      await createBook(form, token);
      setOpen(false);
      refetchBooks();
    } catch (err) {
      console.error(err.response?.data?.message || "Failed to create book");
    }
  };

  const handleEdit = async () => {
    try {
      await editBook(editForm.id, editForm, token);
      setEditOpen(false);
      refetchBooks();
    } catch (err) {
      console.error(err.response?.data?.message || "Failed to edit book");
    }
  };

  const handleDelete = async (bookId) => {
    setBookToDelete(bookId);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!bookToDelete) return;
    try {
      await deleteBook(bookToDelete, token);
      setBookToDelete(null);
      setConfirmOpen(false);
      refetchBooks();
    } catch (err) {
      console.error(err.response?.data?.message || "Failed to delete book");
    }
  };

  const handleToggle = async (bookId) => {
    try {
      await toggleBookActive(bookId, token);
      refetchBooks();
    } catch (err) {
      console.error(err.response?.data?.message || "Failed to toggle book");
    }
  };

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
                backgroundColor: "#e3f2fd",
                "&:hover": { backgroundColor: "#bbdefb", transform: "scale(1.05)" },
                borderRadius: 1.5,
                padding: 0.7,
                color: "#1976d2",
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

            {/* Delete */}
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

            {/* Toggle Active */}
            <IconButton
              onClick={() => handleToggle(params.row.id)}
              sx={{
                backgroundColor: params.row.isActive ? "#fff3e0" : "#e8f5e9",
                "&:hover": {
                  backgroundColor: params.row.isActive ? "#ffe0b2" : "#c8e6c9",
                  transform: "scale(1.05)",
                },
                borderRadius: 1.5,
                padding: 0.7,
                color: params.row.isActive ? "#ed6c02" : "#2e7d32",
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
    [navigate]
  );

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
            variant="h3"
            sx={{
              mb: 4,
              fontWeight: "bold",
              textAlign: "center",
              color: "#222",
            }}
          >
            My Books
          </Typography>

          {/* Toolbar */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<Add />}
                color="primary"
                onClick={() => setOpen(true)}
              >
                Add Book
              </Button>
              <Button
                variant="contained"
                startIcon={<Backup />}
                color="secondary"
                onClick={handleBackup}
              >
                Backup
              </Button>
            </Stack>
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
                  renderInput={(params) => <TextField {...params} fullWidth />}
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
                  renderInput={(params) => <TextField {...params} fullWidth />}
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

          {/* Delete Confirmation Dialog */}
          <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete this book and its related data?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleConfirmDelete}
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </LocalizationProvider>
  );
}
