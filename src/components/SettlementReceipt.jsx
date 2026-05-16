import React from 'react';
import { Box, Typography, Divider, Grid, Paper, Stack } from '@mui/material';

const SettlementReceipt = ({ customer, book, user }) => {
    const totalSettlement = Number(customer.totalPaid || 0) + Number(customer.bonusAmount || 0);

    return (
        <Paper 
            elevation={0} 
            sx={{ 
                p: 2, 
                width: '100%', 
                maxWidth: '350px', // Optimized for 80mm thermal printers
                margin: 'auto', 
                backgroundColor: '#fff', 
                color: '#000',
                "@media print": {
                    maxWidth: '100%',
                    p: 1
                }
            }}
        >
            {/* Header / Company Details */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', textTransform: 'uppercase', lineHeight: 1.2 }}>
                    {user?.company_name || 'Settlement Receipt'}
                </Typography>
                <Typography variant="body2">{user?.company_address}</Typography>
                <Typography variant="body2">
                    {user?.company_cell && `Cell: ${user.company_cell}`} 
                    {user?.company_phone && ` | Phone: ${user.company_phone}`}
                </Typography>
            </Box>

            <Divider sx={{ mb: 2, borderBottomWidth: 1, borderColor: '#000' }} />

            <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' }}>
                    Settlement Information
                </Typography>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption">RECEIPT NO:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{customer.settlementReceiptNo}</Typography>
                    </Box>
                    <Typography variant="caption">SETTLED DATE: {new Date(customer.settledDate || Date.now()).toLocaleDateString('en-IN')}</Typography>
                    <Typography variant="caption">SETTLED BY: <strong>{customer.settlementAgentName || 'N/A'}</strong></Typography>
                </Stack>
                <Box sx={{ textAlign: 'center', mt: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', border: '1px solid #000', p: 0.5, display: 'inline-block' }}>
                        {customer.isWinner ? 'STATUS: PRIZE COLLECTED' : 'STATUS: ACCOUNT SETTLED'}
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: 'text.secondary' }}>Customer Details</Typography>
                    <Typography variant="body2"><strong>CUST ID:</strong> {customer.id}</Typography>
                    <Typography variant="body2"><strong>NAME:</strong> {customer.name}</Typography>
                    <Typography variant="body2">{customer.relationInfo}</Typography>
                    <Typography variant="caption" display="block"><strong>ADDRESS:</strong> {customer.address}</Typography>
                    <Typography variant="caption"><strong>PHONE:</strong> {customer.phone}</Typography>
                </Grid>
                <Grid item xs={12} sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: 'text.secondary' }}>Book Details</Typography>
                    <Typography variant="body2"><strong>GROUP NAME:</strong> {book?.name}</Typography>
                    <Typography variant="body2"><strong>START MONTH:</strong> {book?.startMonthIso}</Typography>
                </Grid>
            </Grid>

            <Box sx={{ mt: 1, p: 1.5, border: '1px solid #000', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', textAlign: 'center' }}>FINANCIAL SUMMARY</Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption">Paid ({customer.PAYMENT_COUNT} mths):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>₹{Number(customer.totalPaid).toLocaleString('en-IN')}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption">Bonus/Div:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>₹{Number(customer.bonusAmount || 0).toLocaleString('en-IN')}</Typography>
                </Box>

                <Divider sx={{ my: 0.5, borderColor: '#000' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>TOTAL SETTLED:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        ₹{totalSettlement.toLocaleString('en-IN')}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ width: 100, borderBottom: '1px solid #000', mb: 0.5 }} />
                    <Typography variant="caption">Customer Signature</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ width: 100, borderBottom: '1px solid #000', mb: 0.5 }} />
                    <Typography variant="caption">Authorized</Typography>
                </Box>
            </Box>
            
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 3, fontSize: '0.6rem', fontStyle: 'italic' }}>
                Computer generated receipt for {book?.name}.
            </Typography>
        </Paper>
    );
};

export default SettlementReceipt;
