import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormGroup, 
  FormControlLabel, 
  Switch, 
  Button, 
  Box, 
  Grid, 
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { preparePetFormData } from '../utils/petUtils';

const PetForm = ({ pet, onSubmit, onCancel, loading, error }) => {
  const [formData, setFormData] = useState(preparePetFormData(pet || {}));
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (pet) {
      setFormData(preparePetFormData(pet));
    }
  }, [pet]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWeightChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      weight: {
        ...prev.weight,
        [name]: value
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');
    
    // Basic validation
    if (!formData.name.trim()) {
      setLocalError('Pet name is required');
      return;
    }
    
    if (!formData.species) {
      setLocalError('Species is required');
      return;
    }
    
    if (!formData.breed) {
      setLocalError('Breed is required');
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {(error || localError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || localError}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Pet Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Species</InputLabel>
            <Select
              name="species"
              value={formData.species}
              onChange={handleChange}
              required
            >
              <MenuItem value="dog">Dog</MenuItem>
              <MenuItem value="cat">Cat</MenuItem>
              <MenuItem value="bird">Bird</MenuItem>
              <MenuItem value="rabbit">Rabbit</MenuItem>
              <MenuItem value="hamster">Hamster</MenuItem>
              <MenuItem value="fish">Fish</MenuItem>
              <MenuItem value="reptile">Reptile</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Breed"
            name="breed"
            value={formData.breed}
            onChange={handleChange}
            required
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Gender</InputLabel>
            <Select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Unknown">Unknown</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Age"
            name="age"
            type="number"
            value={formData.age}
            onChange={handleChange}
            InputProps={{ inputProps: { min: 0 } }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Age Unit</InputLabel>
            <Select
              name="ageUnit"
              value={formData.ageUnit}
              onChange={handleChange}
            >
              <MenuItem value="weeks">Weeks</MenuItem>
              <MenuItem value="months">Months</MenuItem>
              <MenuItem value="years">Years</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Color"
            name="color"
            value={formData.color}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Weight Value"
            name="value"
            type="number"
            value={formData.weight?.value || ''}
            onChange={handleWeightChange}
            InputProps={{ inputProps: { min: 0, step: 0.1 } }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Weight Unit</InputLabel>
            <Select
              name="unit"
              value={formData.weight?.unit || 'kg'}
              onChange={handleWeightChange}
            >
              <MenuItem value="kg">Kilograms (kg)</MenuItem>
              <MenuItem value="lbs">Pounds (lbs)</MenuItem>
              <MenuItem value="g">Grams (g)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={4}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button 
          type="submit" 
          variant="contained" 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {pet ? 'Update Pet' : 'Create Pet'}
        </Button>
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

export default PetForm;