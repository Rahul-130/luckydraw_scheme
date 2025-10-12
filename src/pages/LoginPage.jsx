import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext';
import { login, loginWithOTP, requestPasswordReset, completePasswordReset } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Login as LoginIcon, VpnKey, Lock, Visibility, VisibilityOff } from "@mui/icons-material";
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { validatePassword, PASSWORD_REQUIREMENTS } from '../utils/validation';

export default function LoginPage() {
    const { login: loginUser } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loginMethod, setLoginMethod] = useState('password');
    const [showPassword, setShowPassword] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);


    const navigate = useNavigate();

    // State for Password Reset Modal
    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [resetStep, setResetStep] = useState('request'); // 'request' or 'complete'
    const [resetEmail, setResetEmail] = useState('');
    const [resetOtp, setResetOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetSuccess, setResetSuccess] = useState('');

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

    const handleResetRequest = async () => {
        setResetError('');
        try {
            await requestPasswordReset(resetEmail);
            setResetStep('complete');
        } catch (err) {
            setResetError(err.response?.data?.message || 'Could not process request. Ensure user exists and has 2FA enabled.');
        }
    };

    const handleResetComplete = async () => {
        setResetError('');
        setResetSuccess('');

        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            setResetError(passwordError);
            return;
        }
        try {
            await completePasswordReset(resetEmail, resetOtp, newPassword);
            setResetSuccess('Password has been reset successfully! You can now close this and log in.');
            setTimeout(() => {
                handleCloseResetModal();
            }, 2000);
        } catch (err) {
            setResetError(err.response?.data?.message || 'Invalid OTP or password. Please try again.');
        }
    };

    const handleCloseResetModal = () => {
        setResetModalOpen(false);
        // Reset modal state for next time
        setTimeout(() => {
            setResetStep('request');
            setResetEmail('');
            setResetOtp('');
            setNewPassword('');
            setResetError('');
            setResetSuccess('');
        }, 300);
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
    <div className="flex flex-wrap min-h-screen">
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center bg-slate-100 p-6 sm:p-12">
        <div className="w-full max-w-md mx-auto">
          <div className="flex flex-col items-center">
            <LoginIcon color="primary" className="!text-4xl mb-2" />
            <Typography component="h1" variant="h4" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center', color: '#000' }}>
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
                <TextField
                  required
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              ) : (
                <TextField required fullWidth label="Authenticator OTP or Recovery Code" type={showOtp ? 'text' : 'password'} value={otp} onChange={(e) => setOtp(e.target.value)} InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowOtp(!showOtp)} edge="end">
                        {showOtp ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }} />
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
        </div>
      </div>

      {/* Password Reset Modal */}
      <Dialog open={resetModalOpen} onClose={handleCloseResetModal}>
        <DialogTitle>{resetStep === 'request' ? 'Reset Password' : 'Enter Details'}</DialogTitle>
        <DialogContent>
            {resetError && <Alert severity="error" className="!mb-4">{resetError}</Alert>}
            {resetSuccess && <Alert severity="success" className="!mb-4">{resetSuccess}</Alert>}
            {resetStep === 'request' ? (
                <>
                    <Typography variant="body2" className="!mb-4">Enter your email to begin the reset process. 2FA must be enabled on your account.</Typography>
                    <TextField autoFocus margin="dense" label="Email Address" type="email" fullWidth variant="standard" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
                </>
            ) : (
                <>
                    <Typography variant="body2" className="!mb-4">Enter an OTP from your authenticator app or a recovery code, along with your new password.</Typography>
                    <TextField margin="dense" label="Authenticator OTP or Recovery Code" type={showOtp ? 'text' : 'password'} fullWidth variant="standard" value={resetOtp} onChange={(e) => setResetOtp(e.target.value)} InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowOtp(!showOtp)} edge="end">
                            {showOtp ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}/>
                    <TextField margin="dense" label="New Password" type={showNewPassword ? 'text' : 'password'} fullWidth variant="standard" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} error={!!(newPassword && validatePassword(newPassword))} helperText={PASSWORD_REQUIREMENTS} InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }} />
                    {newPassword && <PasswordStrengthMeter password={newPassword} />}
                    
                </>
            )}
        </DialogContent>
        <DialogActions>
            <Button onClick={handleCloseResetModal}>Cancel</Button>
            {resetStep === 'request' ? (
                <Button onClick={handleResetRequest} variant="contained">Request Reset</Button>
            ) : (
                <Button onClick={handleResetComplete} variant="contained" disabled={!!resetSuccess}>Complete Reset</Button>
            )}
        </DialogActions>
      </Dialog>

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
