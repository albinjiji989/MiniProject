import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckIcon,
  QrCode as QrCodeIcon,
  Store as StoreIcon,
  Pets as PetsIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  Chat as ChatIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material'
import { petShopAPI, resolveMediaUrl } from '../../../services/api'

const buildImageUrl = (url) => {
  if (!url) return '/placeholder-pet.svg'
  return resolveMediaUrl(url)
}

const HandoverDetails = () => {
  const { reservationId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [reservation, setReservation] = useState(null)
  const [error, setError] = useState('')
  const [otp, setOtp] = useState('')
  const [openHelpDialog, setOpenHelpDialog] = useState(false)

  useEffect(() => {
    fetchReservation()
  }, [reservationId])

  const fetchReservation = async () => {
    try {
      setLoading(true)
      const response = await petShopAPI.getReservationById(reservationId)
      setReservation(response.data.data.reservation)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reservation')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    try {
      if (!otp || otp.length !== 6) {
        alert('Please enter a valid 6-digit OTP')
        return
      }
      
      // In a real implementation, this would call the backend to verify the OTP
      // For now, we'll just show a success message
      alert('In a real implementation, this would verify the OTP with the backend.')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify OTP')
    }
  }

  const handleContactManager = () => {
    // In a real implementation, this would open a chat or send a message to the manager
    alert('In a real implementation, this would open a chat with the pet shop manager.')
  }

  const handleOpenHelpDialog = () => {
    setOpenHelpDialog(true)
  }

  const handleCloseHelpDialog = () => {
    setOpenHelpDialog(false)
  }

  const handoverSteps = [
    {
      label: 'Reservation Confirmed',
      description: 'Your reservation has been approved and payment completed',
      status: ['delivered', 'at_owner'].includes(reservation?.status)
    },
    {
      label: 'Handover Scheduled',
      description: 'OTP has been generated for your verification',
      status: reservation?.handover?.status === 'scheduled'
    },
    {
      label: 'Handover Completed',
      description: 'Pet has been successfully handed over to you',
      status: reservation?.handover?.status === 'completed'
    }
  ]

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/User/petshop/reservations')}
          sx={{ mb: 2 }}
        >
          Back to Reservations
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!reservation) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/User/petshop/reservations')}
          sx={{ mb: 2 }}
        >
          Back to Reservations
        </Button>
        <Alert severity="warning">Reservation not found</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/User/petshop/reservations')}
        sx={{ mb: 2 }}
      >
        Back to Reservations
      </Button>

      <Typography variant="h4" gutterBottom>
        Pet Handover
      </Typography>

      {/* Handover Progress */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Handover Progress
          </Typography>
          <Stepper activeStep={handoverSteps.findIndex(step => step.status)} orientation="vertical">
            {handoverSteps.map((step, index) => (
              <Step key={index} completed={step.status}>
                <StepLabel>
                  <Typography variant="subtitle1">{step.label}</Typography>
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

      <Grid container spacing={3}>
        {/* Pet Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PetsIcon /> Pet Information
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Pet Name</Typography>
                <Typography variant="body1">{reservation.itemId?.name}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Pet Code</Typography>
                <Typography variant="body1">{reservation.itemId?.petCode}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Price</Typography>
                <Typography variant="body1">₹{reservation.itemId?.price?.toLocaleString()}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Store Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StoreIcon /> Store Information
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Store Name</Typography>
                <Typography variant="body1">{reservation.itemId?.storeId?.name}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Address</Typography>
                <Typography variant="body1">
                  {reservation.itemId?.storeId?.address?.street}, {reservation.itemId?.storeId?.address?.city}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Contact</Typography>
                <Typography variant="body1">{reservation.itemId?.storeId?.phone}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<PhoneIcon />}
                  size="small"
                  onClick={() => alert(`Calling ${reservation.itemId?.storeId?.phone}`)}
                >
                  Call Store
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ChatIcon />}
                  size="small"
                  onClick={handleContactManager}
                >
                  Chat with Manager
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Handover Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIcon /> Handover Status
              </Typography>
              
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                <Chip 
                  label={
                    reservation.handover?.status === 'completed' ? 'Handover Completed' :
                    reservation.handover?.status === 'scheduled' ? 'Ready for Handover' :
                    'Waiting for Store Confirmation'
                  } 
                  color={
                    reservation.handover?.status === 'completed' ? 'success' :
                    reservation.handover?.status === 'scheduled' ? 'warning' : 'info'
                  }
                  sx={{ fontSize: '1.2rem', py: 2, px: 3 }}
                />
              </Box>
              
              {reservation.handover?.status === 'scheduled' ? (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <QrCodeIcon /> Complete Handover
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Visit the store and provide this OTP to the staff to complete the handover process:
                  </Typography>
                  
                  <Paper sx={{ p: 3, textAlign: 'center', mb: 3 }}>
                    <Typography variant="h3" sx={{ fontFamily: 'monospace', letterSpacing: 5 }}>
                      {reservation.handover?.otpHistory?.[reservation.handover?.otpHistory?.length - 1]?.otp || 'XXXXXX'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      This OTP is valid for one-time use only
                    </Typography>
                  </Paper>
                  
                  <TextField
                    fullWidth
                    label="Enter OTP for Verification (Optional)"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    sx={{ mb: 2 }}
                    helperText="You can verify the OTP here before visiting the store"
                  />
                  
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleVerifyOtp}
                      disabled={!otp || otp.length !== 6}
                      startIcon={<CheckIcon />}
                    >
                      Verify OTP
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleOpenHelpDialog}
                      startIcon={<InfoIcon />}
                    >
                      Handover Instructions
                    </Button>
                  </Box>
                  
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Handover Instructions:</strong>
                      <br />1. Arrive at the store during business hours
                      <br />2. Present this OTP to the staff member
                      <br />3. Complete any remaining paperwork
                      <br />4. Take your new pet home!
                    </Typography>
                  </Alert>
                </Box>
              ) : reservation.handover?.status === 'completed' ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CheckIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Handover Completed Successfully!
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Congratulations! Your pet is now officially yours. Enjoy your new companion!
                  </Typography>
                  <Chip label="Completed" color="success" sx={{ mt: 2 }} />
                  
                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      onClick={() => navigate('/User/dashboard')}
                    >
                      Go to Dashboard
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CircularProgress sx={{ mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Waiting for Store Confirmation
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    The store is preparing your pet for handover. You'll receive an OTP once everything is ready.
                  </Typography>
                  
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={fetchReservation}
                    >
                      Refresh Status
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ChatIcon />}
                      onClick={handleContactManager}
                    >
                      Contact Manager
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Help Dialog */}
      <Dialog open={openHelpDialog} onClose={handleCloseHelpDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon /> Handover Instructions
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
              How to Complete Your Pet Handover
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckIcon color="success" /> Before You Visit
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Bring a valid ID for verification
                <br />• Print or save the OTP on your phone
                <br />• Arrive during business hours
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <StoreIcon color="primary" /> At the Store
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Present your OTP to the staff member
                <br />• Complete any remaining paperwork
                <br />• Review care instructions for your new pet
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PetsIcon color="secondary" /> After Handover
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Take your new pet home!
                <br />• Follow the care instructions provided
                <br />• Contact the store if you have any questions
              </Typography>
            </Box>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Need help?</strong> Contact the pet shop manager at any time during the process.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHelpDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default HandoverDetails