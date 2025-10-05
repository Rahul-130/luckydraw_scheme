import React, { useState } from 'react';
import { runLuckyDraw } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';
import { Container, Typography, Button, TextField, Dialog,
  DialogTitle,
  DialogContent,
  DialogActions, } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

export default function LuckyDrawPage() {
  const { token } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleConfirmRun = async () => {
    setLoading(true);
    setDialogOpen(false); // close dialog
    setWinners([]);

    try {
      const res = await runLuckyDraw(token, password);
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
    setLoading(false);
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ mb: 2 }}>
        Lucky Draw
      </Typography>

      <Button
        variant="contained"
        color="primary"
        sx={{ mb: 2 }}
        onClick={() => setDialogOpen(true)}
        disabled={loading}
      >
        {loading ? 'Running...' : 'Run Lucky Draw'}
      </Button>

      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={winners.map((w, idx) => ({ id: idx + 1, ...w }))}
          columns={[
            { field: 'bookId', headerName: 'Book ID', width: 100 },
            { field: 'bookName', headerName: 'Book Name', width: 180 },
            { field: 'customerId', headerName: 'Customer ID', width: 120 },
            { field: 'customerName', headerName: 'Customer Name', width: 180 },
            { field: 'address', headerName: 'Address', width: 200 },
            { field: 'phone', headerName: 'Phone', width: 150 },
          ]}
          pageSize={5}
          rowsPerPageOptions={[5]}
          disableSelectionOnClick
        />
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Confirm Lucky Draw</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1 }}>
            Are you sure you want to run the lucky draw? Please enter the admin password to confirm.
          </Typography>
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmRun}
            disabled={!password.trim() || loading}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}