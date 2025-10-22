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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Pets as PetsIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material'
import { petShopAPI, resolveMediaUrl } from '../../../services/api'

const PurchaseDecision = () => {
  const { reservationId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [reservation, setReservation] = useState(null)
  const [decision, setDecision] = useState('proceed')
  const [notes, setNotes] = useState('')
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false)

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

  const handleConfirmDecision = () => {
    setConfirmationDialogOpen(true)
  }

  const submitDecision = async () => {
    try {
      setProcessing(true)
      setConfirmationDialogOpen(false)
      
      const payload = {
        wantsToBuy: decision === 'proceed',
        notes: notes
      }
      
      await petShopAPI.confirmPurchaseDecision(reservationId, payload)
      
      // Refresh reservation data
      await loadReservation()
      
      // Show success message
      alert(`Your decision has been recorded successfully!`)
      
      // If user wants to proceed, redirect to reservation details
      if (decision === 'proceed') {
        navigate(`/User/petshop/reservation/${reservationId}`)
      } else {
        // If user wants to cancel, redirect to reservations list
        navigate('/User/petshop/reservations')
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to submit decision')
    } finally {
      setProcessing(false)
    }
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
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Purchase Decision
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Reservation {reservation.reservationCode} - Payment Successful
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
          
          {/* Decision Options */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>What would you like to do?</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Your payment has been processed successfully. Please confirm your decision to proceed with the purchase or cancel.
              </Typography>
              
              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                >
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      mb: 2, 
                      borderColor: decision === 'proceed' ? 'primary.main' : 'divider',
                      borderWidth: decision === 'proceed' ? 2 : 1
                    }}
                  >
                    <CardContent>
                      <FormControlLabel 
                        value="proceed" 
                        control={<Radio />} 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckIcon color="success" />
                            <Typography>Proceed with Purchase</Typography>
                          </Box>
                        }
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        Confirm your purchase and proceed with the adoption process. You will receive further instructions for pickup.
                      </Typography>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      borderColor: decision === 'cancel' ? 'primary.main' : 'divider',
                      borderWidth: decision === 'cancel' ? 2 : 1
                    }}
                  >
                    <CardContent>
                      <FormControlLabel 
                        value="cancel" 
                        control={<Radio />} 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CancelIcon color="error" />
                            <Typography>Cancel Purchase</Typography>
                          </Box>
                        }
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        Cancel your purchase. The amount will be refunded to your original payment method within 5-7 business days.
                      </Typography>
                    </CardContent>
                  </Card>
                </RadioGroup>
              </FormControl>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Additional Notes (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{ mt: 3 }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button 
                  variant="contained" 
                  size="large"
                  onClick={handleConfirmDecision}
                  disabled={processing}
                >
                  {processing ? <CircularProgress size={24} /> : 'Confirm Decision'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Right Column - Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <InfoIcon color="primary" />
                <Typography variant="h6">Next Steps</Typography>
              </Box>
              
              {decision === 'proceed' ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <CheckIcon color="success" />
                    <Typography variant="body2">
                      Your purchase will be confirmed and the pet will be prepared for pickup
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <ScheduleIcon color="primary" />
                    <Typography variant="body2">
                      You will receive a pickup schedule within 24 hours
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <InfoIcon color="primary" />
                    <Typography variant="body2">
                      Bring valid ID and proof of address for verification
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <InfoIcon color="primary" />
                    <Typography variant="body2">
                      Your purchase will be cancelled and refund initiated
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <ScheduleIcon color="primary" />
                    <Typography variant="body2">
                      Refund will be processed to your original payment method
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <InfoIcon color="primary" />
                    <Typography variant="body2">
                      Refund typically takes 5-7 business days to reflect
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
          
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Need Help?</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Have questions about your purchase decision?
              </Typography>
              <Button 
                variant="outlined" 
                fullWidth
              >
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Confirmation Dialog */}
      <Dialog 
        open={confirmationDialogOpen} 
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <DialogTitle>Confirm Your Decision</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {decision === 'proceed' 
              ? `Are you sure you want to proceed with the purchase of ${pet?.name || 'this pet'}?` 
              : `Are you sure you want to cancel your purchase of ${pet?.name || 'this pet'}?`}
          </Typography>
          {notes && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Your Notes:</Typography>
              <Typography variant="body2">{notes}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmationDialogOpen(false)}>
            No, Go Back
          </Button>
          <Button 
            onClick={submitDecision} 
            variant="contained"
            color={decision === 'proceed' ? 'primary' : 'error'}
          >
            Yes, Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default PurchaseDecision