import { useState } from "react";
import { signup } from "../services/api";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { PersonAdd, Visibility, VisibilityOff } from "@mui/icons-material";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { validatePassword, PASSWORD_REQUIREMENTS, validateEmail } from "../utils/validation";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    <div className="flex flex-wrap min-h-screen">
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center bg-slate-100 p-6 sm:p-12">
        <div className="w-full max-w-md mx-auto">
          <div className="flex flex-col items-center">
            <PersonAdd color="primary" className="!text-4xl mb-2" />
            <Typography component="h1" variant="h4" className="!mb-4 !font-bold text-center text-gray-800">
              Create Your Account
            </Typography>
          </div>
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="space-y-4">
              <TextField name="name" label="Full Name" fullWidth margin="normal" value={form.name} onChange={handleChange} required autoFocus />
              <TextField name="phone" label="Phone Number" fullWidth margin="normal" value={form.phone} onChange={handleChange} required inputProps={{ maxLength: 10 }} error={form.phone.length > 0 && form.phone.length !== 10} helperText={form.phone.length > 0 && form.phone.length !== 10 ? "Phone number must be 10 digits" : ""} />
              <TextField name="email" label="Email Address" type="email" fullWidth margin="normal" value={form.email} onChange={handleChange} required error={!!(form.email && validateEmail(form.email))} helperText={form.email ? validateEmail(form.email) : ""} />
              <TextField name="password" label="Password" type={showPassword ? 'text' : 'password'} fullWidth margin="normal" value={form.password} onChange={handleChange} required error={!!(form.password && validatePassword(form.password))} helperText={PASSWORD_REQUIREMENTS} InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }} />
              {form.password && <PasswordStrengthMeter password={form.password} />}
              <TextField name="confirmPassword" label="Confirm Password" type={showConfirmPassword ? 'text' : 'password'} fullWidth margin="normal" value={form.confirmPassword} onChange={handleChange} required error={form.confirmPassword.length > 0 && form.password !== form.confirmPassword} helperText={form.confirmPassword.length > 0 && form.password !== form.confirmPassword ? "Passwords do not match" : ""} InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }} />
            </div>
            {error && <Alert severity="error" className="!mt-4 w-full">{error}</Alert>}
            {success && <Alert severity="success" className="!mt-4 w-full">{success}</Alert>}
            <Button type="submit" fullWidth variant="contained" className="!mt-6 !py-3" disabled={isButtonDisabled}>
              Sign Up
            </Button>
            <Typography variant="body2" className="!mt-4 text-center text-gray-500">
              Already have an account?{" "}
              <Button onClick={() => navigate("/login")} size="small">Login</Button>
            </Typography>
          </form>
        </div>
      </div>

      {/* Right side - Image/Branding */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 p-12 text-white">
        <div className="text-center">
          <Typography variant="h3" component="h2" className="!font-bold !mb-4">
            Join Us!
          </Typography>
          <Typography variant="h6">
            Become a part of our community and start managing your lucky draws with ease and confidence.
          </Typography>
        </div>
      </div>
    </div>
  );
}
