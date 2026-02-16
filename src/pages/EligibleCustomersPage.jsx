import React, { useState, useMemo } from "react";
import { useAuth } from '../context/AuthContext';
import { getEligibleCustomers, markCustomerAsWinner, verifyPassword } from '../services/api';
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
import StyledDataGrid from "../components/StyledDataGrid";
import { sendWinnerCongratulationsMessage } from "../utils/whatsapp";
import SummaryBox from "../components/SummaryBox";
import PageLayout from "../components/PageLayout";
import SearchAndSummaryBox from "../components/SearchAndSummaryBox";
import PasswordOTPConfirmationDialog from "../components/PasswordOTPConfirmationDialog";
import { extractApiErrorMessage } from "../utils/apiUtils";

// Add the manuall winner to the winner page
export default function EligibleCustomersPage() {
    const { token, user } = useAuth();
    const [searchText, setSearchText] = useState("");
    const debouncedSearch = useDebounce(searchText, 500);

    const { customers, loading, error, refetch: refetchEligibleCustomers } = useEligibleCustomers(debouncedSearch);

    const { showSnackbar } = useSnackbar();

    const [otpDialogOpen, setOtpDialogOpen] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    const handleMarkAsWinner = (customer) => {
        setPendingAction({ type: 'mark', data: customer });
        setOtpDialogOpen(true);
    };

    const handleConfirmOtp = async (password, otp) => {
        setOtpLoading(true);
        try {
            await verifyPassword(token, password, otp);
            const customer = pendingAction.data;
            const [bookId, customerId] = customer.id.split('-').map(Number);

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
            sendWinnerCongratulationsMessage(customer);
            refetchEligibleCustomers();
            setOtpDialogOpen(false);
            setPendingAction(null);
        } catch (err) {
            showSnackbar(extractApiErrorMessage(err, "Action failed"), 'error');
        } finally {
            setOtpLoading(false);
        }
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
            <Typography variant="h4" sx={{ textAlign: 'center', mb: 2, fontWeight: 'bold', color: 'text.primary' }}>
                Eligible for Lucky Draw
            </Typography>

            <SearchAndSummaryBox
              searchLabel="Search Customers"
              searchText={searchText}
              onSearchChange={(e) => setSearchText(e.target.value)}
              summaryItems={[
                { label: 'Total Eligible', value: customers.length, color: 'primary.main' },
              ]}
            />

            <StyledDataGrid
                    rows={customers}
                    columns={columns}
                    loading={loading}
                    pageSizeOptions={[5, 10, 20, 100]}
                />

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    Failed to load eligible customers.
                </Alert>
            )}

            <PasswordOTPConfirmationDialog
                open={otpDialogOpen}
                onClose={() => { setOtpDialogOpen(false); setPendingAction(null); }}
                onConfirm={handleConfirmOtp}
                loading={otpLoading}
                title={`Mark ${pendingAction?.data?.customerName} as Winner?`}
                message={`Are you sure you want to mark ${pendingAction?.data?.customerName} as a winner? Please enter your credentials to confirm.`}
                is2FAEnabled={user?.is2FAEnabled}
            />
        </PageLayout>
    );
}
