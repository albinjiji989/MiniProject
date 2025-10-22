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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Pets as PetsIcon,
  QrCode as QrCodeIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material'
import { petShopAPI, resolveMediaUrl } from '../../../services/api'
import { QRCodeSVG } from 'qrcode.react'

const Handover = () => {
  const { reservationId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [reservation, setReservation] = useState(null)
  const [otp, setOtp] = useState('')
  const [qrDialogOpen, setQrDialogOpen] = useState(false)

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

  const handleVerifyOtp = async () => {
    try {
      setVerifying(true)
      
      // In a real implementation, this would call the API to verify the OTP
      // For now, we'll simulate a successful verification
      setTimeout(() => {
        alert('OTP verified successfully! You can now pick up your pet.')
        loadReservation() // Refresh to show updated status
        setVerifying(false)
        setOtp('')
      }, 1500)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to verify OTP')
      setVerifying(false)
    }
  }

  const handleShowQrCode = () => {
    setQrDialogOpen(true)
  }

  // Define steps for the handover process
  const handoverSteps = [
    { 
      label: 'Reservation Confirmed', 
      status: ['paid', 'ready_pickup', 'completed'],
      description: 'Your reservation has been confirmed and payment processed.'
    },
    { 
      label: 'Preparation', 
      status: ['ready_pickup', 'completed'],
      description: 'The pet shop is preparing your pet for pickup.'
    },
    { 
      label: 'Ready for Pickup', 
      status: ['ready_pickup', 'completed'],
      description: 'Your pet is ready for pickup. Please visit the store with the required documents.'
    },
    { 
      label: 'Verification', 
      status: ['completed'],
      description: 'Verify your identity at the store using the OTP or QR code.'
    },
    { 
      label: 'Handover Complete', 
      status: ['completed'],
      description: 'Pet handover completed successfully. Enjoy your new companion!'
    }
  ]

  // Determine current step based on reservation status
  const getCurrentStep = () => {
    if (!reservation) return 0
    
    const status = reservation.status
    if (status === 'paid') return 0
    if (status === 'ready_pickup') return 2
    if (status === 'completed') return 4
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
            Handover Details
          </Typography>
          <Chip 
            label={reservation.status === 'completed' ? 'Completed' : 'Ready for Pickup'} 
            color={reservation.status === 'completed' ? 'success' : 'primary'}
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
          
          {/* Handover Progress */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Handover Progress</Typography>
              
              <Stepper activeStep={getCurrentStep()} orientation="vertical">
                {handoverSteps.map((step, index) => (
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
          
          {/* OTP Verification */}
          {reservation.status === 'ready_pickup' && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>OTP Verification</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Enter the OTP sent to your phone to verify your identity at pickup.
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    label="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    inputProps={{ maxLength: 6 }}
                  />
                  <Button 
                    variant="contained" 
                    onClick={handleVerifyOtp}
                    disabled={verifying || otp.length !== 6}
                  >
                    {verifying ? <CircularProgress size={24} /> : 'Verify'}
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button 
                    startIcon={<QrCodeIcon />}
                    onClick={handleShowQrCode}
                  >
                    Show QR Code
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
        
        {/* Right Column - Store Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Store Information</Typography>
              
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                {reservation.store?.name || 'Pet Shop'}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocationOnIcon sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {reservation.store?.address?.street}, {reservation.store?.address?.city}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PhoneIcon sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {reservation.store?.phone || 'Not provided'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EmailIcon sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {reservation.store?.email || 'Not provided'}
                </Typography>
              </Box>
              
              <Button 
                variant="outlined" 
                fullWidth
                startIcon={<LocationOnIcon />}
              >
                Get Directions
              </Button>
            </CardContent>
          </Card>
          
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>What to Bring</Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <CheckIcon color="success" />
                  <Typography variant="body2">
                    Valid government ID (Aadhar, Passport, etc.)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <CheckIcon color="success" />
                  <Typography variant="body2">
                    Proof of address (Utility bill, Bank statement, etc.)
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <CheckIcon color="success" />
                  <Typography variant="body2">
                    Payment confirmation receipt
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <CheckIcon color="success" />
                  <Typography variant="body2">
                    Pet carrier or transportation box
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Pickup Schedule</Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ScheduleIcon sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Monday to Saturday: 9:00 AM - 7:00 PM
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Please arrive at least 30 minutes before closing time.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* QR Code Dialog */}
      <Dialog 
        open={qrDialogOpen} 
        onClose={() => setQrDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>QR Code for Pickup</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <QRCodeSVG 
            value={`reservation:${reservationId}`} 
            size={256} 
            level="H"
          />
          <Typography variant="body1" sx={{ mt: 2, textAlign: 'center' }}>
            Show this QR code at the store for pickup verification
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Reservation Code: {reservation.reservationCode}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default Handover