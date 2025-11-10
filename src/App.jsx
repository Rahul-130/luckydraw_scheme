import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CustomThemeProvider } from './context/ThemeContext';
import { SnackbarProvider } from './context/SnackbarContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import BooksPage from './pages/BooksPage';
import CustomersPage from './pages/CustomersPage';
import PaymentsPage from './pages/PaymentsPage';
import LuckyDrawPage from './pages/LuckyDrawPage';
import WinnersListPage from './pages/WinnersListPage';
import EligibleCustomersPage from './pages/EligibleCustomersPage';
import ChangePassword from './components/ChangePassword';
import ProtectedRoute from './components/ProtectedRoute';
import Setup2FAPage from './pages/Setup2FAPage';
import SecurityPage from './pages/SecurityPage';
import SettingsPage from './pages/SettingsPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <CustomThemeProvider>
        <Router>
          <SnackbarProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
    
              {/* Private routes using the MainLayout */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/setup-2fa" element={<Setup2FAPage />} />
                <Route path="/books" element={<BooksPage />} />
                <Route path="/books/:bookId/customers" element={<CustomersPage />} />
                <Route path="/books/:bookId/customers/:customerId/payments" element={<PaymentsPage />} />
                <Route path="/winners" element={<WinnersListPage />} />
                <Route path="/eligible-customers" element={<EligibleCustomersPage />} />
                <Route path="/lucky-draw" element={<LuckyDrawPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route path="/security" element={<SecurityPage />} />
              </Route>
    
              <Route path="*" element={<Navigate to="/books" />} />
            </Routes>
          </SnackbarProvider>
        </Router>
      </CustomThemeProvider>
    </AuthProvider>
  );
}
