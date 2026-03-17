import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  Avatar,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Pets as PetsIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Payment as PaymentIcon,
  Visibility as ViewIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';
import { temporaryCareAPI } from '../../../services/api';
import PickupOTPManager from './PickupOTPManager';

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      // This would be the actual API call to get manager bookings
      // const response = await temporaryCareAPI.managerGetBookings({ status: 'in_progress' });
      // setBookings(response.data.data);
      // Mock data for demonstration
      setBookings([
        {
          _id: 'booking1',
          bookingNumber: 'TCB1710598800001',
          petId: { name: 'Buddy', species: 'Dog', breed: 'Golden Retriever' },
          userId: { name: 'John Doe', email: 'john@example.com', phone: '+91 9876543210' },
          status: 'in_progress',
          paymentStatus: {
            advance: { status: 'completed' },
            final: { status: 'completed' }
          },
          startDate: '2026-03-15',
          endDate: '2026-03-20',
          handover: {
            pickup: {
              otp: null
            }
          }
        },
        {
          _id: 'booking2',
          bookingNumber: 'TCB1710598800002',
          petId: { name: 'Luna', species: 'Cat', breed: 'Persian' },
          userId: { name: 'Jane Smith', email: 'jane@example.com', phone: '+91 9876543211' },
          status: 'in_progress',
          paymentStatus: {
            advance: { status: 'completed' },
            final: { status: 'pending' }
          },
          startDate: '2026-03-14',
          endDate: '2026-03-18',
          handover: {
            pickup: {
              otp: null
            }
          }
        }
      ]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handlePickupOTP = (booking) => {
    setSelectedBooking(booking);
    setOtpDialogOpen(true);
  };

  const handleOTPSuccess = (updatedBooking) => {
    // Refresh bookings list
    loadBookings();
    setSelectedBooking(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending_payment': 'warning',
      'confirmed': 'info',
      'in_progress': 'primary',
      'completed': 'success',
      'cancelled': 'error'
    };
    return colors[status] || 'default';
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Booking Management
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Active Bookings
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pet & Owner</TableCell>
                  <TableCell>Booking Details</TableCell>
                  <TableCell>Payment Status</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <PetsIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
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
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {booking.bookingNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Chip
                          size="small"
                          label={`Advance: ${booking.paymentStatus.advance.status}`}
                          color={getPaymentStatusColor(booking.paymentStatus.advance.status)}
                          variant="outlined"
                        />
                        <Chip
                          size="small"
                          label={`Final: ${booking.paymentStatus.final.status}`}
                          color={getPaymentStatusColor(booking.paymentStatus.final.status)}
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={booking.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(booking.status)}
                        variant="filled"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {canGeneratePickupOTP(booking) && (
                          <Tooltip title="Generate Pickup OTP">
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<QrCodeIcon />}
                              onClick={() => handlePickupOTP(booking)}
                            >
                              Pickup OTP
                            </Button>
                          </Tooltip>
                        )}
                        
                        {booking.status === 'in_progress' && 
                         booking.paymentStatus?.final?.status !== 'completed' && (
                          <Chip
                            size="small"
                            label="Awaiting Final Payment"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {bookings.length === 0 && (
            <Box textAlign="center" py={4}>
              <PetsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No active bookings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bookings will appear here when pets are checked in
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Pickup OTP Dialog */}
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

export default BookingManagement;