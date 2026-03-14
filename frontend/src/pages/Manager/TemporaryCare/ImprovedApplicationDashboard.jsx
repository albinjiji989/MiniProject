import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Paper,
  Divider
} from '@mui/material';
import { temporaryCareAPI } from '../../../services/api';

// Import components
import StatsCards from './components/StatsCards';
import ApplicationFilters from './components/ApplicationFilters';
import ApplicationCard from './components/ApplicationCard';
import ApplicationDetailsDialog from './components/ApplicationDetailsDialog';
import PricingDialog from './components/PricingDialog';
import { OTPDisplayDialog, OTPVerificationDialog } from './components/OTPDialogs';

const ImprovedApplicationDashboard = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Dialog states
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  
  // OTP states
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState(null);
  const [verifyOtpDialogOpen, setVerifyOtpDialogOpen] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [selectedAppForOtp, setSelectedAppForOtp] = useState(null);
  const [isCheckoutOTP, setIsCheckoutOTP] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Filter applications when search term or status filter changes
  useEffect(() => {
    filterApplications();
  }, [searchTerm, statusFilter, applications]);
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await temporaryCareAPI.managerGetApplications();
      const apps = response.data?.data?.applications || [];
      
      setApplications(apps);
      calculateStats(apps);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (apps) => {
    const stats = {
      total: apps.length,
      submitted: apps.filter(a => a.status === 'submitted').length,
      priceSet: apps.filter(a => a.status === 'price_determined').length,
      advancePaid: apps.filter(a => a.status === 'advance_paid').length,
      activeCare: apps.filter(a => a.status === 'active_care').length,
      completed: apps.filter(a => a.status === 'completed').length,
      revenue: apps.filter(a => a.payments?.advance?.paid).reduce((sum, a) => sum + (a.payments?.advance?.amount || 0), 0)
    };
    setStats(stats);
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

  const handleViewDetails = async (appId) => {
    try {
      console.log('🔍 Fetching application details for ID:', appId);
      const response = await temporaryCareAPI.managerGetApplicationDetails(appId);
      const app = response.data?.data?.application;
      
      console.log('📋 Application details received:', app);
      console.log('🐕 Pet details in application:', app?.pets?.map(pet => ({
        petId: pet.petId,
        hasDetails: !!pet.petDetails,
        petName: pet.petDetails?.name,
        species: pet.petDetails?.species?.name || pet.petDetails?.speciesId?.name,
        breed: pet.petDetails?.breed?.name || pet.petDetails?.breedId?.name,
        images: pet.petDetails?.images?.length || 0,
        profileImage: pet.petDetails?.profileImage
      })));
      
      setSelectedApplication(app);
      setDetailsDialogOpen(true);
    } catch (err) {
      console.error('❌ Error loading details:', err);
      alert(`Failed to load application details: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleSetPricing = (application) => {
    setSelectedApplication(application);
    setPricingDialogOpen(true);
  };

  const handleAction = async (action, application) => {
    setSelectedApplication(application);
    
    switch (action) {
      case 'generateOTP':
        await handleGenerateOTP(application);
        break;
      case 'verifyOTP':
        setSelectedAppForOtp(application);
        setIsCheckoutOTP(false);
        setVerifyOtpDialogOpen(true);
        break;
      case 'generateCheckoutOTP':
        await handleGenerateCheckoutOTP(application);
        break;
      case 'verifyCheckoutOTP':
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
    } catch (err) {
      console.error('Error generating OTP:', err);
      alert(err?.response?.data?.message || 'Failed to generate OTP');
    }
  };

  const handleGenerateCheckoutOTP = async (application) => {
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
      loadDashboardData();
    } catch (err) {
      console.error('Error generating checkout OTP:', err);
      alert(err?.response?.data?.message || 'Failed to generate checkout OTP');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpInput || otpInput.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
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
        alert('Pet checkout completed successfully! Pet has been returned to owner.');
      } else {
        await temporaryCareAPI.verifyHandoverOTP({
          applicationId: selectedAppForOtp._id,
          otp: otpInput
        });
        alert('Pet handover completed successfully! Pet is now in your care.');
      }
      
      setVerifyOtpDialogOpen(false);
      setOtpInput('');
      setSelectedAppForOtp(null);
      loadDashboardData();
      setDetailsDialogOpen(false);
    } catch (err) {
      console.error('Error verifying OTP:', err);
      alert(err?.response?.data?.message || 'Failed to verify OTP. Please check the code and try again.');
    } finally {
      setOtpVerifying(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="700" gutterBottom>
          Temporary Care Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage pet care applications, pricing, and bookings efficiently
        </Typography>
      </Box>

      {/* Stats Cards */}
      <StatsCards stats={stats} loading={false} />

      {/* Applications Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight="600" gutterBottom>
          Applications
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        {/* Filters */}
        <ApplicationFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No applications found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No applications have been submitted yet'
              }
            </Typography>
          </Box>
        ) : (
          <Box>
            {filteredApplications.map((application) => (
              <ApplicationCard
                key={application._id}
                application={application}
                onViewDetails={handleViewDetails}
                onSetPricing={handleSetPricing}
                onAction={handleAction}
              />
            ))}
          </Box>
        )}
      </Paper>

      {/* Dialogs */}
      <ApplicationDetailsDialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedApplication(null);
        }}
        application={selectedApplication}
        onAction={(action) => handleAction(action, selectedApplication)}
      />

      <PricingDialog
        open={pricingDialogOpen}
        onClose={() => {
          setPricingDialogOpen(false);
          setSelectedApplication(null);
        }}
        application={selectedApplication}
        onUpdate={loadDashboardData}
      />

      <OTPDisplayDialog
        open={otpDialogOpen}
        onClose={() => {
          setOtpDialogOpen(false);
          setGeneratedOTP(null);
        }}
        otpData={generatedOTP}
      />

      <OTPVerificationDialog
        open={verifyOtpDialogOpen}
        onClose={() => {
          setVerifyOtpDialogOpen(false);
          setOtpInput('');
          setSelectedAppForOtp(null);
          setIsCheckoutOTP(false);
        }}
        application={selectedAppForOtp}
        otpInput={otpInput}
        setOtpInput={setOtpInput}
        onVerify={handleVerifyOTP}
        loading={otpVerifying}
        isCheckout={isCheckoutOTP}
      />
    </Container>
  );
};

export default ImprovedApplicationDashboard;