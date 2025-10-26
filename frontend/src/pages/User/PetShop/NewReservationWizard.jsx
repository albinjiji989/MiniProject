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
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Paper,
  Chip,
  IconButton,
  Avatar
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Pets as PetIcon,
  Store as StoreIcon,
  Home as HomeIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material'
import { petShopAPI, resolveMediaUrl } from '../../../services/api'
import { useAuth } from '../../../contexts/AuthContext'

const NewReservationWizard = () => {
  const { petId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [pet, setPet] = useState(null)
  const [error, setError] = useState('')
  const [activeStep, setActiveStep] = useState(0)
  const [reservationType, setReservationType] = useState('visit') // 'visit' or 'delivery'
  const [contactInfo, setContactInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  })
  const [visitDetails, setVisitDetails] = useState({
    preferredDate: '',
    preferredTime: '',
    notes: ''
  })
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: user?.phone || ''
  })
  const [communicationPreferences, setCommunicationPreferences] = useState({
    preferredMethod: 'both', // 'phone', 'email', 'both'
    notificationFrequency: 'immediate' // 'immediate', 'daily', 'weekly'
  })
  const [reservationId, setReservationId] = useState(null)
  const [reservationCode, setReservationCode] = useState(null)

  const steps = [
    'Contact Information',
    'Reservation Type',
    'Communication Preferences',
    'Review & Confirm',
    'Confirmation'
  ]

  const fetchPetDetails = async () => {
    try {
      setLoading(true)
      const response = await petShopAPI.getPublicListing(petId)
      setPet(response.data.data.item)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pet details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPetDetails()
  }, [petId])

  const handleNext = () => {
    setError('')
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setActiveStep(prev => prev - 1)
    setError('')
  }

  const validateStep = (step) => {
    switch (step) {
      case 0: // Contact Information
        if (!contactInfo.name) {
          setError('Please enter your full name')
          return false
        }
        if (!contactInfo.email) {
          setError('Please enter your email address')
          return false
        }
        if (!/\S+@\S+\.\S+/.test(contactInfo.email)) {
          setError('Please enter a valid email address')
          return false
        }
        if (!contactInfo.phone) {
          setError('Please enter your phone number')
          return false
        }
        if (contactInfo.phone.length < 10) {
          setError('Please enter a valid phone number')
          return false
        }
        return true
      case 1: // Reservation Type
        // Always valid since we're removing delivery option
        return true
      case 2: // Communication Preferences
        return true
      case 3: // Review & Confirm
        return true
      default:
        return true
    }
  }

  const handleContactInfoChange = (field) => (event) => {
    setContactInfo(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  const handleVisitDetailsChange = (field) => (event) => {
    setVisitDetails(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  const handleDeliveryAddressChange = (field) => (event) => {
    setDeliveryAddress(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  const handleCommunicationPreferenceChange = (field) => (event) => {
    setCommunicationPreferences(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  const createReservation = async () => {
    try {
      setLoading(true)
      setError('')
      
      const reservationData = {
        itemId: petId,
        contactInfo: {
          ...contactInfo,
          preferredContactMethod: communicationPreferences.preferredMethod
        },
        reservationType: 'reservation',
        visitDetails: reservationType === 'visit' ? visitDetails : undefined,
        deliveryAddress: reservationType === 'delivery' ? deliveryAddress : undefined,
        notes: visitDetails.notes
      }

      const response = await petShopAPI.createPurchaseReservation(reservationData)
      setReservationId(response.data.data.reservation._id)
      setReservationCode(response.data.data.reservation.reservationCode || response.data.data.reservation._id?.slice(-8) || 'N/A')
      
      setActiveStep(4) // Move to confirmation step
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create reservation. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (loading) {
      return
    }
    
    try {
      await createReservation()
    } catch (err) {
      console.error('Failed to confirm reservation:', err)
    }
  }

  const handleGoToPayment = () => {
    navigate(`/User/petshop/payment/${reservationId}`)
  }

  const handleViewReservation = () => {
    navigate(`/User/petshop/reservation/${reservationId}`)
  }

  const buildImageUrl = (url) => {
    if (!url) return '/placeholder-pet.svg'
    if (/^data:image\//i.test(url)) return url
    if (/^https?:\/\//i.test(url)) return url
    return resolveMediaUrl(url)
  }

  const renderContactInfoStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
          Contact Information
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          We'll use this information to contact you about your reservation and send you confirmation details.
        </Alert>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Full Name"
              value={contactInfo.name}
              onChange={handleContactInfoChange('name')}
              required
              helperText="Please enter your full name"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={contactInfo.email}
              onChange={handleContactInfoChange('email')}
              required
              helperText="We'll send your reservation confirmation to this email"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number"
              type="tel"
              value={contactInfo.phone}
              onChange={handleContactInfoChange('phone')}
              required
              helperText="We'll use this to contact you about your reservation"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Address (Optional)"
              value={contactInfo.address}
              onChange={handleContactInfoChange('address')}
              multiline
              rows={2}
              helperText="Your home address for delivery purposes (if applicable)"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )

  const renderReservationTypeStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Reservation Type
        </Typography>
        
        <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center', mb: 3 }}>
          <StoreIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            Visit Store
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You will need to visit the store to complete your purchase and pick up your pet.
          </Typography>
          <Chip 
            label="Default Option" 
            color="primary" 
            size="small" 
            sx={{ mt: 2 }} 
          />
        </Box>
        
        <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 2, border: '1px solid #ff9800' }}>
          <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <HomeIcon /> Home Delivery
          </Typography>
          <Typography variant="body1">
            Home delivery is coming soon! For now, please visit the store to pick up your pet.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Visit Store Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Preferred Date"
                type="date"
                value={visitDetails.preferredDate}
                onChange={handleVisitDetailsChange('preferredDate')}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Preferred Time"
                type="time"
                value={visitDetails.preferredTime}
                onChange={handleVisitDetailsChange('preferredTime')}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes (Optional)"
                multiline
                rows={3}
                value={visitDetails.notes}
                onChange={handleVisitDetailsChange('notes')}
              />
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  )

  const renderCommunicationPreferencesStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>Communication Preferences</Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          Choose how you'd like to be notified about your reservation status and updates.
        </Alert>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Preferred Contact Method</Typography>
            <FormControl component="fieldset">
              <RadioGroup 
                value={communicationPreferences.preferredMethod} 
                onChange={handleCommunicationPreferenceChange('preferredMethod')}
              >
                <FormControlLabel 
                  value="phone" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon fontSize="small" />
                      <span>Phone Call</span>
                    </Box>
                  } 
                />
                <FormControlLabel 
                  value="email" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon fontSize="small" />
                      <span>Email</span>
                    </Box>
                  } 
                />
                <FormControlLabel 
                  value="both" 
                  control={<Radio />} 
                  label="Both Phone and Email" 
                />
              </RadioGroup>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Notification Frequency</Typography>
            <FormControl component="fieldset">
              <RadioGroup 
                value={communicationPreferences.notificationFrequency} 
                onChange={handleCommunicationPreferenceChange('notificationFrequency')}
              >
                <FormControlLabel value="immediate" control={<Radio />} label="Immediate Updates" />
                <FormControlLabel value="daily" control={<Radio />} label="Daily Summary" />
                <FormControlLabel value="weekly" control={<Radio />} label="Weekly Summary" />
              </RadioGroup>
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )

  const renderReviewStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>Review Your Reservation</Typography>
        
        <Grid container spacing={3}>
          {/* Pet Information */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Pet Information</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {pet?.images && pet.images.length > 0 ? (
                  <CardMedia
                    component="img"
                    image={buildImageUrl(pet.images[0]?.url || pet.images[0])}
                    alt={pet.name}
                    sx={{ width: 60, height: 60, borderRadius: 1, objectFit: 'cover' }}
                  />
                ) : (
                  <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>
                    <PetIcon />
                  </Avatar>
                )}
                <Box>
                  <Typography variant="body1">{pet?.name || 'Loading...'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pet?.breed?.name || 'Breed not specified'} • {pet?.gender} • {pet?.age} {pet?.ageUnit}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          {/* Contact Information */}
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Contact Information</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Name:</strong> {contactInfo.name}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Email:</strong> {contactInfo.email}
              </Typography>
              <Typography variant="body2">
                <strong>Phone:</strong> {contactInfo.phone}
              </Typography>
              {contactInfo.address && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Address:</strong> {contactInfo.address}
                </Typography>
              )}
            </Paper>
          </Grid>
          
          {/* Reservation Details */}
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Reservation Details</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StoreIcon sx={{ mr: 1, color: '#1976d2' }} />
                <Typography variant="body1">
                  Store Visit
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Preferred Date:</strong> {visitDetails.preferredDate ? new Date(visitDetails.preferredDate).toLocaleDateString() : 'Not specified'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Preferred Time:</strong> {visitDetails.preferredTime || 'Not specified'}
              </Typography>
              
              {visitDetails.notes && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Notes:</strong> {visitDetails.notes}
                </Typography>
              )}
            </Paper>
          </Grid>
          
          {/* Communication Preferences */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Communication Preferences</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Preferred Contact Method:</strong> {
                  communicationPreferences.preferredMethod === 'phone' ? 'Phone Call' :
                  communicationPreferences.preferredMethod === 'email' ? 'Email' : 'Both Phone and Email'
                }
              </Typography>
              <Typography variant="body2">
                <strong>Notification Frequency:</strong> {
                  communicationPreferences.notificationFrequency === 'immediate' ? 'Immediate Updates' :
                  communicationPreferences.notificationFrequency === 'daily' ? 'Daily Summary' : 'Weekly Summary'
                }
              </Typography>
            </Paper>
          </Grid>
          
          {/* Next Steps Information */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>What Happens Next?</Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>After Confirmation:</strong>
                <br />1. Our pet shop manager will review your reservation (1-2 business days)
                <br />2. You'll receive an email/SMS with approval status
                <br />3. Visit the store to check the pet and decide to purchase or cancel
                <br />4. If purchasing, make online payment
                <br />5. Complete handover with OTP at the store
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )

  const renderConfirmationStep = () => (
    <Card>
      <CardContent>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <CheckIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" sx={{ mb: 2, color: 'success.main' }}>
            Reservation Confirmed!
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Your reservation has been successfully created. 
          </Typography>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>Finalizing your reservation...</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Reservation Details */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentIcon /> Reservation Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Reservation ID</Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {reservationCode || reservationId?.slice(-8) || 'Loading...'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      This is your reservation code. Please keep it for your records.
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Pet Name</Typography>
                    <Typography variant="body1">{pet?.name || 'Loading...'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Current Status</Typography>
                    <Chip label="Pending Manager Review" color="warning" size="small" />
                  </Grid>
                </Grid>
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>What happens next?</strong>
                    <br />• Our pet shop manager will review your reservation within 1-2 business days
                    <br />• You'll receive email/SMS notifications on status updates based on your preferences
                    <br />• Visit the store to check the pet and decide to purchase or cancel
                    <br />• If purchasing, complete online payment to confirm purchase
                  </Typography>
                </Alert>
              </Paper>
            </Grid>
            
            {/* Status Information */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon /> Reservation Timeline
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.main', width: 24, height: 24, fontSize: 14 }}>1</Avatar>
                    <Box>
                      <Typography variant="subtitle2">Reservation Created</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Just now by you
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'warning.main', width: 24, height: 24, fontSize: 14 }}>2</Avatar>
                    <Box>
                      <Typography variant="subtitle2">Manager Review</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pending - Pet shop manager will review your request (1-2 business days)
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'grey.400', width: 24, height: 24, fontSize: 14 }}>3</Avatar>
                    <Box>
                      <Typography variant="subtitle2">Store Visit</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Visit the store to check the pet and decide to purchase or cancel
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'grey.400', width: 24, height: 24, fontSize: 14 }}>4</Avatar>
                    <Box>
                      <Typography variant="subtitle2">Payment & Confirmation</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Complete payment to confirm your purchase
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'grey.400', width: 24, height: 24, fontSize: 14 }}>5</Avatar>
                    <Box>
                      <Typography variant="subtitle2">Pet Handover</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Final step - Take your new pet home!
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
        
        {!loading && (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleViewReservation}
            >
              View Reservation Details
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/User/petshop')}
            >
              Back to Pet Shop
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  )

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderContactInfoStep()
      case 1:
        return renderReservationTypeStep()
      case 2:
        return renderCommunicationPreferencesStep()
      case 3:
        return renderReviewStep()
      case 4:
        return renderConfirmationStep()
      default:
        return renderContactInfoStep()
    }
  }

  return (
    <Box sx={{ p: 2, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Reserve Your Pet
        </Typography>
      </Box>

      {pet && (
        <Card sx={{ mb: 3, bgcolor: 'background.default' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {pet.images && pet.images.length > 0 ? (
                <CardMedia
                  component="img"
                  image={buildImageUrl(pet.images[0]?.url || pet.images[0])}
                  alt={pet.name}
                  sx={{ width: 80, height: 80, borderRadius: 1, objectFit: 'cover' }}
                />
              ) : (
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
                  <PetIcon sx={{ fontSize: 40 }} />
                </Avatar>
              )}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {pet.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {pet.breed?.name || 'Breed not specified'} • {pet.gender} • {pet.age} {pet.ageUnit}
                </Typography>
                <Chip 
                  label={`₹${pet.price?.toLocaleString() || 'Price not set'}`} 
                  color="primary" 
                  size="small" 
                  sx={{ mt: 1 }}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {loading && activeStep !== 4 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {renderStepContent()}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="outlined"
                >
                  Back
                </Button>

                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={() => navigate('/User/petshop')}
                  >
                    Return to Pet Shop
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={activeStep === steps.length - 2 ? handleConfirm : handleNext}
                    disabled={loading}
                  >
                    {activeStep === steps.length - 2 ? 'Confirm Reservation' : 'Next'}
                  </Button>
                )}
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default NewReservationWizard