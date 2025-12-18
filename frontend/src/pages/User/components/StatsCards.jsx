import React from 'react';
import { Box, Grid, Card, CardContent, Typography, Avatar, alpha } from '@mui/material';import { 
  Pets as PetsIcon, 
  CalendarToday as CalendarIcon, 
  EventAvailable as EventIcon, 
  FavoriteOutlined as FavoriteIcon 
} from '@mui/icons-material';

const StatsCards = ({ stats }) => {
  const statItems = [
    {
      title: 'My Pets',
      value: stats.totalPets,
      icon: <PetsIcon />,
      color: '#6C5CE7',
      iconBg: '#6C5CE7'
    },
    {
      title: 'Appointments',
      value: stats.upcomingAppointments,
      icon: <CalendarIcon />,
      color: '#FF6B6B',
      iconBg: '#FF6B6B'
    },
    {
      title: 'Reservations',
      value: stats.reservations,
      icon: <EventIcon />,
      color: '#4ECDC4',
      iconBg: '#4ECDC4'
    },
    {
      title: 'Adoptions',
      value: stats.pendingAdoptions,
      icon: <FavoriteIcon />,
      color: '#FF9F43',
      iconBg: '#FF9F43'
    }
  ];

  return (
    <Grid container spacing={2}>
      {statItems.map((item, index) => (
        <Grid item xs={6} sm={3} key={index}>
          <Card sx={{ 
            bgcolor: alpha(item.iconBg, 0.1), 
            border: '1px solid', 
            borderColor: item.iconBg 
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: item.iconBg }}>
                    {item.value}
                  </Typography>
                  <Typography variant="body2" color={item.iconBg}>
                    {item.title}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: item.iconBg, width: 48, height: 48 }}>
                  {item.icon}
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default StatsCards;