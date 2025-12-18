import React from 'react';
import { Box, Grid, Card, CardContent, Typography, List, ListItem, ListItemIcon, ListItemText, Alert, CircularProgress, Button, Avatar, Chip, alpha, useTheme } from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  CalendarToday as CalendarIcon,
  Notifications as NotificationIcon,
  EventAvailable as EventIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ActivitySection = ({ recentActivity, upcomingAppointments, activityLoading, activityError }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  return (
    <Grid container spacing={3}>
      {/* Recent Activity */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingIcon color="primary" />
              Recent Activity
            </Typography>
            
            {activityError ? (
              <Alert severity="error">{activityError}</Alert>
            ) : activityLoading ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CircularProgress size={32} />
              </Box>
            ) : recentActivity.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <NotificationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Your recent activity will appear here
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {recentActivity.slice(0, 5).map((activity) => (
                  <ListItem key={activity.id} sx={{ px: 0, py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Box sx={{ 
                        p: 1, 
                        borderRadius: 2, 
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main'
                      }}>
                        {activity.icon}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.title}
                      secondary={activity.time}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
            
            <Button 
              variant="outlined" 
              fullWidth 
              sx={{ mt: 2 }}
              onClick={() => navigate('/User/activity')}
            >
              View All Activity
            </Button>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Upcoming Appointments */}
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon color="primary" />
              Upcoming Appointments
            </Typography>
            
            {upcomingAppointments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CalendarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No upcoming appointments
                </Typography>
                <Button 
                  variant="contained" 
                  size="small"
                  onClick={() => navigate('/User/veterinary')}
                >
                  Book Appointment
                </Button>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {upcomingAppointments.map((appointment) => (
                  <ListItem 
                    key={appointment._id} 
                    sx={{ 
                      px: 0, 
                      py: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      mb: 1,
                      '&:last-child': { mb: 0 }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Avatar sx={{ 
                        width: 36, 
                        height: 36, 
                        bgcolor: alpha('#4ECDC4', 0.1),
                        color: '#4ECDC4'
                      }}>
                        <EventIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={appointment.serviceName || appointment.type || 'Appointment'}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {appointment.petName || 'Pet'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(appointment.appointmentDate).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                    />
                    <Chip 
                      label={appointment.status || 'Scheduled'} 
                      size="small" 
                      variant="outlined" 
                      color="primary"
                    />
                  </ListItem>
                ))}
              </List>
            )}
            
            <Button 
              variant="outlined" 
              fullWidth 
              sx={{ mt: 2 }}
              onClick={() => navigate('/User/veterinary/appointments')}
            >
              Manage Appointments
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ActivitySection;