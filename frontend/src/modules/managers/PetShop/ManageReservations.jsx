import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
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
  Tooltip,
  Alert,
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
  Badge,
  Avatar,
  Divider,
  LinearProgress,
  Snackbar
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Pets as PetIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Payment as PaymentIcon,
  LocalShipping as DeliveryIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { apiClient } from '../../../services/api'

const ManageReservations = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [reservations, setReservations] = useState([])
  const [filteredReservations, setFilteredReservations] = useState([])
  const [tabValue, setTabValue] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [viewDialog, setViewDialog] = useState(false)
  const [updateDialog, setUpdateDialog] = useState(false)
  const [updateData, setUpdateData] = useState({ status: '', notes: '' })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const statusOptions = [
    { value: 'pending', label: 'Pending Review', color: 'warning' },
    { value: 'manager_review', label: 'Under Review', color: 'info' },
    { value: 'approved', label: 'Approved', color: 'success' },
    { value: 'rejected', label: 'Rejected', color: 'error' },
    { value: 'payment_pending', label: 'Payment Pending', color: 'warning' },
    { value: 'paid', label: 'Paid', color: 'success' },
    { value: 'ready_pickup', label: 'Ready for Pickup', color: 'primary' },
    { value: 'completed', label: 'Completed', color: 'success' },
    { value: 'cancelled', label: 'Cancelled', color: 'error' }
  ]

  const tabLabels = [
    { label: 'All Reservations', status: 'all' },
    { label: 'Pending Review', status: 'pending' },
    { label: 'Approved', status: 'approved' },
    { label: 'Payment Pending', status: 'payment_pending' },
    { label: 'Ready for Pickup', status: 'ready_pickup' }
  ]

  useEffect(() => {
    fetchReservations()
  }, [])

  useEffect(() => {
    filterReservations()
  }, [reservations, tabValue, searchQuery, statusFilter])

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/petshop/manager/reservations')
      setReservations(response.data.data.reservations || [])
    } catch (err) {
      console.error('Fetch reservations error:', err)
      showSnackbar(err.response?.data?.message || 'Failed to fetch reservations', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filterReservations = () => {
    let filtered = [...reservations]
    
    // Filter by tab status
    const currentTab = tabLabels[tabValue]
    if (currentTab.status !== 'all') {
      filtered = filtered.filter(res => res.status === currentTab.status)
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(res => 
        res.reservationCode?.toLowerCase().includes(query) ||
        res.userId?.name?.toLowerCase().includes(query) ||
        res.userId?.email?.toLowerCase().includes(query) ||
        res.itemId?.name?.toLowerCase().includes(query) ||
        res.itemId?.petCode?.toLowerCase().includes(query)
      )
    }
    
    setFilteredReservations(filtered)
  }

  const handleUpdateStatus = async () => {
    if (!selectedReservation || !updateData.status) {
      showSnackbar('Please select a status', 'warning')
      return
    }

    try {
      setLoading(true)
      await apiClient.put(`/petshop/manager/reservations/${selectedReservation._id}/status`, {
        status: updateData.status,
        notes: updateData.notes
      })
      
      showSnackbar('Reservation status updated successfully!')
      setUpdateDialog(false)
      setSelectedReservation(null)
      setUpdateData({ status: '', notes: '' })
      fetchReservations()
    } catch (err) {
      console.error('Update status error:', err)
      showSnackbar(err.response?.data?.message || 'Failed to update status', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const getStatusColor = (status) => {
    const statusObj = statusOptions.find(s => s.value === status)
    return statusObj?.color || 'default'
  }

  const getStatusLabel = (status) => {
    const statusObj = statusOptions.find(s => s.value === status)
    return statusObj?.label || status
  }

  const getTabCount = (status) => {
    if (status === 'all') return reservations.length
    return reservations.filter(res => res.status === status).length
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && reservations.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading reservations...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/Manager/petshop')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          Manage Reservations
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchReservations}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Reservations</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {reservations.length}
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Pending Review</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {getTabCount('pending')}
                  </Typography>
                </Box>
                <EditIcon sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Approved</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {getTabCount('approved')}
                  </Typography>
                </Box>
                <ApproveIcon sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Ready for Pickup</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {getTabCount('ready_pickup')}
                  </Typography>
                </Box>
                <DeliveryIcon sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by reservation code, customer name, pet name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status Filter"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  {statusOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabLabels.map((tab, index) => (
            <Tab 
              key={tab.status}
              label={
                <Badge badgeContent={getTabCount(tab.status)} color="primary">
                  {tab.label}
                </Badge>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {/* Reservations Table */}
      <Card>
        <CardContent>
          {filteredReservations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ScheduleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No reservations found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Reservations will appear here when customers make them'
                }
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Reservation</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Pet</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Visit Date</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredReservations.map((reservation) => (
                    <TableRow key={reservation._id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {reservation.reservationCode}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {reservation._id.slice(-6)}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {reservation.userId?.name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {reservation.userId?.email || 'No email'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                            <PetIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {reservation.itemId?.name || 'Unknown Pet'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {reservation.itemId?.petCode || 'No code'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Chip 
                          label={reservation.reservationType?.replace('_', ' ') || 'Unknown'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Chip 
                          label={getStatusLabel(reservation.status)}
                          color={getStatusColor(reservation.status)}
                          size="small"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {reservation.visitDetails?.preferredDate 
                            ? new Date(reservation.visitDetails.preferredDate).toLocaleDateString()
                            : 'Not specified'
                          }
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {reservation.visitDetails?.preferredTime || 'Any time'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(reservation.createdAt)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small"
                              onClick={() => {
                                setSelectedReservation(reservation)
                                setViewDialog(true)
                              }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Update Status">
                            <IconButton 
                              size="small"
                              onClick={() => {
                                setSelectedReservation(reservation)
                                setUpdateData({ status: reservation.status, notes: '' })
                                setUpdateDialog(true)
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Reservation Details - {selectedReservation?.reservationCode}
        </DialogTitle>
        <DialogContent>
          {selectedReservation && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon /> Customer Information
                    </Typography>
                    <Typography><strong>Name:</strong> {selectedReservation.userId?.name}</Typography>
                    <Typography><strong>Email:</strong> {selectedReservation.userId?.email}</Typography>
                    <Typography><strong>Phone:</strong> {selectedReservation.contactInfo?.phone || 'Not provided'}</Typography>
                    <Typography><strong>Preferred Contact:</strong> {selectedReservation.contactInfo?.preferredContactMethod || 'Any'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PetIcon /> Pet Information
                    </Typography>
                    <Typography><strong>Name:</strong> {selectedReservation.itemId?.name}</Typography>
                    <Typography><strong>Pet Code:</strong> {selectedReservation.itemId?.petCode}</Typography>
                    <Typography><strong>Price:</strong> ₹{selectedReservation.itemId?.price?.toLocaleString()}</Typography>
                    <Typography><strong>Species:</strong> {selectedReservation.itemId?.speciesId?.name || 'Unknown'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon /> Visit Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography><strong>Preferred Date:</strong> {selectedReservation.visitDetails?.preferredDate || 'Not specified'}</Typography>
                        <Typography><strong>Preferred Time:</strong> {selectedReservation.visitDetails?.preferredTime || 'Any time'}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography><strong>Visit Purpose:</strong> {selectedReservation.visitDetails?.visitPurpose || 'Meet pet'}</Typography>
                        <Typography><strong>Reservation Type:</strong> {selectedReservation.reservationType?.replace('_', ' ')}</Typography>
                      </Grid>
                    </Grid>
                    {selectedReservation.notes && (
                      <Box sx={{ mt: 2 }}>
                        <Typography><strong>Notes:</strong></Typography>
                        <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                          {selectedReservation.notes}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateDialog} onClose={() => setUpdateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Update Reservation Status
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={updateData.status}
                onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                label="Status"
              >
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    <Chip 
                      label={option.label} 
                      color={option.color} 
                      size="small" 
                      sx={{ mr: 1 }}
                    />
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes (Optional)"
              value={updateData.notes}
              onChange={(e) => setUpdateData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any notes about this status update..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateStatus} 
            variant="contained"
            disabled={!updateData.status || loading}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ManageReservations
