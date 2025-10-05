import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "../context/SnackbarContext";
import { TextField, Button, Container, Typography, Box } from "@mui/material";
import { changePassword } from "../services/api";

export default function ChangePasswordPage() {
    const { token, logout } = useAuth();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const { showSnackbar } = useSnackbar();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await changePassword({ oldPassword, newPassword }, token);
            showSnackbar("Password changed successfully. Logging you out...", "success");
            // Wait for snackbar to be visible before logging out
            setTimeout(() => {
                logout();
                localStorage.removeItem('token');
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to change password");
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            > {/* Consistent spacing */}
                <Typography component="h1" variant="h4" sx={{ mb: 2 }}> {/* Changed to h4 for consistency, added mb */}
                    Change Password
                </Typography>
                <form onSubmit={handleSubmit}>
                    <TextField label="Old Password" type="password" fullWidth margin="normal" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                    <TextField label="New Password" type="password" fullWidth margin="normal" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    {error && <Typography color="error">{error}</Typography>}
                    <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 3, mb: 2 }}>Change Password</Button>
                </form>
            </Box>
        </Container>
    );
}