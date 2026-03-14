import React, { useState } from 'react';
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
  Collapse,
  IconButton,
  Divider,
  Badge,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Visibility as ViewIcon,
  AttachMoney as MoneyIcon,
  Check as CheckIcon,
  Schedule as ScheduleIcon,
  Pets as PetsIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Phone as PhoneIcon,
  LocalShipping as PickupIcon
} from '@mui/icons-material';
import { resolveMediaUrl } from '../../../../services/api';

const CompactApplicationCard = ({ application, onAction }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusConfig = (status) => {
    const configs = {
      submitted: { 
        label: 'New', 
        color: '#FF9800', 
        bgColor: '#FFF3E0',
        textColor: '#E65100',
        priority: 'high'
      },
      price_determined: { 
        label: 'Priced', 
        color: '#2196F3', 
        bgColor: '#E3F2FD',
        textColor: '#0D47A1',
        priority: 'medium'
      },
      advance_paid: { 
        label: 'Ready', 
        color: '#9C27B0', 
        bgColor: '#F3E5F5',
        textColor: '#4A148C',
        priority: 'high'
      },
      active_care: { 
        label: 'In Care', 
        color: '#4CAF50', 
        bgColor: '#E8F5E8',
        textColor: '#1B5E20',
        priority: 'active'
      },
      completed: { 
        label: 'Done', 
        color: '#4CAF50', 
        bgColor: '#E8F5E8',
        textColor: '#1B5E20',
        priority: 'low'
      },
      rejected: { 
        label: 'Rejected', 
        color: '#F44336', 
        bgColor: '#FFEBEE',
        textColor: '#B71C1C',
        priority: 'low'
      }
    };
    return configs[status] || configs.submitted;
  };

  const getPetImage = (pet) => {
    const petData = pet.petDetails || {};
    if (petData.profileImage) return resolveMediaUrl(petData.profileImage);
    if (petData.images && petData.images.length > 0) {
      return resolveMediaUrl(petData.images[0].url || petData.images[0]);
    }
    return '/placeholder-pet.svg';
  };

  const getActionButton = () => {
    const { status } = application;
    
    if (status === 'submitted') {
      return (
        <Button 
          size="small" 
          variant="contained" 
          startIcon={<MoneyIcon />}
          onClick={() => onAction('setPricing', application)}
          sx={{ 
            bgcolor: '#FF9800', 
            '&:hover': { bgcolor: '#F57C00' },
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Set Price
        </Button>
      );
    }
    
    if (status === 'advance_paid' && !application.checkIn?.otp) {
      return (
        <Button 
          size="small" 
          variant="contained" 
          startIcon={<CheckIcon />}
          onClick={() => onAction('generateOTP', application)}
          sx={{ 
            bgcolor: '#9C27B0', 
            '&:hover': { bgcolor: '#7B1FA2' },
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Check-in
        </Button>
      );
    }
    
    if (status === 'advance_paid' && application.checkIn?.otp && !application.checkIn?.otpUsed) {
      return (
        <Button 
          size="small" 
          variant="contained" 
          startIcon={<CheckIcon />}
          onClick={() => onAction('verifyOTP', application)}
          sx={{ 
            bgcolor: '#4CAF50', 
            '&:hover': { bgcolor: '#388E3C' },
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Verify OTP
        </Button>
      );
    }
    
    if (status === 'active_care' && 
        application.paymentStatus?.final?.status === 'completed' && 
        !application.checkOut?.otp) {
      return (
        <Button 
          size="small" 
          variant="contained" 
          startIcon={<PickupIcon />}
          onClick={() => onAction('generatePickupOTP', application)}
          sx={{ 
            bgcolor: '#FF5722', 
            '&:hover': { bgcolor: '#D84315' },
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Pickup
        </Button>
      );
    }
    
    return (
      <Button 
        size="small" 
        variant="outlined" 
        startIcon={<ViewIcon />}
        onClick={() => onAction('view', application)}
        sx={{ textTransform: 'none' }}
      >
        View
      </Button>
    );
  };

  const statusConfig = getStatusConfig(application.status);
  const appNumber = application.applicationNumber || `TCA-${application._id?.slice(-6)}`;
  const petCount = application.pets?.length || 0;
  const totalAmount = application.pricing?.totalAmount;

  return (
    <Card 
      sx={{ 
        borderRadius: 2,
        border: `2px solid ${statusConfig.color}20`,
        transition: 'all 0.2s ease',
        '&:hover': { 
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 25px ${statusConfig.color}25`
        },
        position: 'relative',
        overflow: 'visible'
      }}
    >
      {/* Priority Indicator */}
      {statusConfig.priority === 'high' && (
        <Box
          sx={{
            position: 'absolute',
            top: -8,
            right: 16,
            width: 16,
            height: 16,
            borderRadius: '50%',
            bgcolor: '#FF4444',
            border: '3px solid white',
            zIndex: 1
          }}
        />
      )}

      <CardContent sx={{ p: 2 }}>
        {/* Header Row */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar 
              sx={{ 
                width: 40, 
                height: 40,
                bgcolor: statusConfig.color,
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {application.userId?.name?.[0] || 'U'}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="700" sx={{ fontSize: '16px', lineHeight: 1.2 }}>
                {appNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
                {application.userId?.name || 'Unknown User'}
              </Typography>
            </Box>
          </Box>
          
          <Chip
            label={statusConfig.label}
            sx={{
              bgcolor: statusConfig.bgColor,
              color: statusConfig.textColor,
              fontWeight: 600,
              fontSize: '11px',
              height: 24
            }}
          />
        </Box>

        {/* Key Metrics Row */}
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Badge badgeContent={petCount} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '10px' } }}>
                <PetsIcon color="action" sx={{ fontSize: 20 }} />
              </Badge>
              <Typography variant="caption" display="block" color="text.secondary">
                Pets
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              <CalendarIcon color="action" sx={{ fontSize: 20 }} />
              <Typography variant="caption" display="block" fontWeight="600">
                {application.numberOfDays}d
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                Duration
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              <MoneyIcon color="action" sx={{ fontSize: 20 }} />
              <Typography variant="caption" display="block" fontWeight="600">
                {totalAmount ? `₹${(totalAmount / 1000).toFixed(1)}k` : 'TBD'}
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                Cost
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Action Row */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {getActionButton()}
          
          <IconButton 
            size="small" 
            onClick={() => setExpanded(!expanded)}
            sx={{ 
              bgcolor: 'grey.100',
              '&:hover': { bgcolor: 'grey.200' }
            }}
          >
            {expanded ? <CollapseIcon /> : <ExpandIcon />}
          </IconButton>
        </Box>

        {/* Expandable Details */}
        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />
          
          {/* Contact Info */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '12px', fontWeight: 600 }}>
              Contact Details
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {application.userId?.phone && (
                <Chip 
                  icon={<PhoneIcon />} 
                  label={application.userId.phone} 
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '10px', height: 24 }}
                />
              )}
              {application.userId?.email && (
                <Tooltip title={application.userId.email}>
                  <Chip 
                    label={application.userId.email.split('@')[0]} 
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '10px', height: 24 }}
                  />
                </Tooltip>
              )}
            </Stack>
          </Box>

          {/* Pet Preview */}
          {application.pets && application.pets.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '12px', fontWeight: 600 }}>
                Pet Details
              </Typography>
              <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
                {application.pets.slice(0, 3).map((pet, index) => (
                  <Box 
                    key={index}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      p: 1, 
                      bgcolor: 'grey.50', 
                      borderRadius: 1,
                      minWidth: 120,
                      flexShrink: 0
                    }}
                  >
                    <Avatar
                      src={getPetImage(pet)}
                      sx={{ width: 32, height: 32 }}
                    >
                      <PetsIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" fontWeight="600" noWrap>
                        {pet.petDetails?.name || `Pet ${pet.petId}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" noWrap>
                        {pet.petDetails?.species || 'Unknown'}
                      </Typography>
                    </Box>
                  </Box>
                ))}
                {application.pets.length > 3 && (
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      p: 1, 
                      bgcolor: 'grey.100', 
                      borderRadius: 1,
                      minWidth: 60,
                      flexShrink: 0
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      +{application.pets.length - 3}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          )}

          {/* Schedule */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '12px', fontWeight: 600 }}>
              Schedule
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Box sx={{ p: 1, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 1, textAlign: 'center' }}>
                  <Typography variant="caption" display="block">Check-in</Typography>
                  <Typography variant="caption" fontWeight="600">
                    {new Date(application.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 1, bgcolor: 'secondary.light', color: 'secondary.contrastText', borderRadius: 1, textAlign: 'center' }}>
                  <Typography variant="caption" display="block">Check-out</Typography>
                  <Typography variant="caption" fontWeight="600">
                    {new Date(application.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default CompactApplicationCard;