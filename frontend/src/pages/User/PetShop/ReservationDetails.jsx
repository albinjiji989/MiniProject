import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Pets as PetsIcon,
  CalendarToday as CalendarIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  QrCode as QrCodeIcon,
  Info as InfoIcon,
  Chat as ChatIcon
} from '@mui/icons-material'
import { petShopAPI, resolveMediaUrl } from '../../../services/api'

const ReservationDetails = () => {
  const { reservationId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reservation, setReservation] = useState(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const loadReservation = async () => {
    try {
      setLoading(true)
      const res = await petShopAPI.getReservationById(reservationId)
      setReservation(res?.data?.data?.reservation || null)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load reservation details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReservation()
  }, [reservationId])

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

  const getStatusDescription = (status) => {
    const descriptions = {
      'pending': 'Your reservation has been submitted and is awaiting review.',
      'manager_review': 'The pet shop is reviewing your reservation.',
      'approved': 'Your reservation has been approved. Please proceed with payment.',
      'rejected': 'Your reservation has been rejected. Please contact the pet shop for more information.',
      'payment_pending': 'Payment is pending. Please complete the payment to confirm your reservation.',
      'paid': 'Payment has been received. Your reservation is confirmed.',
      'ready_pickup': 'Your pet is ready for pickup. Please visit the store with the required documents.',
      'completed': 'The reservation process is complete. Enjoy your new pet!',
      'cancelled': 'This reservation has been cancelled.'
    }
    return descriptions[status] || ''
  }

  const handleCancelReservation = () => {
    setCancelDialogOpen(true)
  }

  const confirmCancelReservation = async () => {
    try {
      await petShopAPI.cancelReservation(reservationId)
      setReservation(prev => ({ ...prev, status: 'cancelled' }))
      setCancelDialogOpen(false)
      setCancelReason('')
    } catch (e) {
      alert('Failed to cancel reservation: ' + (e?.response?.data?.message || 'Unknown error'))
    }
  }

  const handleProceedToPayment = () => {
    navigate(`/User/petshop/payment/${reservationId}`)
  }

  const handleViewHandover = () => {
    navigate(`/User/petshop/handover/${reservationId}`)
  }

  const formatAge = (age, ageUnit) => {
    if (!age) return 'Age not specified'
    if (ageUnit === 'months' && age >= 12) {
      const years = Math.floor(age / 12)
      const months = age % 12
      return `${years} yr${years > 1 ? 's' : ''}${months > 0 ? ` ${months} mo` : ''}`
    }
    return `${age} ${ageUnit || 'yr'}${age > 1 && ageUnit ? (ageUnit.endsWith('s') ? '' : 's') : ''}`
  }

  // Define steps for the reservation process
  const reservationSteps = [
    { 
      label: 'Reservation Submitted', 
      status: ['pending', 'manager_review', 'approved', 'rejected', 'payment_pending', 'paid', 'ready_pickup', 'completed', 'cancelled'],
      description: 'Your reservation has been submitted successfully.'
    },
    { 
      label: 'Review & Approval', 
      status: ['manager_review', 'approved', 'rejected', 'payment_pending', 'paid', 'ready_pickup', 'completed', 'cancelled'],
      description: 'The pet shop is reviewing your reservation.'
    },
    { 
      label: 'Payment', 
      status: ['approved', 'payment_pending', 'paid', 'ready_pickup', 'completed', 'cancelled'],
      description: 'Complete payment to confirm your reservation.'
    },
    { 
      label: 'Confirmation', 
      status: ['paid', 'ready_pickup', 'completed', 'cancelled'],
      description: 'Your reservation is confirmed.'
    },
    { 
      label: 'Pickup', 
      status: ['ready_pickup', 'completed', 'cancelled'],
      description: 'Visit the store to pick up your pet.'
    },
    { 
      label: 'Completed', 
      status: ['completed'],
      description: 'Reservation process completed successfully.'
    }
  ]

  // Determine current step based on reservation status
  const getCurrentStep = () => {
    if (!reservation) return 0
    
    const status = reservation.status
    if (status === 'pending') return 0
    if (status === 'manager_review') return 1
    if (['approved', 'payment_pending'].includes(status)) return 2
    if (status === 'paid') return 3
    if (status === 'ready_pickup') return 4
    if (status === 'completed') return 5
    if (status === 'cancelled') return 0 // Show first step for cancelled
    return 0
  }

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

  if (!reservation) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info">Reservation not found</Alert>
      </Container>
    )
  }

  const pet = reservation.itemId

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Reservation Details
          </Typography>
          <Chip 
            label={getStatusLabel(reservation.status)} 
            color={getReservationStatusColor(reservation.status)}
            sx={{ fontSize: '1.2rem', height: '36px' }}
          />
        </Box>
        <Typography variant="subtitle1" color="text.secondary">
          Reservation Code: {reservation.reservationCode}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Pet Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Reserved Pet</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <CardMedia
                    component="img"
                    height="150"
                    image={resolveMediaUrl(pet?.images?.[0]?.url) || '/placeholder-pet.svg'}
                    alt={pet?.name || 'Pet'}
                    sx={{ objectFit: 'cover', borderRadius: 1 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={8}>
                  <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                    {pet?.name || 'Pet'}
                  </Typography>
                  
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
              </Grid>
            </CardContent>
          </Card>
          
          {/* Reservation Progress */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Reservation Progress</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {getStatusDescription(reservation.status)}
              </Typography>
              
              <Stepper activeStep={getCurrentStep()} orientation="vertical">
                {reservationSteps.map((step, index) => (
                  <Step key={step.label} completed={step.status.includes(reservation.status)}>
                    <StepLabel>
                      <Typography variant="subtitle1">{step.label}</Typography>
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2">{step.description}</Typography>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
          
          {/* Reservation Information */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Reservation Information</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Reservation Date</Typography>
                  <Typography>{new Date(reservation.createdAt).toLocaleDateString()}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Last Updated</Typography>
                  <Typography>{new Date(reservation.updatedAt).toLocaleDateString()}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Purchase Method</Typography>
                  <Typography>Reservation</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Reservation Type</Typography>
                  <Typography>{reservation.reservationType === 'visit' ? 'Store Visit' : 'Delivery'}</Typography>
                </Grid>
                
                {reservation.reservationType === 'visit' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Preferred Date</Typography>
                      <Typography>{reservation.visitDetails?.preferredDate || 'Not specified'}</Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Preferred Time</Typography>
                      <Typography>{reservation.visitDetails?.preferredTime || 'Not specified'}</Typography>
                    </Grid>
                  </>
                )}
                
                {reservation.notes && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Notes</Typography>
                    <Typography>{reservation.notes}</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Right Column - Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Actions</Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {['pending', 'manager_review', 'approved', 'going_to_buy', 'payment_pending'].includes(reservation.status) && (
                  <Button 
                    variant="outlined" 
                    startIcon={<CancelIcon />}
                    onClick={handleCancelReservation}
                    color="error"
                  >
                    Cancel Reservation
                  </Button>
                )}
                
                {reservation.status === 'approved' && (
                  <Button 
                    variant="contained" 
                    color="success"
                    onClick={() => navigate(`/User/petshop/purchase-decision/${reservationId}`)}
                  >
                    Make Decision
                  </Button>
                )}
                
                {(reservation.status === 'going_to_buy' || reservation.status === 'payment_pending') && (
                  <Button 
                    variant="contained" 
                    startIcon={<PaymentIcon />}
                    onClick={handleProceedToPayment}
                  >
                    Proceed to Payment
                  </Button>
                )}
                
                {reservation.status === 'ready_pickup' && (
                  <Button 
                    variant="contained" 
                    startIcon={<QrCodeIcon />}
                    onClick={handleViewHandover}
                  >
                    View Handover Details
                  </Button>
                )}
                
                {reservation.status === 'paid' && (
                  <Chip 
                    label="Awaiting Delivery" 
                    color="info" 
                    sx={{ justifyContent: 'center' }}
                  />
                )}
                
                {reservation.status === 'delivered' && (
                  <Chip 
                    label="Pet Delivered" 
                    color="success" 
                    sx={{ justifyContent: 'center' }}
                  />
                )}
                
                {reservation.status === 'at_owner' && (
                  <Chip 
                    label="Pet with Owner" 
                    color="success" 
                    sx={{ justifyContent: 'center' }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
          
          {/* Store Information */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Store Information</Typography>
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                {reservation.store?.name || 'Store Name Not Available'}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {reservation.store?.address?.street}, {reservation.store?.address?.city}
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Phone: {reservation.store?.phone || 'Not provided'}
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Need Help?</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Have questions about your reservation?
              </Typography>
              <Button 
                variant="outlined" 
                fullWidth
                startIcon={<ChatIcon />}
              >
                Chat with Support
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Cancel Reservation Dialog */}
      <Dialog 
        open={cancelDialogOpen} 
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>Cancel Reservation</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to cancel your reservation for {pet?.name || 'this pet'}?
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

export default ReservationDetails