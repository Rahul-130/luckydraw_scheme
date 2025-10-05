import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // A standard blue
    },
    secondary: {
      main: '#dc004e', // A standard red
    },
    success: {
      main: '#4caf50',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
      marginBottom: '16px', // Consistent bottom margin for main titles
    },
    h5: {
      fontWeight: 500,
      marginBottom: '12px',
    },
    h6: {
      fontWeight: 500,
      marginBottom: '8px',
    },
    body1: {
      fontSize: '1rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Prevent uppercase by default
          // marginRight: '8px', // Consistent spacing between buttons, can be applied via sx prop
        },
      },
    },
    MuiContainer: {
      defaultProps: {
        maxWidth: 'lg', // Default to large container for most pages
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined', // Consistent text field variant
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          paddingBottom: '8px', // Adjust padding for dialog titles
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          paddingTop: '8px', // Adjust padding for dialog content
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(224, 224, 224, 1)', // Add a subtle border to DataGrids
        },
      },
    },
  },
});

export default theme;
