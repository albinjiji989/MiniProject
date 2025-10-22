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
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  InputAdornment,
  IconButton
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Pets as PetsIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  PhoneAndroid as UpiIcon,
  QrCode as QrCodeIcon,
  Info as InfoIcon
} from '@mui/icons-material'
import { petShopAPI, resolveMediaUrl } from '../../../services/api'

const Payment = () => {
  const { reservationId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [reservation, setReservation] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('razorpay')
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [discount, setDiscount] = useState(0)

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

  const calculateTotal = () => {
    if (!reservation) return 0
    const basePrice = reservation.itemId?.price || 0
    return basePrice - discount
  }

  const handleApplyCoupon = () => {
    // In a real implementation, this would call an API to validate the coupon
    if (couponCode === 'SAVE10') {
      setDiscount(100)
      setCouponApplied(true)
    } else {
      alert('Invalid coupon code')
    }
  }

  const handlePayment = async () => {
    try {
      setProcessing(true)
      
      // For Razorpay integration
      if (paymentMethod === 'razorpay') {
        const amountPaise = Math.round(calculateTotal() * 100)
        const orderRes = await petShopAPI.createRazorpayOrder({ 
          amount: amountPaise, 
          currency: 'INR', 
          receipt: `reservation_${reservationId}_${Date.now()}` 
        })
        
        const { data, keyId } = orderRes.data
        const options = {
          key: keyId,
          amount: data.amount,
          currency: data.currency,
          name: 'Pet Shop Payment',
          description: `Payment for ${reservation.itemId?.name || 'pet'}`,
          order_id: data.id,
          handler: async function (response) {
            try {
              const verifyRes = await petShopAPI.verifyRazorpay({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
              
              if (verifyRes.data?.success || verifyRes.data?.data?.valid) {
                // Payment successful, redirect to success page
                navigate(`/User/petshop/purchase-decision/${reservationId}`)
              } else {
                alert('Payment verification failed. If amount deducted, please contact support.')
              }
            } catch (e) {
              alert('Payment verification error')
            }
          },
          prefill: {
            name: reservation.contactInfo?.name || '',
            email: reservation.contactInfo?.email || '',
            contact: reservation.contactInfo?.phone || ''
          },
          theme: { color: '#0ea5ea' }
        }
        
        if (window.Razorpay) {
          const rzp = new window.Razorpay(options)
          rzp.open()
        } else {
          alert('Payment SDK not loaded')
        }
      } else {
        // For other payment methods, redirect to appropriate page
        // This is a simplified implementation
        setTimeout(() => {
          navigate(`/User/petshop/purchase-decision/${reservationId}`)
        }, 2000)
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to process payment')
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
  const totalAmount = calculateTotal()

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
          Payment
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Complete your payment for reservation {reservation.reservationCode}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Order Summary */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Order Summary</Typography>
              
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <CardMedia
                        component="img"
                        height="100"
                        image={resolveMediaUrl(pet?.images?.[0]?.url) || '/placeholder-pet.svg'}
                        alt={pet?.name || 'Pet'}
                        sx={{ objectFit: 'cover', borderRadius: 1 }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={9}>
                      <Typography variant="h6" component="div">
                        {pet?.name || 'Pet'}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                        <Typography variant="body2">
                          <strong>Species:</strong> {pet?.speciesId?.displayName || pet?.speciesId?.name || 'Not specified'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Breed:</strong> {pet?.breedId?.name || 'Not specified'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Age:</strong> {formatAge(pet?.age, pet?.ageUnit)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Base Price</Typography>
                <Typography variant="body1">₹{(pet?.price || 0).toLocaleString()}</Typography>
              </Box>
              
              {discount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1" color="success.main">Discount</Typography>
                  <Typography variant="body1" color="success.main">-₹{discount.toLocaleString()}</Typography>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Total Amount</Typography>
                <Typography variant="h6">₹{totalAmount.toLocaleString()}</Typography>
              </Box>
            </CardContent>
          </Card>
          
          {/* Coupon Code */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Apply Coupon</Typography>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Coupon Code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={couponApplied}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={handleApplyCoupon}
                          disabled={couponApplied || !couponCode}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              
              {couponApplied && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Coupon applied successfully! You saved ₹{discount.toLocaleString()}
                </Alert>
              )}
            </CardContent>
          </Card>
          
          {/* Payment Methods */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Payment Method</Typography>
              
              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      mb: 2, 
                      borderColor: paymentMethod === 'razorpay' ? 'primary.main' : 'divider',
                      borderWidth: paymentMethod === 'razorpay' ? 2 : 1
                    }}
                  >
                    <CardContent>
                      <FormControlLabel 
                        value="razorpay" 
                        control={<Radio />} 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CreditCardIcon />
                            <Typography>Credit/Debit Card</Typography>
                          </Box>
                        }
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        Pay securely using your credit or debit card through Razorpay
                      </Typography>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      mb: 2, 
                      borderColor: paymentMethod === 'upi' ? 'primary.main' : 'divider',
                      borderWidth: paymentMethod === 'upi' ? 2 : 1
                    }}
                  >
                    <CardContent>
                      <FormControlLabel 
                        value="upi" 
                        control={<Radio />} 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <UpiIcon />
                            <Typography>UPI</Typography>
                          </Box>
                        }
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        Pay instantly using any UPI app
                      </Typography>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      mb: 2, 
                      borderColor: paymentMethod === 'netbanking' ? 'primary.main' : 'divider',
                      borderWidth: paymentMethod === 'netbanking' ? 2 : 1
                    }}
                  >
                    <CardContent>
                      <FormControlLabel 
                        value="netbanking" 
                        control={<Radio />} 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BankIcon />
                            <Typography>Net Banking</Typography>
                          </Box>
                        }
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        Pay directly from your bank account
                      </Typography>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      borderColor: paymentMethod === 'wallet' ? 'primary.main' : 'divider',
                      borderWidth: paymentMethod === 'wallet' ? 2 : 1
                    }}
                  >
                    <CardContent>
                      <FormControlLabel 
                        value="wallet" 
                        control={<Radio />} 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <QrCodeIcon />
                            <Typography>Wallet</Typography>
                          </Box>
                        }
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        Pay using digital wallets like Paytm, PhonePe, etc.
                      </Typography>
                    </CardContent>
                  </Card>
                </RadioGroup>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Right Column - Payment Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Payment Summary</Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Base Price</Typography>
                  <Typography variant="body1">₹{(pet?.price || 0).toLocaleString()}</Typography>
                </Box>
                
                {discount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" color="success.main">Discount</Typography>
                    <Typography variant="body1" color="success.main">-₹{discount.toLocaleString()}</Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="h6">Total Amount</Typography>
                  <Typography variant="h6">₹{totalAmount.toLocaleString()}</Typography>
                </Box>
                
                <Button 
                  variant="contained" 
                  size="large"
                  startIcon={<PaymentIcon />}
                  onClick={handlePayment}
                  disabled={processing}
                  sx={{ mt: 2 }}
                >
                  {processing ? <CircularProgress size={24} /> : 'Pay Now'}
                </Button>
                
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                  By proceeding, you agree to our Terms and Conditions
                </Typography>
              </Box>
            </CardContent>
          </Card>
          
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <InfoIcon color="primary" />
                <Typography variant="h6">Secure Payment</Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                Your payment information is securely encrypted and processed through trusted payment gateways. We do not store your payment details.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default Payment