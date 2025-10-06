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
  Alert
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon
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
    { label: 'Puppy/Kitten (0-6 months)', ageRange: [0, 6], ageUnit: 'months', count: 0 },
    { label: 'Young (6-18 months)', ageRange: [6, 18], ageUnit: 'months', count: 0 },
    { label: 'Adult (1.5-7 years)', ageRange: [1.5, 7], ageUnit: 'years', count: 0 },
    { label: 'Senior (7+ years)', ageRange: [7, 15], ageUnit: 'years', count: 0 }
  ])

  // Gender distribution
  const [genderDistribution, setGenderDistribution] = useState([])
  const [totalStockCount, setTotalStockCount] = useState(0)

  // Dropdown data
  const [categories, setCategories] = useState([])
  const [species, setSpecies] = useState([])
  const [breeds, setBreeds] = useState([])
  const [showRequestModal, setShowRequestModal] = useState(false)

  const steps = ['Basic Information', 'Age Group Distribution', 'Gender Distribution']

  useEffect(() => {
    fetchDropdownData()
  }, [])

  // Fetch breeds when species changes
  useEffect(() => {
    const sid = basicForm.speciesId
    if (!sid) { setBreeds([]); return }
    ;(async () => {
      try {
        const { data } = await apiClient.get('/admin/breeds/active', { params: { speciesId: sid } })
        setBreeds(data?.data || [])
      } catch (_) { setBreeds([]) }
    })()
  }, [basicForm.speciesId])

  const fetchDropdownData = async () => {
    try {
      setLoading(true)
      const [catsRes, specsRes] = await Promise.allSettled([
        apiClient.get('/admin/pet-categories/active'),
        apiClient.get('/admin/species/active')
      ])

      if (catsRes.status === 'fulfilled') {
        setCategories(catsRes.value.data?.data || [])
      }
      if (specsRes.status === 'fulfilled') {
        setSpecies(specsRes.value.data?.data || [])
      }
    } catch (err) {
      console.error('Fetch dropdown data error:', err)
      showSnackbar('Failed to load form data', 'error')
    } finally {
      setLoading(false)
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
      
      // Initialize gender distribution for each age group
      const genderDist = ageGroups
        .filter(group => group.count > 0)
        .map(group => ({
          ...group,
          maleCount: Math.floor(group.count / 2),
          femaleCount: Math.ceil(group.count / 2)
        }))
      setGenderDistribution(genderDist)
      setCurrentStep(2)
    } else if (currentStep === 2) {
      handleCreateStock()
    }
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleCreateStock = async () => {
    try {
      setLoading(true)
      const items = []
      
      genderDistribution.forEach(ageGroup => {
        // Create male pets
        for (let i = 0; i < ageGroup.maleCount; i++) {
          items.push({
            ...basicForm,
            gender: 'Male',
            age: ageGroup.ageRange[0],
            ageUnit: ageGroup.ageUnit,
            ageGroup: ageGroup.label,
            quantity: 1,
            price: basicForm.basePrice || 0
          })
        }
        
        // Create female pets
        for (let i = 0; i < ageGroup.femaleCount; i++) {
          items.push({
            ...basicForm,
            gender: 'Female',
            age: ageGroup.ageRange[0],
            ageUnit: ageGroup.ageUnit,
            ageGroup: ageGroup.label,
            quantity: 1,
            price: basicForm.basePrice || 0
          })
        }
      })
      
      console.log('🚀 Sending bulk inventory request:', { items })
      console.log('📝 Sample item structure:', items[0])
      
      const response = await apiClient.post('/petshop/inventory/bulk', { items })
      console.log('✅ Bulk inventory response:', response)
      
      showSnackbar(`Successfully added ${items.length} pets to stock!`)
      
      // Navigate to Manage Inventory after success
      navigate('/manager/petshop/manage-inventory', { state: { message: `Added ${items.length} pets to stock`, refresh: true } })
      
    } catch (err) {
      console.error('Create stock error:', err)
      showSnackbar(err.response?.data?.message || 'Failed to create stock', 'error')
    } finally {
      setLoading(false)
    }
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

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/manager/petshop/inventory')}
            sx={{ mr: 2 }}
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
                    >
                      {categories.length === 0 && (
                        <MenuItem disabled value="">No categories found</MenuItem>
                      )}
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
                      onChange={(e) => setBasicForm(prev => ({ 
                        ...prev, 
                        speciesId: e.target.value, 
                        breedId: '' 
                      }))}
                    >
                      {species.length === 0 && (
                        <MenuItem disabled value="">No species found</MenuItem>
                      )}
                      {species.map((spec) => (
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
                    >
                      {breeds.length === 0 && (
                        <MenuItem disabled value="">
                          {basicForm.speciesId ? 'No breeds for selected species' : 'Select species first'}
                        </MenuItem>
                      )}
                      {breeds.map((breed) => (
                        <MenuItem key={breed._id} value={breed._id}>
                          {breed.name}
                        </MenuItem>
                      ))}
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
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Arrival Date"
                    type="date"
                    value={basicForm.arrivalDate}
                    onChange={(e) => setBasicForm(prev => ({ ...prev, arrivalDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
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
                <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}>
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
                      onChange={(e) => {
                        const newGroups = [...ageGroups]
                        newGroups[index].count = Math.max(0, parseInt(e.target.value) || 0)
                        setAgeGroups(newGroups)
                      }}
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
                <Card key={index} sx={{ mb: 2, p: 2 }}>
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

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={handleBack}
              disabled={currentStep === 0}
              startIcon={<BackIcon />}
            >
              Back
            </Button>
            
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
              endIcon={currentStep === 2 ? <SaveIcon /> : <NextIcon />}
            >
              {currentStep === 2 ? 'Create Stock' : 'Next'}
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
