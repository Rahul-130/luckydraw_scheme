import React, { createContext, useState, useMemo, useContext, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { lightThemeOptions, darkThemeOptions } from '../theme/theme';

const ThemeContext = createContext({
  toggleTheme: () => {},
  mode: 'light',
});

export const useThemeContext = () => useContext(ThemeContext);

export const CustomThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    try {
      const storedMode = localStorage.getItem('themeMode');
      return storedMode || 'light';
    } catch (error) {
      return 'light';
    }
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const theme = useMemo(() => createTheme(mode === 'light' ? lightThemeOptions : darkThemeOptions), [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ toggleTheme, mode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
