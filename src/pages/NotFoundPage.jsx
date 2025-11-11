import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';

// Keyframe animations for a more dynamic feel
const fadeInSlideUp = {
  'from': {
    opacity: 0,
    transform: 'translateY(20px)',
  },
  'to': {
    opacity: 1,
    transform: 'translateY(0)',
  },
};

const pulseAnimation = {
  '0%': { transform: 'scale(1)' },
  '50%': { transform: 'scale(1.1)' },
  '100%': { transform: 'scale(1)' },
};

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 128px)', // Adjust based on header/footer height
          textAlign: 'center',
          py: 4,
          animation: 'fadeInSlideUp 0.7s ease-out forwards',
          '@keyframes fadeInSlideUp': fadeInSlideUp,
        }}
      >
        <ReportProblemOutlinedIcon 
          sx={{ 
            fontSize: 80, color: 'warning.main', mb: 2,
            animation: 'pulseAnimation 2.5s ease-in-out infinite',
            '@keyframes pulseAnimation': pulseAnimation,
          }} />
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontWeight: 'bold',
            fontSize: { xs: '6rem', md: '8rem' },
            color: 'primary.main',
            textShadow: (theme) => `2px 2px 4px ${theme.palette.action.disabled}`,
          }}
        >
          404
        </Typography>
        <Typography variant="h5" component="h2" sx={{ mt: -2, mb: 1, fontWeight: 'bold' }}>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Oops! The page you are looking for does not exist. It might have been moved or deleted.
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/books')} 
          size="large"
          sx={{
            transition: (theme) => theme.transitions.create(['transform', 'box-shadow']),
            '&:hover': { transform: 'translateY(-3px)', boxShadow: (theme) => theme.shadows[4] },
          }}
        >
          Go to Homepage
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
