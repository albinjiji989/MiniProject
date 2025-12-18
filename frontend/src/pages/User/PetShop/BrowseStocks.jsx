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
  AttachMoney as PriceIcon,
  Male as MaleIcon,
  Female as FemaleIcon
} from '@mui/icons-material'
import { petShopStockAPI } from '../../../services/api'
import { handleApiError } from '../../../utils/notifications'

const BrowseStocks = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stocks, setStocks] = useState([])
  const [viewMode, setViewMode] = useState('grid')
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalStocks, setTotalStocks] = useState(0)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpecies, setSelectedSpecies] = useState([])
  const [selectedBreeds, setSelectedBreeds] = useState([])
  const [genderFilter, setGenderFilter] = useState('')
  const [priceRange, setPriceRange] = useState([0, 50000])
  
  // Show filters
  const [showFilters, setShowFilters] = useState(false)

  // Load stocks
  const loadStocks = async () => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 12,
        search: searchQuery || undefined,
        speciesId: selectedSpecies.length > 0 ? selectedSpecies.join(',') : undefined,
        breedId: selectedBreeds.length > 0 ? selectedBreeds.join(',') : undefined,
        gender: genderFilter || undefined,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 50000 ? priceRange[1] : undefined
      }
      
      // Remove undefined params
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key])
      
      const response = await petShopStockAPI.listPublicStocks(params)
      setStocks(response.data.data.stocks || [])
      setTotalPages(response.data.data.pagination?.pages || 1)
      setTotalStocks(response.data.data.pagination?.total || 0)
    } catch (err) {
      handleApiError(err, 'Failed to load pet stocks')
      setError('Failed to load pet stocks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStocks()
  }, [page, searchQuery, selectedSpecies, selectedBreeds, genderFilter, priceRange])

  const handlePurchase = (stockId) => {
    navigate(`/User/petshop/stock/${stockId}`)
  }

  const handleWishlist = (stockId) => {
    // TODO: Implement wishlist functionality
    console.log('Add to wishlist:', stockId)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const handlePageChange = (event, value) => {
    setPage(value)
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
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Pet Stocks
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Browse available pet stocks from our pet shops
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            fullWidth
            placeholder="Search by breed, species, or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 200 }}
          />
          
          <Button
            variant={showFilters ? "contained" : "outlined"}
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
        </Box>

        {/* Filters Panel */}
        {showFilters && (
          <Card sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                  >
                    <MenuItem value="">All Genders</MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Price Range</Typography>
                <Slider
                  value={priceRange}
                  onChange={(e, newValue) => setPriceRange(newValue)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={100000}
                  step={1000}
                  valueLabelFormat={formatPrice}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">{formatPrice(priceRange[0])}</Typography>
                  <Typography variant="body2">{formatPrice(priceRange[1])}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Card>
        )}

        {/* View Mode Toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body1">
            Showing {stocks.length} of {totalStocks} stocks
          </Typography>
          
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => setViewMode(newMode)}
            aria-label="view mode"
          >
            <ToggleButton value="grid" aria-label="grid view">
              <GridIcon />
            </ToggleButton>
            <ToggleButton value="list" aria-label="list view">
              <ListIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Stocks Grid/List */}
      {viewMode === 'grid' ? (
        <Grid container spacing={3}>
          {stocks.map((stock) => (
            <Grid item xs={12} sm={6} md={4} key={stock._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
              >
                {stock.images && stock.images.length > 0 ? (
                  <CardMedia
                    component="img"
                    height="200"
                    image={stock.images[0]?.url || ''}
                    alt={stock.name}
                  />
                ) : (
                  <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.200' }}>
                    <PetsIcon sx={{ fontSize: 60, color: 'grey.500' }} />
                  </Box>
                )}
                
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="div" noWrap>
                      {stock.name}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => handleWishlist(stock._id)}
                    >
                      <FavoriteIcon />
                    </IconButton>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip 
                      label={`${stock.species?.displayName || stock.species?.name || 'Unknown Species'}`} 
                      size="small" 
                      variant="outlined" 
                    />
                    <Chip 
                      label={`${stock.breed?.name || 'Unknown Breed'}`} 
                      size="small" 
                      variant="outlined" 
                    />
                    <Chip 
                      label={`${stock.age} ${stock.ageUnit}`} 
                      size="small" 
                      variant="outlined" 
                    />
                    {stock.gender && (
                      <Chip 
                        label={stock.gender} 
                        size="small" 
                        icon={stock.gender === 'Male' ? <MaleIcon /> : <FemaleIcon />}
                        color={stock.gender === 'Male' ? 'primary' : 'secondary'}
                      />
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" color="primary">
                      {formatPrice(stock.price)}
                    </Typography>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" color="text.secondary">
                        Available
                      </Typography>
                      <Typography variant="body2">
                        <strong>{stock.availableCount}</strong> pets
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant="contained" 
                      fullWidth
                      onClick={() => handlePurchase(stock._id)}
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        // List view
        <Box>
          {stocks.map((stock) => (
            <Card key={stock._id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {stock.images && stock.images.length > 0 ? (
                    <CardMedia
                      component="img"
                      sx={{ width: 150, height: 150, borderRadius: 1 }}
                      image={stock.images[0]?.url || ''}
                      alt={stock.name}
                    />
                  ) : (
                    <Box sx={{ width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.200', borderRadius: 1 }}>
                      <PetsIcon sx={{ fontSize: 40, color: 'grey.500' }} />
                    </Box>
                  )}
                  
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="div">
                        {stock.name}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => handleWishlist(stock._id)}
                      >
                        <FavoriteIcon />
                      </IconButton>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      <Chip 
                        label={`${stock.species?.displayName || stock.species?.name || 'Unknown Species'}`} 
                        size="small" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={`${stock.breed?.name || 'Unknown Breed'}`} 
                        size="small" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={`${stock.age} ${stock.ageUnit}`} 
                        size="small" 
                        variant="outlined" 
                      />
                      {stock.gender && (
                        <Chip 
                          label={stock.gender} 
                          size="small" 
                          icon={stock.gender === 'Male' ? <MaleIcon /> : <FemaleIcon />}
                          color={stock.gender === 'Male' ? 'primary' : 'secondary'}
                        />
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" color="primary">
                        {formatPrice(stock.price)}
                      </Typography>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" color="text.secondary">
                          Available
                        </Typography>
                        <Typography variant="body2">
                          <strong>{stock.availableCount}</strong> pets
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button 
                      variant="contained" 
                      onClick={() => handlePurchase(stock._id)}
                    >
                      View Details
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Empty state */}
      {stocks.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <PetsIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No pet stocks found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Try adjusting your search or filter criteria
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => {
              setSearchQuery('')
              setSelectedSpecies([])
              setSelectedBreeds([])
              setGenderFilter('')
              setPriceRange([0, 50000])
            }}
          >
            Clear Filters
          </Button>
        </Box>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}
    </Container>
  )
}

export default BrowseStocks