import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  LinearProgress,
  Divider,
  Tab,
  Tabs,
  Paper,
  Stack,
  Avatar,
  Tooltip,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Pets as PetsIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as PendingIcon,
  LocalAtm as PaymentIcon,
  Assignment as ApplicationIcon,
  TrendingUp as TrendingUpIcon,
  Timeline as TimelineIcon,
  Visibility as ViewIcon,
  History as HistoryIcon,
  VerifiedUser as VerifiedIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { temporaryCareAPI } from '../../../services/api';
import MyTemporaryCareApplications from './MyApplications';

const TemporaryCareDashboard = () => {
  const navigate = useNavigate();
  const [activeCares, setActiveCares] = useState([]);
  const [careHistory, setCareHistory] = useState([]);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    submitted: 0,
    price_determined: 0,
    advance_paid: 0,
    approved: 0,
    active_care: 0,
    completed: 0,
    total: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('new');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [applicationsRes, activeResponse, historyResponse] = await Promise.allSettled([
        temporaryCareAPI.getMyApplications(),
        temporaryCareAPI.getActiveCare(),
        temporaryCareAPI.getCareHistory()
      ]);
      
      if (applicationsRes.status === 'fulfilled') {
        const apps = applicationsRes.value.data?.data?.applications || [];
        setApplications(apps);
        
        const newStats = {
          submitted: 0,
          price_determined: 0,
          advance_paid: 0,
          approved: 0,
          active_care: 0,
          completed: 0,
          total: apps.length,
          totalSpent: 0
        };
        
        apps.forEach(app => {
          if (newStats.hasOwnProperty(app.status)) {
            newStats[app.status]++;
          }
          if (app.payments?.advance?.paid) {
            newStats.totalSpent += app.payments.advance.amount || 0;
          }
          if (app.payments?.final?.paid) {
            newStats.totalSpent += app.payments.final.amount || 0;
          }
        });
        
        setStats(newStats);
      }
      
      if (activeResponse.status === 'fulfilled') {
        setActiveCares(activeResponse.value.data?.data?.items || []);
      }
      if (historyResponse.status === 'fulfilled') {
        setCareHistory(historyResponse.value.data?.data?.items || []);
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = (updatedCare) => {
    loadDashboardData();
    navigate('/User/temporary-care');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      active: 'success',
      completed: 'info',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderStatsCards = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card 
          sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            height: '100%'
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h3" fontWeight="700">
                  {stats.total}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  Total Applications
                </Typography>
              </Box>
              <ApplicationIcon sx={{ fontSize: 48, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card 
          sx={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            height: '100%'
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h3" fontWeight="700">
                  {stats.active_care}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  Active Care
                </Typography>
              </Box>
              <PetsIcon sx={{ fontSize: 48, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card 
          sx={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            height: '100%'
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h3" fontWeight="700">
                  {stats.completed}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  Completed
                </Typography>
              </Box>
              <CheckCircleIcon sx={{ fontSize: 48, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card 
          sx={{ 
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white',
            height: '100%'
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h3" fontWeight="700">
                  ₹{(stats.totalSpent / 1000).toFixed(1)}k
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  Total Spent
                </Typography>
              </Box>
              <MoneyIcon sx={{ fontSize: 48, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderStatusOverview = () => (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6" fontWeight="600" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimelineIcon color="primary" />
          Application Status Overview
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Submitted</Typography>
                  <Typography variant="body2" fontWeight="600">{stats.submitted}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.total > 0 ? (stats.submitted / stats.total) * 100 : 0} 
                  sx={{ height: 8, borderRadius: 1 }}
                  color="warning"
                />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Price Determined</Typography>
                  <Typography variant="body2" fontWeight="600">{stats.price_determined}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.total > 0 ? (stats.price_determined / stats.total) * 100 : 0} 
                  sx={{ height: 8, borderRadius: 1 }}
                  color="info"
                />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Advance Paid</Typography>
                  <Typography variant="body2" fontWeight="600">{stats.advance_paid}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.total > 0 ? (stats.advance_paid / stats.total) * 100 : 0} 
                  sx={{ height: 8, borderRadius: 1 }}
                  color="primary"
                />
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Approved</Typography>
                  <Typography variant="body2" fontWeight="600">{stats.approved}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.total > 0 ? (stats.approved / stats.total) * 100 : 0} 
                  sx={{ height: 8, borderRadius: 1 }}
                  color="success"
                />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Active Care</Typography>
                  <Typography variant="body2" fontWeight="600">{stats.active_care}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.total > 0 ? (stats.active_care / stats.total) * 100 : 0} 
                  sx={{ height: 8, borderRadius: 1 }}
                  color="secondary"
                />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Completed</Typography>
                  <Typography variant="body2" fontWeight="600">{stats.completed}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0} 
                  sx={{ height: 8, borderRadius: 1 }}
                  color="success"
                />
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="700" gutterBottom>
              Temporary Care Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your pet care applications and bookings
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => navigate('/User/temporary-care/apply')}
            sx={{ 
              px: 3,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: 3,
              '&:hover': {
                boxShadow: 6
              }
            }}
          >
            New Application
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Stats Cards */}
      {renderStatsCards()}

      {/* Status Overview */}
      {stats.total > 0 && renderStatusOverview()}

      {/* View Mode Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={viewMode}
          onChange={(e, v) => setViewMode(v)}
          indicatorColor="primary"
          textColor="primary"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              minHeight: 64
            }
          }}
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ApplicationIcon />
                New Application System
                {stats.total > 0 && (
                  <Chip label={stats.total} size="small" color="primary" />
                )}
              </Box>
            } 
            value="new" 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon />
                Legacy System
                {(activeCares.length + careHistory.length) > 0 && (
                  <Chip label={activeCares.length + careHistory.length} size="small" />
                )}
              </Box>
            } 
            value="legacy" 
          />
        </Tabs>
      </Paper>

      {/* Content based on view mode */}
      {viewMode === 'new' ? (
        <MyTemporaryCareApplications />
      ) : (
        <Box>
          {/* Active Care Section */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="600" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PetsIcon color="primary" />
                Active Care
              </Typography>
              <Divider sx={{ my: 2 }} />
              {activeCares.length === 0 ? (
                <Alert severity="info">No active temporary care records</Alert>
              ) : (
                <Grid container spacing={2}>
                  {activeCares.map(care => (
                    <Grid item xs={12} md={6} lg={4} key={care._id}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          height: '100%',
                          transition: 'all 0.3s',
                          '&:hover': {
                            boxShadow: 4,
                            transform: 'translateY(-4px)'
                          }
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                              <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                                <PetsIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="h6" fontWeight="600">
                                  {care.pet?.name || 'Unnamed Pet'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {care.storeName}
                                </Typography>
                              </Box>
                            </Box>
                            <Chip 
                              label={care.status.charAt(0).toUpperCase() + care.status.slice(1)} 
                              color={getStatusColor(care.status)}
                              size="small"
                            />
                          </Box>
                          
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                              <CalendarIcon fontSize="small" />
                              {formatDate(care.startDate)} - {formatDate(care.endDate)}
                            </Typography>
                          </Box>
                          
                          <Stack direction="row" spacing={1}>
                            {care.status === 'pending' && (
                              <Button
                                component={Link}
                                to={`/User/temporary-care/drop-otp/${care._id}`}
                                state={{ onVerificationSuccess: handleVerificationSuccess }}
                                variant="contained"
                                size="small"
                                startIcon={<VerifiedIcon />}
                                fullWidth
                              >
                                Drop-off OTP
                              </Button>
                            )}
                            
                            {care.status === 'active' && (
                              <Button
                                component={Link}
                                to={`/User/temporary-care/pickup-otp/${care._id}`}
                                state={{ onVerificationSuccess: handleVerificationSuccess }}
                                variant="contained"
                                color="success"
                                size="small"
                                startIcon={<VerifiedIcon />}
                                fullWidth
                              >
                                Pickup OTP
                              </Button>
                            )}
                            
                            <Button
                              component={Link}
                              to={`/User/temporary-care/${care._id}`}
                              variant="outlined"
                              size="small"
                              startIcon={<ViewIcon />}
                              fullWidth={care.status !== 'pending' && care.status !== 'active'}
                            >
                              View
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>

          {/* Care History Section */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="600" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon color="primary" />
                Care History
              </Typography>
              <Divider sx={{ my: 2 }} />
              {careHistory.length === 0 ? (
                <Alert severity="info">No temporary care history</Alert>
              ) : (
                <Grid container spacing={2}>
                  {careHistory.map(care => (
                    <Grid item xs={12} md={6} lg={4} key={care._id}>
                      <Card 
                        variant="outlined"
                        sx={{ 
                          height: '100%',
                          transition: 'all 0.3s',
                          '&:hover': {
                            boxShadow: 4,
                            transform: 'translateY(-4px)'
                          }
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                              <Avatar sx={{ bgcolor: 'grey.400', width: 48, height: 48 }}>
                                <PetsIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="h6" fontWeight="600">
                                  {care.pet?.name || 'Unnamed Pet'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {care.storeName}
                                </Typography>
                              </Box>
                            </Box>
                            <Chip 
                              label={care.status.charAt(0).toUpperCase() + care.status.slice(1)} 
                              color={getStatusColor(care.status)}
                              size="small"
                            />
                          </Box>
                          
                          <Stack spacing={0.5} sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                              <CalendarIcon fontSize="small" />
                              {formatDate(care.startDate)} - {formatDate(care.endDate)}
                            </Typography>
                            {care.handover?.completedAt && (
                              <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                <ScheduleIcon fontSize="small" />
                                Completed: {formatTime(care.handover.completedAt)}
                              </Typography>
                            )}
                          </Stack>
                          
                          <Button
                            component={Link}
                            to={`/User/temporary-care/${care._id}`}
                            variant="outlined"
                            size="small"
                            startIcon={<ViewIcon />}
                            fullWidth
                          >
                            View Details
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
    </Container>
  );
};

export default TemporaryCareDashboard;