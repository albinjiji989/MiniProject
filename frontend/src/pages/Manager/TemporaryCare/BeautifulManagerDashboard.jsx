import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  IconButton,
  Stack,
  Paper,
  Divider,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fade,
  Skeleton,
  Badge,
  Tooltip,
  LinearProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Pets as PetsIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Notifications as NotificationIcon,
  Add as AddIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { temporaryCareAPI, resolveMediaUrl } from '../../../services/api';
import BeautifulApplicationDialog from './components/BeautifulApplicationDialog';

const BeautifulManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [searchTerm, statusFilter, applications]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await temporaryCareAPI.managerGetApplications();
      const apps = response.data?.data?.applications || [];
      setApplications(apps);
    } catch (error) {
      console.error('Error loading applications:', error);
      showSnackbar('Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.applicationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredApplications(filtered);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleViewDetails = (app) => {
    setSelectedApp(app);
    setDialogOpen(true);
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      submitted: { 
        label: 'New Application', 
        color: '#FF9800', 
        bgColor: '#FFF3E0',
        icon: '🆕',
        progress: 20
      },
      price_determined: { 
        label: 'Awaiting Payment', 
        color: '#2196F3', 
        bgColor: '#E3F2FD',
        icon: '💰',
        progress: 40
      },
      advance_paid: { 
        label: 'Ready for Check-in', 
        color: '#9C27B0', 
        bgColor: '#F3E5F5',
        icon: '🏠',
        progress: 60
      },
      active_care: { 
        label: 'Pet in Care', 
        color: '#4CAF50', 
        bgColor: '#E8F5E8',
        icon: '🐕',
        progress: 80
      },
      completed: { 
        label: 'Completed', 
        color: '#4CAF50', 
        bgColor: '#E8F5E8',
        icon: '✅',
        progress: 100
      },
      rejected: { 
        label: 'Rejected', 
        color: '#F44336', 
        bgColor: '#FFEBEE',
        icon: '❌',
        progress: 0
      }
    };
    return statusMap[status] || statusMap.submitted;
  };

  const getPetImage = (pet) => {
    const petData = pet.petDetails || {};
    if (petData.profileImage) return resolveMediaUrl(petData.profileImage);
    if (petData.images && petData.images.length > 0) {
      return resolveMediaUrl(petData.images[0].url || petData.images[0]);
    }
    if (petData.image) return resolveMediaUrl(petData.image);
    return null;
  };

  const calculateStats = () => {
    return {
      total: applications.length,
      newApplications: applications.filter(a => a.status === 'submitted').length,
      activeCare: applications.filter(a => a.status === 'active_care').length,
      completed: applications.filter(a => a.status === 'completed').length,
      revenue: applications.reduce((sum, a) => sum + (a.pricing?.totalAmount || 0), 0)
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} key={i}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      pb: 4
    }}>
      <Container maxWidth="xl" sx={{ pt: 4 }}>
        {/* Header */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            mb: 4, 
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ 
                width: 60, 
                height: 60, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
              }}>
                <DashboardIcon sx={{ fontSize: 30 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="700" color="primary.main">
                  Temporary Care Manager
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Manage pet care applications with ease and efficiency
                </Typography>
              </Box>
            </Box>
            <Badge badgeContent={stats.newApplications} color="error">
              <IconButton 
                sx={{ 
                  background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                  color: 'white',
                  '&:hover': { transform: 'scale(1.05)' }
                }}
              >
                <NotificationIcon />
              </IconButton>
            </Badge>
          </Box>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Fade in timeout={500}>
              <Card sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: 3,
                transition: 'transform 0.3s ease',
                '&:hover': { transform: 'translateY(-8px)' }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" fontWeight="bold">
                        {stats.total}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Total Applications
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                      <DashboardIcon sx={{ fontSize: 28 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Fade in timeout={700}>
              <Card sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                borderRadius: 3,
                transition: 'transform 0.3s ease',
                '&:hover': { transform: 'translateY(-8px)' }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" fontWeight="bold">
                        {stats.newApplications}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        New Applications
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                      <AddIcon sx={{ fontSize: 28 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Fade in timeout={900}>
              <Card sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                borderRadius: 3,
                transition: 'transform 0.3s ease',
                '&:hover': { transform: 'translateY(-8px)' }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" fontWeight="bold">
                        {stats.activeCare}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Pets in Care
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                      <PetsIcon sx={{ fontSize: 28 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Fade in timeout={1100}>
              <Card sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: 'white',
                borderRadius: 3,
                transition: 'transform 0.3s ease',
                '&:hover': { transform: 'translateY(-8px)' }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" fontWeight="bold">
                        ₹{(stats.revenue / 1000).toFixed(1)}k
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Total Revenue
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                      <TrendingUpIcon sx={{ fontSize: 28 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search applications, owners, or emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 }
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Filter by Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">All Applications</MenuItem>
                  <MenuItem value="submitted">New Applications</MenuItem>
                  <MenuItem value="price_determined">Price Set</MenuItem>
                  <MenuItem value="advance_paid">Advance Paid</MenuItem>
                  <MenuItem value="active_care">Active Care</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<FilterIcon />}
                sx={{ 
                  py: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                Advanced Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Applications Grid */}
        <Grid container spacing={3}>
          {filteredApplications.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 8, 
                textAlign: 'center', 
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)'
              }}>
                <Avatar sx={{ 
                  width: 80, 
                  height: 80, 
                  mx: 'auto', 
                  mb: 2,
                  bgcolor: 'grey.100'
                }}>
                  <PetsIcon sx={{ fontSize: 40, color: 'grey.400' }} />
                </Avatar>
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  No Applications Found
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'No applications have been submitted yet'
                  }
                </Typography>
              </Paper>
            </Grid>
          ) : (
            filteredApplications.map((app, index) => {
              const statusInfo = getStatusInfo(app.status);
              return (
                <Grid item xs={12} lg={6} key={app._id}>
                  <Fade in timeout={300 + index * 100}>
                    <Card sx={{ 
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                      },
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      border: `2px solid ${statusInfo.color}20`
                    }}>
                      <CardContent sx={{ p: 3 }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" fontWeight="600" gutterBottom>
                              {app.applicationNumber || `APP-${app._id?.slice(-6)}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Applied {new Date(app.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                          <Chip
                            label={statusInfo.label}
                            sx={{
                              bgcolor: statusInfo.bgColor,
                              color: statusInfo.color,
                              fontWeight: 600,
                              '& .MuiChip-label': {
                                px: 2
                              }
                            }}
                            icon={<span style={{ fontSize: '14px' }}>{statusInfo.icon}</span>}
                          />
                        </Box>

                        {/* Progress Bar */}
                        <Box sx={{ mb: 3 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={statusInfo.progress}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: statusInfo.color,
                                borderRadius: 3
                              }
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            {statusInfo.progress}% Complete
                          </Typography>
                        </Box>

                        {/* Owner Info */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar sx={{ 
                            width: 48, 
                            height: 48,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          }}>
                            {app.userId?.name?.[0] || 'U'}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight="600">
                              {app.userId?.name || 'Unknown User'}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              {app.userId?.phone && (
                                <Chip 
                                  icon={<PhoneIcon />} 
                                  label={app.userId.phone} 
                                  size="small" 
                                  variant="outlined"
                                />
                              )}
                              {app.userId?.email && (
                                <Chip 
                                  icon={<EmailIcon />} 
                                  label={app.userId.email} 
                                  size="small" 
                                  variant="outlined"
                                />
                              )}
                            </Stack>
                          </Box>
                        </Box>

                        {/* Pets */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PetsIcon fontSize="small" />
                            Pets ({app.pets?.length || 0})
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                            {app.pets?.slice(0, 4).map((pet, petIndex) => {
                              const petData = pet.petDetails || {};
                              const petImage = getPetImage(pet);
                              return (
                                <Tooltip key={petIndex} title={petData.name || `Pet ${petIndex + 1}`}>
                                  <Avatar
                                    src={petImage}
                                    sx={{ 
                                      width: 40, 
                                      height: 40,
                                      border: '2px solid white',
                                      boxShadow: 2
                                    }}
                                  >
                                    <PetsIcon />
                                  </Avatar>
                                </Tooltip>
                              );
                            })}
                            {app.pets?.length > 4 && (
                              <Avatar sx={{ 
                                width: 40, 
                                height: 40, 
                                bgcolor: 'grey.200',
                                color: 'grey.600',
                                fontSize: '12px',
                                fontWeight: 600
                              }}>
                                +{app.pets.length - 4}
                              </Avatar>
                            )}
                          </Stack>
                        </Box>

                        {/* Duration & Pricing */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                              <CalendarIcon color="primary" sx={{ mb: 1 }} />
                              <Typography variant="h6" fontWeight="600" color="primary">
                                {app.numberOfDays}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Days
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                              <MoneyIcon color="primary" sx={{ mb: 1 }} />
                              <Typography variant="h6" fontWeight="600" color="primary">
                                {app.pricing?.totalAmount ? `₹${(app.pricing.totalAmount / 1000).toFixed(1)}k` : 'TBD'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Total
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        {/* Action Buttons */}
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            variant="outlined"
                            startIcon={<ViewIcon />}
                            onClick={() => handleViewDetails(app)}
                            sx={{ borderRadius: 2 }}
                          >
                            View Details
                          </Button>
                          
                          {app.status === 'submitted' && (
                            <Button
                              variant="contained"
                              startIcon={<MoneyIcon />}
                              sx={{ 
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                              }}
                            >
                              Set Pricing
                            </Button>
                          )}
                          
                          {app.status === 'advance_paid' && (
                            <Button
                              variant="contained"
                              startIcon={<CheckIcon />}
                              sx={{ 
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                              }}
                            >
                              Generate OTP
                            </Button>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Fade>
                </Grid>
              );
            })
          )}
        </Grid>
      </Container>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Application Details Dialog */}
      <BeautifulApplicationDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedApp(null);
        }}
        application={selectedApp}
      />
    </Box>
  );
};

export default BeautifulManagerDashboard;