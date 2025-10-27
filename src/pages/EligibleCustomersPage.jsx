import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from '../context/AuthContext';
import { getEligibleCustomers, markCustomerAsWinner } from '../services/api';
import {
  Container,
  Typography,
  Alert,
  Button,
  Paper,
  alpha, Box, Stack, IconButton, } from '@mui/material';
import { useSnackbar } from '../context/SnackbarContext';
import { Search, EmojiEvents } from "@mui/icons-material";
import { useEligibleCustomers } from "../hooks/useEligibleCustomers";
import StyledDataGrid from "../components/StyledDataGrid";
import { sendWhatsAppMessage } from "../utils/whatsapp";
import StyledSearchBar from "../components/StyledSearchBar";
import ConfirmationDialog from "../components/ConfirmationDialog";
import SummaryBox from "../components/SummaryBox";

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
                    relationInfo: customer.relationInfo,
                    address: customer.address,
                    phone: customer.phone
                });
                showSnackbar(`Marked ${customer.customerName} as a winner!`, 'success');

                // --- Send WhatsApp message based on selected method ---
                const message = `Congratulations ${customer.customerName}! You have been selected as a winner in the lucky draw for the book "${customer.bookName}". Your prize will be sent to your address: ${customer.address}.`;
                sendWhatsAppMessage(customer.phone, message);

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
        { field: 'address', headerName: 'Address', flex: 1, minWidth: 200 },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 200,
            sortable: false,
            renderCell: (params) => {
                const customer = params.row;
                return (
                    <Button
                        onClick={() => handleMarkAsWinner(customer)}
                        startIcon={<EmojiEvents />}
                        sx={{
                            color: 'success.main',
                            backgroundColor: (theme) => alpha(theme.palette.success.main, 0.1),
                            '&:hover': { backgroundColor: (theme) => alpha(theme.palette.success.main, 0.2) }
                        }}
                    >
                        Winner
                    </Button>

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
        <Container>
            <Typography variant="h4" sx={{ textAlign: 'center', mb: 2, fontWeight: 'bold', color: '#000' }}>
                Eligible for Lucky Draw
            </Typography>

            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ sm: 'center' }}
                sx={{ mb: 2 }}
            >   
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: '70%' } }}>
                    <StyledSearchBar
                        label="Search Customers"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </Box>
                <SummaryBox
                  sx={{ width: { xs: '100%', sm: '30%' }, boxSizing: 'border-box' }}
                  items={[
                    { label: 'Total Eligible', value: customers.length, color: 'primary.main' },
                  ]}
                />
            </Stack>

            <Paper elevation={6} sx={{ p: 2, borderRadius: 3, backgroundColor: "#fff" }}>
            <Box sx={{ height: 500, width: '100%' }}>
                <StyledDataGrid
                    rows={customers}
                    columns={columns}
                    loading={loading}
                    pageSizeOptions={[5, 10, 20, 100]}
                />
            </Box>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    Failed to load eligible customers.
                </Alert>
            )}

            <ConfirmationDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
                onConfirm={() => {
                    if (confirmDialog.onConfirm) confirmDialog.onConfirm();
                    setConfirmDialog({ ...confirmDialog, open: false });
                }}
            />

        </Container>
      </Box>
    );
}
