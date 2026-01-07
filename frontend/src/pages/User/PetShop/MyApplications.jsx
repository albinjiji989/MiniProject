import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stack,
  Paper,
  Avatar,
  IconButton,
  Breadcrumbs,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Payment as PaymentIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  LockOpen as OTPIcon,
  Pets as PetsIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  Store as StoreIcon,
  Receipt as ReceiptIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as AddressIcon,
  Description as DocumentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiClient, resolveMediaUrl } from '../../../services/api';
import { handleApiError } from '../../../utils/notifications';

const MyApplications = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    loadApplications();
  }, [filterStatus]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await apiClient.get('/petshop/user/purchase-applications', { params });
      setApplications(response.data.data.applications || []);
    } catch (err) {
      handleApiError(err, 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      under_review: 'info',
      approved: 'success',
      rejected: 'error',
      payment_pending: 'warning',
      paid: 'success',
      scheduled: 'info',
      completed: 'success',
      cancelled: 'default'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending Review',
      under_review: 'Under Review',
      approved: 'Approved - Payment Pending',
      rejected: 'Rejected',
      payment_pending: 'Payment Pending',
      paid: 'Paid - Awaiting Handover',
      scheduled: 'Handover Scheduled',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  };

  const handleViewDetails = async (applicationId) => {
    try {
      const response = await apiClient.get(`/petshop/user/purchase-applications/${applicationId}`);
      setSelectedApplication(response.data.data);
      setDetailsOpen(true);
    } catch (err) {
      handleApiError(err, 'Failed to load application details');
    }
  };

  const handleCancelApplication = async (applicationId) => {
    if (!window.confirm('Are you sure you want to cancel this application?')) {
      return;
    }

    try {
      await apiClient.post(`/petshop/user/purchase-applications/${applicationId}/cancel`);
      handleApiError({ response: { data: { message: 'Application cancelled successfully' } } }, '');
      loadApplications();
      setDetailsOpen(false);
    } catch (err) {
      handleApiError(err, 'Failed to cancel application');
    }
  };

  const handlePayment = async (application) => {
    try {
      setProcessingPayment(true);

      // Create Razorpay order
      const orderResponse = await apiClient.post('/petshop/user/purchase-applications/payment/create-order', {
        applicationId: application._id
      });

      const { orderId, amount, currency, key } = orderResponse.data.data;

      // Initialize Razorpay
      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: 'PetConnect',
        description: `Purchase application for ${application.petInventoryItemId?.name || 'Pet'}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment
            await apiClient.post('/petshop/user/purchase-applications/payment/verify', {
              applicationId: application._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            alert('Payment successful! Your purchase is confirmed.');
            loadApplications();
            setDetailsOpen(false);
          } catch (verifyErr) {
            handleApiError(verifyErr, 'Payment verification failed');
          }
        },
        prefill: {
          name: application.personalDetails?.fullName || '',
          email: application.personalDetails?.email || '',
          contact: application.personalDetails?.phone || ''
        },
        theme: {
          color: '#1976d2'
        },
        modal: {
          ondismiss: function() {
            setProcessingPayment(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async function (response) {
        await apiClient.post('/petshop/user/purchase-applications/payment/failure', {
          applicationId: application._id,
          error: response.error
        });
        handleApiError(response.error, 'Payment failed');
        setProcessingPayment(false);
      });
      rzp.open();
    } catch (err) {
      handleApiError(err, 'Failed to initiate payment');
      setProcessingPayment(false);
    }
  };

  const copyOTP = (otp) => {
    navigator.clipboard.writeText(otp);
    alert('OTP copied to clipboard!');
  };

  const filteredApplications = applications;

  const statusCounts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending' || a.status === 'under_review').length,
    approved: applications.filter(a => a.status === 'approved' || a.status === 'payment_pending').length,
    paid: applications.filter(a => a.status === 'paid' || a.status === 'scheduled').length,
    completed: applications.filter(a => a.status === 'completed').length,
    rejected: applications.filter(a => a.status === 'rejected' || a.status === 'cancelled').length
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', pb: 6 }}>
      {/* Breadcrumb */}
      <Box sx={{ bgcolor: 'white', borderBottom: 1, borderColor: 'divider', py: 2 }}>
        <Container maxWidth="lg">
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
            <Link
              color="inherit"
              href="#"
              onClick={(e) => { e.preventDefault(); navigate('/User/dashboard'); }}
              sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
              Home
            </Link>
            <Link
              color="inherit"
              href="#"
              onClick={(e) => { e.preventDefault(); navigate('/User/petshop/dashboard'); }}
              sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
            >
              <StoreIcon sx={{ mr: 0.5 }} fontSize="small" />
              Pet Shop
            </Link>
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              <ReceiptIcon sx={{ mr: 0.5 }} fontSize="small" />
              My Applications
            </Typography>
          </Breadcrumbs>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            My Purchase Applications
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track the status of your pet purchase applications
          </Typography>
        </Box>

        {/* Status Filter Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={filterStatus}
            onChange={(e, newValue) => setFilterStatus(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label={`All (${statusCounts.all})`} value="all" />
            <Tab label={`Pending (${statusCounts.pending})`} value="pending" />
            <Tab label={`Approved (${statusCounts.approved})`} value="approved" />
            <Tab label={`Paid (${statusCounts.paid})`} value="paid" />
            <Tab label={`Completed (${statusCounts.completed})`} value="completed" />
            <Tab label={`Rejected (${statusCounts.rejected})`} value="rejected" />
          </Tabs>
        </Paper>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <ReceiptIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No applications found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              You haven't submitted any purchase applications yet
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/User/petshop/dashboard')}
              startIcon={<StoreIcon />}
            >
              Browse Pet Shop
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredApplications.map((application) => (
              <Grid item xs={12} key={application._id}>
                <Card sx={{ '&:hover': { boxShadow: 4 }, transition: 'box-shadow 0.3s' }}>
                  <CardContent>
                    <Grid container spacing={3} alignItems="center">
                      {/* Pet Image */}
                      <Grid item xs={12} sm={3} md={2}>
                        <Avatar
                          src={resolveMediaUrl(application.petInventoryItemId?.images?.[0]?.url)}
                          variant="rounded"
                          sx={{ width: '100%', height: 120 }}
                        >
                          <PetsIcon sx={{ fontSize: 48 }} />
                        </Avatar>
                      </Grid>

                      {/* Application Details */}
                      <Grid item xs={12} sm={6} md={7}>
                        <Stack spacing={1}>
                          <Typography variant="h6" fontWeight={600}>
                            {application.petInventoryItemId?.name || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Gender: <strong>{application.selectedGender}</strong> • 
                            Applied: {new Date(application.createdAt).toLocaleDateString()}
                          </Typography>
                          <Chip
                            label={getStatusLabel(application.status)}
                            color={getStatusColor(application.status)}
                            size="small"
                            sx={{ width: 'fit-content' }}
                          />
                          
                          {/* OTP Display if scheduled */}
                          {application.status === 'scheduled' && application.otpCode && (
                            <Paper sx={{ p: 2, bgcolor: 'info.lighter', mt: 1 }}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <OTPIcon color="info" />
                                <Typography variant="body2" fontWeight={600}>
                                  Handover OTP: <span style={{ fontSize: '1.2rem', letterSpacing: 2 }}>{application.otpCode}</span>
                                </Typography>
                                <IconButton size="small" onClick={() => copyOTP(application.otpCode)}>
                                  <CopyIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                Handover: {new Date(application.scheduledHandoverDate).toLocaleDateString()} at {application.scheduledHandoverTime}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Location: {application.handoverLocation}
                              </Typography>
                            </Paper>
                          )}
                        </Stack>
                      </Grid>

                      {/* Actions */}
                      <Grid item xs={12} sm={3} md={3}>
                        <Stack spacing={1}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewDetails(application._id)}
                            fullWidth
                          >
                            View Details
                          </Button>

                          {(application.status === 'approved' || application.status === 'payment_pending') && (
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={<PaymentIcon />}
                              onClick={() => handlePayment(application)}
                              disabled={processingPayment}
                              fullWidth
                            >
                              Pay Now
                            </Button>
                          )}

                          {(application.status === 'pending' || application.status === 'under_review') && (
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<CancelIcon />}
                              onClick={() => handleCancelApplication(application._id)}
                              fullWidth
                            >
                              Cancel
                            </Button>
                          )}
                        </Stack>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Application Details Dialog - Professional Industry Level */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        {selectedApplication && (
          <>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Application #{selectedApplication._id?.slice(-8)}</Typography>
                  <Typography variant="caption">Applied on {new Date(selectedApplication.createdAt).toLocaleString()}</Typography>
                </Box>
                <IconButton onClick={() => setDetailsOpen(false)} sx={{ color: 'white' }}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ mt: 3 }}>
              <Grid container spacing={3}>
                {/* Application Status */}
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderLeft: 4, borderColor: getStatusColor(selectedApplication.status) + '.main' }}>
                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                      <Chip 
                        label={getStatusLabel(selectedApplication.status)} 
                        color={getStatusColor(selectedApplication.status)} 
                        size="large" 
                        sx={{ fontWeight: 700 }} 
                      />
                      <Divider orientation="vertical" flexItem />
                      <Typography variant="body2" color="text.secondary">
                        Last Updated: {new Date(selectedApplication.updatedAt || selectedApplication.createdAt).toLocaleString()}
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Pet Information */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                      🐾 Pet Details
                    </Typography>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={resolveMediaUrl(selectedApplication.petInventoryItemId?.images?.[0]?.url)}
                          variant="rounded"
                          sx={{ width: 100, height: 100 }}
                        >
                          <PetsIcon sx={{ fontSize: 48 }} />
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="h6" fontWeight={600}>{selectedApplication.petInventoryItemId?.name || 'N/A'}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedApplication.petInventoryItemId?.speciesId?.displayName || 'Pet'}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider />
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Breed</Typography>
                          <Typography variant="body2" fontWeight={600}>{selectedApplication.petInventoryItemId?.breedId?.name || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Gender</Typography>
                          <Typography variant="body2" fontWeight={600}>{selectedApplication.selectedGender}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">Total Amount</Typography>
                          <Typography variant="h5" fontWeight={700} color="success.main">₹{selectedApplication.paymentAmount?.toLocaleString() || '0'}</Typography>
                        </Grid>
                      </Grid>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Your Details */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                      👤 Your Information
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Full Name</Typography>
                        <Typography variant="body1" fontWeight={600}>{selectedApplication.personalDetails?.fullName}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">Email Address</Typography>
                          <Typography variant="body2">{selectedApplication.personalDetails?.email}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">Phone Number</Typography>
                          <Typography variant="body2">{selectedApplication.personalDetails?.phone}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <AddressIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">Delivery Address</Typography>
                          <Typography variant="body2">
                            {selectedApplication.personalDetails?.address?.street}<br />
                            {selectedApplication.personalDetails?.address?.city}, {selectedApplication.personalDetails?.address?.state}<br />
                            {selectedApplication.personalDetails?.address?.pincode}
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Your Uploaded Documents */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                      📸 Your Photo
                    </Typography>
                    {selectedApplication.userPhoto?.url ? (
                      <Box sx={{ textAlign: 'center' }}>
                        <img 
                          src={resolveMediaUrl(selectedApplication.userPhoto.url)} 
                          alt="Your Photo" 
                          style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, objectFit: 'contain', border: '2px solid #e0e0e0' }}
                        />
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                          {selectedApplication.userPhoto.name || 'Customer Photo'}
                        </Typography>
                      </Box>
                    ) : (
                      <Alert severity="info">No photo uploaded</Alert>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                      📄 Your Documents ({selectedApplication.documents?.length || 0})
                    </Typography>
                    {selectedApplication.documents && selectedApplication.documents.length > 0 ? (
                      <Stack spacing={1}>
                        {selectedApplication.documents.map((doc, idx) => (
                          <Paper key={idx} elevation={0} sx={{ p: 2, bgcolor: 'grey.50', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <DocumentIcon color="primary" />
                            <Box flex={1}>
                              <Typography variant="body2" fontWeight={600}>{doc.name || `Document ${idx + 1}`}</Typography>
                              <Typography variant="caption" color="text.secondary">{doc.type || 'ID Proof'}</Typography>
                            </Box>
                            <Button size="small" variant="outlined" href={resolveMediaUrl(doc.url)} target="_blank" rel="noopener">View</Button>
                          </Paper>
                        ))}
                      </Stack>
                    ) : (
                      <Alert severity="info">No documents uploaded</Alert>
                    )}
                  </Paper>
                </Grid>

                {/* Payment Information */}
                {(selectedApplication.status === 'paid' || selectedApplication.status === 'scheduled' || selectedApplication.status === 'completed') && (
                  <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 3, bgcolor: 'success.lighter' }}>
                      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: 'success.dark', mb: 2 }}>
                        ✅ Payment Confirmed
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">Payment Status</Typography>
                          <Chip label={selectedApplication.paymentStatus || 'Completed'} color="success" size="small" />
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">Transaction ID</Typography>
                          <Typography variant="body2" fontWeight={600}>{selectedApplication.paymentId?.slice(0, 20) || 'N/A'}...</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">Amount Paid</Typography>
                          <Typography variant="h6" fontWeight={700} color="success.dark">₹{selectedApplication.paymentAmount?.toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">Payment Date</Typography>
                          <Typography variant="body2" fontWeight={600}>{selectedApplication.paymentDate ? new Date(selectedApplication.paymentDate).toLocaleDateString() : 'N/A'}</Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}

                {/* Handover Information */}
                {(selectedApplication.status === 'scheduled' || selectedApplication.status === 'completed') && (
                  <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 3, bgcolor: 'warning.lighter', borderLeft: 4, borderColor: 'warning.main' }}>
                      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: 'warning.dark', mb: 2 }}>
                        📍 Handover Schedule
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                          <Typography variant="caption" color="text.secondary">Scheduled Date</Typography>
                          <Typography variant="h6" fontWeight={600}>{selectedApplication.scheduledHandoverDate ? new Date(selectedApplication.scheduledHandoverDate).toLocaleDateString() : 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="caption" color="text.secondary">Scheduled Time</Typography>
                          <Typography variant="h6" fontWeight={600}>{selectedApplication.scheduledHandoverTime || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="caption" color="text.secondary">Location</Typography>
                          <Typography variant="body1" fontWeight={600}>{selectedApplication.handoverLocation || 'Pet Shop'}</Typography>
                        </Grid>
                        {selectedApplication.status === 'scheduled' && selectedApplication.otpCode && (
                          <Grid item xs={12}>
                            <Alert severity="warning" icon={<OTPIcon />} sx={{ fontWeight: 600 }}>
                              <Typography variant="subtitle2" gutterBottom>🔐 Your Handover OTP</Typography>
                              <Typography variant="h3" fontWeight={700} letterSpacing={6} sx={{ my: 2, textAlign: 'center' }}>{selectedApplication.otpCode}</Typography>
                              <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                                <Button 
                                  variant="contained" 
                                  size="small" 
                                  startIcon={<CopyIcon />}
                                  onClick={() => copyOTP(selectedApplication.otpCode)}
                                >
                                  Copy OTP
                                </Button>
                              </Stack>
                              <Typography variant="caption" display="block" sx={{ mt: 2, textAlign: 'center' }}>
                                ⚠️ Show this OTP to the manager at the time of handover. Expires: {selectedApplication.otpExpiresAt ? new Date(selectedApplication.otpExpiresAt).toLocaleString() : 'N/A'}
                              </Typography>
                            </Alert>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </Grid>
                )}

                {/* Rejection Reason */}
                {selectedApplication.status === 'rejected' && selectedApplication.rejectionReason && (
                  <Grid item xs={12}>
                    <Alert severity="error" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        ❌ Application Rejected - Rejection Reason
                      </Typography>
                      <Typography variant="body2">
                        {selectedApplication.rejectionReason}
                      </Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
              {(selectedApplication.status === 'pending' || selectedApplication.status === 'under_review') && (
                <Button
                  color="error"
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => handleCancelApplication(selectedApplication._id)}
                >
                  Cancel Application
                </Button>
              )}
              {(selectedApplication.status === 'approved' || selectedApplication.status === 'payment_pending') && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PaymentIcon />}
                  onClick={() => handlePayment(selectedApplication)}
                  disabled={processingPayment}
                >
                  {processingPayment ? 'Processing...' : 'Pay Now'}
                </Button>
              )}
              <Button onClick={() => setDetailsOpen(false)} variant="outlined">Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default MyApplications;
