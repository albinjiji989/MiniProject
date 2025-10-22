import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Alert,
  Chip,
  Divider,
  CircularProgress,
  IconButton
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Check as CheckIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import { apiClient, petShopAPI, resolveMediaUrl } from '../../../services/api'

const AddPet = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  // Form data
  const [petData, setPetData] = useState({
    // Basic Information
    name: '',
    speciesId: '',
    breedId: '',
    gender: 'Unknown',
    age: 0,
    ageUnit: 'months',
    
    // Pricing
    unitCost: 0,
    price: 0,
    
    // Details
    description: '',
    healthHistory: '',
    source: 'Other',
    arrivalDate: new Date().toISOString().split('T')[0],
    
    // Media
    images: []
  })

  // Dropdown data
  const [allSpecies, setAllSpecies] = useState([])
  const [filteredBreeds, setFilteredBreeds] = useState([])
  
  // Image handling
  const imgInputRef = useRef(null)

  const steps = ['Basic Information', 'Details & Pricing', 'Media & Review']

  useEffect(() => {
    fetchDropdownData()
  }, [])

  // Fetch breeds when species changes
  useEffect(() => {
    const sid = petData.speciesId
    if (!sid) { 
      setFilteredBreeds([]); 
      return 
    }
    fetchBreedsBySpecies(sid)
  }, [petData.speciesId])

  const fetchDropdownData = async () => {
    try {
      setLoading(true)
      const [specsRes, breedsRes] = await Promise.allSettled([
        apiClient.get('/admin/species/active'),
        apiClient.get('/admin/breeds/active')
      ])

      if (specsRes.status === 'fulfilled') {
        setAllSpecies(specsRes.value.data?.data || [])
      }
      if (breedsRes.status === 'fulfilled') {
        // We'll filter breeds when species is selected
      }
    } catch (err) {
      console.error('Fetch dropdown data error:', err)
      showSnackbar('Failed to load form data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchBreedsBySpecies = async (speciesId) => {
    try {
      const response = await apiClient.get('/admin/breeds/active', { params: { speciesId } })
      setFilteredBreeds(response.data?.data || [])
    } catch (err) {
      console.error('Fetch breeds error:', err)
      setFilteredBreeds([])
    }
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleNext = () => {
    if (currentStep === 0) {
      // Validate basic info
      if (!petData.name || !petData.speciesId || !petData.breedId) {
        showSnackbar('Please fill all required fields', 'error')
        return
      }
      if (petData.age < 0) {
        showSnackbar('Age cannot be negative', 'error')
        return
      }
      setCurrentStep(1)
    } else if (currentStep === 1) {
      // Validate pricing
      if (petData.unitCost < 0 || petData.price < 0) {
        showSnackbar('Cost and price cannot be negative', 'error')
        return
      }
      if (petData.unitCost > petData.price) {
        showSnackbar('Selling price should be greater than or equal to unit cost', 'warning')
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      handleCreatePet()
    }
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  // Convert file to base64
  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })

  const handleImageUpload = async (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    try {
      // Convert image to base64
      const base64 = await toBase64(file)
      setPetData(prev => ({
        ...prev,
        images: [...prev.images, { url: base64, isPrimary: prev.images.length === 0 }]
      }))
    } catch (err) {
      showSnackbar('Image processing failed', 'error')
    }
  }

  const removeImage = (index) => {
    setPetData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const setPrimaryImage = (index) => {
    setPetData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }))
    }))
  }

  const handleCreatePet = async () => {
    try {
      setLoading(true)
      
      // Prepare data for API
      const petPayload = {
        ...petData,
        quantity: 1, // Always 1 for individual pet
        status: 'in_petshop' // Default status
      }
      
      console.log('Creating pet with payload:', petPayload)
      
      const response = await petShopAPI.createInventoryItem(petPayload)
      console.log('Pet creation response:', response)
      
      showSnackbar('Pet added successfully!')
      
      // Navigate to Manage Inventory after success
      navigate('/manager/petshop/manage-inventory', { 
        state: { 
          message: `Added pet: ${petData.name}`, 
          refresh: true 
        } 
      })
      
    } catch (err) {
      console.error('Create pet error:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create pet'
      showSnackbar(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Get species name by ID
  const getSpeciesName = (id) => {
    const spec = allSpecies.find(s => s._id === id)
    return spec ? (spec.displayName || spec.name) : ''
  }

  // Get breed name by ID
  const getBreedName = (id) => {
    const breed = filteredBreeds.find(b => b._id === id)
    return breed ? breed.name : ''
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/manager/petshop/inventory')}
            sx={{ mr: 2 }}
            disabled={loading}
          >
            Back to Inventory
          </Button>
          <Typography variant="h4" component="h1">
            Add New Pet
          </Typography>
        </Box>
      </Box>

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={currentStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Form Content */}
      <Card>
        <CardContent sx={{ p: 4 }}>
          {/* Step 1: Basic Information */}
          {currentStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Enter the basic details for the new pet
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Pet Name"
                    required
                    value={petData.name}
                    onChange={(e) => setPetData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={loading}
                    placeholder="e.g., Buddy, Luna, Max"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Species</InputLabel>
                    <Select
                      value={petData.speciesId}
                      onChange={(e) => setPetData(prev => ({ 
                        ...prev, 
                        speciesId: e.target.value, 
                        breedId: '' 
                      }))}
                      disabled={loading}
                    >
                      {allSpecies.length === 0 ? (
                        <MenuItem disabled value="">No species found</MenuItem>
                      ) : (
                        allSpecies.map((spec) => (
                          <MenuItem key={spec._id} value={spec._id}>
                            {spec.displayName || spec.name}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Breed</InputLabel>
                    <Select
                      value={petData.breedId}
                      onChange={(e) => setPetData(prev => ({ ...prev, breedId: e.target.value }))}
                      disabled={loading || !petData.speciesId}
                    >
                      {filteredBreeds.length === 0 ? (
                        <MenuItem disabled value="">
                          {petData.speciesId ? 'No breeds for selected species' : 'Select species first'}
                        </MenuItem>
                      ) : (
                        filteredBreeds.map((breed) => (
                          <MenuItem key={breed._id} value={breed._id}>
                            {breed.name}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Gender</InputLabel>
                    <Select
                      value={petData.gender}
                      onChange={(e) => setPetData(prev => ({ ...prev, gender: e.target.value }))}
                      disabled={loading}
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
                    type="number"
                    inputProps={{ min: 0 }}
                    value={petData.age}
                    onChange={(e) => setPetData(prev => ({ 
                      ...prev, 
                      age: Math.max(0, parseInt(e.target.value) || 0) 
                    }))}
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Age Unit</InputLabel>
                    <Select
                      value={petData.ageUnit}
                      onChange={(e) => setPetData(prev => ({ ...prev, ageUnit: e.target.value }))}
                      disabled={loading}
                    >
                      <MenuItem value="weeks">Weeks</MenuItem>
                      <MenuItem value="months">Months</MenuItem>
                      <MenuItem value="years">Years</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Step 2: Details & Pricing */}
          {currentStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Details & Pricing
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Enter pricing and additional details for the pet
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Unit Cost (₹)"
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    value={petData.unitCost}
                    onChange={(e) => setPetData(prev => ({ 
                      ...prev, 
                      unitCost: Math.max(0, parseFloat(e.target.value) || 0) 
                    }))}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                    }}
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Selling Price (₹)"
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    value={petData.price}
                    onChange={(e) => setPetData(prev => ({ 
                      ...prev, 
                      price: Math.max(0, parseFloat(e.target.value) || 0) 
                    }))}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                    }}
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Source</InputLabel>
                    <Select
                      value={petData.source}
                      onChange={(e) => setPetData(prev => ({ ...prev, source: e.target.value }))}
                      disabled={loading}
                    >
                      <MenuItem value="Breeder">Breeder</MenuItem>
                      <MenuItem value="Rescue">Rescue</MenuItem>
                      <MenuItem value="Previous Owner">Previous Owner</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Arrival Date"
                    type="date"
                    value={petData.arrivalDate}
                    onChange={(e) => setPetData(prev => ({ ...prev, arrivalDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={petData.description}
                    onChange={(e) => setPetData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the pet's personality, habits, and special characteristics..."
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Health History"
                    multiline
                    rows={3}
                    value={petData.healthHistory}
                    onChange={(e) => setPetData(prev => ({ ...prev, healthHistory: e.target.value }))}
                    placeholder="Enter any health issues, treatments, or medical history..."
                    disabled={loading}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Step 3: Media & Review */}
          {currentStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Media & Review
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Upload pet images and review all details before adding to inventory
              </Typography>

              {/* Image Preview Section */}
              <Card sx={{ mb: 3, p: 2 }}>
                <Typography variant="h6" gutterBottom>Images</Typography>
                {petData.images.length > 0 && (
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    {petData.images.map((img, index) => (
                      <Grid item xs={6} sm={4} md={3} key={index}>
                        <Box sx={{ position: 'relative' }}>
                          <img 
                            src={img.url} 
                            alt={`Preview ${index + 1}`} 
                            style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                          {img.isPrimary && (
                            <Chip 
                              label="Primary" 
                              size="small" 
                              sx={{ 
                                position: 'absolute', 
                                top: 4, 
                                left: 4, 
                                backgroundColor: 'primary.main', 
                                color: 'white' 
                              }} 
                            />
                          )}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            {!img.isPrimary && (
                              <Button 
                                size="small" 
                                onClick={() => setPrimaryImage(index)}
                                sx={{ minWidth: 0, padding: '4px' }}
                              >
                                Set Primary
                              </Button>
                            )}
                            <Button 
                              size="small" 
                              color="error"
                              onClick={() => removeImage(index)}
                              startIcon={<DeleteIcon fontSize="small" />}
                              sx={{ minWidth: 0, padding: '4px' }}
                            >
                              Remove
                            </Button>
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<AddIcon />}
                  disabled={loading}
                >
                  Upload Image
                  <input
                    type="file"
                    ref={imgInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    hidden
                  />
                </Button>
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                  Upload clear photos of the pet (optional but recommended)
                </Typography>
              </Card>

              {/* Review Section */}
              <Card sx={{ mb: 3, p: 2 }}>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Name:</strong> {petData.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Species:</strong> {getSpeciesName(petData.speciesId)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Breed:</strong> {getBreedName(petData.breedId)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Gender:</strong> {petData.gender}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Age:</strong> {petData.age} {petData.ageUnit}</Typography>
                  </Grid>
                </Grid>
              </Card>

              <Card sx={{ mb: 3, p: 2 }}>
                <Typography variant="h6" gutterBottom>Pricing & Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Unit Cost:</strong> ₹{petData.unitCost.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Selling Price:</strong> ₹{petData.price.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Source:</strong> {petData.source}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Arrival Date:</strong> {petData.arrivalDate}</Typography>
                  </Grid>
                  {petData.description && (
                    <Grid item xs={12}>
                      <Typography variant="body2"><strong>Description:</strong> {petData.description}</Typography>
                    </Grid>
                  )}
                  {petData.healthHistory && (
                    <Grid item xs={12}>
                      <Typography variant="body2"><strong>Health History:</strong> {petData.healthHistory}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Card>

              <Alert severity="info">
                <Typography variant="body1">
                  <strong>Important:</strong> This action will create a new pet record in your inventory with a unique pet code. 
                  The pet will be available for users to browse and reserve.
                </Typography>
              </Alert>
            </Box>
          )}

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={handleBack}
              disabled={currentStep === 0 || loading}
              startIcon={<BackIcon />}
            >
              Back
            </Button>
            
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
              endIcon={currentStep === 2 ? (loading ? <CircularProgress size={20} /> : <CheckIcon />) : <NextIcon />}
            >
              {currentStep === 2 ? (loading ? 'Adding Pet...' : 'Add Pet') : 'Next'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Snackbar */}
      {snackbar.open && (
        <Alert 
          severity={snackbar.severity}
          sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      )}
    </Box>
  )
}

export default AddPet