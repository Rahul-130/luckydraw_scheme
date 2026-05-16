import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Container, 
    Typography, 
    TextField, 
    Button, 
    Box, 
    Paper, 
    Autocomplete,
    InputAdornment 
} from '@mui/material';
import { useBooks } from '../hooks/useBooks';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';
import PageLayout from '../components/PageLayout';
import { 
    Payment, 
    Book, 
    Person, 
    AccountBalanceWallet, 
    Savings, 
    CardGiftcard, 
    AccountBalance,
    CallMade
} from '@mui/icons-material';

export default function HomePage() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [bookSearch, setBookSearch] = useState('');
    const debouncedBookSearch = useDebounce(bookSearch, 300);
    
    // Fetch books based on search
    const { books, loading } = useBooks({ searchText: debouncedBookSearch });
    
    const [selectedBook, setSelectedBook] = useState(null);
    const [customerId, setCustomerId] = useState('');
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (selectedBook && token) {
            fetch(`/api/books/${selectedBook.id}/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('Failed to fetch stats');
            })
            .then(data => setStats(data))
            .catch(err => {
                console.error(err);
                setStats(null);
            });
        } else {
            setStats(null);
        }
    }, [selectedBook, token]);

    const handleNavigate = (e) => {
        e.preventDefault();
        if (selectedBook && customerId) {
            navigate(`/books/${selectedBook.id}/customers/${customerId}/payments`);
        }
    };

    return (
        <PageLayout>
            <Container maxWidth="sm" sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
                <Paper 
                    elevation={4} 
                    sx={{ 
                        p: 5, 
                        borderRadius: 4, 
                        width: '100%',
                        background: (theme) => `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
                    }}
                >
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
                            Make Payment
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Select a book and enter customer ID to proceed.
                        </Typography>
                    </Box>
                    
                    <Box component="form" onSubmit={handleNavigate} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Autocomplete
                            options={books || []}
                            getOptionLabel={(option) => option.name}
                            loading={loading}
                            onInputChange={(event, newInputValue) => {
                                setBookSearch(newInputValue);
                            }}
                            onChange={(event, newValue) => {
                                setSelectedBook(newValue);
                            }}
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    label="Book / Group Name" 
                                    variant="outlined" 
                                    fullWidth 
                                    placeholder="Search book..."
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (
                                            <>
                                                <InputAdornment position="start">
                                                    <Book color="action" />
                                                </InputAdornment>
                                                {params.InputProps.startAdornment}
                                            </>
                                        )
                                    }}
                                />
                            )}
                        />

                        {stats && (
                            <Box sx={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(2, 1fr)', 
                                gap: 1.5,
                                mt: -1,
                                mb: 1
                            }}>
                                <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'primary.50', borderRadius: 2, textAlign: 'center', border: '1px solid', borderColor: 'primary.100' }}>
                                    <AccountBalanceWallet color="primary" fontSize="small" sx={{ mb: 0.5 }} />
                                    <Typography variant="caption" display="block" color="text.secondary" fontWeight="bold">Collected</Typography>
                                    <Typography variant="body2" color="primary.main" fontWeight="bold">₹{stats.totalCollected?.toLocaleString('en-IN')}</Typography>
                                </Paper>
                                
                                <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'info.50', borderRadius: 2, textAlign: 'center', border: '1px solid', borderColor: 'info.100' }}>
                                    <AccountBalance color="info" fontSize="small" sx={{ mb: 0.5 }} />
                                    <Typography variant="caption" display="block" color="text.secondary" fontWeight="bold">Remaining</Typography>
                                    <Typography variant="body2" color="info.main" fontWeight="bold">₹{(stats.totalCollected - stats.totalSettled)?.toLocaleString('en-IN')}</Typography>
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'warning.50', borderRadius: 2, textAlign: 'center', border: '1px solid', borderColor: 'warning.100' }}>
                                    <Savings color="warning" fontSize="small" sx={{ mb: 0.5 }} />
                                    <Typography variant="caption" display="block" color="text.secondary" fontWeight="bold">Settled</Typography>
                                    <Typography variant="body2" color="warning.main" fontWeight="bold">₹{stats.totalSettled?.toLocaleString('en-IN')}</Typography>
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'success.50', borderRadius: 2, textAlign: 'center', border: '1px solid', borderColor: 'success.100' }}>
                                    <CardGiftcard color="success" fontSize="small" sx={{ mb: 0.5 }} />
                                    <Typography variant="caption" display="block" color="text.secondary" fontWeight="bold">Bonus</Typography>
                                    <Typography variant="body2" color="success.main" fontWeight="bold">₹{stats.totalBonus?.toLocaleString('en-IN')}</Typography>
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'error.50', borderRadius: 2, textAlign: 'center', border: '1px solid', borderColor: 'error.100', gridColumn: 'span 2' }}>
                                    <CallMade color="error" fontSize="small" sx={{ mb: 0.5 }} />
                                    <Typography variant="caption" display="block" color="text.secondary" fontWeight="bold">Outflow</Typography>
                                    <Typography variant="body2" color="error.main" fontWeight="bold">₹{(stats.totalSettled + stats.totalBonus)?.toLocaleString('en-IN')}</Typography>
                                </Paper>
                            </Box>
                        )}

                        <TextField
                            label="Customer ID"
                            variant="outlined"
                            fullWidth
                            value={customerId}
                            onChange={(e) => setCustomerId(e.target.value)}
                            type="number"
                            placeholder="Enter Customer ID"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Person color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Button 
                            type="submit"
                            variant="contained" 
                            size="large" 
                            disabled={!selectedBook || !customerId}
                            startIcon={<Payment />}
                            sx={{ 
                                py: 1.5, 
                                fontSize: '1.1rem', 
                                borderRadius: 2,
                                mt: 2,
                                textTransform: 'none',
                                fontWeight: 'bold'
                            }}
                        >
                            Go to Payments
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </PageLayout>
    );
}
