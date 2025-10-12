import { blue, pink } from '@mui/material/colors';

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
};
