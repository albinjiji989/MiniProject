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
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  SpaceDashboard as DashboardIcon,
  Pets as PetsIcon,
  AttachMoney as MoneyIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Check as CheckIcon,
  TrendingUp as TrendingUpIcon,
  LocalShipping as PickupIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { temporaryCareAPI, resolveMediaUrl } from '../../../services/api';

// Import dialog components
import ComprehensiveApplicationDialog from './components/ComprehensiveApplicationDialog';
import PricingDialog from './components/PricingDialog';
import { OTPDisplayDialog, OTPVerificationDialog } from './components/OTPDialogs';
import ModernApplicationCard from './components/ModernApplicationCard';

const SimpleCleanDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState(0);
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
      
      // Debug logging to see the actual application structure
      console.log('🏥 Loaded applications:', apps);
      if (apps.length > 0) {
        console.log('🐕 First application pet structure:', {
          application: apps[0],
          pets: apps[0].pets,
          firstPet: apps[0].pets?.[0],
          petDetails: apps[0].pets?.[0]?.petDetails,
          petId: apps[0].pets?.[0]?.petId,
          fullPetObject: JSON.stringify(apps[0].pets?.[0], null, 2)
        });
      }
      
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
    if (activeTab === 1) {
      filtered = filtered.filter(app => app.status === 'submitted');
    } else if (activeTab === 2) {
      filtered = filtered.filter(app => ['price_determined', 'advance_paid'].includes(app.status));
    } else if (activeTab === 3) {
      filtered = filtered.filter(app => app.status === 'active_care');
    } else if (activeTab === 4) {
      filtered = filtered.filter(app => ['completed', 'rejected'].includes(app.status));
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    // Filter by search
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
      default:
        console.log('Unknown action:', action);
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
      console.error('Error generating OTP:', err);
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
      console.error('Error generating pickup OTP:', err);
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
        showSnackbar('Pet checkout completed successfully! Pet has been returned to owner.');
      } else {
        await temporaryCareAPI.verifyHandoverOTP({
          applicationId: selectedAppForOtp._id,
          otp: otpInput
        });
        showSnackbar('Pet handover completed successfully! Pet is now in your care.');
      }
      
      setVerifyOtpDialogOpen(false);
      setOtpInput('');
      setSelectedAppForOtp(null);
      loadApplications();
      setDialogOpen(false);
    } catch (err) {
      console.error('Error verifying OTP:', err);
      showSnackbar(err?.response?.data?.message || 'Failed to verify OTP. Please check the code and try again.', 'error');
    } finally {
      setOtpVerifying(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      submitted: { label: 'New', color: 'warning', bgColor: '#FFF3E0' },
      price_determined: { label: 'Priced', color: 'info', bgColor: '#E3F2FD' },
      advance_paid: { label: 'Paid', color: 'primary', bgColor: '#F3E5F5' },
      active_care: { label: 'In Care', color: 'success', bgColor: '#E8F5E8' },
      completed: { label: 'Done', color: 'success', bgColor: '#E8F5E8' },
      rejected: { label: 'Rejected', color: 'error', bgColor: '#FFEBEE' }
    };
    return statusMap[status] || statusMap.submitted;
  };

  const getPetImage = (pet) => {
    // Handle different pet data structures
    let petData = {};
    
    if (pet.petDetails && typeof pet.petDetails === 'object') {
      petData = pet.petDetails;
    } else if (pet.petId && typeof pet.petId === 'object') {
      petData = pet.petId;
    } else if (typeof pet === 'object' && pet.name) {
      petData = pet;
    } else {
      // If petId is just a string (petCode), we don't have pet details
      console.log('⚠️ Pet data is just a petCode string:', pet.petId || pet);
      return '/placeholder-pet.svg'; // Return placeholder instead of null
    }
    
    // Debug logging to see the actual structure
    console.log('🐕 Pet image data:', {
      pet,
      petData,
      hasProfileImage: !!petData.profileImage,
      hasImages: !!(petData.images && petData.images.length > 0),
      hasImage: !!petData.image,
      hasImageUrl: !!petData.imageUrl,
      hasImageIds: !!(petData.imageIds && petData.imageIds.length > 0)
    });
    
    // Try different image sources in order of preference
    
    // 1. Profile image (most common for user pets)
    if (petData.profileImage) {
      console.log('📸 Using profileImage:', petData.profileImage);
      return resolveMediaUrl(petData.profileImage);
    }
    
    // 2. Images array with URL property (adoption/user pets)
    if (petData.images && petData.images.length > 0) {
      const imageUrl = petData.images[0].url || petData.images[0];
      console.log('📸 Using images array:', imageUrl);
      return resolveMediaUrl(imageUrl);
    }
    
    // 3. Direct image field
    if (petData.image) {
      console.log('📸 Using image field:', petData.image);
      return resolveMediaUrl(petData.image);
    }
    
    // 4. Image URL field (some pet types)
    if (petData.imageUrl) {
      console.log('📸 Using imageUrl field:', petData.imageUrl);
      return resolveMediaUrl(petData.imageUrl);
    }
    
    // 5. Image IDs array (petshop pets)
    if (petData.imageIds && petData.imageIds.length > 0) {
      const imageId = petData.imageIds[0].url || petData.imageIds[0];
      console.log('📸 Using imageIds array:', imageId);
      return resolveMediaUrl(imageId);
    }
    
    // 6. Try accessing images directly from pet object (fallback)
    if (pet.images && pet.images.length > 0) {
      const imageUrl = pet.images[0].url || pet.images[0];
      console.log('📸 Using pet.images fallback:', imageUrl);
      return resolveMediaUrl(imageUrl);
    }
    
    // 7. Try profileImage directly from pet object
    if (pet.profileImage) {
      console.log('📸 Using pet.profileImage fallback:', pet.profileImage);
      return resolveMediaUrl(pet.profileImage);
    }
    
    console.log('❌ No image found for pet, using placeholder');
    return '/placeholder-pet.svg'; // Always return placeholder instead of null
  };

  const calculateStats = () => {
    const total = applications.length;
    const newApps = applications.filter(a => a.status === 'submitted').length;
    const activeCare = applications.filter(a => a.status === 'active_care').length;
    const completed = applications.filter(a => a.status === 'completed').length;
    const revenue = applications.reduce((sum, a) => sum + (a.pricing?.totalAmount || 0), 0);
    
    return { total, newApps, activeCare, completed, revenue };
  };

  const stats = calculateStats();

  const getTabCounts = () => {
    return {
      all: applications.length,
      new: applications.filter(a => a.status === 'submitted').length,
      inProgress: applications.filter(a => ['price_determined', 'advance_paid'].includes(a.status)).length,
      activeCare: applications.filter(a => a.status === 'active_care').length,
      completed: applications.filter(a => ['completed', 'rejected'].includes(a.status)).length
    };
  };

  const tabCounts = getTabCounts();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      pb: 4
    }}>
      <Container maxWidth="xl" sx={{ pt: 3 }}>
        {/* Header */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, background: 'rgba(255, 255, 255, 0.9)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 48, height: 48, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <DashboardIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="700" color="primary.main">
                  Temporary Care Manager
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Professional pet care management system
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={loadApplications}>
                Refresh
              </Button>
            </Stack>
          </Box>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">{stats.total}</Typography>
                    <Typography variant="body2">Total Applications</Typography>
                  </Box>
                  <DashboardIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">{stats.newApps}</Typography>
                    <Typography variant="body2">New Applications</Typography>
                  </Box>
                  <AddIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">{stats.activeCare}</Typography>
                    <Typography variant="body2">Pets in Care</Typography>
                  </Box>
                  <PetsIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">₹{(stats.revenue / 1000).toFixed(1)}k</Typography>
                    <Typography variant="body2">Total Revenue</Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content */}
        <Paper elevation={0} sx={{ borderRadius: 3, background: 'rgba(255, 255, 255, 0.9)', overflow: 'hidden' }}>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ px: 3, pt: 2 }}>
              <Tab label={`All (${tabCounts.all})`} sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab label={`New (${tabCounts.new})`} sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab label={`In Progress (${tabCounts.inProgress})`} sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab label={`Active Care (${tabCounts.activeCare})`} sx={{ textTransform: 'none', fontWeight: 600 }} />
              <Tab label={`Completed (${tabCounts.completed})`} sx={{ textTransform: 'none', fontWeight: 600 }} />
            </Tabs>
          </Box>

          {/* Filters */}
          <Box sx={{ p: 3, bgcolor: 'grey.50' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search applications..."
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
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
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
            </Grid>
          </Box>

          {/* Applications List */}
          <Box sx={{ p: 3 }}>
            {filteredApplications.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">No Applications Found</Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {filteredApplications.map((app) => (
                  <Grid item xs={12} lg={6} xl={4} key={app._id}>
                    <ModernApplicationCard 
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

export default SimpleCleanDashboard;