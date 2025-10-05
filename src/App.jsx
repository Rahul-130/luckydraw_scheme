import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SnackbarProvider } from './context/SnackbarContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import BooksPage from './pages/BooksPage';
import CustomersPage from './pages/CustomersPage';
import PaymentsPage from './pages/PaymentsPage';
import LuckyDrawPage from './pages/LuckyDrawPage';
import WinnersListPage from './pages/WinnersListPage';
import EligibleCustomersPage from './pages/EligibleCustomersPage';
import MainLayout from './MainLayout';
import ChangePasswordPage from './pages/ChangePasswordPage';

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <SnackbarProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
  
            {/* Private routes using the MainLayout */}
            <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
              <Route path="/books" element={<BooksPage />} />
              <Route path="/books/:bookId/customers" element={<CustomersPage />} />
              <Route path="/books/:bookId/customers/:customerId/payments" element={<PaymentsPage />} />
              <Route path="/winners" element={<WinnersListPage />} />
              <Route path="/eligible-customers" element={<EligibleCustomersPage />} />
              <Route path="/lucky-draw" element={<LuckyDrawPage />} />
              <Route path="/change-password" element={<ChangePasswordPage />} />
            </Route>
  
            <Route path="*" element={<Navigate to="/books" />} />
          </Routes>
        </SnackbarProvider>
      </Router>
    </AuthProvider>
  );
}
