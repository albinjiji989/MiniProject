import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress
} from '@mui/material'
import { Check as CheckIcon } from '@mui/icons-material'
import { apiClient } from '../../../../services/api'

const KEY = 'petshop_wizard'

export default function StepReviewImproved() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({})
  const [categoryName, setCategoryName] = useState('')
  const [speciesName, setSpeciesName] = useState('')
  const [breedName, setBreedName] = useState('')
  
  // Load all form data from localStorage
  useEffect(() => {
    try { 
      const data = JSON.parse(localStorage.getItem(KEY)) || {}
      setFormData(data)
      fetchDisplayNames(data)
    } catch { 
      setFormData({})
    }
  }, [])

  // Fetch display names for category, species, and breed
  const fetchDisplayNames = async (data) => {
    if (!data.classification) return;

    // First, try to use names from localStorage if available
    let hasNamesFromStorage = false;

    if (data.classification.categoryName && data.classification.categoryName !== data.classification.categoryId) {
      setCategoryName(data.classification.categoryName);
      hasNamesFromStorage = true;
    } else if (data.classification.categoryId) {
      setCategoryName(`Category ID: ${data.classification.categoryId.substring(0, 8)}...`);
    }

    if (data.classification.speciesName && data.classification.speciesName !== data.classification.speciesId) {
      setSpeciesName(data.classification.speciesName);
      hasNamesFromStorage = true;
    } else if (data.classification.speciesId) {
      setSpeciesName(`Species ID: ${data.classification.speciesId.substring(0, 8)}...`);
    }

    if (data.classification.breedName && data.classification.breedName !== data.classification.breedId) {
      setBreedName(data.classification.breedName);
      hasNamesFromStorage = true;
    } else if (data.classification.breedId) {
      setBreedName(`Breed ID: ${data.classification.breedId.substring(0, 8)}...`);
    }

    // If we don't have names from storage, try to fetch them from API
    if (!hasNamesFromStorage && (data.classification.categoryId || data.classification.speciesId || data.classification.breedId)) {
      // Fetch category name
      if (data.classification.categoryId && !data.classification.categoryName) {
        try {
          const categoryRes = await apiClient.get(`/admin/pet-categories/${data.classification.categoryId}`);
          const categoryName = categoryRes.data?.data?.name || categoryRes.data?.data?.displayName;
          if (categoryName) {
            setCategoryName(categoryName);
          }
        } catch (err) {
          console.log('Failed to fetch category from admin endpoint, trying alternative');
          try {
            // Try a different endpoint if available
            const categoryRes = await apiClient.get(`/user/pets/categories/${data.classification.categoryId}`);
            const categoryName = categoryRes.data?.data?.name || categoryRes.data?.data?.displayName;
            if (categoryName) {
              setCategoryName(categoryName);
            }
          } catch (err2) {
            console.log('Failed to fetch category from user endpoint');
          }
        }
      }

      // Fetch species name
      if (data.classification.speciesId && !data.classification.speciesName) {
        try {
          const speciesRes = await apiClient.get(`/admin/species/${data.classification.speciesId}`);
          const speciesName = speciesRes.data?.data?.name || speciesRes.data?.data?.displayName;
          if (speciesName) {
            setSpeciesName(speciesName);
          }
        } catch (err) {
          console.log('Failed to fetch species from admin endpoint, trying alternative');
          try {
            // Try a different endpoint if available
            const speciesRes = await apiClient.get(`/user/pets/species/${data.classification.speciesId}`);
            const speciesName = speciesRes.data?.data?.name || speciesRes.data?.data?.displayName;
            if (speciesName) {
              setSpeciesName(speciesName);
            }
          } catch (err2) {
            console.log('Failed to fetch species from user endpoint');
          }
        }
      }

      // Fetch breed name
      if (data.classification.breedId && !data.classification.breedName) {
        try {
          const breedRes = await apiClient.get(`/admin/breeds/${data.classification.breedId}`);
          const breedName = breedRes.data?.data?.name;
          if (breedName) {
            setBreedName(breedName);
          }
        } catch (err) {
          console.log('Failed to fetch breed from admin endpoint, trying alternative');
          try {
            // Try a different endpoint if available
            const breedRes = await apiClient.get(`/user/pets/breeds/${data.classification.breedId}`);
            const breedName = breedRes.data?.data?.name;
            if (breedName) {
              setBreedName(breedName);
            }
          } catch (err2) {
            console.log('Failed to fetch breed from user endpoint');
          }
        }
      }
    }
  }

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const totalStock = formData.pricing?.quantity ? parseInt(formData.pricing.quantity) : 1;
      const genderData = formData.genderClassification || {};
      const maleCount = genderData.maleQuantity || 0;
      const femaleCount = genderData.femaleQuantity || 0;
      
      // Validate that we have the required data
      if (!formData.classification?.categoryId) {
        throw new Error('Category is required but missing');
      }
      if (!formData.classification?.speciesId) {
        throw new Error('Species is required but missing');
      }
      if (!formData.classification?.breedId) {
        throw new Error('Breed is required but missing');
      }
      
      // Create array of pets with proper gender distribution
      const pets = [];
      
      // Add male pets
      for (let i = 0; i < maleCount; i++) {
        pets.push({
          name: '', // No name from media step
          images: [], // No images from media step
          gender: 'Male'
        });
      }
      
      // Add female pets
      for (let i = 0; i < femaleCount; i++) {
        pets.push({
          name: '', // No name from media step
          images: [], // No images from media step
          gender: 'Female'
        });
      }
      
      // Create inventory items for each pet
      const items = pets.map((pet, index) => ({
        // Basic info
        name: pet.name || '',
        age: formData.basic?.age ? Number(formData.basic.age) : 0,
        ageUnit: formData.basic?.ageUnit || 'months',
        color: formData.basic?.color || '',
        coatType: formData.basic?.coatType || '',
        gender: pet.gender, // Use the gender from our distribution
        
        // Classification
        categoryId: formData.classification?.categoryId,
        speciesId: formData.classification?.speciesId,
        breedId: formData.classification?.breedId,
        
        // Pricing & Stock (same for all pets in this batch)
        unitCost: formData.pricing?.unitCost ? Number(formData.pricing.unitCost) : 0,
        price: formData.pricing?.price ? Number(formData.pricing.price) : 0,
        quantity: 1, // Each pet is a single item
        source: formData.pricing?.source || 'Other',
        arrivalDate: formData.pricing?.arrivalDate || new Date(),
        
        // Notes
        notes: formData.basic?.notes || '',
        
        // No images for this specific pet
        images: pet.images || []
      }));
      
      // Submit all pets as a bulk operation
      try {
        const res = await apiClient.post('/petshop/manager/inventory/bulk', { items });
        setSuccess(true);
      } catch (err) {
        console.error('Error creating inventory items:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
        
        // Provide more specific error messages based on status code
        if (err.response?.status === 403) {
          throw new Error('Access denied when creating pets. Please check your permissions.');
        } else if (err.response?.status === 400) {
          throw new Error(`Invalid data: ${errorMessage}`);
        } else if (err.response?.status === 500) {
          throw new Error('Server error when creating pets. Please try again later.');
        } else {
          throw new Error(`Failed to create pets: ${errorMessage}`);
        }
      }
      
      setSuccess(true);
      
      // Clear the wizard data from localStorage
      localStorage.removeItem(KEY);
      
      // Navigate to success page or inventory list
      setTimeout(() => {
        navigate('/manager/petshop/inventory');
      }, 2000);
    } catch (err) {
      console.error('Error creating inventory items:', err);
      setError(err.message || 'Failed to add pets to inventory. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  const back = () => {
    navigate('/manager/petshop/wizard/gender')
  }

  // Helper function to get display value or placeholder
  const displayValue = (value, placeholder = 'Not provided') => {
    // If the value is already a formatted display (contains "ID:" or "Invalid")
    if (value && typeof value === 'string' && (value.includes('ID:') || value.includes('Invalid'))) {
      return value;
    }
    
    // If the value looks like an unformatted ID (long string starting with alphanumeric characters)
    if (value && typeof value === 'string' && value.length > 10 && /^[a-f0-9]/.test(value)) {
      // Format it as a short ID display
      return `${value.substring(0, 8)}...`;
    }
    
    return value || <span style={{ color: '#999' }}>{placeholder}</span>;
  };

  const totalStock = formData.pricing?.quantity ? parseInt(formData.pricing.quantity) : 1

  return (
    <Box className="space-y-6">
      <Typography variant="h6" sx={{ mb: 2 }}>Review & Submit</Typography>
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <strong>Success!</strong> Pets have been added to your inventory.
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Classification</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Category" 
                    secondary={displayValue(categoryName, 'Not selected')} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Species" 
                    secondary={displayValue(speciesName, 'Not selected')} 
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} sm={6}>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Breed" 
                    secondary={displayValue(breedName, 'Not selected')} 
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Basic Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Age" 
                    secondary={formData.basic?.age ? `${formData.basic.age} ${formData.basic.ageUnit || 'months'}` : 'Not provided'} 
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} sm={6}>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Notes" 
                    secondary={displayValue(formData.basic?.notes)} 
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Pricing & Stock</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Unit Cost" 
                    secondary={formData.pricing?.unitCost ? `₹${Number(formData.pricing.unitCost).toFixed(2)}` : 'Not provided'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Selling Price" 
                    secondary={formData.pricing?.price ? `₹${Number(formData.pricing.price).toFixed(2)}` : 'Not provided'} 
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} sm={6}>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Quantity" 
                    secondary={totalStock} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Source" 
                    secondary={displayValue(formData.pricing?.source)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Arrival Date" 
                    secondary={displayValue(formData.pricing?.arrivalDate)} 
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Gender Classification</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Male" 
                    secondary={formData.genderClassification?.maleQuantity || 0} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Female" 
                    secondary={formData.genderClassification?.femaleQuantity || 0} 
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} sm={6}>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Total" 
                    secondary={totalStock} 
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Pets Information</Typography>
          <Grid container spacing={2}>
            {Array.from({ length: totalStock }).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Pet {index + 1}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Images: 0 (can be added later)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button 
          variant="outlined" 
          onClick={back}
          size="large"
          disabled={loading}
        >
          Back
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          size="large"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
        >
          {loading ? 'Submitting...' : 'Submit All Pets'}
        </Button>
      </Box>
    </Box>
  )
}