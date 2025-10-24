import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  FormControlLabel,
  Switch,
  Avatar
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Pets as PetsIcon
} from '@mui/icons-material';
import { userPetsAPI } from '../../../services/api';

const EditPet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pet, setPet] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    ageUnit: 'months',
    gender: 'Unknown',
    weight: '',
    color: '',
    size: 'medium',
    currentStatus: 'Available',
    healthStatus: 'Good',
    specialNeeds: '',
    temperament: [],
    behaviorNotes: '',
    tags: []
  });

  const temperamentOptions = [
    'Friendly', 'Intelligent', 'Loyal', 'Active', 'Calm', 'Gentle',
    'Playful', 'Energetic', 'Quiet', 'Social', 'Independent', 'Curious',
    'Confident', 'Courageous', 'Outgoing', 'Adaptable', 'Sweet', 'Docile',
    'Alert', 'Vocal', 'Mischievous', 'Spunky', 'Merry', 'Dignified'
  ];

  const loadPet = async () => {
    try {
      setLoading(true);
      const response = await userPetsAPI.get(id);
      const petData = response.data.data;
      setPet(petData);
      
      // Set form data with pet information
      setFormData({
        name: petData.name || '',
        age: petData.age || '',
        ageUnit: petData.ageUnit || 'months',
        gender: petData.gender || 'Unknown',
        weight: petData.weight?.value || '',
        color: petData.color || '',
        size: petData.size || 'medium',
        currentStatus: petData.currentStatus || 'Available',
        healthStatus: petData.healthStatus || 'Good',
        specialNeeds: (petData.specialNeeds || []).join(', '),
        temperament: petData.temperament || [],
        behaviorNotes: petData.behaviorNotes || '',
        tags: (petData.tags || []).join(', ')
      });
      console.log('Loaded pet data for editing:', petData);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load pet details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPet();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTemperamentChange = (temperament) => {
    setFormData(prev => {
      const newTemperament = prev.temperament.includes(temperament)
        ? prev.temperament.filter(t => t !== temperament)
        : [...prev.temperament, temperament];
      
      return {
        ...prev,
        temperament: newTemperament
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess(false);
      
      // Prepare data for submission
      const submitData = {
        ...formData,
        weight: formData.weight ? { value: parseFloat(formData.weight), unit: 'kg' } : undefined,
        specialNeeds: formData.specialNeeds ? formData.specialNeeds.split(',').map(s => s.trim()).filter(s => s) : [],
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : []
      };
      
      await userPetsAPI.update(id, submitData);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/User/pets/${id}`);
      }, 1500);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update pet information');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!pet) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info">Pet not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button 
        startIcon={<BackIcon />} 
        onClick={() => navigate(-1)} 
        sx={{ mb: 2 }}
      >
        Back
      </Button>
      
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <PetsIcon />
            </Avatar>
            <Typography variant="h5" component="h1">
              Edit Pet Information
            </Typography>
          </Box>
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Pet information updated successfully!
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Pet Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Age"
                  name="age"
                  type="number"
                  value={formData.age}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Age Unit</InputLabel>
                  <Select
                    name="ageUnit"
                    value={formData.ageUnit}
                    onChange={handleInputChange}
                    label="Age Unit"
                  >
                    <MenuItem value="weeks">Weeks</MenuItem>
                    <MenuItem value="months">Months</MenuItem>
                    <MenuItem value="years">Years</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    label="Gender"
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
                  label="Weight (kg)"
                  name="weight"
                  type="number"
                  value={formData.weight}
                  onChange={handleInputChange}
                  InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Size</InputLabel>
                  <Select
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    label="Size"
                  >
                    <MenuItem value="tiny">Tiny</MenuItem>
                    <MenuItem value="small">Small</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="large">Large</MenuItem>
                    <MenuItem value="giant">Giant</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Status Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Status Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Current Status</InputLabel>
                  <Select
                    name="currentStatus"
                    value={formData.currentStatus}
                    onChange={handleInputChange}
                    label="Current Status"
                  >
                    <MenuItem value="Available">Available</MenuItem>
                    <MenuItem value="Adopted">Adopted</MenuItem>
                    <MenuItem value="Reserved">Reserved</MenuItem>
                    <MenuItem value="Under Treatment">Under Treatment</MenuItem>
                    <MenuItem value="Deceased">Deceased</MenuItem>
                    <MenuItem value="Fostered">Fostered</MenuItem>
                    <MenuItem value="in_petshop">In Pet Shop</MenuItem>
                    <MenuItem value="available_for_sale">Available for Sale</MenuItem>
                    <MenuItem value="sold">Sold</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Health Status</InputLabel>
                  <Select
                    name="healthStatus"
                    value={formData.healthStatus}
                    onChange={handleInputChange}
                    label="Health Status"
                  >
                    <MenuItem value="Excellent">Excellent</MenuItem>
                    <MenuItem value="Good">Good</MenuItem>
                    <MenuItem value="Fair">Fair</MenuItem>
                    <MenuItem value="Poor">Poor</MenuItem>
                    <MenuItem value="Critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Behavioral Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Behavioral Information
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Special Needs"
                  name="specialNeeds"
                  value={formData.specialNeeds}
                  onChange={handleInputChange}
                  helperText="Separate multiple needs with commas"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  Temperament
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {temperamentOptions.map((option) => (
                    <Chip
                      key={option}
                      label={option}
                      onClick={() => handleTemperamentChange(option)}
                      color={formData.temperament.includes(option) ? 'primary' : 'default'}
                      variant={formData.temperament.includes(option) ? 'filled' : 'outlined'}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Behavior Notes"
                  name="behaviorNotes"
                  value={formData.behaviorNotes}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  helperText="Separate multiple tags with commas"
                />
              </Grid>
              
              {/* Submit Button */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(-1)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default EditPet;