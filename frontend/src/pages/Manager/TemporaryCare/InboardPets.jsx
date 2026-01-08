import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stack,
  Paper,
  IconButton,
  TextField
} from '@mui/material';
import {
  Pets as PetsIcon,
  Visibility as ViewIcon,
  QrCode as QrCodeIcon,
  Restaurant as FoodIcon,
  LocalHospital as MedicalIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { temporaryCareAPI, resolveMediaUrl } from '../../../services/api';

const InboardPets = () => {
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInboardPets();
  }, []);

  const loadInboardPets = async () => {
    try {
      setLoading(true);
      const response = await temporaryCareAPI.managerGetInboardPets();
      setPets(response.data?.data?.pets || []);
      setError('');
    } catch (err) {
      console.error('Error loading inboard pets:', err);
      setError(err?.response?.data?.message || 'Failed to load pets in care');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (petCode) => {
    try {
      const response = await temporaryCareAPI.managerGetInboardPetDetails(petCode);
      setSelectedPet(response.data?.data);
      setDetailsDialogOpen(true);
    } catch (err) {
      console.error('Error loading pet details:', err);
      alert(err?.response?.data?.message || 'Failed to load pet details');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpInput || otpInput.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setVerifyingOTP(true);
      await temporaryCareAPI.verifyHandoverOTP({
        applicationId: selectedPet?.application?.id,
        otp: otpInput
      });
      alert('Pet handover completed successfully!');
      setOtpDialogOpen(false);
      setOtpInput('');
      loadInboardPets();
    } catch (err) {
      console.error('Error verifying OTP:', err);
      alert(err?.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setVerifyingOTP(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Pets in Care
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {pets.length} pet{pets.length !== 1 ? 's' : ''} currently in your care
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {pets.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <PetsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No pets in care at the moment
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {pets.map((pet) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={pet.petCode}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-4px)',
                    transition: 'all 0.3s'
                  }
                }}
              >
                <Box
                  component="img"
                  src={resolveMediaUrl(pet.images?.[0]?.url) || '/placeholder-pet.svg'}
                  alt={pet.petName}
                  sx={{
                    width: '100%',
                    height: 200,
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-pet.svg';
                  }}
                />
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {pet.petName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {pet.species} • {pet.breed}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    {pet.age} {pet.ageUnit} • {pet.gender}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="caption">{pet.ownerName}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Since: {new Date(pet.startDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ViewIcon />}
                    onClick={() => handleViewDetails(pet.petCode)}
                  >
                    View Details
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pet Details Dialog */}
      {selectedPet && (
        <Dialog
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Pet Details</Typography>
              <IconButton onClick={() => setDetailsDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              {/* Pet Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  PET INFORMATION
                </Typography>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Avatar
                        src={resolveMediaUrl(selectedPet.pet?.images?.[0]?.url)}
                        sx={{ width: 80, height: 80 }}
                      >
                        <PetsIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">{selectedPet.pet?.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedPet.pet?.species} • {selectedPet.pet?.breed}
                        </Typography>
                        <Chip 
                          label={selectedPet.pet?.petCode} 
                          size="small" 
                          sx={{ mt: 0.5, fontFamily: 'monospace' }}
                        />
                      </Box>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Age</Typography>
                        <Typography variant="body2">
                          {selectedPet.pet?.age} {selectedPet.pet?.ageUnit}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Gender</Typography>
                        <Typography variant="body2">{selectedPet.pet?.gender}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Color</Typography>
                        <Typography variant="body2">{selectedPet.pet?.color}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Weight</Typography>
                        <Typography variant="body2">
                          {selectedPet.pet?.weight?.value} {selectedPet.pet?.weight?.unit}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Owner Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  OWNER INFORMATION
                </Typography>
                <Card variant="outlined">
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="body2" fontWeight={600}>{selectedPet.owner?.name}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Email</Typography>
                        <Typography variant="body2">{selectedPet.owner?.email}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Phone</Typography>
                        <Typography variant="body2">{selectedPet.owner?.phone}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Special Instructions */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  SPECIAL INSTRUCTIONS
                </Typography>
                <Card variant="outlined">
                  <CardContent>
                    <Stack spacing={2}>
                      {selectedPet.application?.specialInstructions?.food && (
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <FoodIcon fontSize="small" color="success" />
                            <Typography variant="subtitle2">Food</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {selectedPet.application.specialInstructions.food}
                          </Typography>
                        </Box>
                      )}
                      {selectedPet.application?.specialInstructions?.medicine && (
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <MedicalIcon fontSize="small" color="primary" />
                            <Typography variant="subtitle2">Medicine</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {selectedPet.application.specialInstructions.medicine}
                          </Typography>
                        </Box>
                      )}
                      {selectedPet.application?.specialInstructions?.behavior && (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>Behavior Notes</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedPet.application.specialInstructions.behavior}
                          </Typography>
                        </Box>
                      )}
                      {selectedPet.application?.specialInstructions?.allergies && (
                        <Box>
                          <Typography variant="subtitle2" color="error" gutterBottom>
                            ⚠️ Allergies
                          </Typography>
                          <Typography variant="body2" color="error">
                            {selectedPet.application.specialInstructions.allergies}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Payment Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  PAYMENT INFORMATION
                </Typography>
                <Card variant="outlined">
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Advance Paid</Typography>
                        <Typography variant="body2" fontWeight={600} color="success.main">
                          ₹{selectedPet.payment?.advanceAmount?.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Total Amount</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          ₹{selectedPet.payment?.totalAmount?.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Daily Rate</Typography>
                        <Typography variant="body2">
                          ₹{selectedPet.payment?.dailyRate?.toLocaleString()}/day
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Application Details */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  APPLICATION DETAILS
                </Typography>
                <Card variant="outlined">
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Application #</Typography>
                        <Typography variant="body2">{selectedPet.application?.applicationNumber}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Status</Typography>
                        <Chip 
                          label={selectedPet.application?.status?.replace(/_/g, ' ').toUpperCase()} 
                          size="small" 
                          color="success"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Check-in Date</Typography>
                        <Typography variant="body2">
                          {new Date(selectedPet.application?.startDate).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Expected Checkout</Typography>
                        <Typography variant="body2">
                          {new Date(selectedPet.application?.expectedEndDate).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* OTP Verification Dialog */}
      <Dialog open={otpDialogOpen} onClose={() => !verifyingOTP && setOtpDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Verify Handover OTP</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ask the pet owner to provide the OTP they generated for pet handover.
          </Typography>
          <TextField
            fullWidth
            label="Enter OTP"
            value={otpInput}
            onChange={(e) => setOtpInput(e.target.value)}
            inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: 8, fontSize: '1.5rem' } }}
            disabled={verifyingOTP}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOtpDialogOpen(false)} disabled={verifyingOTP}>
            Cancel
          </Button>
          <Button 
            onClick={handleVerifyOTP} 
            variant="contained" 
            disabled={verifyingOTP || otpInput.length !== 6}
          >
            {verifyingOTP ? <CircularProgress size={24} /> : 'Verify'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default InboardPets;
