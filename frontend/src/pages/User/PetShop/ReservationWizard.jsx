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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Avatar,
  Stack
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Pets as PetIcon,
  Store as StoreIcon,
  Home as HomeIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckIcon,
  LocalShipping as DeliveryIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  QrCode as QrCodeIcon,
  Storefront as StorefrontIcon,
  OnlinePrediction as OnlineIcon,
  OfflinePin as OfflineIcon,
  AccessTime as TimeIcon,
  Notifications as NotificationIcon,
  Chat as ChatIcon
} from '@mui/icons-material'
import { petShopAPI } from '../../../services/api'
import { useAuth } from '../../../contexts/AuthContext'

const ReservationWizard = () => {
  const { petId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [pet, setPet] = useState(null)
  const [error, setError] = useState('')
  const [activeStep, setActiveStep] = useState(0)
  const [purchaseMethod, setPurchaseMethod] = useState('online') // 'online' or 'offline'
  const [reservationType, setReservationType] = useState('visit') // 'visit' or 'delivery'
  const [contactInfo, setContactInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '', // Try to get phone from user object if available
    address: user?.address || '' // Try to get address from user object if available
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
    phone: user?.phone || '' // Default to user's phone if available
  })
  const [reservationId, setReservationId] = useState(null)
  const [reservationCode, setReservationCode] = useState(null)
  const [storeId, setStoreId] = useState(null)
  const [showOfflineInstructions, setShowOfflineInstructions] = useState(false)
  const [qrCodeData, setQrCodeData] = useState(null)
  const [communicationPreferences, setCommunicationPreferences] = useState({
    preferredMethod: 'both', // 'phone', 'email', 'both'
    notificationFrequency: 'immediate' // 'immediate', 'daily', 'weekly'
  })

  const steps = [
    'Choose Purchase Method',
    'Provide Contact Information',
    'Select Reservation Type',
    'Communication Preferences',
    'Review & Confirm',
    'Confirmation'
  ]

  const fetchPetDetails = async () => {
    try {
      setLoading(true)
      const response = await petShopAPI.getPublicListing(petId)
      setPet(response.data.data.item)
      setStoreId(response.data.data.item.storeId)
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
    setError('') // Clear any previous errors
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1)
    }
    // If validation fails, the validateStep function will set the error message
  }

  const handleBack = () => {
    setActiveStep(prev => prev - 1)
    setError('') // Clear any errors when going back
  }

  const validateStep = (step) => {
    switch (step) {
      case 0: // Choose Purchase Method
        return purchaseMethod
      case 1: // Contact Information
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
      case 2: // Reservation Type
        if (purchaseMethod === 'online') {
          if (reservationType === 'visit') {
            if (!visitDetails.preferredDate) {
              setError('Please select a preferred date')
              return false
            }
            if (!visitDetails.preferredTime) {
              setError('Please select a preferred time')
              return false
            }
            return true
          } else {
            if (!deliveryAddress.street) {
              setError('Please enter your street address')
              return false
            }
            if (!deliveryAddress.city) {
              setError('Please enter your city')
              return false
            }
            if (!deliveryAddress.state) {
              setError('Please enter your state')
              return false
            }
            if (!deliveryAddress.zipCode) {
              setError('Please enter your ZIP code')
              return false
            }
            if (!deliveryAddress.phone) {
              setError('Please enter a contact phone number for delivery')
              return false
            }
            if (deliveryAddress.phone.length < 10) {
              setError('Please enter a valid phone number for delivery')
              return false
            }
            return true
          }
        }
        return true
      case 3: // Communication Preferences
        return true
      case 4: // Review & Confirm
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
      
      // Format reservation data to match backend schema
      const reservationData = {
        itemId: petId,
        contactInfo: {
          ...contactInfo,
          preferredContactMethod: communicationPreferences.preferredMethod
        },
        reservationType: purchaseMethod === 'online' ? 'online_booking' : 'offline_verification',
        visitDetails: reservationType === 'visit' ? visitDetails : undefined,
        deliveryAddress: reservationType === 'delivery' ? deliveryAddress : undefined,
        notes: visitDetails.notes
      }

      const response = await petShopAPI.createPurchaseReservation(reservationData)
      setReservationId(response.data.data.reservation._id)
      setReservationCode(response.data.data.reservation.reservationCode)
      
      // For offline method, generate QR code data
      if (purchaseMethod === 'offline') {
        const qrData = {
          reservationId: response.data.data.reservation._id,
          reservationCode: response.data.data.reservation.reservationCode,
          petName: pet?.name,
          petCode: pet?.petCode,
          price: pet?.price,
          storeId: storeId,
          userId: user?._id,
          timestamp: new Date().toISOString()
        }
        setQrCodeData(qrData)
      }
      
      setActiveStep(5)
    } catch (err) {
      console.error('Reservation error:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create reservation. Please try again.'
      setError(errorMessage)
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (purchaseMethod === 'online') {
      // For online method, create reservation and proceed to payment
      await createReservation()
    } else {
      // For offline method, create reservation and show QR code
      await createReservation()
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
    const apiBase = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || ''
    const origin = apiBase.replace(/\/?api\/?$/, '')
    return `${origin}${url.startsWith('/') ? '' : '/'}${url}`
  }

  const renderChooseMethodStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
          Choose Your Purchase Method
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          Select how you'd like to complete your pet purchase. Both methods are secure and supported by our pet shop.
        </Alert>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                height: '100%', 
                cursor: 'pointer',
                border: purchaseMethod === 'online' ? '2px solid #1976d2' : '1px solid #e0e0e0',
                '&:hover': { boxShadow: 3 }
              }}
              onClick={() => setPurchaseMethod('online')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <OnlineIcon sx={{ fontSize: 40, color: '#1976d2', mr: 2 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Online Purchase
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Complete your purchase through our secure online platform
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ pl: 6 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <CheckIcon sx={{ fontSize: 16, color: 'success.main', mr: 1, verticalAlign: 'middle' }} />
                    Secure online payment
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <CheckIcon sx={{ fontSize: 16, color: 'success.main', mr: 1, verticalAlign: 'middle' }} />
                    Home delivery or store pickup
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <CheckIcon sx={{ fontSize: 16, color: 'success.main', mr: 1, verticalAlign: 'middle' }} />
                    Real-time order tracking
                  </Typography>
                  <Typography variant="body2">
                    <CheckIcon sx={{ fontSize: 16, color: 'success.main', mr: 1, verticalAlign: 'middle' }} />
                    Instant confirmation
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                height: '100%', 
                cursor: 'pointer',
                border: purchaseMethod === 'offline' ? '2px solid #4caf50' : '1px solid #e0e0e0',
                '&:hover': { boxShadow: 3 }
              }}
              onClick={() => setPurchaseMethod('offline')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <OfflineIcon sx={{ fontSize: 40, color: '#4caf50', mr: 2 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Offline Purchase
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Visit the store in person to complete your purchase
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ pl: 6 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <CheckIcon sx={{ fontSize: 16, color: 'success.main', mr: 1, verticalAlign: 'middle' }} />
                    In-person consultation
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <CheckIcon sx={{ fontSize: 16, color: 'success.main', mr: 1, verticalAlign: 'middle' }} />
                    Immediate pet pickup
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <CheckIcon sx={{ fontSize: 16, color: 'success.main', mr: 1, verticalAlign: 'middle' }} />
                    Cash or card payment at store
                  </Typography>
                  <Typography variant="body2">
                    <CheckIcon sx={{ fontSize: 16, color: 'success.main', mr: 1, verticalAlign: 'middle' }} />
                    Personal assistance
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Online Purchase:</strong> Complete the entire process digitally with secure payment options.
            <br />
            <strong>Offline Purchase:</strong> Reserve the pet online and visit the store to complete the purchase in person.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  )

  const renderContactInfoStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
          Contact Information
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          We'll use this information to contact you about your reservation and send you confirmation details. All information is kept confidential.
        </Alert>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Full Name"
              value={contactInfo.name}
              onChange={handleContactInfoChange('name')}
              required
              helperText="Please enter your full name as it appears on your ID"
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
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>Choose Reservation Type</Typography>
        
        {purchaseMethod === 'online' ? (
          <>
            <Alert severity="info" sx={{ mb: 3 }}>
              With online purchase, you can complete the entire process digitally and choose between store pickup or home delivery.
            </Alert>
            
            <FormControl component="fieldset" sx={{ width: '100%' }}>
              <RadioGroup value={reservationType} onChange={(e) => setReservationType(e.target.value)}>
                <Card 
                  sx={{ 
                    mb: 2, 
                    border: reservationType === 'visit' ? '2px solid #1976d2' : '1px solid #e0e0e0',
                    cursor: 'pointer'
                  }}
                  onClick={() => setReservationType('visit')}
                >
                  <CardContent>
                    <FormControlLabel 
                      value="visit" 
                      control={<Radio />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <StoreIcon sx={{ color: '#1976d2' }} />
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              Visit Store
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Pick up your pet from the store after payment
                            </Typography>
                          </Box>
                        </Box>
                      }
                      sx={{ width: '100%', mr: 0 }}
                    />
                    
                    {reservationType === 'visit' && (
                      <Box sx={{ pl: 6, pt: 2 }}>
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
                              value={visitDetails.notes}
                              onChange={handleVisitDetailsChange('notes')}
                              multiline
                              rows={2}
                              helperText="Any special requests or information you'd like to share"
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </CardContent>
                </Card>
                
                <Card 
                  sx={{ 
                    border: reservationType === 'delivery' ? '2px solid #4caf50' : '1px solid #e0e0e0',
                    cursor: 'pointer'
                  }}
                  onClick={() => setReservationType('delivery')}
                >
                  <CardContent>
                    <FormControlLabel 
                      value="delivery" 
                      control={<Radio />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <HomeIcon sx={{ color: '#4caf50' }} />
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              Home Delivery
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              We'll deliver your pet to your home (additional charges may apply)
                            </Typography>
                          </Box>
                        </Box>
                      }
                      sx={{ width: '100%', mr: 0 }}
                    />
                    
                    {reservationType === 'delivery' && (
                      <Box sx={{ pl: 6, pt: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Street Address"
                              value={deliveryAddress.street}
                              onChange={handleDeliveryAddressChange('street')}
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="City"
                              value={deliveryAddress.city}
                              onChange={handleDeliveryAddressChange('city')}
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="State"
                              value={deliveryAddress.state}
                              onChange={handleDeliveryAddressChange('state')}
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="ZIP Code"
                              value={deliveryAddress.zipCode}
                              onChange={handleDeliveryAddressChange('zipCode')}
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Phone Number"
                              value={deliveryAddress.phone}
                              onChange={handleDeliveryAddressChange('phone')}
                              required
                              helperText="Contact number for delivery coordination"
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </RadioGroup>
            </FormControl>
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <StorefrontIcon sx={{ fontSize: 60, color: '#4caf50', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>
              Offline Purchase - Store Visit
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              You'll visit the store in person to complete your purchase. 
              After confirming your reservation, you'll receive a QR code to present at the store.
            </Typography>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Next Steps:</strong>
                <br />1. Confirm your reservation
                <br />2. Receive your QR code via email/SMS
                <br />3. Visit the store with the QR code
                <br />4. Complete the purchase in person
              </Typography>
            </Alert>
          </Box>
        )}
      </CardContent>
    </Card>
  )

  const renderCommunicationPreferencesStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
          Communication Preferences
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          How would you like to be notified about your reservation updates?
        </Alert>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Preferred Contact Method</Typography>
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
                        <PhoneIcon />
                        <span>Phone Call</span>
                      </Box>
                    } 
                  />
                  <FormControlLabel 
                    value="email" 
                    control={<Radio />} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon />
                        <span>Email</span>
                      </Box>
                    } 
                  />
                  <FormControlLabel 
                    value="both" 
                    control={<Radio />} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ChatIcon />
                        <span>Both Phone and Email</span>
                      </Box>
                    } 
                  />
                </RadioGroup>
              </FormControl>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Notification Frequency</Typography>
              <FormControl component="fieldset">
                <RadioGroup 
                  value={communicationPreferences.notificationFrequency} 
                  onChange={handleCommunicationPreferenceChange('notificationFrequency')}
                >
                  <FormControlLabel 
                    value="immediate" 
                    control={<Radio />} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NotificationIcon />
                        <span>Immediate Updates</span>
                        <Chip label="Recommended" size="small" color="primary" sx={{ ml: 1 }} />
                      </Box>
                    } 
                  />
                  <FormControlLabel 
                    value="daily" 
                    control={<Radio />} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TimeIcon />
                        <span>Daily Summary</span>
                      </Box>
                    } 
                  />
                  <FormControlLabel 
                    value="weekly" 
                    control={<Radio />} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon />
                        <span>Weekly Summary</span>
                      </Box>
                    } 
                  />
                </RadioGroup>
              </FormControl>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )

  const renderReviewStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>Review Your Reservation</Typography>
        
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please review all information carefully before confirming your reservation. You can make changes by going back to previous steps.
        </Alert>
        
        <Grid container spacing={3}>
          {/* Pet Information */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Pet Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  {pet?.images?.length > 0 ? (
                    <CardMedia
                      component="img"
                      height={100}
                      image={buildImageUrl((pet.images.find(i=>i.isPrimary)?.url) || pet.images[0]?.url)}
                      alt={pet.name}
                      sx={{ borderRadius: 1 }}
                    />
                  ) : (
                    <Box sx={{ 
                      width: '100%', 
                      height: 100, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      bgcolor: 'grey.100',
                      borderRadius: 1
                    }}>
                      <PetIcon sx={{ fontSize: 40, color: 'grey.400' }} />
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} sm={9}>
                  <Typography variant="h6">{pet?.name || 'Pet'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pet?.petCode} • {pet?.speciesId?.name} • {pet?.breedId?.name}
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                    ₹{Number(pet?.price || 0).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Purchase Method */}
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Purchase Method</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {purchaseMethod === 'online' ? (
                  <OnlineIcon sx={{ mr: 1, color: '#1976d2' }} />
                ) : (
                  <OfflineIcon sx={{ mr: 1, color: '#4caf50' }} />
                )}
                <Typography variant="body1">
                  {purchaseMethod === 'online' ? 'Online Purchase' : 'Offline Purchase'}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {purchaseMethod === 'online' 
                  ? 'Complete purchase through our secure online platform' 
                  : 'Visit the store in person to complete your purchase'}
              </Typography>
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
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                {purchaseMethod === 'online' ? 'Reservation Details' : 'Store Visit Details'}
              </Typography>
              
              {purchaseMethod === 'online' ? (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {reservationType === 'visit' ? (
                      <StoreIcon sx={{ mr: 1, color: '#1976d2' }} />
                    ) : (
                      <HomeIcon sx={{ mr: 1, color: '#4caf50' }} />
                    )}
                    <Typography variant="body1">
                      {reservationType === 'visit' ? 'Store Visit' : 'Home Delivery'}
                    </Typography>
                  </Box>
                  
                  {reservationType === 'visit' ? (
                    <>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Preferred Date:</strong> {visitDetails.preferredDate ? new Date(visitDetails.preferredDate).toLocaleDateString() : 'Not specified'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Preferred Time:</strong> {visitDetails.preferredTime || 'Not specified'}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Delivery Address:</strong> {deliveryAddress.street}, {deliveryAddress.city}, {deliveryAddress.state} - {deliveryAddress.zipCode}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Delivery Phone:</strong> {deliveryAddress.phone}
                      </Typography>
                    </>
                  )}
                  
                  {visitDetails.notes && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Notes:</strong> {visitDetails.notes}
                    </Typography>
                  )}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <StorefrontIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                  <Typography variant="body1">
                    You'll visit the store in person to complete your purchase
                  </Typography>
                </Box>
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
                <br />3. {purchaseMethod === 'online' ? 'Complete payment to confirm purchase' : 'Visit the store with your QR code'}
                <br />4. Finalize the handover process with our staff
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
                    {reservationCode || reservationId?.slice(-8)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Pet Name</Typography>
                  <Typography variant="body1">{pet?.name}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Purchase Method</Typography>
                  <Typography variant="body1">
                    {purchaseMethod === 'online' ? 'Online Purchase' : 'Offline Purchase'}
                  </Typography>
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
                  <br />• {purchaseMethod === 'online' ? 'Complete payment to confirm purchase' : 'Visit the store with the QR code to complete purchase'}
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
                    <Typography variant="subtitle2">
                      {purchaseMethod === 'online' ? 'Payment & Confirmation' : 'Store Visit'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {purchaseMethod === 'online' 
                        ? 'Complete payment to confirm your purchase' 
                        : 'Visit the store with your QR code'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'grey.400', width: 24, height: 24, fontSize: 14 }}>4</Avatar>
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
          
          {/* QR Code for Offline Purchase */}
          {purchaseMethod === 'offline' && qrCodeData && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <QrCodeIcon /> Your QR Code
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Present this QR code at the store to complete your purchase
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <Box 
                    sx={{ 
                      width: 200, 
                      height: 200, 
                      border: '1px solid #e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: '#f5f5f5'
                    }}
                  >
                    <QrCodeIcon sx={{ fontSize: 100, color: '#616161' }} />
                  </Box>
                </Box>
                
                <Button 
                  variant="outlined" 
                  startIcon={<QrCodeIcon />}
                  sx={{ mt: 2 }}
                  onClick={() => setShowOfflineInstructions(true)}
                >
                  View Offline Purchase Instructions
                </Button>
              </Paper>
            </Grid>
          )}
        </Grid>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3, flexWrap: 'wrap' }}>
          {purchaseMethod === 'online' ? (
            <>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<PaymentIcon />}
                onClick={handleGoToPayment}
              >
                Proceed to Payment
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={handleViewReservation}
              >
                View Reservation Details
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<StorefrontIcon />}
                onClick={() => navigate('/User/petshop/my-reservations')}
              >
                View My Reservations
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/User/dashboard')}
              >
                Go to Dashboard
              </Button>
            </>
          )}
        </Box>
        
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Important:</strong> Once your reservation is approved by the pet shop manager, 
            you'll receive an email with further instructions. For offline purchases, you'll need to 
            visit the store with the provided QR code. For online purchases, you'll need to complete 
            the payment process before the handover can be scheduled.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  )

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
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Reserve Your Pet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Complete your reservation in just a few simple steps
          </Typography>
        </Box>
      </Box>

      {/* Progress Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel>
              <Typography variant="body2" sx={{ fontWeight: activeStep === index ? 'bold' : 'normal' }}>
                {label}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Step Content */}
      {activeStep === 0 && renderChooseMethodStep()}
      {activeStep === 1 && renderContactInfoStep()}
      {activeStep === 2 && renderReservationTypeStep()}
      {activeStep === 3 && renderCommunicationPreferencesStep()}
      {activeStep === 4 && renderReviewStep()}
      {activeStep === 5 && renderConfirmationStep()}

      {/* Navigation Buttons */}
      {activeStep < 5 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<BackIcon />}
          >
            Back
          </Button>
          
          {activeStep === 4 ? (
            <Button
              variant="contained"
              onClick={handleConfirm}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
            >
              {loading ? 'Processing...' : 'Confirm Reservation'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
            >
              Next
            </Button>
          )}
        </Box>
      )}

      {/* Offline Purchase Instructions Dialog */}
      <Dialog open={showOfflineInstructions} onClose={() => setShowOfflineInstructions(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StorefrontIcon /> Offline Purchase Instructions
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>How to Complete Your Offline Purchase</Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2, mt: 0.5 }}>1</Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Visit the Store</Typography>
                <Typography variant="body2" color="text.secondary">
                  Go to the pet shop where you reserved the pet. Bring a valid ID for verification.
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2, mt: 0.5 }}>2</Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Present Your QR Code</Typography>
                <Typography variant="body2" color="text.secondary">
                  Show the QR code from your reservation confirmation on your mobile device or print it out.
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2, mt: 0.5 }}>3</Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Complete the Purchase</Typography>
                <Typography variant="body2" color="text.secondary">
                  Pay for the pet using cash or card at the store. Our staff will assist you with the transaction.
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2, mt: 0.5 }}>4</Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Take Your Pet Home</Typography>
                <Typography variant="body2" color="text.secondary">
                  After payment, you'll receive all necessary documents and can take your new pet home!
                </Typography>
              </Box>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Store Information</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <StoreIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">Pet Shop Name (will be displayed here)</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">Store Address (will be displayed here)</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">Store Phone (will be displayed here)</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowOfflineInstructions(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ReservationWizard