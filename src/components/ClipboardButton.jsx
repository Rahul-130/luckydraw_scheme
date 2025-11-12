import React, { useState, useRef } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import ContentCopy from '@mui/icons-material/ContentCopy';
import Done from '@mui/icons-material/Done';

/**
 * ClipboardButton
 * Props:
 *  - getText: () => string            // function returning text to copy
 *  - tooltip?: string                // default tooltip text
 *  - ariaLabel?: string              // accessible label for the button
 */
export default function ClipboardButton({ getText, tooltip = 'Copy preview JSON', ariaLabel = 'Copy preview' }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  async function handleCopy() {
    try {
      const text = typeof getText === 'function' ? getText() : String(getText ?? '');
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
      // optional: fallback UI or toast
    }
  }

  return (
    <Tooltip title={copied ? 'Copied!' : tooltip} arrow>
      <IconButton
        size="small"
        onClick={handleCopy}
        aria-label={ariaLabel}
        sx={{
          borderRadius: 1.25,
          bgcolor: (theme) => (copied ? theme.palette.success.light : (theme) => theme.palette.action.hover),
          color: (theme) => (copied ? theme.palette.success.dark : theme.palette.primary.main),
          '&:hover': {
            bgcolor: (theme) => (copied ? theme.palette.success.light : theme.palette.action.selected),
            transform: 'translateY(-2px)',
          },
          transition: (theme) => theme.transitions.create(['background-color', 'transform'], { duration: 140 }),
        }}
      >
        {copied ? <Done fontSize="small" /> : <ContentCopy fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}
