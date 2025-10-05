import { useState } from "react";
import { signup } from "../services/api";
import { TextField, Button, Container, Typography, Box, Alert } from '@mui/material';
import React from 'react';

export default function SignupPage() {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [success, setSuccess] = React.useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await signup({ email, password });
            setSuccess('Signup successful! Please login.');
            setError('');
        } catch {
            setError('Signup failed. Please try again.');
            setSuccess('');
        }
    };

  return (
    <Container maxWidth="xs" className="flex flex-col items-center justify-center min-h-screen">
        <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography component="h1" variant="h5">Sign Up</Typography>
            <form onSubmit={handleSubmit}>
                <TextField margin="normal" required fullWidth label="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus />
                <TextField margin="normal" required fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ width: '100%', mt: 2 }}>{success}</Alert>}
                <Button type="submit" fullWidth variant="contained" className="mt-3 mb-2" sx={{ mt: 3, mb: 2 }}> Sign Up </Button>    
            </form> 
        </Box>
        {/* if account exit please login */}
        <Typography variant="body2" sx={{ mt: 2 }}>
            Already have an account? <Button onClick={() => window.location.href = '/login'}>Login</Button>
        </Typography>
    </Container>
  )
}
