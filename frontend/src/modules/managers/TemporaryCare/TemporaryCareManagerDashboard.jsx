import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../../../contexts/AuthContext';
import apiClient from '../../../services/api';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TemporaryCareManagerDashboard = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Caregivers state
  const [caregivers, setCaregivers] = useState([]);
  const [caregiverDialog, setCaregiverDialog] = useState(false);
  const [editingCaregiver, setEditingCaregiver] = useState(null);
  const [caregiverForm, setCaregiverForm] = useState({
    name: '',
    email: '',
    phone: '',
    skills: [],
    notes: '',
    status: 'available',
    address: {
      addressLine1: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [bookingDialog, setBookingDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingStatusUpdate, setBookingStatusUpdate] = useState('');

  useEffect(() => {
    if (tabValue === 0) {
      loadCaregivers();
    } else if (tabValue === 1) {
      loadBookings();
    }
  }, [tabValue]);

  const loadCaregivers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/temporary-care/manager/caregivers');
      setCaregivers(response.data.caregivers || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load caregivers');
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/temporary-care/manager/bookings');
      setBookings(response.data.bookings || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCaregiverDialog = (caregiver = null) => {
    if (caregiver) {
      setEditingCaregiver(caregiver);
      setCaregiverForm(caregiver);
    } else {
      setEditingCaregiver(null);
      setCaregiverForm({
        name: '',
        email: '',
        phone: '',
        skills: [],
        notes: '',
        status: 'available',
        address: {
          addressLine1: '',
          city: '',
          state: '',
          zipCode: ''
        }
      });
    }
    setCaregiverDialog(true);
  };

  const handleCloseCaregiverDialog = () => {
    setCaregiverDialog(false);
    setEditingCaregiver(null);
  };

  const handleSaveCaregiver = async () => {
    try {
      setLoading(true);
      if (editingCaregiver) {
        await apiClient.put(`/temporary-care/manager/caregivers/${editingCaregiver._id}`, caregiverForm);
        setSuccess('Caregiver updated successfully');
      } else {
        await apiClient.post('/temporary-care/manager/caregivers', caregiverForm);
        setSuccess('Caregiver created successfully');
      }
      handleCloseCaregiverDialog();
      loadCaregivers();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save caregiver');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCaregiver = async (id) => {
    if (!window.confirm('Are you sure you want to delete this caregiver?')) return;
    try {
      setLoading(true);
      await apiClient.delete(`/temporary-care/manager/caregivers/${id}`);
      setSuccess('Caregiver deleted successfully');
      loadCaregivers();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete caregiver');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookingStatus = async () => {
    if (!bookingStatusUpdate) return;
    try {
      setLoading(true);
      await apiClient.put(`/temporary-care/manager/bookings/${selectedBooking._id}`, {
        status: bookingStatusUpdate
      });
      setSuccess('Booking status updated successfully');
      setBookingDialog(false);
      setSelectedBooking(null);
      setBookingStatusUpdate('');
      loadBookings();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update booking status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'success',
      busy: 'warning',
      inactive: 'error',
      pending: 'default',
      active: 'success',
      completed: 'info',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
        <Tab label="Caregivers" id="tab-0" />
        <Tab label="Bookings" id="tab-1" />
      </Tabs>

      {/* Caregivers Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Manage Caregivers</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenCaregiverDialog()}
          >
            Add Caregiver
          </Button>
        </Box>

        {loading ? (
          <CircularProgress />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Skills</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {caregivers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      No caregivers found
                    </TableCell>
                  </TableRow>
                ) : (
                  caregivers.map((caregiver) => (
                    <TableRow key={caregiver._id}>
                      <TableCell>{caregiver.name}</TableCell>
                      <TableCell>{caregiver.email}</TableCell>
                      <TableCell>{caregiver.phone}</TableCell>
                      <TableCell>{caregiver.address?.city || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={caregiver.status}
                          color={getStatusColor(caregiver.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{caregiver.skills?.join(', ') || 'None'}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenCaregiverDialog(caregiver)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteCaregiver(caregiver._id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Bookings Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Care Bookings</Typography>
        </Box>

        {loading ? (
          <CircularProgress />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell>Pet Owner</TableCell>
                  <TableCell>Pet</TableCell>
                  <TableCell>Caregiver</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                      No bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell>{booking.owner?.name}</TableCell>
                      <TableCell>{booking.pet?.name || 'Unknown'}</TableCell>
                      <TableCell>{booking.caregiver?.name || 'Unknown'}</TableCell>
                      <TableCell>{new Date(booking.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(booking.endDate).toLocaleDateString()}</TableCell>
                      <TableCell>₹{booking.totalAmount?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={booking.status}
                          color={getStatusColor(booking.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setBookingStatusUpdate(booking.status);
                            setBookingDialog(true);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Caregiver Dialog */}
      <Dialog open={caregiverDialog} onClose={handleCloseCaregiverDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCaregiver ? 'Edit Caregiver' : 'Add New Caregiver'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Name"
              value={caregiverForm.name}
              onChange={(e) => setCaregiverForm({ ...caregiverForm, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={caregiverForm.email}
              onChange={(e) => setCaregiverForm({ ...caregiverForm, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="Phone"
              value={caregiverForm.phone}
              onChange={(e) => setCaregiverForm({ ...caregiverForm, phone: e.target.value })}
              fullWidth
            />
            <TextField
              label="City"
              value={caregiverForm.address?.city || ''}
              onChange={(e) => setCaregiverForm({
                ...caregiverForm,
                address: { ...caregiverForm.address, city: e.target.value }
              })}
              fullWidth
            />
            <TextField
              label="Skills (comma separated)"
              value={caregiverForm.skills?.join(', ') || ''}
              onChange={(e) => setCaregiverForm({
                ...caregiverForm,
                skills: e.target.value.split(',').map(s => s.trim()).filter(s => s)
              })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={caregiverForm.status}
                onChange={(e) => setCaregiverForm({ ...caregiverForm, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="busy">Busy</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Notes"
              value={caregiverForm.notes}
              onChange={(e) => setCaregiverForm({ ...caregiverForm, notes: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCaregiverDialog}>Cancel</Button>
          <Button onClick={handleSaveCaregiver} variant="contained">
            {editingCaregiver ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Booking Details Dialog */}
      <Dialog open={bookingDialog} onClose={() => setBookingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Booking Details</DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Typography><strong>Pet Owner:</strong> {selectedBooking.owner?.name}</Typography>
              <Typography><strong>Pet:</strong> {selectedBooking.pet?.name}</Typography>
              <Typography><strong>Caregiver:</strong> {selectedBooking.caregiver?.name}</Typography>
              <Typography><strong>Care Type:</strong> {selectedBooking.careType}</Typography>
              <Typography><strong>Start Date:</strong> {new Date(selectedBooking.startDate).toLocaleDateString()}</Typography>
              <Typography><strong>End Date:</strong> {new Date(selectedBooking.endDate).toLocaleDateString()}</Typography>
              <Typography><strong>Total Amount:</strong> ₹{selectedBooking.totalAmount?.toFixed(2)}</Typography>
              <Typography><strong>Advance Paid:</strong> ₹{selectedBooking.advanceAmount?.toFixed(2)}</Typography>
              <Typography><strong>Notes:</strong> {selectedBooking.notes || 'N/A'}</Typography>
              
              <FormControl fullWidth>
                <InputLabel>Update Status</InputLabel>
                <Select
                  value={bookingStatusUpdate}
                  onChange={(e) => setBookingStatusUpdate(e.target.value)}
                  label="Update Status"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingDialog(false)}>Close</Button>
          <Button onClick={handleUpdateBookingStatus} variant="contained">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemporaryCareManagerDashboard;