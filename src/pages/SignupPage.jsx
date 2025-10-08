import { useState } from "react";
import { signup } from "../services/api";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { PersonAdd } from "@mui/icons-material";

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      // Allow only digits for phone number
      const numericValue = value.replace(/\D/g, "");
      setForm((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      await signup({
        name: form.name,
        phone: form.phone,
        email: form.email,
        password: form.password,
      });
      setSuccess("Signup successful! Redirecting to login...");
      setForm({
        name: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed. Please try again.");
    }
  };

  const isButtonDisabled =
    !form.name ||
    !form.email ||
    form.phone.length !== 10 ||
    form.password.length < 8 ||
    form.password !== form.confirmPassword;

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
          <PersonAdd color="primary" sx={{ fontSize: 40, mb: 1 }} />
          <Typography component="h1" variant="h4" sx={{ mb: 2, fontWeight: "bold" }}>
            Sign Up
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: "100%" }}>
            <TextField name="name" label="Full Name" fullWidth margin="normal" value={form.name} onChange={handleChange} required autoFocus />
            <TextField name="phone" label="Phone Number" fullWidth margin="normal" value={form.phone} onChange={handleChange} required inputProps={{ maxLength: 10 }} error={form.phone.length > 0 && form.phone.length !== 10} helperText={form.phone.length > 0 && form.phone.length !== 10 ? "Phone number must be 10 digits" : ""} />
            <TextField name="email" label="Email Address" type="email" fullWidth margin="normal" value={form.email} onChange={handleChange} required />
            <TextField name="password" label="Password" type="password" fullWidth margin="normal" value={form.password} onChange={handleChange} required error={form.password.length > 0 && form.password.length < 8} helperText={form.password.length > 0 && form.password.length < 8 ? "Password must be at least 8 characters" : ""} />
            <TextField name="confirmPassword" label="Confirm Password" type="password" fullWidth margin="normal" value={form.confirmPassword} onChange={handleChange} required error={form.confirmPassword.length > 0 && form.password !== form.confirmPassword} helperText={form.confirmPassword.length > 0 && form.password !== form.confirmPassword ? "Passwords do not match" : ""} />
            {error && <Alert severity="error" sx={{ mt: 2, width: "100%" }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 2, width: "100%" }}>{success}</Alert>}
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, py: 1.5 }} disabled={isButtonDisabled}>Sign Up</Button>
            <Typography variant="body2" align="center">
              Already have an account?{" "}
              <Button onClick={() => navigate("/login")} size="small">Login</Button>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
