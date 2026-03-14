import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  Stack,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Snackbar,
  Badge,
  IconButton,
  Tooltip,
  Fab
} from '@mui/material';
import {
  Search as SearchIcon,
  SpaceDashboard as DashboardIcon,
  Pets as PetsIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material';
import { temporaryCareAPI } from '../../../services/api';

// Import components
import CompactApplicationCard from './components/CompactApplicationCard';
import ComprehensiveApplicationDialog from './components/ComprehensiveApplicationDialog';
import PricingDialog from './components/PricingDialog';
import { OTPDisplayDialog, OTPVerificationDialog } from './components/OTPDialogs';

const IndustryLevelDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Dialog states
  const [selectedApp, setSelectedApp] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  
  // OTP states
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState(null);
  const [verifyOtpDialogOpen, setVerifyOtpDialogOpen] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [selectedAppForOtp, setSelectedAppForOtp] = useState(null);
  const [isCheckoutOTP, setIsCheckoutOTP] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [searchTerm, statusFilter, applications, activeTab]);

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
    
    // Filter by tab
    const tabFilters = {
      1: ['submitted'],
      2: ['price_determined', 'advance_paid'],
      3: ['active_care'],
      4: ['completed', 'rejected']
    };
    
    if (tabFilters[activeTab]) {
      filtered = filtered.filter(app => tabFilters[activeTab].includes(app.status));
    }
    
    // Filter by status dropdown
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        app.applicationNumber?.toLowerCase().includes(term) ||
        app.userId?.name?.toLowerCase().includes(term) ||
        app.userId?.email?.toLowerCase().includes(term) ||
        app.pets?.some(pet => 
          pet.petDetails?.name?.toLowerCase().includes(term) ||
          pet.petId?.toLowerCase().includes(term)
        )
      );
    }
    
    setFilteredApplications(filtered);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAction = async (action, application) => {
    setSelectedApp(application);
    
    switch (action) {
      case 'view':
        setDialogOpen(true);
        break;
      case 'setPricing':
        setPricingDialogOpen(true);
        break;
      case 'generateOTP':
        await handleGenerateOTP(application);
        break;
      case 'verifyOTP':
        setSelectedAppForOtp(application);
        setIsCheckoutOTP(false);
        setVerifyOtpDialogOpen(true);
        break;
      case 'generatePickupOTP':
        await handleGeneratePickupOTP(application);
        break;
      case 'verifyPickupOTP':
        setSelectedAppForOtp(application);
        setIsCheckoutOTP(true);
        setVerifyOtpDialogOpen(true);
        break;
    }
  };

  const handleGenerateOTP = async (application) => {
    try {
      const response = await temporaryCareAPI.managerGenerateHandoverOTP({
        applicationId: application._id
      });
      const otpData = response.data?.data;
      setGeneratedOTP({
        ...otpData,
        applicationNumber: application.applicationNumber
      });
      setOtpDialogOpen(true);
      showSnackbar('Check-in OTP sent to user successfully!');
    } catch (err) {
      showSnackbar(err?.response?.data?.message || 'Failed to generate OTP', 'error');
    }
  };

  const handleGeneratePickupOTP = async (application) => {
    try {
      const response = await temporaryCareAPI.managerRecordCheckOut(application._id, {
        petId: application.pets[0]?.petId,
        condition: {
          description: 'Ready for pickup',
          healthStatus: 'healthy'
        }
      });
      const otpData = response.data?.data;
      setGeneratedOTP({
        otp: otpData.checkOutOtp,
        applicationNumber: application.applicationNumber,
        type: 'checkout'
      });
      setOtpDialogOpen(true);
      showSnackbar('Pickup OTP sent to user successfully!');
      loadApplications();
    } catch (err) {
      showSnackbar(err?.response?.data?.message || 'Failed to generate pickup OTP', 'error');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpInput || otpInput.length !== 6) {
      showSnackbar('Please enter a valid 6-digit OTP', 'error');
      return;
    }

    try {
      setOtpVerifying(true);
      
      if (isCheckoutOTP) {
        await temporaryCareAPI.managerRecordCheckOut(selectedAppForOtp._id, {
          petId: selectedAppForOtp.pets[0]?.petId,
          condition: {
            description: 'Pet picked up',
            healthStatus: 'healthy'
          },
          otp: otpInput
        });
        showSnackbar('Pet checkout completed successfully!');
      } else {
        await temporaryCareAPI.verifyHandoverOTP({
          applicationId: selectedAppForOtp._id,
          otp: otpInput
        });
        showSnackbar('Pet handover completed successfully!');
      }
      
      setVerifyOtpDialogOpen(false);
      setOtpInput('');
      setSelectedAppForOtp(null);
      loadApplications();
      setDialogOpen(false);
    } catch (err) {
      showSnackbar(err?.response?.data?.message || 'Failed to verify OTP', 'error');
    } finally {
      setOtpVerifying(false);
    }
  };

  const calculateStats = () => {
    const total = applications.length;
    const newApps = applications.filter(a => a.status === 'submitted').length;
    const activeCare = applications.filter(a => a.status === 'active_care').length;
    const completed = applications.filter(a => a.status === 'completed').length;
    const revenue = applications.reduce((sum, a) => sum + (a.pricing?.totalAmount || 0), 0);
    
    return { total, newApps, activeCare, completed, revenue };
  };

  const getTabCounts = () => {
    return {
      all: applications.length,
      new: applications.filter(a => a.status === 'submitted').length,
      inProgress: applications.filter(a => ['price_determined', 'advance_paid'].includes(a.status)).length,
      activeCare: applications.filter(a => a.status === 'active_care').length,
      completed: applications.filter(a => ['completed', 'rejected'].includes(a.status)).length
    };
  };

  const stats = calculateStats();
  const tabCounts = getTabCounts();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', pb: 4 }}>
      <Container maxWidth="xl" sx={{ pt: 3 }}>
        {/* Header */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ 
                width: 48, 
                height: 48, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
              }}>
                <DashboardIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="700" color="primary.main">
                  Care Manager Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Streamlined pet care management
                </Typography>
              </Box>
            </Box>
            
            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh Data">
                <IconButton onClick={loadApplications} color="primary">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Notifications">
                <IconButton color="primary">
                  <Badge badgeContent={stats.newApps} color="error">
                    <NotificationIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: 2 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">{stats.total}</Typography>
                    <Typography variant="body2">Total</Typography>
                  </Box>
                  <DashboardIcon sx={{ fontSize: 32, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ bgcolor: 'warning.main', color: 'white', borderRadius: 2 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">{stats.newApps}</Typography>
                    <Typography variant="body2">New</Typography>
                  </Box>
                  <Badge badgeContent={stats.newApps} color="error">
                    <NotificationIcon sx={{ fontSize: 32, opacity: 0.8 }} />
                  </Badge>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ bgcolor: 'success.main', color: 'white', borderRadius: 2 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">{stats.activeCare}</Typography>
                    <Typography variant="body2">Active</Typography>
                  </Box>
                  <PetsIcon sx={{ fontSize: 32, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ bgcolor: 'info.main', color: 'white', borderRadius: 2 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">₹{(stats.revenue / 1000).toFixed(0)}k</Typography>
                    <Typography variant="body2">Revenue</Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 32, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content */}
        <Paper elevation={0} sx={{ borderRadius: 3, bgcolor: 'white', overflow: 'hidden' }}>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 2 }}>
            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
              <Tab label={`All (${tabCounts.all})`} sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab label={`New (${tabCounts.new})`} sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab label={`Progress (${tabCounts.inProgress})`} sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab label={`Active (${tabCounts.activeCare})`} sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab label={`Done (${tabCounts.completed})`} sx={{ textTransform: 'none', fontWeight: 600 }} />
            </Tabs>
          </Box>

          {/* Filters */}
          <Box sx={{ p: 3, bgcolor: 'grey.50' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search applications, users, or pets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                    sx: { borderRadius: 2, bgcolor: 'white' }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status Filter</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status Filter"
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{ borderRadius: 2, bgcolor: 'white' }}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="submitted">New</MenuItem>
                    <MenuItem value="price_determined">Priced</MenuItem>
                    <MenuItem value="advance_paid">Paid</MenuItem>
                    <MenuItem value="active_care">Active Care</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Tooltip title="Grid View">
                    <IconButton 
                      onClick={() => setViewMode('grid')}
                      color={viewMode === 'grid' ? 'primary' : 'default'}
                    >
                      <GridViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="List View">
                    <IconButton 
                      onClick={() => setViewMode('list')}
                      color={viewMode === 'list' ? 'primary' : 'default'}
                    >
                      <ListViewIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Grid>
            </Grid>
          </Box>

          {/* Applications Grid */}
          <Box sx={{ p: 3 }}>
            {filteredApplications.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Applications Found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your filters or search terms
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {filteredApplications.map((app) => (
                  <Grid 
                    item 
                    xs={12} 
                    sm={viewMode === 'grid' ? 6 : 12} 
                    md={viewMode === 'grid' ? 4 : 12} 
                    lg={viewMode === 'grid' ? 3 : 12} 
                    key={app._id}
                  >
                    <CompactApplicationCard 
                      application={app}
                      onAction={handleAction}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Paper>
      </Container>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={loadApplications}
      >
        <RefreshIcon />
      </Fab>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Dialog Components */}
      <ComprehensiveApplicationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        application={selectedApp}
      />

      <PricingDialog
        open={pricingDialogOpen}
        onClose={() => setPricingDialogOpen(false)}
        application={selectedApp}
        onUpdate={loadApplications}
      />

      <OTPDisplayDialog
        open={otpDialogOpen}
        onClose={() => setOtpDialogOpen(false)}
        otpData={generatedOTP}
      />

      <OTPVerificationDialog
        open={verifyOtpDialogOpen}
        onClose={() => setVerifyOtpDialogOpen(false)}
        application={selectedAppForOtp}
        otpInput={otpInput}
        setOtpInput={setOtpInput}
        onVerify={handleVerifyOTP}
        loading={otpVerifying}
        isCheckout={isCheckoutOTP}
      />
    </Box>
  );
};

export default IndustryLevelDashboard;