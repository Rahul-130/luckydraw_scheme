import { useState, useCallback } from 'react';

export const useConfirmationDialog = () => {
  const [dialogConfig, setDialogConfig] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmColor: 'primary',
    confirmText: 'Confirm',
  });

  const showConfirmation = useCallback((config) => {
    setDialogConfig({ ...config, open: true });
  }, []);

  const handleClose = () => setDialogConfig(prev => ({ ...prev, open: false }));
  const handleConfirm = () => {
    if (dialogConfig.onConfirm) dialogConfig.onConfirm();
    handleClose();
  };

  return { dialogConfig, showConfirmation, handleClose, handleConfirm };
};
