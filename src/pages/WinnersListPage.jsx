import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { unmarkCustomerAsWinner, verifyPassword } from '../services/api';
import { Container, Typography, Alert, Button, Box, Stack, IconButton, Paper } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useMemo } from 'react';
import { useSnackbar } from '../context/SnackbarContext';
import { useWinners } from '../hooks/useWinners';
import { useDebounce } from '../hooks/useDebounce';
import StyledDataGrid from '../components/StyledDataGrid';
import SummaryBox from '../components/SummaryBox';
import { Search, EmojiEvents } from "@mui/icons-material";
import { sendUnmarkWinnerMessage } from '../utils/whatsapp';
import PageLayout from '../components/PageLayout';
import SearchAndSummaryBox from '../components/SearchAndSummaryBox';
import PasswordOTPConfirmationDialog from '../components/PasswordOTPConfirmationDialog';
import { extractApiErrorMessage } from '../utils/apiUtils';


export default function WinnersListPage() {
    const { token, user } = useAuth();
    const [searchText, setSearchText] = useState("");
    const debouncedSearch = useDebounce(searchText, 500);
    const { showSnackbar } = useSnackbar();

    const { winners, loading, error, refetch: refetchWinners } = useWinners(debouncedSearch);

    const [otpDialogOpen, setOtpDialogOpen] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    const handleUnmarkAsWinner = useCallback((customer) => {
        setPendingAction({ type: 'unmark', data: customer });
        setOtpDialogOpen(true);
    }, []);

    const handleConfirmOtp = async (password, otp) => {
        setOtpLoading(true);
        try {
            await verifyPassword(token, password, otp);
            const customer = pendingAction.data;

            await unmarkCustomerAsWinner(token, {
                bookId: customer.bookId,
                customerId: customer.customerId
            });
            showSnackbar(`Unmarked ${customer.customerName} as a winner!`, 'success');
            sendUnmarkWinnerMessage(customer);
            refetchWinners();
            setOtpDialogOpen(false);
            setPendingAction(null);
        } catch (err) {
            showSnackbar(extractApiErrorMessage(err, "Action failed"), 'error');
        } finally {
            setOtpLoading(false);
        }
    };

    const columns = useMemo(() => [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'customerName', headerName: 'Winner Name', width: 200 },
        { field: 'relationInfo', headerName: 'S/o, D/o, W/o', width: 180 },
        { field: 'bookName', headerName: 'Book', width: 150 },
        { field: 'address', headerName: 'Address', flex: 1, minWidth: 150 },
        { field: 'phone', headerName: 'Phone', width: 150 },
        { 
            field: 'drawDate', 
            headerName: 'Date Won', 
            width: 200,
            valueFormatter: (value) => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ''
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            renderCell: (params) => {
                if (params.row.settledDate) return null;
                return (
                    <Button
                        onClick={() => handleUnmarkAsWinner(params.row)}
                        startIcon={<EmojiEvents />}
                        size="small"
                        sx={{
                            color: 'warning.main',
                            backgroundColor: (theme) => alpha(theme.palette.warning.main, 0.1),
                            '&:hover': { backgroundColor: (theme) => alpha(theme.palette.warning.main, 0.2) }
                        }}
                    >
                        Unmark
                    </Button>
                );
            }
        }
    ], [handleUnmarkAsWinner]);

    const winnerSummary = useMemo(() => {
        const total = winners.length;
        const activeBookWinners = winners.filter(w => w.isBookActive).length;
        const inactiveBookWinners = total - activeBookWinners;
        return {
            total,
            activeBookWinners,
            inactiveBookWinners
        };
    }, [winners]);

    return (
        <PageLayout>
            <Typography variant="h4" sx={{ textAlign: 'center', mb: 2, fontWeight: 'bold', color: 'text.primary' }}>
                Lucky Draw Winners
            </Typography>

            <SearchAndSummaryBox
              searchLabel="Search Winners"
              searchText={searchText}
              onSearchChange={(e) => setSearchText(e.target.value)}
              summaryItems={[
                { label: 'Total', value: winnerSummary.total },
                { label: 'Active Book', value: winnerSummary.activeBookWinners, color: 'success.main' },
                { label: 'Inactive Book', value: winnerSummary.inactiveBookWinners, color: 'error.main' },
              ]}
            />

            <StyledDataGrid
                    rows={winners}
                    columns={columns}
                    loading={loading}
                    pageSizeOptions={[5, 10, 20, 100]}
                    getRowClassName={(params) =>
                        !params.row.isBookActive && "super-app-theme--inactive"
                    }
                />

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    Failed to load winners.
                </Alert>
            )}

            <PasswordOTPConfirmationDialog
                open={otpDialogOpen}
                onClose={() => { setOtpDialogOpen(false); setPendingAction(null); }}
                onConfirm={handleConfirmOtp}
                loading={otpLoading}
                title={`Unmark ${pendingAction?.data?.customerName} as Winner?`}
                message={`Are you sure you want to unmark ${pendingAction?.data?.customerName} as a winner? Please enter your credentials to confirm.`}
                is2FAEnabled={user?.is2FAEnabled}
            />
        </PageLayout>
    );
}
