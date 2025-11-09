import { createTheme } from '@mui/material/styles';
import { blue, pink } from '@mui/material/colors';

export const theme = createTheme({
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

export const CHART_COLORS = {
  active: '#2e7d32',
  inactive: '#d32f2f',
  eligible: '#1976d2',
  notEligible: '#ed6c02',
  online: '#ff9800', // Orange for Online
  cash: '#4caf50',   // Green for Cash
  instore: '#9c27b0', // Purple for In-Store
  total: '#5f6368',
};



export const lightThemeOptions = {
  palette: {
    mode: 'light',
    primary: blue,
    secondary: pink,
    background: {
      default: '#f0f4f8',
      paper: '#ffffff',
    },
  },
  components: {
    MuiContainer: {
      defaultProps: {
        maxWidth: false, // Disables the max-width constraint
      },
    },
  },
};

export const darkThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9', // A lighter blue for dark mode
    },
    secondary: {
      main: '#f48fb1', // A lighter pink for dark mode
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  components: {
    MuiContainer: {
      defaultProps: {
        maxWidth: false, // Disables the max-width constraint
      },
    },
  },
};


export default {theme, CHART_COLORS, lightThemeOptions, darkThemeOptions};
