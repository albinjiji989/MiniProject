import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
  Tooltip,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Paper
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Pets as PetsIcon,
  Favorite as FavoriteIcon,
  ViewModule as GridIcon,
  ViewList as ListIcon,
  Star as StarIcon,
  AttachMoney as PriceIcon,
  Sort as SortIcon,
  ExpandLess,
  ExpandMore,
  Close as CloseIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material'
import { petShopAPI, resolveMediaUrl } from '../../../services/api'
import { handleApiError, showSuccessMessage } from '../../../utils/notifications'

const EnhancedBrowsePets = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pets, setPets] = useState([])
  const [speciesOptions, setSpeciesOptions] = useState([])
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
    availability: 'available_for_sale'
  })
  
  // Filter panel visibility
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [filterSections, setFilterSections] = useState({
    species: true,
    price: true,
    age: true,
    gender: true,
    availability: true
  })

  // Parse query parameters from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const search = searchParams.get('search') || ''
    const species = searchParams.get('species') || ''
    
    setFilters(prev => ({
      ...prev,
      search,
      speciesId: species
    }))
  }, [location.search])

  // Derive species and breed options from loaded pets (public-safe)
  useEffect(() => {
    const speciesMap = new Map()
    const breedsMap = {}
    for (const pet of pets) {
      const sId = pet?.speciesId?._id || pet?.speciesId
      const sName = pet?.speciesId?.displayName || pet?.speciesId?.name
      if (sId) {
        if (!speciesMap.has(sId)) speciesMap.set(sId, { _id: sId, name: sName || 'Species' })
        if (!breedsMap[sId]) breedsMap[sId] = new Map()
        const bId = pet?.breedId?._id || pet?.breedId
        const bName = pet?.breedId?.name
        if (bId) breedsMap[sId].set(bId, { _id: bId, name: bName || 'Breed' })
      }
    }
    setSpeciesOptions(Array.from(speciesMap.values()))
    const breedsObj = {}
    Object.entries(breedsMap).forEach(([sid, map]) => {
      breedsObj[sid] = Array.from(map.values())
    })
    setBreedsBySpecies(breedsObj)
  }, [pets])

  // Load pets with filters
  useEffect(() => {
    const loadPets = async () => {
      try {
        setLoading(true)
        const params = {
          page,
          limit: itemsPerPage,
          sortBy: 'createdAt',
          sortOrder: 'desc'
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
      availability: 'available_for_sale'
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

  const toggleFilterSection = (section) => {
    setFilterSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const formatAge = (age, ageUnit) => {
    if (!age) return 'Age not specified'
    if (ageUnit === 'months' && age >= 12) {
      const years = Math.floor(age / 12)
      const months = age % 12
      return `${years} yr${years > 1 ? 's' : ''}${months > 0 ? ` ${months} mo` : ''}`
    }
    return `${age} ${ageUnit || 'yr'}${age > 1 && ageUnit ? (ageUnit.endsWith('s') ? '' : 's') : ''}`
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
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Find Your Perfect Pet
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Browse through our collection of pets available for adoption
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
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={() => setMobileFiltersOpen(true)}
          sx={{ display: { xs: 'flex', md: 'none' } }}
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

      <Grid container spacing={3}>
        {/* Desktop Filters */}
        <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
          <Paper sx={{ p: 2, position: 'sticky', top: 20 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Filters</Typography>
              <Button size="small" onClick={handleResetFilters}>
                Reset
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {/* Species Filter */}
            <ListItem 
              button 
              onClick={() => toggleFilterSection('species')}
              sx={{ pl: 0 }}
            >
              <ListItemText primary="Species" />
              {filterSections.species ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={filterSections.species} timeout="auto" unmountOnExit>
              <Box sx={{ pl: 2, mb: 2 }}>
                <FormControl fullWidth size="small">
                  <Select
                    value={filters.speciesId}
                    onChange={(e) => {
                      const speciesId = e.target.value
                      handleFilterChange('speciesId', speciesId)
                      // Reset breed when species changes
                      handleFilterChange('breedId', '')
                    }}
                    displayEmpty
                  >
                    <MenuItem value=""><em>All Species</em></MenuItem>
                    {speciesOptions.map((s) => (
                      <MenuItem key={s._id} value={s._id}>
                        {s.displayName || s.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {filters.speciesId && (
                  <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                    <Select
                      value={filters.breedId}
                      onChange={(e) => handleFilterChange('breedId', e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value=""><em>All Breeds</em></MenuItem>
                      {(breedsBySpecies[filters.speciesId] || []).map((b) => (
                        <MenuItem key={b._id} value={b._id}>
                          {b.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
            </Collapse>
            
            <Divider sx={{ mb: 2 }} />
            
            {/* Price Filter */}
            <ListItem 
              button 
              onClick={() => toggleFilterSection('price')}
              sx={{ pl: 0 }}
            >
              <ListItemText primary="Price Range" />
              {filterSections.price ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={filterSections.price} timeout="auto" unmountOnExit>
              <Box sx={{ pl: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    size="small"
                    label="Min"
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    size="small"
                    label="Max"
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    sx={{ flex: 1 }}
                  />
                </Box>
              </Box>
            </Collapse>
            
            <Divider sx={{ mb: 2 }} />
            
            {/* Age Filter */}
            <ListItem 
              button 
              onClick={() => toggleFilterSection('age')}
              sx={{ pl: 0 }}
            >
              <ListItemText primary="Age Range" />
              {filterSections.age ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={filterSections.age} timeout="auto" unmountOnExit>
              <Box sx={{ pl: 2, mb: 2 }}>
                <Typography gutterBottom>
                  {filters.ageRange[0]} - {filters.ageRange[1]} years
                </Typography>
                <Slider
                  value={filters.ageRange}
                  onChange={(e, newValue) => handleFilterChange('ageRange', newValue)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={20}
                  step={0.5}
                />
              </Box>
            </Collapse>
            
            <Divider sx={{ mb: 2 }} />
            
            {/* Gender Filter */}
            <ListItem 
              button 
              onClick={() => toggleFilterSection('gender')}
              sx={{ pl: 0 }}
            >
              <ListItemText primary="Gender" />
              {filterSections.gender ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={filterSections.gender} timeout="auto" unmountOnExit>
              <Box sx={{ pl: 2, mb: 2 }}>
                <FormControl fullWidth size="small">
                  <Select
                    value={filters.gender}
                    onChange={(e) => handleFilterChange('gender', e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value=""><em>Any</em></MenuItem>
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Collapse>
            
            <Divider sx={{ mb: 2 }} />
            
            {/* Availability Filter */}
            <ListItem 
              button 
              onClick={() => toggleFilterSection('availability')}
              sx={{ pl: 0 }}
            >
              <ListItemText primary="Availability" />
              {filterSections.availability ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={filterSections.availability} timeout="auto" unmountOnExit>
              <Box sx={{ pl: 2, mb: 2 }}>
                <FormControl fullWidth size="small">
                  <Select
                    value={filters.availability}
                    onChange={(e) => handleFilterChange('availability', e.target.value)}
                  >
                    <MenuItem value="available_for_sale">Available</MenuItem>
                    <MenuItem value="reserved">Reserved</MenuItem>
                    <MenuItem value="sold">Sold</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Collapse>
          </Paper>
        </Grid>
        
        {/* Main Content */}
        <Grid item xs={12} md={9}>
          {/* Results Info */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {pets.length} of {totalCount} pets
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SortIcon sx={{ fontSize: 20 }} />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value="newest"
                  onChange={(e) => {
                    // Handle sorting
                  }}
                >
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="price-low">Price: Low to High</MenuItem>
                  <MenuItem value="price-high">Price: High to Low</MenuItem>
                  <MenuItem value="name">Name A-Z</MenuItem>
                </Select>
              </FormControl>
            </Box>
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
                        boxShadow: 6
                      }
                    }}
                    onClick={() => navigate(`/User/petshop/pet/${pet._id}`)}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={(() => {
                        const url = (pet.images?.find?.(img => img?.isPrimary)?.url)
                          || (pet.images?.[0]?.url)
                          || (pet.imageIds?.[0]?.url)
                          || pet.imageUrl
                        return url ? resolveMediaUrl(url) : '/placeholder-pet.svg'
                      })()}
                      alt={pet.name || 'Pet'}
                      sx={{ objectFit: 'cover', cursor: 'pointer' }}
                      onError={(e) => { e.currentTarget.src = '/placeholder-pet.svg' }}
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
                        <Typography variant="body2">4.8 (24 reviews)</Typography>
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
                          label={pet.status.replace('_', ' ')} 
                          size="small" 
                          color={pet.status === 'available_for_sale' ? 'success' : pet.status === 'reserved' ? 'warning' : 'default'} 
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
                      boxShadow: 6
                    }
                  }}
                  onClick={() => navigate(`/User/petshop/pet/${pet._id}`)}
                >
                  <CardMedia
                    component="img"
                    sx={{ width: 200, height: 150, objectFit: 'cover' }}
                    image={(() => {
                      const url = (pet.images?.find?.(img => img?.isPrimary)?.url)
                        || (pet.images?.[0]?.url)
                        || (pet.imageIds?.[0]?.url)
                        || pet.imageUrl
                      return url ? resolveMediaUrl(url) : '/placeholder-pet.svg'
                    })()}
                    alt={pet.name || 'Pet'}
                    onError={(e) => { e.currentTarget.src = '/placeholder-pet.svg' }}
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
                      <Typography variant="body2">4.8 (24 reviews)</Typography>
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
                        label={pet.status.replace('_', ' ')} 
                        size="small" 
                        color={pet.status === 'available_for_sale' ? 'success' : pet.status === 'reserved' ? 'warning' : 'default'} 
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
        </Grid>
      </Grid>
      
      {/* Mobile Filters Drawer */}
      <Drawer
        anchor="right"
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        <Box sx={{ width: 300, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Filters</Typography>
            <IconButton onClick={() => setMobileFiltersOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          {/* Mobile Filters Content */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Species</Typography>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <Select
                value={filters.speciesId}
                onChange={(e) => {
                  const speciesId = e.target.value
                  handleFilterChange('speciesId', speciesId)
                  // Reset breed when species changes
                  handleFilterChange('breedId', '')
                }}
                displayEmpty
              >
                <MenuItem value=""><em>All Species</em></MenuItem>
                {speciesOptions.map((s) => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.displayName || s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {filters.speciesId && (
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <Select
                  value={filters.breedId}
                  onChange={(e) => handleFilterChange('breedId', e.target.value)}
                  displayEmpty
                >
                  <MenuItem value=""><em>All Breeds</em></MenuItem>
                  {(breedsBySpecies[filters.speciesId] || []).map((b) => (
                    <MenuItem key={b._id} value={b._id}>
                      {b.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Price Range</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                size="small"
                label="Min Price"
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="Max Price"
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Age Range: {filters.ageRange[0]} - {filters.ageRange[1]} years
            </Typography>
            <Slider
              value={filters.ageRange}
              onChange={(e, newValue) => handleFilterChange('ageRange', newValue)}
              valueLabelDisplay="auto"
              min={0}
              max={20}
              step={0.5}
            />
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Gender</Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                displayEmpty
              >
                <MenuItem value=""><em>Any</em></MenuItem>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Availability</Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filters.availability}
                onChange={(e) => handleFilterChange('availability', e.target.value)}
              >
                <MenuItem value="available_for_sale">Available</MenuItem>
                <MenuItem value="reserved">Reserved</MenuItem>
                <MenuItem value="sold">Sold</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              fullWidth 
              onClick={handleResetFilters}
            >
              Reset
            </Button>
            <Button 
              variant="contained" 
              fullWidth
              onClick={() => setMobileFiltersOpen(false)}
            >
              Apply
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Container>
  )
}

export default EnhancedBrowsePets