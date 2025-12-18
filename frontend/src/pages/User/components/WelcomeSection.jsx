import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { Pets as PetsIcon } from '@mui/icons-material';

const WelcomeSection = ({ user, stats }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ 
      mb: 4,
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
      borderRadius: 3,
      p: { xs: 2, sm: 3, md: 4 },
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Typography variant="h3" sx={{ 
        mb: 1, 
        fontWeight: 800,
        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        Welcome back, {user?.name?.split(' ')[0] || 'Friend'}! 🐾
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
        Let's take great care of your furry friends today
      </Typography>
      
      {/* Stats will be rendered by parent component */}
    </Box>
  );
};

export default WelcomeSection;