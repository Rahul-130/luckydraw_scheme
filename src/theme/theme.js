import { createTheme } from '@mui/material/styles';

const sharedThemeOptions = {
  typography: {
    fontFamily: '"Public Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    h4: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    body1: {
      fontSize: '1rem',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          fontWeight: 600,
        },
      },
    },
    MuiContainer: {
      defaultProps: {
        maxWidth: 'lg',
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Ensure paper components don't have background images from the theme
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #e0e0e0', // Softer cell border
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f5f5f5',
            borderBottom: '1px solid #e0e0e0',
          },
        },
      },
    },
  },
};

export const lightThemeOptions = {
  ...sharedThemeOptions,
  palette: {
    mode: 'light',
    primary: {
      main: '#007BFF', // A vibrant, modern blue
      light: '#69a9ff',
      dark: '#0050cb',
    },
    secondary: {
      main: '#17A2B8', // A complementary teal
      light: '#62d4ea',
      dark: '#007388',
    },
    background: {
      default: '#F8F9FA', // A very light grey for the page background
      paper: '#FFFFFF',
    },
  },
};

export const darkThemeOptions = {
  ...sharedThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: '#4DABF7', // A lighter, vibrant blue for dark mode
      light: '#86cdfa',
      dark: '#007cce',
    },
    secondary: {
      main: '#36C2CE', // A lighter teal for dark mode
      light: '#76f5ff',
      dark: '#00919d',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
};

/**
 * Creates a theme instance based on the provided mode.
 * @param {'light' | 'dark'} mode
 */
export const createAppTheme = (mode) =>
  createTheme(mode === 'light' ? lightThemeOptions : darkThemeOptions);

export const theme = createAppTheme('light'); // Default export a light theme instance

export const CHART_COLORS = {
  active: theme.palette.success.main,
  inactive: theme.palette.error.main,
  eligible: theme.palette.primary.main,
  notEligible: theme.palette.warning.main,
  online: theme.palette.info.main,
  cash: '#4caf50',
  instore: '#9c27b0',
  total: theme.palette.grey[600],
};

export default { theme, CHART_COLORS, lightThemeOptions, darkThemeOptions };
