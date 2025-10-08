import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext';
import { login } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert,
  Paper,
} from "@mui/material";
import { Login as LoginIcon } from "@mui/icons-material";

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
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(to right, #f0f4f8, #d9e2ec)",
      }}
    >
      <Container component="main" maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: 3,
          }}
        >
          <LoginIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
          <Typography component="h1" variant="h4" sx={{ mb: 2, fontWeight: "bold" }}>
            Login
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ mt: 1, width: "100%" }}
          >
            {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
            <TextField margin="normal" required fullWidth label="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus />
            <TextField margin="normal" required fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, py: 1.5 }}>Login</Button>
            <Typography variant="body2" align="center">
              Don't have an account?{" "}
              <Button onClick={() => navigate("/signup")} size="small">Sign Up</Button>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
