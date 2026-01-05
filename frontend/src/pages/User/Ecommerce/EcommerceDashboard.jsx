import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Divider,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import apiClient from '../../../services/api';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cart, setCart] = useState(null);
  const [sameBilling, setSameBilling] = useState(true);

  const [shippingAddress, setShippingAddress] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  });

  const [billingAddress, setBillingAddress] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  });

  const [paymentInfo, setPaymentInfo] = useState({
    method: 'razorpay',
    cardName: '',
    upiId: ''
  });

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const response = await apiClient.get('/api/ecommerce/cart');
      setCart(response.data.cart);
    } catch (err) {
      setError('Failed to load cart');
    }
  };

  const calculateTotals = () => {
    if (!cart?.items) return { subtotal: 0, tax: 0, shipping: 0, total: 0 };
    const subtotal = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const tax = subtotal * 0.18;
    const shipping = subtotal > 500 ? 0 : 50;
    return { subtotal, tax, shipping, total: subtotal + tax + shipping };
  };

  const handleShippingChange = (field, value) => {
    setShippingAddress({ ...shippingAddress, [field]: value });
    if (sameBilling) {
      setBillingAddress({ ...billingAddress, [field]: value });
    }
  };

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);
      const totals = calculateTotals();
      const response = await apiClient.post('/api/ecommerce/orders', {
        shippingAddress,
        billingAddress: sameBilling ? shippingAddress : billingAddress,
        paymentMethod: paymentInfo.method,
        totalAmount: totals.total,
        taxAmount: totals.tax,
        shippingAmount: totals.shipping
      });

      // Redirect to payment or order confirmation
      navigate(`/ecommerce/orders/${response.data.order._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, tax, shipping, total } = calculateTotals();
  const steps = ['Shipping', 'Billing', 'Payment'];

  if (!cart) {
    return <CircularProgress />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Checkout
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            {activeStep === 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 3 }}>Shipping Address</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Address Line 1"
                      value={shippingAddress.addressLine1}
                      onChange={(e) => handleShippingChange('addressLine1', e.target.value)}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Address Line 2 (Optional)"
                      value={shippingAddress.addressLine2}
                      onChange={(e) => handleShippingChange('addressLine2', e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="City"
                      value={shippingAddress.city}
                      onChange={(e) => handleShippingChange('city', e.target.value)}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="State"
                      value={shippingAddress.state}
                      onChange={(e) => handleShippingChange('state', e.target.value)}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Zip Code"
                      value={shippingAddress.zipCode}
                      onChange={(e) => handleShippingChange('zipCode', e.target.value)}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Country"
                      value={shippingAddress.country}
                      disabled
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {activeStep === 1 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 3 }}>Billing Address</Typography>
                <FormControlLabel
                  control={<Checkbox checked={sameBilling} onChange={(e) => setSameBilling(e.target.checked)} />}
                  label="Same as shipping address"
                  sx={{ mb: 2 }}
                />
                {!sameBilling && (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Address Line 1"
                        value={billingAddress.addressLine1}
                        onChange={(e) => setBillingAddress({ ...billingAddress, addressLine1: e.target.value })}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Address Line 2 (Optional)"
                        value={billingAddress.addressLine2}
                        onChange={(e) => setBillingAddress({ ...billingAddress, addressLine2: e.target.value })}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="City"
                        value={billingAddress.city}
                        onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="State"
                        value={billingAddress.state}
                        onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Zip Code"
                        value={billingAddress.zipCode}
                        onChange={(e) => setBillingAddress({ ...billingAddress, zipCode: e.target.value })}
                        fullWidth
                        required
                      />
                    </Grid>
                  </Grid>
                )}
              </Box>
            )}

            {activeStep === 2 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 3 }}>Payment Method</Typography>
                <Typography variant="body2" sx={{ mb: 2, color: 'textSecondary' }}>
                  We accept payment via Razorpay (credit card, debit card, UPI, etc.)
                </Typography>
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Total Amount: ₹{total.toFixed(2)}</strong>
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    You will be redirected to Razorpay gateway to complete payment
                  </Typography>
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={() => setActiveStep(activeStep - 1)}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  if (activeStep < 2) {
                    setActiveStep(activeStep + 1);
                  } else {
                    handlePlaceOrder();
                  }
                }}
                disabled={loading}
              >
                {activeStep === 2 ? (loading ? <CircularProgress size={24} /> : 'Place Order') : 'Next'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Order Summary
              </Typography>

              {cart.items.map((item) => (
                <Box key={item.product._id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{item.product.name} x{item.quantity}</Typography>
                    <Typography variant="body2">₹{(item.product.price * item.quantity).toFixed(2)}</Typography>
                  </Box>
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal:</Typography>
                <Typography>₹{subtotal.toFixed(2)}</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Tax (18%):</Typography>
                <Typography>₹{tax.toFixed(2)}</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography>Shipping:</Typography>
                <Typography>{shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Total:</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  ₹{total.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Checkout;