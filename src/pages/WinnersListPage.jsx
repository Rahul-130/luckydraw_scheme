import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { unmarkCustomerAsWinner } from '../services/api';
import { DataGrid } from '@mui/x-data-grid';
import { Container, Typography, Alert, Button, TextField, Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  Paper,
  IconButton,
} from '@mui/material';
import { useMemo } from 'react';
import { useSnackbar } from '../context/SnackbarContext';
import { useWinners } from '../hooks/useWinners';
import { Search, EmojiEvents } from "@mui/icons-material";

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export default function WinnersListPage() {
    const { token } = useAuth();
    const [searchText, setSearchText] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null, });

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedSearch(searchText);
      }, 500);
      return () => clearTimeout(handler);
    }, [searchText]);

    const { winners, loading, error, refetch: refetchWinners } = useWinners(debouncedSearch);

    const handleUnmarkAsWinner = async (customer) => {
        const bookId = customer.bookId;
        const customerId = customer.customerId;
        console.log(customer);
        console.log(bookId, customerId);
    
        setConfirmDialog({
            open: true,
            title: `Unmark ${customer.customerName} as Winner`,
            message: `Are you sure you want to unmark ${customer.customerName} as a winner?`,
            onConfirm: async () => {
            try {
                await unmarkCustomerAsWinner(token, {
                    bookId,
                    customerId
                });
                showSnackbar(`Unmarked ${customer.customerName} as a winner!`, 'success');
                refetchWinners();
            } catch (err) {
                showSnackbar(err.response?.data?.error || 'Failed to unmark customer as winner', 'error');
            }
            }
        });  
    };

    const columns = useMemo(() => [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'customerName', headerName: 'Winner Name', width: 200 },
        { field: 'bookName', headerName: 'Book', width: 150 },
        { field: 'address', headerName: 'Address', width: 200 },
        { field: 'phone', headerName: 'Phone', width: 150 },
        { field: 'drawDate', headerName: 'Date Won', width: 150 },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            renderCell: (params) => {
                return (
                    <IconButton
                        onClick={() => handleUnmarkAsWinner(params.row)}
                        className="
                            flex items-center gap-1
                            bg-orange-50 text-orange-700
                            rounded-md px-3 pb-3
                            transition-all duration-200
                            hover:bg-green-100 hover:scale-105"
                        >
                        <EmojiEvents fontSize="small" className="bg-orange-500 text-white rounded-full" /> 
                        <span className='text-sm font-medium'>Unmark</span>
                    </IconButton>
                );
            }
        }
    ], [handleUnmarkAsWinner]);

    const { showSnackbar } = useSnackbar();

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
            <Typography variant="h4" className="text-center mb-2 font-bold text-2xl text-gray-900">
                Lucky Draw Winners
            </Typography>

            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent="space-between"
                sx={{ mb: 2 }}
            >
                <Stack direction="row" spacing={1}>
                    <TextField
                        label="Search Winners"
                        variant="outlined"
                        size="small"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        sx={{
                            width: { xs: "100%", sm: "400px", md: "600px" },
                            "& .MuiOutlinedInput-root": {
                                borderRadius: 1.5,
                            },
                        }}
                        InputProps={{
                            startAdornment: <Search fontSize="small" sx={{ mr: 0.5 }} />,
                        }}
                    />
                </Stack>
            </Stack>

            <Paper elevation={6} sx={{ p: 2, borderRadius: 3, backgroundColor: "#fff" }}>
            <Box sx={{ height: 500, width: '100%' }}>
                <DataGrid
                    rows={winners}
                    columns={columns}
                    loading={loading}
                    pageSizeOptions={[5, 10, 20]}
                    sx={{
                        "& .MuiDataGrid-row:hover": { backgroundColor: "rgba(0, 123, 255, 0.08)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
                        "& .MuiDataGrid-row.Mui-even": { backgroundColor: "#f9f9f9" },
                        "& .MuiDataGrid-columnHeaders": { backgroundColor: "#fff", color: "#000", fontWeight: "bold" },
                        borderRadius: 2,
                        "& .MuiDataGrid-cell": { py: 1.2 },
                    }}
                />
            </Box>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    Failed to load winners.
                </Alert>
            )}

            <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
                <DialogTitle>{confirmDialog.title}</DialogTitle>
                <DialogContent>
                    <Typography>{confirmDialog.message}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>Cancel</Button>
                    <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                        if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                        setConfirmDialog({ ...confirmDialog, open: false });
                    }}
                    >
                    Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
      </Box>
    );
}
