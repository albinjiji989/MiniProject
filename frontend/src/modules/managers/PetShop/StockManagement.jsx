import React, { useState } from 'react'
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
  ImageList,
  ImageListItem,
  ImageListItemBar,
  IconButton,
  Input
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Check as CheckIcon,
  AddAPhoto as AddPhotoIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import { petShopStockAPI } from '../../../services/api'

const StockManagement = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  // Form data
  const [basicForm, setBasicForm] = useState({
    categoryId: '',
    speciesId: '',
    breedId: '',
    unitCost: 0,
    basePrice: 0,
    source: 'Other',
    arrivalDate: new Date().toISOString().split('T')[0],
    notes: '',
    color: '',
    size: 'medium'
  })

  // Age groups
  const [ageGroups, setAgeGroups] = useState([
    { id: 1, label: 'Puppy/Kitten (0-6 months)', ageRange: [0, 6], ageUnit: 'months', count: 0 },
    { id: 2, label: 'Young (6-18 months)', ageRange: [6, 18], ageUnit: 'months', count: 0 },
    { id: 3, label: 'Adult (1.5-7 years)', ageRange: [1.5, 7], ageUnit: 'years', count: 0 },
    { id: 4, label: 'Senior (7+ years)', ageRange: [7, 15], ageUnit: 'years', count: 0 }
  ])

  // Gender distribution
  const [genderDistribution, setGenderDistribution] = useState([])
  const [totalStockCount, setTotalStockCount] = useState(0)

  // Images
  const [maleImages, setMaleImages] = useState([])
  const [femaleImages, setFemaleImages] = useState([])

  // Dropdown data
  const [categories, setCategories] = useState([])
  const [allSpecies, setAllSpecies] = useState([])
  const [filteredSpecies, setFilteredSpecies] = useState([])
  const [allBreeds, setAllBreeds] = useState([])
  const [filteredBreeds, setFilteredBreeds] = useState([])

  const steps = ['Basic Information', 'Age Group Distribution', 'Images', 'Review & Confirm']

  // Handle image upload
  const handleImageUpload = (event, gender) => {
    const files = Array.from(event.target.files)
    
    // Only allow one image per gender
    if (files.length > 0) {
      const file = files[0] // Take only the first file
      const reader = new FileReader()
      reader.onload = () => {
        const image = {
          file,
          preview: reader.result,
          name: file.name
        }
        
        if (gender === 'male') {
          setMaleImages([image]) // Replace instead of adding
        } else {
          setFemaleImages([image]) // Replace instead of adding
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove image
  const removeImage = (index, gender) => {
    if (gender === 'male') {
      setMaleImages([])
    } else {
      setFemaleImages([])
    }
  }

  const handleCreateStock = async () => {
    try {
      setLoading(true)
      
      // Prepare stock data
      const stockData = {
        name: `${getBreedName(basicForm.breedId)} ${getSpeciesName(basicForm.speciesId)}`,
        speciesId: basicForm.speciesId,
        breedId: basicForm.breedId,
        age: ageGroups.find(g => g.count > 0)?.ageRange[0] || 0,
        ageUnit: ageGroups.find(g => g.count > 0)?.ageUnit || 'months',
        color: basicForm.color || '',
        size: basicForm.size || 'medium',
        price: parseFloat(basicForm.basePrice) || 0,
        unitCost: parseFloat(basicForm.unitCost) || 0,
        maleCount: genderDistribution.reduce((sum, group) => sum + (parseInt(group.maleCount) || 0), 0),
        femaleCount: genderDistribution.reduce((sum, group) => sum + (parseInt(group.femaleCount) || 0), 0),
        // Note: We'll handle images separately on the backend
        tags: [getCategoryName(basicForm.categoryId)],
        notes: basicForm.notes
      }

      console.log('🚀 Sending stock creation request:', { stockData })
      
      // Create the stock record
      const response = await petShopStockAPI.createStock(stockData)
      console.log('✅ Stock creation response:', response)
      
      setSnackbar({ 
        open: true, 
        message: `Successfully created stock with ${stockData.maleCount + stockData.femaleCount} pets!`,
        severity: 'success'
      })
      
      // Navigate to stock images management after success
      setTimeout(() => {
        navigate(`/manager/petshop/manage-stock-images/${response.data.data.stock._id}`)
      }, 2000)

    } catch (err) {
      console.error('Create stock error:', err)
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create stock'
      setSnackbar({ 
        open: true, 
        message: errorMessage,
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (currentStep === 0) {
      // Validate basic info
      if (!basicForm.categoryId || !basicForm.speciesId || !basicForm.breedId) {
        setSnackbar({ 
          open: true, 
          message: 'Please fill all required fields',
          severity: 'error'
        })
        return
      }
      setCurrentStep(1)
    } else if (currentStep === 1) {
      // Calculate total count and prepare gender distribution
      const total = ageGroups.reduce((sum, group) => sum + group.count, 0)
      if (total === 0) {
        setSnackbar({ 
          open: true, 
          message: 'Please add at least one pet to age groups',
          severity: 'error'
        })
        return
      }
      setTotalStockCount(total)
      
      // Initialize gender distribution for each age group with non-zero counts
      const genderDist = ageGroups
        .filter(group => group.count > 0)
        .map(group => ({
          ...group,
          maleCount: Math.floor(group.count / 2),
          femaleCount: group.count - Math.floor(group.count / 2)
        }))
      setGenderDistribution(genderDist)
      setCurrentStep(2)
    } else if (currentStep === 2) {
      setCurrentStep(3)
    } else if (currentStep === 3) {
      handleCreateStock()
    }
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  const updateGenderCount = (index, field, value) => {
    const newDist = [...genderDistribution]
    const item = newDist[index]
    const newValue = Math.max(0, Math.min(item.count, parseInt(value) || 0))
    
    if (field === 'maleCount') {
      item.maleCount = newValue
      item.femaleCount = item.count - newValue
    } else {
      item.femaleCount = newValue
      item.maleCount = item.count - newValue
    }
    
    setGenderDistribution(newDist)
  }

  const updateAgeGroupCount = (index, value) => {
    const newGroups = [...ageGroups]
    newGroups[index].count = Math.max(0, parseInt(value) || 0)
    setAgeGroups(newGroups)
  }

  // Get category name by ID
  const getCategoryName = (id) => {
    const category = categories.find(cat => cat._id === id)
    return category ? (category.displayName || category.name) : ''
  }

  // Get species name by ID
  const getSpeciesName = (id) => {
    const spec = filteredSpecies.find(s => s._id === id)
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
            onClick={() => navigate('/manager/petshop/stocks')}
            sx={{ mr: 2 }}
            disabled={loading}
          >
            Back to Stocks
          </Button>
          <Typography variant="h4" component="h1">
            Add New Stock
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
                Enter the basic details for the new stock
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={basicForm.categoryId}
                      onChange={(e) => setBasicForm(prev => ({ ...prev, categoryId: e.target.value }))}
                      disabled={loading}
                    >
                      {categories.map((cat) => (
                        <MenuItem key={cat._id} value={cat._id}>
                          {cat.displayName || cat.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Species</InputLabel>
                    <Select
                      value={basicForm.speciesId}
                      onChange={(e) => setBasicForm(prev => ({ ...prev, speciesId: e.target.value }))}
                      disabled={loading}
                    >
                      {filteredSpecies.map((spec) => (
                        <MenuItem key={spec._id} value={spec._id}>
                          {spec.displayName || spec.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Breed</InputLabel>
                    <Select
                      value={basicForm.breedId}
                      onChange={(e) => setBasicForm(prev => ({ ...prev, breedId: e.target.value }))}
                      disabled={loading}
                    >
                      {filteredBreeds.map((breed) => (
                        <MenuItem key={breed._id} value={breed._id}>
                          {breed.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Unit Cost (₹)"
                    type="number"
                    value={basicForm.unitCost}
                    onChange={(e) => setBasicForm(prev => ({ ...prev, unitCost: e.target.value }))}
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Base Price (₹)"
                    type="number"
                    value={basicForm.basePrice}
                    onChange={(e) => setBasicForm(prev => ({ ...prev, basePrice: e.target.value }))}
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Source</InputLabel>
                    <Select
                      value={basicForm.source}
                      onChange={(e) => setBasicForm(prev => ({ ...prev, source: e.target.value }))}
                      disabled={loading}
                    >
                      <MenuItem value="Breeder">Breeder</MenuItem>
                      <MenuItem value="Rescue">Rescue Organization</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Arrival Date"
                    type="date"
                    value={basicForm.arrivalDate}
                    onChange={(e) => setBasicForm(prev => ({ ...prev, arrivalDate: e.target.value }))}
                    disabled={loading}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Color"
                    value={basicForm.color}
                    onChange={(e) => setBasicForm(prev => ({ ...prev, color: e.target.value }))}
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Size</InputLabel>
                    <Select
                      value={basicForm.size}
                      onChange={(e) => setBasicForm(prev => ({ ...prev, size: e.target.value }))}
                      disabled={loading}
                    >
                      <MenuItem value="tiny">Tiny</MenuItem>
                      <MenuItem value="small">Small</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="large">Large</MenuItem>
                      <MenuItem value="giant">Giant</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                    value={basicForm.notes}
                    onChange={(e) => setBasicForm(prev => ({ ...prev, notes: e.target.value }))}
                    disabled={loading}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Step 2: Age Group Distribution */}
          {currentStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Age Group Distribution
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Distribute the total number of pets across different age groups
              </Typography>

              {ageGroups.map((group, index) => (
                <Card key={group.id} sx={{ mb: 2, p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {group.label}
                  </Typography>
                  
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Count"
                        type="number"
                        inputProps={{ min: 0 }}
                        value={group.count}
                        onChange={(e) => updateAgeGroupCount(index, e.target.value)}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        Age Range: {group.ageRange[0]} - {group.ageRange[1]} {group.ageUnit}
                      </Typography>
                    </Grid>
                  </Grid>
                </Card>
              ))}

              <Typography variant="body2" sx={{ mt: 2 }}>
                <strong>Total Stock:</strong> {ageGroups.reduce((sum, group) => sum + group.count, 0)} pets
              </Typography>
            </Box>
          )}

          {/* Step 3: Images */}
          {currentStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Upload Images
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Upload one image for male pets and one for female pets. These images will be shared among all individual pets of the respective gender generated from this stock.
              </Typography>

              <Grid container spacing={3}>
                {/* Male Images */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Male Pets</Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<AddPhotoIcon />}
                    sx={{ mb: 2 }}
                  >
                    Upload Male Image
                    <Input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'male')}
                    />
                  </Button>
                  
                  {maleImages.length > 0 && (
                    <ImageList cols={1} rowHeight={200}>
                      {maleImages.map((image, index) => (
                        <ImageListItem key={index}>
                          <img
                            src={image.preview}
                            alt="Male pet"
                            loading="lazy"
                          />
                          <ImageListItemBar
                            actionIcon={
                              <IconButton
                                sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                                onClick={() => removeImage(index, 'male')}
                              >
                                <DeleteIcon />
                              </IconButton>
                            }
                          />
                        </ImageListItem>
                      ))}
                    </ImageList>
                  )}
                </Grid>

                {/* Female Images */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Female Pets</Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<AddPhotoIcon />}
                    sx={{ mb: 2 }}
                  >
                    Upload Female Image
                    <Input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'female')}
                    />
                  </Button>
                  
                  {femaleImages.length > 0 && (
                    <ImageList cols={1} rowHeight={200}>
                      {femaleImages.map((image, index) => (
                        <ImageListItem key={index}>
                          <img
                            src={image.preview}
                            alt="Female pet"
                            loading="lazy"
                          />
                          <ImageListItemBar
                            actionIcon={
                              <IconButton
                                sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                                onClick={() => removeImage(index, 'female')}
                              >
                                <DeleteIcon />
                              </IconButton>
                            }
                          />
                        </ImageListItem>
                      ))}
                    </ImageList>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Step 4: Review & Confirm */}
          {currentStep === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Review & Confirm
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Please review the details before creating the stock
              </Typography>

              <Card sx={{ mb: 3, p: 2 }}>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Category:</strong> {getCategoryName(basicForm.categoryId)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Species:</strong> {getSpeciesName(basicForm.speciesId)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Breed:</strong> {getBreedName(basicForm.breedId)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Source:</strong> {basicForm.source}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Unit Cost:</strong> ₹{basicForm.unitCost}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Base Price:</strong> ₹{basicForm.basePrice}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Arrival Date:</strong> {basicForm.arrivalDate}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Color:</strong> {basicForm.color || 'Not specified'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Size:</strong> {basicForm.size}</Typography>
                  </Grid>
                  {basicForm.notes && (
                    <Grid item xs={12}>
                      <Typography variant="body2"><strong>Notes:</strong> {basicForm.notes}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Card>

              <Card sx={{ mb: 3, p: 2 }}>
                <Typography variant="h6" gutterBottom>Stock Distribution</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}><strong>Total Pets:</strong> {totalStockCount}</Typography>
                
                {genderDistribution.map((group, index) => (
                  <Box key={group.id} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">{group.label}</Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                      <Chip label={`Male: ${group.maleCount}`} color="primary" variant="outlined" />
                      <Chip label={`Female: ${group.femaleCount}`} color="secondary" variant="outlined" />
                      <Chip label={`Total: ${group.count}`} variant="filled" />
                    </Box>
                  </Box>
                ))}
              </Card>

              <Card sx={{ mb: 3, p: 2 }}>
                <Typography variant="h6" gutterBottom>Images</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Male Images:</strong> {maleImages.length > 0 ? '1 image uploaded' : 'No image uploaded'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Female Images:</strong> {femaleImages.length > 0 ? '1 image uploaded' : 'No image uploaded'}</Typography>
                  </Grid>
                </Grid>
              </Card>

              <Alert severity="info">
                <Typography variant="body1">
                  <strong>Important:</strong> This action will create a stock record with {totalStockCount} pets. 
                  Only two images are required - one for male pets and one for female pets. These images will be shared 
                  among all individual pets of the respective gender generated from this stock.
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
              endIcon={currentStep === 3 ? (loading ? <CircularProgress size={20} /> : <CheckIcon />) : <NextIcon />}
            >
              {currentStep === 3 ? (loading ? 'Creating Stock...' : 'Create Stock') : 'Next'}
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

export default StockManagement