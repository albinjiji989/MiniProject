import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Snackbar,
  Tabs,
  Tab,
  Badge,
  Avatar,
  Divider,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/material'
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Pets as PetsIcon,
  AttachMoney as MoneyIcon,
  Notes as NotesIcon,
  History as HistoryIcon,
  QrCode as QrCodeIcon,
  FilterList as FilterIcon
} from '@mui/icons-material'
import { apiClient } from '../../../services/api'

const ReservationManager = () => {
  const [loading, setLoading] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  
  // Reservation state
  const [reservations, setReservations] = useState([])
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [reviewDialog, setReviewDialog] = useState(false)
  const [detailsDialog, setDetailsDialog] = useState(false)
  
  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    reservationType: '',
    dateFrom: '',
    dateTo: ''
  })
  
  // Review form state
  const [reviewForm, setReviewForm] = useState({
    action: '',
    reviewNotes: '',
    approvalReason: ''
  })

  useEffect(() => {
    fetchReservations()
  }, [filters])

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filters.status) params.append('status', filters.status)
      if (filters.reservationType) params.append('reservationType', filters.reservationType)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)
      
      const response = await apiClient.get(`/petshop/manager/reservations/enhanced?${params}`)
      setReservations(response.data.data.reservations || [])
    } catch (err) {
      console.error('Fetch reservations error:', err)
      showSnackbar('Failed to load reservations', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleReviewReservation = (reservation) => {
    setSelectedReservation(reservation)
    setReviewForm({
      action: '',
      reviewNotes: '',
      approvalReason: ''
    })
    setReviewDialog(true)
  }

  const handleViewDetails = (reservation) => {
    setSelectedReservation(reservation)
    setDetailsDialog(true)
  }

  const submitReview = async () => {
    try {
      await apiClient.post(`/petshop/manager/reservations/${selectedReservation._id}/review`, reviewForm)
      showSnackbar(`Reservation ${reviewForm.action}d successfully!`)
      setReviewDialog(false)
      fetchReservations()
    } catch (err) {
      console.error('Review reservation error:', err)
      showSnackbar(err.response?.data?.message || 'Failed to review reservation', 'error')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
      'manager_review': 'info',
      'approved': 'success',
      'rejected': 'error',
      'payment_pending': 'warning',
      'paid': 'success',
      'ready_pickup': 'primary',
      'completed': 'success',
      'cancelled': 'error'
    }
    return colors[status] || 'default'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <ApproveIcon />
      case 'rejected': return <RejectIcon />
      case 'completed': return <CheckCircle />
      default: return <ScheduleIcon />
    }
  }

  const pendingReservations = reservations.filter(r => 
    ['pending', 'manager_review'].includes(r.status)
  )

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Reservation Management
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Total Reservations
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {reservations.length}
                  </Typography>
                </Box>
                <PetsIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Pending Review
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {pendingReservations.length}
                  </Typography>
                </Box>
                <Badge badgeContent={pendingReservations.length} color="error">
                  <ScheduleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Approved Today
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {reservations.filter(r => 
                      r.status === 'approved' && 
                      new Date(r.managerReview?.reviewedAt).toDateString() === new Date().toDateString()
                    ).length}
                  </Typography>
                </Box>
                <ApproveIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Revenue Potential
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    ₹{reservations.reduce((sum, r) => sum + (r.paymentInfo?.amount || 0), 0).toLocaleString()}
                  </Typography>
                </Box>
                <MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="manager_review">Manager Review</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="payment_pending">Payment Pending</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.reservationType}
                  onChange={(e) => setFilters(prev => ({ ...prev, reservationType: e.target.value }))}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="online_booking">Online Booking</MenuItem>
                  <MenuItem value="offline_verification">Offline Verification</MenuItem>
                  <MenuItem value="direct_purchase">Direct Purchase</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="From Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="To Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Reservations Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Reservations ({reservations.length})
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Reservation Code</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Pet</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reservations.map((reservation) => (
                  <TableRow key={reservation._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <QrCodeIcon color="primary" />
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {reservation.reservationCode}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {reservation.userId?.name || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {reservation.contactInfo?.phone || reservation.userId?.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {reservation.itemId?.name || 'Pet'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Code: {reservation.itemId?.petCode}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={reservation.reservationType?.replace('_', ' ')} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        ₹{reservation.paymentInfo?.amount?.toLocaleString() || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={reservation.status} 
                        size="small" 
                        color={getStatusColor(reservation.status)}
                        icon={getStatusIcon(reservation.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(reservation.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(reservation.createdAt).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewDetails(reservation)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        {['pending', 'manager_review'].includes(reservation.status) && (
                          <Tooltip title="Review">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleReviewReservation(reservation)}
                            >
                              <ApproveIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onClose={() => setReviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Review Reservation: {selectedReservation?.reservationCode}
        </DialogTitle>
        <DialogContent>
          {selectedReservation && (
            <Box sx={{ mt: 2 }}>
              {/* Customer Info */}
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Customer Information</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography><strong>Name:</strong> {selectedReservation.userId?.name}</Typography>
                      <Typography><strong>Email:</strong> {selectedReservation.userId?.email}</Typography>
                      <Typography><strong>Phone:</strong> {selectedReservation.contactInfo?.phone}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography><strong>Preferred Contact:</strong> {selectedReservation.contactInfo?.preferredContactMethod}</Typography>
                      <Typography><strong>Visit Date:</strong> {selectedReservation.visitDetails?.preferredDate}</Typography>
                      <Typography><strong>Visit Time:</strong> {selectedReservation.visitDetails?.preferredTime}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Pet Info */}
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Pet Information</Typography>
                  <Typography><strong>Name:</strong> {selectedReservation.itemId?.name}</Typography>
                  <Typography><strong>Pet Code:</strong> {selectedReservation.itemId?.petCode}</Typography>
                  <Typography><strong>Price:</strong> ₹{selectedReservation.paymentInfo?.amount?.toLocaleString()}</Typography>
                </CardContent>
              </Card>

              {/* Review Form */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Manager Review</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Action</InputLabel>
                        <Select
                          value={reviewForm.action}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, action: e.target.value }))}
                        >
                          <MenuItem value="approve">Approve</MenuItem>
                          <MenuItem value="reject">Reject</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Review Notes"
                        value={reviewForm.reviewNotes}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, reviewNotes: e.target.value }))}
                      />
                    </Grid>
                    {reviewForm.action === 'approve' && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Approval Reason"
                          value={reviewForm.approvalReason}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, approvalReason: e.target.value }))}
                        />
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(false)}>Cancel</Button>
          <Button 
            onClick={submitReview} 
            variant="contained"
            disabled={!reviewForm.action}
            color={reviewForm.action === 'approve' ? 'success' : 'error'}
          >
            {reviewForm.action === 'approve' ? 'Approve' : 'Reject'} Reservation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Reservation Details: {selectedReservation?.reservationCode}
        </DialogTitle>
        <DialogContent>
          {selectedReservation && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={8}>
                {/* Timeline */}
                <Typography variant="h6" sx={{ mb: 2 }}>
                  <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Reservation Timeline
                </Typography>
                <Timeline>
                  {selectedReservation.timeline?.map((event, index) => (
                    <TimelineItem key={index}>
                      <TimelineOppositeContent color="textSecondary">
                        {new Date(event.timestamp).toLocaleString()}
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot color={getStatusColor(event.status)}>
                          {getStatusIcon(event.status)}
                        </TimelineDot>
                        {index < selectedReservation.timeline.length - 1 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {event.status.replace('_', ' ').toUpperCase()}
                        </Typography>
                        {event.notes && (
                          <Typography variant="body2" color="textSecondary">
                            {event.notes}
                          </Typography>
                        )}
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </Grid>
              <Grid item xs={12} md={4}>
                {/* Summary */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Summary</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography><strong>Status:</strong> {selectedReservation.status}</Typography>
                    <Typography><strong>Type:</strong> {selectedReservation.reservationType}</Typography>
                    <Typography><strong>Amount:</strong> ₹{selectedReservation.paymentInfo?.amount?.toLocaleString()}</Typography>
                    <Typography><strong>Created:</strong> {new Date(selectedReservation.createdAt).toLocaleString()}</Typography>
                    {selectedReservation.notes && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2">Customer Notes:</Typography>
                        <Typography variant="body2">{selectedReservation.notes}</Typography>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
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

export default ReservationManager
