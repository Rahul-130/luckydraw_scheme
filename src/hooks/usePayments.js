import { useState, useEffect, useCallback } from 'react';
import { getPayments, getCustomers, getBook } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const usePayments = (bookId, customerId) => {
  const { token } = useAuth();
  const [payments, setPayments] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!bookId || !customerId || !token) return;

    setLoading(true);
    setError(null);

    try {
      const [paymentsRes, customersRes, bookRes] = await Promise.all([
        getPayments(bookId, customerId, token),
        getCustomers(bookId, token),
        getBook(bookId, token),
      ]);

      setPayments(paymentsRes.data);
      const currentCustomer = customersRes.data.find(c => String(c.id) === customerId);
      setCustomer(currentCustomer);
      setBook(bookRes.data);
    } catch (err) {
      setError(err);
      console.error("Failed to fetch payments page data:", err);
    } finally {
      setLoading(false);
    }
  }, [bookId, customerId, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { payments, customer, book, loading, error, refetch: fetchData };
};
