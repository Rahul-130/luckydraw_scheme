import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext';
import { login } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Alert,
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
    <div className="flex flex-wrap min-h-screen">
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center bg-slate-100 p-6 sm:p-12">
        <div className="w-full max-w-md mx-auto">
          <div className="flex flex-col items-center">
            <LoginIcon color="primary" className="!text-4xl mb-2" />
            <Typography component="h1" variant="h4" className="!mb-4 !font-bold text-center text-gray-800">
              Welcome Back!
            </Typography>
          </div>
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="space-y-4">
              {error && <Alert severity="error" className="w-full">{error}</Alert>}
              <TextField margin="normal" required fullWidth label="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus />
              <TextField margin="normal" required fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            <Button type="submit" fullWidth variant="contained" className="!mt-6 !py-3">
              Login
            </Button>
            <Typography variant="body2" className="!mt-4 text-center text-gray-500">
              Don't have an account?{" "}
              <Button onClick={() => navigate("/signup")} size="small">Sign Up</Button>
            </Typography>
          </form>
        </div>
      </div>

      {/* Right side - Image/Branding */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 p-12 text-white">
        <div className="text-center">
          <Typography variant="h3" component="h2" className="!font-bold !mb-4">
            Lucky Draw App
          </Typography>
          <Typography variant="h6">
            Manage your books and customers with ease.
          </Typography>
        </div>
      </div>
    </div>
  );
}
