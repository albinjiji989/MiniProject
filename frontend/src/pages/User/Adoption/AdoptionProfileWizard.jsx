import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../services/api';
import {
  Box,
  Container,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  Checkbox,
  FormGroup,
  Chip,
  Slider,
  Alert,
  CircularProgress
} from '@mui/material';
import { Home, Work, Pets, AttachMoney, CheckCircle } from '@mui/icons-material';

const steps = ['Living Situation', 'Lifestyle & Experience', 'Family & Pets', 'Budget & Preferences'];

const AdoptionProfileWizard = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [profile, setProfile] = useState({
    homeType: '',
    homeSize: '',
    hasYard: false,
    yardSize: 'none',
    activityLevel: 3,
    workSchedule: 'full_time',
    hoursAlonePerDay: 8,
    experienceLevel: 'first_time',
    previousPets: [],
    hasChildren: false,
    childrenAges: [],
    hasOtherPets: false,
    otherPetsTypes: [],
    monthlyBudget: '',
    maxAdoptionFee: '',
    preferredSpecies: [],
    preferredSize: [],
    preferredEnergyLevel: 3,
    willingToTrainPet: true,
    canHandleSpecialNeeds: false,
    allergies: []
  });

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/adoption/user/profile/adoption');
      if (res.data.success && res.data.data.adoptionProfile) {
        const loadedProfile = res.data.data.adoptionProfile;
        // Convert null values to empty strings for text inputs
        const sanitizedProfile = Object.keys(loadedProfile).reduce((acc, key) => {
          acc[key] = loadedProfile[key] === null ? '' : loadedProfile[key];
          return acc;
        }, {});
        setProfile({ ...profile, ...sanitizedProfile });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      const res = await apiClient.post('/adoption/user/profile/adoption', profile);
      
      if (res.data.success) {
        // Navigate to smart matches page
        navigate('/user/adoption/smart-matches');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const addToArray = (field, value) => {
    if (value && !profile[field].includes(value)) {
      setProfile({ ...profile, [field]: [...profile[field], value] });
    }
  };

  const removeFromArray = (field, value) => {
    setProfile({ ...profile, [field]: profile[field].filter(v => v !== value) });
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading your profile...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Complete Your Adoption Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Help us find your perfect pet match using AI-powered recommendations
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card>
        <CardContent sx={{ p: 4 }}>
          {/* Step 1: Living Situation */}
          {activeStep === 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Home sx={{ fontSize: 40, color: '#4caf50', mr: 2 }} />
                <Typography variant="h6">Your Living Situation</Typography>
              </Box>

              <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                <FormLabel>Home Type *</FormLabel>
                <RadioGroup value={profile.homeType} onChange={(e) => updateProfile('homeType', e.target.value)}>
                  <FormControlLabel value="apartment" control={<Radio />} label="Apartment" />
                  <FormControlLabel value="house" control={<Radio />} label="House" />
                  <FormControlLabel value="condo" control={<Radio />} label="Condo/Townhouse" />
                  <FormControlLabel value="farm" control={<Radio />} label="Farm/Rural Property" />
                  <FormControlLabel value="other" control={<Radio />} label="Other" />
                </RadioGroup>
              </FormControl>

              <TextField
                fullWidth
                type="number"
                label="Home Size (sq ft)"
                value={profile.homeSize}
                onChange={(e) => updateProfile('homeSize', e.target.value)}
                sx={{ mb: 3 }}
                helperText="Approximate square footage"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={profile.hasYard}
                    onChange={(e) => updateProfile('hasYard', e.target.checked)}
                  />
                }
                label="I have a yard"
                sx={{ mb: 2 }}
              />

              {profile.hasYard && (
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Yard Size</InputLabel>
                  <Select value={profile.yardSize} onChange={(e) => updateProfile('yardSize', e.target.value)}>
                    <MenuItem value="small">Small</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="large">Large</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Box>
          )}

          {/* Step 2: Lifestyle & Experience */}
          {activeStep === 1 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Work sx={{ fontSize: 40, color: '#2196f3', mr: 2 }} />
                <Typography variant="h6">Your Lifestyle</Typography>
              </Box>

              <Box sx={{ mb: 4 }}>
                <Typography gutterBottom>Activity Level *</Typography>
                <Slider
                  value={profile.activityLevel}
                  onChange={(e, value) => updateProfile('activityLevel', value)}
                  min={1}
                  max={5}
                  marks={[
                    { value: 1, label: 'Sedentary' },
                    { value: 3, label: 'Moderate' },
                    { value: 5, label: 'Very Active' }
                  ]}
                  valueLabelDisplay="auto"
                />
              </Box>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Work Schedule *</InputLabel>
                <Select value={profile.workSchedule} onChange={(e) => updateProfile('workSchedule', e.target.value)}>
                  <MenuItem value="home_all_day">Home All Day</MenuItem>
                  <MenuItem value="part_time">Part-Time (Out 4-6 hours)</MenuItem>
                  <MenuItem value="full_time">Full-Time (Out 8+ hours)</MenuItem>
                  <MenuItem value="frequent_travel">Frequent Travel</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                type="number"
                label="Hours Pet Would Be Alone Per Day"
                value={profile.hoursAlonePerDay}
                onChange={(e) => updateProfile('hoursAlonePerDay', e.target.value)}
                sx={{ mb: 3 }}
                inputProps={{ min: 0, max: 24 }}
              />

              <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                <FormLabel>Pet Ownership Experience *</FormLabel>
                <RadioGroup value={profile.experienceLevel} onChange={(e) => updateProfile('experienceLevel', e.target.value)}>
                  <FormControlLabel value="first_time" control={<Radio />} label="First Time Pet Owner" />
                  <FormControlLabel value="some_experience" control={<Radio />} label="Some Experience (1-2 pets before)" />
                  <FormControlLabel value="experienced" control={<Radio />} label="Experienced (3+ pets before)" />
                  <FormControlLabel value="expert" control={<Radio />} label="Expert (Breeder/Trainer)" />
                </RadioGroup>
              </FormControl>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={profile.willingToTrainPet}
                    onChange={(e) => updateProfile('willingToTrainPet', e.target.checked)}
                  />
                }
                label="Willing to train/work with pet behaviors"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={profile.canHandleSpecialNeeds}
                    onChange={(e) => updateProfile('canHandleSpecialNeeds', e.target.checked)}
                  />
                }
                label="Can handle special needs pets"
              />
            </Box>
          )}

          {/* Step 3: Family & Pets */}
          {activeStep === 2 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Pets sx={{ fontSize: 40, color: '#ff9800', mr: 2 }} />
                <Typography variant="h6">Family & Other Pets</Typography>
              </Box>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={profile.hasChildren}
                    onChange={(e) => updateProfile('hasChildren', e.target.checked)}
                  />
                }
                label="I have children"
                sx={{ mb: 2 }}
              />

              {profile.hasChildren && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>Children's Ages (separate by comma)</Typography>
                  <TextField
                    fullWidth
                    placeholder="e.g., 5, 8, 12"
                    helperText="Enter ages separated by commas"
                    onChange={(e) => {
                      const ages = e.target.value.split(',').map(a => parseInt(a.trim())).filter(a => !isNaN(a));
                      updateProfile('childrenAges', ages);
                    }}
                  />
                  <Box sx={{ mt: 1 }}>
                    {profile.childrenAges.map((age, idx) => (
                      <Chip
                        key={idx}
                        label={`${age} years old`}
                        onDelete={() => removeFromArray('childrenAges', age)}
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <FormControlLabel
                control={
                  <Checkbox
                    checked={profile.hasOtherPets}
                    onChange={(e) => updateProfile('hasOtherPets', e.target.checked)}
                  />
                }
                label="I have other pets"
                sx={{ mb: 2 }}
              />

              {profile.hasOtherPets && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>What types of pets?</Typography>
                  <FormGroup>
                    {['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Other'].map((type) => (
                      <FormControlLabel
                        key={type}
                        control={
                          <Checkbox
                            checked={profile.otherPetsTypes.includes(type.toLowerCase())}
                            onChange={(e) => {
                              if (e.target.checked) {
                                addToArray('otherPetsTypes', type.toLowerCase());
                              } else {
                                removeFromArray('otherPetsTypes', type.toLowerCase());
                              }
                            }}
                          />
                        }
                        label={type}
                      />
                    ))}
                  </FormGroup>
                </Box>
              )}
            </Box>
          )}

          {/* Step 4: Budget & Preferences */}
          {activeStep === 3 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AttachMoney sx={{ fontSize: 40, color: '#9c27b0', mr: 2 }} />
                <Typography variant="h6">Budget & Preferences</Typography>
              </Box>

              <TextField
                fullWidth
                type="number"
                label="Monthly Pet Care Budget ($)"
                value={profile.monthlyBudget}
                onChange={(e) => updateProfile('monthlyBudget', e.target.value)}
                sx={{ mb: 3 }}
                helperText="Food, supplies, routine vet care, etc."
              />

              <TextField
                fullWidth
                type="number"
                label="Maximum Adoption Fee ($)"
                value={profile.maxAdoptionFee}
                onChange={(e) => updateProfile('maxAdoptionFee', e.target.value)}
                sx={{ mb: 3 }}
              />

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>Preferred Species</Typography>
                <FormGroup row>
                  {['Dog', 'Cat', 'Rabbit', 'Bird'].map((species) => (
                    <FormControlLabel
                      key={species}
                      control={
                        <Checkbox
                          checked={profile.preferredSpecies.includes(species.toLowerCase())}
                          onChange={(e) => {
                            if (e.target.checked) {
                              addToArray('preferredSpecies', species.toLowerCase());
                            } else {
                              removeFromArray('preferredSpecies', species.toLowerCase());
                            }
                          }}
                        />
                      }
                      label={species}
                    />
                  ))}
                </FormGroup>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>Preferred Size</Typography>
                <FormGroup row>
                  {['Small', 'Medium', 'Large'].map((size) => (
                    <FormControlLabel
                      key={size}
                      control={
                        <Checkbox
                          checked={profile.preferredSize.includes(size.toLowerCase())}
                          onChange={(e) => {
                            if (e.target.checked) {
                              addToArray('preferredSize', size.toLowerCase());
                            } else {
                              removeFromArray('preferredSize', size.toLowerCase());
                            }
                          }}
                        />
                      }
                      label={size}
                    />
                  ))}
                </FormGroup>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>Preferred Energy Level</Typography>
                <Slider
                  value={profile.preferredEnergyLevel}
                  onChange={(e, value) => updateProfile('preferredEnergyLevel', value)}
                  min={1}
                  max={5}
                  marks={[
                    { value: 1, label: 'Low' },
                    { value: 3, label: 'Medium' },
                    { value: 5, label: 'High' }
                  ]}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Back
            </Button>
            <Box>
              {activeStep < steps.length - 1 ? (
                <Button variant="contained" onClick={handleNext} sx={{ bgcolor: '#4caf50' }}>
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={20} /> : <CheckCircle />}
                  sx={{ bgcolor: '#4caf50' }}
                >
                  {saving ? 'Saving...' : 'Find My Matches'}
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default AdoptionProfileWizard;
