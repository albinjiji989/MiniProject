import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  Paper,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  CheckCircle as CheckIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { temporaryCareAPI } from '../../../services/api';

const ApplicationPayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [application, setApplication] = useState(null);
  const [paymentType, setPaymentType] = useState(null); // 'advance' or 'final'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Lazy load Razorpay script
  const loadRazorpay = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  useEffect(() => {
    loadApplication();
  }, [id]);

  const loadApplication = async () => {
    try {
      setLoading(true);
      const response = await temporaryCareAPI.getApplicationDetails(id);
      const app = response.data?.data?.application;
      setApplication(app);

      // Determine payment type based on status
      if (app.status === 'price_determined' && app.paymentStatus.advance.status === 'pending') {
        setPaymentType('advance');
      } else if (app.status === 'active_care' && app.paymentStatus.final.status === 'pending') {
        setPaymentType('final');
      }
    } catch (err) {
      console.error('Error loading application:', err);
      setError(err?.response?.data?.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setProcessing(true);
      setError('');

      // Load Razorpay script first
      const ok = await loadRazorpay();
      if (!ok) {
        setError('Payment SDK failed to load. Please check your connection.');
        setProcessing(false);
        return;
      }

      // Create payment order
      const response = await temporaryCareAPI.createApplicationPaymentOrder({
        applicationId: id,
        paymentType
      });

      const { order, amount, key } = response.data?.data || {};

      if (!order || !order.id || !key) {
        throw new Error('Failed to create payment order');
      }

      const options = {
        key,
        amount: order.amount, // Amount in paise
        currency: order.currency || 'INR',
        name: 'PetConnect',
        description: `${paymentType === 'advance' ? 'Advance' : 'Final'} Payment for Temporary Care`,
        order_id: order.id,
        handler: async (response) => {
          // Verify payment
          try {
            const verifyResponse = await temporaryCareAPI.verifyApplicationPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              applicationId: id
            });

            setSuccess(true);
            
            // For advance payment, show OTP handover option
            if (paymentType === 'advance') {
              // Redirect to applications page where OTP generation will be available
              setTimeout(() => {
                navigate('/User/temporary-care/applications');
              }, 2000);
            } else {
              // For final payment, just redirect
              setTimeout(() => {
                navigate('/User/temporary-care/applications');
              }, 2000);
            }
          } catch (verifyErr) {
            console.error('Payment verification error:', verifyErr);
            setError(verifyErr?.response?.data?.message || 'Payment verification failed');
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: application?.userId?.name || '',
          email: application?.userId?.email || '',
          contact: application?.userId?.phone || ''
        },
        theme: {
          color: '#5b8cff'
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error('Payment error:', err);
      setError(err?.response?.data?.message || 'Failed to initiate payment');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!application) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Application not found</Alert>
      </Container>
    );
  }

  const amount = paymentType === 'advance'
    ? application.pricing?.advanceAmount
    : application.finalBill?.finalAmountDue || application.pricing?.remainingAmount;

  const steps = paymentType === 'advance'
    ? ['Pricing Determined', 'Pay Advance (50%)', 'Approval']
    : ['Care Active', 'Generate Final Bill', 'Pay Final (50%)', 'Complete'];

  const activeStep = paymentType === 'advance'
    ? (application.paymentStatus.advance.status === 'completed' ? 2 : 1)
    : (application.finalBill ? (application.paymentStatus.final.status === 'completed' ? 3 : 2) : 1);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Payment - Application #{application.applicationNumber}
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Payment completed successfully!
        </Alert>
      )}

      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                {paymentType === 'advance' ? 'Advance Payment' : 'Final Payment'}
              </Typography>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Application Details
                </Typography>
                <Typography variant="body1">
                  Application: {application.applicationNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pets: {application.pets?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Duration: {application.numberOfDays} days
                </Typography>
              </Paper>
            </Grid>

            {paymentType === 'advance' && (
              <>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Total Amount:</Typography>
                    <Typography>₹{application.pricing?.totalAmount?.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Advance Payment (50%):
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ₹{application.pricing?.advanceAmount?.toLocaleString()}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Typography variant="h6">Amount to Pay:</Typography>
                    <Typography variant="h5" color="primary">
                      ₹{amount?.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>

                {application.paymentStatus.advance.status === 'completed' && (
                  <Grid item xs={12}>
                    <Alert severity="success" icon={<CheckIcon />}>
                      Advance payment completed. Waiting for manager approval.
                    </Alert>
                  </Grid>
                )}
              </>
            )}

            {paymentType === 'final' && (
              <>
                {application.finalBill ? (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>Final Bill Breakdown</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Original Total:</Typography>
                        <Typography variant="body2">₹{application.finalBill.originalTotal?.toLocaleString()}</Typography>
                      </Box>
                      {application.finalBill.extraDaysAmount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Extra Days:</Typography>
                          <Typography variant="body2">+₹{application.finalBill.extraDaysAmount?.toLocaleString()}</Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Advance Paid:</Typography>
                        <Typography variant="body2">-₹{application.finalBill.advanceAlreadyPaid?.toLocaleString()}</Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Typography variant="h6">Final Amount Due:</Typography>
                        <Typography variant="h5" color="primary">
                          ₹{amount?.toLocaleString()}
                        </Typography>
                      </Box>
                    </Grid>
                  </>
                ) : (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      Final bill is being generated by the manager. Please wait.
                    </Alert>
                  </Grid>
                )}
              </>
            )}

            {paymentType && application.paymentStatus[paymentType]?.status === 'pending' && (
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={processing ? <CircularProgress size={20} /> : <MoneyIcon />}
                  onClick={handlePayment}
                  disabled={processing || !amount || amount <= 0}
                  sx={{ py: 1.5 }}
                >
                  {processing ? 'Processing...' : `Pay ₹${amount?.toLocaleString()}`}
                </Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/User/temporary-care/applications')}
        >
          Back to Applications
        </Button>
      </Box>
    </Container>
  );
};

export default ApplicationPayment;
