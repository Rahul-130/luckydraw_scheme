import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext';
import { login } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Container, Typography, Box, Alert } from '@mui/material';


export default function LoginPage() {
    const { login: loginUser } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await login({ email, password });
            loginUser(res.data.user, res.data.token);
            navigate('/books');
        } catch { 
            setError('Invalid email or password');
        }
    };

  return (
    <Container maxWidth="xs" className="flex flex-col items-center justify-center min-h-screen">
        <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography component="h1" variant="h5">Login</Typography>
            {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                <TextField margin="normal" required fullWidth label="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus />
                <TextField margin="normal" required fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                <Button type="submit" fullWidth variant="contained" className="mt-3 mb-2" sx={{ mt: 3, mb: 2 }}> Login </Button>
            </Box>
        </Box>
        {/* if dont have account create account link to singup page */}
        <Typography variant="body2" sx={{ mt: 2 }}>
            Don't have an account? <Button onClick={() => navigate('/signup')}>Sign Up</Button>
        </Typography>
    </Container>
  )
}
