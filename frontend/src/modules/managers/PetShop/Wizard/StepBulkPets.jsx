import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Box, 
  Typography, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button, 
  Grid, 
  Alert,
  Chip,
  IconButton,
  Paper,
  Divider,
  Autocomplete
} from '@mui/material'
import { 
  Add as AddIcon, 
  Remove as RemoveIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import { apiClient } from '../../../../services/api'

const KEY = 'petshop_wizard'

export default function StepBulkPets() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [pets, setPets] = useState([{
    id: Date.now(),
    name: '',
    color: '',
    gender: 'Unknown',
    age: '',
    ageUnit: 'months',
    size: 'medium',
    coatType: ''
  }])
  
  // Load existing data
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '{}')
      if (saved.bulkPets && Array.isArray(saved.bulkPets) && saved.bulkPets.length > 0) {
        setPets(saved.bulkPets)
      }
    } catch (e) {
      console.error('Failed to load saved bulk pets data', e)
    }
  }, [])

  const save = (newPets) => {
    const prev = JSON.parse(localStorage.getItem(KEY) || '{}')
    const next = { ...prev, bulkPets: newPets }
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  const addPet = () => {
    const newPet = {
      id: Date.now(),
      name: '',
      color: '',
      gender: 'Unknown',
      age: '',
      ageUnit: 'months',
      size: 'medium',
      coatType: ''
    }
    const newPets = [...pets, newPet]
    setPets(newPets)
    save(newPets)
  }

  const removePet = (id) => {
    if (pets.length <= 1) {
      setError('You must have at least one pet')
      return
    }
    const newPets = pets.filter(pet => pet.id !== id)
    setPets(newPets)
    save(newPets)
  }

  const updatePet = (id, field, value) => {
    const newPets = pets.map(pet => 
      pet.id === id ? { ...pet, [field]: value } : pet
    )
    setPets(newPets)
    save(newPets)
    
    // Clear error when user starts typing
    if (error) setError('')
  }

  const next = () => {
    // Validate that at least one pet has a name
    const hasNamedPet = pets.some(pet => pet.name.trim() !== '')
    
    if (!hasNamedPet) {
      setError('At least one pet must have a name')
      return
    }
    
    // Validate age fields
    for (const pet of pets) {
      if (pet.age && (isNaN(pet.age) || pet.age < 0)) {
        setError(`Pet "${pet.name || 'Unnamed'}" has an invalid age`)
        return
      }
    }
    
    navigate('/manager/petshop/wizard/review')
  }

  const back = () => navigate('/manager/petshop/wizard/pricing')

  return (
    <Box className="space-y-6">
      <Typography variant="h6" sx={{ mb: 2 }}>Bulk Pet Addition</Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Add multiple pets with different characteristics. Each pet can have unique colors, ages, genders, and other attributes.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      
      <Box sx={{ mb: 2 }}>
        <Button 
          variant="outlined" 
          startIcon={<AddIcon />}
          onClick={addPet}
        >
          Add Another Pet
        </Button>
      </Box>
      
      {pets.map((pet, index) => (
        <Paper key={pet.id} sx={{ p: 3, mb: 3, position: 'relative' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Pet {index + 1}
            </Typography>
            {pets.length > 1 && (
              <IconButton 
                onClick={() => removePet(pet.id)}
                color="error"
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Pet Name *"
                value={pet.name}
                onChange={(e) => updatePet(pet.id, 'name', e.target.value)}
                placeholder="Enter pet name"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Color"
                value={pet.color}
                onChange={(e) => updatePet(pet.id, 'color', e.target.value)}
                placeholder="e.g., Brown, Black & White"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={pet.gender}
                  onChange={(e) => updatePet(pet.id, 'gender', e.target.value)}
                  label="Gender"
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Unknown">Unknown</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Age"
                value={pet.age}
                onChange={(e) => updatePet(pet.id, 'age', e.target.value)}
                placeholder="Enter age"
                InputProps={{
                  inputProps: { min: 0, step: 0.1 }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Age Unit</InputLabel>
                <Select
                  value={pet.ageUnit}
                  onChange={(e) => updatePet(pet.id, 'ageUnit', e.target.value)}
                  label="Age Unit"
                >
                  <MenuItem value="days">Days</MenuItem>
                  <MenuItem value="weeks">Weeks</MenuItem>
                  <MenuItem value="months">Months</MenuItem>
                  <MenuItem value="years">Years</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Size</InputLabel>
                <Select
                  value={pet.size}
                  onChange={(e) => updatePet(pet.id, 'size', e.target.value)}
                  label="Size"
                >
                  <MenuItem value="tiny">Tiny</MenuItem>
                  <MenuItem value="small">Small</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="large">Large</MenuItem>
                  <MenuItem value="giant">Giant</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Coat Type</InputLabel>
                <Select
                  value={pet.coatType}
                  onChange={(e) => updatePet(pet.id, 'coatType', e.target.value)}
                  label="Coat Type"
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  <MenuItem value="short">Short</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="long">Long</MenuItem>
                  <MenuItem value="wire">Wire</MenuItem>
                  <MenuItem value="curly">Curly</MenuItem>
                  <MenuItem value="smooth">Smooth</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      ))}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button 
          variant="outlined" 
          onClick={back}
          size="large"
        >
          Back
        </Button>
        <Button 
          variant="contained" 
          onClick={next}
          size="large"
        >
          Next: Review & Submit
        </Button>
      </Box>
    </Box>
  )
}