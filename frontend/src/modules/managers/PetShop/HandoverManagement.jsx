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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckIcon,
  QrCode as QrCodeIcon,
  Refresh as RefreshIcon,
  Pets as PetsIcon,
  Store as StoreIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Chat as ChatIcon,
  Notifications as NotificationsIcon,
  Info as InfoIcon
} from '@mui/icons-material'
import { petShopManagerAPI } from '../../../services/api'

const HandoverManagement = () => {
  const { reservationId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [reservation, setReservation] = useState(null)
  const [error, setError] = useState('')
  const [otp, setOtp] = useState('')
  const [generatingOtp, setGeneratingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [openNotificationDialog, setOpenNotificationDialog] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationMethod, setNotificationMethod] = useState('email')

  useEffect(() => {
    fetchReservation()
  }, [reservationId])

  const fetchReservation = async () => {
    try {
      setLoading(true)
      const response = await petShopManagerAPI.listReservations({ 
        page: 1, 
        limit: 1, 
        reservationId 
      })
      
      if (response.data.data.reservations.length > 0) {
        setReservation(response.data.data.reservations[0])
      } else {
        setError('Reservation not found')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reservation')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateOtp = async () => {
    try {
      setGeneratingOtp(true)
      const response = await petShopManagerAPI.generateHandoverOTP(reservationId)
      setReservation(response.data.data.reservation)
      alert('OTP generated successfully!')
      
      // Send notification to user
      sendNotification('Your pet handover OTP has been generated. Please check your handover details.')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate OTP')
    } finally {
      setGeneratingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    try {
      setVerifyingOtp(true)
      const response = await petShopManagerAPI.verifyHandoverOTP(reservationId, otp)
      setReservation(response.data.data.reservation)
      alert('Handover completed successfully!')
      setOtp('')
      
      // Send notification to user
      sendNotification('Congratulations! Your pet handover has been completed successfully. Enjoy your new companion!')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify OTP')
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleRegenerateOtp = async () => {
    try {
      const response = await petShopManagerAPI.regenerateHandoverOTP(reservationId)
      setReservation(response.data.data.reservation)
      alert('New OTP generated successfully!')
      
      // Send notification to user
      sendNotification('A new OTP has been generated for your pet handover. Please check your handover details.')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to regenerate OTP')
    }
  }

  const sendNotification = async (message) => {
    try {
      // In a real implementation, this would send a notification to the user
      // For now, we'll just show an alert
      console.log(`Notification sent to user: ${message}`)
    } catch (err) {
      console.error('Send notification error:', err)
    }
  }

  const handleOpenNotificationDialog = () => {
    setOpenNotificationDialog(true)
  }

  const handleCloseNotificationDialog = () => {
    setOpenNotificationDialog(false)
    setNotificationMessage('')
  }

  const handleSendCustomNotification = async () => {
    try {
      // In a real implementation, this would send a custom notification to the user
      alert(`Custom notification sent via ${notificationMethod}: ${notificationMessage}`)
      handleCloseNotificationDialog()
    } catch (err) {
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

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/manager/petshop/reservations')}
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
          onClick={() => navigate('/manager/petshop/reservations')}
          sx={{ mb: 2 }}
        >
          Back to Reservations
        </Button>
        <Alert severity="warning">Reservation not found</Alert>
      </Box>
    )
  }

  const handoverSteps = [
    {
      label: 'Reservation Confirmed',
      description: 'Reservation has been approved and payment completed',
      status: ['delivered', 'at_owner'].includes(reservation.status)
    },
    {
      label: 'Handover Scheduled',
      description: 'OTP has been generated for customer verification',
      status: reservation.handover?.status === 'scheduled'
    },
    {
      label: 'Handover Completed',
      description: 'Pet has been successfully handed over to the new owner',
      status: reservation.handover?.status === 'completed'
    }
  ]

  return (
    <Box sx={{ p: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/manager/petshop/reservations')}
        sx={{ mb: 2 }}
      >
        Back to Reservations
      </Button>

      <Typography variant="h4" gutterBottom>
        Handover Management
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
        {/* Reservation Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIcon /> Reservation Details
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Reservation ID</Typography>
                <Typography variant="body1">{reservation._id}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Pet</Typography>
                <Typography variant="body1">
                  {reservation.itemId?.name} ({reservation.itemId?.petCode})
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Customer</Typography>
                <Typography variant="body1">{reservation.userId?.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {reservation.userId?.email}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip 
                  label={reservation.status.replace('_', ' ')} 
                  color={
                    reservation.status === 'delivered' ? 'info' :
                    reservation.status === 'at_owner' ? 'success' : 'default'
                  }
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Handover Status</Typography>
                <Chip 
                  label={reservation.handover?.status ? reservation.handover.status.replace('_', ' ') : 'none'} 
                  color={
                    reservation.handover?.status === 'scheduled' ? 'warning' :
                    reservation.handover?.status === 'completed' ? 'success' : 'default'
                  }
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<NotificationsIcon />}
                  onClick={handleOpenNotificationDialog}
                >
                  Send Notification
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchReservation}
                >
                  Refresh
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

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
                <Typography variant="body2" color="text.secondary">Species</Typography>
                <Typography variant="body1">{reservation.itemId?.speciesId?.name}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Breed</Typography>
                <Typography variant="body1">{reservation.itemId?.breedId?.name}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Price</Typography>
                <Typography variant="body1">₹{reservation.itemId?.price?.toLocaleString()}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Handover Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <QrCodeIcon /> Handover Process
              </Typography>
              
              {reservation.status !== 'delivered' ? (
                <Alert severity="info">
                  Reservation must be marked as "delivered" before handover can begin.
                </Alert>
              ) : (
                <>
                  {reservation.handover?.status === 'none' && (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <QrCodeIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Generate Handover OTP
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Generate a one-time password for the customer to verify handover
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={handleGenerateOtp}
                        disabled={generatingOtp}
                        startIcon={generatingOtp ? <CircularProgress size={20} /> : <QrCodeIcon />}
                      >
                        {generatingOtp ? 'Generating...' : 'Generate OTP'}
                      </Button>
                      
                      <Alert severity="info" sx={{ mt: 3 }}>
                        <Typography variant="body2">
                          <strong>Instructions:</strong>
                          <br />1. Verify customer identity
                          <br />2. Generate OTP for handover
                          <br />3. Provide OTP to customer
                          <br />4. Wait for customer to verify
                        </Typography>
                      </Alert>
                    </Box>
                  )}
                  
                  {reservation.handover?.status === 'scheduled' && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Verify Handover
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Enter the OTP provided by the customer to complete the handover
                      </Typography>
                      
                      <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Current OTP</Typography>
                        <Typography variant="h4" sx={{ fontFamily: 'monospace', textAlign: 'center', py: 1 }}>
                          {reservation.handover?.otpHistory?.[reservation.handover?.otpHistory?.length - 1]?.otp || 'XXXXXX'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                          Generated at: {reservation.handover?.otpHistory?.[reservation.handover?.otpHistory?.length - 1]?.generatedAt 
                            ? new Date(reservation.handover?.otpHistory?.[reservation.handover?.otpHistory?.length - 1]?.generatedAt).toLocaleString() 
                            : 'N/A'}
                        </Typography>
                      </Paper>
                      
                      <TextField
                        fullWidth
                        label="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        sx={{ mb: 2 }}
                      />
                      
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button
                          variant="contained"
                          onClick={handleVerifyOtp}
                          disabled={verifyingOtp || otp.length !== 6}
                          startIcon={verifyingOtp ? <CircularProgress size={20} /> : <CheckIcon />}
                        >
                          {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                        </Button>
                        
                        <Button
                          variant="outlined"
                          onClick={handleRegenerateOtp}
                        >
                          Regenerate OTP
                        </Button>
                      </Box>
                      
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          <strong>Important:</strong> Only complete the handover after verifying the customer's identity 
                          and ensuring all paperwork is completed.
                        </Typography>
                      </Alert>
                    </Box>
                  )}
                  
                  {reservation.handover?.status === 'completed' && (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <CheckIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Handover Completed
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        The pet has been successfully handed over to the new owner.
                      </Typography>
                      <Chip label="Completed" color="success" sx={{ mt: 2 }} />
                      
                      <Box sx={{ mt: 3, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                        <Typography variant="body2">
                          <strong>Next Steps:</strong>
                          <br />1. Provide any remaining documentation
                          <br />2. Offer care instructions
                          <br />3. Schedule follow-up if needed
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Notification Dialog */}
      <Dialog open={openNotificationDialog} onClose={handleCloseNotificationDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsIcon /> Send Notification
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Send a custom notification to the customer about their reservation.
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Notification Method</InputLabel>
              <Select
                value={notificationMethod}
                onChange={(e) => setNotificationMethod(e.target.value)}
                label="Notification Method"
              >
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="sms">SMS</MenuItem>
                <MenuItem value="both">Both Email and SMS</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Message"
              multiline
              rows={4}
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              helperText="Enter your custom message to the customer"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNotificationDialog}>Cancel</Button>
          <Button 
            onClick={handleSendCustomNotification} 
            variant="contained"
            disabled={!notificationMessage.trim()}
          >
            Send Notification
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default HandoverManagement