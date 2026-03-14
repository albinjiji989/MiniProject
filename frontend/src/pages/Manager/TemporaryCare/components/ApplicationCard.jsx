import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Avatar,
  Stack,
  Button,
  IconButton,
  Tooltip,
  Grid,
  Divider,
  Alert
} from '@mui/material';
import {
  Visibility as ViewIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Pets as PetsIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { resolveMediaUrl } from '../../../../services/api';

const ApplicationCard = ({ application, onViewDetails, onSetPricing, onAction }) => {
  const getStatusColor = (status) => {
    const colors = {
      submitted: 'warning',
      price_determined: 'info',
      advance_paid: 'primary',
      approved: 'success',
      active_care: 'secondary',
      completed: 'success',
      cancelled: 'error',
      rejected: 'error'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      submitted: 'New Application',
      price_determined: 'Awaiting Payment',
      advance_paid: 'Ready for Check-in',
      approved: 'Approved',
      active_care: 'Pet in Care',
      completed: 'Completed',
      cancelled: 'Cancelled',
      rejected: 'Rejected'
    };
    return labels[status] || status;
  };

  const getNextAction = (app) => {
    if (app.status === 'submitted') return 'Set pricing for this application';
    if (app.status === 'price_determined') return 'Waiting for user to pay advance amount';
    if (app.status === 'advance_paid') {
      if (!app.checkIn?.otp) return 'Generate check-in OTP for pet handover';
      if (!app.checkIn?.otpUsed) return 'Ask user for OTP from email, then verify';
      return 'Pet checked in - care in progress';
    }
    if (app.status === 'active_care') {
      if (app.paymentStatus?.final?.status !== 'completed') return 'Waiting for final payment from user';
      if (!app.checkOut?.otp) return 'Generate pickup OTP for pet return';
      if (!app.checkOut?.otpUsed) return 'Ask user for pickup OTP, then verify';
      return 'Ready for pet pickup';
    }
    if (app.status === 'completed') return 'Application completed successfully';
    return 'No action required';
  };

  const getPetImage = (pet) => {
    const petData = pet.petDetails || {};
    
    // Try different image sources
    if (petData.profileImage) return resolveMediaUrl(petData.profileImage);
    if (petData.images && petData.images.length > 0) {
      return resolveMediaUrl(petData.images[0].url || petData.images[0]);
    }
    if (petData.image) return resolveMediaUrl(petData.image);
    
    return null;
  };

  return (
    <Card sx={{ mb: 2, '&:hover': { boxShadow: 4 } }}>
      <CardContent>
        <Grid container spacing={2}>
          {/* Header */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight="600">
                  {application.applicationNumber || `APP-${application._id?.slice(-6)}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Applied on {new Date(application.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
              <Chip
                label={getStatusLabel(application.status)}
                color={getStatusColor(application.status)}
                size="small"
              />
            </Box>
          </Grid>

          {/* Owner Info */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PersonIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" color="primary">Owner Details</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {application.userId?.name?.[0] || 'U'}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight="500">
                  {application.userId?.name || 'Unknown User'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {application.userId?.phone || application.userId?.email || 'No contact'}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Pets Info */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PetsIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" color="primary">
                Pets ({application.pets?.length || 0})
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {application.pets?.slice(0, 3).map((pet, index) => {
                const petData = pet.petDetails || {};
                const petImage = getPetImage(pet);
                
                return (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Avatar
                      src={petImage}
                      sx={{ width: 24, height: 24 }}
                    >
                      <PetsIcon fontSize="small" />
                    </Avatar>
                    <Typography variant="caption">
                      {petData.name || `Pet ${index + 1}`}
                    </Typography>
                  </Box>
                );
              })}
              {application.pets?.length > 3 && (
                <Typography variant="caption" color="text.secondary">
                  +{application.pets.length - 3} more
                </Typography>
              )}
            </Stack>
          </Grid>

          {/* Duration & Pricing */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CalendarIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" color="primary">Duration & Pricing</Typography>
            </Box>
            <Typography variant="body2">
              {new Date(application.startDate).toLocaleDateString()} - {new Date(application.endDate).toLocaleDateString()}
            </Typography>
            <Typography variant="caption" color="primary.main" fontWeight="600">
              {application.numberOfDays} days
            </Typography>
            {application.pricing?.totalAmount && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" fontWeight="600">
                  ₹{application.pricing.totalAmount.toLocaleString()}
                </Typography>
                {application.paymentStatus?.advance?.status === 'completed' && (
                  <Chip label="Advance Paid" size="small" color="success" sx={{ mt: 0.5 }} />
                )}
              </Box>
            )}
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          {/* Next Action */}
          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary">Next Action:</Typography>
            <Typography variant="body2" color="primary.main" fontWeight="500">
              {getNextAction(application)}
            </Typography>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
              {/* View Details - Always available */}
              <Tooltip title="View Details">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => {
                    console.log('🖱️ View Details clicked for application:', application._id);
                    onViewDetails(application._id);
                  }}
                >
                  <ViewIcon />
                </IconButton>
              </Tooltip>

              {/* Set Pricing */}
              {application.status === 'submitted' && (
                <Tooltip title="Set Pricing">
                  <IconButton
                    size="small"
                    color="secondary"
                    onClick={() => onSetPricing(application)}
                  >
                    <MoneyIcon />
                  </IconButton>
                </Tooltip>
              )}

              {/* Generate Check-in OTP */}
              {application.status === 'advance_paid' && !application.checkIn?.otp && (
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => onAction('generateOTP', application)}
                  sx={{ mr: 1 }}
                >
                  Generate Check-in OTP
                </Button>
              )}

              {/* Verify Check-in OTP */}
              {application.status === 'advance_paid' && application.checkIn?.otp && !application.checkIn?.otpUsed && (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<CheckIcon />}
                  onClick={() => onAction('verifyOTP', application)}
                  sx={{ mr: 1 }}
                >
                  Enter OTP & Check-in Pet
                </Button>
              )}

              {/* OTP Generated - Waiting for verification */}
              {application.status === 'advance_paid' && application.checkIn?.otp && !application.checkIn?.otpUsed && (
                <Alert severity="info" sx={{ mt: 1, fontSize: '0.75rem' }}>
                  <Typography variant="caption">
                    <strong>OTP sent to user's email.</strong> Ask user for the 6-digit code, then click "Enter OTP & Check-in Pet"
                  </Typography>
                </Alert>
              )}

              {/* Generate Pickup OTP */}
              {application.status === 'active_care' && 
               application.paymentStatus?.final?.status === 'completed' && 
               !application.checkOut?.otp && (
                <Button
                  size="small"
                  variant="contained"
                  color="warning"
                  startIcon={<AddIcon />}
                  onClick={() => onAction('generateCheckoutOTP', application)}
                  sx={{ mr: 1 }}
                >
                  Generate Pickup OTP
                </Button>
              )}

              {/* Verify Pickup OTP */}
              {application.status === 'active_care' && 
               application.checkOut?.otp && 
               !application.checkOut?.otpUsed && (
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  startIcon={<CheckIcon />}
                  onClick={() => onAction('verifyCheckoutOTP', application)}
                  sx={{ mr: 1 }}
                >
                  Enter OTP & Complete Pickup
                </Button>
              )}

              {/* Pickup OTP Generated - Waiting for verification */}
              {application.status === 'active_care' && 
               application.checkOut?.otp && 
               !application.checkOut?.otpUsed && (
                <Alert severity="warning" sx={{ mt: 1, fontSize: '0.75rem' }}>
                  <Typography variant="caption">
                    <strong>Pickup OTP sent to user's email.</strong> Ask user for the 6-digit code, then click "Enter OTP & Complete Pickup"
                  </Typography>
                </Alert>
              )}

              {/* Waiting for final payment */}
              {application.status === 'active_care' && 
               application.paymentStatus?.final?.status !== 'completed' && (
                <Chip 
                  label="Waiting for final payment" 
                  size="small" 
                  color="info"
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ApplicationCard;