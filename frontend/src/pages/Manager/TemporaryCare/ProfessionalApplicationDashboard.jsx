import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  Avatar,
  Stack,
  Badge,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  InputAdornment,
  Collapse
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  List as ListIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Check as CheckIcon,
  Cancel as RejectIcon,
  AttachMoney as MoneyIcon,
  Pets as PetsIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  LocalHospital as MedicalIcon,
  Home as HomeIcon,
  Restaurant as FoodIcon,
  Assignment as TaskIcon,
  TrendingUp as TrendingUpIcon,
  PendingActions as PendingIcon,
  CheckCircleOutline as ActiveIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { temporaryCareAPI, resolveMediaUrl } from '../../../services/api';

const ProfessionalApplicationDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(''); // 'approve', 'reject', 'cancel'
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState(null);
  const [verifyOtpDialogOpen, setVerifyOtpDialogOpen] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [selectedAppForOtp, setSelectedAppForOtp] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [statusFilter, searchTerm, applications]);

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
      const response = await temporaryCareAPI.managerGetApplicationDetails(appId);
      const app = response.data?.data?.application;
      console.log('Manager - Application details received:', app);
      console.log('Manager - Pets in application:', app?.pets);
      if (app?.pets) {
        app.pets.forEach((pet, idx) => {
          console.log(`Manager - Pet ${idx} special instructions:`, pet.specialInstructions);
          console.log(`Manager - Pet ${idx} full data:`, pet);
        });
      }
      setSelectedApplication(app);
      setDetailsDialogOpen(true);
    } catch (err) {
      console.error('Error loading details:', err);
    }
  };

  const handleApplicationAction = async () => {
    try {
      setActionLoading(true);
      const data = {
        action: actionType === 'cancel' ? 'reject' : actionType,
        reason: rejectionReason || undefined
      };
      
      await temporaryCareAPI.managerApproveOrReject(selectedApplication._id, data);
      
      setActionDialogOpen(false);
      setRejectionReason('');
      loadDashboardData();
      setDetailsDialogOpen(false);
      alert(`Application ${actionType}d successfully!`);
    } catch (err) {
      console.error(`Error ${actionType}ing application:`, err);
      alert(err?.response?.data?.message || `Failed to ${actionType} application`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpInput || otpInput.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setOtpVerifying(true);
      await temporaryCareAPI.verifyHandoverOTP({
        applicationId: selectedAppForOtp._id,
        otp: otpInput
      });
      alert('Pet handover completed successfully! Pet is now in your care.');
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

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'warning',
      price_determined: 'info',
      advance_paid: 'primary',
      approved: 'success',
      active_care: 'secondary',
      completed: 'success',
      cancelled: 'error',
      rejected: 'error'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      submitted: 'New Application',
      price_determined: 'Price Set',
      advance_paid: 'Advance Paid',
      approved: 'Approved',
      active_care: 'In Care',
      completed: 'Completed',
      cancelled: 'Cancelled',
      rejected: 'Rejected'
    };
    return labels[status] || status;
  };

  const renderStatsCards = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <CardContent>
            <Box sx={{ color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h4" fontWeight="bold">{stats?.submitted || 0}</Typography>
                <PendingIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
              <Typography variant="body2">New Applications</Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>Awaiting pricing</Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
          <CardContent>
            <Box sx={{ color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h4" fontWeight="bold">{stats?.advancePaid || 0}</Typography>
                <MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
              <Typography variant="body2">Advance Paid</Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>Ready for care</Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
          <CardContent>
            <Box sx={{ color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h4" fontWeight="bold">{stats?.activeCare || 0}</Typography>
                <ActiveIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
              <Typography variant="body2">Active Care</Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>Pets in facility</Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
          <CardContent>
            <Box sx={{ color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h4" fontWeight="bold">₹{((stats?.revenue || 0) / 1000).toFixed(1)}k</Typography>
                <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
              <Typography variant="body2">Total Revenue</Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>From advances</Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderApplicationsTable = () => (
    <Card>
      <CardHeader
        title="Applications"
        action={
          <Stack direction="row" spacing={2}>
            <TextField
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="submitted">New Applications</MenuItem>
                <MenuItem value="price_determined">Price Set</MenuItem>
                <MenuItem value="advance_paid">Advance Paid</MenuItem>
                <MenuItem value="active_care">Active Care</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        }
      />
      <Divider />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>Application #</TableCell>
              <TableCell>Owner Details</TableCell>
              <TableCell>Pets</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredApplications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Typography color="text.secondary">No applications found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredApplications.map((app) => (
                <TableRow key={app._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">
                      {app.applicationNumber || `APP-${app._id.slice(-6)}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        {app.userId?.name?.[0] || 'U'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="500">
                          {app.userId?.name || 'Unknown User'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {app.userId?.phone || app.userId?.email || 'No contact'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<PetsIcon />}
                      label={`${app.pets?.length || 0} Pet${app.pets?.length !== 1 ? 's' : ''}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(app.startDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      to {new Date(app.endDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" display="block" color="primary.main">
                      {app.numberOfDays} days
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(app.status)}
                      color={getStatusColor(app.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {app.pricing?.totalAmount ? (
                      <Box>
                        <Typography variant="body2" fontWeight="600">
                          ₹{app.pricing.totalAmount.toLocaleString()}
                        </Typography>
                        {app.payments?.advance?.paid && (
                          <Chip label="Advance Paid" size="small" color="success" sx={{ mt: 0.5 }} />
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not set
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewDetails(app._id)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    {app.status === 'submitted' && (
                      <Tooltip title="Set Pricing">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => {
                            setSelectedApplication(app);
                            setPricingDialogOpen(true);
                          }}
                        >
                          <MoneyIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {app.status === 'advance_paid' && (
                      <>
                        <Tooltip title="Generate OTP for Handover">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleGenerateOTP(app)}
                          >
                            <AddIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Verify OTP from User">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => {
                              setSelectedAppForOtp(app);
                              setVerifyOtpDialogOpen(true);
                            }}
                          >
                            <CheckIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="700" gutterBottom>
          Temporary Care Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage pet care applications, pricing, and bookings
        </Typography>
      </Box>

      {renderStatsCards()}
      {renderApplicationsTable()}

      {/* Application Details Dialog */}
      <ApplicationDetailsDialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedApplication(null);
        }}
        application={selectedApplication}
        onUpdate={loadDashboardData}
        onAction={(action) => {
          if (action === 'generateOTP') {
            handleGenerateOTP(selectedApplication);
          } else if (action === 'verifyOTP') {
            setSelectedAppForOtp(selectedApplication);
            setVerifyOtpDialogOpen(true);
          } else {
            setActionType(action);
            setActionDialogOpen(true);
          }
        }}
      />

      {/* Pricing Dialog */}
      <PricingDialog
        open={pricingDialogOpen}
        onClose={() => {
          setPricingDialogOpen(false);
          setSelectedApplication(null);
        }}
        application={selectedApplication}
        onUpdate={loadDashboardData}
      />

      {/* Action Confirmation Dialog */}
      <ActionConfirmationDialog
        open={actionDialogOpen}
        onClose={() => {
          setActionDialogOpen(false);
          setRejectionReason('');
        }}
        actionType={actionType}
        reason={rejectionReason}
        setReason={setRejectionReason}
        onConfirm={handleApplicationAction}
        loading={actionLoading}
      />

      {/* OTP Display Dialog */}
      <OTPDisplayDialog
        open={otpDialogOpen}
        onClose={() => {
          setOtpDialogOpen(false);
          setGeneratedOTP(null);
        }}
        otpData={generatedOTP}
      />

      {/* OTP Verification Dialog */}
      <OTPVerificationDialog
        open={verifyOtpDialogOpen}
        onClose={() => {
          setVerifyOtpDialogOpen(false);
          setOtpInput('');
          setSelectedAppForOtp(null);
        }}
        application={selectedAppForOtp}
        otpInput={otpInput}
        setOtpInput={setOtpInput}
        onVerify={handleVerifyOTP}
        loading={otpVerifying}
      />
    </Container>
  );
};

// Application Details Dialog
const ApplicationDetailsDialog = ({ open, onClose, application, onUpdate, onAction }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!application) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">Application Details</Typography>
            <Typography variant="caption" color="text.secondary">
              {application.applicationNumber || `APP-${application._id?.slice(-8)}`}
            </Typography>
          </Box>
          <Chip
            label={application.status?.replace(/_/g, ' ').toUpperCase()}
            color={getStatusColor(application.status)}
          />
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Owner & Contact" />
          <Tab label="Pet Details" />
          <Tab label="Pricing & Payment" />
        </Tabs>

        {/* Owner Info Tab */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="primary" />
                    Owner Information
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Full Name</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {application.userId?.name || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Email</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {application.userId?.email || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Phone</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {application.userId?.phone || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">User ID</Typography>
                      <Typography variant="body1" fontWeight="500" sx={{ fontFamily: 'monospace' }}>
                        {application.userId?._id || 'Unknown'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon color="primary" />
                    Booking Duration
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Check-In Date</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {new Date(application.startDate).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Check-Out Date</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {new Date(application.endDate).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Total Duration</Typography>
                      <Typography variant="body1" fontWeight="500" color="primary.main">
                        {application.numberOfDays} Days
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Pet Details Tab */}
        {activeTab === 1 && (
          <Box>
            {application.pets && application.pets.length > 0 ? (
              application.pets.map((pet, index) => {
                // Use petDetails if available, fallback to petId
                const petData = pet.petDetails || pet.petId || {};
                return (
                  <Card key={index} sx={{ mb: 2 }} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Avatar
                          src={resolveMediaUrl(petData?.profileImage || petData?.images?.[0]?.url)}
                          sx={{ width: 80, height: 80 }}
                        >
                          <PetsIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6">{petData?.name || 'Unknown Pet'}</Typography>
                          <Stack direction="row" spacing={1} sx={{ my: 1 }}>
                            <Chip label={petData?.speciesId?.name || 'Species Unknown'} size="small" />
                            <Chip label={petData?.breed || petData?.breedId?.name || 'Breed Unknown'} size="small" variant="outlined" />
                            <Chip label={`${petData?.age || 'Age Unknown'}`} size="small" variant="outlined" />
                          </Stack>
                          
                          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                              Special Instructions:
                            </Typography>
                            {!pet.specialInstructions || (!pet.specialInstructions.food && !pet.specialInstructions.medicine && !pet.specialInstructions.behavior && !pet.specialInstructions.allergies && !pet.specialInstructions.otherNotes) ? (
                              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                No special instructions provided
                              </Typography>
                            ) : (
                              <>
                                {pet.specialInstructions.food && (
                                  <Typography variant="body2" sx={{ mt: 1 }}>
                                    <FoodIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle', color: 'success.main' }} />
                                    <strong>Food:</strong> {pet.specialInstructions.food}
                                  </Typography>
                                )}
                                {pet.specialInstructions.medicine && (
                                  <Typography variant="body2" sx={{ mt: 1 }}>
                                    <MedicalIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                                    <strong>Medicine:</strong> {pet.specialInstructions.medicine}
                                  </Typography>
                                )}
                                {pet.specialInstructions.behavior && (
                                  <Typography variant="body2" sx={{ mt: 1 }}>
                                    <strong>Behavior:</strong> {pet.specialInstructions.behavior}
                                  </Typography>
                                )}
                                {pet.specialInstructions.allergies && (
                                  <Typography variant="body2" sx={{ mt: 1 }} color="error.main">
                                    <strong>⚠️ Allergies:</strong> {pet.specialInstructions.allergies}
                                  </Typography>
                                )}
                                {pet.specialInstructions.otherNotes && (
                                  <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                                    <strong>Other Notes:</strong> {pet.specialInstructions.otherNotes}
                                  </Typography>
                                )}
                              </>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Alert severity="info">No pet information available</Alert>
            )}
          </Box>
        )}

        {/* Pricing Tab */}
        {activeTab === 2 && (
          <Grid container spacing={2}>
            {application.pricing?.totalAmount ? (
              <>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Pricing Breakdown</Typography>
                      <Divider sx={{ my: 2 }} />
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography>Subtotal:</Typography>
                          <Typography fontWeight="500">₹{application.pricing.subtotal?.toLocaleString()}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography>Tax ({application.pricing.tax?.percentage}%):</Typography>
                          <Typography fontWeight="500">₹{application.pricing.tax?.amount?.toLocaleString()}</Typography>
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="h6">Total Amount:</Typography>
                          <Typography variant="h6" color="primary">₹{application.pricing.totalAmount?.toLocaleString()}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: 'success.lighter', p: 1, borderRadius: 1 }}>
                          <Typography>Advance (50%):</Typography>
                          <Typography fontWeight="600">₹{application.pricing.advanceAmount?.toLocaleString()}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography color="text.secondary">Remaining:</Typography>
                          <Typography color="text.secondary">₹{application.pricing.remainingAmount?.toLocaleString()}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Payment Status</Typography>
                      <Divider sx={{ my: 2 }} />
                      {application.paymentStatus?.advance?.status === 'completed' ? (
                        <Alert severity="success">
                          Advance payment of ₹{application.pricing?.advanceAmount?.toLocaleString()} received
                          {application.paymentStatus.advance.paidAt && ` on ${new Date(application.paymentStatus.advance.paidAt).toLocaleDateString()}`}
                        </Alert>
                      ) : (
                        <Alert severity="warning">Advance payment pending</Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </>
            ) : (
              <Grid item xs={12}>
                <Alert severity="info">Pricing not yet determined</Alert>
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {application.status === 'advance_paid' && (
          <Button 
            variant="contained" 
            color="success"
            startIcon={<ApproveIcon />}
            onClick={() => onAction('approve')}
          >
            Approve
          </Button>
        )}
        
        {/* OTP Generation & Verification Buttons - shown when advance is paid */}
        {application.status === 'advance_paid' && (
          <>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => onAction('generateOTP')}
            >
              Generate OTP
            </Button>
            <Button 
              variant="contained" 
              color="success"
              startIcon={<CheckIcon />}
              onClick={() => onAction('verifyOTP')}
            >
              Verify OTP
            </Button>
          </>
        )}
        
        {/* Reject/Cancel only allowed before payment */}
        {!['approved', 'advance_paid', 'active_care', 'completed', 'cancelled', 'rejected'].includes(application.status) && (
          <Button 
            variant="outlined" 
            color="error"
            startIcon={<RejectIcon />}
            onClick={() => onAction('reject')}
          >
            Reject
          </Button>
        )}
        {!['advance_paid', 'active_care', 'completed', 'cancelled', 'rejected'].includes(application.status) && (
          <Button 
            variant="outlined" 
            color="error"
            startIcon={<RejectIcon />}
            onClick={() => onAction('cancel')}
          >
            Cancel
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// Pricing Dialog Component
const PricingDialog = ({ open, onClose, application, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [pricingData, setPricingData] = useState({
    baseRate: 500,
    tax: 18,
    discount: 0
  });

  if (!application) return null;

  const handleSetPricing = async () => {
    try {
      setLoading(true);
      
      const petPricing = application.pets.map(pet => ({
        petId: pet.petId,
        petType: 'Dog',
        petSize: 'medium',
        baseRatePerDay: pricingData.baseRate,
        numberOfDays: application.numberOfDays,
        baseAmount: pricingData.baseRate * application.numberOfDays,
        specialCareAddons: [],
        totalAmount: pricingData.baseRate * application.numberOfDays
      }));

      // Backend will calculate subtotal, totalAmount, advanceAmount, and remainingAmount
      const pricingPayload = {
        petPricing,
        additionalCharges: [],
        discount: { 
          amount: pricingData.discount, 
          reason: pricingData.discount > 0 ? 'Early booking discount' : '' 
        },
        tax: { percentage: pricingData.tax }
      };

      await temporaryCareAPI.managerSetPricing(application._id, pricingPayload);

      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error setting pricing:', err);
      alert(err?.response?.data?.message || 'Failed to set pricing');
    } finally {
      setLoading(false);
    }
  };

  const totalPets = application.pets?.length || 0;
  const subtotal = (pricingData.baseRate * application.numberOfDays * totalPets) - pricingData.discount;
  const taxAmount = (subtotal * pricingData.tax) / 100;
  const total = subtotal + taxAmount;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Set Pricing - {application.applicationNumber}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <TextField
            label="Base Rate Per Day (per pet)"
            type="number"
            value={pricingData.baseRate}
            onChange={(e) => setPricingData({ ...pricingData, baseRate: Number(e.target.value) })}
            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            fullWidth
          />
          <TextField
            label="Discount"
            type="number"
            value={pricingData.discount}
            onChange={(e) => setPricingData({ ...pricingData, discount: Number(e.target.value) })}
            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            fullWidth
          />
          <TextField
            label="Tax Percentage"
            type="number"
            value={pricingData.tax}
            onChange={(e) => setPricingData({ ...pricingData, tax: Number(e.target.value) })}
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            fullWidth
          />

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Calculation Summary</Typography>
              <Divider sx={{ my: 1 }} />
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Pets: {totalPets} × Days: {application.numberOfDays} × Rate: ₹{pricingData.baseRate}</Typography>
                  <Typography variant="body2" fontWeight="500">₹{(pricingData.baseRate * application.numberOfDays * totalPets).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Discount:</Typography>
                  <Typography variant="body2" color="success.main">-₹{pricingData.discount.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Tax ({pricingData.tax}%):</Typography>
                  <Typography variant="body2">₹{taxAmount.toLocaleString()}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Total Amount:</Typography>
                  <Typography variant="h6" color="primary">₹{total.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: 'success.lighter', p: 1, borderRadius: 1 }}>
                  <Typography fontWeight="500">Advance (50%):</Typography>
                  <Typography fontWeight="600">₹{(total * 0.5).toLocaleString()}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSetPricing} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Set Pricing'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Helper function for status color
const getStatusColor = (status) => {
  const colors = {
    submitted: 'warning',
    price_determined: 'info',
    advance_paid: 'primary',
    approved: 'success',
    active_care: 'secondary',
    completed: 'success',
    cancelled: 'error',
    rejected: 'error'
  };
  return colors[status] || 'default';
};

// Action Confirmation Dialog
const ActionConfirmationDialog = ({ open, onClose, actionType, reason, setReason, onConfirm, loading }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>
      {actionType === 'approve' && 'Approve Application'}
      {actionType === 'reject' && 'Reject Application'}
      {actionType === 'cancel' && 'Cancel Application'}
    </DialogTitle>
    <DialogContent>
      <Typography variant="body1" sx={{ mb: 2 }}>
        {actionType === 'approve' && 'Are you sure you want to approve this application? This will allow the customer to check in their pets.'}
        {actionType === 'reject' && 'Are you sure you want to reject this application?'}
        {actionType === 'cancel' && 'Are you sure you want to cancel this application?'}
      </Typography>
      {(actionType === 'reject' || actionType === 'cancel') && (
        <TextField
          fullWidth
          label="Reason (Optional)"
          multiline
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Provide a reason for this action..."
        />
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={loading}>Cancel</Button>
      <Button 
        onClick={onConfirm} 
        variant="contained" 
        color={actionType === 'approve' ? 'success' : 'error'}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Confirm'}
      </Button>
    </DialogActions>
  </Dialog>
);

// OTP Display Dialog (Manager does NOT see the OTP - it's secret!)
const OTPDisplayDialog = ({ open, onClose, otpData }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>
      <Box display="flex" alignItems="center" gap={1}>
        <CheckIcon color="success" />
        <Typography variant="h6">OTP Sent Successfully</Typography>
      </Box>
    </DialogTitle>
    <DialogContent>
      {otpData && (
        <>
          <Alert severity="success" sx={{ mb: 2 }}>
            <strong>OTP has been sent to user's email</strong>
          </Alert>
          
          <Paper elevation={2} sx={{ p: 3, bgcolor: 'info.lighter', mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>User Information:</Typography>
            <Box sx={{ pl: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Name:</strong> {otpData.userName}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Email:</strong> {otpData.emailSent}
              </Typography>
              {otpData.userPhone && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Phone:</strong> {otpData.userPhone}
                </Typography>
              )}
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Application:</strong> {otpData.applicationNumber}
              </Typography>
              <Typography variant="body2" color="warning.main">
                <strong>Expires:</strong> {new Date(otpData.expiresAt).toLocaleString()}
              </Typography>
            </Box>
          </Paper>

          <Alert severity="info" icon={<TaskIcon />}>
            <Typography variant="subtitle2" gutterBottom>
              <strong>Next Steps:</strong>
            </Typography>
            <Typography variant="body2" component="div">
              <ol style={{ margin: 0, paddingLeft: 20 }}>
                <li>User will receive the OTP via email</li>
                <li>Ask the user to check their email</li>
                <li>User will show/tell you the 6-digit OTP</li>
                <li>Click "Verify OTP" button and enter the code</li>
              </ol>
            </Typography>
          </Alert>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="caption">
              <strong>Security Note:</strong> Never share or display the OTP publicly. 
              The user must provide it from their email.
            </Typography>
          </Alert>
        </>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

// OTP Verification Dialog (Manager enters OTP from user)
const OTPVerificationDialog = ({ open, onClose, application, otpInput, setOtpInput, onVerify, loading }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>
      <Box display="flex" alignItems="center" gap={1}>
        <CheckIcon color="primary" />
        <Typography variant="h6">Verify Handover OTP</Typography>
      </Box>
    </DialogTitle>
    <DialogContent>
      {application && (
        <>
          <Alert severity="info" sx={{ mb: 3 }}>
            Ask the user to provide the 6-digit OTP from their email.
          </Alert>

          <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" gutterBottom>Application Details:</Typography>
            <Typography variant="body2"><strong>User:</strong> {application.userId?.name}</Typography>
            <Typography variant="body2"><strong>Application:</strong> {application.applicationNumber}</Typography>
            <Typography variant="body2"><strong>Pets:</strong> {application.pets?.length || 0}</Typography>
          </Paper>

          <TextField
            fullWidth
            label="Enter OTP"
            variant="outlined"
            value={otpInput}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setOtpInput(value);
            }}
            placeholder="000000"
            inputProps={{
              maxLength: 6,
              style: { 
                fontSize: 24, 
                letterSpacing: 8, 
                textAlign: 'center',
                fontWeight: 'bold'
              }
            }}
            helperText={`${otpInput.length}/6 digits entered`}
            error={otpInput.length > 0 && otpInput.length < 6}
            disabled={loading}
          />

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="caption">
              <strong>Important:</strong> The OTP is valid for 15 minutes only. 
              Make sure the user provides the correct code from their email.
            </Typography>
          </Alert>
        </>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button 
        onClick={onVerify} 
        variant="contained" 
        color="success"
        disabled={loading || otpInput.length !== 6}
        startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
      >
        {loading ? 'Verifying...' : 'Verify & Accept Pet'}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ProfessionalApplicationDashboard;
