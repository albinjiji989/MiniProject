import React from 'react';
import { Box, Grid, Card, CardContent, Typography, Avatar, alpha } from '@mui/material';
import { Add as AddIcon, CalendarToday as CalendarIcon, FavoriteOutlined as FavoriteIcon, ShoppingCart as ShopIcon, Star as StarIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {
  const navigate = useNavigate();
  
  const quickActions = [
    { title: 'Add New Pet', icon: <AddIcon />, path: '/User/pets/add', color: '#6C5CE7' },
    { title: 'Book Appointment', icon: <CalendarIcon />, path: '/User/veterinary', color: '#FF6B6B' },
    { title: 'Find Adoption', icon: <FavoriteIcon />, path: '/User/adoption', color: '#FF9F43' },
    { title: 'Shop Products', icon: <ShopIcon />, path: '/User/ecommerce', color: '#4ECDC4' }
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <StarIcon color="primary" />
        Quick Actions
      </Typography>
      <Grid container spacing={2}>
        {quickActions.map((action, index) => (
          <Grid item xs={6} sm={3} key={index}>
            <Card 
              sx={{ 
                height: '100%', 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  transform: 'translateY(-5px)',
                  boxShadow: 3,
                  bgcolor: alpha(action.color, 0.05)
                },
                border: `1px solid ${alpha(action.color, 0.3)}`
              }}
              onClick={() => navigate(action.path)}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Avatar sx={{ 
                  bgcolor: alpha(action.color, 0.1), 
                  color: action.color, 
                  width: 56, 
                  height: 56, 
                  mx: 'auto', 
                  mb: 2 
                }}>
                  {action.icon}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {action.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default QuickActions;