import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Chip,
  Button,
  Stack,
  Grid,
  Paper,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Visibility as ViewIcon,
  AttachMoney as MoneyIcon,
  Add as AddIcon,
  Check as CheckIcon,
  LocalShipping as PickupIcon,
  Schedule as ScheduleIcon,
  Pets as PetsIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { resolveMediaUrl } from '../../../../services/api';

const ModernApplicationCard = ({ application, onAction }) => {
  const getStatusInfo = (status) => {
    const statusMap = {
      submitted: { 
        label: 'New Application', 
        color: 'warning', 
        bgColor: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
        textColor: 'white'
      },
      price_determined: { 
        label: 'Awaiting Payment', 
        color: 'info', 
        bgColor: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
        textColor: 'white'
      },
      advance_paid: { 
        label: 'Ready for Check-in', 
        color: 'primary', 
        bgColor: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
        textColor: 'white'
      },
      active_care: { 
        label: 'Pet in Care', 
        color: 'success', 
        bgColor: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
        textColor: 'white'
      },
      completed: { 
        label: 'Completed', 
        color: 'success', 
        bgColor: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
        textColor: 'white'
      },
      rejected: { 
        label: 'Rejected', 
        color: 'error', 
        bgColor: 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)',
        textColor: 'white'
      }
    };
    return statusMap[status] || statusMap.submitted;
  };

  const getPetImage = (pet) => {
    const petData = pet.petDetails || {};
    
    // Try multiple image sources
    if (petData.profileImage) return resolveMediaUrl(petData.profileImage);
    if (petData.images && petData.images.length > 0) {
      return resolveMediaUrl(petData.images[0].url || petData.images[0]);
    }
    if (petData.image) return resolveMediaUrl(petData.image);
    if (petData.imageUrl) return resolveMediaUrl(petData.imageUrl);
    
    return '/placeholder-pet.svg';
  };

  const getPetDisplayName = (pet) => {
    const petData = pet.petDetails || {};
    return petData.name || `Pet ${pet.petId}`;
  };

  const getPetSpecies = (pet) => {
    const petData = pet.petDetails || {};
    return petData.species || petData.speciesId?.name || petData.speciesId?.displayName || 'Unknown Species';
  };

  const getPetBreed = (pet) => {
    const petData = pet.petDetails || {};
    return petData.breed || petData.breedId?.name || 'Unknown Breed';
  };

  const statusInfo = getStatusInfo(application.status);

  return (
    <Card 
      sx={{ 
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        '&:hover': { 
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
        },
        border: '1px solid rgba(0,0,0,0.08)'
      }}
    >
      {/* Status Header */}
      <Box 
        sx={{ 
          background: statusInfo.bgColor,
          color: statusInfo.textColor,
          p: 2,
          position: 'relative'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight="700" sx={{ mb: 0.5 }}>
              {application.applicationNumber || `TCA-${application._id?.slice(-8)}`}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Applied on {new Date(application.createdAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </Typography>
          </Box>
          <Chip
            label={statusInfo.label}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 600,
              backdropFilter: 'blur(10px)'
            }}
          />
        </Box>
      </Box>

      <CardContent sx={{ p: 3 }}>
        {/* Owner Information */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              sx={{ 
                width: 50, 
                height: 50,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: '20px',
                fontWeight: 'bold'
              }}
            >
              {application.userId?.name?.[0] || 'U'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                {application.userId?.name || 'Unknown User'}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {application.userId?.phone && (
                  <Chip 
                    icon={<PhoneIcon />} 
                    label={application.userId.phone} 
                    size="small"
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  />
                )}
                {application.userId?.email && (
                  <Chip 
                    icon={<EmailIcon />} 
                    label={application.userId.email} 
                    size="small"
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  />
                )}
              </Stack>
            </Box>
          </Box>
        </Paper>

        {/* Pet Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="600" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PetsIcon color="primary" />
            Pets ({application.pets?.length || 0})
          </Typography>
          
          {application.pets && application.pets.length > 0 ? (
            <Grid container spacing={2}>
              {application.pets.map((pet, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Avatar
                        src={getPetImage(pet)}
                        sx={{ 
                          width: 60, 
                          height: 60,
                          border: '3px solid white',
                          boxShadow: 2
                        }}
                      >
                        <PetsIcon />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" fontWeight="600" noWrap>
                          {getPetDisplayName(pet)}
                        </Typography>
                        <Typography variant="body2" color="primary" noWrap>
                          {getPetSpecies(pet)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {getPetBreed(pet)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Code: {pet.petId}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              No pets information available
            </Typography>
          )}
        </Box>

        {/* Care Duration & Pricing */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 2 }}>
              <CalendarIcon sx={{ mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {application.numberOfDays}
              </Typography>
              <Typography variant="body2">
                Days
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 2 }}>
              <MoneyIcon sx={{ mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">
                {application.pricing?.totalAmount ? `₹${(application.pricing.totalAmount / 1000).toFixed(1)}k` : 'TBD'}
              </Typography>
              <Typography variant="body2">
                Total Cost
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Action Buttons */}
        <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
          <Button 
            variant="outlined" 
            startIcon={<ViewIcon />}
            onClick={() => onAction('view', application)}
            sx={{ borderRadius: 2 }}
          >
            View Details
          </Button>
          
          {/* Status-specific actions */}
          {application.status === 'submitted' && (
            <Button 
              variant="contained" 
              startIcon={<MoneyIcon />}
              onClick={() => onAction('setPricing', application)}
              sx={{ 
                borderRadius: 2,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
              }}
            >
              Set Pricing
            </Button>
          )}
          
          {application.status === 'price_determined' && (
            <Chip 
              label="Waiting for Payment" 
              color="info"
              icon={<ScheduleIcon />}
            />
          )}
          
          {application.status === 'advance_paid' && !application.checkIn?.otp && (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => onAction('generateOTP', application)}
              sx={{ 
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              Generate Check-in OTP
            </Button>
          )}
          
          {application.status === 'advance_paid' && application.checkIn?.otp && !application.checkIn?.otpUsed && (
            <Button 
              variant="contained" 
              startIcon={<CheckIcon />}
              onClick={() => onAction('verifyOTP', application)}
              sx={{ 
                borderRadius: 2,
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
              }}
            >
              Verify Check-in OTP
            </Button>
          )}
          
          {application.status === 'active_care' && 
           application.paymentStatus?.final?.status !== 'completed' && (
            <Chip 
              label="Waiting for Final Payment" 
              color="warning"
              icon={<ScheduleIcon />}
            />
          )}
          
          {application.status === 'active_care' && 
           application.paymentStatus?.final?.status === 'completed' && 
           !application.checkOut?.otp && (
            <Button 
              variant="contained" 
              startIcon={<PickupIcon />}
              onClick={() => onAction('generatePickupOTP', application)}
              sx={{ 
                borderRadius: 2,
                background: 'linear-gradient(135deg, #FF8A80 0%, #FF5722 100%)'
              }}
            >
              Generate Pickup OTP
            </Button>
          )}
          
          {application.status === 'active_care' && 
           application.checkOut?.otp && 
           !application.checkOut?.otpUsed && (
            <Button 
              variant="contained" 
              startIcon={<CheckIcon />}
              onClick={() => onAction('verifyPickupOTP', application)}
              sx={{ 
                borderRadius: 2,
                background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)'
              }}
            >
              Complete Pickup
            </Button>
          )}
          
          {application.status === 'completed' && (
            <Chip 
              label="Completed" 
              color="success"
              icon={<CheckIcon />}
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ModernApplicationCard;