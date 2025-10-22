import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material'
import { petShopManagerAPI, petShopAPI } from '../../../services/api'
import { QRCodeSVG } from 'qrcode.react'

const ScheduleHandover = () => {
  const { reservationId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [reservation, setReservation] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  
  // Form data
  const [handoverData, setHandoverData] = useState({
    scheduledAt: '',
    location: {
      address: '',
      phone: ''
    },
    notes: ''
  })

  const fetchReservationDetails = async () => {
    try {
      setLoading(true)
      const response = await petShopAPI.getReservationById(reservationId)
      const reservationData = response.data.data.reservation
      
      setReservation(reservationData)
      
      // Set default location to pet shop address
      setHandoverData(prev => ({
        ...prev,
        location: {
          address: reservationData.itemId?.storeName || 'Pet Shop - Main Branch',
          phone: '+91-9876543210'
        }
      }))
    } catch (err) {
      setError('Failed to load reservation details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReservationDetails()
  }, [reservationId])

  const handleInputChange = (field, value) => {
    setHandoverData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLocationChange = (field, value) => {
    setHandoverData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }))
  }

  const validateForm = () => {
    if (!handoverData.scheduledAt) {
      setError('Please select a scheduled date and time')
      return false
    }
    
    if (new Date(handoverData.scheduledAt) <= new Date()) {
      setError('Scheduled date must be in the future')
      return false
    }
    
    if (!handoverData.location.address) {
      setError('Please enter the pickup location')
      return false
    }
    
    if (!handoverData.location.phone) {
      setError('Please enter a contact phone number')
      return false
    }
    
    return true
  }

  const handleScheduleHandover = async () => {
    if (!validateForm()) return
    
    try {
      setProcessing(true)
      setError('')
      
      const payload = {
        scheduledAt: handoverData.scheduledAt,
        location: handoverData.location,
        notes: handoverData.notes
      }
      
      await petShopManagerAPI.scheduleHandover(reservationId, payload)
      
      setSuccess(true)
      // Refresh reservation data
      await fetchReservationDetails()
      
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to schedule handover')
    } finally {
      setProcessing(false)
    }
  }

  const handleRegenerateOTP = async () => {
    try {
      setProcessing(true)
      await petShopManagerAPI.regenerateHandoverOTP(reservationId)
      setSuccess(true)
      // Refresh reservation data
      await fetchReservationDetails()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to regenerate OTP')
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
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!reservation) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Reservation not found</Alert>
      </Box>
    )
  }

  const pet = reservation.itemId
  const isHandoverScheduled = reservation.handover && reservation.handover.status === 'scheduled'

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/manager/petshop/reservations')}
            sx={{ mr: 2 }}
            disabled={processing}
          >
            Back to Reservations
          </Button>
          <Typography variant="h4" component="h1">
            Schedule Handover
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Pet Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Reservation Details</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <img
                    src={pet?.images?.[0]?.url || '/placeholder-pet.svg'}
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
                      <strong>Reservation Code:</strong> {reservation.reservationCode}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Customer:</strong> {reservation.userId?.name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Species:</strong> {pet?.speciesId?.displayName || pet?.speciesId?.name || 'Not specified'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Breed:</strong> {pet?.breedId?.name || 'Not specified'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Price:</strong> ₹{pet?.price?.toLocaleString() || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          {/* Handover Form */}
          {!isHandoverScheduled ? (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Schedule Handover
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Scheduled Date & Time"
                      type="datetime-local"
                      value={handoverData.scheduledAt}
                      onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      disabled={processing}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Pickup Location"
                      value={handoverData.location.address}
                      onChange={(e) => handleLocationChange('address', e.target.value)}
                      placeholder="Enter the pickup location address"
                      disabled={processing}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Contact Phone"
                      value={handoverData.location.phone}
                      onChange={(e) => handleLocationChange('phone', e.target.value)}
                      placeholder="Enter contact phone number"
                      disabled={processing}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notes (Optional)"
                      multiline
                      rows={3}
                      value={handoverData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Any special instructions for the handover..."
                      disabled={processing}
                    />
                  </Grid>
                  
                  {error && (
                    <Grid item xs={12}>
                      <Alert severity="error">{error}</Alert>
                    </Grid>
                  )}
                  
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      startIcon={processing ? <CircularProgress size={20} /> : <ScheduleIcon />}
                      onClick={handleScheduleHandover}
                      disabled={processing}
                      fullWidth
                    >
                      {processing ? 'Scheduling...' : 'Schedule Handover'}
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ) : (
            /* Handover Scheduled */
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <CheckCircle sx={{ mr: 1, verticalAlign: 'middle', color: 'success.main' }} />
                  Handover Scheduled
                </Typography>
                
                <Paper sx={{ p: 2, mb: 2 }}>
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
                    {reservation.handover.notes && (
                      <Grid item xs={12}>
                        <Typography variant="body2">
                          <strong>Notes:</strong> {reservation.handover.notes}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
                
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<QrCodeIcon />}
                    onClick={() => setShowQRCode(true)}
                  >
                    View QR Code
                  </Button>
                  
                  <Button
                    variant="contained"
                    onClick={handleRegenerateOTP}
                    disabled={processing}
                  >
                    {processing ? <CircularProgress size={20} /> : 'Regenerate OTP'}
                  </Button>
                </Box>
                
                {success && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Handover details updated successfully!
                  </Alert>
                )}
                
                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
        
        {/* Right Column - Instructions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Handover Process</Typography>
            
            <ol>
              <li>
                <Typography variant="body2">
                  <strong>Schedule Handover:</strong> Set a date and time for the customer to pick up their pet
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Generate OTP:</strong> A unique 6-digit code is automatically generated for verification
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Notify Customer:</strong> The customer receives the OTP via email/SMS
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Verify at Pickup:</strong> Customer presents the OTP at the pet shop for verification
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>Complete Transfer:</strong> After OTP verification, the pet ownership is officially transferred
                </Typography>
              </li>
            </ol>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Important:</strong> The pet should not be released without proper OTP verification. 
                This ensures secure transfer of ownership.
              </Typography>
            </Alert>
          </Paper>
        </Grid>
      </Grid>
      
      {/* QR Code Dialog */}
      <Dialog open={showQRCode} onClose={() => setShowQRCode(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <QrCodeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Handover QR Code
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Scan this QR code to verify handover details:
            </Typography>
            
            <Box sx={{ p: 2, bgcolor: 'white', display: 'inline-block', borderRadius: 1 }}>
              <QRCodeSVG 
                value={`PETSHOP_HANDOVER:${reservationId}`} 
                size={200} 
              />
            </Box>
            
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              Reservation ID: {reservation.reservationCode}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQRCode(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ScheduleHandover