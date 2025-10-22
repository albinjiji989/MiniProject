import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Save as SaveIcon
} from '@mui/icons-material'
import { userPetsAPI } from '../../../services/api'

const EditPet = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    ageUnit: 'months',
    gender: 'Unknown',
    healthStatus: 'Good',
    currentStatus: 'Available'
  })

  const [species, setSpecies] = useState([])
  const [breeds, setBreeds] = useState([])

  useEffect(() => {
    loadPet()
    loadDropdowns()
  }, [id])

  const loadPet = async () => {
    try {
      setLoading(true)
      const res = await userPetsAPI.get(id)
      const pet = res.data?.data || res.data?.pet || res.data
      
      setFormData({
        name: pet.name || '',
        age: pet.age || '',
        ageUnit: pet.ageUnit || 'months',
        gender: pet.gender || 'Unknown',
        speciesId: pet.speciesId?._id || pet.speciesId || '',
        breedId: pet.breedId?._id || pet.breedId || '',
        healthStatus: pet.healthStatus || 'Good',
        currentStatus: pet.currentStatus || 'Available',
        weight: pet.weight?.value || pet.weight || '',
        location: pet.location?.address || pet.location || '',
        behaviorNotes: pet.behaviorNotes || ''
      })
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load pet')
    } finally {
      setLoading(false)
    }
  }

  const loadDropdowns = async () => {
    try {
      const res = await userPetsAPI.getSpeciesBreedsActive()
      setSpecies(res.data?.data?.species || [])
      setBreeds(res.data?.data?.breeds || [])
    } catch (e) {
      console.error('Failed to load dropdowns:', e)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      
      // Validate
      if (!formData.name?.trim()) {
        setError('Pet name is required')
        return
      }
      if (!formData.age || formData.age < 0) {
        setError('Valid age is required')
        return
      }

      await userPetsAPI.update(id, {
        ...formData,
        age: Number(formData.age)
      })
      
      setSuccess('Pet updated successfully!')
      setTimeout(() => {
        navigate(`/User/pets/${id}`)
      }, 1500)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to update pet')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Container sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(`/User/pets/${id}`)}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Edit Pet
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card component="form" onSubmit={handleSubmit}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Pet Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
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
                required
                type="number"
                label="Age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Age Unit</InputLabel>
                <Select
                  name="ageUnit"
                  value={formData.ageUnit}
                  onChange={handleChange}
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
                <InputLabel>Health Status</InputLabel>
                <Select
                  name="healthStatus"
                  value={formData.healthStatus}
                  onChange={handleChange}
                  label="Health Status"
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
                <InputLabel>Status</InputLabel>
                <Select
                  name="currentStatus"
                  value={formData.currentStatus}
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value="Available">Available</MenuItem>
                  <MenuItem value="Adopted">Adopted</MenuItem>
                  <MenuItem value="Under Treatment">Under Treatment</MenuItem>
                  <MenuItem value="Fostered">Fostered</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Weight (kg)"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Behavior Notes"
                name="behaviorNotes"
                value={formData.behaviorNotes}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/User/pets/${id}`)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  )
}

export default EditPet
