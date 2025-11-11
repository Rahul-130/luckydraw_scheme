import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext';
import { login, loginWithOTP } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  Link,
} from "@mui/material";
import { Login as LoginIcon, VpnKey, Lock } from "@mui/icons-material";
import PasswordInput from '../components/PasswordInput';
import AuthLayout from '../components/AuthLayout';
import PasswordResetModal from '../components/PasswordResetModal';

export default function LoginPage() {
    const { login: loginUser } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loginMethod, setLoginMethod] = useState('password');


    const navigate = useNavigate();

    // State for Password Reset Modal
    const [resetModalOpen, setResetModalOpen] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            let res;
            if (loginMethod === 'password') {
                res = await login({ email, password });
            } else {
                res = await loginWithOTP(email, otp);
            }
            loginUser(res.data.user, res.data.token);
            // Let ProtectedRoute handle the redirection logic
            navigate('/books');
        } catch (err) { 
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        }
    };

    const handleLoginMethodChange = (event, newMethod) => {
        if (newMethod !== null) {
            setLoginMethod(newMethod);
            setError(''); // Clear errors when switching
            setPassword('');
            setOtp('');
        }
    };

  return (
    <AuthLayout branding={{ title: "Lucky Draw App", description: "Manage your books and customers with ease." }}>
      <div className="flex flex-col items-center">
        <LoginIcon color="primary" className="!text-4xl mb-2" />
        <Typography component="h1" variant="h4" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center', color: 'primary.main' }}>
          Welcome Back!
        </Typography>
      </div>
      <ToggleButtonGroup
        value={loginMethod}
        exclusive
        onChange={handleLoginMethodChange}
        fullWidth
        className="!mt-6"
      >
        <ToggleButton value="password" aria-label="login with password">
          <Lock className="!mr-2" />
          Password
        </ToggleButton>
        <ToggleButton value="otp" aria-label="login with otp">
          <VpnKey className="!mr-2" />
          OTP
        </ToggleButton>
      </ToggleButtonGroup>
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="space-y-4">
          {error && <Alert severity="error" className="w-full">{error}</Alert>}
          <TextField required fullWidth label="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus />
          {loginMethod === 'password' ? (
            <PasswordInput required fullWidth label="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          ) : (
            <PasswordInput required fullWidth label="Authenticator OTP or Recovery Code" value={otp} onChange={(e) => setOtp(e.target.value)} />
          )}
        </div>
        <Button type="submit" fullWidth variant="contained" className="!mt-6 !py-3">
          Login
        </Button>
        <div className="flex justify-between items-center !mt-4">
            <Link component="button" variant="body2" onClick={() => setResetModalOpen(true)}>
                Forgot Password?
            </Link>
            <Typography variant="body2" color="text.secondary">
                Don't have an account?{" "}
                <Button onClick={() => navigate("/signup")} size="small">Sign Up</Button>
            </Typography>
        </div>
      </form>
      {/* Password Reset Modal */}
      <PasswordResetModal open={resetModalOpen} onClose={() => setResetModalOpen(false)} />
    </AuthLayout>
  );
}
