import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Pets as PetsIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Store as StoreIcon,
  QrCode as QrCodeIcon,
  Info as InfoIcon
} from '@mui/icons-material'
import { petShopAPI, resolveMediaUrl } from '../../../services/api'
import { QRCodeSVG } from 'qrcode.react'

const PurchaseConfirmation = () => {
  const { reservationId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reservation, setReservation] = useState(null)
  const [showHandoverInstructions, setShowHandoverInstructions] = useState(false)

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

  const formatAge = (age, ageUnit) => {
    if (!age) return 'Age not specified'
    if (ageUnit === 'months' && age >= 12) {
      const years = Math.floor(age / 12)
      const months = age % 12
      return `${years} yr${years > 1 ? 's' : ''}${months > 0 ? ` ${months} mo` : ''}`
    }
    return `${age} ${ageUnit || 'yr'}${age > 1 && ageUnit ? (ageUnit.endsWith('s') ? '' : 's') : ''}`
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
  const isHandoverScheduled = reservation.handover && reservation.handover.status === 'scheduled'

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button 
        startIcon={<BackIcon />} 
        onClick={() => navigate('/User/petshop/reservations')} 
        sx={{ mb: 2 }}
      >
        Back to Reservations
      </Button>
      
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <CheckIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main', mb: 1 }}>
          Payment Successful!
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Reservation {reservation.reservationCode} - ₹{reservation.paymentInfo?.amount?.toLocaleString() || 'N/A'}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Pet Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Purchased Pet</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <img
                    src={resolveMediaUrl(pet?.images?.[0]?.url) || '/placeholder-pet.svg'}
                    alt={pet?.name || 'Pet'}
                    style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }}
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
          
          {/* Next Steps */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Next Steps</Typography>
              
              <Stepper activeStep={isHandoverScheduled ? 1 : 0} alternativeLabel sx={{ mb: 3 }}>
                <Step>
                  <StepLabel>Payment Complete</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Schedule Handover</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Pick Up Pet</StepLabel>
                </Step>
              </Stepper>
              
              {!isHandoverScheduled ? (
                <Alert severity="info">
                  <Typography variant="body1">
                    Your payment has been processed successfully! The pet shop manager will contact you to schedule the handover.
                  </Typography>
                </Alert>
              ) : (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="body1">
                      <strong>Handover Scheduled!</strong> Your pet is ready for pickup.
                    </Typography>
                  </Alert>
                  
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Handover Details
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>Date:</strong> {new Date(reservation.handover.scheduledAt).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>Time:</strong> {new Date(reservation.handover.scheduledAt).toLocaleTimeString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2">
                          <strong>Location:</strong> {reservation.handover.location?.address || 'Pet Shop'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2">
                          <strong>Contact:</strong> {reservation.handover.location?.phone || 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                  
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<QrCodeIcon />}
                      onClick={() => setShowHandoverInstructions(true)}
                    >
                      View Handover Instructions
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Right Column - Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Order Summary</Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Pet Price</Typography>
                <Typography variant="body2">₹{pet?.price?.toLocaleString() || '0'}</Typography>
              </Box>
              
              {reservation.deliveryInfo?.method === 'delivery' && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Delivery Fee</Typography>
                  <Typography variant="body2">₹500</Typography>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2">Taxes (18%)</Typography>
                <Typography variant="body2">
                  ₹{Math.round((pet?.price || 0) * 0.18).toLocaleString()}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <Typography variant="body1">Total Paid</Typography>
                <Typography variant="body1">
                  ₹{reservation.paymentInfo?.amount?.toLocaleString() || '0'}
                </Typography>
              </Box>
              
              <Box sx={{ mt: 2, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ color: 'success.dark', textAlign: 'center' }}>
                  <CheckIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                  Payment Confirmed
                </Typography>
              </Box>
            </CardContent>
          </Card>
          
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>What's Next?</Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Schedule Handover" 
                    secondary="Manager will contact you to schedule pickup" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <StoreIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Visit Pet Shop" 
                    secondary="Bring ID and confirmation for pickup" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PetsIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Take Your Pet Home" 
                    secondary="Complete paperwork and receive care instructions" 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Handover Instructions Dialog */}
      <Dialog open={showHandoverInstructions} onClose={() => setShowHandoverInstructions(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <QrCodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Handover Instructions
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Show this QR code at the pet shop during pickup:
            </Typography>
            
            <Box sx={{ p: 2, bgcolor: 'white', display: 'inline-block', borderRadius: 1 }}>
              <QRCodeSVG 
                value={`PETSHOP_PICKUP:${reservationId}`} 
                size={200}
                level="H"
                includeMargin={true}
              />
            </Box>
            
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              Reservation ID: {reservation.reservationCode}
            </Typography>
            
            <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Important:</strong> Bring a valid ID and this confirmation when picking up your pet. 
                The pet shop manager will verify your identity before releasing the pet.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHandoverInstructions(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default PurchaseConfirmation