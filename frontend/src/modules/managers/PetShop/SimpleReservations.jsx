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
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  QrCode as QrCodeIcon,
  Visibility as VisibilityIcon,
  Chat as ChatIcon,
  Notifications as NotificationsIcon,
  Info as InfoIcon
} from '@mui/icons-material'
import { apiClient } from '../../../services/api'

const SimpleReservations = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [reservations, setReservations] = useState([])
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    paid: 0
  })
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [dialogAction, setDialogAction] = useState('')
  const [notes, setNotes] = useState('')
  const [communicationMethod, setCommunicationMethod] = useState('email')

  useEffect(() => {
    fetchReservations()
  }, [])

  const fetchReservations = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await apiClient.get('/petshop/manager/reservations')
      const data = response.data.data || {}
      
      setReservations(data.reservations || [])
      setStats(data.stats || { total: 0, pending: 0, approved: 0, paid: 0 })
    } catch (err) {
      console.error('Fetch reservations error:', err)
      setError(err.response?.data?.message || 'Failed to load reservations')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (reservation, action) => {
    setSelectedReservation(reservation)
    setDialogAction(action)
    setNotes('')
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedReservation(null)
    setDialogAction('')
    setNotes('')
  }

  const handleConfirmAction = async () => {
    try {
      let finalNotes = notes;
      if (!finalNotes) {
        switch (dialogAction) {
          case 'approved':
            finalNotes = 'Reservation approved';
            break;
          case 'rejected':
            finalNotes = 'Reservation rejected';
            break;
          case 'ready_pickup':
            finalNotes = 'Ready for pickup/delivery';
            break;
          default:
            finalNotes = `Status updated to ${dialogAction}`;
        }
      }

      await apiClient.put(`/petshop/manager/reservations/${selectedReservation._id}/status`, {
        status: dialogAction,
        notes: finalNotes
      });
      
      // Refresh data
      fetchReservations();
      
      // Show success message
      alert(`Reservation status updated to "${dialogAction}" successfully!`);
      
      handleCloseDialog();
    } catch (err) {
      console.error('Update status error:', err);
      setError(err.response?.data?.message || 'Failed to update status');
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'approved': return 'success'
      case 'going_to_buy': return 'info'
      case 'payment_pending': return 'warning'
      case 'paid': return 'primary'
      case 'ready_pickup': return 'info'
      case 'delivered': return 'success'
      case 'at_owner': return 'success'
      case 'cancelled': return 'error'
      case 'rejected': return 'error'
      default: return 'default'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const sendNotification = async (reservationId, message) => {
    try {
      // In a real implementation, this would send a notification to the user
      // For now, we'll just show an alert
      alert(`Notification sent to user: ${message}`)
    } catch (err) {
      console.error('Send notification error:', err)
      setError(err.response?.data?.message || 'Failed to send notification')
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/manager/petshop/dashboard')}
          sx={{ mr: 2 }}
        >
          Back to Dashboard
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          Manage Reservations
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchReservations}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Reservations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main">
                {stats.pending}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {stats.approved}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {stats.paid}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Paid
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Reservations Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Reservations ({reservations.length})
          </Typography>

          {reservations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No reservations found
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Reservation ID</TableCell>
                    <TableCell>Pet</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reservations.map((reservation) => (
                    <TableRow key={reservation._id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {reservation._id.slice(-8)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {reservation.reservationCode}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {reservation.itemId?.name || 'Unknown Pet'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {reservation.itemId?.petCode}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {reservation.userId?.name || 'Unknown User'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {reservation.userId?.email}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Tooltip title="Send notification">
                              <IconButton 
                                size="small" 
                                onClick={() => sendNotification(reservation._id, `Regarding your reservation for ${reservation.itemId?.name}`)}
                              >
                                <NotificationsIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View details">
                              <IconButton 
                                size="small" 
                                onClick={() => navigate(`/manager/petshop/reservation/${reservation._id}`)}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(reservation.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={reservation.status.replace('_', ' ')} 
                          color={getStatusColor(reservation.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {reservation.status === 'pending' && (
                            <>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => handleOpenDialog(reservation, 'approved')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => handleOpenDialog(reservation, 'rejected')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {reservation.status === 'approved' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              onClick={() => handleOpenDialog(reservation, 'payment_pending')}
                            >
                              Request Payment
                            </Button>
                          )}
                          {reservation.status === 'paid' && (
                            <>
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                onClick={() => navigate(`/manager/petshop/schedule-handover/${reservation._id}`)}
                                sx={{ mr: 1 }}
                              >
                                Schedule Handover
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="info"
                                onClick={() => handleOpenDialog(reservation, 'ready_pickup')}
                              >
                                Ready for Pickup
                              </Button>
                            </>
                          )}
                          {reservation.status === 'ready_pickup' && (
                            <>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => handleOpenDialog(reservation, 'delivered')}
                              >
                                Mark Delivered
                              </Button>
                            </>
                          )}
                          {reservation.status === 'delivered' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              onClick={() => handleOpenDialog(reservation, 'at_owner')}
                            >
                              Complete Handover
                            </Button>
                          )}
                          {reservation.status === 'at_owner' && (
                            <Chip 
                              label="Handover Completed" 
                              color="success" 
                              size="small" 
                            />
                          )}

                          {['going_to_buy', 'payment_pending'].includes(reservation.status) && (
                            <Chip 
                              label="Waiting for User" 
                              color="warning" 
                              size="small" 
                            />
                          )}

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

      {/* Action Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogAction === 'approved' && 'Approve Reservation'}
          {dialogAction === 'rejected' && 'Reject Reservation'}
          {dialogAction === 'payment_pending' && 'Request Payment'}
          {dialogAction === 'ready_pickup' && 'Mark Ready for Pickup'}
          {dialogAction === 'delivered' && 'Mark as Delivered'}
          {dialogAction === 'at_owner' && 'Complete Handover'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {selectedReservation && (
                <>
                  <strong>Pet:</strong> {selectedReservation.itemId?.name} ({selectedReservation.itemId?.petCode})
                  <br />
                  <strong>Customer:</strong> {selectedReservation.userId?.name}
                </>
              )}
            </Typography>
            
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              helperText="Add notes about this status change"
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <InfoIcon color="info" />
              <Typography variant="body2" color="text.secondary">
                {dialogAction === 'approved' && 'Customer will be notified about the approval and next steps.'}
                {dialogAction === 'rejected' && 'Customer will be notified about the rejection and reason.'}
                {dialogAction === 'payment_pending' && 'Customer will be notified to complete payment.'}
                {dialogAction === 'ready_pickup' && 'Customer will be notified that the pet is ready for pickup.'}
                {dialogAction === 'delivered' && 'Customer will be notified that the pet has been delivered.'}
                {dialogAction === 'at_owner' && 'Reservation will be marked as completed.'}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleConfirmAction} 
            variant="contained"
            color={
              dialogAction === 'approved' ? 'success' :
              dialogAction === 'rejected' ? 'error' :
              'primary'
            }
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SimpleReservations