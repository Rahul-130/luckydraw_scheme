import { useState, useEffect, useCallback } from 'react';
import { getBooksPaginated as fetchBooksApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function useBooks() {
    const { token } = useAuth();
    const [books, setBooks] = useState([]);
    const [rowCount, setRowCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 5 });

    const fetchBooks = useCallback(async (model) => {
        if (!token) return;
        try {
            setLoading(true);
            const response = await fetchBooksApi(token, model);
            setBooks(response.data.items);
            setRowCount(response.data.totalItems);
            setError(null);
        } catch (err) {
            setError(err);
            setBooks([]);
            setRowCount(0);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchBooks(paginationModel);
    }, [fetchBooks, paginationModel]);

    return { books, loading, error, rowCount, paginationModel, setPaginationModel, refetch: () => fetchBooks(paginationModel) };
}
