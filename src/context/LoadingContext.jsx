import React, { createContext, useState, useContext, useMemo } from 'react';
import { LinearProgress, Box } from '@mui/material';

const LoadingContext = createContext();

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  const loadingControls = useMemo(() => ({
    show: () => setLoading(true),
    hide: () => setLoading(false),
  }), []);

  return (
    <LoadingContext.Provider value={loadingControls}>
      {loading && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: (theme) => theme.zIndex.drawer + 2 }}>
          <LinearProgress color="primary" />
        </Box>
      )}
      {children}
    </LoadingContext.Provider>
  );
};
