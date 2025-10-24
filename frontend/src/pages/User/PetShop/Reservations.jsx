import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material'
import {
  Pets as PetsIcon,
  ArrowBack as BackIcon,
  Visibility as ViewIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckIcon,
  QrCode as QrCodeIcon,
  Info as InfoIcon
} from '@mui/icons-material'
import { petShopAPI, resolveMediaUrl } from '../../../services/api'
import { handleApiError, showSuccessMessage, formatAge } from '../../../utils/notifications'

const Reservations = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reservations, setReservations] = useState([])
  const [tabValue, setTabValue] = useState(0)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

  const loadReservations = async () => {
    try {
      setLoading(true)
      const res = await petShopAPI.listMyReservations()
      setReservations(res?.data?.data?.reservations || [])
    } catch (e) {
      const errorMessage = handleApiError(e, 'Failed to load reservations')
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReservations()
  }, [])

  const getReservationStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
      'manager_review': 'info',
      'approved': 'success',
      'rejected': 'error',
      'going_to_buy': 'info',
      'payment_pending': 'warning',
      'paid': 'success',
      'ready_pickup': 'primary',
      'delivered': 'success',
      'at_owner': 'success',
      'cancelled': 'error'
    }
    return colors[status] || 'default'
  }

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Pending',
      'manager_review': 'Under Review',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'going_to_buy': 'Going to Buy',
      'payment_pending': 'Payment Pending',
      'paid': 'Paid',
      'ready_pickup': 'Ready for Pickup',
      'delivered': 'Delivered',
      'at_owner': 'Pet with Owner',
      'cancelled': 'Cancelled'
    }
    return labels[status] || status
  }

  const handleViewDetails = (reservationId) => {
    navigate(`/User/petshop/reservation/${reservationId}`)
  }

  const handleCancelReservation = (reservation) => {
    setSelectedReservation(reservation)
    setCancelDialogOpen(true)
  }

  const confirmCancelReservation = async () => {
    try {
      await petShopAPI.cancelReservation(selectedReservation._id)
      // Update local state
      setReservations(prev => prev.map(r => 
        r._id === selectedReservation._id 
          ? { ...r, status: 'cancelled' } 
          : r
      ))
      setCancelDialogOpen(false)
      setCancelReason('')
      setSelectedReservation(null)
      showSuccessMessage('Reservation cancelled successfully!')
    } catch (e) {
      handleApiError(e, 'Failed to cancel reservation')
    }
  }

  const filteredReservations = reservations.filter(reservation => {
    if (tabValue === 0) return true // All
    if (tabValue === 1) return ['pending', 'manager_review', 'approved', 'going_to_buy', 'payment_pending', 'paid', 'ready_pickup'].includes(reservation.status)
    if (tabValue === 2) return reservation.status === 'delivered'
    if (tabValue === 3) return reservation.status === 'at_owner'
    if (tabValue === 4) return reservation.status === 'cancelled'
    return true
  })

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button 
        startIcon={<BackIcon />} 
        onClick={() => navigate(-1)} 
        sx={{ mb: 2 }}
      >
        Back
      </Button>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          My Reservations
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Track and manage your pet reservations
        </Typography>
      </Box>

      <Tabs 
        value={tabValue} 
        onChange={(e, newValue) => setTabValue(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label="All Reservations" />
        <Tab label="Active" />
        <Tab label="Delivered" />
        <Tab label="Pet with Owner" />
        <Tab label="Cancelled" />
      </Tabs>

      {filteredReservations.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ScheduleIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No reservations found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {tabValue === 0 
              ? "You haven't made any reservations yet." 
              : tabValue === 1 
                ? "You don't have any active reservations." 
                : tabValue === 2 
                  ? "You haven't completed any reservations yet." 
                  : "You haven't cancelled any reservations."}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/User/petshop/shop')}
          >
            Browse Pets
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredReservations.map((reservation) => {
            const pet = reservation.itemId
            return (
              <Grid item xs={12} key={reservation._id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" component="div">
                          {pet?.name || 'Pet'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Reservation Code: {reservation.reservationCode}
                        </Typography>
                      </Box>
                      <Chip 
                        label={getStatusLabel(reservation.status)} 
                        color={getReservationStatusColor(reservation.status)}
                      />
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <CardMedia
                          component="img"
                          height="150"
                          image={resolveMediaUrl(pet?.images?.[0]?.url) || '/placeholder-pet.svg'}
                          alt={pet?.name || 'Pet'}
                          sx={{ objectFit: 'cover', borderRadius: 1 }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="body2">
                            <strong>Species:</strong> {pet?.speciesId?.displayName || pet?.speciesId?.name || 'Not specified'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Breed:</strong> {pet?.breedId?.name || 'Not specified'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Age:</strong> {formatAge(pet?.age, pet?.ageUnit)}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Gender:</strong> {pet?.gender || 'Not specified'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Price:</strong> ₹{pet?.price?.toLocaleString() || 'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={3}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Created: {new Date(reservation.createdAt).toLocaleDateString()}
                            </Typography>
                            {reservation.updatedAt && (
                              <Typography variant="body2" color="text.secondary">
                                Updated: {new Date(reservation.updatedAt).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Tooltip title="View Details">
                              <IconButton 
                                size="small" 
                                onClick={() => handleViewDetails(reservation._id)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            
                            {['pending', 'manager_review', 'approved', 'going_to_buy', 'payment_pending'].includes(reservation.status) && (
                              <Tooltip title="Cancel Reservation">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleCancelReservation(reservation)}
                                  color="error"
                                >
                                  <CancelIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            
                            {reservation.status === 'ready_pickup' && (
                              <Tooltip title="View Handover Details">
                                <IconButton 
                                  size="small" 
                                  onClick={() => navigate(`/User/petshop/handover/${reservation._id}`)}
                                >
                                  <QrCodeIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                      <Button 
                        variant="outlined" 
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewDetails(reservation._id)}
                      >
                        View Details
                      </Button>
                      
                      {['pending', 'manager_review', 'approved', 'going_to_buy', 'payment_pending'].includes(reservation.status) && (
                        <Button 
                          variant="outlined" 
                          size="small"
                          startIcon={<CancelIcon />}
                          onClick={() => handleCancelReservation(reservation)}
                          color="error"
                        >
                          Cancel
                        </Button>
                      )}

                      {reservation.status === 'approved' && (
                        <Button 
                          variant="contained" 
                          size="small"
                          color="success"
                          onClick={() => navigate(`/User/petshop/purchase-decision/${reservation._id}`)}
                        >
                          Make Decision
                        </Button>
                      )}

                      {(reservation.status === 'going_to_buy' || reservation.status === 'payment_pending') && (
                        <Button 
                          variant="contained" 
                          size="small"
                          startIcon={<PaymentIcon />}
                          onClick={() => navigate(`/User/petshop/payment/${reservation._id}`)}
                        >
                          Pay Now
                        </Button>
                      )}

                      {reservation.status === 'ready_pickup' && (
                        <Button 
                          variant="contained" 
                          size="small"
                          startIcon={<QrCodeIcon />}
                          onClick={() => navigate(`/User/petshop/handover/${reservation._id}`)}
                        >
                          Handover Details
                        </Button>
                      )}

                      {reservation.status === 'paid' && (
                        <Chip 
                          label="Awaiting Delivery" 
                          color="info" 
                          size="small" 
                        />
                      )}

                      {reservation.status === 'delivered' && (
                        <Chip 
                          label="Pet Delivered" 
                          color="success" 
                          size="small" 
                        />
                      )}

                      {reservation.status === 'at_owner' && (
                        <Chip 
                          label="Pet with Owner" 
                          color="success" 
                          size="small" 
                        />
                      )}

                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}
      
      {/* Cancel Reservation Dialog */}
      <Dialog 
        open={cancelDialogOpen} 
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>Cancel Reservation</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to cancel your reservation for {selectedReservation?.itemId?.name || 'this pet'}?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for cancellation (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            No, Keep Reservation
          </Button>
          <Button 
            onClick={confirmCancelReservation} 
            color="error" 
            variant="contained"
          >
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default Reservations