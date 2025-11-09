import React, { useState, useMemo } from "react";
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
import { useDebounce } from "../hooks/useDebounce";
import { useConfirmationDialog } from "../hooks/useConfirmationDialog";
import StyledDataGrid from "../components/StyledDataGrid";
import { sendWinnerCongratulationsMessage } from "../utils/whatsapp";
import ConfirmationDialog from "../components/ConfirmationDialog";
import SummaryBox from "../components/SummaryBox";
import PageLayout from "../components/PageLayout";
import DataGridHeader from "../components/DataGridHeader";

// Add the manuall winner to the winner page
export default function EligibleCustomersPage() {
    const { token } = useAuth();
    const [searchText, setSearchText] = useState("");
    const debouncedSearch = useDebounce(searchText, 500);
    const { dialogConfig, showConfirmation, handleClose, handleConfirm } = useConfirmationDialog();

    const { customers, loading, error, refetch: refetchEligibleCustomers } = useEligibleCustomers(debouncedSearch);

    const { showSnackbar } = useSnackbar();

    const handleMarkAsWinner = async (customer) => {
        const [bookId, customerId] = customer.id.split('-').map(Number);
        showConfirmation({
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
                sendWinnerCongratulationsMessage(customer);

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
    ], [handleMarkAsWinner]);

    if (error) {
        showSnackbar(error, 'error');
    }


    return (
        <PageLayout>
            <Typography variant="h4" sx={{ textAlign: 'center', mb: 2, fontWeight: 'bold', color: '#000' }}>
                Eligible for Lucky Draw
            </Typography>

            <DataGridHeader
              searchLabel="Search Customers"
              searchText={searchText}
              onSearchChange={(e) => setSearchText(e.target.value)}
              summaryItems={[
                { label: 'Total Eligible', value: customers.length, color: 'primary.main' },
              ]}
            />

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
                open={dialogConfig.open}
                title={dialogConfig.title}
                message={dialogConfig.message}
                onClose={handleClose}
                onConfirm={handleConfirm}
            />
        </PageLayout>
    );
}
