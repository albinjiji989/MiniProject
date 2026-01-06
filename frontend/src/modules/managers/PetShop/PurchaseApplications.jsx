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
  Description as DocumentIcon
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
      await apiClient.post(`/petshop/manager/purchase-applications/${actionDialog.app._id}/schedule-handover`, {
        scheduledHandoverDate: actionData.date,
        scheduledHandoverTime: actionData.time,
        handoverLocation: actionData.location
      });
      alert('Handover scheduled and OTP generated!');
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
        otpCode: actionData.otp
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
                          <Button
                            size="small"
                            color="success"
                            startIcon={<VerifyIcon />}
                            onClick={() => handleOpenAction('verify', app)}
                            fullWidth
                          >
                            Verify OTP & Complete
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

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        {selectedApp && (
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
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip label={getStatusLabel(selectedApp.status)} color={getStatusColor(selectedApp.status)} />
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Pet Details</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>{selectedApp.petInventoryItemId?.name}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Gender</TableCell>
                          <TableCell>{selectedApp.selectedGender}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Price</TableCell>
                          <TableCell>₹{selectedApp.paymentAmount?.toLocaleString()}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Customer Details</Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon fontSize="small" />
                      <Typography variant="body2">{selectedApp.personalDetails?.email}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon fontSize="small" />
                      <Typography variant="body2">{selectedApp.personalDetails?.phone}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AddressIcon fontSize="small" />
                      <Typography variant="body2">
                        {selectedApp.personalDetails?.address?.street}, {selectedApp.personalDetails?.address?.city}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {selectedApp.status === 'scheduled' && selectedApp.otpCode && (
                  <>
                    <Divider />
                    <Alert severity="info">
                      <Typography variant="subtitle2">Handover OTP: <strong>{selectedApp.otpCode}</strong></Typography>
                      <Typography variant="caption">Ask customer for this OTP during handover</Typography>
                    </Alert>
                  </>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
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
