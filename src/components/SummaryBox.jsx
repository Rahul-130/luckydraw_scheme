import React from 'react';
import { Paper, Box, Typography, Grid } from '@mui/material';

/**
 * A reusable component to display a set of summary metrics.
 * @param {Array<Object>} items - An array of summary items. Each item should be an object with 'label', 'value', and optional 'color'.
 * @param {object} sx - Custom styles to be applied to the Paper component.
 */
const SummaryBox = ({ items, sx }) => {
    return (
        <Paper
            elevation={3}
            sx={{
                p: 2,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                ...sx
            }}
        >
            <Grid container spacing={2} textAlign="center" alignItems="center" sx={{ flexWrap: 'nowrap', justifyContent: 'space-around' }}>
                {items.map((item, index) => (
                    <Grid item key={index}>
                        <Typography variant="caption" sx={{ color: item.color || 'text.secondary', textTransform: 'uppercase', fontWeight: 'medium' }}>{item.label}</Typography>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: item.color || 'text.primary' }}>{item.value}</Typography>
                    </Grid>
                ))}
            </Grid>
        </Paper>
    );
};

export default SummaryBox;
