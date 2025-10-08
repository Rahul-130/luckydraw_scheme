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
} from "@mui/material";
import { changePassword } from "../services/api";
import { LockReset } from "@mui/icons-material";

export default function ChangePasswordPage() {
  const { token, logout } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
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
            <TextField label="Old Password" type="password" fullWidth margin="normal" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
            <TextField label="New Password" type="password" fullWidth margin="normal" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} error={newPassword.length > 0 && newPassword.length < 8} helperText={newPassword.length > 0 && newPassword.length < 8 ? "Password must be at least 8 characters" : ""} />
            <TextField label="Confirm New Password" type="password" fullWidth margin="normal" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} error={confirmNewPassword.length > 0 && newPassword !== confirmNewPassword} helperText={confirmNewPassword.length > 0 && newPassword !== confirmNewPassword ? "Passwords do not match" : ""} />
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