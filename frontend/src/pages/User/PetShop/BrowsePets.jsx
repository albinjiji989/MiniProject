import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Slider,
  CircularProgress,
  Alert,
  Pagination,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Pets as PetsIcon,
  Favorite as FavoriteIcon,
  ViewModule as GridIcon,
  ViewList as ListIcon,
  Star as StarIcon,
  AttachMoney as PriceIcon
} from '@mui/icons-material'
import { petShopAPI, resolveMediaUrl } from '../../../services/api'
import { speciesAPI, breedsAPI } from '../../../services/petSystemAPI'
import { handleApiError, showSuccessMessage, formatAge } from '../../../utils/notifications'

const BrowsePets = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pets, setPets] = useState([])
  const [species, setSpecies] = useState([])
  const [breedsBySpecies, setBreedsBySpecies] = useState({})
  const [viewMode, setViewMode] = useState('grid')
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 12
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    speciesId: '',
    breedId: '',
    minPrice: '',
    maxPrice: '',
    ageRange: [0, 20],
    gender: '',
    availability: 'available'
  })
  
  // Filter panel visibility
  const [showFilters, setShowFilters] = useState(false)

  // Load species data
  useEffect(() => {
    const loadSpecies = async () => {
      try {
        const res = await speciesAPI.list()
        setSpecies(res?.data?.data || res?.data || [])
      } catch (e) {
        console.error('Failed to load species:', e)
      }
    }
    
    loadSpecies()
  }, [])

  // Load breeds when species changes
  useEffect(() => {
    const loadBreeds = async () => {
      if (filters.speciesId && !breedsBySpecies[filters.speciesId]) {
        try {
          const res = await breedsAPI.getBySpecies(filters.speciesId)
          setBreedsBySpecies(prev => ({
            ...prev,
            [filters.speciesId]: res?.data?.data || res?.data || []
          }))
        } catch (e) {
          console.error('Failed to load breeds:', e)
          setBreedsBySpecies(prev => ({
            ...prev,
            [filters.speciesId]: []
          }))
        }
      }
    }
    
    loadBreeds()
  }, [filters.speciesId])

  // Load pets with filters
  useEffect(() => {
    const loadPets = async () => {
      try {
        setLoading(true)
        const params = {
          page,
          limit: itemsPerPage
        }
        
        // Add filters to params
        if (filters.search) params.search = filters.search
        if (filters.speciesId) params.speciesId = filters.speciesId
        if (filters.breedId) params.breedId = filters.breedId
        if (filters.minPrice) params.minPrice = filters.minPrice
        if (filters.maxPrice) params.maxPrice = filters.maxPrice
        if (filters.ageRange[0] > 0) params.minAge = filters.ageRange[0]
        if (filters.ageRange[1] < 20) params.maxAge = filters.ageRange[1]
        if (filters.gender) params.gender = filters.gender
        if (filters.availability) params.status = filters.availability
        
        const res = await petShopAPI.listPublicListings(params)
        setPets(res.data.data.items || [])
        setTotalPages(res.data.data.totalPages || 1)
        setTotalCount(res.data.data.totalCount || 0)
      } catch (e) {
        const errorMessage = handleApiError(e, 'Failed to load pets')
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }
    
    loadPets()
  }, [page, filters])

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
    // Reset page to 1 when filters change
    setPage(1)
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      speciesId: '',
      breedId: '',
      minPrice: '',
      maxPrice: '',
      ageRange: [0, 20],
      gender: '',
      availability: 'available'
    })
    setPage(1)
  }

  const handleAddToWishlist = async (petId, event) => {
    event.stopPropagation()
    try {
      await petShopAPI.addToWishlist(petId)
      showSuccessMessage('Pet added to wishlist!')
    } catch (e) {
      handleApiError(e, 'Failed to add to wishlist')
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Browse Pets
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Find your perfect companion from our selection of pets
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          fullWidth
          placeholder="Search by pet name, breed, or species..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
        
        <Button
          variant={showFilters ? "contained" : "outlined"}
          startIcon={<FilterIcon />}
          onClick={() => setShowFilters(!showFilters)}
        >
          Filters
        </Button>
        
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newValue) => newValue && setViewMode(newValue)}
          size="small"
        >
          <ToggleButton value="grid">
            <GridIcon />
          </ToggleButton>
          <ToggleButton value="list">
            <ListIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Filter Panel */}
      {showFilters && (
        <Card sx={{ mb: 3, p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Species</InputLabel>
                <Select
                  value={filters.speciesId}
                  label="Species"
                  onChange={(e) => {
                    const speciesId = e.target.value
                    handleFilterChange('speciesId', speciesId)
                    // Reset breed when species changes
                    handleFilterChange('breedId', '')
                  }}
                >
                  <MenuItem value=""><em>All Species</em></MenuItem>
                  {species.map((s) => (
                    <MenuItem key={s._id} value={s._id}>
                      {s.displayName || s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small" disabled={!filters.speciesId}>
                <InputLabel>Breed</InputLabel>
                <Select
                  value={filters.breedId}
                  label="Breed"
                  onChange={(e) => handleFilterChange('breedId', e.target.value)}
                >
                  <MenuItem value=""><em>All Breeds</em></MenuItem>
                  {(breedsBySpecies[filters.speciesId] || []).map((b) => (
                    <MenuItem key={b._id} value={b._id}>
                      {b.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Min Price"
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Max Price"
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Age Range: {filters.ageRange[0]} - {filters.ageRange[1]} years</Typography>
              <Slider
                value={filters.ageRange}
                onChange={(e, newValue) => handleFilterChange('ageRange', newValue)}
                valueLabelDisplay="auto"
                min={0}
                max={20}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Gender</InputLabel>
                <Select
                  value={filters.gender}
                  label="Gender"
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                >
                  <MenuItem value=""><em>Any</em></MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Availability</InputLabel>
                <Select
                  value={filters.availability}
                  label="Availability"
                  onChange={(e) => handleFilterChange('availability', e.target.value)}
                >
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="reserved">Reserved</MenuItem>
                  <MenuItem value="sold">Sold</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={handleResetFilters}>Reset Filters</Button>
                <Button 
                  variant="contained" 
                  onClick={() => setShowFilters(false)}
                >
                  Apply Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* Results Info */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {pets.length} of {totalCount} pets
        </Typography>
      </Box>

      {/* Pets Grid/List */}
      {viewMode === 'grid' ? (
        <Grid container spacing={3}>
          {pets.map((pet) => (
            <Grid item xs={12} sm={6} md={4} key={pet._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => navigate(`/User/petshop/pet/${pet._id}`)}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={resolveMediaUrl(pet.images?.[0]?.url) || '/placeholder-pet.svg'}
                  alt={pet.name || 'Pet'}
                  sx={{ objectFit: 'cover', cursor: 'pointer' }}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="div">
                      {pet.name || 'Unnamed Pet'}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleAddToWishlist(pet._id, e)}
                      sx={{ ml: 1 }}
                    >
                      <FavoriteIcon />
                    </IconButton>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {pet.speciesId?.displayName || pet.speciesId?.name || 'Species'} • {pet.breedId?.name || 'Breed'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <StarIcon sx={{ color: 'gold', fontSize: 16, mr: 0.5 }} />
                    <Typography variant="body2">4.5 (12 reviews)</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Chip 
                      label={formatAge(pet.age, pet.ageUnit)} 
                      size="small" 
                      variant="outlined"
                    />
                    <Chip 
                      label={pet.gender} 
                      size="small" 
                      color={pet.gender === 'male' ? 'primary' : 'secondary'} 
                      variant="outlined"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                      ₹{pet.price ? pet.price.toLocaleString() : 'N/A'}
                    </Typography>
                    <Chip 
                      label={pet.status} 
                      size="small" 
                      color={pet.status === 'available' ? 'success' : pet.status === 'reserved' ? 'warning' : 'default'} 
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        // List view
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {pets.map((pet) => (
            <Card 
              key={pet._id} 
              sx={{ 
                display: 'flex',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 4
                }
              }}
              onClick={() => navigate(`/User/petshop/pet/${pet._id}`)}
            >
              <CardMedia
                component="img"
                sx={{ width: 200, height: 150, objectFit: 'cover' }}
                image={resolveMediaUrl(pet.images?.[0]?.url) || '/placeholder-pet.svg'}
                alt={pet.name || 'Pet'}
              />
              <CardContent sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" component="div">
                    {pet.name || 'Unnamed Pet'}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={(e) => handleAddToWishlist(pet._id, e)}
                  >
                    <FavoriteIcon />
                  </IconButton>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {pet.speciesId?.displayName || pet.speciesId?.name || 'Species'} • {pet.breedId?.name || 'Breed'}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <StarIcon sx={{ color: 'gold', fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body2">4.5 (12 reviews)</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip 
                    label={formatAge(pet.age, pet.ageUnit)} 
                    size="small" 
                    variant="outlined"
                  />
                  <Chip 
                    label={pet.gender} 
                    size="small" 
                    color={pet.gender === 'male' ? 'primary' : 'secondary'} 
                    variant="outlined"
                  />
                  <Chip 
                    label={pet.status} 
                    size="small" 
                    color={pet.status === 'available' ? 'success' : pet.status === 'reserved' ? 'warning' : 'default'} 
                    variant="outlined"
                  />
                </Box>
                
                <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                  ₹{pet.price ? pet.price.toLocaleString() : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Empty state */}
      {pets.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <PetsIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No pets found matching your criteria
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Try adjusting your filters or search terms
          </Typography>
          <Button variant="outlined" onClick={handleResetFilters}>
            Reset Filters
          </Button>
        </Box>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}
    </Container>
  )
}

export default BrowsePets