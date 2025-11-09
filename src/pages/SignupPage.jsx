import { useState } from "react";
import { signup } from "../services/api";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { PersonAdd } from "@mui/icons-material";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { validatePassword, PASSWORD_REQUIREMENTS, validateEmail } from "../utils/validation";
import PasswordInput from "../components/PasswordInput";
import AuthLayout from "../components/AuthLayout";

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

    const emailError = validateEmail(form.email);
    if (emailError) {
      setError(emailError);
      return;
    }

    const passwordError = validatePassword(form.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
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
    <AuthLayout branding={{ title: "Join Us!", description: "Become a part of our community and start managing your lucky draws with ease and confidence." }}>
      <div className="flex flex-col items-center">
        <PersonAdd color="primary" className="!text-4xl mb-2" />
        <Typography component="h1" variant="h4" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center', color: '#000' }}>
          Create Your Account
        </Typography>
      </div>
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="space-y-4">
          <TextField name="name" label="Full Name" fullWidth margin="normal" value={form.name} onChange={handleChange} required autoFocus />
          <TextField name="phone" label="Phone Number" fullWidth margin="normal" value={form.phone} onChange={handleChange} required inputProps={{ maxLength: 10 }} error={form.phone.length > 0 && form.phone.length !== 10} helperText={form.phone.length > 0 && form.phone.length !== 10 ? "Phone number must be 10 digits" : ""} />
          <TextField name="email" label="Email Address" type="email" fullWidth margin="normal" value={form.email} onChange={handleChange} required error={!!(form.email && validateEmail(form.email))} helperText={form.email ? validateEmail(form.email) : ""} />
          <PasswordInput name="password" label="Password" fullWidth margin="normal" value={form.password} onChange={handleChange} required error={!!(form.password && validatePassword(form.password))} helperText={PASSWORD_REQUIREMENTS} />
          {form.password && <PasswordStrengthMeter password={form.password} />}
          <PasswordInput name="confirmPassword" label="Confirm Password" fullWidth margin="normal" value={form.confirmPassword} onChange={handleChange} required error={form.confirmPassword.length > 0 && form.password !== form.confirmPassword} helperText={form.confirmPassword.length > 0 && form.password !== form.confirmPassword ? "Passwords do not match" : ""} />
        </div>
        {error && <Alert severity="error" className="!mt-4 w-full">{error}</Alert>}
        {success && <Alert severity="success" className="!mt-4 w-full">{success}</Alert>}
        <Button type="submit" fullWidth variant="contained" className="!mt-6 !py-3" disabled={isButtonDisabled}>
          Sign Up
        </Button>
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }} color="text.secondary">
          Already have an account?{" "}
          <Button onClick={() => navigate("/login")} size="small">Login</Button>
        </Typography>
      </form>
    </AuthLayout>
  );
}
