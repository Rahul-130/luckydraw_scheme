import React from 'react';
import { Paper, Box, Typography, Grid } from '@mui/material';

// Define the keyframes for our animation
const fadeInSlideUp = {
    'from': {
        opacity: 0,
        transform: 'translateY(10px)',
    },
    'to': {
        opacity: 1,
        transform: 'translateY(0)',
    },
};

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
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', // Keep your nice gradient
                // Apply the animation to the container
                animation: 'fadeInSlideUp 0.5s ease-out forwards',
                '@keyframes fadeInSlideUp': fadeInSlideUp,
                ...sx
            }}
        >
            <Grid container spacing={2} textAlign="center" alignItems="center" sx={{ flexWrap: 'nowrap', justifyContent: 'space-around' }}>
                {items.map((item, index) => (
                    <Grid key={index} sx={{
                        // Stagger the animation for each item
                        opacity: 0, // Start transparent
                        animation: 'fadeInSlideUp 0.4s ease-out forwards',
                        animationDelay: `${index * 100}ms`, // Stagger delay
                        '@keyframes fadeInSlideUp': fadeInSlideUp,
                    }}>
                        <Typography variant="caption" sx={{ color: item.color || 'text.secondary', textTransform: 'uppercase', fontWeight: 'medium' }}>{item.label}</Typography>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: item.color || 'text.primary' }}>{item.value}</Typography>
                    </Grid>
                ))}
            </Grid>
        </Paper>
    );
};

export default SummaryBox;
