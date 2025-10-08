import { useState, useEffect, useCallback } from 'react';
import { getWinners as fetchWinnersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function useWinners(searchText) {
    const { token } = useAuth();
    const [winners, setWinners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchWinners = useCallback(async () => {
        if (!token) {
            setWinners([]);
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const response = await fetchWinnersApi(token, searchText);
            setWinners(response.data);
            setError(null);
        } catch (err) {
            setError(err);
            setWinners([]);
        } finally {
            setLoading(false);
        }
    }, [token, searchText]);

    useEffect(() => {
        fetchWinners();
    }, [fetchWinners]);

    return { winners, loading, error, refetch: fetchWinners };
}
