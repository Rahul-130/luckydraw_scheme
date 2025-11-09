import React from 'react';
import { Stack, Box } from '@mui/material';
import StyledSearchBar from './StyledSearchBar';
import SummaryBox from './SummaryBox';

const SearchAndSummaryBox = ({
  searchLabel,
  searchText,
  onSearchChange,
  summaryItems,
  children, // For action buttons like "Add Book"
}) => {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      alignItems={{ sm: 'center' }}
      sx={{ mb: 2 }}
    >
      {/* Left side: Search and Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: '70%' } }}>
        <StyledSearchBar label={searchLabel} value={searchText} onChange={onSearchChange} />
        {children}
      </Box>

      {/* Right side: Summary Box */}
      <SummaryBox sx={{ width: { xs: '100%', sm: '30%' }, boxSizing: 'border-box' }} items={summaryItems} />
    </Stack>
  );
};

export default SearchAndSummaryBox;
