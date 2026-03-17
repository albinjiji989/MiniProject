import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Grid,
  Avatar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Pets as PetsIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Close as CloseIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { temporaryCareAPI } from '../../../services/api';

const PickupOTPManager = ({ bookingId, open, onClose, onSuccess }) => {
  console.log('🔍 PickupOTPManager props:', { bookingId, open, onClose: !!onClose, onSuccess: !!onSuccess });
  
  const [booking, setBooking] = useState(null);
  const [otp, setOtp] = useState('');
  const [notes, setNotes] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    console.log('🔍 PickupOTPManager useEffect triggered:', { open, bookingId });
    if (open && bookingId) {
      console.log('✅ Loading booking details for:', bookingId);
      loadBookingDetails();
    }
  }, [open, bookingId]);

  useEffect(() => {
    let interval;
    if (otpExpiry) {
      interval = setInterval(() => {
        const now = new Date();
        const expiry = new Date(otpExpiry);
        const diff = expiry - now;
        
        if (diff <= 0) {
          setTimeRemaining(null);
          setGeneratedOTP(null);
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpExpiry]);

  const loadBookingDetails = async () => {
    try {
      console.log('🔍 Loading booking details for ID:', bookingId);
      setLoading(true);
      const response = await temporaryCareAPI.getManagerBookingDetails(bookingId);
      console.log('✅ Booking details loaded:', response.data.data);
      setBooking(response.data.data);
      
      // Check if OTP already exists
      if (response.data.data.handover?.pickup?.otp?.code && 
          !response.data.data.handover.pickup.otp.verified &&
          new Date() < new Date(response.data.data.handover.pickup.otp.expiresAt)) {
        console.log('✅ Existing valid OTP found:', response.data.data.handover.pickup.otp.code);
        setGeneratedOTP({
          code: response.data.data.handover.pickup.otp.code,
          expiresAt: response.data.data.handover.pickup.otp.expiresAt
        });
        setOtpExpiry(response.data.data.handover.pickup.otp.expiresAt);
      } else {
        console.log('ℹ️ No existing valid OTP found');
      }
    } catch (err) {
      console.error('❌ Error loading booking details:', err);
      setError(err.response?.data?.message || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const generateOTP = async () => {
    try {
      setGenerating(true);
      setError('');
      setSuccess('');
      
      const response = await temporaryCareAPI.generatePickupOTP(bookingId);
      
      setGeneratedOTP({
        code: response.data.data.otp,
        expiresAt: response.data.data.expiresAt
      });
      setOtpExpiry(response.data.data.expiresAt);
      setSuccess('OTP generated and sent to pet owner via email!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate OTP');
    } finally {
      setGenerating(false);
    }
  };

  const resendOTP = async () => {
    try {
      setGenerating(true);
      setError('');
      setSuccess('');
      
      const response = await temporaryCareAPI.resendPickupOTP(bookingId);
      
      if (response.data.data.isResend) {
        setSuccess('Existing OTP resent to pet owner via email!');
      } else {
        setGeneratedOTP({
          code: response.data.data.otp,
          expiresAt: response.data.data.expiresAt
        });
        setOtpExpiry(response.data.data.expiresAt);
        setSuccess('New OTP generated and sent to pet owner via email!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setGenerating(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setVerifying(true);
      setError('');
      
      const response = await temporaryCareAPI.verifyPickupOTP(bookingId, {
        otp,
        notes
      });
      
      setSuccess('Pet successfully checked out! Ownership restored to user.');
      
      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess && onSuccess(response.data.data);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setVerifying(false);
    }
  };

  const handleClose = () => {
    setOtp('');
    setNotes('');
    setError('');
    setSuccess('');
    setGeneratedOTP(null);
    setOtpExpiry(null);
    setTimeRemaining(null);
    onClose();
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <PetsIcon color="primary" />
            <Typography variant="h6">Pet Pickup - OTP Verification</Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {booking && (
          <Box>
            {/* Booking Info */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <PetsIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">{booking.petId?.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {booking.petId?.species} • {booking.petId?.breed}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Booking: {booking.bookingNumber}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <PersonIcon fontSize="small" />
                      <Typography variant="body2">{booking.userId?.name}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <EmailIcon fontSize="small" />
                      <Typography variant="body2">{booking.userId?.email}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PhoneIcon fontSize="small" />
                      <Typography variant="body2">{booking.userId?.phone}</Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                {/* Payment Status */}
                <Box mt={2}>
                  <Chip
                    icon={<PaymentIcon />}
                    label={`Final Payment: ${booking.paymentStatus?.final?.status?.toUpperCase()}`}
                    color={booking.paymentStatus?.final?.status === 'completed' ? 'success' : 'warning'}
                    variant="filled"
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Payment Check */}
            {booking.paymentStatus?.final?.status !== 'completed' && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Final payment must be completed before generating pickup OTP.
              </Alert>
            )}

            {/* OTP Generation Section */}
            {booking.paymentStatus?.final?.status === 'completed' && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Step 1: Generate Pickup OTP
                  </Typography>
                  
                  {!generatedOTP ? (
                    <Box>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        Generate a secure OTP that will be sent to the pet owner's email.
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<SendIcon />}
                        onClick={generateOTP}
                        loading={generating}
                        disabled={generating}
                        size="large"
                      >
                        {generating ? 'Generating...' : 'Generate & Send OTP'}
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      <Alert severity="success" sx={{ mb: 2 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <Typography variant="body2">
                              OTP sent to: <strong>{booking.userId?.email}</strong>
                            </Typography>
                            <Typography variant="h4" sx={{ fontFamily: 'monospace', mt: 1 }}>
                              {generatedOTP.code}
                            </Typography>
                            {timeRemaining && (
                              <Typography variant="caption" color="text.secondary">
                                Expires in: {timeRemaining}
                              </Typography>
                            )}
                          </Box>
                          <Tooltip title="Resend OTP">
                            <IconButton onClick={resendOTP} disabled={generating}>
                              <RefreshIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Alert>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
            {/* OTP Verification Section */}
            {generatedOTP && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Step 2: Verify OTP from Pet Owner
                  </Typography>
                  
                  <Box mb={3}>
                    <TextField
                      label="Enter OTP from Pet Owner"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      fullWidth
                      inputProps={{
                        style: { fontSize: '1.5rem', textAlign: 'center', letterSpacing: '0.5rem' }
                      }}
                      helperText="Ask the pet owner to provide the 6-digit OTP they received via email"
                    />
                  </Box>
                  
                  <Box mb={3}>
                    <TextField
                      label="Checkout Notes (Optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Pet returned in excellent health..."
                      multiline
                      rows={3}
                      fullWidth
                    />
                  </Box>
                  
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={verifyOTP}
                    loading={verifying}
                    disabled={verifying || !otp || otp.length !== 6}
                    size="large"
                    fullWidth
                  >
                    {verifying ? 'Verifying...' : 'Complete Checkout'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Messages */}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {success}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PickupOTPManager;