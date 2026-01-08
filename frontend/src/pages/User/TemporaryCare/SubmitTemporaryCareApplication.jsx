import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar
} from '@mui/material';
import {
  Pets as PetsIcon,
  CalendarToday as CalendarIcon,
  Home as HomeIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { temporaryCareAPI, apiClient, userPetsAPI, resolveMediaUrl } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const SubmitTemporaryCareApplication = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Data states
  const [centers, setCenters] = useState([]);
  const [pets, setPets] = useState([]);
  const [selectedPets, setSelectedPets] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pricing, setPricing] = useState(null);
  const [specialInstructions, setSpecialInstructions] = useState({});

  const steps = [
    'Select Pets',
    'Choose Center & Dates',
    'Special Instructions',
    'Review & Pricing',
    'Submit'
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  // Optional: Auto-calculate pricing if center has pre-configured rates
  // Disabled by default since manager sets pricing manually after application submission
  // useEffect(() => {
  //   if (selectedPets.length > 0 && selectedCenter && startDate && endDate && !loading) {
  //     calculatePricing();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [selectedPets, selectedCenter, startDate, endDate]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load centers
      let centersData = [];
      let centersError = null;
      try {
        const centersRes = await temporaryCareAPI.listPublicCenters();
        console.log('Centers API Response:', centersRes);
        
        // Handle different response structures
        if (centersRes.data?.success !== false) {
          centersData = centersRes.data?.data?.centers || 
                       centersRes.data?.centers || 
                       centersRes?.centers || 
                       centersRes.data || 
                       [];
        } else {
          centersError = centersRes.data?.message || 'Failed to load care centers';
        }
        
        // Ensure it's an array
        if (!Array.isArray(centersData)) {
          centersData = [];
        }
        
        console.log('Parsed centers:', centersData.length, centersData);
      } catch (centerErr) {
        console.error('Error loading centers:', centerErr);
        console.error('Error details:', {
          message: centerErr.message,
          response: centerErr.response?.data,
          status: centerErr.response?.status,
          url: centerErr.config?.url
        });
        centersError = centerErr?.response?.data?.message || centerErr?.message || 'Failed to load care centers';
      }

      // Load pets
      let petsData = [];
      let petsError = null;
      try {
        petsData = await loadUserPets();
        console.log('Loaded pets:', petsData);
      } catch (petErr) {
        console.error('Error loading pets:', petErr);
        petsError = petErr?.message || 'Failed to load your pets';
      }

      // Filter pets to only include those with valid identifiers (petCode or _id)
      const validPets = petsData.filter(pet => pet.petCode || pet._id);
      console.log(`Filtered ${validPets.length} pets with valid IDs out of ${petsData.length} total`);

      setCenters(centersData);
      setPets(validPets);
      
      // Set error messages
      if (centersError && petsError) {
        setError(`${centersError}. ${petsError}`);
      } else if (centersError) {
        setError(centersError);
      } else if (petsError) {
        setError(petsError);
      } else if (centersData.length === 0 && validPets.length === 0) {
        setError('No care centers or pets available. Please add pets and ensure centers are set up.');
      } else if (centersData.length === 0) {
        setError('No care centers available. Please contact support or check back later.');
      } else if (validPets.length === 0) {
        setError('You don\'t have any pets with valid registration. Please add a pet first from the Pets section.');
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to load data. Please try again.';
      setError(errorMessage);
      console.error('Full error details:', {
        message: err.message,
        response: err.response?.data,
        stack: err.stack
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserPets = async () => {
    try {
      // Load all pets from all sources - same pattern as Pets.jsx
      const [
        userPetsRes,
        ownedPetsRes,
        purchasedPetsRes,
        adoptedPetsRes
      ] = await Promise.allSettled([
        userPetsAPI.list({ limit: 100 }),
        apiClient.get('/pets/my-pets'),
        apiClient.get('/petshop/user/my-purchased-pets'),
        apiClient.get('/adoption/user/my-adopted-pets')
      ]);

      let allPets = [];

      // Process purchased pets FIRST (they have complete data with images)
      if (purchasedPetsRes.status === 'fulfilled') {
        const purchasedPets = purchasedPetsRes.value.data?.data?.pets || [];
        if (Array.isArray(purchasedPets)) {
          allPets = [...purchasedPets];
        }
      }

      // Process adopted pets SECOND (they have images from AdoptionPet)
      if (adoptedPetsRes.status === 'fulfilled') {
        const adoptedPets = adoptedPetsRes.value.data?.data || [];
        if (Array.isArray(adoptedPets)) {
          allPets = [...allPets, ...adoptedPets];
        }
      }

      // Process registry pets (centralized registry)
      if (ownedPetsRes.status === 'fulfilled') {
        const registryPets = ownedPetsRes.value.data?.data?.pets || [];
        if (Array.isArray(registryPets)) {
          // Only add if not already in allPets (avoid duplicates)
          registryPets.forEach(pet => {
            const exists = allPets.find(p => (p.petCode || p._id) === (pet.petCode || pet._id));
            if (!exists) {
              allPets.push(pet);
            }
          });
        }
      }

      // Process user-created pets LAST (these may be duplicates without images)
      if (userPetsRes.status === 'fulfilled') {
        const userPets = userPetsRes.value.data?.data || [];
        if (Array.isArray(userPets)) {
          userPets.forEach(pet => {
            const exists = allPets.find(p => (p.petCode || p._id) === (pet.petCode || pet._id));
            if (!exists) {
              allPets.push(pet);
            }
          });
        }
      }

      // Final deduplication by petCode or _id
      const uniquePets = allPets.filter((pet, index, self) => {
        const petId = pet.petCode || pet._id;
        return petId && index === self.findIndex(p => (p.petCode || p._id) === petId);
      });

      console.log('✅ Loaded pets:', uniquePets.length, uniquePets);
      return uniquePets;
    } catch (err) {
      console.error('Error loading pets:', err);
      return [];
    }
  };

  const calculatePricing = async () => {
    if (!selectedCenter || !startDate || !endDate || selectedPets.length === 0) return;

    try {
      setLoading(true);
      const response = await temporaryCareAPI.calculateEstimatedPricing({
        pets: selectedPets.map(p => ({
          petId: p._id || p.petCode,
          size: p.size || 'medium'
        })),
        centerId: selectedCenter._id || selectedCenter.petCode,
        startDate,
        endDate
      });

      setPricing(response.data?.data);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Error calculating pricing:', err);
      // Don't show error for pricing not configured - it's optional
      // Manager will set pricing after application submission
      if (err?.response?.status === 404 || err?.response?.data?.message?.includes('Pricing not configured')) {
        setPricing(null); // Clear pricing, will be set by manager
        setError(''); // Don't show as error
      } else {
        setError(err?.response?.data?.message || 'Failed to calculate pricing');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePetToggle = (pet) => {
    setSelectedPets(prev => {
      const exists = prev.find(p => (p._id || p.petCode) === (pet._id || pet.petCode));
      if (exists) {
        return prev.filter(p => (p._id || p.petCode) !== (pet._id || pet.petCode));
      } else {
        return [...prev, pet];
      }
    });
  };

  const handleNext = () => {
    if (activeStep === 0 && selectedPets.length === 0) {
      setError('Please select at least one pet');
      return;
    }
    if (activeStep === 1 && (!selectedCenter || !startDate || !endDate)) {
      setError('Please select center and dates');
      return;
    }
    setError('');
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('=== SUBMIT DEBUG ===');
      console.log('Selected pets:', selectedPets);
      console.log('Selected center:', selectedCenter);
      
      // Use petCode as primary identifier (fallback to _id if petCode doesn't exist)
      const petsWithValidIds = selectedPets.filter(pet => pet.petCode || pet._id);
      
      if (petsWithValidIds.length === 0) {
        setError('Unable to submit: Selected pets do not have valid IDs. Please try reloading the page.');
        setLoading(false);
        return;
      }

      if (petsWithValidIds.length !== selectedPets.length) {
        setError(`Only ${petsWithValidIds.length} of ${selectedPets.length} pets have valid IDs. Please deselect pets without IDs.`);
        setLoading(false);
        return;
      }

      const applicationData = {
        pets: petsWithValidIds.map(pet => {
          const petId = pet.petCode || pet._id;
          const instructions = specialInstructions[pet.petCode || pet._id] || {};
          console.log('Processing pet:', pet.name, 'Using ID:', petId, '(type:', pet.petCode ? 'petCode' : '_id', ')');
          console.log('Special instructions for', pet.name, ':', instructions);
          return {
            petId: petId,
            specialInstructions: instructions
          };
        }),
        centerId: selectedCenter._id || selectedCenter.petCode,
        startDate,
        endDate
      };

      console.log('=== SUBMITTING APPLICATION ===');
      console.log('Special Instructions State:', specialInstructions);
      console.log('Final application data:', JSON.stringify(applicationData, null, 2));
      console.log('=== END ===');

      const response = await temporaryCareAPI.submitApplication(applicationData);

      setSuccess('Application submitted successfully! Manager will determine pricing.');
      setTimeout(() => {
        navigate('/User/temporary-care');
      }, 2000);
    } catch (err) {
      console.error('Error submitting application:', err);
      console.error('Error response:', err?.response?.data);
      setError(err?.response?.data?.message || err?.response?.data?.errors?.[0]?.msg || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const updateSpecialInstructions = (petId, field, value) => {
    setSpecialInstructions(prev => ({
      ...prev,
      [petId]: {
        ...(prev[petId] || {}),
        [field]: value
      }
    }));
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Pets for Temporary Care
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              You can select one or multiple pets for care
            </Typography>

            {pets.length === 0 ? (
              <Alert severity="info">
                You don't have any pets yet. Please add a pet first.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {pets.map((pet) => {
                  const isSelected = selectedPets.find(p => (p._id || p.petCode) === (pet._id || pet.petCode));
                  return (
                    <Grid item xs={12} sm={6} md={4} key={pet._id || pet.petCode}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          border: isSelected ? 2 : 1,
                          borderColor: isSelected ? 'primary.main' : 'grey.300',
                          bgcolor: isSelected ? 'primary.lighter' : 'white'
                        }}
                        onClick={() => handlePetToggle(pet)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar
                              src={resolveMediaUrl(pet.profileImage || pet.images?.[0]?.url)}
                              sx={{ width: 60, height: 60 }}
                            >
                              <PetsIcon />
                            </Avatar>
                            <Box flex={1}>
                              <Typography variant="h6">{pet.name || 'Unnamed Pet'}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {(() => {
                            let species = 'Unknown';
                            if (pet.speciesId) {
                              if (typeof pet.speciesId === 'object') {
                                species = pet.speciesId.displayName || pet.speciesId.name || 'Unknown';
                              } else {
                                species = String(pet.speciesId);
                              }
                            } else if (pet.species) {
                              species = typeof pet.species === 'string' ? pet.species : String(pet.species);
                            }
                            
                            let breed = 'Unknown';
                            if (pet.breedId) {
                              if (typeof pet.breedId === 'object') {
                                breed = pet.breedId.name || 'Unknown';
                              } else {
                                breed = String(pet.breedId);
                              }
                            } else if (pet.breed) {
                              breed = typeof pet.breed === 'string' ? pet.breed : String(pet.breed);
                            }
                            
                            return `${species} • ${breed}`;
                          })()}
                        </Typography>
                            </Box>
                            <Checkbox checked={!!isSelected} />
                          </Box>
                          {isSelected && (
                            <Chip label="Selected" color="primary" size="small" />
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}

            {selectedPets.length > 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {selectedPets.length} pet(s) selected
              </Alert>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose Care Center & Duration
            </Typography>

            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Temporary Care Association/Center</InputLabel>
                  <Select
                    value={selectedCenter?._id || selectedCenter?.petCode || ''}
                    onChange={(e) => {
                      const center = centers.find(c => (c._id || c.petCode) === e.target.value);
                      setSelectedCenter(center || null);
                    }}
                    label="Temporary Care Association/Center"
                  >
                    {centers.map((center) => (
                      <MenuItem key={center._id || center.petCode} value={center._id || center.petCode}>
                        <Box>
                          <Typography variant="body1">{center.name || 'Unnamed Center'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Capacity: {typeof center.capacity?.available === 'number' ? center.capacity.available : 0} / {typeof center.capacity?.total === 'number' ? center.capacity.total : 0}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: new Date().toISOString().split('T')[0] }}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: startDate || new Date().toISOString().split('T')[0] }}
                  required
                />
              </Grid>

              {startDate && endDate && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Duration: {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} days
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Special Instructions (Optional)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Provide special care instructions for each pet
            </Typography>

            {selectedPets.map((pet) => (
              <Card key={pet._id || pet.petCode} sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    {pet.name || 'Unnamed Pet'}
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Food Instructions"
                        multiline
                        rows={2}
                        value={specialInstructions[pet._id || pet.petCode]?.food || ''}
                        onChange={(e) => updateSpecialInstructions(pet._id || pet.petCode, 'food', e.target.value)}
                        placeholder="Feeding schedule, food preferences, etc."
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Medicine Instructions"
                        multiline
                        rows={2}
                        value={specialInstructions[pet._id || pet.petCode]?.medicine || ''}
                        onChange={(e) => updateSpecialInstructions(pet._id || pet.petCode, 'medicine', e.target.value)}
                        placeholder="Medication schedule, dosage, etc."
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Behavior Notes"
                        multiline
                        rows={2}
                        value={specialInstructions[pet._id || pet.petCode]?.behavior || ''}
                        onChange={(e) => updateSpecialInstructions(pet._id || pet.petCode, 'behavior', e.target.value)}
                        placeholder="Temperament, likes, dislikes, fears, etc."
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Allergies"
                        value={specialInstructions[pet._id || pet.petCode]?.allergies || ''}
                        onChange={(e) => updateSpecialInstructions(pet._id || pet.petCode, 'allergies', e.target.value)}
                        placeholder="Any known allergies"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review & Pricing Estimate
            </Typography>

            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Selected Pets
                  </Typography>
                  {selectedPets.map((pet) => (
                    <Box key={pet._id || pet.petCode} sx={{ mb: 2, display: 'flex', gap: 2 }}>
                      <Avatar src={resolveMediaUrl(pet.profileImage || pet.images?.[0]?.url)} />
                      <Box>
                        <Typography variant="body1">{pet.name || 'Unnamed Pet'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(() => {
                            let species = 'Unknown';
                            if (pet.speciesId) {
                              if (typeof pet.speciesId === 'object') {
                                species = pet.speciesId.displayName || pet.speciesId.name || 'Unknown';
                              } else {
                                species = String(pet.speciesId);
                              }
                            } else if (pet.species) {
                              species = typeof pet.species === 'string' ? pet.species : String(pet.species);
                            }
                            return species;
                          })()}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Care Details
                  </Typography>
                  <Typography variant="body2">Center: {selectedCenter?.name || 'N/A'}</Typography>
                  <Typography variant="body2">Start: {new Date(startDate).toLocaleDateString()}</Typography>
                  <Typography variant="body2">End: {new Date(endDate).toLocaleDateString()}</Typography>
                  <Typography variant="body2">
                    Duration: {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} days
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                {pricing ? (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                      Estimated Pricing Breakdown
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Note: Final pricing will be determined by the manager
                    </Typography>

                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Pet</TableCell>
                            <TableCell>Rate/Day</TableCell>
                            <TableCell>Days</TableCell>
                            <TableCell>Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {pricing.petPricing?.map((petPrice, idx) => {
                            const pet = selectedPets[idx];
                            return (
                              <TableRow key={idx}>
                                <TableCell>{pet?.name || 'Pet'}</TableCell>
                                <TableCell>₹{petPrice.baseRatePerDay}</TableCell>
                                <TableCell>{petPrice.numberOfDays}</TableCell>
                                <TableCell>₹{petPrice.totalAmount}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Subtotal:</Typography>
                      <Typography>₹{pricing.subtotal?.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Tax ({pricing.tax?.percentage || 18}%):</Typography>
                      <Typography>₹{pricing.tax?.amount?.toLocaleString()}</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">Total Amount:</Typography>
                      <Typography variant="h6" color="primary">₹{pricing.totalAmount?.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ bgcolor: 'success.lighter', p: 2, borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Advance Payment (50%):</Typography>
                        <Typography fontWeight={600}>₹{pricing.advanceAmount?.toLocaleString()}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Remaining (Pay at check-out):
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ₹{pricing.remainingAmount?.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                ) : (
                  <Paper sx={{ p: 3 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Pricing Will Be Set by Manager
                      </Typography>
                      <Typography variant="body2">
                        The care center hasn't configured pre-set pricing. After you submit your application, 
                        the manager will review your request and determine the final pricing based on:
                      </Typography>
                      <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                        <li>Number of pets and their types</li>
                        <li>Duration of care</li>
                        <li>Special care requirements</li>
                        <li>Current availability and season</li>
                      </Box>
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        You'll be notified once the manager sets the price, and you can then proceed with the 50% advance payment.
                      </Typography>
                    </Alert>
                  </Paper>
                )}
              </Grid>
            </Grid>
          </Box>
        );

      case 4:
        return (
          <Box textAlign="center">
            <CheckIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Ready to Submit
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Your application will be reviewed by the manager. They will determine the final pricing and contact you.
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Apply for Temporary Care / Pet Boarding
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Submit an application for temporary care of your pets. Manager will review and set pricing.
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 4, mb: 3 }}>
        {loading && activeStep === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={4} minHeight="200px">
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Loading care centers and pets...
            </Typography>
          </Box>
        ) : loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          renderStepContent()
        )}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          variant="outlined"
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
          disabled={loading}
          endIcon={loading && <CircularProgress size={20} />}
        >
          {activeStep === steps.length - 1 ? 'Submit Application' : 'Next'}
        </Button>
      </Box>
    </Container>
  );
};

export default SubmitTemporaryCareApplication;
