import { useEffect, useCallback } from 'react';

/**
 * A custom hook to execute a callback when a specific key combination is pressed.
 * @param {function} callback - The function to call when the shortcut is activated.
 * @param {object} options - The key combination and options.
 * @param {string} options.key - The main key to listen for (e.g., '/', 'f').
 * @param {boolean} [options.ctrl] - Whether the Ctrl key should be pressed.
 * @param {boolean} [options.meta] - Whether the Meta (Cmd/Windows) key should be pressed.
 * @param {boolean} [options.alt] - Whether the Alt key should be pressed.
 * @param {boolean} [options.shift] - Whether the Shift key should be pressed.
 * @param {boolean} [options.disabled=false] - If true, the shortcut is disabled.
 */
export const useKeyShortcut = (callback, {
  key,
  ctrl = false,
  meta = false,
  alt = false,
  shift = false,
  disabled = false,
}) => {
  const handleKeyDown = useCallback((event) => {
    if (disabled) return;

    // If both ctrl and meta are requested, treat it as "ctrl OR meta" for cross-platform support.
    const ctrlOrMetaPressed = (ctrl && meta) ? (event.ctrlKey || event.metaKey) : (event.ctrlKey === ctrl && event.metaKey === meta);

    const match = 
      event.key.toLowerCase() === key.toLowerCase() && 
      ctrlOrMetaPressed &&
      event.altKey === alt && 
      event.shiftKey === shift;


    if (match) {
      event.preventDefault();
      callback();
    }
  }, [callback, key, ctrl, meta, alt, shift, disabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};
