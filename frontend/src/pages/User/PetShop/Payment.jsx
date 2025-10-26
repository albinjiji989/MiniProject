import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Divider,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material'
import {
  Payment as PaymentIcon,
  LocalShipping as DeliveryIcon,
  Store as VisitIcon,
  CheckCircle as CheckIcon,
  Home as HomeIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Pets as PetIcon,
  Receipt as ReceiptIcon,
  Security as SecurityIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material'
import { petShopAPI, resolveMediaUrl } from '../../../services/api'
import { useAuth } from '../../../contexts/AuthContext'

const Payment = () => {
  const { reservationId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [reservation, setReservation] = useState(null)
  const [activeStep, setActiveStep] = useState(0)
  const [deliveryMethod, setDeliveryMethod] = useState('visit')
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState(null)

  const steps = ['Delivery Method', 'Payment Details', 'Confirmation']

  const fetchReservationDetails = async () => {
    try {
      setLoading(true)
      const response = await petShopAPI.getReservationById(reservationId)
      const reservationData = response.data.data.reservation
      
      if (!['going_to_buy', 'payment_pending'].includes(reservationData.status)) {
        setError('This reservation is not ready for payment.')
        return
      }
      setReservation(reservationData)
    } catch (err) {
      setError('Failed to load reservation details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReservationDetails()
  }, [reservationId])

  const handleDeliveryMethodChange = (event) => {
    setDeliveryMethod(event.target.value)
  }

  const handleAddressChange = (field) => (event) => {
    setDeliveryAddress(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  const validateStep = (step) => {
    // All steps are always valid since we removed user input requirements
    return true
  }

  const handleNext = () => {
    setActiveStep(prev => prev + 1)
    setError('')
  }

  const handleBack = () => {
    setActiveStep(prev => prev - 1)
    setError('')
  }

  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  const handlePaymentSuccess = async (response) => {
    try {
      console.log('Payment success response:', response);
      setProcessing(true)
      
      // Verify payment with backend
      const verificationResponse = await petShopAPI.verifyRazorpay({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        reservationId: reservationId,
        deliveryMethod: 'visit', // Always set to visit
        deliveryAddress: null // No delivery address
      })

      console.log('Verification response:', verificationResponse);

      if (verificationResponse.data.success) {
        setSuccess(true)
        setPaymentDetails({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature
        })
        
        // Redirect to purchase confirmation page
        setTimeout(() => {
          navigate(`/User/petshop/purchase-confirmation/${reservationId}`)
        }, 3000)
      } else {
        setError('Payment verification failed')
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      setError(err?.response?.data?.message || err.message || 'Payment verification failed')
    } finally {
      setProcessing(false)
    }
  }

  const handlePayment = async () => {
    try {
      setProcessing(true)
      setError('')

      // Compute total (price + GST approx 18%)
      const base = Number(reservation.itemId.price || 0)
      const taxes = Math.round(base * 0.18)
      const totalAmount = base + taxes

      console.log('Creating Razorpay order with:', {
        reservationId,
        amount: Math.round(totalAmount * 100),
        currency: 'INR',
        deliveryMethod: 'visit',
        deliveryAddress: null
      });

      // Create Razorpay order for total amount (in paise)
      const orderResponse = await petShopAPI.createRazorpayOrder({
        reservationId,
        amount: Math.round(totalAmount * 100),
        currency: 'INR',
        deliveryMethod: 'visit', // Always set to visit
        deliveryAddress: null // No delivery address
      })

      console.log('Order response:', orderResponse);

      // Support both shapes:
      // 1) { data: { orderId, amount, currency, key } }
      const payload = orderResponse?.data || {}
      let orderId, amount, currency, key
      if (payload?.data) {
        // V1 shape
        const d = payload.data
        orderId = d.orderId
        amount = d.amount
        currency = d.currency || 'INR'
        key = d.key
      } else {
        // Flat fallback
        orderId = payload.orderId
        amount = payload.amount
        currency = payload.currency || 'INR'
        key = payload.key
      }
      
      console.log('Processed payload:', { orderId, amount, currency, key });
      
      // Validate required fields
      if (!orderId || !amount || !key) {
        throw new Error('Missing required payment information from server')
      }
      
      // Initialize Razorpay with real test keys
      const razorpayLoaded = await initializeRazorpay()
      if (!razorpayLoaded) {
        setError('Failed to load payment gateway')
        return
      }

      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: 'Pet Shop Payment',
        description: `Payment for ${reservation.itemId.name}`,
        order_id: orderId,
        handler: handlePaymentSuccess,
        prefill: {
          name: user?.name || reservation.userId?.name || '',
          email: user?.email || reservation.userId?.email || '',
          contact: user?.phone || reservation.userId?.phone || '+91 9999999999'
        },
        theme: {
          color: '#1976d2'
        },
        modal: {
          ondismiss: function() {
            setError('Payment cancelled by user')
            setProcessing(false)
          }
        },
        // Make UPI visible and first in sequence
        config: {
          display: {
            blocks: {
              upi: {
                name: 'UPI',
                instruments: [
                  { method: 'upi' }
                ]
              },
              card: { name: 'Cards', instruments: [{ method: 'card' }] },
              netbanking: { name: 'Netbanking', instruments: [{ method: 'netbanking' }] },
              wallet: { name: 'Wallets', instruments: [{ method: 'wallet' }] }
            },
            sequence: ['upi', 'card', 'netbanking', 'wallet'],
            preferences: { show_default_blocks: true }
          },
          upi: { flow: isMobile() ? 'intent' : 'collect' }
        }
      }

      console.log('Opening Razorpay with options:', options);
      const razorpay = new window.Razorpay(options)
      razorpay.open()

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || err.message || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  const renderDeliveryMethodStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeliveryIcon /> Delivery Method
        </Typography>
        
        <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
          <VisitIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            Visit Store
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You will need to visit the store to pick up your pet after payment.
          </Typography>
          <Chip 
            label="Default Option" 
            color="primary" 
            size="small" 
            sx={{ mt: 2 }} 
          />
        </Box>
        
        <Box sx={{ mt: 3, p: 2, bgcolor: '#fff3e0', borderRadius: 2, border: '1px solid #ff9800' }}>
          <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeliveryIcon /> Home Delivery
          </Typography>
          <Typography variant="body1">
            Home delivery is coming soon! For now, please visit the store to pick up your pet.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )

  const renderPaymentStep = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PaymentIcon /> Payment Details
        </Typography>

        {/* Order Summary */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Order Summary</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{ width: 60, height: 60 }}>
              <PetIcon />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {reservation?.itemId?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pet Code: {reservation?.itemId?.petCode}
              </Typography>
            </Box>
            <Typography variant="h6" color="primary">
              ₹{reservation?.itemId?.price?.toLocaleString()}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>Pet Price:</Typography>
            <Typography>₹{reservation?.itemId?.price?.toLocaleString()}</Typography>
          </Box>
          
          {deliveryMethod === 'delivery' && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Delivery Charges:</Typography>
              <Typography>₹500</Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>Taxes & Fees:</Typography>
            <Typography>₹{Math.round(reservation?.itemId?.price * 0.18)}</Typography>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <Typography variant="h6">Total Amount:</Typography>
            <Typography variant="h6" color="primary">
              ₹{(reservation?.itemId?.price + (deliveryMethod === 'delivery' ? 500 : 0) + Math.round(reservation?.itemId?.price * 0.18))?.toLocaleString()}
            </Typography>
          </Box>
        </Paper>

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handlePayment}
          disabled={processing}
          startIcon={processing ? <CircularProgress size={20} /> : <PaymentIcon />}
          sx={{ py: 1.5 }}
        >
          {processing ? 'Processing Payment...' : `Pay ₹${(Number(reservation?.itemId?.price || 0) + (deliveryMethod === 'delivery' ? 500 : 0) + Math.round(Number(reservation?.itemId?.price || 0) * 0.18))?.toLocaleString()}`}
        </Button>
        
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            💳 <strong>Razorpay Test Mode - Use Test Credentials:</strong>
          </Typography>
          <Typography variant="body2" component="div">
            <strong>Test Cards:</strong><br/>
            • Visa: 4111 1111 1111 1111<br/>
            • Mastercard: 5555 5555 5555 4444<br/>
            • CVV: Any 3 digits, Expiry: Any future date<br/><br/>
            <strong>Test UPI:</strong><br/>
            • UPI ID: success@razorpay<br/>
            • UPI ID: failure@razorpay (for testing failures)<br/><br/>
            <strong>Net Banking & Wallets:</strong> All test options available
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  )

  const renderConfirmationStep = () => (
    <Card>
      <CardContent sx={{ textAlign: 'center' }}>
        <CheckIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" sx={{ mb: 2, color: 'success.main' }}>
          Payment Successful!
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Your payment has been processed successfully. You will be redirected to the confirmation page shortly.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/User/petshop/my-reservations')}
          >
            View My Reservations
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/User/dashboard')}
          >
            Go to Dashboard
          </Button>
        </Box>
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

  if (!reservation) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Reservation not found</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Button 
        startIcon={<BackIcon />} 
        onClick={() => navigate(-1)} 
        sx={{ mb: 2 }}
      >
        Back
      </Button>
      
      <Typography variant="h4" sx={{ mb: 3, textAlign: 'center' }}>
        Complete Your Purchase
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
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

      {activeStep === 0 && renderDeliveryMethodStep()}
      {activeStep === 1 && renderPaymentStep()}
      {activeStep === 2 && renderConfirmationStep()}

      {!success && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          {activeStep === 0 && (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!validateStep(activeStep)}
            >
              Next
            </Button>
          )}
          {activeStep === 1 && (
            <Button
              variant="contained"
              onClick={handlePayment}
              disabled={processing}
              startIcon={processing ? <CircularProgress size={20} /> : <PaymentIcon />}
            >
              {processing ? 'Processing Payment...' : 'Pay Now'}
            </Button>
          )}
        </Box>
      )}
    </Box>
  )
}

export default Payment

