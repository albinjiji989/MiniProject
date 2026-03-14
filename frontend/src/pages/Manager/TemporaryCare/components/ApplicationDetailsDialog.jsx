import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Divider,
  Avatar,
  Stack,
  Alert,
  Paper
} from '@mui/material';
import {
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Pets as PetsIcon,
  Restaurant as FoodIcon,
  LocalHospital as MedicalIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Add as AddIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { resolveMediaUrl } from '../../../../services/api';

const ApplicationDetailsDialog = ({ 
  open, 
  onClose, 
  application, 
  onAction 
}) => {
  const [activeTab, setActiveTab] = useState(0);

  // Debug logging
  React.useEffect(() => {
    if (application) {
      console.log('🎭 Dialog received application:', application);
      console.log('🐕 Pet data in dialog:', application.pets?.map(pet => ({
        petId: pet.petId,
        hasDetails: !!pet.petDetails,
        petName: pet.petDetails?.name,
        species: pet.petDetails?.species?.name || pet.petDetails?.speciesId?.name,
        breed: pet.petDetails?.breed?.name || pet.petDetails?.breedId?.name,
        images: pet.petDetails?.images?.length || 0
      })));
    }
  }, [application]);

  if (!application) return null;

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

  const getPetImage = (pet) => {
    const petData = pet.petDetails || {};
    
    console.log(`🖼️ Getting image for pet ${pet.petId}:`, {
      hasProfileImage: !!petData.profileImage,
      hasImages: !!(petData.images && petData.images.length > 0),
      hasImage: !!petData.image,
      profileImage: petData.profileImage,
      imagesArray: petData.images,
      singleImage: petData.image
    });
    
    // Try different image sources
    if (petData.profileImage) {
      console.log(`✅ Using profileImage: ${petData.profileImage}`);
      return resolveMediaUrl(petData.profileImage);
    }
    if (petData.images && petData.images.length > 0) {
      const imageUrl = petData.images[0].url || petData.images[0];
      console.log(`✅ Using first image from array: ${imageUrl}`);
      return resolveMediaUrl(imageUrl);
    }
    if (petData.image) {
      console.log(`✅ Using single image: ${petData.image}`);
      return resolveMediaUrl(petData.image);
    }
    
    console.log(`❌ No image found for pet ${pet.petId}`);
    return null;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">Application Details</Typography>
            <Typography variant="caption" color="text.secondary">
              {application.applicationNumber || `APP-${application._id?.slice(-8)}`}
            </Typography>
          </Box>
          <Chip
            label={application.status?.replace(/_/g, ' ').toUpperCase()}
            color={getStatusColor(application.status)}
          />
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Tabs 
          value={activeTab} 
          onChange={(e, v) => setActiveTab(v)} 
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Owner & Contact" />
          <Tab label="Pet Details" />
          <Tab label="Pricing & Payment" />
        </Tabs>

        {/* Owner Info Tab */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="primary" />
                    Owner Information
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Full Name</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {application.userId?.name || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Email</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {application.userId?.email || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Phone</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {application.userId?.phone || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">User ID</Typography>
                      <Typography variant="body1" fontWeight="500" sx={{ fontFamily: 'monospace' }}>
                        {application.userId?._id || 'Unknown'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon color="primary" />
                    Booking Duration
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Check-In Date</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {new Date(application.startDate).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Check-Out Date</Typography>
                      <Typography variant="body1" fontWeight="500">
                        {new Date(application.endDate).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Total Duration</Typography>
                      <Typography variant="body1" fontWeight="500" color="primary.main">
                        {application.numberOfDays} Days
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Pet Details Tab */}
        {activeTab === 1 && (
          <Box>
            {application.pets && application.pets.length > 0 ? (
              application.pets.map((pet, index) => {
                const petData = pet.petDetails || pet.petId || {};
                const petImage = getPetImage(pet);
                
                console.log(`🐕 Rendering pet ${index + 1}:`, {
                  petId: pet.petId,
                  hasDetails: !!pet.petDetails,
                  petData: petData,
                  petImage: petImage
                });
                
                return (
                  <Card key={index} sx={{ mb: 2 }} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Avatar
                          src={petImage}
                          sx={{ width: 80, height: 80 }}
                        >
                          <PetsIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6">
                            {petData?.name || `Pet ${index + 1} (${pet.petId})`}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ my: 1 }}>
                            <Chip 
                              label={
                                petData?.speciesId?.name || 
                                petData?.species?.name || 
                                petData?.species || 
                                'Species Unknown'
                              } 
                              size="small" 
                            />
                            <Chip 
                              label={
                                petData?.breed?.name || 
                                petData?.breedId?.name || 
                                petData?.breed || 
                                'Breed Unknown'
                              } 
                              size="small" 
                              variant="outlined" 
                            />
                            <Chip 
                              label={`${petData?.age || 'Age Unknown'}`} 
                              size="small" 
                              variant="outlined" 
                            />
                          </Stack>
                          
                          {/* Debug info */}
                          {process.env.NODE_ENV === 'development' && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                              <Typography variant="caption">
                                Debug: Pet ID: {pet.petId} | Has Details: {pet.petDetails ? 'Yes' : 'No'} | 
                                Images: {petData?.images?.length || 0}
                              </Typography>
                            </Alert>
                          )}
                          
                          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                              Special Instructions:
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
                              <>
                                {pet.specialInstructions.food && (
                                  <Typography variant="body2" sx={{ mt: 1 }}>
                                    <FoodIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle', color: 'success.main' }} />
                                    <strong>Food:</strong> {pet.specialInstructions.food}
                                  </Typography>
                                )}
                                {pet.specialInstructions.medicine && (
                                  <Typography variant="body2" sx={{ mt: 1 }}>
                                    <MedicalIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                                    <strong>Medicine:</strong> {pet.specialInstructions.medicine}
                                  </Typography>
                                )}
                                {pet.specialInstructions.behavior && (
                                  <Typography variant="body2" sx={{ mt: 1 }}>
                                    <strong>Behavior:</strong> {pet.specialInstructions.behavior}
                                  </Typography>
                                )}
                                {pet.specialInstructions.allergies && (
                                  <Typography variant="body2" sx={{ mt: 1 }} color="error.main">
                                    <strong>⚠️ Allergies:</strong> {pet.specialInstructions.allergies}
                                  </Typography>
                                )}
                                {pet.specialInstructions.otherNotes && (
                                  <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                                    <strong>Other Notes:</strong> {pet.specialInstructions.otherNotes}
                                  </Typography>
                                )}
                              </>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Alert severity="info">No pet information available</Alert>
            )}
          </Box>
        )}

        {/* Pricing Tab */}
        {activeTab === 2 && (
          <Grid container spacing={2}>
            {application.pricing?.totalAmount ? (
              <>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Pricing Breakdown</Typography>
                      <Divider sx={{ my: 2 }} />
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography>Subtotal:</Typography>
                          <Typography fontWeight="500">₹{application.pricing.subtotal?.toLocaleString()}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography>Tax ({application.pricing.tax?.percentage}%):</Typography>
                          <Typography fontWeight="500">₹{application.pricing.tax?.amount?.toLocaleString()}</Typography>
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="h6">Total Amount:</Typography>
                          <Typography variant="h6" color="primary">₹{application.pricing.totalAmount?.toLocaleString()}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: 'success.lighter', p: 1, borderRadius: 1 }}>
                          <Typography>Advance (50%):</Typography>
                          <Typography fontWeight="600">₹{application.pricing.advanceAmount?.toLocaleString()}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography color="text.secondary">Remaining:</Typography>
                          <Typography color="text.secondary">₹{application.pricing.remainingAmount?.toLocaleString()}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Payment Status</Typography>
                      <Divider sx={{ my: 2 }} />
                      {application.paymentStatus?.advance?.status === 'completed' ? (
                        <Alert severity="success">
                          Advance payment of ₹{application.pricing?.advanceAmount?.toLocaleString()} received
                          {application.paymentStatus.advance.paidAt && ` on ${new Date(application.paymentStatus.advance.paidAt).toLocaleDateString()}`}
                        </Alert>
                      ) : (
                        <Alert severity="warning">Advance payment pending</Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </>
            ) : (
              <Grid item xs={12}>
                <Alert severity="info">Pricing not yet determined</Alert>
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        
        {/* Action buttons based on status */}
        {application.status === 'advance_paid' && (
          <>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => onAction('generateOTP')}
            >
              Generate OTP
            </Button>
            <Button 
              variant="contained" 
              color="success"
              startIcon={<CheckIcon />}
              onClick={() => onAction('verifyOTP')}
            >
              Verify OTP
            </Button>
          </>
        )}
        
        {/* Reject - Only allowed before payment */}
        {!['approved', 'advance_paid', 'active_care', 'completed', 'cancelled', 'rejected'].includes(application.status) && (
          <Button 
            variant="outlined" 
            color="error"
            startIcon={<RejectIcon />}
            onClick={() => onAction('reject')}
          >
            Reject Application
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ApplicationDetailsDialog;