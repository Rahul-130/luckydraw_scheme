import React, { useState } from 'react';
import { runLuckyDraw } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';
import { Container, Typography, Button, TextField, Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Stack,
    Paper,
    CircularProgress,
    InputAdornment,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { EmojiEvents } from '@mui/icons-material';
import PasswordInput from '../components/PasswordInput';
import PageLayout from '../components/PageLayout';


export default function LuckyDrawPage() {
  const { token } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleConfirmRun = async () => {
    setLoading(true);
    setDialogOpen(false); // close dialog
    setWinners([]);
    showSnackbar('Running Lucky Draw...', 'info');

    try {
      const res = await runLuckyDraw(token, password, otp);
      const newWinners = res.data.winners || [];
      setWinners(newWinners);

      if (newWinners.length > 0) {
        showSnackbar('Lucky Draw completed! Winners list will be downloaded.', 'success');

        // Create CSV content
        const headers = ['Book Name', 'Customer Name', 'Address', 'Phone'];
        const csvRows = [
          headers.join(','),
          ...newWinners.map((row) =>
            [`"${row.bookName}"`, `"${row.customerName}"`, `"${row.address}"`, `"${row.phone}"`].join(',')
          ),
        ];
        const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'lucky_draw_winners.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        showSnackbar('No eligible winners found.', 'info');
      }
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Failed to run lucky draw', 'error');
    }

    setPassword('');
    setOtp('');
    setLoading(false);
  };

  return (
    <PageLayout>
        <Typography variant="h4" sx={{ textAlign: 'center', mb: 2, fontWeight: 'bold', color: '#000' }}>
          Lucky Draw
        </Typography>

        <Stack direction="row" justifyContent="center" sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => setDialogOpen(true)}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <EmojiEvents />}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
              },
            }}
          >
            {loading ? 'Running...' : 'Run Lucky Draw'}
          </Button>
        </Stack>

        <Paper elevation={6} sx={{ p: 2, borderRadius: 3, backgroundColor: '#fff' }}>
          <Box sx={{ height: 500, width: '100%' }}>
            <DataGrid
              rows={winners.map((w, idx) => ({ id: idx + 1, ...w }))}
              columns={[
                { field: 'bookId', headerName: 'Book ID', width: 100 },
                { field: 'bookName', headerName: 'Book Name', width: 180 },
                { field: 'customerId', headerName: 'Customer ID', width: 120 },
                { field: 'customerName', headerName: 'Name', width: 180 },
                { field: 'relationInfo', headerName: 'S/o, D/o, W/o', width: 180 },
                { field: 'address', headerName: 'Address', width: 200 },
                { field: 'phone', headerName: 'Phone', width: 150 },
              ]}
              loading={loading}
              pageSizeOptions={[5, 10, 20, 100]}
              sx={{
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'rgba(0, 123, 255, 0.08)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                },
                '& .MuiDataGrid-row.Mui-even': { backgroundColor: '#f9f9f9' },
                '& .MuiDataGrid-columnHeaders': {
                  color: (theme) => theme.palette.text.primary,
                  fontWeight: 'bold',
                },
                borderRadius: 2,
                '& .MuiDataGrid-cell': { py: 1.2 },
              }}
            />
          </Box>
        </Paper>

        {/* Confirmation Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
          <DialogTitle>Confirm Lucky Draw</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              To ensure security, please enter your password and a one-time password (OTP) from your authenticator app to proceed.
            </Typography>
            <PasswordInput
              label="Password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <PasswordInput
              label="Authenticator OTP"
              fullWidth
              margin="normal"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfirmRun}
              disabled={!password.trim() || !otp.trim() || loading}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
    </PageLayout>
  );
}