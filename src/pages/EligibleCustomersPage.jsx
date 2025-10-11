import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from '../context/AuthContext';
import { getEligibleCustomers, markCustomerAsWinner } from '../services/api';
import { DataGrid } from '@mui/x-data-grid';
import {
  Container,
  Typography,
  Alert,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions } from '@mui/material';
import { Box, Stack, Paper, IconButton } from "@mui/material";
import { useSnackbar } from '../context/SnackbarContext';
import { Search, EmojiEvents } from "@mui/icons-material";
import { useEligibleCustomers } from "../hooks/useEligibleCustomers";

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Add the manuall winner to the winner page
export default function EligibleCustomersPage() {
    const { token } = useAuth();
    const [searchText, setSearchText] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null, });

    // Debounce search input to avoid excessive API calls
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedSearch(searchText);
      }, 500);
      return () => clearTimeout(handler);
    }, [searchText]);

    const { customers, loading, error, refetch: refetchEligibleCustomers } = useEligibleCustomers(debouncedSearch);

    const { showSnackbar } = useSnackbar();

    const handleMarkAsWinner = async (customer) => {
        const [bookId, customerId] = customer.id.split('-').map(Number);
        setConfirmDialog({
            open: true,
            title: `Mark ${customer.customerName} as Winner`,
            message: `Are you sure you want to mark ${customer.customerName} as a winner?`,
            onConfirm: async () => {
            try {
                await markCustomerAsWinner(token, {
                    bookId,
                    customerId,
                    bookName: customer.bookName,
                    customerName: customer.customerName,
                    address: customer.address,
                    phone: customer.phone
                });
                showSnackbar(`Marked ${customer.customerName} as a winner!`, 'success');
                refetchEligibleCustomers(); // Refetch to update the list
            } catch (err) {
                showSnackbar(err.response?.data?.error || 'Failed to mark customer as winner', 'error');
            }
            }
        });
        
    };



    const columns = useMemo(() => [

        { field: 'bookName', headerName: 'Book Name', width: 100 },
        { field: 'customerName', headerName: 'Customer Name', width: 200 },
        { field: 'relationInfo', headerName: 'S/o, D/o, W/o', width: 180 },
        { field: 'phone', headerName: 'Phone', width: 150 },
        { field: 'address', headerName: 'Address', width: 300 },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 200,
            sortable: false,
            renderCell: (params) => {
                const customer = params.row;
                return (
                    <IconButton
                        onClick={() => handleMarkAsWinner(customer)}
                        className="
                            flex items-center gap-1
                            bg-green-50 text-green-700
                            rounded-md px-3 pb-3
                            transition-all duration-200
                            hover:bg-green-100 hover:scale-105"
                        >
                        <EmojiEvents fontSize="small" className="bg-green-500 text-white rounded-full" />
                        <span className="text-sm font-medium">Winner</span>
                        </IconButton>

                );
            }
        }
    ], []);

    if (error) {
        showSnackbar(error, 'error');
    }


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
                Eligible for Lucky Draw
            </Typography>

            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent="space-between"
                sx={{ mb: 2 }}
            >
                <Stack direction="row" spacing={1}>
                    <TextField
                        label="Search Customers"
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
                    rows={customers}
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
                    Failed to load eligible customers.
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
