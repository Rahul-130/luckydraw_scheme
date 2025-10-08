import { useState, useEffect, useCallback } from 'react';
import { getEligibleCustomers as fetchEligibleCustomersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function useEligibleCustomers(searchText) {
    const { token } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCustomers = useCallback(async () => {
        if (!token) {
            setCustomers([]);
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const response = await fetchEligibleCustomersApi(token, searchText);
            setCustomers(response.data);
            setError(null);
        } catch (err) {
            setError(err);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    }, [token, searchText]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    return { customers, loading, error, refetch: fetchCustomers };
}
