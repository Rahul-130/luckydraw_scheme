import React from 'react';
import {
    DataGrid,
    GridToolbarContainer,
    GridToolbarColumnsButton,
    GridToolbarFilterButton,
    GridToolbarDensitySelector,
    GridToolbarExport,
    gridFilteredSortedRowIdsSelector,
} from '@mui/x-data-grid';
import { alpha } from '@mui/material/styles';
import { Box, Typography, CircularProgress } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';

const CustomNoRowsOverlay = () => (
    <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
        }}
    >
        <InfoOutlined sx={{ fontSize: 48, mb: 1, color: 'text.disabled' }} />
        <Typography variant="h6" sx={{ color: 'text.secondary' }}>No Data</Typography>
        <Typography variant="body2" sx={{ color: 'text.disabled' }}>There are no rows to display at the moment.</Typography>
    </Box>
);

/**
 * A function to pass to the toolbar to ensure only filtered and sorted rows are exported.
 * @param {object} apiRef - The grid's API reference.
 * @returns {GridRowId[]} An array of row IDs to be exported.
 */
const getFilteredRows = ({ apiRef }) => gridFilteredSortedRowIdsSelector(apiRef);

const CustomToolbar = () => (
    <GridToolbarContainer>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <GridToolbarExport
            printOptions={{ disableToolbarButton: true }}
            getRowsToExport={getFilteredRows}
            csvOptions={{
                fileName: `luckydraw-data-${new Date().toLocaleDateString('en-CA')}`, // YYYY-MM-DD format
                utf8WithBom: true,
            }}
        />
    </GridToolbarContainer>
);

const StyledDataGrid = ({ onRowClick, ...props }) => {
    const handleCellClick = (params, event) => {
        // If a custom onRowClick is provided, and the click is not on an action cell, call it.
        if (onRowClick && params.field !== 'actions') {
            onRowClick(params, event);
        }
        // If a prop-based onCellClick exists, call it as well.
        props.onCellClick?.(params, event);
    };

    return (
        <DataGrid
            {...props}
            onCellClick={handleCellClick}            slots={{
                toolbar: CustomToolbar,
                noRowsOverlay: CustomNoRowsOverlay,
                ...props.slots,
            }}
            sx={{
                border: 'none',
                // Header styles
                '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.1),
                    color: (theme) => theme.palette.text.primary,
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    borderBottom: (theme) => `2px solid ${theme.palette.divider}`,
                },
                // Column separator
                '& .MuiDataGrid-columnSeparator': {
                    color: (theme) => theme.palette.divider,
                },
                // Cell styles
                '& .MuiDataGrid-cell': {
                    py: 1.2,
                    borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                },
                // Row hover styles
                '& .MuiDataGrid-row:hover': {
                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                },
                // Even row background for readability
                '& .MuiDataGrid-row.Mui-even': { backgroundColor: '#f9f9f9' },
                // Footer styles
                '& .MuiDataGrid-footerContainer': {
                    borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                    backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.05),
                },
                '& .MuiToolbar-root': { color: (theme) => theme.palette.text.secondary },
                borderRadius: 2,
                ...props.sx, // Allow for additional sx props to be passed
            }}
        />
    );
};

export default StyledDataGrid;
