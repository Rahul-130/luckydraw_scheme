import { useState, useEffect, useCallback } from 'react';
import { getCustomers as fetchCustomersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function useCustomers(bookId) {
    const { token } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCustomers = useCallback(async () => {
        if (!token || !bookId) return;
        try {
            setLoading(true);
            const response = await fetchCustomersApi(bookId, token);
            setCustomers(response.data);
            setError(null);
        } catch (err) {
            setError(err);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    }, [token, bookId]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    return { customers, loading, error, refetch: fetchCustomers };
}

