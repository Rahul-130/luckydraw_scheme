// Reusable Preview + Copy component used across BookFormFields, CustomerFormFields, PaymentFormFields

import React from 'react';
import { Box, Chip, Typography, Tooltip } from '@mui/material';
import ClipboardButton from './ClipboardButton';
import PropTypes from 'prop-types';

/**
 * PreviewCopy
 * Props:
 *  - formState: object (the form state)
 *  - fields: array of { key: string, fallback?: string, formatter?: (value)=>string }
 *  - sx: (optional) sx override for container
 *  - copyTooltip: (optional) tooltip text for the clipboard button
 *
 * Example fields: [ { key: 'name', fallback: '— name' }, { key: 'maxCustomers', fallback: '— capacity', formatter: v => `${v} customers` } ]
 */
export default function PreviewCopy({ formState, fields, sx = {}, copyTooltip = 'Copy preview JSON', copyAria = 'Copy preview' }) {
  return (
    <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" justifyContent="space-between" sx={sx}>
      <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
          Preview:
        </Typography>

        {fields.map((f) => {
          const raw = formState?.[f.key];
          const content = raw != null && raw !== '' ? (f.formatter ? f.formatter(raw) : String(raw)) : '';
          const short = content.length > 28 ? `${content.slice(0, 26)}…` : content || (f.fallback ?? '—');
          return (
            <Tooltip key={f.key} title={content || ''} placement="top">
              <Chip
                label={short}
                size="small"
                color={content ? 'primary' : 'default'}
                variant={content ? 'filled' : 'outlined'}
                sx={{ fontWeight: 600, maxWidth: 240, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
              />
            </Tooltip>
          );
        })}
      </Box>

      <ClipboardButton getText={() => JSON.stringify(formState, null, 2)} tooltip={copyTooltip} ariaLabel={copyAria} />
    </Box>
  );
}

PreviewCopy.propTypes = {
  formState: PropTypes.object.isRequired,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      fallback: PropTypes.string,
      formatter: PropTypes.func,
    })
  ).isRequired,
  sx: PropTypes.object,
  copyTooltip: PropTypes.string,
  copyAria: PropTypes.string,
};
