import React, { useState, useEffect } from 'react'
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
  IconButton
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
import RequestModal from '../../../components/Common/RequestModal'
import { apiClient } from '../../../services/api'

const AddStock = () => {
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
  const [allSpecies, setAllSpecies] = useState([]) // All species
  const [filteredSpecies, setFilteredSpecies] = useState([]) // Species filtered by category
  const [allBreeds, setAllBreeds] = useState([]) // All breeds
  const [filteredBreeds, setFilteredBreeds] = useState([]) // Breeds filtered by species
  const [showRequestModal, setShowRequestModal] = useState(false)

  const steps = ['Basic Information', 'Age Group Distribution', 'Images', 'Review & Confirm']

  useEffect(() => {
    fetchDropdownData()
  }, [])

  // Fetch breeds when species changes
  useEffect(() => {
    const sid = basicForm.speciesId
    if (!sid) { 
      setFilteredBreeds([]); 
      setBasicForm(prev => ({ ...prev, breedId: '' }))
      return 
    }
    fetchBreedsBySpecies(sid)
  }, [basicForm.speciesId])

  // Fetch species when category changes
  useEffect(() => {
    const cid = basicForm.categoryId
    if (!cid) { 
      setFilteredSpecies([]); 
      setBasicForm(prev => ({ ...prev, speciesId: '', breedId: '' }))
      setFilteredBreeds([])
      return 
    }
    fetchSpeciesByCategory(cid)
  }, [basicForm.categoryId])

  const fetchDropdownData = async () => {
    try {
      setLoading(true)
      const [catsRes, specsRes, breedsRes] = await Promise.allSettled([
        apiClient.get('/admin/pet-categories/active'),
        apiClient.get('/admin/species/active'),
        apiClient.get('/admin/breeds/active')
      ])

      if (catsRes.status === 'fulfilled') {
        setCategories(catsRes.value.data?.data || [])
      }
      if (specsRes.status === 'fulfilled') {
        setAllSpecies(specsRes.value.data?.data || [])
      }
      if (breedsRes.status === 'fulfilled') {
        setAllBreeds(breedsRes.value.data?.data || [])
      }
    } catch (err) {
      console.error('Fetch dropdown data error:', err)
      showSnackbar('Failed to load form data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchSpeciesByCategory = async (categoryId) => {
    try {
      // Filter species by category - in a real app, this would be an API call
      // For now, we'll show all species but disable the species dropdown until category is selected
      setFilteredSpecies(allSpecies)
      
      // Reset dependent fields
      setBasicForm(prev => ({ ...prev, speciesId: '', breedId: '' }))
      setFilteredBreeds([])
    } catch (err) {
      console.error('Fetch species by category error:', err)
      setFilteredSpecies([])
      setBasicForm(prev => ({ ...prev, speciesId: '', breedId: '' }))
      setFilteredBreeds([])
    }
  }

  const fetchBreedsBySpecies = async (speciesId) => {
    try {
      const response = await apiClient.get('/admin/breeds/active', { params: { speciesId } })
      setFilteredBreeds(response.data?.data || [])
      // Reset breed selection if it's not in the new list
      if (basicForm.breedId && !response.data?.data?.some(b => b._id === basicForm.breedId)) {
        setBasicForm(prev => ({ ...prev, breedId: '' }))
      }
    } catch (err) {
      console.error('Fetch breeds error:', err)
      setFilteredBreeds([])
      setBasicForm(prev => ({ ...prev, breedId: '' }))
    }
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleNext = () => {
    if (currentStep === 0) {
      // Validate basic info
      if (!basicForm.categoryId || !basicForm.speciesId || !basicForm.breedId) {
        showSnackbar('Please fill all required fields', 'error')
        return
      }
      setCurrentStep(1)
    } else if (currentStep === 1) {
      // Calculate total count and prepare gender distribution
      const total = ageGroups.reduce((sum, group) => sum + group.count, 0)
      if (total === 0) {
        showSnackbar('Please add at least one pet to age groups', 'error')
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
      // Optionally validate images
      setCurrentStep(3)
    } else if (currentStep === 3) {
      handleCreateStock()
    }
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  // Handle image upload
  const handleImageUpload = (event, gender) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) {
      showSnackbar('No files selected', 'warning');
      return;
    }
    
    const newImages = files.map(file => {
      // Validate file type
      if (!file.type.match('image.*')) {
        showSnackbar(`File ${file.name} is not an image`, 'error');
        return null;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        showSnackbar(`File ${file.name} is too large (max 5MB)`, 'error');
        return null;
      }
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve({
          file,
          preview: reader.result,
          name: file.name
        })
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    }).filter(Boolean); // Remove null values

    if (newImages.length === 0) {
      showSnackbar('No valid images to upload', 'warning');
      return;
    }

    Promise.all(newImages).then(images => {
      if (gender === 'male') {
        setMaleImages(prev => [...prev, ...images])
      } else {
        setFemaleImages(prev => [...prev, ...images])
      }
      showSnackbar(`${images.length} ${gender} image(s) added successfully`, 'success');
    }).catch(err => {
      console.error('Error processing images:', err);
      showSnackbar('Failed to process images', 'error');
    })
  }

  // Remove image
  const removeImage = (index, gender) => {
    if (gender === 'male') {
      setMaleImages(prev => prev.filter((_, i) => i !== index))
    } else {
      setFemaleImages(prev => prev.filter((_, i) => i !== index))
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
        // Convert images to base64 strings for backend processing
        maleImages: maleImages
          .filter(img => img.preview && typeof img.preview === 'string' && img.preview.startsWith('data:image/'))
          .map(img => img.preview)
          .filter((value, index, self) => self.indexOf(value) === index), // Remove duplicates
        femaleImages: femaleImages
          .filter(img => img.preview && typeof img.preview === 'string' && img.preview.startsWith('data:image/'))
          .map(img => img.preview)
          .filter((value, index, self) => self.indexOf(value) === index), // Remove duplicates
        tags: [getCategoryName(basicForm.categoryId)],
        notes: basicForm.notes
      };

      console.log('🚀 Sending stock creation request:', { stockData });
      
      // Create the stock record
      const response = await petShopStockAPI.createStock(stockData);
      console.log('✅ Stock creation response:', response);
      
      // Provide feedback about images if any were uploaded
      const totalImages = maleImages.length + femaleImages.length;
      const message = totalImages > 0 
        ? `Successfully created stock with ${stockData.maleCount + stockData.femaleCount} pets and uploaded ${totalImages} images!`
        : `Successfully created stock with ${stockData.maleCount + stockData.femaleCount} pets!`;
      
      showSnackbar(message);
      
      // Navigate to Manage Inventory after success
      navigate('/manager/petshop/manage-inventory', { state: { message, refresh: true } });

    } catch (err) {
      console.error('Create stock error:', err);
      // Show more detailed error information
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create stock';
      const errorDetails = err.response?.data?.errors ? `\nDetails: ${err.response.data.errors.join(', ')}` : '';
      showSnackbar(`${errorMessage}${errorDetails}`, 'error');
    } finally {
      setLoading(false);
    }
  };

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
            onClick={() => navigate('/manager/petshop/inventory')}
            sx={{ mr: 2 }}
            disabled={loading}
          >
            Back to Inventory
          </Button>
          <Typography variant="h4" component="h1">
            Add New Stock
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="success"
          onClick={() => setShowRequestModal(true)}
          disabled={loading}
        >
          Request New Data
        </Button>
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
                      {categories.length === 0 ? (
                        <MenuItem disabled value="">No categories found</MenuItem>
                      ) : (
                        categories.map((cat) => (
                          <MenuItem key={cat._id} value={cat._id}>
                            {cat.displayName || cat.name}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Species</InputLabel>
                    <Select
                      value={basicForm.speciesId}
                      onChange={(e) => setBasicForm(prev => ({ 
                        ...prev, 
                        speciesId: e.target.value, 
                        breedId: '' 
                      }))}
                      disabled={loading || !basicForm.categoryId}
                    >
                      {filteredSpecies.length === 0 ? (
                        <MenuItem disabled value="">No species found</MenuItem>
                      ) : (
                        filteredSpecies.map((spec) => (
                          <MenuItem key={spec._id} value={spec._id}>
                            {spec.displayName || spec.name}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Breed</InputLabel>
                    <Select
                      value={basicForm.breedId}
                      onChange={(e) => setBasicForm(prev => ({ ...prev, breedId: e.target.value }))}
                      disabled={loading || !basicForm.speciesId}
                    >
                      {filteredBreeds.length === 0 ? (
                        <MenuItem disabled value="">
                          {basicForm.speciesId ? 'No breeds for selected species' : 'Select species first'}
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
                  <TextField
                    fullWidth
                    label="Unit Cost"
                    type="number"
                    value={basicForm.unitCost}
                    onChange={(e) => setBasicForm(prev => ({ 
                      ...prev, 
                      unitCost: parseFloat(e.target.value) || 0 
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
                    label="Base Selling Price"
                    type="number"
                    value={basicForm.basePrice}
                    onChange={(e) => setBasicForm(prev => ({ 
                      ...prev, 
                      basePrice: parseFloat(e.target.value) || 0 
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
                      value={basicForm.source}
                      onChange={(e) => setBasicForm(prev => ({ ...prev, source: e.target.value }))}
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
                    value={basicForm.arrivalDate}
                    onChange={(e) => setBasicForm(prev => ({ ...prev, arrivalDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                    value={basicForm.notes}
                    onChange={(e) => setBasicForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add any special notes about this stock..."
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
                Enter the number of pets for each age group
              </Typography>

              {ageGroups.map((group, index) => (
                <Grid container spacing={2} key={group.id} sx={{ mb: 2, alignItems: 'center' }}>
                  <Grid item xs={8}>
                    <Typography variant="body1">{group.label}</Typography>
                  </Grid>
                  <Grid item xs={4}>
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
                </Grid>
              ))}

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="h6">
                  Total Stock: {ageGroups.reduce((sum, group) => sum + group.count, 0)} pets
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Note: Age ranges will be converted to estimated dates of birth for accurate age tracking.
                </Typography>
              </Alert>
            </Box>
          )}

          {/* Step 3: Images */}
          {currentStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Images
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Upload images for male and female pets
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Male Images ({maleImages.length})
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<AddPhotoIcon />}
                  disabled={loading}
                >
                  Upload Images
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'male')}
                  />
                </Button>
                {maleImages.length > 0 && (
                  <ImageList cols={4} gap={8} sx={{ mt: 2 }}>
                    {maleImages.map((img, index) => (
                      <ImageListItem key={img.name}>
                        <img src={img.preview} alt={img.name} loading="lazy" />
                        <ImageListItemBar
                          title={img.name}
                          position="below"
                          actionIcon={
                            <IconButton
                              onClick={() => removeImage(index, 'male')}
                              disabled={loading}
                            >
                              <DeleteIcon />
                            </IconButton>
                          }
                        />
                      </ImageListItem>
                    ))}
                  </ImageList>
                )}
              </Box>

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Female Images ({femaleImages.length})
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<AddPhotoIcon />}
                  disabled={loading}
                >
                  Upload Images
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'female')}
                  />
                </Button>
                {femaleImages.length > 0 && (
                  <ImageList cols={4} gap={8} sx={{ mt: 2 }}>
                    {femaleImages.map((img, index) => (
                      <ImageListItem key={img.name}>
                        <img src={img.preview} alt={img.name} loading="lazy" />
                        <ImageListItemBar
                          title={img.name}
                          position="below"
                          actionIcon={
                            <IconButton
                              onClick={() => removeImage(index, 'female')}
                              disabled={loading}
                            >
                              <DeleteIcon />
                            </IconButton>
                          }
                        />
                      </ImageListItem>
                    ))}
                  </ImageList>
                )}
              </Box>
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

              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body1">
                  <strong>Important:</strong> This action will create {totalStockCount} individual pet records in your inventory. 
                  Each pet will receive a unique pet code and can be managed individually.
                </Typography>
              </Alert>
              
              {(maleImages.length > 0 || femaleImages.length > 0) && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    <strong>Images:</strong> You have selected {maleImages.length} male image(s) and {femaleImages.length} female image(s) 
                    that will be associated with the respective pets when they are generated from this stock.
                  </Typography>
                </Alert>
              )}
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

      <RequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={() => {
          console.log('Request submitted successfully')
          fetchDropdownData() // Reload dropdown data
        }}
      />
    </Box>
  )
}

export default AddStock