import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Box, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button, 
  Grid, 
  Alert,
  CircularProgress,
  FormHelperText
} from '@mui/material'
import { apiClient } from '../../../../services/api'

const KEY = 'petshop_wizard'

export default function StepClassificationImproved() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [allSpecies, setAllSpecies] = useState([])
  const [filteredSpecies, setFilteredSpecies] = useState([])
  const [breeds, setBreeds] = useState([])
  const [form, setForm] = useState(() => {
    try { 
      return JSON.parse(localStorage.getItem(KEY))?.classification || {} 
    } catch { 
      return {} 
    }
  })

  const save = (patch) => {
    const prev = JSON.parse(localStorage.getItem(KEY) || '{}')
    const next = { ...prev, classification: { ...(prev.classification || {}), ...patch } }
    localStorage.setItem(KEY, JSON.stringify(next))
    setForm(next.classification)
  }

  // Load categories and species on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Load categories
        let catRes
        try {
          catRes = await apiClient.get('/admin/pet-categories/active')
        } catch {
          catRes = await apiClient.get('/admin/pet-categories')
        }
        const cats = catRes.data?.data || catRes.data || []
        setCategories(cats)
        
        // Load all species
        let specRes
        try {
          specRes = await apiClient.get('/admin/species/active')
        } catch {
          specRes = await apiClient.get('/admin/species')
        }
        const specs = specRes.data?.data || specRes.data || []
        setAllSpecies(specs)
      } catch (error) {
        console.error('Failed to load data:', error)
        setError('Failed to load categories and species data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Filter species when category changes
  useEffect(() => {
    if (form.categoryId && allSpecies.length > 0) {
      // Find the selected category to get its name
      const selectedCategory = categories.find(cat => cat._id === form.categoryId)
      const categoryName = selectedCategory ? (selectedCategory.name || selectedCategory.displayName || '').toLowerCase() : ''
      
      // Filter species by category name
      const filtered = allSpecies.filter(species => {
        const speciesCategory = (species.category || '').toLowerCase()
        return speciesCategory === categoryName
      })
      setFilteredSpecies(filtered)
    } else {
      setFilteredSpecies([])
    }
  }, [form.categoryId, allSpecies, categories])

  // Handle category selection
  const onCategoryChange = (e) => {
    const categoryId = e.target.value
    // Find the selected category to get its name
    const selectedCategory = categories.find(cat => cat._id === categoryId)
    const categoryName = selectedCategory ? (selectedCategory.name || selectedCategory.displayName || categoryId) : categoryId
    
    // Clear species and breed when category changes
    save({ categoryId, categoryName, speciesId: '', speciesName: '', breedId: '', breedName: '' })
    setFilteredSpecies([])
    setBreeds([]) // Clear previous breeds
  }

  // Handle species selection
  const onSpeciesChange = async (e) => {
    const speciesId = e.target.value
    // Find the selected species to get its name
    const selectedSpecies = filteredSpecies.find(species => species._id === speciesId)
    const speciesName = selectedSpecies ? (selectedSpecies.name || selectedSpecies.displayName || speciesId) : speciesId
    
    // Clear breed when species changes
    save({ speciesId, speciesName, breedId: '' })
    setBreeds([]) // Clear previous breeds
    
    // Load breeds for this species
    if (speciesId) {
      try {
        setLoading(true)
        const breedRes = await apiClient.get(`/admin/breeds/species/${speciesId}`)
        const breedData = breedRes.data?.data || breedRes.data || []
        setBreeds(breedData)
      } catch (error) {
        console.error('Failed to load breeds:', error)
        setError('Failed to load breeds for the selected species.')
        setBreeds([])
      } finally {
        setLoading(false)
      }
    }
  }

  // Handle breed selection
  const onBreedChange = (e) => {
    const breedId = e.target.value
    // Find the selected breed to get its name
    const selectedBreed = breeds.find(breed => breed._id === breedId)
    const breedName = selectedBreed ? (selectedBreed.name || selectedBreed.displayName || breedId) : breedId
    
    // Save breedId and breedName
    save({ breedId, breedName })
  }

  const next = () => {
    // Validate required fields
    if (!form.categoryId) {
      setError('Category is required')
      return
    }
    if (!form.speciesId) {
      setError('Species is required')
      return
    }
    if (!form.breedId) {
      setError('Breed is required')
      return
    }
    navigate('/manager/petshop/wizard/pricing')
  }

  const back = () => navigate('/manager/petshop/wizard/basic')

  if (loading && (categories.length === 0 || allSpecies.length === 0)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box className="space-y-6">
      <Typography variant="h6" sx={{ mb: 2 }}>Pet Classification</Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Select the category, species, and breed for the pets you're adding to your inventory.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required error={!!(!form.categoryId && error)}>
            <InputLabel>Category *</InputLabel>
            <Select
              name="categoryId"
              value={form.categoryId || ''}
              onChange={onCategoryChange}
              label="Category *"
            >
              <MenuItem value=""><em>Select Category</em></MenuItem>
              {categories.map(cat => (
                <MenuItem key={cat._id} value={cat._id}>
                  {cat.name || cat.displayName}
                </MenuItem>
              ))}
            </Select>
            {!form.categoryId && error && (
              <FormHelperText error>Category is required</FormHelperText>
            )}
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required error={!!(error && form.categoryId && !form.speciesId)}>
            <InputLabel>Species *</InputLabel>
            <Select
              name="speciesId"
              value={form.speciesId || ''}
              onChange={onSpeciesChange}
              label="Species *"
              disabled={!form.categoryId}
            >
              <MenuItem value=""><em>Select Species</em></MenuItem>
              {filteredSpecies.map(spec => (
                <MenuItem key={spec._id} value={spec._id}>
                  {spec.name || spec.displayName}
                </MenuItem>
              ))}
            </Select>
            {error && form.categoryId && !form.speciesId && (
              <FormHelperText error>Species is required</FormHelperText>
            )}
          </FormControl>
          {!form.categoryId && (
            <Typography variant="caption" color="text.secondary">
              Please select a category first
            </Typography>
          )}
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required error={!!(error && form.speciesId && !form.breedId)}>
            <InputLabel>Breed *</InputLabel>
            <Select
              name="breedId"
              value={form.breedId || ''}
              onChange={onBreedChange}
              label="Breed *"
              disabled={!form.speciesId}
            >
              <MenuItem value=""><em>Select Breed</em></MenuItem>
              {breeds.map(breed => (
                <MenuItem key={breed._id} value={breed._id}>
                  {breed.name || breed.displayName || 'Unnamed Breed'}
                </MenuItem>
              ))}
            </Select>
            {error && form.speciesId && !form.breedId && (
              <FormHelperText error>Breed is required</FormHelperText>
            )}
          </FormControl>
          {!form.speciesId && (
            <Typography variant="caption" color="text.secondary">
              Please select a species first
            </Typography>
          )}
          {form.speciesId && breeds.length === 0 && (
            <Typography variant="caption" color="text.secondary">
              No breeds available for this species
            </Typography>
          )}
        </Grid>
      </Grid>
      
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
          disabled={!form.categoryId || !form.speciesId || !form.breedId}
        >
          Next: Pricing & Stock
        </Button>
      </Box>
    </Box>
  )
}