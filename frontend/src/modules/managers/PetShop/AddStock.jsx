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
  CircularProgress
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Check as CheckIcon
} from '@mui/icons-material'
import { apiClient } from '../../../services/api'
import RequestModal from '../../../components/Common/RequestModal'

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
    notes: ''
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

  // Dropdown data
  const [categories, setCategories] = useState([])
  const [allSpecies, setAllSpecies] = useState([]) // All species
  const [filteredSpecies, setFilteredSpecies] = useState([]) // Species filtered by category
  const [allBreeds, setAllBreeds] = useState([]) // All breeds
  const [filteredBreeds, setFilteredBreeds] = useState([]) // Breeds filtered by species
  const [showRequestModal, setShowRequestModal] = useState(false)

  const steps = ['Basic Information', 'Age Group Distribution', 'Gender Distribution', 'Review & Confirm']

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
      setCurrentStep(3)
    } else if (currentStep === 3) {
      handleCreateStock()
    }
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleCreateStock = async () => {
    try {
      setLoading(true);
      const items = [];
      
      console.log('Gender distribution:', genderDistribution);
      
      // Validate gender distribution data
      if (!Array.isArray(genderDistribution) || genderDistribution.length === 0) {
        throw new Error('No gender distribution data found. Please complete all steps.');
      }
      
      genderDistribution.forEach((ageGroup, index) => {
        console.log(`Processing age group ${index}:`, ageGroup);
        
        // Validate ageGroup structure
        if (!ageGroup || !Array.isArray(ageGroup.ageRange) || ageGroup.ageRange.length < 1) {
          console.error(`Invalid age group data at index ${index}:`, ageGroup);
          throw new Error(`Invalid age group data at index ${index}`);
        }
        
        // Create male pets
        const maleCount = parseInt(ageGroup.maleCount) || 0;
        for (let i = 0; i < maleCount; i++) {
          const item = {
            categoryId: basicForm.categoryId,
            speciesId: basicForm.speciesId,
            breedId: basicForm.breedId,
            gender: 'Male',
            age: ageGroup.ageRange[0],
            ageUnit: ageGroup.ageUnit,
            quantity: 1,
            price: parseFloat(basicForm.basePrice) || 0,
            unitCost: parseFloat(basicForm.unitCost) || 0,
            source: basicForm.source,
            arrivalDate: basicForm.arrivalDate ? new Date(basicForm.arrivalDate) : new Date(),
            notes: basicForm.notes
          };
          console.log(`Creating male pet ${i} for age group ${index}:`, item);
          items.push(item);
        }
        
        // Create female pets
        const femaleCount = parseInt(ageGroup.femaleCount) || 0;
        for (let i = 0; i < femaleCount; i++) {
          const item = {
            categoryId: basicForm.categoryId,
            speciesId: basicForm.speciesId,
            breedId: basicForm.breedId,
            gender: 'Female',
            age: ageGroup.ageRange[0],
            ageUnit: ageGroup.ageUnit,
            quantity: 1,
            price: parseFloat(basicForm.basePrice) || 0,
            unitCost: parseFloat(basicForm.unitCost) || 0,
            source: basicForm.source,
            arrivalDate: basicForm.arrivalDate ? new Date(basicForm.arrivalDate) : new Date(),
            notes: basicForm.notes
          };
          console.log(`Creating female pet ${i} for age group ${index}:`, item);
          items.push(item);
        }
      });
      
      console.log('🚀 Sending bulk inventory request:', { items });
      console.log('📝 Sample item structure:', items[0]);
      
      // Validate that we have items to send
      if (items.length === 0) {
        throw new Error('No items to create. Please add pets to age groups.');
      }
      
      const response = await apiClient.post('/petshop/inventory/bulk', { items });
      console.log('✅ Bulk inventory response:', response);
      
      showSnackbar(`Successfully added ${items.length} pets to stock!`);
      
      // Navigate to Manage Inventory after success
      navigate('/manager/petshop/manage-inventory', { state: { message: `Added ${items.length} pets to stock`, refresh: true } });
      
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
              </Alert>
            </Box>
          )}

          {/* Step 3: Gender Distribution */}
          {currentStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Gender Distribution
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Distribute {totalStockCount} pets by gender for each age group
              </Typography>

              {genderDistribution.map((group, index) => (
                <Card key={group.id} sx={{ mb: 2, p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {group.label}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Total: {group.count} pets
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Male Count"
                        type="number"
                        inputProps={{ min: 0, max: group.count }}
                        value={group.maleCount}
                        onChange={(e) => updateGenderCount(index, 'maleCount', e.target.value)}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Female Count"
                        type="number"
                        inputProps={{ min: 0, max: group.count }}
                        value={group.femaleCount}
                        onChange={(e) => updateGenderCount(index, 'femaleCount', e.target.value)}
                        disabled={loading}
                      />
                    </Grid>
                  </Grid>

                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Remaining: {group.count - group.maleCount - group.femaleCount}
                  </Typography>
                </Card>
              ))}
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

              <Alert severity="warning">
                <Typography variant="body1">
                  <strong>Important:</strong> This action will create {totalStockCount} individual pet records in your inventory. 
                  Each pet will receive a unique pet code and can be managed individually.
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