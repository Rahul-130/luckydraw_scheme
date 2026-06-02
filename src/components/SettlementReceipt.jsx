import React from 'react';
import { Box, Typography, Divider, Grid, Paper, Stack } from '@mui/material';

const SettlementReceipt = ({ customer, book, user, isDuplicate = false }) => {
    const bonusAmount = customer.bonusAmount || customer.bonus_amount || 0;
    const settledDate = customer.settledDate || customer.settled_date;
    const settlementReceiptNo = customer.settlementReceiptNo || customer.settlement_receipt_no;
    const settlementAgentName = customer.settlementAgentName || customer.settlement_agent_name;

    const totalSettlement = Number(customer.totalPaid || 0) + Number(bonusAmount);

    return (
        <Paper 
            elevation={0} 
            sx={{ 
                p: 0.2, // Slightly increased padding for readability
                width: '72mm', 
                maxWidth: '72mm', // Fixed width for printer
                margin: 'auto', 
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#fff', 
                color: '#000',
                "@media print": {
                    maxWidth: '100%',
                    p: 1,
                    overflow: 'hidden'
                }
            }}
        >
            {isDuplicate && (
                <Typography
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%) rotate(-45deg)',
                        fontSize: '3.5rem',
                        fontWeight: 900,
                        color: 'rgba(0,0,0,0.08)',
                        zIndex: 0,
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                    }}
                >
                    DUPLICATE
                </Typography>
            )}
            {/* Header / Company Details */}
            <Box sx={{ textAlign: 'center', mb: 0.5, borderBottom: '1px solid #000', pb: 0.2 }}> {/* Reduced pb */}
                <Typography variant="h6" sx={{ fontWeight: 'bold', textTransform: 'uppercase', lineHeight: 1, fontSize: '0.75rem' }}> {/* Smaller font */}
                    {user?.company_name || 'Settlement Receipt'}
                </Typography>
                <Typography variant="caption" sx={{display: 'block', mt:0.1, fontSize: '0.5rem'}}>{user?.company_address}</Typography> {/* Smaller font */}
                <Typography variant="caption" sx={{fontWeight: 'bold', fontSize: '0.5rem'}}> {/* Smaller font */}
                    {user?.company_cell && `Cell: ${user.company_cell}`} 
                    {user?.company_phone && ` | Ph: ${user.company_phone}`}
                </Typography>
            </Box>

            <Divider sx={{ mb: 0.2, borderBottomWidth: 1, borderColor: '#000' }} /> {/* Reduced mb */}

            <Box sx={{ mb: 0.2 }}> {/* Reduced mb */}
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', fontSize: '0.6rem'}}> {/* Smaller font */}
                    Settlement Information
                </Typography>
                <Box sx={{ mt: 0.1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ fontSize: '0.55rem' }}>Rec. No:</Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 'bold' }}>{settlementReceiptNo}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ fontSize: '0.55rem' }}>DATE:</Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 'bold' }}>{new Date(settledDate || Date.now()).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ fontSize: '0.55rem' }}>AGENT:</Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 'bold' }}>{settlementAgentName || 'N/A'}</Typography>
                    </Box>
                </Box>
                <Box sx={{ textAlign: 'center', mt: 0.5 }}> {/* Reduced mt */}
                    <Typography variant="body2" sx={{ fontWeight: 'bold', border: '1px solid #000', p: 0.1, display: 'inline-block', fontSize: '0.6rem' }}> {/* Smaller font, reduced padding */}
                        {customer.isWinner ? 'STATUS: PRIZE COLLECTED' : 'STATUS: ACCOUNT SETTLED'}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ mb: 0.5 }}> {/* Reduced mb */}
                <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: 'text.secondary', display: 'block', borderBottom: '1px solid #ddd', mb: 0.1, fontSize: '0.6rem' }}>Customer Details</Typography> {/* Smaller font, reduced mb */}
                <Typography variant="body2" sx={{ fontSize: '0.65rem' }}><strong>Name:</strong> {customer.name}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.65rem' }}><strong>ID:</strong> {customer.id}</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.65rem' }}><strong>Ph:</strong> {customer.phone}</Typography>
                </Box>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.1, fontSize: '0.55rem' }}><strong>Address:</strong> {customer.address}</Typography> {/* Reduced mt */}
            </Box>

            <Box sx={{ mb: 0.5 }}> {/* Reduced mb */}
                <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: 'text.secondary', display: 'block', borderBottom: '1px solid #ddd', mb: 0.1, fontSize: '0.6rem' }}>Group Details</Typography> {/* Smaller font, reduced mb */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.65rem' }}><strong>Group:</strong> {book?.name}</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.65rem' }}><strong>Start:</strong> {book?.startMonthIso}</Typography>
                </Box>
            </Box>

            <Box sx={{ mt: 0.2, p: 0.5, border: '1px solid #000', borderRadius: 0.5 }}> {/* Reduced mt, p, borderRadius */}
                <Typography variant="caption" sx={{ mb: 0.2, fontWeight: 'bold', textAlign: 'center', display: 'block', fontSize: '0.7rem' }}>FINANCIAL SUMMARY</Typography> {/* Smaller font, reduced mb */}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2 }}> {/* Reduced mb */}
                    <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>Paid ({customer.PAYMENT_COUNT} mths):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}>₹{Number(customer.totalPaid).toLocaleString('en-IN')}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2 }}> {/* Reduced mb */}
                    <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>Bonus Amount:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}>₹{Number(bonusAmount).toLocaleString('en-IN')}</Typography>
                </Box>

                <Divider sx={{ my: 0.1, borderColor: '#000' }} /> {/* Reduced my */}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.2 }}> {/* Reduced mt */}
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}>NET PAYABLE:</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}> {/* Smaller h6 */}
                        ₹{totalSettlement.toLocaleString('en-IN')}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}> {/* Reduced mt */}
                <Box sx={{ width: 50, borderBottom: '1px solid #000', mb: 0.1, mx: 'auto' }} /> {/* Reduced width, mb */}
                <Typography variant="caption" sx={{ fontSize: '0.55rem' }}>Authorized</Typography>
            </Box>
            
        </Paper>
    );
};

export default SettlementReceipt;
