import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  createBook,
  editBook,
  deleteBook,
  toggleBookActive,
  verifyPassword,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useDebounce } from "../hooks/useDebounce";
import { useBooks } from "../hooks/useBooks";
import { useKeyShortcut } from "../hooks/useKeyShortcut";
import {
  TextField,
  Button,
  Container,
  Typography,  Dialog,
  DialogActions,  DialogContent,
  DialogTitle,
  Alert,
  Box,
  Stack,
  Paper,
  IconButton,
  MenuItem,
  ListItemIcon,
  Tooltip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { keyframes } from "@mui/system";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useNavigate } from "react-router-dom";
import {
  Add,
  Backup,
  Edit,
  Delete,
  Visibility,
  ToggleOn,
  ToggleOff,
  Search,
} from "@mui/icons-material";
import StyledDataGrid from "../components/StyledDataGrid";
import StyledSearchBar from "../components/StyledSearchBar";
import SummaryBox from "../components/SummaryBox";
import PageLayout from "../components/PageLayout";
import FormDialog from "../components/FormDialog";
import ActionIconButton from "../components/ActionIconButton";
import BookFormFields from "../components/BookFormFields";
import SearchAndSummaryBox from "../components/SearchAndSummaryBox";
import ActionMenu from "../components/ActionMenu";
import { extractApiErrorMessage } from "../utils/apiUtils";
import { useSnackbar } from "../context/SnackbarContext";
import PasswordOTPConfirmationDialog from "../components/PasswordOTPConfirmationDialog";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export default function BooksPage() {
  const { token, user } = useAuth();
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText, 500);

  const {
    books,
    loading: booksLoading,
    error: booksError,
    rowCount,
    paginationModel,
    setPaginationModel,
    refetch: refetchBooks,
  } = useBooks({ searchText: debouncedSearch });

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    maxCustomers: "",
    startMonthIso: "",
    totalAmount: "",
  });
  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    maxCustomers: "",
    startMonthIso: "",
    totalAmount: "",
  });

  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const { showSnackbar } = useSnackbar();

  const navigate = useNavigate();

  // Add keyboard shortcut for "Add Book" (Ctrl + / or Cmd + /)
  useKeyShortcut(() => setOpen(true), { key: '/', ctrl: true, meta: true });

  // create book
  const handleCreate = async () => {
    try {
      await createBook(form, token);
      setOpen(false);
      showSnackbar("Book created successfully!", "success");
      refetchBooks();
    } catch (err) {
      showSnackbar(extractApiErrorMessage(err, "Failed to create book"), "error");
    }
  };

  // edit book
  const handleEdit = () => {
    setPendingAction({ type: 'edit', data: editForm });
    setOtpDialogOpen(true);
  };

  const handleDelete = useCallback((bookId, bookName) => {
    setPendingAction({ type: 'delete', id: bookId, name: bookName });
    setOtpDialogOpen(true);
  }, []);

  // toggle book active status
  const handleToggle = useCallback((bookId, bookName, isActive) => {
    setPendingAction({ type: 'toggle', id: bookId, name: bookName, isActive });
    setOtpDialogOpen(true);
  }, []);

  const handleConfirmOtp = async (password, otp) => {
    setOtpLoading(true);
    try {
      await verifyPassword(token, password, otp);

      if (pendingAction.type === 'edit') {
        await editBook(pendingAction.data.id, pendingAction.data, token);
        showSnackbar("Book updated successfully!", "success");
        setEditOpen(false);
      } else if (pendingAction.type === 'delete') {
        await deleteBook(pendingAction.id, token);
        showSnackbar(`Book "${pendingAction.name}" deleted successfully.`, "success");
      } else if (pendingAction.type === 'toggle') {
        await toggleBookActive(pendingAction.id, token);
        const action = pendingAction.isActive ? "deactivate" : "activate";
        showSnackbar(`Book "${pendingAction.name}" has been ${action}d.`, "success");
      }
      refetchBooks();
      setOtpDialogOpen(false);
      setPendingAction(null);
    } catch (err) {
      showSnackbar(extractApiErrorMessage(err, "Action failed"), "error");
    } finally {
      setOtpLoading(false);
    }
  };


  const handleBackup = () => {
    alert("Backup triggered!");
  };

  const columns = useMemo(
    () => [
      { field: "id", headerName: "ID", width: 80 },
      { field: "name", headerName: "Name", flex: 1, minWidth: 150 },
      { 
        field: "maxCustomers", 
        headerName: "Capacity", 
        width: 150,
        renderCell: (params) => (
          <span>{params.row.customerCount || 0} / {params.value}</span>
        )
      },
      { field: "totalAmount", headerName: "Amount", width: 120, valueFormatter: (value) => value ? `₹ ${value}` : '-' },
      { field: "isActive", headerName: "Active", width: 100, type: "boolean" },
      { field: "startMonthIso", headerName: "Start Month", width: 150 },
      {
        field: "actions",
        headerName: "Actions",
        width: 180,
        sortable: false,
        renderCell: (params) => {
          const { row } = params;
          const actionItems = [
            {
              label: 'Edit',
              icon: <Edit fontSize="small" />,
              onClick: () => { setEditForm(row); setEditOpen(true); },
            },
            {
              label: 'Delete',
              icon: <Delete fontSize="small" />,
              onClick: () => handleDelete(row.id, row.name),
              color: 'error.main',
            },
            {
              label: row.isActive ? 'Deactivate' : 'Activate',
              icon: row.isActive ? <ToggleOff fontSize="small" /> : <ToggleOn fontSize="small" />,
              onClick: () => handleToggle(row.id, row.name, row.isActive),
            },
          ];

          return (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Button
                startIcon={<Visibility fontSize="small" />}
                onClick={() => navigate(`/books/${row.id}/customers`)}
                size="small"
                variant="outlined"
              >
                Customers
              </Button>
              <ActionMenu items={actionItems} />
            </Stack>
          );
        },
      },
    ],
    [navigate, handleToggle, handleDelete]
  );

  const bookSummary = useMemo(() => {
    const active = books.filter(b => b.isActive).length;
    const inactive = books.filter(b => !b.isActive).length;

    return {
        total: rowCount, // Use rowCount from the hook for the true total
        active,
        inactive
    };
  }, [books, rowCount]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <PageLayout>
          <Box sx={{ textAlign: 'center', mb: 4, animation: `${fadeIn} 0.5s ease-out` }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: "bold",
                background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: (theme) => `1px 1px 2px ${alpha(theme.palette.primary.light, 0.1)}`,
              }}
            >
              Manage Your Books
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              All your lucky draw books in one place.
            </Typography>
          </Box>

          <SearchAndSummaryBox
            sx={{ animation: `${fadeIn} 0.5s ease-out 0.1s`, animationFillMode: 'backwards' }}
            searchLabel="Search Books"
            searchText={searchText}
            onSearchChange={(e) => setSearchText(e.target.value)}
            summaryItems={[
              { label: 'Total', value: bookSummary.total },
              { label: 'Active', value: bookSummary.active, color: 'success.main' },
              { label: 'Inactive', value: bookSummary.inactive, color: 'error.main' },
            ]}
          >
            <Tooltip title="Add Book (Ctrl + /)">
              <Button variant="contained" startIcon={<Add />} color="primary" onClick={() => setOpen(true)} sx={{
                  transition: (theme) => theme.transitions.create(['transform', 'box-shadow'], { duration: theme.transitions.duration.short }),
                  '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: (theme) => theme.shadows[4],
                  }
              }}>
                Add Book
              </Button>
            </Tooltip>
          </SearchAndSummaryBox>

          <StyledDataGrid
                rows={books || []}
                rowCount={rowCount || 0}
                columns={columns}
                loading={booksLoading}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                onRowClick={(params) => navigate(`/books/${params.row.id}/customers`)}
                pageSizeOptions={[5, 10, 20, 100]}
                paginationMode="server"
                getRowClassName={(params) =>
                  params.row.isActive
                    ? "super-app-theme--active"
                    : "super-app-theme--inactive"
                }
                sx={{
                  animation: `${fadeIn} 0.5s ease-out 0.2s`,
                  animationFillMode: 'backwards',
                  '& .MuiDataGrid-row': { cursor: 'pointer' },
                  '& .MuiDataGrid-row:hover': {
                    transform: 'scale(1.01)',
                    transition: 'transform 0.2s ease-in-out, background-color 0.2s ease-in-out',
                    boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`,
                  },
                  "& .super-app-theme--active:hover": { backgroundColor: (theme) => alpha(theme.palette.success.main, 0.2) },
                  "& .super-app-theme--inactive:hover": { backgroundColor: (theme) => alpha(theme.palette.error.main, 0.2) },
                }}
              />

          {booksError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Failed to load books.
            </Alert>
          )}

          {/* Add Book Dialog */}
          <FormDialog open={open} onClose={() => setOpen(false)} title="Add Book" onSubmit={handleCreate} submitText="Create">
            <BookFormFields formState={form} onFormChange={setForm} />
          </FormDialog>

          {/* Edit Book Dialog */}
          <FormDialog open={editOpen} onClose={() => setEditOpen(false)} title="Edit Book" onSubmit={handleEdit}>
            <BookFormFields formState={editForm} onFormChange={setEditForm} />
          </FormDialog>

          <PasswordOTPConfirmationDialog
            open={otpDialogOpen}
            onClose={() => { setOtpDialogOpen(false); setPendingAction(null); }}
            onConfirm={handleConfirmOtp}
            loading={otpLoading}
            title={
                pendingAction?.type === 'delete' ? `Delete Book "${pendingAction.name}"?` :
                pendingAction?.type === 'toggle' ? `${pendingAction.isActive ? "Deactivate" : "Activate"} "${pendingAction.name}"?` :
                'Confirm Edit Book'
            }
            message={
                pendingAction?.type === 'delete' ? 'Are you sure you want to delete this book and all its related data? This action cannot be undone. Please enter your credentials to confirm.' :
                pendingAction?.type === 'toggle' ? `Are you sure you want to ${pendingAction.isActive ? "deactivate" : "activate"} this book? Please enter your credentials to confirm.` :
                `Please enter your credentials to confirm changes for book "${pendingAction?.data?.name}".`
            }
            is2FAEnabled={user?.is2FAEnabled}
          />
      </PageLayout>
    </LocalizationProvider>
  );
}
