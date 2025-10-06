import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Divider,
  Container,
  IconButton
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  CheckCircle as CheckIcon,
  Schedule as PendingIcon,
  Cancel as CancelIcon,
  Payment as PaymentIcon,
  LocalShipping as DeliveryIcon,
  Pets as PetIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material'
import { apiClient } from '../../../services/api'

const buildImageUrl = (url) => {
  if (!url) return '/placeholder-pet.svg'
  if (/^https?:\/\//i.test(url)) return url
  const apiBase = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
  const origin = apiBase.replace(/\/?api\/?$/, '')
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`
}

const ReservationDetails = () => {
  const { reservationId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [reservation, setReservation] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadReservation()
  }, [reservationId])

  const loadReservation = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/petshop/public/reservations/${reservationId}`)
      setReservation(response.data.data.reservation)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reservation details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <PendingIcon />
      case 'approved': return <CheckIcon />
      case 'rejected': return <CancelIcon />
      case 'going_to_buy': return <CheckIcon />
      case 'payment_pending': return <PaymentIcon />
      case 'paid': return <CheckIcon />
      case 'ready_pickup': return <DeliveryIcon />
      case 'delivered': return <CheckIcon />
      case 'at_owner': return <PetIcon />
      case 'cancelled': return <CancelIcon />
      default: return <PendingIcon />
    }
  }

  const getWorkflowSteps = () => {
    const steps = [
      { key: 'pending', label: 'Reservation Submitted', description: 'Waiting for manager review' },
      { key: 'approved', label: 'Manager Approved', description: 'Ready for your decision' },
      { key: 'going_to_buy', label: 'Purchase Confirmed', description: 'You decided to buy' },
      { key: 'payment_pending', label: 'Payment Required', description: 'Complete payment to proceed' },
      { key: 'paid', label: 'Payment Completed', description: 'Preparing for delivery' },
      { key: 'delivered', label: 'Pet Delivered', description: 'Pet is now with you!' }
    ]

    const currentIndex = steps.findIndex(step => step.key === reservation?.status)
    return { steps, currentIndex }
  }

  const handleAction = (action) => {
    switch (action) {
      case 'make_decision':
        navigate(`/User/petshop/purchase-decision/${reservationId}`)
        break
      case 'pay_now':
        navigate(`/User/petshop/payment/${reservationId}`)
        break
      case 'cancel':
        // Handle cancellation
        break
      default:
        break
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  if (!reservation) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">Reservation not found</Alert>
      </Container>
    )
  }

  const { steps, currentIndex } = getWorkflowSteps()
  const pet = reservation.itemId

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/User/petshop/reservations')} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Reservation Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            #{reservation.reservationCode || reservation._id?.slice(-6)}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Pet Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardMedia
              component="img"
              height="200"
              image={buildImageUrl(pet?.images?.find?.(i => i.isPrimary)?.url || pet?.images?.[0]?.url)}
              alt={pet?.name || 'Pet'}
            />
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {pet?.name || 'Unnamed Pet'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {pet?.petCode} • {pet?.speciesId?.name} • {pet?.breedId?.name}
              </Typography>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                ₹{Number(pet?.price || 0).toLocaleString()}
              </Typography>
              <Chip 
                label={reservation.status.replace('_', ' ').toUpperCase()}
                color={getStatusColor(reservation.status)}
                icon={getStatusIcon(reservation.status)}
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Workflow Progress */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Purchase Progress
              </Typography>
              <Stepper activeStep={currentIndex} orientation="vertical">
                {steps.map((step, index) => (
                  <Step key={step.key} completed={index < currentIndex}>
                    <StepLabel>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {step.label}
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary">
                        {step.description}
                      </Typography>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Available Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {reservation.status === 'approved' && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => handleAction('make_decision')}
                    startIcon={<CheckIcon />}
                  >
                    Make Purchase Decision
                  </Button>
                )}
                {(reservation.status === 'going_to_buy' || reservation.status === 'payment_pending') && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleAction('pay_now')}
                    startIcon={<PaymentIcon />}
                  >
                    Complete Payment
                  </Button>
                )}
                {reservation.status === 'paid' && (
                  <Alert severity="info" sx={{ width: '100%' }}>
                    Payment completed! The pet shop will contact you for delivery arrangements.
                  </Alert>
                )}
                {reservation.status === 'delivered' && (
                  <Alert severity="success" sx={{ width: '100%' }}>
                    🎉 Congratulations! Your new pet is now with you. Enjoy your time together!
                  </Alert>
                )}
                {reservation.status === 'pending' && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleAction('cancel')}
                    startIcon={<CancelIcon />}
                  >
                    Cancel Reservation
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Reservation Details */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Reservation Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Contact Information
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PhoneIcon sx={{ mr: 1, fontSize: 16 }} />
                      <Typography variant="body2">
                        {reservation.contactInfo?.phone || 'Not provided'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EmailIcon sx={{ mr: 1, fontSize: 16 }} />
                      <Typography variant="body2">
                        {reservation.contactInfo?.email || 'Not provided'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationIcon sx={{ mr: 1, fontSize: 16 }} />
                      <Typography variant="body2">
                        {reservation.contactInfo?.address || 'Not provided'}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Visit Details
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarIcon sx={{ mr: 1, fontSize: 16 }} />
                      <Typography variant="body2">
                        {reservation.visitDetails?.preferredDate ? 
                          new Date(reservation.visitDetails.preferredDate).toLocaleDateString() : 
                          'Not specified'
                        }
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      <strong>Time:</strong> {reservation.visitDetails?.preferredTime || 'Not specified'}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Type:</strong> {reservation.reservationType?.replace('_', ' ') || 'Not specified'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              {reservation.notes && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Additional Notes
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">{reservation.notes}</Typography>
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default ReservationDetails
