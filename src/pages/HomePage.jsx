import React, { useState } from 'react';
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
import PageLayout from '../components/PageLayout';
import { Payment, Book, Person } from '@mui/icons-material';

export default function HomePage() {
    const navigate = useNavigate();
    const [bookSearch, setBookSearch] = useState('');
    const debouncedBookSearch = useDebounce(bookSearch, 300);
    
    // Fetch books based on search
    const { books, loading } = useBooks({ searchText: debouncedBookSearch });
    
    const [selectedBook, setSelectedBook] = useState(null);
    const [customerId, setCustomerId] = useState('');

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
