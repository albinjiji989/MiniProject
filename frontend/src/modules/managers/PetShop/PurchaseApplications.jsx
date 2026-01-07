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
  TextField,
  Tabs,
  Tab,
  Badge,
  Avatar,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  IconButton,
  Divider
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Schedule as ScheduleIcon,
  LockOpen as VerifyIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as AddressIcon,
  Image as ImageIcon,
  Description as DocumentIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { apiClient, resolveMediaUrl } from '../../../services/api';
import { handleApiError } from '../../../utils/notifications';

const PurchaseApplications = () => {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionDialog, setActionDialog] = useState({ open: false, type: null, app: null });
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionData, setActionData] = useState({});
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadApplications();
  }, [filterStatus]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await apiClient.get('/petshop/manager/purchase-applications', { params });
      setApplications(response.data.data.applications || []);
    } catch (err) {
      handleApiError(err, 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (app) => {
    setSelectedApp(app);
    setDetailsOpen(true);
  };

  const handleOpenAction = (type, app) => {
    setActionDialog({ open: true, type, app });
    setActionData({});
  };

  const handleCloseAction = () => {
    setActionDialog({ open: false, type: null, app: null });
    setActionData({});
  };

  const handleApprove = async () => {
    try {
      setProcessing(true);
      await apiClient.post(`/petshop/manager/purchase-applications/${actionDialog.app._id}/approve`, {
        approvalNotes: actionData.notes || ''
      });
      alert('Application approved successfully!');
      loadApplications();
      handleCloseAction();
    } catch (err) {
      handleApiError(err, 'Failed to approve application');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!actionData.reason) {
      alert('Please provide rejection reason');
      return;
    }
    try {
      setProcessing(true);
      await apiClient.post(`/petshop/manager/purchase-applications/${actionDialog.app._id}/reject`, {
        rejectionReason: actionData.reason
      });
      alert('Application rejected');
      loadApplications();
      handleCloseAction();
    } catch (err) {
      handleApiError(err, 'Failed to reject application');
    } finally {
      setProcessing(false);
    }
  };

  const handleScheduleHandover = async () => {
    if (!actionData.date || !actionData.time || !actionData.location) {
      alert('Please fill all handover details');
      return;
    }
    try {
      setProcessing(true);
      const response = await apiClient.post(`/petshop/manager/purchase-applications/${actionDialog.app._id}/schedule-handover`, {
        scheduledDate: actionData.date,
        scheduledTime: actionData.time,
        handoverLocation: actionData.location
      });
      alert(response.data.message || 'Handover scheduled and OTP sent to customer\'s email!');
      loadApplications();
      handleCloseAction();
    } catch (err) {
      handleApiError(err, 'Failed to schedule handover');
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!actionData.otp) {
      alert('Please enter OTP');
      return;
    }
    try {
      setProcessing(true);
      await apiClient.post(`/petshop/manager/purchase-applications/${actionDialog.app._id}/verify-otp`, {
        otp: actionData.otp
      });
      alert('OTP verified! Pet has been added to user dashboard.');
      loadApplications();
      handleCloseAction();
    } catch (err) {
      handleApiError(err, 'Failed to verify OTP');
    } finally {
      setProcessing(false);
    }
  };

  const handleResendOTP = async (appId) => {
    try {
      setProcessing(true);
      const response = await apiClient.post(`/petshop/manager/purchase-applications/${appId}/regenerate-otp`);
      alert(response.data.message || 'New OTP has been generated and sent to customer\'s email!');
      loadApplications();
    } catch (err) {
      handleApiError(err, 'Failed to resend OTP');
    } finally {
      setProcessing(false);
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
      approved: 'Approved',
      rejected: 'Rejected',
      payment_pending: 'Payment Pending',
      paid: 'Paid',
      scheduled: 'Handover Scheduled',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  };

  const statusCounts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending' || a.status === 'under_review').length,
    approved: applications.filter(a => a.status === 'approved').length,
    paid: applications.filter(a => a.status === 'paid').length,
    scheduled: applications.filter(a => a.status === 'scheduled').length,
    completed: applications.filter(a => a.status === 'completed').length
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Purchase Applications
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage pet purchase applications from customers
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
          <Tab label={`Scheduled (${statusCounts.scheduled})`} value="scheduled" />
          <Tab label={`Completed (${statusCounts.completed})`} value="completed" />
        </Tabs>
      </Paper>

      {/* Applications List */}
      {applications.length === 0 ? (
        <Alert severity="info">No applications found</Alert>
      ) : (
        <Grid container spacing={3}>
          {applications.map((app) => (
            <Grid item xs={12} key={app._id}>
              <Card>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={2}>
                      <Avatar
                        src={resolveMediaUrl(app.petInventoryItemId?.images?.[0]?.url || app.userPhoto?.url)}
                        variant="rounded"
                        sx={{ width: 100, height: 100 }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Stack spacing={1}>
                        <Typography variant="h6">
                          {app.petInventoryItemId?.name || 'Pet'} - {app.selectedGender}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Customer: {app.personalDetails?.fullName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Applied: {new Date(app.createdAt).toLocaleString()}
                        </Typography>
                        <Chip
                          label={getStatusLabel(app.status)}
                          color={getStatusColor(app.status)}
                          size="small"
                          sx={{ width: 'fit-content' }}
                        />
                      </Stack>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Stack spacing={1}>
                        <Button
                          size="small"
                          startIcon={<ViewIcon />}
                          onClick={() => handleViewDetails(app)}
                          fullWidth
                        >
                          View Details
                        </Button>

                        {(app.status === 'pending' || app.status === 'under_review') && (
                          <>
                            <Button
                              size="small"
                              color="success"
                              startIcon={<ApproveIcon />}
                              onClick={() => handleOpenAction('approve', app)}
                              fullWidth
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<RejectIcon />}
                              onClick={() => handleOpenAction('reject', app)}
                              fullWidth
                            >
                              Reject
                            </Button>
                          </>
                        )}

                        {app.status === 'paid' && (
                          <Button
                            size="small"
                            color="primary"
                            startIcon={<ScheduleIcon />}
                            onClick={() => handleOpenAction('schedule', app)}
                            fullWidth
                          >
                            Schedule Handover
                          </Button>
                        )}

                        {app.status === 'scheduled' && (
                          <>
                            <Button
                              size="small"
                              color="success"
                              startIcon={<VerifyIcon />}
                              onClick={() => handleOpenAction('verify', app)}
                              fullWidth
                            >
                              Verify OTP & Complete
                            </Button>
                            <Button
                              size="small"
                              color="warning"
                              startIcon={<SendIcon />}
                              onClick={() => handleResendOTP(app._id)}
                              disabled={processing}
                              fullWidth
                            >
                              Resend OTP
                            </Button>
                          </>
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

      {/* Details Dialog - Professional Industry Level */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="lg" fullWidth>
        {selectedApp && (
          <>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Purchase Application #{selectedApp._id?.slice(-8)}</Typography>
                  <Typography variant="caption">Submitted on {new Date(selectedApp.createdAt).toLocaleString()}</Typography>
                </Box>
                <IconButton onClick={() => setDetailsOpen(false)} sx={{ color: 'white' }}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ mt: 3 }}>
              <Grid container spacing={3}>
                {/* Status & Timeline */}
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderLeft: 4, borderColor: getStatusColor(selectedApp.status) + '.main' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Chip label={getStatusLabel(selectedApp.status)} color={getStatusColor(selectedApp.status)} size="large" sx={{ fontWeight: 700 }} />
                      <Divider orientation="vertical" flexItem />
                      <Typography variant="body2" color="text.secondary">
                        Last Updated: {new Date(selectedApp.updatedAt || selectedApp.createdAt).toLocaleString()}
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Pet Information */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                      🐾 Pet Information
                    </Typography>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={resolveMediaUrl(selectedApp.petInventoryItemId?.images?.[0]?.url)}
                          variant="rounded"
                          sx={{ width: 100, height: 100 }}
                        >
                          <ImageIcon sx={{ fontSize: 48 }} />
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="h6" fontWeight={600}>{selectedApp.petInventoryItemId?.name || 'N/A'}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedApp.petInventoryItemId?.speciesId?.displayName || selectedApp.petInventoryItemId?.speciesId?.name || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider />
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Breed</Typography>
                          <Typography variant="body2" fontWeight={600}>{selectedApp.petInventoryItemId?.breedId?.name || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Gender</Typography>
                          <Typography variant="body2" fontWeight={600}>{selectedApp.selectedGender}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Age</Typography>
                          <Typography variant="body2" fontWeight={600}>{selectedApp.petInventoryItemId?.age || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Pet Code</Typography>
                          <Typography variant="body2" fontWeight={600}>{selectedApp.petInventoryItemId?.petCode || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">Price</Typography>
                          <Typography variant="h5" fontWeight={700} color="success.main">₹{selectedApp.paymentAmount?.toLocaleString() || '0'}</Typography>
                        </Grid>
                      </Grid>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Customer Information */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                      👤 Customer Information
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Full Name</Typography>
                        <Typography variant="body1" fontWeight={600}>{selectedApp.personalDetails?.fullName || selectedApp.userId?.name}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">Email</Typography>
                          <Typography variant="body2">{selectedApp.personalDetails?.email || selectedApp.userId?.email}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">Phone</Typography>
                          <Typography variant="body2">{selectedApp.personalDetails?.phone || selectedApp.userId?.phone}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <AddressIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">Address</Typography>
                          <Typography variant="body2">
                            {selectedApp.personalDetails?.address?.street}<br />
                            {selectedApp.personalDetails?.address?.city}, {selectedApp.personalDetails?.address?.state}<br />
                            {selectedApp.personalDetails?.address?.pincode}, {selectedApp.personalDetails?.address?.country || 'India'}
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Uploaded Documents */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                      📸 Customer Photo
                    </Typography>
                    {selectedApp.userPhoto?.url ? (
                      <Box sx={{ textAlign: 'center' }}>
                        <img 
                          src={resolveMediaUrl(selectedApp.userPhoto.url)} 
                          alt="Customer" 
                          style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, objectFit: 'contain' }}
                        />
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                          {selectedApp.userPhoto.name || 'Customer Photo'}
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
                      📄 Documents ({selectedApp.documents?.length || 0})
                    </Typography>
                    {selectedApp.documents && selectedApp.documents.length > 0 ? (
                      <Stack spacing={1}>
                        {selectedApp.documents.map((doc, idx) => (
                          <Paper key={idx} elevation={0} sx={{ p: 2, bgcolor: 'grey.50', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <DocumentIcon color="primary" />
                            <Box flex={1}>
                              <Typography variant="body2" fontWeight={600}>{doc.name || `Document ${idx + 1}`}</Typography>
                              <Typography variant="caption" color="text.secondary">{doc.type || 'Unknown type'}</Typography>
                            </Box>
                            <Button size="small" href={resolveMediaUrl(doc.url)} target="_blank" rel="noopener">View</Button>
                          </Paper>
                        ))}
                      </Stack>
                    ) : (
                      <Alert severity="info">No documents uploaded</Alert>
                    )}
                  </Paper>
                </Grid>

                {/* Payment Information */}
                {(selectedApp.status === 'paid' || selectedApp.status === 'scheduled' || selectedApp.status === 'completed') && (
                  <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 3, bgcolor: 'success.lighter' }}>
                      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: 'success.dark', mb: 2 }}>
                        💳 Payment Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">Payment Status</Typography>
                          <Typography variant="body2" fontWeight={600}>{selectedApp.paymentStatus || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">Payment ID</Typography>
                          <Typography variant="body2" fontWeight={600}>{selectedApp.paymentId || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">Amount Paid</Typography>
                          <Typography variant="body2" fontWeight={600} color="success.dark">₹{selectedApp.paymentAmount?.toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">Payment Date</Typography>
                          <Typography variant="body2" fontWeight={600}>{selectedApp.paymentDate ? new Date(selectedApp.paymentDate).toLocaleDateString() : 'N/A'}</Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}

                {/* Handover Information */}
                {(selectedApp.status === 'scheduled' || selectedApp.status === 'completed') && (
                  <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 3, bgcolor: 'info.lighter', borderLeft: 4, borderColor: 'info.main' }}>
                      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: 'info.dark', mb: 2 }}>
                        🔐 Handover Details
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                          <Typography variant="caption" color="text.secondary">Scheduled Date</Typography>
                          <Typography variant="body1" fontWeight={600}>{selectedApp.scheduledHandoverDate ? new Date(selectedApp.scheduledHandoverDate).toLocaleDateString() : 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="caption" color="text.secondary">Scheduled Time</Typography>
                          <Typography variant="body1" fontWeight={600}>{selectedApp.scheduledHandoverTime || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="caption" color="text.secondary">Location</Typography>
                          <Typography variant="body1" fontWeight={600}>{selectedApp.handoverLocation || 'N/A'}</Typography>
                        </Grid>
                        {selectedApp.status === 'scheduled' && selectedApp.otpCode && (
                          <Grid item xs={12}>
                            <Alert severity="warning" sx={{ fontWeight: 600 }}>
                              <Typography variant="subtitle2" gutterBottom>🔢 Handover OTP (Required for Verification)</Typography>
                              <Typography variant="h4" fontWeight={700} letterSpacing={4} sx={{ my: 1 }}>{selectedApp.otpCode}</Typography>
                              <Typography variant="caption">Ask the customer to provide this OTP during handover. OTP expires: {selectedApp.otpExpiresAt ? new Date(selectedApp.otpExpiresAt).toLocaleString() : 'N/A'}</Typography>
                            </Alert>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
              <Button onClick={() => setDetailsOpen(false)} variant="outlined">Close</Button>
              {selectedApp.status === 'scheduled' && (
                <Button 
                  onClick={() => handleResendOTP(selectedApp._id)} 
                  variant="contained" 
                  color="warning"
                  startIcon={<SendIcon />}
                  disabled={processing}
                >
                  Resend OTP to Customer
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onClose={handleCloseAction} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionDialog.type === 'approve' && 'Approve Application'}
          {actionDialog.type === 'reject' && 'Reject Application'}
          {actionDialog.type === 'schedule' && 'Schedule Handover'}
          {actionDialog.type === 'verify' && 'Verify OTP'}
        </DialogTitle>
        <DialogContent>
          {actionDialog.type === 'approve' && (
            <TextField
              fullWidth
              label="Approval Notes (Optional)"
              multiline
              rows={3}
              value={actionData.notes || ''}
              onChange={(e) => setActionData({ ...actionData, notes: e.target.value })}
              sx={{ mt: 2 }}
            />
          )}

          {actionDialog.type === 'reject' && (
            <TextField
              fullWidth
              required
              label="Rejection Reason"
              multiline
              rows={3}
              value={actionData.reason || ''}
              onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
              sx={{ mt: 2 }}
            />
          )}

          {actionDialog.type === 'schedule' && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                required
                type="date"
                label="Handover Date"
                InputLabelProps={{ shrink: true }}
                value={actionData.date || ''}
                onChange={(e) => setActionData({ ...actionData, date: e.target.value })}
              />
              <TextField
                fullWidth
                required
                type="time"
                label="Handover Time"
                InputLabelProps={{ shrink: true }}
                value={actionData.time || ''}
                onChange={(e) => setActionData({ ...actionData, time: e.target.value })}
              />
              <TextField
                fullWidth
                required
                label="Handover Location"
                value={actionData.location || ''}
                onChange={(e) => setActionData({ ...actionData, location: e.target.value })}
              />
            </Stack>
          )}

          {actionDialog.type === 'verify' && (
            <TextField
              fullWidth
              required
              label="Enter OTP from Customer"
              value={actionData.otp || ''}
              onChange={(e) => setActionData({ ...actionData, otp: e.target.value })}
              sx={{ mt: 2 }}
              inputProps={{ maxLength: 6 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAction} disabled={processing}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (actionDialog.type === 'approve') handleApprove();
              if (actionDialog.type === 'reject') handleReject();
              if (actionDialog.type === 'schedule') handleScheduleHandover();
              if (actionDialog.type === 'verify') handleVerifyOTP();
            }}
            disabled={processing}
          >
            {processing ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PurchaseApplications;
