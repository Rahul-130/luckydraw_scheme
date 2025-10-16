import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const signup = (data) => 
    axios.post(`${API_URL}/auth/signup`, data);

export const login = (data) => 
    axios.post(`${API_URL}/auth/login`, data);

export const me = (token) =>
    axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const getBooksPaginated = (token, { page, pageSize, search }) => 
    axios.get(`${API_URL}/books`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: page + 1, pageSize , search} // DataGrid is 0-indexed, API is 1-indexed
    });

export const getBook = (bookId, token) =>
    axios.get(`${API_URL}/books/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const editBook = (bookId, data, token) => 
    axios.patch(`${API_URL}/books/${bookId}`, data, { 
        headers: { Authorization: `Bearer ${token}` } 
    });

export const deleteBook = (bookId, token) => 
    axios.delete(`${API_URL}/books/${bookId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
    });

export const createBook = (data, token) => 
    axios.post(`${API_URL}/books`, data, { 
        headers: { Authorization: `Bearer ${token}` } 
    });

export const toggleBookActive = (bookId, token) =>
    axios.patch(`${API_URL}/books/${bookId}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const getCustomers = (bookId, token, search) => 
    axios.get(`${API_URL}/customers/${bookId}`, { 
        headers: { Authorization: `Bearer ${token}` },
        params: { search: search || undefined }
    });

export const addCustomer = (bookId, data, token) => 
    axios.post(`${API_URL}/customers/${bookId}`, data, { 
        headers: { Authorization: `Bearer ${token}` } 
    });

export const editCustomer = (bookId, customerId, data, token) => 
    axios.patch(`${API_URL}/customers/${bookId}/customers/${customerId}`, data, { 
        headers: { Authorization: `Bearer ${token}` } 
    });

export const deleteCustomer = (bookId, customerId, token) => 
    axios.delete(`${API_URL}/customers/${bookId}/customers/${customerId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
    });

export const getPayments = (bookId, customerId, token) => 
    axios.get(`${API_URL}/payments/${bookId}/customers/${customerId}/payments`, { 
        headers: { Authorization: `Bearer ${token}` } 
    });

export const addPayment = (bookId, customerId, data, token) => 
    axios.post(`${API_URL}/payments/${bookId}/customers/${customerId}/payments`, data, { 
        headers: { Authorization: `Bearer ${token}` } 
    });

export const editPayment = (bookId, customerId, paymentId, data, token) => 
    axios.patch(`${API_URL}/payments/${bookId}/customers/${customerId}/payments/${paymentId}`, data, { 
        headers: { Authorization: `Bearer ${token}` } 
    });
export const deletePayment = (bookId, customerId, paymentId, token) => 
    axios.delete(`${API_URL}/payments/${bookId}/customers/${customerId}/payments/${paymentId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
    });

export const runLuckyDraw = (token, password, otp) => 
    axios.post(`${API_URL}/lucky-draw`, {password, otp}, { 
        headers: { Authorization: `Bearer ${token}` } 
    });

export const changePassword = (data, token) =>
    axios.post(`${API_URL}/auth/change-password`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const getWinners = (token, search) =>
    axios.get(`${API_URL}/winners`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: search || undefined }
    });

export const getEligibleCustomers = (token, search) =>
    axios.get(`${API_URL}/eligible-customers`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: search || undefined }
    });


export const markCustomerAsWinner = (token, data) =>
    axios.post(`${API_URL}/winners/mark`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const unmarkCustomerAsWinner = (token, data) =>
    axios.post(`${API_URL}/winners/unmark`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    
// --- 2FA ---

export const generate2FA = (token) =>
    axios.post(`${API_URL}/auth/2fa/generate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const enable2FA = (token, otp) =>
    axios.post(`${API_URL}/auth/2fa/enable`, { otp }, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const verifyPassword = (token, password, otp) =>
    axios.post(`${API_URL}/auth/verify-password`, { password, otp }, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const disable2FA = (token, password, otp) =>
    axios.post(`${API_URL}/auth/2fa/disable`, { password, otp }, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const regenerate2FACodes = (token) =>
    axios.post(`${API_URL}/auth/2fa/regenerate-codes`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });


export const loginWithOTP = (username, otp) =>
    axios.post(`${API_URL}/auth/login-otp`, { username, otp });


// --- Password Reset using 2FA ---

export const requestPasswordReset = (username) =>
    axios.post(`${API_URL}/auth/reset-password/request`, { username });

export const completePasswordReset = (username, otp, newPassword) =>
    axios.post(`${API_URL}/auth/reset-password/complete`, {
        username,
        otp,
        newPassword
    });

export const downloadBackup = (token) =>
    axios.post(`${API_URL}/backup/download`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', // Important for file downloads
    });

export const getDashboardStats = (token, startDate, endDate) =>
    axios.get(`${API_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate, endDate },
    });

export const getRecentActivity = (token, page, pageSize) =>
    axios.get(`${API_URL}/dashboard/activity`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, pageSize },
    });

export const backupToGoogleDrive = (token) =>
    axios.post(`${API_URL}/backup/googledrive`, {}, {
        headers: { Authorization: `Bearer ${token}` },
    });