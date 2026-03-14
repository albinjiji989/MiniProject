import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Stack,
  Divider,
  IconButton,
  Paper,
  LinearProgress,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Pets as PetsIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Restaurant as FoodIcon,
  LocalHospital as MedicalIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { resolveMediaUrl } from '../../../../services/api';

const BeautifulApplicationDialog = ({ open, onClose, application }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!application) return null;

  const getStatusInfo = (status) => {
    const statusMap = {
      submitted: { 
        label: 'New Application', 
        color: '#FF9800', 
        bgColor: '#FFF3E0',
        icon: '🆕',
        progress: 20
      },
      price_determined: { 
        label: 'Awaiting Payment', 
        color: '#2196F3', 
        bgColor: '#E3F2FD',
        icon: '💰',
        progress: 40
      },
      advance_paid: { 
        label: 'Ready for Check-in', 
        color: '#9C27B0', 
        bgColor: '#F3E5F5',
        icon: '🏠',
        progress: 60
      },
      active_care: { 
        label: 'Pet in Care', 
        color: '#4CAF50', 
        bgColor: '#E8F5E8',
        icon: '🐕',
        progress: 80
      },
      completed: { 
        label: 'Completed', 
        color: '#4CAF50', 
        bgColor: '#E8F5E8',
        icon: '✅',
        progress: 100
      }
    };
    return statusMap[status] || statusMap.submitted;
  };

  const getPetImage = (pet) => {
    // Try multiple possible data structures
    const petData = pet.petDetails || pet.petId || pet || {};
    
    // Debug logging to see the actual structure
    console.log('🐕 Dialog Pet image data:', {
      pet,
      petData,
      hasProfileImage: !!petData.profileImage,
      hasImages: !!(petData.images && petData.images.length > 0),
      hasImage: !!petData.image,
      hasImageUrl: !!petData.imageUrl,
      hasImageIds: !!(petData.imageIds && petData.imageIds.length > 0)
    });
    
    // Try different image sources in order of preference
    
    // 1. Profile image (most common for user pets)
    if (petData.profileImage) {
      console.log('📸 Dialog Using profileImage:', petData.profileImage);
      return resolveMediaUrl(petData.profileImage);
    }
    
    // 2. Images array with URL property (adoption/user pets)
    if (petData.images && petData.images.length > 0) {
      const imageUrl = petData.images[0].url || petData.images[0];
      console.log('📸 Dialog Using images array:', imageUrl);
      return resolveMediaUrl(imageUrl);
    }
    
    // 3. Direct image field
    if (petData.image) {
      console.log('📸 Dialog Using image field:', petData.image);
      return resolveMediaUrl(petData.image);
    }
    
    // 4. Image URL field (some pet types)
    if (petData.imageUrl) {
      console.log('📸 Dialog Using imageUrl field:', petData.imageUrl);
      return resolveMediaUrl(petData.imageUrl);
    }
    
    // 5. Image IDs array (petshop pets)
    if (petData.imageIds && petData.imageIds.length > 0) {
      const imageId = petData.imageIds[0].url || petData.imageIds[0];
      console.log('📸 Dialog Using imageIds array:', imageId);
      return resolveMediaUrl(imageId);
    }
    
    // 6. Try accessing images directly from pet object (fallback)
    if (pet.images && pet.images.length > 0) {
      const imageUrl = pet.images[0].url || pet.images[0];
      console.log('📸 Dialog Using pet.images fallback:', imageUrl);
      return resolveMediaUrl(imageUrl);
    }
    
    // 7. Try profileImage directly from pet object
    if (pet.profileImage) {
      console.log('📸 Dialog Using pet.profileImage fallback:', pet.profileImage);
      return resolveMediaUrl(pet.profileImage);
    }
    
    console.log('❌ Dialog No image found for pet, using placeholder');
    return '/placeholder-pet.svg'; // Always return placeholder instead of null
  };

  const statusInfo = getStatusInfo(application.status);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        position: 'relative'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" fontWeight="700">
              Application Details
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {application.applicationNumber || `APP-${application._id?.slice(-8)}`}
            </Typography>
          </Box>
          <IconButton 
            onClick={onClose}
            sx={{ 
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Status Header */}
        <Paper sx={{ 
          p: 3, 
          m: 3, 
          borderRadius: 2,
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(10px)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Chip
              label={statusInfo.label}
              sx={{
                bgcolor: statusInfo.bgColor,
                color: statusInfo.color,
                fontWeight: 600,
                fontSize: '14px',
                height: 32
              }}
              icon={<span style={{ fontSize: '16px' }}>{statusInfo.icon}</span>}
            />
            <Typography variant="body2" color="text.secondary">
              Applied on {new Date(application.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={statusInfo.progress}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: statusInfo.color,
                borderRadius: 4
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {statusInfo.progress}% Complete
          </Typography>
        </Paper>

        {/* Tabs */}
        <Box sx={{ px: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, v) => setActiveTab(v)}
            sx={{ 
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none'
              }
            }}
          >
            <Tab label="Owner & Contact" icon={<PersonIcon />} />
            <Tab label="Pet Details" icon={<PetsIcon />} />
            <Tab label="Pricing & Payment" icon={<MoneyIcon />} />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Owner Info Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                      <Avatar sx={{ 
                        width: 80, 
                        height: 80,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontSize: '32px',
                        fontWeight: 'bold'
                      }}>
                        {application.userId?.name?.[0] || 'U'}
                      </Avatar>
                      <Box>
                        <Typography variant="h5" fontWeight="600" gutterBottom>
                          {application.userId?.name || 'Unknown User'}
                        </Typography>
                        <Stack direction="row" spacing={2}>
                          {application.userId?.phone && (
                            <Chip 
                              icon={<PhoneIcon />} 
                              label={application.userId.phone} 
                              variant="outlined"
                              sx={{ borderRadius: 2 }}
                            />
                          )}
                          {application.userId?.email && (
                            <Chip 
                              icon={<EmailIcon />} 
                              label={application.userId.email} 
                              variant="outlined"
                              sx={{ borderRadius: 2 }}
                            />
                          )}
                        </Stack>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <CalendarIcon color="primary" sx={{ mb: 1 }} />
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Check-in Date
                          </Typography>
                          <Typography variant="h6" fontWeight="600">
                            {new Date(application.startDate).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <CalendarIcon color="primary" sx={{ mb: 1 }} />
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Check-out Date
                          </Typography>
                          <Typography variant="h6" fontWeight="600">
                            {new Date(application.endDate).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 2, textAlign: 'center' }}>
                          <Typography variant="h4" fontWeight="bold">
                            {application.numberOfDays} Days
                          </Typography>
                          <Typography variant="body2">
                            Total Duration
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Pet Details Tab */}
          {activeTab === 1 && (
            <Grid container spacing={2}>
              {application.pets && application.pets.length > 0 ? (
                application.pets.map((pet, index) => {
                  const petData = pet.petDetails || pet.petId || pet || {};
                  const petImage = getPetImage(pet);
                  
                  // Debug logging for pet data in dialog
                  console.log(`🐕 Dialog Pet ${index + 1} data:`, {
                    pet,
                    petData,
                    name: petData.name,
                    species: petData.species || petData.speciesId?.name,
                    breed: petData.breed || petData.breedId?.name,
                    age: petData.age
                  });
                  
                  return (
                    <Grid item xs={12} key={index}>
                      <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', gap: 3 }}>
                            <Avatar
                              src={petImage}
                              sx={{ 
                                width: 100, 
                                height: 100,
                                border: '4px solid white',
                                boxShadow: 3
                              }}
                            >
                              <PetsIcon sx={{ fontSize: 40 }} />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h5" fontWeight="600" gutterBottom>
                                {petData?.name || pet?.name || `Pet ${pet?.petId || 'Unknown'}`}
                              </Typography>
                              <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
                                <Chip 
                                  label={
                                    petData?.species || 
                                    petData?.speciesId?.name || 
                                    petData?.speciesId?.displayName ||
                                    pet?.species?.name || 
                                    pet?.species || 
                                    'Species Unknown'
                                  } 
                                  color="primary"
                                  sx={{ borderRadius: 2 }}
                                />
                                <Chip 
                                  label={
                                    petData?.breed || 
                                    petData?.breedId?.name || 
                                    pet?.breed?.name || 
                                    pet?.breed || 
                                    'Breed Unknown'
                                  } 
                                  variant="outlined"
                                  sx={{ borderRadius: 2 }}
                                />
                                <Chip 
                                  label={`Age: ${petData?.age || pet?.age || 'Unknown'}`} 
                                  variant="outlined"
                                  sx={{ borderRadius: 2 }}
                                />
                                {(petData?.gender || pet?.gender) && (
                                  <Chip 
                                    label={`Gender: ${petData?.gender || pet?.gender}`} 
                                    variant="outlined"
                                    sx={{ borderRadius: 2 }}
                                  />
                                )}
                                {(petData?.color || pet?.color) && (
                                  <Chip 
                                    label={`Color: ${petData?.color || pet?.color}`} 
                                    variant="outlined"
                                    sx={{ borderRadius: 2 }}
                                  />
                                )}
                              </Stack>
                              
                              {/* Special Instructions */}
                              <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                <Typography variant="subtitle1" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <MedicalIcon />
                                  Special Care Instructions
                                </Typography>
                                
                                {!pet.specialInstructions || 
                                 (!pet.specialInstructions.food && 
                                  !pet.specialInstructions.medicine && 
                                  !pet.specialInstructions.behavior && 
                                  !pet.specialInstructions.allergies && 
                                  !pet.specialInstructions.otherNotes) ? (
                                  <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                    No special instructions provided
                                  </Typography>
                                ) : (
                                  <Stack spacing={1}>
                                    {pet.specialInstructions.food && (
                                      <Alert severity="info" sx={{ borderRadius: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <FoodIcon />
                                          <Typography variant="body2">
                                            <strong>Food:</strong> {pet.specialInstructions.food}
                                          </Typography>
                                        </Box>
                                      </Alert>
                                    )}
                                    {pet.specialInstructions.medicine && (
                                      <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <MedicalIcon />
                                          <Typography variant="body2">
                                            <strong>Medicine:</strong> {pet.specialInstructions.medicine}
                                          </Typography>
                                        </Box>
                                      </Alert>
                                    )}
                                    {pet.specialInstructions.allergies && (
                                      <Alert severity="error" sx={{ borderRadius: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <WarningIcon />
                                          <Typography variant="body2">
                                            <strong>⚠️ Allergies:</strong> {pet.specialInstructions.allergies}
                                          </Typography>
                                        </Box>
                                      </Alert>
                                    )}
                                    {pet.specialInstructions.behavior && (
                                      <Alert severity="info" sx={{ borderRadius: 2 }}>
                                        <Typography variant="body2">
                                          <strong>Behavior Notes:</strong> {pet.specialInstructions.behavior}
                                        </Typography>
                                      </Alert>
                                    )}
                                    {pet.specialInstructions.otherNotes && (
                                      <Alert severity="info" sx={{ borderRadius: 2 }}>
                                        <Typography variant="body2">
                                          <strong>Other Notes:</strong> {pet.specialInstructions.otherNotes}
                                        </Typography>
                                      </Alert>
                                    )}
                                  </Stack>
                                )}
                              </Paper>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })
              ) : (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    No pet information available
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}

          {/* Pricing Tab */}
          {activeTab === 2 && (
            <Grid container spacing={3}>
              {application.pricing?.totalAmount ? (
                <>
                  <Grid item xs={12}>
                    <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MoneyIcon color="primary" />
                          Pricing Breakdown
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        
                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <Typography variant="body1">Subtotal:</Typography>
                            <Typography variant="h6" fontWeight="600">₹{application.pricing.subtotal?.toLocaleString()}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <Typography variant="body1">Tax ({application.pricing.tax?.percentage}%):</Typography>
                            <Typography variant="h6" fontWeight="600">₹{application.pricing.tax?.amount?.toLocaleString()}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 2 }}>
                            <Typography variant="h6" fontWeight="bold">Total Amount:</Typography>
                            <Typography variant="h5" fontWeight="bold">₹{application.pricing.totalAmount?.toLocaleString()}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 2 }}>
                            <Typography variant="body1" fontWeight="600">Advance (50%):</Typography>
                            <Typography variant="h6" fontWeight="bold">₹{application.pricing.advanceAmount?.toLocaleString()}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
                            <Typography variant="body1" color="text.secondary">Remaining:</Typography>
                            <Typography variant="h6" color="text.secondary">₹{application.pricing.remainingAmount?.toLocaleString()}</Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckIcon color="primary" />
                          Payment Status
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        
                        {application.paymentStatus?.advance?.status === 'completed' ? (
                          <Alert severity="success" sx={{ borderRadius: 2 }}>
                            <Typography variant="body1" fontWeight="600">
                              ✅ Advance payment of ₹{application.pricing?.advanceAmount?.toLocaleString()} received
                            </Typography>
                            {application.paymentStatus.advance.paidAt && (
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                Paid on {new Date(application.paymentStatus.advance.paidAt).toLocaleDateString()}
                              </Typography>
                            )}
                          </Alert>
                        ) : (
                          <Alert severity="warning" sx={{ borderRadius: 2 }}>
                            <Typography variant="body1" fontWeight="600">
                              ⏳ Advance payment pending
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              Waiting for user to complete payment
                            </Typography>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              ) : (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    <Typography variant="body1" fontWeight="600">
                      💰 Pricing not yet determined
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Manager needs to set pricing for this application
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          Close
        </Button>
        <Button 
          variant="contained"
          sx={{ 
            borderRadius: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          Take Action
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BeautifulApplicationDialog;