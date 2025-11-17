import { useState, useEffect, useCallback } from "react";
import { getBooksPaginated, getBook } from "../services/api";
import { useAuth } from "../context/AuthContext";
/**
 * A versatile hook to fetch book data.
 * - If `bookId` is provided, it fetches a single book.
 * - Otherwise, it fetches a paginated list of books.
 * @param {object} options - The options for fetching.
 * @param {string} [options.bookId] - The ID of a single book to fetch.
 * @param {string} [options.searchText] - The text to search for in the book list.
 * @returns {object} - The state object with book(s), loading, error, and other utilities.
 */
export const useBooks = (options = {}) => {
  const { bookId, searchText } = options;
  const { token } = useAuth();
  const [books, setBooks] = useState([]);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rowCount, setRowCount] = useState(0);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,      // DataGrid page (0-indexed)
    pageSize: 100, // Default rows per page
  });

  const fetchBooks = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      if (bookId) {
        // Fetch a single book
        const response = await getBook(bookId, token);
        setBook(response.data);
      } else {
        // Fetch a list of books
        const response = await getBooksPaginated(token, {
          page: paginationModel.page,
          pageSize: searchText ? 1000 : paginationModel.pageSize,
          search: searchText || undefined,
        });
        const formattedBooks = (response.data.data || []).map((b) => ({ id: b.id, ...b }));
        setBooks(formattedBooks);
        setRowCount(response.data.total || 0);
      }
    } catch (err) {
      console.error("Error fetching books:", err);
      setError(err);
      setBooks([]);
      setBook(null);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, [token, bookId, paginationModel.page, paginationModel.pageSize, searchText]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  return {
    books, // The list of books
    book,  // The single book (if bookId is provided)
    loading,
    error,
    rowCount,
    paginationModel,
    setPaginationModel,
    refetch: fetchBooks,
  };
};

