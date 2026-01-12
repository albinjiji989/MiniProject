import React, { useState, useEffect, useMemo } from 'react';
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
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha
} from '@mui/material';
import {
  Pets as PetsIcon,
  Visibility as ViewIcon,
  QrCode as QrCodeIcon,
  Restaurant as FoodIcon,
  LocalHospital as MedicalIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
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

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('all');
  const [selectedBreed, setSelectedBreed] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month

  useEffect(() => {
    loadInboardPets();
  }, []);

  const loadInboardPets = async () => {
    try {
      console.log('🔄 Loading inboard pets...');
      setLoading(true);
      const response = await temporaryCareAPI.managerGetInboardPets();
      console.log('✅ Response received:', response.data);
      setPets(response.data?.data?.pets || []);
      setError('');
    } catch (err) {
      console.error('❌ Error loading inboard pets:', err);
      console.error('Error details:', err?.response?.data);
      setError(err?.response?.data?.message || 'Failed to load pets in care');
    } finally {
      setLoading(false);
    }
  };

  // Get unique filter options from pets
  const filterOptions = useMemo(() => {
    const species = [...new Set(pets.map(p => p.species).filter(Boolean))];
    const breeds = [...new Set(pets.map(p => p.breed).filter(Boolean))];
    const categories = [...new Set(pets.map(p => p.category).filter(Boolean))];
    
    return { species, breeds, categories };
  }, [pets]);

  // Filter pets based on search and filters
  const filteredPets = useMemo(() => {
    return pets.filter(pet => {
      // Search by petCode, petName, or ownerName
      const searchMatch = !searchTerm || 
        pet.petCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet.petName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet.ownerName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Species filter
      const speciesMatch = selectedSpecies === 'all' || pet.species === selectedSpecies;
      
      // Breed filter
      const breedMatch = selectedBreed === 'all' || pet.breed === selectedBreed;
      
      // Category filter
      const categoryMatch = selectedCategory === 'all' || pet.category === selectedCategory;
      
      // Date filter
      let dateMatch = true;
      if (dateFilter !== 'all' && pet.startDate) {
        const startDate = new Date(pet.startDate);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch(dateFilter) {
          case 'today':
            const petDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            dateMatch = petDate.getTime() === today.getTime();
            break;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            dateMatch = startDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            dateMatch = startDate >= monthAgo;
            break;
          default:
            dateMatch = true;
        }
      }
      
      return searchMatch && speciesMatch && breedMatch && categoryMatch && dateMatch;
    });
  }, [pets, searchTerm, selectedSpecies, selectedBreed, selectedCategory, dateFilter]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedSpecies('all');
    setSelectedBreed('all');
    setSelectedCategory('all');
    setDateFilter('all');
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
          {filteredPets.length !== pets.length && ` • Showing ${filteredPets.length} filtered result${filteredPets.length !== 1 ? 's' : ''}`}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search and Filter Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search by code, pet name, or owner name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                {filterOptions.categories.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth>
              <InputLabel>Species</InputLabel>
              <Select
                value={selectedSpecies}
                onChange={(e) => setSelectedSpecies(e.target.value)}
                label="Species"
              >
                <MenuItem value="all">All Species</MenuItem>
                {filterOptions.species.map(species => (
                  <MenuItem key={species} value={species}>{species}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth>
              <InputLabel>Breed</InputLabel>
              <Select
                value={selectedBreed}
                onChange={(e) => setSelectedBreed(e.target.value)}
                label="Breed"
              >
                <MenuItem value="all">All Breeds</MenuItem>
                {filterOptions.breeds.map(breed => (
                  <MenuItem key={breed} value={breed}>{breed}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth>
              <InputLabel>Date Joined</InputLabel>
              <Select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                label="Date Joined"
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">Last 7 Days</MenuItem>
                <MenuItem value="month">Last 30 Days</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={12} md={1}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={handleClearFilters}
              sx={{ height: 56 }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {filteredPets.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <PetsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {pets.length === 0 ? 'No pets in care at the moment' : 'No pets match your filters'}
          </Typography>
          {pets.length > 0 && (
            <Button
              variant="text"
              onClick={handleClearFilters}
              sx={{ mt: 2 }}
            >
              Clear Filters
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredPets.map((pet) => {
            // Manager care color - orange/warning theme
            const cardColor = { 
              main: '#f59e0b', 
              light: '#fef3c7', 
              gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
            };
            
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={pet.petCode}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'visible',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      boxShadow: `0 12px 24px ${alpha(cardColor.main, 0.3)}`,
                      transform: 'translateY(-8px)',
                    }
                  }}
                  onClick={() => handleViewDetails(pet.petCode)}
                >
                  {/* Color Band at Top */}
                  <Box sx={{ 
                    height: 6,
                    background: cardColor.gradient,
                    borderTopLeftRadius: 'inherit',
                    borderTopRightRadius: 'inherit'
                  }} />

                  {/* Pet Image */}
                  <Box sx={{ position: 'relative', pt: 2, px: 2 }}>
                    <Box
                      component="img"
                      src={resolveMediaUrl(pet.images?.[0]?.url) || '/placeholder-pet.svg'}
                      alt={pet.petName}
                      sx={{
                        width: '100%',
                        height: 180,
                        objectFit: 'cover',
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: 'divider',
                        bgcolor: 'grey.100'
                      }}
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-pet.svg';
                      }}
                    />
                    
                    {/* Status Badge */}
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        top: 24, 
                        right: 24,
                        bgcolor: 'success.main',
                        borderRadius: 2,
                        px: 1.5,
                        py: 0.5,
                        boxShadow: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: 'white'
                      }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'white' }}>
                        In Care
                      </Typography>
                    </Box>
                  </Box>
                  
                  <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                    {/* Pet Name */}
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {pet.petName || 'Unnamed Pet'}
                    </Typography>
                    
                    {/* Pet Code */}
                    <Chip 
                      label={pet.petCode} 
                      size="small" 
                      sx={{ 
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                        bgcolor: alpha(cardColor.main, 0.1),
                        color: cardColor.main,
                        fontWeight: 600,
                        mb: 1.5
                      }}
                    />
                    
                    {/* Pet Details */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PetsIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {pet.species} • {pet.breed}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {pet.age} {pet.ageUnit} • {pet.gender}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Owner Info */}
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="caption" noWrap>{pet.ownerName}</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Since: {new Date(pet.startDate).toLocaleDateString()}
                      </Typography>
                    </Stack>
                  </CardContent>

                  {/* View Details Button */}
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(pet.petCode);
                      }}
                    >
                      View Details
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
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
