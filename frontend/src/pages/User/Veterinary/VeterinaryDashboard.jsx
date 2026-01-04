import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  useTheme,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  LocalHospital as HospitalIcon,
  Pets as PetsIcon,
  LocationOn as LocationIcon,
  Info as InfoIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { veterinaryAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

export default function VeterinaryDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load appointments
      const response = await veterinaryAPI.getAppointments();
      const appointmentsData = response.data.data.appointments || [];
      setAppointments(appointmentsData);
      
      // Calculate stats
      const total = appointmentsData.length;
      const scheduled = appointmentsData.filter(a => a.status === 'scheduled').length;
      const completed = appointmentsData.filter(a => a.status === 'completed').length;
      const cancelled = appointmentsData.filter(a => a.status === 'cancelled').length;
      
      setStats({
        total,
        scheduled,
        completed,
        cancelled
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAppointment = (appointmentId) => {
    navigate(`/user/veterinary/appointments/${appointmentId}`);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      scheduled: 'primary',
      confirmed: 'success',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'error',
      no_show: 'warning',
      pending_approval: 'info'
    };
    
    return (
      <Chip 
        label={status?.charAt(0).toUpperCase() + status?.slice(1).replace('_', ' ') || 'Unknown'}
        color={statusColors[status] || 'default'}
        size="small"
      />
    );
  };

  const getBookingTypeBadge = (bookingType) => {
    const typeColors = {
      emergency: 'error',
      walkin: 'warning',
      routine: 'primary'
    };
    
    return (
      <Chip 
        label={bookingType?.charAt(0).toUpperCase() + bookingType?.slice(1).replace('_', ' ') || 'Unknown'}
        color={typeColors[bookingType] || 'default'}
        size="small"
        variant="outlined"
      />
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Veterinary Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your pet's veterinary appointments and medical records
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  sx={{ 
                    width: 56, 
                    height: 56, 
                    borderRadius: '50%', 
                    backgroundColor: 'warning.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}
                >
                  <TimeIcon sx={{ fontSize: 32 }} />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Scheduled
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.scheduled}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  sx={{ 
                    width: 56, 
                    height: 56, 
                    borderRadius: '50%', 
                    backgroundColor: 'success.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 32 }} />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.completed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  sx={{ 
                    width: 56, 
                    height: 56, 
                    borderRadius: '50%', 
                    backgroundColor: 'error.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}
                >
                  <CancelIcon sx={{ fontSize: 32 }} />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Cancelled
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.cancelled}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => navigate('/user/veterinary/select-pet')}
          >
            Book Appointment
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<EventIcon />}
            onClick={() => navigate('/user/veterinary/select-pet')}
          >
            Book Appointment
          </Button>
        </Box>
      </Box>

      {/* Recent Appointments */}
      <Card>
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Recent Appointments
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your most recent veterinary appointments
            </Typography>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              <CircularProgress />
            </Box>
          ) : appointments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <EventIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No appointments
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                You don't have any veterinary appointments yet.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => navigate('/user/veterinary/select-pet')}
                sx={{ mt: 2 }}
              >
                Book Appointment
              </Button>
            </Box>
          ) : (
            <List>
              {appointments.slice(0, 5).map((appointment) => (
                <React.Fragment key={appointment._id}>
                  <ListItem alignItems="flex-start" onClick={() => handleViewAppointment(appointment._id)} sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <PetsIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={appointment.pet?.name || 'Unknown Pet'}
                      secondary={
                        <React.Fragment>
                          <Typography component="span" variant="body2" color="text.primary">
                            {appointment.storeName || 'Unknown Clinic'}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2" color="text.secondary">
                            {appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : 'Anytime'}
                            {appointment.timeSlot ? ` at ${appointment.timeSlot}` : ''}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2" color="text.secondary">
                            Reason: {appointment.reason || 'Not specified'}
                          </Typography>
                        </React.Fragment>
                      }
                    />
                    <Box>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        {getBookingTypeBadge(appointment.bookingType)}
                      </Box>
                      {getStatusBadge(appointment.status)}
                    </Box>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}