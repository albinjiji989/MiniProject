import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  Box,
  CircularProgress
} from '@mui/material';
import { apiClient } from '../../services/api';

const SetBirthdayPreference = ({ pet, open, onClose, onPreferenceSet }) => {
  const [preferredBirthday, setPreferredBirthday] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (pet && open) {
      // Reset form when dialog opens
      setPreferredBirthday('');
      setError('');
      setSuccess('');
    }
  }, [pet, open]);

  const handleSubmit = async () => {
    if (!preferredBirthday) {
      setError('Please select a preferred birthday');
      return;
    }

    if (preferredBirthday < 1 || preferredBirthday > 31) {
      setError('Preferred birthday must be between 1 and 31');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiClient.post('/pets/birthday-preference', {
        petId: pet._id,
        currentAge: {
          value: pet.age,
          unit: pet.ageUnit || 'months'
        },
        preferredBirthday: parseInt(preferredBirthday)
      });

      if (response.data.success) {
        setSuccess('Birthday preference set successfully!');
        if (onPreferenceSet) {
          onPreferenceSet(response.data.data.preference);
        }
        // Close dialog after 1.5 seconds
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(response.data.message || 'Failed to set birthday preference');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set birthday preference');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
          
          <Typography variant="body1" sx={{ mb: 3 }}>
            Your pet {pet?.name} is currently {pet?.age} {pet?.ageUnit || 'months'} old. 
            You can set a preferred birthday for your pet, and we'll automatically calculate 
            their age going forward.
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Preferred Birthday (Day of Month)</InputLabel>
            <Select
              value={preferredBirthday}
              onChange={(e) => setPreferredBirthday(e.target.value)}
              label="Preferred Birthday (Day of Month)"
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
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || !preferredBirthday}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Setting...' : 'Set Birthday'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SetBirthdayPreference;