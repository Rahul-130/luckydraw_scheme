import { useState, useEffect, useCallback } from "react";
import { getBooksPaginated } from "../services/api";
import { useAuth } from "../context/AuthContext";

export const useBooks = (searchText) => {
  const { token } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rowCount, setRowCount] = useState(0);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,      // DataGrid page (0-indexed)
    pageSize: 10, // rows per page
  });

  const fetchBooks = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getBooksPaginated(token, {
        page: paginationModel.page,       // send 0-indexed page
        pageSize: searchText ? 1000: paginationModel.pageSize,
        search: searchText || undefined,
      });

      // Map backend data to DataGrid expected format
      const formattedBooks = (response.data.data || []).map((book) => ({
        id: book.id,   // must exist for DataGrid
        ...book,
      }));

      setBooks(formattedBooks);
      setRowCount(response.data.total || 0);
    } catch (err) {
      console.error("Error fetching books:", err);
      setError(err);
      setBooks([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, [token, paginationModel.page, paginationModel.pageSize, searchText]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  return {
    books,
    loading,
    error,
    rowCount,
    paginationModel,
    setPaginationModel,
    refetch: fetchBooks,
  };
};
