import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  MoreVert,
  Search,
  FilterList,
  Person,
  Pets,
  Assignment
} from '@mui/icons-material';
import { customBreedRequestsAPI, speciesAPI } from '../../services/petSystemAPI';

const CustomBreedRequests = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [species, setSpecies] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Dialog states
  const [approveDialog, setApproveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [requestsRes, speciesRes] = await Promise.all([
        customBreedRequestsAPI.getAll(),
        speciesAPI.getAll()
      ]);

      setRequests(requestsRes.data?.data || requestsRes.data || []);
      setSpecies(speciesRes.data?.data || speciesRes.data || []);
    } catch (err) {
      setError('Failed to load requests data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadInitialData();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, typeFilter]);

  const handleMenuOpen = (event, request) => {
    setAnchorEl(event.currentTarget);
    setSelectedRequest(request);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRequest(null);
  };

  const handleApproveClick = () => {
    setApproveDialog(true);
    setAdminNotes('');
    handleMenuClose();
  };

  const handleRejectClick = () => {
    setRejectDialog(true);
    setAdminNotes('');
    handleMenuClose();
  };

  const handleApproveConfirm = async () => {
    try {
      await customBreedRequestsAPI.approve(selectedRequest._id, {
        adminNotes: adminNotes
      });
      loadInitialData();
      setApproveDialog(false);
      setSelectedRequest(null);
      setSuccess('Request approved successfully!');
    } catch (err) {
      setError('Failed to approve request');
    }
  };

  const handleRejectConfirm = async () => {
    try {
      await customBreedRequestsAPI.reject(selectedRequest._id, {
        adminNotes: adminNotes
      });
      loadInitialData();
      setRejectDialog(false);
      setSelectedRequest(null);
      setSuccess('Request rejected successfully!');
    } catch (err) {
      setError('Failed to reject request');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error'
    };
    return colors[status] || 'default';
  };

  const getTypeIcon = (type) => {
    return type === 'species' ? <Pets /> : <Assignment />;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const filteredRequests = requests.filter(request => {
    if (searchTerm && !request.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !request.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (statusFilter && request.status !== statusFilter) {
      return false;
    }
    if (typeFilter && request.type !== typeFilter) {
      return false;
    }
    return true;
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Custom Breed/Species Requests
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ minWidth: 300 }}
            />
            
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="species">Species</MenuItem>
                <MenuItem value="breed">Breed</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setTypeFilter('');
              }}
            >
              Clear Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Requests ({filteredRequests.length})
            </Typography>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Species</TableCell>
                      <TableCell>Requester</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Requested</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request._id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            {getTypeIcon(request.type)}
                            <Chip
                              label={request.type}
                              size="small"
                              color="primary"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" fontWeight="bold">
                            {request.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {request.speciesId?.displayName || request.speciesId?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Person sx={{ mr: 1, color: 'text.secondary' }} />
                            {request.requesterId?.name || 'N/A'}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {request.description || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={request.status}
                            color={getStatusColor(request.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {formatDate(request.createdAt)}
                        </TableCell>
                        <TableCell align="center">
                          {request.status === 'pending' && (
                            <IconButton
                              onClick={(e) => handleMenuOpen(e, request)}
                              size="small"
                            >
                              <MoreVert />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {filteredRequests.length === 0 && (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="textSecondary">
                    No requests found
                  </Typography>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleApproveClick} sx={{ color: 'success.main' }}>
          <ListItemIcon>
            <CheckCircle fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Approve Request</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleRejectClick} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Cancel fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Reject Request</ListItemText>
        </MenuItem>
      </Menu>

      {/* Approve Dialog */}
      <Dialog open={approveDialog} onClose={() => setApproveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Request</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to approve the request for "{selectedRequest?.name}"?
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            Request Details:
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Type:</strong> {selectedRequest?.type}
            </Typography>
            <Typography variant="body2">
              <strong>Name:</strong> {selectedRequest?.name}
            </Typography>
            <Typography variant="body2">
              <strong>Description:</strong> {selectedRequest?.description}
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="Admin Notes (Optional)"
            multiline
            rows={3}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Add any notes about the approval..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog(false)}>Cancel</Button>
          <Button onClick={handleApproveConfirm} color="success" variant="contained">
            Approve Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Request</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to reject the request for "{selectedRequest?.name}"?
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            Request Details:
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Type:</strong> {selectedRequest?.type}
            </Typography>
            <Typography variant="body2">
              <strong>Name:</strong> {selectedRequest?.name}
            </Typography>
            <Typography variant="body2">
              <strong>Description:</strong> {selectedRequest?.description}
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="Rejection Reason (Required)"
            multiline
            rows={3}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Please provide a reason for rejection..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleRejectConfirm} 
            color="error" 
            variant="contained"
            disabled={!adminNotes.trim()}
          >
            Reject Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomBreedRequests;