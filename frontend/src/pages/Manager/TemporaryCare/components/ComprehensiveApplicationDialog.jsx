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
  Alert,
  CardMedia,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
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
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { resolveMediaUrl } from '../../../../services/api';

const ComprehensiveApplicationDialog = ({ open, onClose, application }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!application) return null;

  const getStatusInfo = (status) => {
    const statusMap = {
      submitted: { 
        label: 'New Application', 
        color: '#FF9800', 
        bgColor: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
        icon: '🆕',
        progress: 20
      },
      price_determined: { 
        label: 'Awaiting Payment', 
        color: '#2196F3', 
        bgColor: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
        icon: '💰',
        progress: 40
      },
      advance_paid: { 
        label: 'Ready for Check-in', 
        color: '#9C27B0', 
        bgColor: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
        icon: '🏠',
        progress: 60
      },
      active_care: { 
        label: 'Pet in Care', 
        color: '#4CAF50', 
        bgColor: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
        icon: '🐕',
        progress: 80
      },
      completed: { 
        label: 'Completed', 
        color: '#4CAF50', 
        bgColor: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
        icon: '✅',
        progress: 100
      }
    };
    return statusMap[status] || statusMap.submitted;
  };

  const getPetImage = (pet) => {
    const petData = pet.petDetails || {};
    if (petData.profileImage) return resolveMediaUrl(petData.profileImage);
    if (petData.images && petData.images.length > 0) {
      return resolveMediaUrl(petData.images[0].url || petData.images[0]);
    }
    if (petData.image) return resolveMediaUrl(petData.image);
    if (petData.imageUrl) return resolveMediaUrl(petData.imageUrl);
    return '/placeholder-pet.svg';
  };

  const statusInfo = getStatusInfo(application.status);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: statusInfo.bgColor,
        color: 'white',
        position: 'relative',
        pb: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" fontWeight="700" gutterBottom>
              Application Details
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {application.applicationNumber || `TCA-${application._id?.slice(-8)}`}
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
        
        {/* Status Progress */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Chip
              label={statusInfo.label}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 600,
                fontSize: '14px',
                height: 32
              }}
              icon={<span style={{ fontSize: '16px' }}>{statusInfo.icon}</span>}
            />
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Applied on {new Date(application.createdAt).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={statusInfo.progress}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'white',
                borderRadius: 4
              }
            }}
          />
          <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.9 }}>
            {statusInfo.progress}% Complete
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, v) => setActiveTab(v)}
            sx={{ 
              px: 3,
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '16px'
              }
            }}
          >
            <Tab label="Owner & Schedule" icon={<PersonIcon />} />
            <Tab label="Pet Details" icon={<PetsIcon />} />
            <Tab label="Pricing & Payment" icon={<MoneyIcon />} />
            <Tab label="Timeline" icon={<TimelineIcon />} />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Owner & Schedule Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              {/* Owner Information */}
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2, boxShadow: 3, height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon color="primary" />
                      Owner Information
                    </Typography>
                    
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
                        <Stack direction="column" spacing={1}>
                          {application.userId?.phone && (
                            <Chip 
                              icon={<PhoneIcon />} 
                              label={application.userId.phone} 
                              variant="outlined"
                              sx={{ borderRadius: 2, alignSelf: 'flex-start' }}
                            />
                          )}
                          {application.userId?.email && (
                            <Chip 
                              icon={<EmailIcon />} 
                              label={application.userId.email} 
                              variant="outlined"
                              sx={{ borderRadius: 2, alignSelf: 'flex-start' }}
                            />
                          )}
                        </Stack>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Schedule Information */}
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2, boxShadow: 3, height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon color="primary" />
                      Care Schedule
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
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
                        </Paper>
                      </Grid>
                      <Grid item xs={12}>
                        <Paper sx={{ p: 2, bgcolor: 'secondary.light', color: 'secondary.contrastText', borderRadius: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
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
                        </Paper>
                      </Grid>
                      <Grid item xs={12}>
                        <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 2, textAlign: 'center' }}>
                          <Typography variant="h3" fontWeight="bold">
                            {application.numberOfDays}
                          </Typography>
                          <Typography variant="body1">
                            Total Days
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Pet Details Tab */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              {application.pets && application.pets.length > 0 ? (
                application.pets.map((pet, index) => {
                  const petData = pet.petDetails || pet.petId || {};
                  const petImage = getPetImage(pet);
                  
                  return (
                    <Grid item xs={12} md={6} key={index}>
                      <Card sx={{ borderRadius: 2, boxShadow: 3, height: '100%' }}>
                        <Box sx={{ position: 'relative' }}>
                          <CardMedia
                            component="img"
                            height="200"
                            image={petImage}
                            alt={petData?.name || 'Pet'}
                            sx={{ objectFit: 'cover' }}
                            onError={(e) => { e.currentTarget.src = '/placeholder-pet.svg' }}
                          />
                          <Box sx={{ 
                            position: 'absolute', 
                            top: 16, 
                            right: 16,
                            bgcolor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            px: 2,
                            py: 1,
                            borderRadius: 2
                          }}>
                            <Typography variant="caption" fontWeight="600">
                              Pet {index + 1}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <CardContent sx={{ p: 3 }}>
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
                          </Stack>

                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            {(petData?.age || pet?.age) && (
                              <Grid item xs={6}>
                                <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'grey.100' }}>
                                  <Typography variant="caption">Age</Typography>
                                  <Typography variant="body2" fontWeight="600">
                                    {petData?.age || pet?.age}
                                  </Typography>
                                </Paper>
                              </Grid>
                            )}
                            {(petData?.gender || pet?.gender) && (
                              <Grid item xs={6}>
                                <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'grey.100' }}>
                                  <Typography variant="caption">Gender</Typography>
                                  <Typography variant="body2" fontWeight="600">
                                    {petData?.gender || pet?.gender}
                                  </Typography>
                                </Paper>
                              </Grid>
                            )}
                          </Grid>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            <strong>Pet Code:</strong> {pet.petId}
                          </Typography>
                          
                          {/* Special Instructions */}
                          <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                              <List dense>
                                {pet.specialInstructions.food && (
                                  <ListItem>
                                    <ListItemIcon><FoodIcon color="info" /></ListItemIcon>
                                    <ListItemText 
                                      primary="Food Instructions"
                                      secondary={pet.specialInstructions.food}
                                    />
                                  </ListItem>
                                )}
                                {pet.specialInstructions.medicine && (
                                  <ListItem>
                                    <ListItemIcon><MedicalIcon color="warning" /></ListItemIcon>
                                    <ListItemText 
                                      primary="Medicine Instructions"
                                      secondary={pet.specialInstructions.medicine}
                                    />
                                  </ListItem>
                                )}
                                {pet.specialInstructions.allergies && (
                                  <ListItem>
                                    <ListItemIcon><WarningIcon color="error" /></ListItemIcon>
                                    <ListItemText 
                                      primary="⚠️ Allergies"
                                      secondary={pet.specialInstructions.allergies}
                                    />
                                  </ListItem>
                                )}
                                {pet.specialInstructions.behavior && (
                                  <ListItem>
                                    <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                                    <ListItemText 
                                      primary="Behavior Notes"
                                      secondary={pet.specialInstructions.behavior}
                                    />
                                  </ListItem>
                                )}
                                {pet.specialInstructions.otherNotes && (
                                  <ListItem>
                                    <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                                    <ListItemText 
                                      primary="Other Notes"
                                      secondary={pet.specialInstructions.otherNotes}
                                    />
                                  </ListItem>
                                )}
                              </List>
                            )}
                          </Paper>
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
                  <Grid item xs={12} md={8}>
                    <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
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
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 3, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 2 }}>
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
                  
                  <Grid item xs={12} md={4}>
                    <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckIcon color="primary" />
                          Payment Status
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        
                        {application.paymentStatus?.advance?.status === 'completed' ? (
                          <Alert severity="success" sx={{ borderRadius: 2 }}>
                            <Typography variant="body1" fontWeight="600">
                              ✅ Advance payment received
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              ₹{application.pricing?.advanceAmount?.toLocaleString()}
                            </Typography>
                            {application.paymentStatus.advance.paidAt && (
                              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
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

          {/* Timeline Tab */}
          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimelineIcon color="primary" />
                Application Timeline
              </Typography>
              
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Paper sx={{ p: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
                  <Typography variant="body1" fontWeight="600">Application Submitted</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(application.createdAt).toLocaleString()}
                  </Typography>
                </Paper>
                
                {application.pricing && (
                  <Paper sx={{ p: 2, borderLeft: '4px solid', borderColor: 'info.main' }}>
                    <Typography variant="body1" fontWeight="600">Pricing Determined</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total: ₹{application.pricing.totalAmount?.toLocaleString()}
                    </Typography>
                  </Paper>
                )}
                
                {application.paymentStatus?.advance?.status === 'completed' && (
                  <Paper sx={{ p: 2, borderLeft: '4px solid', borderColor: 'success.main' }}>
                    <Typography variant="body1" fontWeight="600">Advance Payment Received</Typography>
                    <Typography variant="body2" color="text.secondary">
                      ₹{application.pricing?.advanceAmount?.toLocaleString()} paid
                    </Typography>
                  </Paper>
                )}
                
                {application.status === 'active_care' && (
                  <Paper sx={{ p: 2, borderLeft: '4px solid', borderColor: 'warning.main' }}>
                    <Typography variant="body1" fontWeight="600">Pet Check-in Completed</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pet is now in care
                    </Typography>
                  </Paper>
                )}
                
                {application.status === 'completed' && (
                  <Paper sx={{ p: 2, borderLeft: '4px solid', borderColor: 'success.main' }}>
                    <Typography variant="body1" fontWeight="600">Care Completed</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pet returned to owner
                    </Typography>
                  </Paper>
                )}
              </Stack>
            </Box>
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

export default ComprehensiveApplicationDialog;