import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { Cake as CakeIcon, Close as CloseIcon } from '@mui/icons-material';
import { apiClient } from '../../services/api';

const PetBirthdayReminder = ({ pets }) => {
  const [petsWithoutPreference, setPetsWithoutPreference] = useState([]);
  const [showBirthdayDialog, setShowBirthdayDialog] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [dismissedPets, setDismissedPets] = useState([]);
  const [preferredBirthday, setPreferredBirthday] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check which pets don't have birthday preferences
  useEffect(() => {
    const checkPets = async () => {
      if (!pets || !Array.isArray(pets) || pets.length === 0) {
        setPetsWithoutPreference([]);
        return;
      }
      
      try {
        // Get all pets with birthday preferences for current user
        const res = await apiClient.get('/pets/birthday/birthday-preferences');
        const preferences = res.data.data.preferences || {};
        
        // Filter pets that don't have preferences and aren't dismissed
        const petsToCheck = pets.filter(pet => 
          pet && pet._id && 
          !preferences[pet._id] && 
          !dismissedPets.includes(pet._id)
        );
        
        setPetsWithoutPreference(petsToCheck);
      } catch (err) {
        console.error('Error checking pet preferences:', err);
        // Fallback to checking individually if bulk check fails
        const petsToCheck = pets.filter(pet => 
          pet && pet._id && 
          !dismissedPets.includes(pet._id)
        );
        
        const petsWithoutPref = [];
        
        for (const pet of petsToCheck) {
          try {
            // Check if pet has birthday preference
            await apiClient.get(`/pets/birthday/birthday-preference/${pet._id}`);
          } catch (err) {
            // If we get a 404 error, it means no preference is set
            if (err.response?.status === 404) {
              petsWithoutPref.push(pet);
            }
            // For other errors, we'll skip adding the pet to avoid issues
          }
        }
        
        setPetsWithoutPreference(petsWithoutPref);
      }
    };
    
    checkPets();
  }, [pets, dismissedPets]);

  const handleSetBirthday = (pet) => {
    setSelectedPet(pet);
    setPreferredBirthday('');
    setError('');
    setSuccess('');
    setShowBirthdayDialog(true);
  };

  const handleDismiss = (petId) => {
    setDismissedPets(prev => [...prev, petId]);
  };

  const handleSubmitPreference = async () => {
    if (!preferredBirthday) {
      setError('Please select a preferred birthday');
      return;
    }

    const birthdayValue = parseInt(preferredBirthday);
    if (isNaN(birthdayValue) || birthdayValue < 1 || birthdayValue > 31) {
      setError('Preferred birthday must be between 1 and 31');
      return;
    }

    // Validate selected pet data
    if (!selectedPet || !selectedPet._id) {
      setError('Invalid pet data. Please try again.');
      return;
    }

    if (selectedPet.age === undefined || selectedPet.age === null) {
      setError('Pet age information is missing.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Determine the pet model type
      let petModel = 'Pet';
      if (selectedPet?.source === 'adoption') {
        petModel = 'AdoptionPet';
      } else if (selectedPet?.source === 'petshop') {
        petModel = 'PetInventoryItem';
      } else if (selectedPet?.tags?.includes('user-added')) {
        petModel = 'PetNew';
      }

      const response = await apiClient.post('/pets/birthday/birthday-preference', {
        petId: selectedPet._id,
        petModel: petModel,
        currentAge: {
          value: selectedPet.age,
          unit: selectedPet.ageUnit || 'months'
        },
        preferredBirthday: birthdayValue
      });

      if (response.data.success) {
        setSuccess('Birthday preference set successfully!');
        // Remove the pet from the list after preference is set
        setPetsWithoutPreference(prev => 
          prev.filter(pet => pet._id !== selectedPet._id)
        );
        // Close dialog after 1.5 seconds
        setTimeout(() => {
          setShowBirthdayDialog(false);
          setSelectedPet(null);
        }, 1500);
      } else {
        setError(response.data.message || 'Failed to set birthday preference');
      }
    } catch (err) {
      console.error('Error setting birthday preference:', err);
      setError(err.response?.data?.message || 'Failed to set birthday preference. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (petsWithoutPreference.length === 0) {
    return null;
  }

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CakeIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Set Birthday for Your Pets</Typography>
          </Box>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            Setting a birthday for your pets allows us to automatically calculate and update their ages.
          </Alert>
          
          <List>
            {petsWithoutPreference.map((pet) => (
              <ListItem 
                key={pet._id} 
                sx={{ 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 1, 
                  mb: 1,
                  '&:last-child': { mb: 0 }
                }}
              >
                <ListItemText 
                  primary={pet.name} 
                  secondary={`${pet.age} ${pet.ageUnit || 'months'} old`}
                />
                <ListItemSecondaryAction>
                  <Chip 
                    label="No Birthday Set" 
                    size="small" 
                    color="warning" 
                    variant="outlined" 
                    sx={{ mr: 1 }}
                  />
                  <Button 
                    size="small" 
                    variant="contained" 
                    onClick={() => handleSetBirthday(pet)}
                    disabled={loading || !!success}
                    sx={{ mr: 1 }}
                  >
                    Set Birthday
                  </Button>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDismiss(pet._id)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Birthday Preference Dialog */}
      <Dialog open={showBirthdayDialog} onClose={() => setShowBirthdayDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Set Pet Birthday Preference</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            
            {selectedPet && (
              <Typography variant="body1" sx={{ mb: 3 }}>
                Your pet <strong>{selectedPet.name}</strong> is currently {selectedPet.age} {selectedPet.ageUnit || 'months'} old. 
                You can set a preferred birthday for your pet, and we'll automatically calculate 
                their age going forward.
              </Typography>
            )}
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Preferred Birthday (Day of Month)</InputLabel>
              <Select
                value={preferredBirthday}
                onChange={(e) => setPreferredBirthday(e.target.value)}
                label="Preferred Birthday (Day of Month)"
                disabled={!!loading || !!success}
              >
                {[...Array(31)].map((_, i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    {i + 1}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              We'll calculate your pet's actual birth date based on their current age and 
              your preferred birthday. From then on, their age will automatically update.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBirthdayDialog(false)} disabled={!!loading || !!success}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitPreference} 
            variant="contained" 
            disabled={!!loading || !preferredBirthday || !!success}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Setting...' : success ? 'Done' : 'Set Birthday'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PetBirthdayReminder;