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
  ContentCopy as CopyIcon
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
      setSelectedApplication(response.data.data.application);
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

      {/* Application Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedApplication && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Application Details</Typography>
                <IconButton onClick={() => setDetailsOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3}>
                {/* Status */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Status
                  </Typography>
                  <Chip
                    label={getStatusLabel(selectedApplication.status)}
                    color={getStatusColor(selectedApplication.status)}
                  />
                </Box>

                <Divider />

                {/* Pet Details */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Pet Details
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>{selectedApplication.petInventoryItemId?.name}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Breed</TableCell>
                          <TableCell>{selectedApplication.petInventoryItemId?.breed}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Gender</TableCell>
                          <TableCell>{selectedApplication.selectedGender}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Price</TableCell>
                          <TableCell>₹{selectedApplication.paymentAmount?.toLocaleString()}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                <Divider />

                {/* Personal Details */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Your Details
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>{selectedApplication.personalDetails?.fullName}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Email</TableCell>
                          <TableCell>{selectedApplication.personalDetails?.email}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Phone</TableCell>
                          <TableCell>{selectedApplication.personalDetails?.phone}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Address</TableCell>
                          <TableCell>
                            {selectedApplication.personalDetails?.address?.street}, {selectedApplication.personalDetails?.address?.city}, {selectedApplication.personalDetails?.address?.state} - {selectedApplication.personalDetails?.address?.pincode}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* OTP Info if scheduled */}
                {selectedApplication.status === 'scheduled' && selectedApplication.otpCode && (
                  <>
                    <Divider />
                    <Alert severity="info" icon={<ScheduleIcon />}>
                      <Typography variant="subtitle2" gutterBottom>
                        Handover Scheduled
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Date:</strong> {new Date(selectedApplication.scheduledHandoverDate).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Time:</strong> {selectedApplication.scheduledHandoverTime}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Location:</strong> {selectedApplication.handoverLocation}
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: 'background.default', mt: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <OTPIcon color="primary" />
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Your Handover OTP
                            </Typography>
                            <Typography variant="h5" fontWeight={700} letterSpacing={3}>
                              {selectedApplication.otpCode}
                            </Typography>
                          </Box>
                          <IconButton onClick={() => copyOTP(selectedApplication.otpCode)}>
                            <CopyIcon />
                          </IconButton>
                        </Stack>
                      </Paper>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Show this OTP to the manager at the time of handover
                      </Typography>
                    </Alert>
                  </>
                )}

                {/* Rejection Reason */}
                {selectedApplication.status === 'rejected' && selectedApplication.rejectionReason && (
                  <>
                    <Divider />
                    <Alert severity="error">
                      <Typography variant="subtitle2" gutterBottom>
                        Rejection Reason
                      </Typography>
                      <Typography variant="body2">
                        {selectedApplication.rejectionReason}
                      </Typography>
                    </Alert>
                  </>
                )}

                {/* Uploaded Documents */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Uploaded Documents
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    {selectedApplication.userPhoto && (
                      <Box>
                        <Typography variant="caption" display="block">Your Photo</Typography>
                        <Avatar
                          src={resolveMediaUrl(selectedApplication.userPhoto.url)}
                          sx={{ width: 80, height: 80, mt: 1 }}
                        />
                      </Box>
                    )}
                    <Box>
                      <Typography variant="caption" display="block">Documents ({selectedApplication.documents?.length || 0})</Typography>
                      {selectedApplication.documents?.map((doc, idx) => (
                        <Chip
                          key={idx}
                          label={`Document ${idx + 1}`}
                          size="small"
                          sx={{ mt: 1, mr: 0.5 }}
                          onClick={() => window.open(resolveMediaUrl(doc.url), '_blank')}
                        />
                      ))}
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              {(selectedApplication.status === 'pending' || selectedApplication.status === 'under_review') && (
                <Button
                  color="error"
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
                  Pay Now
                </Button>
              )}
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default MyApplications;
