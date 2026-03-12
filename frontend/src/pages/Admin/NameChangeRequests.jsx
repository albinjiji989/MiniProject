import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Grid,
  Avatar,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Badge,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Badge as BadgeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  Pets as PetsIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Male as MaleIcon,
  Female as FemaleIcon
} from '@mui/icons-material';
import { apiClient, resolveMediaUrl } from '../../services/api';

const NameChangeRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [tabValue, setTabValue] = useState(0); // 0=pending, 1=approved, 2=rejected, 3=all

  // Action dialog
  const [actionDialog, setActionDialog] = useState({ open: false, request: null, action: null });
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    loadRequests();
  }, [tabValue]);

  const getStatusFilter = () => {
    switch (tabValue) {
      case 0: return 'pending';
      case 1: return 'approved';
      case 2: return 'rejected';
      default: return '';
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const status = getStatusFilter();
      const url = `/pet-name-change/admin/all${status ? `?status=${status}` : ''}`;
      const response = await apiClient.get(url);
      
      if (response.data.success) {
        setRequests(response.data.data.requests || []);
        setPendingCount(response.data.data.pendingCount || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const openActionDialog = (request, action) => {
    setActionDialog({ open: true, request, action });
    setAdminNotes('');
    setActionError('');
  };

  const closeActionDialog = () => {
    setActionDialog({ open: false, request: null, action: null });
    setAdminNotes('');
    setActionError('');
  };

  const handleAction = async () => {
    const { request, action } = actionDialog;
    if (!request || !action) return;

    setActionLoading(true);
    setActionError('');

    try {
      const endpoint = action === 'approve' 
        ? `/pet-name-change/admin/approve/${request._id}`
        : `/pet-name-change/admin/reject/${request._id}`;

      const response = await apiClient.put(endpoint, { adminNotes });

      if (response.data.success) {
        closeActionDialog();
        loadRequests(); // Refresh list
      } else {
        setActionError(response.data.message || `Failed to ${action} request`);
      }
    } catch (err) {
      setActionError(err.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip icon={<PendingIcon />} label="Pending" color="warning" size="small" sx={{ fontWeight: 600 }} />;
      case 'approved':
        return <Chip icon={<CheckCircleIcon />} label="Approved" color="success" size="small" sx={{ fontWeight: 600 }} />;
      case 'rejected':
        return <Chip icon={<CancelIcon />} label="Rejected" color="error" size="small" sx={{ fontWeight: 600 }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const getGenderIcon = (gender) => {
    if (gender?.toLowerCase() === 'male') return <MaleIcon sx={{ fontSize: 16, color: '#3b82f6' }} />;
    if (gender?.toLowerCase() === 'female') return <FemaleIcon sx={{ fontSize: 16, color: '#ec4899' }} />;
    return null;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <BadgeIcon color="primary" sx={{ fontSize: 36 }} />
            Pet Name Change Requests
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Review and manage pet name change requests from users
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={loadRequests} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="fullWidth">
          <Tab 
            label={
              <Badge badgeContent={pendingCount} color="warning" max={99}>
                <Box sx={{ px: 1 }}>Pending</Box>
              </Badge>
            } 
          />
          <Tab label="Approved" />
          <Tab label="Rejected" />
          <Tab label="All" />
        </Tabs>
      </Paper>

      {/* Requests List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={48} />
        </Box>
      ) : requests.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: '#f9fafb' }}>
          <InfoIcon sx={{ fontSize: 64, color: '#9ca3af', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No {getStatusFilter() || ''} requests found
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {requests.map((request) => (
            <Grid item xs={12} md={6} key={request._id}>
              <Card sx={{ 
                boxShadow: 3, 
                border: request.status === 'pending' ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)' }
              }}>
                <CardContent sx={{ p: 3 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar 
                        src={request.petSnapshot?.images?.[0] ? resolveMediaUrl(request.petSnapshot.images[0]) : undefined}
                        sx={{ width: 56, height: 56, bgcolor: '#e0e7ff' }}
                      >
                        <PetsIcon sx={{ color: '#4338ca' }} />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                          {request.petCode}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getGenderIcon(request.petSnapshot?.gender)}
                          <Typography variant="body2" color="text.secondary">
                            {request.petSnapshot?.species} • {request.petSnapshot?.breed}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    {getStatusChip(request.status)}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Name Change Details */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Name Change</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={request.currentName || '(unnamed)'} 
                        size="small" 
                        sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 600 }}
                      />
                      <Typography sx={{ fontWeight: 700 }}>→</Typography>
                      <Chip 
                        label={request.requestedName} 
                        size="small" 
                        sx={{ bgcolor: '#d1fae5', color: '#065f46', fontWeight: 600 }}
                      />
                    </Box>
                  </Box>

                  {/* Description */}
                  {request.description && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Reason</Typography>
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#4b5563' }}>
                        "{request.description}"
                      </Typography>
                    </Box>
                  )}

                  {/* Requester Info */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Requested By</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ fontSize: 18, color: '#6b7280' }} />
                      <Typography variant="body2">
                        {request.requestedBy?.name || 'Unknown'} 
                        {request.requestedBy?.email && ` (${request.requestedBy.email})`}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Submitted: {new Date(request.createdAt).toLocaleString()}
                    </Typography>
                  </Box>

                  {/* Admin Notes (if reviewed) */}
                  {request.adminNotes && request.status !== 'pending' && (
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f3f4f6', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.3 }}>Admin Notes</Typography>
                      <Typography variant="body2">{request.adminNotes}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Reviewed by {request.reviewedBy?.name || 'Admin'} on {new Date(request.reviewedAt).toLocaleString()}
                      </Typography>
                    </Box>
                  )}

                  {/* Action Buttons */}
                  {request.status === 'pending' && (
                    <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => openActionDialog(request, 'approve')}
                        sx={{ flex: 1, fontWeight: 600 }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => openActionDialog(request, 'reject')}
                        sx={{ flex: 1, fontWeight: 600 }}
                      >
                        Reject
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onClose={closeActionDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {actionDialog.action === 'approve' ? '✅ Approve Name Change' : '❌ Reject Name Change'}
        </DialogTitle>
        <DialogContent>
          {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
          
          {actionDialog.request && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Pet Code:</strong> {actionDialog.request.petCode}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Current Name:</strong> {actionDialog.request.currentName || '(unnamed)'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Requested Name:</strong> {actionDialog.request.requestedName}
              </Typography>
              <Typography variant="body1">
                <strong>Requester:</strong> {actionDialog.request.requestedBy?.name}
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            label="Admin Notes (Optional)"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder={
              actionDialog.action === 'approve' 
                ? "Add a note for the user (optional)"
                : "Provide a reason for rejection (recommended)"
            }
            multiline
            rows={3}
            inputProps={{ maxLength: 500 }}
            helperText={`${adminNotes.length}/500 characters`}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeActionDialog} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={actionDialog.action === 'approve' ? 'success' : 'error'}
            onClick={handleAction}
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {actionLoading ? 'Processing...' : actionDialog.action === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default NameChangeRequests;
