import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  Avatar
} from '@mui/material';
import {
  Pets as PetsIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import PickupOTPManager from './PickupOTPManager';

const OTPDemoManager = () => {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);

  // Mock booking data
  const mockBookings = [
    {
      _id: 'booking1',
      bookingNumber: 'TCB1710598800001',
      petId: { 
        name: 'Buddy', 
        species: 'Dog', 
        breed: 'Golden Retriever',
        profileImage: '/placeholder-pet.svg'
      },
      userId: { 
        name: 'John Doe', 
        email: 'john@example.com', 
        phone: '+91 9876543210' 
      },
      status: 'in_progress',
      paymentStatus: {
        advance: { status: 'completed', paidAt: '2026-03-15T10:00:00Z' },
        final: { status: 'completed', paidAt: '2026-03-16T14:00:00Z' }
      },
      startDate: '2026-03-15T09:00:00Z',
      endDate: '2026-03-20T17:00:00Z',
      handover: {
        pickup: {
          otp: null
        }
      }
    },
    {
      _id: 'booking2',
      bookingNumber: 'TCB1710598800002',
      petId: { 
        name: 'Luna', 
        species: 'Cat', 
        breed: 'Persian',
        profileImage: '/placeholder-pet.svg'
      },
      userId: { 
        name: 'Jane Smith', 
        email: 'jane@example.com', 
        phone: '+91 9876543211' 
      },
      status: 'in_progress',
      paymentStatus: {
        advance: { status: 'completed', paidAt: '2026-03-14T10:00:00Z' },
        final: { status: 'pending' }
      },
      startDate: '2026-03-14T09:00:00Z',
      endDate: '2026-03-18T17:00:00Z',
      handover: {
        pickup: {
          otp: null
        }
      }
    },
    {
      _id: 'booking3',
      bookingNumber: 'TCB1710598800003',
      petId: { 
        name: 'Max', 
        species: 'Dog', 
        breed: 'German Shepherd',
        profileImage: '/placeholder-pet.svg'
      },
      userId: { 
        name: 'Mike Johnson', 
        email: 'mike@example.com', 
        phone: '+91 9876543212' 
      },
      status: 'in_progress',
      paymentStatus: {
        advance: { status: 'completed', paidAt: '2026-03-13T10:00:00Z' },
        final: { status: 'completed', paidAt: '2026-03-16T15:30:00Z' }
      },
      startDate: '2026-03-13T09:00:00Z',
      endDate: '2026-03-17T17:00:00Z',
      handover: {
        pickup: {
          otp: {
            code: '123456',
            generatedAt: '2026-03-16T15:45:00Z',
            expiresAt: '2026-03-16T16:15:00Z',
            verified: false
          }
        }
      }
    }
  ];

  const handlePickupOTP = (booking) => {
    setSelectedBooking(booking);
    setOtpDialogOpen(true);
  };

  const handleOTPSuccess = (updatedBooking) => {
    console.log('OTP Success:', updatedBooking);
    setSelectedBooking(null);
    // In real app, this would refresh the data
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
      'completed': 'success',
      'failed': 'error'
    };
    return colors[status] || 'default';
  };

  const canGeneratePickupOTP = (booking) => {
    return booking.status === 'in_progress' && 
           booking.paymentStatus?.final?.status === 'completed';
  };

  const readyForPickup = mockBookings.filter(canGeneratePickupOTP);
  const awaitingPayment = mockBookings.filter(b => 
    b.status === 'in_progress' && b.paymentStatus?.final?.status !== 'completed'
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🐾 Temporary Care Manager - OTP Demo
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This demo shows the OTP entry interface for managers after users complete final payment.
        Click "Generate Pickup OTP" on pets ready for pickup to see the professional interface.
      </Alert>

      <Grid container spacing={3}>
        {/* Ready for Pickup */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon color="success" />
                Ready for Pickup ({readyForPickup.length})
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Final payment completed - Generate OTP to complete handover
              </Typography>
              
              {readyForPickup.map((booking) => (
                <Card key={booking._id} variant="outlined" sx={{ mb: 2, bgcolor: 'success.50' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <PetsIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {booking.petId.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {booking.petId.species} • {booking.petId.breed}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Owner: {booking.userId.name}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box display="flex" gap={1} mb={2}>
                      <Chip
                        size="small"
                        label={`Final: ${booking.paymentStatus.final.status}`}
                        color={getPaymentStatusColor(booking.paymentStatus.final.status)}
                        icon={<PaymentIcon />}
                      />
                      <Chip
                        size="small"
                        label={booking.bookingNumber}
                        variant="outlined"
                      />
                    </Box>
                    
                    {!booking.handover?.pickup?.otp?.code ? (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<ScheduleIcon />}
                        onClick={() => handlePickupOTP(booking)}
                        fullWidth
                      >
                        🔐 Generate Pickup OTP & Send Email
                      </Button>
                    ) : !booking.handover.pickup.otp.verified ? (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handlePickupOTP(booking)}
                        fullWidth
                      >
                        ✅ Enter OTP & Complete Handover
                      </Button>
                    ) : (
                      <Chip
                        label="✓ Completed"
                        color="success"
                        variant="filled"
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {readyForPickup.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  No pets ready for pickup
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Awaiting Payment */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon color="warning" />
                Awaiting Final Payment ({awaitingPayment.length})
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Users need to complete final payment before pickup
              </Typography>
              
              {awaitingPayment.map((booking) => (
                <Card key={booking._id} variant="outlined" sx={{ mb: 2, bgcolor: 'warning.50' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                        <PetsIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {booking.petId.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {booking.petId.species} • {booking.petId.breed}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Owner: {booking.userId.name}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box display="flex" gap={1} mb={2}>
                      <Chip
                        size="small"
                        label={`Final: ${booking.paymentStatus.final.status}`}
                        color={getPaymentStatusColor(booking.paymentStatus.final.status)}
                        icon={<PaymentIcon />}
                      />
                      <Chip
                        size="small"
                        label={booking.bookingNumber}
                        variant="outlined"
                      />
                    </Box>
                    
                    <Alert severity="warning" size="small">
                      ⏳ Waiting for user to complete final payment
                    </Alert>
                  </CardContent>
                </Card>
              ))}
              
              {awaitingPayment.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  No pending payments
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* OTP Manager Dialog */}
      <PickupOTPManager
        bookingId={selectedBooking?._id}
        open={otpDialogOpen}
        onClose={() => {
          setOtpDialogOpen(false);
          setSelectedBooking(null);
        }}
        onSuccess={handleOTPSuccess}
      />
    </Box>
  );
};

export default OTPDemoManager;