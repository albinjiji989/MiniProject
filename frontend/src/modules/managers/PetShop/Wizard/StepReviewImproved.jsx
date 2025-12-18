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

  // Fetch display names for category, species and breed
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
    try {
      setIsSubmitting(true);
      setError('');
      
      // Validation
      if (!formData.basic?.name?.trim()) {
        throw new Error('Pet name is required');
      }
      
      if (!formData.classification?.categoryId || !formData.classification?.speciesId || !formData.classification?.breedId) {
        throw new Error('Category, species, and breed are required');
      }
      
      if (!formData.pricing?.unitCost || !formData.pricing?.price) {
        throw new Error('Cost price and selling price are required');
      }
      
      // Calculate totals
      const maleCount = parseInt(formData.gender?.maleCount) || 0;
      const femaleCount = parseInt(formData.gender?.femaleCount) || 0;
      const totalStock = maleCount + femaleCount;
      
      if (totalStock <= 0) {
        throw new Error('At least one pet must be added to stock');
      }
      
      // Create a single stock record with gender distribution
      // This matches the requirement: one stock entry with male/female counts
      const stockData = {
        // Basic info
        name: formData.basic?.name || `Pet Stock - ${breedName}`,
        age: formData.basic?.age ? Number(formData.basic.age) : 0,
        ageUnit: formData.basic?.ageUnit || 'months',
        color: formData.basic?.color || '',
        coatType: formData.basic?.coatType || '',
        
        // Classification
        categoryId: formData.classification?.categoryId,
        speciesId: formData.classification?.speciesId,
        breedId: formData.classification?.breedId,
        
        // Pricing & Stock
        unitCost: formData.pricing?.unitCost ? Number(formData.pricing.unitCost) : 0,
        price: formData.pricing?.price ? Number(formData.pricing.price) : 0,
        quantity: totalStock,
        maleCount: maleCount,
        femaleCount: femaleCount,
        source: formData.pricing?.source || 'Other',
        arrivalDate: formData.pricing?.arrivalDate || new Date().toISOString().split('T')[0],
        
        // Notes
        notes: formData.basic?.notes || '',
        
        // No images at this stage - will be added in separate step
        maleImageIds: [],
        femaleImageIds: []
      };
      
      console.log('🚀 Creating stock with data:', stockData);
      
      // Submit to API
      const response = await petShopStockAPI.createStock(stockData);
      console.log('✅ Stock creation response:', response);
      
      if (response?.data?.success) {
        const createdStock = response.data.data.stock;
        
        // Show success message
        showSnackbar(
          `Successfully created stock "${createdStock.name}" with ${totalStock} pets (${maleCount} male, ${femaleCount} female)!`,
          'success'
        );
        
        // Clear form data
        localStorage.removeItem('petShopWizardData');
        
        // Navigate to stock images management page
        setTimeout(() => {
          navigate(`/manager/petshop/manage-stock-images/${createdStock._id}`);
        }, 2000);
      } else {
        throw new Error(response?.data?.message || 'Failed to create stock');
      }
    } catch (err) {
      console.error('❌ Stock creation error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'An unexpected error occurred';
      setError(errorMsg);
      showSnackbar(`Error: ${errorMsg}`, 'error');
    } finally {
      setIsSubmitting(false);
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
  const genderData = formData.genderClassification || {}
  const maleCount = genderData.maleQuantity || 0
  const femaleCount = genderData.femaleQuantity || 0

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={onBack} 
            disabled={isSubmitting}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Review & Confirm Stock
          </Typography>
        </Box>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Stock-Based Workflow</AlertTitle>
        <Typography variant="body2">
          You're creating a stock record for similar pets. After creation, you'll be able to:
        </Typography>
        <ul>
          <li>Add one image for all male pets in this stock</li>
          <li>Add one image for all female pets in this stock</li>
          <li>Generate individual pets with unique codes when purchased</li>
        </ul>
        <Typography variant="body2">
          <strong>Note:</strong> Only 2 images are needed for this stock (one male, one female). 
          Individual pets will be generated with these images when purchased.
        </Typography>
      </Alert>

      {/* Classification */}
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
      
      {/* Basic Information */}
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
      
      {/* Pricing & Stock */}
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
      
      {/* Gender Distribution */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Gender Distribution</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Male" 
                    secondary={maleCount} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Female" 
                    secondary={femaleCount} 
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
      
      {/* Stock Information */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Stock Information</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            This stock will be added to your inventory. Individual pets will be generated with unique pet codes when customers purchase from this stock.
          </Typography>
          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
            Note: Only 2 images are needed for this stock (one male, one female). Individual pets will be generated with these images when purchased.
          </Typography>
        </CardContent>
      </Card>
      
      {/* Actions */}
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
          {loading ? 'Submitting...' : 'Submit Stock'}
        </Button>
      </Box>
    </Box>
  )
}