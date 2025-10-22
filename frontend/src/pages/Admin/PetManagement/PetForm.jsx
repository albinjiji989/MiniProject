import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  FormControlLabel,
  Switch,
  Chip,
  Autocomplete,
  Divider,
  Paper,
} from '@mui/material'
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import { usersAPI } from '../../../services/api'
import { petsAPI as adminPetsAPI, speciesAPI as adminSpeciesAPI, breedsAPI as adminBreedsAPI, petDetailsAPI as adminPetDetailsAPI } from '../../../services/petSystemAPI'

const PetForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Data for dropdowns
  const [species, setSpecies] = useState([])
  const [breeds, setBreeds] = useState([])
  const [users, setUsers] = useState([])
  const [petDetails, setPetDetails] = useState([])
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    petDetails: '',
    owner: '',
    gender: 'Unknown',
    dateOfBirth: '',
    age: '',
    ageUnit: 'months',
    weight: '',
    currentStatus: 'Available',
    healthStatus: 'Good',
    isAdoptionReady: true,
    adoptionFee: 0,
    location: '',
    microchipId: '',
    temperament: [],
    behaviorNotes: '',
    specialNeeds: [],
    adoptionRequirements: [],
    tags: [],
    description: '',
    isActive: true
  })

  const [availableTemperaments, setAvailableTemperaments] = useState([])

  const [availableSpecialNeeds, setAvailableSpecialNeeds] = useState([])

  const [availableRequirements, setAvailableRequirements] = useState([])

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (isEdit) {
      loadPetData()
    }
  }, [id, isEdit])

  const loadInitialData = async () => {
    try {
      const [speciesRes, usersRes] = await Promise.all([
        adminSpeciesAPI.list({ limit: 1000 }),
        usersAPI.getUsers({ limit: 1000 })
      ])

      setSpecies(speciesRes.data?.data || [])
      setBreeds([])
      setUsers(usersRes.data?.data || [])
      setPetDetails([])
    } catch (err) {
      setError('Failed to load form data')
    } finally {
      setInitialLoading(false)
    }
  }

  const loadPetData = async () => {
    try {
      setInitialLoading(true)
      const response = await adminPetsAPI.getById(id)
      const pet = response.data?.data || response.data
      
      setFormData({
        name: pet.name || '',
        species: pet.species?._id || pet.species || '',
        breed: pet.breed?._id || pet.breed || '',
        petDetails: pet.petDetails?._id || pet.petDetails || '',
        owner: pet.owner?._id || pet.owner || '',
        gender: pet.gender || 'Unknown',
        dateOfBirth: pet.dateOfBirth ? new Date(pet.dateOfBirth).toISOString().split('T')[0] : '',
        age: pet.age || '',
        ageUnit: pet.ageUnit || 'months',
        weight: pet.weight || '',
        currentStatus: pet.currentStatus || 'Available',
        healthStatus: pet.healthStatus || 'Good',
        isAdoptionReady: pet.isAdoptionReady !== false,
        adoptionFee: pet.adoptionFee || 0,
        location: pet.location || '',
        microchipId: pet.microchipId || '',
        temperament: pet.temperament || [],
        behaviorNotes: pet.behaviorNotes || '',
        specialNeeds: pet.specialNeeds || [],
        adoptionRequirements: pet.adoptionRequirements || [],
        tags: pet.tags || [],
        description: pet.description || '',
        isActive: pet.isActive !== false
      })
    } catch (err) {
      setError('Failed to load pet data')
    } finally {
      setInitialLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate required fields
      if (!formData.name || !formData.species || !formData.breed || !formData.owner) {
        setError('Please fill in all required fields')
        return
      }

      const submitData = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        adoptionFee: formData.adoptionFee ? parseFloat(formData.adoptionFee) : 0
      }

      if (isEdit) {
        await adminPetsAPI.update(id, submitData)
        setSuccess('Pet updated successfully!')
      } else {
        await adminPetsAPI.create(submitData)
        setSuccess('Pet created successfully!')
      }

      setTimeout(() => {
        navigate('/admin/pets')
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save pet')
    } finally {
      setLoading(false)
    }
  }

  const filteredBreeds = breeds.filter(breed => 
    !formData.species || breed.species?._id === formData.species
  )

  const filteredPetDetails = petDetails.filter(detail => 
    !formData.species || detail.speciesId?._id === formData.species
  )

  // load breeds and details on species change
  useEffect(() => {
    const loadForSpecies = async () => {
      if (!formData.species) {
        setBreeds([])
        setPetDetails([])
        return
      }
      try {
        const [bRes, dRes] = await Promise.all([
          adminBreedsAPI.getBySpecies(formData.species),
          adminPetDetailsAPI.getBySpecies(formData.species)
        ])
        const bData = bRes.data?.data || []
        setBreeds(Array.isArray(bData) ? bData : (bData.breeds || []))
        setPetDetails(dRes.data?.data || [])
      } catch (err) {
        console.error('Failed to load breeds/details for species:', err)
      }
    }
    loadForSpecies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.species])

  if (initialLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4} display="flex" alignItems="center" gap={2}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/admin/pets')}
        >
          Back to Pets
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          {isEdit ? 'Edit Pet' : 'Add New Pet'}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Pet Name *"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Gender</InputLabel>
                      <Select
                        value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
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
                      type="number"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Microchip ID"
                      value={formData.microchipId}
                      onChange={(e) => handleInputChange('microchipId', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Species and Breed */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Species & Breed Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Species *</InputLabel>
                      <Select
                        value={formData.species}
                        onChange={(e) => {
                          handleInputChange('species', e.target.value)
                          handleInputChange('breed', '') // Reset breed when species changes
                        }}
                      >
                        {species.map((s) => (
                          <MenuItem key={s._id} value={s._id}>
                            {s.displayName || s.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Breed *</InputLabel>
                      <Select
                        value={formData.breed}
                        onChange={(e) => handleInputChange('breed', e.target.value)}
                        disabled={!formData.species}
                      >
                        {filteredBreeds.map((b) => (
                          <MenuItem key={b._id} value={b._id}>
                            {b.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Pet Details</InputLabel>
                      <Select
                        value={formData.petDetails}
                        onChange={(e) => handleInputChange('petDetails', e.target.value)}
                      >
                        {filteredPetDetails.map((d) => (
                          <MenuItem key={d._id} value={d._id}>
                            {d.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Age and Health */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Age & Health Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Age Unit</InputLabel>
                      <Select
                        value={formData.ageUnit}
                        onChange={(e) => handleInputChange('ageUnit', e.target.value)}
                      >
                        <MenuItem value="days">Days</MenuItem>
                        <MenuItem value="weeks">Weeks</MenuItem>
                        <MenuItem value="months">Months</MenuItem>
                        <MenuItem value="years">Years</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Date of Birth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Health Status</InputLabel>
                      <Select
                        value={formData.healthStatus}
                        onChange={(e) => handleInputChange('healthStatus', e.target.value)}
                      >
                        <MenuItem value="Excellent">Excellent</MenuItem>
                        <MenuItem value="Good">Good</MenuItem>
                        <MenuItem value="Fair">Fair</MenuItem>
                        <MenuItem value="Poor">Poor</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Current Status</InputLabel>
                      <Select
                        value={formData.currentStatus}
                        onChange={(e) => handleInputChange('currentStatus', e.target.value)}
                      >
                        <MenuItem value="Available">Available</MenuItem>
                        <MenuItem value="Adopted">Adopted</MenuItem>
                        <MenuItem value="Reserved">Reserved</MenuItem>
                        <MenuItem value="Medical">Medical</MenuItem>
                        <MenuItem value="Fostered">Fostered</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Owner and Location */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Owner & Location Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Owner *</InputLabel>
                      <Select
                        value={formData.owner}
                        onChange={(e) => handleInputChange('owner', e.target.value)}
                      >
                        {users.map((u) => (
                          <MenuItem key={u._id} value={u._id}>
                            {u.name} ({u.email})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Adoption Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Adoption Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isAdoptionReady}
                          onChange={(e) => handleInputChange('isAdoptionReady', e.target.checked)}
                        />
                      }
                      label="Ready for Adoption"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Adoption Fee"
                      type="number"
                      value={formData.adoptionFee}
                      onChange={(e) => handleInputChange('adoptionFee', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Temperament and Behavior */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Temperament & Behavior
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Autocomplete
                      multiple
                      options={availableTemperaments}
                      value={formData.temperament}
                      onChange={(e, value) => handleArrayChange('temperament', value)}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Temperament"
                          placeholder="Select temperament traits"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Behavior Notes"
                      multiline
                      rows={3}
                      value={formData.behaviorNotes}
                      onChange={(e) => handleInputChange('behaviorNotes', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Special Needs and Requirements */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Special Needs & Requirements
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      multiple
                      options={availableSpecialNeeds}
                      value={formData.specialNeeds}
                      onChange={(e, value) => handleArrayChange('specialNeeds', value)}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Special Needs"
                          placeholder="Select special needs"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      multiple
                      options={availableRequirements}
                      value={formData.adoptionRequirements}
                      onChange={(e, value) => handleArrayChange('adoptionRequirements', value)}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Adoption Requirements"
                          placeholder="Select requirements"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Additional Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Additional Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      multiline
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isActive}
                          onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        />
                      }
                      label="Active"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => navigate('/admin/pets')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                {loading ? 'Saving...' : (isEdit ? 'Update Pet' : 'Create Pet')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>

      {/* Error/Success Messages */}
      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      )}

      {success && (
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>
      )}
    </Container>
  )
}

export default PetForm