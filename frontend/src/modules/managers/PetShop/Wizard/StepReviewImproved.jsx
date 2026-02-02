import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Alert,
  AlertTitle,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  IconButton
} from '@mui/material'
import { Check as CheckIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { apiClient } from '../../../../services/api'

const KEY = 'petshop_wizard'

export default function StepReviewImproved() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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
    } catch (err) { 
      console.error('Error loading wizard data:', err)
      setFormData({})
    }
  }, [])

  // Fetch display names for category, species and breed
  const fetchDisplayNames = async (data) => {
    if (!data.classification) return;

    // Use names from localStorage if available
    if (data.classification.categoryName) {
      setCategoryName(data.classification.categoryName)
    }
    if (data.classification.speciesName) {
      setSpeciesName(data.classification.speciesName)
    }
    if (data.classification.breedName) {
      setBreedName(data.classification.breedName)
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Validation
      const maleCount = parseInt(formData.gender?.maleCount) || 0
      const femaleCount = parseInt(formData.gender?.femaleCount) || 0
      const totalStock = maleCount + femaleCount
      
      if (!formData.basic?.stockName?.trim()) {
        throw new Error('Stock name is required')
      }
      
      if (!formData.classification?.categoryId || !formData.classification?.speciesId || !formData.classification?.breedId) {
        throw new Error('Category, species, and breed are required')
      }
      
      if (!formData.pricing?.price) {
        throw new Error('Selling price is required')
      }
      
      if (totalStock <= 0) {
        throw new Error('At least one pet must be added to stock')
      }
      
      // Build complete stock submission data
      const stockData = {
        // Basic info
        stockName: formData.basic?.stockName,
        // Send either DOB or age+unit based on input method
        ...(formData.basic?.useAge === false && formData.basic?.dateOfBirth ? {
          dateOfBirth: formData.basic.dateOfBirth,
          dobAccuracy: formData.basic.dobAccuracy || 'exact'
        } : {
          age: formData.basic?.age ? Number(formData.basic.age) : 0,
          ageUnit: formData.basic?.ageUnit || 'months'
        }),
        color: formData.basic?.color || '',
        size: formData.basic?.size || '',
        
        // Classification
        categoryId: formData.classification?.categoryId,
        speciesId: formData.classification?.speciesId,
        breedId: formData.classification?.breedId,
        
        // Pricing
        price: Number(formData.pricing?.price),
        discountPrice: formData.pricing?.discountPrice ? Number(formData.pricing.discountPrice) : null,
        tags: formData.pricing?.tags || [],
        
        // Gender & Images
        maleCount,
        femaleCount,
        maleImages: formData.gender?.maleImages || [],
        femaleImages: formData.gender?.femaleImages || []
      }
      
      console.log('📤 Submitting wizard data:', stockData)
      
      // Submit to the new wizard endpoint
      const response = await apiClient.post('/petshop/manager/wizard/submit', stockData)
      
      if (response?.data?.success) {
        // Clear form data
        localStorage.removeItem(KEY)
        
        // Use server message if available so generation errors are visible
        const serverMessage = response.data?.message || `✅ Stock created successfully! ${response.data.data.generatedPetsCount} pets generated.`
        alert(serverMessage)
        
        // Navigate to inventory
        navigate('/manager/petshop/inventory')
      } else {
        throw new Error(response?.data?.message || 'Failed to create stock')
      }
    } catch (err) {
      console.error('❌ Submission error:', err)
      
      // Extract meaningful error message
      let errorMsg = 'Failed to create stock. Please try again.'
      
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message
      } else if (err.response?.status === 401) {
        errorMsg = 'Your session has expired. Please log in again.'
      } else if (err.response?.status === 403) {
        errorMsg = 'You do not have permission to create stocks. Please contact your administrator.'
      } else if (err.response?.status === 400) {
        errorMsg = err.response.data?.message || 'Invalid data. Please check all fields and try again.'
      } else if (err.response?.status === 413) {
        errorMsg = 'Images are too large. Please use smaller images or reduce the number of images.'
      } else if (err.response?.status === 500) {
        errorMsg = 'Server error: ' + (err.response.data?.message || 'Please try again later or contact support.')
      } else if (err.code === 'ERR_NETWORK') {
        errorMsg = 'Connection failed. Make sure the server is running and accessible.'
      } else if (err.message === 'Network Error') {
        errorMsg = err.response?.data?.message || 'Server connection failed. Please check if backend is running on http://localhost:5000'
      }
      
      setError(errorMsg)
      alert(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/manager/petshop/wizard/gender')
  }

  // Helper function to format display values
  const displayValue = (value, placeholder = 'Not provided') => {
    return value || <span style={{ color: '#999' }}>{placeholder}</span>
  }

  const maleCount = parseInt(formData.gender?.maleCount) || 0
  const femaleCount = parseInt(formData.gender?.femaleCount) || 0
  const totalStock = maleCount + femaleCount

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={handleBack} 
            disabled={loading}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Review & Confirm Stock
          </Typography>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Bulk Pet Stock Creation</AlertTitle>
        <Typography variant="body2">
          You're creating a stock record for similar pets. This will:
        </Typography>
        <ul>
          <li>Create one stock entry for bulk pet management</li>
          <li>Generate {totalStock} individual pets with unique codes ({maleCount} male, {femaleCount} female)</li>
          <li>Associate shared images for all pets in this stock</li>
        </ul>
      </Alert>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Basic Info Card */}
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Basic Information</Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Stock Name" 
                    secondary={displayValue(formData.basic?.stockName)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Age" 
                    secondary={
                      formData.basic?.useAge === false && formData.basic?.dateOfBirth
                        ? `DOB: ${new Date(formData.basic.dateOfBirth).toLocaleDateString()} ${formData.basic.dobAccuracy === 'estimated' ? '(estimated)' : ''}`
                        : formData.basic?.age 
                          ? `${formData.basic.age} ${formData.basic.ageUnit || 'months'}` 
                          : 'Not provided'
                    } 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Color" 
                    secondary={displayValue(formData.basic?.color)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Size" 
                    secondary={displayValue(formData.basic?.size)} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Classification Card */}
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Classification</Typography>
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
                <ListItem>
                  <ListItemText 
                    primary="Breed" 
                    secondary={displayValue(breedName, 'Not selected')} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Pricing Card */}
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Pricing</Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Price" 
                    secondary={formData.pricing?.price ? `₹${Number(formData.pricing.price).toFixed(2)}` : 'Not provided'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Discount Price" 
                    secondary={formData.pricing?.discountPrice ? `₹${Number(formData.pricing.discountPrice).toFixed(2)}` : 'N/A'} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Gender Distribution Card */}
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Gender Distribution</Typography>
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
                <Divider sx={{ my: 1 }} />
                <ListItem>
                  <ListItemText 
                    primary="Total Pets to Generate" 
                    secondary={<Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{totalStock}</Typography>} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Final Confirmation */}
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Before confirming:</strong> Please verify all details above are correct. Once submitted, {totalStock} individual pets will be generated with unique codes.
        </Typography>
      </Alert>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Button 
          variant="outlined" 
          onClick={handleBack}
          size="large"
          disabled={loading}
        >
          Back
        </Button>
        <Button 
          variant="contained" 
          color="success"
          onClick={handleSubmit}
          size="large"
          disabled={loading || totalStock === 0}
          startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
        >
          {loading ? 'Creating Stock...' : `Create Stock & Generate ${totalStock} Pets`}
        </Button>
      </Box>
    </Box>
  )
}