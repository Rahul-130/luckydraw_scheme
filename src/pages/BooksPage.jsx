import React, { useState, useMemo, useCallback } from 'react'
import { createBook, editBook, deleteBook, toggleBookActive } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DataGrid } from '@mui/x-data-grid';
import { useBooks } from '../hooks/useBooks';
import { TextField, Button, Container, Typography, Dialog, DialogActions, DialogContent, DialogTitle, Alert } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate } from 'react-router-dom';


export default function BooksPage() {
    const { token } = useAuth();
    const { books, loading: booksLoading, error: booksError, rowCount, paginationModel, setPaginationModel, refetch: refetchBooks } = useBooks();
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [form, setForm] = useState({ name: '', maxCustomers: '', startMonthIso: '' });
    const [editForm, setEditForm] = useState({ id: '', name: '', maxCustomers: '', startMonthIso: '' });
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [bookToDelete, setBookToDelete] = useState(null);
    const navigate = useNavigate();

    const handleCreate = async () => {
        try {
            await createBook(form, token);
            setOpen(false);
            refetchBooks();
        } catch (err) {
            // Error is handled by useSnackbar in a real app, or a local error state
            console.error(err.response?.data?.message || 'Failed to create book');
        }
    };

    const handleEdit = async () => {
        await editBook(editForm.id, editForm, token);
        setEditOpen(false);
        refetchBooks();
    };

    const handleDelete = async (bookId) => {
        setBookToDelete(bookId);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!bookToDelete) return;
        await deleteBook(bookToDelete, token);
        setBookToDelete(null);
        setConfirmOpen(false);
        refetchBooks();
    };

    const handleToggle = async (bookId) => {
        try {
            const { data } = await toggleBookActive(bookId, token);
            refetchBooks();
        } catch (err) {
            // Error is handled by useSnackbar in a real app, or a local error state
            console.error(err.response?.data?.message || 'Failed to toggle book status');
        }
    };

    const columns = useMemo(() => [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'name', headerName: 'Name', width: 200 },
        { field: 'maxCustomers', headerName: 'Max Customers', width: 150 },
        {
            field: 'isActive',
            headerName: 'Active',
            width: 100,
            type: 'boolean'
        },
        { field: 'startMonthIso', headerName: 'Start Month', width: 150 },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 450,
            sortable: false,
            renderCell: (params) => (
                <>
                    <Button
                        variant="outlined"
                        color="success"
                        size="small"
                        onClick={() => navigate(`/books/${params.row.id}/customers`)}
                        style={{ marginRight: 8 }}
                    >
                        View Customers
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => {
                            setEditForm(params.row);
                            setEditOpen(true);
                        }}
                        style={{ marginRight: 8 }}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDelete(params.row.id)}
                    >
                        Delete
                    </Button>
                    <Button
                        variant="outlined"
                        color={params.row.isActive ? "warning" : "info"}
                        size="small"
                        onClick={() => handleToggle(params.row.id)}
                    >
                        {params.row.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                </>
            )
        }
    ], [navigate, handleToggle, handleDelete]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg">
          <Typography variant="h4">My Books</Typography> {/* Theme handles mb */}
          <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={() => setOpen(true)}>Add Book</Button> {/* Consistent margin */}
          <div style={{ height: 400, width: '100%' }}>
              <DataGrid
                  rows={books}
                  rowCount={rowCount}
                  columns={columns}
                  loading={booksLoading}
                  paginationModel={paginationModel}
                  onPaginationModelChange={setPaginationModel}
                  paginationMode="server"
                  pageSizeOptions={[5, 10, 20]}
              />
          </div> {/* DataGrid container */}
          {booksError && <Alert severity="error" sx={{ mt: 2 }}>Failed to load books.</Alert>}
  
          {/* Add Book Dialog */}
          <Dialog open={open} onClose={() => setOpen(false)}>
              <DialogTitle>Add Book</DialogTitle>
              <DialogContent>
                  <TextField label="Name" fullWidth margin="normal" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  <TextField label="Max Customers" type="number" fullWidth margin="normal" value={form.maxCustomers} onChange={e => setForm({ ...form, maxCustomers: e.target.value })} />
                  <DatePicker
                    label="Start Month (YYYY-MM)" // Explicit label for clarity
                    views={['year', 'month']}
                    inputFormat="yyyy-MM"
                    value={form.startMonthIso ? new Date(form.startMonthIso) : null}
                    onChange={(newValue) => {
                      if (newValue) {
                        const year = newValue.getFullYear();
                        const month = (newValue.getMonth() + 1).toString().padStart(2, '0');
                        setForm({ ...form, startMonthIso: `${year}-${month}` });
                      } else {
                        setForm({ ...form, startMonthIso: '' });
                      }
                    }}
                    renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                  />
              </DialogContent>
              <DialogActions>
                  <Button onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate} variant="contained">Create</Button>
              </DialogActions>
          </Dialog>
          {/* Edit Book Dialog */}
          <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
              <DialogTitle>Edit Book</DialogTitle>
              <DialogContent>
                  <TextField label="Name" fullWidth margin="normal" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                  <TextField label="Max Customers" type="number" fullWidth margin="normal" value={editForm.maxCustomers} onChange={e => setEditForm({ ...editForm, maxCustomers: e.target.value })} />
                  <DatePicker
                    label="Start Month (YYYY-MM)" // Explicit label for clarity
                    views={['year', 'month']}
                    inputFormat="yyyy-MM"
                    value={editForm.startMonthIso ? new Date(editForm.startMonthIso) : null}
                    onChange={(newValue) => {
                      if (newValue) {
                        const year = newValue.getFullYear();
                        const month = (newValue.getMonth() + 1).toString().padStart(2, '0');
                        setEditForm({ ...editForm, startMonthIso: `${year}-${month}` });
                      } else {
                        setEditForm({ ...editForm, startMonthIso: '' });
                      }
                    }}
                    renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                  />
              </DialogContent>
              <DialogActions>
                  <Button onClick={() => setEditOpen(false)}>Cancel</Button>
                  <Button onClick={handleEdit} variant="contained">Save</Button>
              </DialogActions>
          </Dialog>
          {/* Delete Confirmation Dialog */}
          <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogContent>
                <Typography>Are you sure you want to delete this book and all its related customers and payments?</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
                <Button onClick={handleConfirmDelete} variant="contained" color="error">Delete</Button>
            </DialogActions>
          </Dialog>
      </Container>
    </LocalizationProvider>
  );
}
