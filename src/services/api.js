import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

let activeRequests = 0;

export const setupInterceptors = (loadingControls) => {
  api.interceptors.request.use(
    (config) => {
      if (activeRequests === 0) {
        loadingControls.show();
      }
      activeRequests++;
      return config;
    },
    (error) => {
      activeRequests--;
      if (activeRequests === 0) {
        loadingControls.hide();
      }
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => {
      activeRequests--;
      if (activeRequests === 0) {
        loadingControls.hide();
      }
      return response;
    },
    (error) => {
      activeRequests--;
      if (activeRequests === 0) {
        loadingControls.hide();
      }
      return Promise.reject(error);
    }
  );
};

export const signup = (data) =>
    api.post(`/auth/signup`, data);

export const login = (data) =>
    api.post(`/auth/login`, data);

export const me = (token) =>
    api.get(`/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const getBooksPaginated = (token, { page, pageSize, search }) =>
    api.get(`/books`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: page + 1, pageSize , search} // DataGrid is 0-indexed, API is 1-indexed
    });

export const getBook = (bookId, token) =>
    api.get(`/books/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const editBook = (bookId, data, token) =>
    api.patch(`/books/${bookId}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const deleteBook = (bookId, token) =>
    api.delete(`/books/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const createBook = (data, token) =>
    api.post(`/books`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const toggleBookActive = (bookId, token) =>
    api.patch(`/books/${bookId}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const getCustomers = (bookId, token, search) =>
    api.get(`/customers/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: search || undefined }
    });

export const addCustomer = (bookId, data, token) =>
    api.post(`/customers/${bookId}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const editCustomer = (bookId, customerId, data, token) =>
    api.patch(`/customers/${bookId}/customers/${customerId}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const deleteCustomer = (bookId, customerId, token) =>
    api.delete(`/customers/${bookId}/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const getPayments = (bookId, customerId, token) =>
    api.get(`/payments/${bookId}/customers/${customerId}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const addPayment = (bookId, customerId, data, token) =>
    api.post(`/payments/${bookId}/customers/${customerId}/payments`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const editPayment = (bookId, customerId, paymentId, data, token) =>
    api.patch(`/payments/${bookId}/customers/${customerId}/payments/${paymentId}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
export const deletePayment = (bookId, customerId, paymentId, token) =>
    api.delete(`/payments/${bookId}/customers/${customerId}/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const runLuckyDraw = (token, password, otp) =>
    api.post(`/lucky-draw`, {password, otp}, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const changePassword = (data, token) =>
    api.post(`/auth/change-password`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const getWinners = (token, search) =>
    api.get(`/winners`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: search || undefined }
    });

export const getEligibleCustomers = (token, search) =>
    api.get(`/eligible-customers`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: search || undefined }
    });


export const markCustomerAsWinner = (token, data) =>
    api.post(`/winners/mark`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const unmarkCustomerAsWinner = (token, data) =>
    api.post(`/winners/unmark`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });

// --- 2FA ---

export const generate2FA = (token) =>
    api.post(`/auth/2fa/generate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const enable2FA = (token, otp) =>
    api.post(`/auth/2fa/enable`, { otp }, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const verifyPassword = (token, password, otp) =>
    api.post(`/auth/verify-password`, { password, otp }, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const disable2FA = (token, password, otp) =>
    api.post(`/auth/2fa/disable`, { password, otp }, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const regenerate2FACodes = (token) =>
    api.post(`/auth/2fa/regenerate-codes`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });


export const loginWithOTP = (username, otp) =>
    api.post(`/auth/login-otp`, { username, otp });


// --- Password Reset using 2FA ---

export const requestPasswordReset = (username) =>
    api.post(`/auth/reset-password/request`, { username });

export const completePasswordReset = (username, otp, newPassword) =>
    api.post(`/auth/reset-password/complete`, {
        username,
        otp,
        newPassword
    });

export const downloadBackup = (token) =>
    api.post(`/backup/download`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', // Important for file downloads
    });

export const getDashboardStats = (token, startDate, endDate) =>
    api.get(`/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate, endDate },
    });

export const getRecentActivity = (token, page, pageSize) =>
    api.get(`/dashboard/activity`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, pageSize },
    });

export const backupToGoogleDrive = (token) =>
    api.post(`/backup/googledrive`, {}, {
        headers: { Authorization: `Bearer ${token}` },
    });

// --- Profile ---

export const getProfile = (token) =>
    api.get(`/profile`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const updateProfile = (data, token) =>
    api.put(`/profile`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });

export default api;

