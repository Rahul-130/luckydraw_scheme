import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "../context/SnackbarContext";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { changePassword } from "../services/api";
import { LockReset, Visibility, VisibilityOff } from "@mui/icons-material";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { validatePassword, PASSWORD_REQUIREMENTS } from "../utils/validation";

export default function ChangePasswordPage() {
  const { token, logout } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [error, setError] = useState("");
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      await changePassword({ oldPassword, newPassword }, token);
      showSnackbar(
        "Password changed successfully. Logging you out...",
        "success"
      );
      setTimeout(() => {
        logout();
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to change password");
    }
  };

  const isButtonDisabled =
    !oldPassword ||
    !newPassword ||
    newPassword.length < 8 ||
    newPassword !== confirmNewPassword;

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
          <LockReset color="primary" sx={{ fontSize: 40, mb: 1 }} />
          <Typography component="h1" variant="h4" sx={{ mb: 2, fontWeight: "bold" }}>
            Change Password
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: "100%" }}>
            <TextField label="Old Password" type={showOldPassword ? 'text' : 'password'} fullWidth margin="normal" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowOldPassword(!showOldPassword)} edge="end">
                    {showOldPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }} />
            <TextField label="New Password" name="newPassword" type={showNewPassword ? 'text' : 'password'} fullWidth margin="normal" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} error={!!(newPassword && validatePassword(newPassword))} helperText={PASSWORD_REQUIREMENTS} InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }} />
            {newPassword && <PasswordStrengthMeter password={newPassword} />}
            <TextField
              label="Confirm New Password"
              type={showConfirmNewPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              error={confirmNewPassword.length > 0 && newPassword !== confirmNewPassword}
              helperText={
                confirmNewPassword.length > 0 && newPassword !== confirmNewPassword
                  ? "Passwords do not match"
                  : ""
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)} edge="end">
                      {showConfirmNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 3, mb: 2, py: 1.5, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.02)' } }} disabled={isButtonDisabled}>
              Change Password
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}