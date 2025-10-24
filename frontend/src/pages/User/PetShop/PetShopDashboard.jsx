import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  CardMedia,
  CardActions,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  Snackbar,
  Badge,
  Tooltip,
  IconButton,
  Paper,
  InputBase,
  Divider,
  Container,
  useTheme,
  alpha,
  Skeleton,
  Rating,
  Pagination,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Checkbox,
  ListItemText,
  OutlinedInput,
  InputAdornment,
  useMediaQuery
} from '@mui/material'
import {
  Store as PetShopIcon,
  Pets as PetsIcon,
  Favorite as FavoriteIcon,
  ShoppingCart as CartIcon,
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  BookOnline as ReserveIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  QrCode as QrCodeIcon,
  TrendingUp as TrendingIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  AttachMoney as PriceIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  CalendarToday as AgeIcon,
  Palette as ColorIcon,
  Scale as WeightIcon,
  ArrowDownward as ArrowDownIcon,
  ArrowUpward as ArrowUpIcon,
  Clear as ClearIcon,
  LocalOffer as TagIcon
} from '@mui/icons-material'
import ModuleDashboardLayout from '../../../components/Module/ModuleDashboardLayout'
import { useAuth } from '../../../contexts/AuthContext'
import { apiClient, resolveMediaUrl } from '../../../services/api'

const PetShopDashboard = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tabValue, setTabValue] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  
  // State for data
  const [stats, setStats] = useState({
    totalPetShops: 0,
    availableForSale: 0,
    myWishlistItems: 0,
    myReservations: 0
  })
  const [featuredPets, setFeaturedPets] = useState([])
  const [allPets, setAllPets] = useState([])
  const [petShops, setPetShops] = useState([])
  const [wishlistItems, setWishlistItems] = useState([])
  const [reservations, setReservations] = useState([])
  
  // Filtering and sorting state
  const [filters, setFilters] = useState({
    species: [],
    breed: [],
    gender: [],
    minPrice: 0,
    maxPrice: 50000,
    minAge: 0,
    maxAge: 20
  })
  const [sortOption, setSortOption] = useState('featured')
  const [currentPage, setCurrentPage] = useState(1)
  const petsPerPage = 12
  
  // Reservation dialog state
  const [reservationDialog, setReservationDialog] = useState(false)
  const [selectedPet, setSelectedPet] = useState(null)
  const [reservationStep, setReservationStep] = useState(0)
  const [reservationData, setReservationData] = useState({
    reservationType: 'online_booking',
    contactInfo: {
      phone: '',
      email: '',
      preferredContactMethod: 'both'
    },
    visitDetails: {
      preferredDate: '',
      preferredTime: 'morning',
      visitPurpose: 'meet_pet'
    },
    notes: ''
  })
  
  // Notification state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [statsRes, petsRes, shopsRes, wishlistRes, reservationsRes] = await Promise.all([
        apiClient.get('/petshop/user/stats'),
        apiClient.get('/petshop/user/public/listings?limit=50'),
        apiClient.get('/petshop/user/public/shops?limit=8'),
        apiClient.get('/petshop/user/public/wishlist'),
        apiClient.get('/petshop/user/public/reservations')
      ])
      
      setStats(statsRes.data.data)
      setFeaturedPets(petsRes.data.data.items?.slice(0, 12) || [])
      setAllPets(petsRes.data.data.items || [])
      setPetShops(shopsRes.data.data.petShops || [])
      setWishlistItems(wishlistRes.data.data.wishlist || [])
      setReservations(reservationsRes.data.data.reservations || [])
      
    } catch (err) {
      console.error('Dashboard data fetch error:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    if (newValue === 1) {
      setCurrentPage(1) // Reset to first page when switching to browse tab
    }
  }

  // Unified layout config
  const quickActions = [
    { label: 'Browse Pets', onClick: () => setTabValue(1), color: 'bg-emerald-600' },
    { label: 'My Wishlist', onClick: () => setTabValue(3), color: 'bg-blue-600' },
    { label: 'My Reservations', onClick: () => setTabValue(3), color: 'bg-indigo-600' },
  ]
  const statCards = [
    { label: 'Pet Shops', value: stats.totalPetShops || 0, icon: '🏪' },
    { label: 'Available Pets', value: stats.availableForSale || 0, icon: '🐾' },
    { label: 'My Wishlist', value: stats.myWishlistItems || 0, icon: '❤️' },
  ]
  const tabDefs = [
    { key: 'featured', label: 'Featured Pets' },
    { key: 'browse', label: 'Browse All Pets' },
    { key: 'shops', label: 'Pet Shops' },
    { key: 'activity', label: 'My Activity' },
  ]
  const activeTabKey = tabDefs[tabValue]?.key || 'featured'
  const onUnifiedTabChange = (key) => {
    const idx = tabDefs.findIndex(t => t.key === key)
    setTabValue(idx >= 0 ? idx : 0)
  }

  const handleReservePet = (pet) => {
    setSelectedPet(pet)
    setReservationData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        phone: currentUser?.phone || '',
        email: currentUser?.email || ''
      }
    }))
    setReservationStep(0)
    setReservationDialog(true)
  }

  const handleReservationSubmit = async () => {
    try {
      const payload = {
        itemId: selectedPet._id,
        ...reservationData
      }
      
      const response = await apiClient.post('/petshop/user/public/reservations', payload)
      
      setSnackbar({
        open: true,
        message: `Reservation created successfully! Code: ${response.data.data.reservation.reservationCode}`,
        severity: 'success'
      })
      
      setReservationDialog(false)
      fetchDashboardData() // Refresh data
      
    } catch (err) {
      console.error('Reservation error:', err)
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to create reservation',
        severity: 'error'
      })
    }
  }

  const handleAddToWishlist = async (petId) => {
    try {
      await apiClient.post('/petshop/user/public/wishlist', { itemId: petId })
      setSnackbar({
        open: true,
        message: 'Pet added to wishlist!',
        severity: 'success'
      })
      fetchDashboardData() // Refresh data
    } catch (err) {
      console.error('Wishlist error:', err)
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to add to wishlist',
        severity: 'error'
      })
    }
  }

  const getReservationStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
      'manager_review': 'info',
      'approved': 'success',
      'rejected': 'error',
      'going_to_buy': 'info',
      'payment_pending': 'warning',
      'paid': 'info',
      'ready_pickup': 'primary',
      'delivered': 'success',
      'at_owner': 'success',
      'cancelled': 'error'
    }
    return colors[status] || 'default'
  }

  const reservationSteps = [
    'Reservation Type',
    'Contact Information',
    'Visit Details',
    'Review & Submit'
  ]

  // Format age for display
  const formatAge = (age, ageUnit) => {
    if (!age) return 'Age not specified'
    if (ageUnit === 'months' && age >= 12) {
      const years = Math.floor(age / 12)
      const months = age % 12
      return `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` ${months} month${months > 1 ? 's' : ''}` : ''}`
    }
    return `${age} ${ageUnit || 'year'}${age > 1 && ageUnit ? (ageUnit.endsWith('s') ? '' : 's') : ''}`
  }

  // Filter and sort pets
  const getFilteredAndSortedPets = () => {
    let filtered = allPets.filter(pet => {
      // Search query filter
      if (searchQuery && !pet.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !pet.breedId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !pet.speciesId?.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      // Price filter
      if (pet.price < filters.minPrice || pet.price > filters.maxPrice) {
        return false
      }
      
      // Age filter
      if (pet.age < filters.minAge || pet.age > filters.maxAge) {
        return false
      }
      
      // Gender filter
      if (filters.gender.length > 0 && !filters.gender.includes(pet.gender)) {
        return false
      }
      
      return true
    })
    
    // Sorting
    switch (sortOption) {
      case 'price_low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0))
        break
      case 'price_high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0))
        break
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        break
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      default:
        // Featured (default) - already sorted by backend
        break
    }
    
    return filtered
  }

  // Get paginated pets
  const getPaginatedPets = () => {
    const filteredPets = getFilteredAndSortedPets()
    const startIndex = (currentPage - 1) * petsPerPage
    return filteredPets.slice(startIndex, startIndex + petsPerPage)
  }

  // Reset filters
  const resetFilters = () => {
    setFilters({
      species: [],
      breed: [],
      gender: [],
      minPrice: 0,
      maxPrice: 50000,
      minAge: 0,
      maxAge: 20
    })
    setSearchQuery('')
    setSortOption('featured')
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: 2 }}>
      <Container maxWidth="xl" sx={{ px: 3 }}>
        <ModuleDashboardLayout
          title="Pet Shop"
          description="Find your perfect companion and manage your pet journey"
          actions={quickActions}
          stats={statCards}
          tabs={tabDefs}
          activeTab={activeTabKey}
          onTabChange={onUnifiedTabChange}
        >

      {tabValue === 0 && (
        <Box>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            Featured Pets
          </Typography>
          {featuredPets.length === 0 ? (
            <Card>
              <CardContent>
                <Typography variant="body1" color="textSecondary" align="center">
                  No pets available at the moment. Check back later!
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {featuredPets.map((pet) => (
                <Grid item xs={12} sm={6} md={4} key={pet._id}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={resolveMediaUrl(pet.images?.[0]?.url) || '/placeholder-pet.svg'}
                      alt={pet.name || 'Pet'}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" component="div">
                          {pet.name || 'Unnamed Pet'}
                        </Typography>
                        {pet.petCode && (
                          <Chip 
                            label={pet.petCode} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        {pet.storeName || 'Pet Shop'} • {formatAge(pet.age, pet.ageUnit)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <StarIcon sx={{ color: 'gold', fontSize: 16, mr: 0.5 }} />
                        <Typography variant="body2">{pet.rating || 'No rating'}</Typography>
                      </Box>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                        ₹{pet.price ? pet.price.toLocaleString() : 'Price not set'}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                      <Button 
                        size="small" 
                        startIcon={<FavoriteIcon />}
                        onClick={() => handleAddToWishlist(pet._id)}
                      >
                        Wishlist
                      </Button>
                      <Button 
                        size="small" 
                        variant="contained" 
                        startIcon={<ReserveIcon />}
                        onClick={() => navigate(`/User/petshop/pet/${pet._id}`)}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          {/* Search and Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center' }}>
                <InputBase
                  sx={{ ml: 1, flex: 1 }}
                  placeholder="Search pets by name, breed, or species..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  }
                />
                <IconButton onClick={() => setSearchQuery('')}>
                  <ClearIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<FilterIcon />}
                  onClick={() => document.getElementById('filters-dialog').style.display = 'block'}
                >
                  Filters
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<SortIcon />}
                  onClick={() => document.getElementById('sort-dialog').style.display = 'block'}
                >
                  Sort
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<ClearIcon />}
                  onClick={resetFilters}
                >
                  Reset
                </Button>
              </Box>
            </Box>
          </Paper>
          
          {/* Results Info */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              {getFilteredAndSortedPets().length} Pets Found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Page {currentPage} of {Math.ceil(getFilteredAndSortedPets().length / petsPerPage)}
            </Typography>
          </Box>
          
          {/* Pets Grid */}
          {getPaginatedPets().length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 5 }}>
                <PetsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="textSecondary">
                  No pets match your search criteria
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Try adjusting your filters or search terms
                </Typography>
                <Button variant="outlined" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Grid container spacing={3}>
                {getPaginatedPets().map((pet) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={pet._id}>
                    <Card sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}>
                      <CardMedia
                        component="img"
                        height="180"
                        image={resolveMediaUrl(pet.images?.[0]?.url) || '/placeholder-pet.svg'}
                        alt={pet.name || 'Pet'}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold' }}>
                            {pet.name || 'Unnamed Pet'}
                          </Typography>
                          {pet.petCode && (
                            <Chip 
                              label={pet.petCode} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          )}
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" color="textSecondary">
                            {pet.breedId?.name || 'Breed'} • {formatAge(pet.age, pet.ageUnit)}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          {pet.gender === 'male' ? (
                            <MaleIcon sx={{ fontSize: 16, color: 'primary.main', mr: 0.5 }} />
                          ) : pet.gender === 'female' ? (
                            <FemaleIcon sx={{ fontSize: 16, color: 'secondary.main', mr: 0.5 }} />
                          ) : null}
                          <Typography variant="body2" color="textSecondary">
                            {pet.gender || 'Gender not specified'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <StarIcon sx={{ color: 'gold', fontSize: 16, mr: 0.5 }} />
                          <Typography variant="body2">{pet.rating || 'No rating'}</Typography>
                        </Box>
                        
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                          ₹{pet.price ? pet.price.toLocaleString() : 'Price not set'}
                        </Typography>
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                        <IconButton 
                          size="small"
                          onClick={() => handleAddToWishlist(pet._id)}
                        >
                          <FavoriteIcon />
                        </IconButton>
                        <Button 
                          size="small" 
                          variant="contained" 
                          onClick={() => navigate(`/User/petshop/pet/${pet._id}`)}
                        >
                          View Details
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              {/* Pagination */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination 
                  count={Math.ceil(getFilteredAndSortedPets().length / petsPerPage)}
                  page={currentPage}
                  onChange={(e, page) => setCurrentPage(page)}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            </>
          )}
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            Pet Shops Near You
          </Typography>
          <Grid container spacing={3}>
            {petShops.map((shop) => (
              <Grid item xs={12} md={6} key={shop._id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PetShopIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">
                        {shop.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      <LocationIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      {shop.address?.city || 'Location not specified'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Capacity: {shop.capacity?.current || 0}/{shop.capacity?.total || 0} pets
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => navigate(`/User/petshop/shop/${shop._id}`)}
                      >
                        Visit Shop
                      </Button>
                      <Button 
                        variant="contained" 
                        size="small"
                        startIcon={<PetsIcon />}
                        onClick={() => {
                          setTabValue(1)
                          setSearchQuery(shop.name)
                        }}
                      >
                        View Pets
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {tabValue === 3 && (
        <Box>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            My Activity
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FavoriteIcon sx={{ mr: 1, color: 'error.main' }} />
                    <Typography variant="h6">
                      My Wishlist ({wishlistItems.length})
                    </Typography>
                  </Box>
                  {wishlistItems.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <FavoriteIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body2" color="textSecondary">
                        Your wishlist is empty. Start adding pets you love!
                      </Typography>
                      <Button 
                        variant="outlined" 
                        sx={{ mt: 2 }}
                        onClick={() => setTabValue(1)}
                      >
                        Browse Pets
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      {wishlistItems.slice(0, 3).map((wishlistItem, index) => (
                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, pb: 2, borderBottom: index < wishlistItems.slice(0, 3).length - 1 ? 1 : 0, borderColor: 'divider' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CardMedia
                              component="img"
                              height="50"
                              image={resolveMediaUrl(wishlistItem.itemId?.images?.[0]?.url) || '/placeholder-pet.svg'}
                              alt={wishlistItem.itemId?.name || 'Pet'}
                              sx={{ width: 50, borderRadius: 1, mr: 2 }}
                            />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {wishlistItem.itemId?.name || 'Pet'}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {wishlistItem.itemId?.breedId?.name || 'Breed'}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="body2" color="primary">
                            ₹{wishlistItem.itemId?.price?.toLocaleString() || 'N/A'}
                          </Typography>
                        </Box>
                      ))}
                      {wishlistItems.length > 3 && (
                        <Typography variant="body2" color="textSecondary">
                          ...and {wishlistItems.length - 3} more
                        </Typography>
                      )}
                    </Box>
                  )}
                  <Button 
                    variant="outlined" 
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/User/petshop/wishlist')}
                  >
                    View Full Wishlist
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ReserveIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">
                      My Reservations ({reservations.length})
                    </Typography>
                  </Box>
                  {reservations.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <ScheduleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body2" color="textSecondary">
                        No active reservations. Reserve a pet today!
                      </Typography>
                      <Button 
                        variant="outlined" 
                        sx={{ mt: 2 }}
                        onClick={() => setTabValue(1)}
                      >
                        Browse Pets
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      {reservations.slice(0, 3).map((reservation, index) => (
                        <Box key={index} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {reservation.itemId?.name || 'Pet'}
                            </Typography>
                            <Chip 
                              label={
                                reservation.status === 'pending' ? 'Pending Approval' :
                                reservation.status === 'approved' ? 'Approved' :
                                reservation.status === 'rejected' ? 'Rejected' :
                                reservation.status === 'going_to_buy' ? 'Going to Buy' :
                                reservation.status === 'payment_pending' ? 'Payment Pending' :
                                reservation.status === 'paid' ? 'Paid' :
                                reservation.status === 'ready_pickup' ? 'Ready for Pickup' :
                                reservation.status === 'delivered' ? 'Delivered' :
                                reservation.status === 'at_owner' ? 'Purchased' :
                                reservation.status === 'cancelled' ? 'Cancelled' :
                                reservation.status
                              } 
                              size="small" 
                              color={getReservationStatusColor(reservation.status)}
                              variant={reservation.status === 'at_owner' ? 'filled' : 'outlined'}
                            />
                          </Box>
                          <Typography variant="caption" color="textSecondary">
                            Code: {reservation.reservationCode}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Button 
                              size="small"
                              variant="outlined"
                              onClick={() => navigate(`/User/petshop/reservation/${reservation._id}`)}
                            >
                              View Details
                            </Button>
                          </Box>
                        </Box>
                      ))}
                      {reservations.length > 3 && (
                        <Typography variant="body2" color="textSecondary">
                          ...and {reservations.length - 3} more
                        </Typography>
                      )}
                    </Box>
                  )}
                  <Button 
                    variant="outlined" 
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/User/petshop/reservations')}
                  >
                    View All Reservations
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

        </ModuleDashboardLayout>
      </Container>

      {/* Filters Dialog */}
      <Dialog 
        open={false}
        id="filters-dialog"
        onClose={() => document.getElementById('filters-dialog').style.display = 'none'}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Filters</Typography>
            <IconButton onClick={() => document.getElementById('filters-dialog').style.display = 'none'}>
              <ClearIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* Price Range */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Price Range
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <TextField
                  label="Min Price"
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, minPrice: Number(e.target.value) }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Max Price"
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  size="small"
                  fullWidth
                />
              </Box>
              <Slider
                value={[filters.minPrice, filters.maxPrice]}
                onChange={(e, newValue) => setFilters(prev => ({ ...prev, minPrice: newValue[0], maxPrice: newValue[1] }))}
                valueLabelDisplay="auto"
                min={0}
                max={100000}
                step={1000}
              />
            </Box>
            
            {/* Age Range */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Age Range
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <TextField
                  label="Min Age"
                  type="number"
                  value={filters.minAge}
                  onChange={(e) => setFilters(prev => ({ ...prev, minAge: Number(e.target.value) }))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">years</InputAdornment>,
                  }}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Max Age"
                  type="number"
                  value={filters.maxAge}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxAge: Number(e.target.value) }))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">years</InputAdornment>,
                  }}
                  size="small"
                  fullWidth
                />
              </Box>
              <Slider
                value={[filters.minAge, filters.maxAge]}
                onChange={(e, newValue) => setFilters(prev => ({ ...prev, minAge: newValue[0], maxAge: newValue[1] }))}
                valueLabelDisplay="auto"
                min={0}
                max={20}
                step={0.5}
              />
            </Box>
            
            {/* Gender */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Gender
              </Typography>
              <ToggleButtonGroup
                value={filters.gender}
                onChange={(e, newGenders) => setFilters(prev => ({ ...prev, gender: newGenders }))}
                aria-label="gender"
                fullWidth
              >
                <ToggleButton value="male" aria-label="male">
                  <MaleIcon sx={{ mr: 1 }} />
                  Male
                </ToggleButton>
                <ToggleButton value="female" aria-label="female">
                  <FemaleIcon sx={{ mr: 1 }} />
                  Female
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => document.getElementById('filters-dialog').style.display = 'none'}>Cancel</Button>
          <Button variant="contained" onClick={() => document.getElementById('filters-dialog').style.display = 'none'}>Apply Filters</Button>
        </DialogActions>
      </Dialog>

      {/* Sort Dialog */}
      <Dialog 
        open={false}
        id="sort-dialog"
        onClose={() => document.getElementById('sort-dialog').style.display = 'none'}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Sort By</Typography>
            <IconButton onClick={() => document.getElementById('sort-dialog').style.display = 'none'}>
              <ClearIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Sort Option</InputLabel>
              <Select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                label="Sort Option"
              >
                <MenuItem value="featured">Featured</MenuItem>
                <MenuItem value="price_low">Price: Low to High</MenuItem>
                <MenuItem value="price_high">Price: High to Low</MenuItem>
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="rating">Highest Rated</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => document.getElementById('sort-dialog').style.display = 'none'}>Cancel</Button>
          <Button variant="contained" onClick={() => document.getElementById('sort-dialog').style.display = 'none'}>Apply</Button>
        </DialogActions>
      </Dialog>

      {/* Reservation Dialog */}
      <Dialog 
        open={reservationDialog} 
        onClose={() => setReservationDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Reserve Pet: {selectedPet?.name || 'Unnamed Pet'}
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={reservationStep} orientation="vertical">
            {reservationSteps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  {index === 0 && (
                    <Box sx={{ mt: 2 }}>
                      <FormControl component="fieldset">
                        <RadioGroup
                          value={reservationData.reservationType}
                          onChange={(e) => setReservationData(prev => ({
                            ...prev,
                            reservationType: e.target.value
                          }))}
                        >
                          <FormControlLabel 
                            value="online_booking" 
                            control={<Radio />} 
                            label="Online Booking - Reserve now, visit later" 
                          />
                          <FormControlLabel 
                            value="offline_verification" 
                            control={<Radio />} 
                            label="Offline Verification - Visit shop for verification" 
                          />
                        </RadioGroup>
                      </FormControl>
                    </Box>
                  )}
                  
                  {index === 1 && (
                    <Box sx={{ mt: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Phone Number"
                            value={reservationData.contactInfo.phone}
                            onChange={(e) => setReservationData(prev => ({
                              ...prev,
                              contactInfo: { ...prev.contactInfo, phone: e.target.value }
                            }))}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={reservationData.contactInfo.email}
                            onChange={(e) => setReservationData(prev => ({
                              ...prev,
                              contactInfo: { ...prev.contactInfo, email: e.target.value }
                            }))}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <FormControl fullWidth>
                            <InputLabel>Preferred Contact Method</InputLabel>
                            <Select
                              value={reservationData.contactInfo.preferredContactMethod}
                              onChange={(e) => setReservationData(prev => ({
                                ...prev,
                                contactInfo: { ...prev.contactInfo, preferredContactMethod: e.target.value }
                              }))}
                            >
                              <MenuItem value="phone">Phone</MenuItem>
                              <MenuItem value="email">Email</MenuItem>
                              <MenuItem value="both">Both</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                  
                  {index === 2 && (
                    <Box sx={{ mt: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Preferred Visit Date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={reservationData.visitDetails.preferredDate}
                            onChange={(e) => setReservationData(prev => ({
                              ...prev,
                              visitDetails: { ...prev.visitDetails, preferredDate: e.target.value }
                            }))}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>Preferred Time</InputLabel>
                            <Select
                              value={reservationData.visitDetails.preferredTime}
                              onChange={(e) => setReservationData(prev => ({
                                ...prev,
                                visitDetails: { ...prev.visitDetails, preferredTime: e.target.value }
                              }))}
                            >
                              <MenuItem value="morning">Morning (9 AM - 12 PM)</MenuItem>
                              <MenuItem value="afternoon">Afternoon (12 PM - 5 PM)</MenuItem>
                              <MenuItem value="evening">Evening (5 PM - 8 PM)</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                          <FormControl fullWidth>
                            <InputLabel>Visit Purpose</InputLabel>
                            <Select
                              value={reservationData.visitDetails.visitPurpose}
                              onChange={(e) => setReservationData(prev => ({
                                ...prev,
                                visitDetails: { ...prev.visitDetails, visitPurpose: e.target.value }
                              }))}
                            >
                              <MenuItem value="meet_pet">Meet the Pet</MenuItem>
                              <MenuItem value="final_purchase">Final Purchase</MenuItem>
                              <MenuItem value="health_check">Health Check</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                  
                  {index === 3 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>Review Your Reservation</Typography>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography><strong>Pet:</strong> {selectedPet?.name}</Typography>
                          <Typography><strong>Price:</strong> ₹{selectedPet?.price?.toLocaleString()}</Typography>
                          <Typography><strong>Type:</strong> {reservationData.reservationType.replace('_', ' ')}</Typography>
                          <Typography><strong>Contact:</strong> {reservationData.contactInfo.phone} / {reservationData.contactInfo.email}</Typography>
                          <Typography><strong>Visit Date:</strong> {reservationData.visitDetails.preferredDate}</Typography>
                          <Typography><strong>Visit Time:</strong> {reservationData.visitDetails.preferredTime}</Typography>
                        </CardContent>
                      </Card>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Additional Notes"
                        value={reservationData.notes}
                        onChange={(e) => setReservationData(prev => ({
                          ...prev,
                          notes: e.target.value
                        }))}
                        sx={{ mt: 2 }}
                      />
                    </Box>
                  )}
                  
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => {
                        if (index === reservationSteps.length - 1) {
                          handleReservationSubmit()
                        } else {
                          setReservationStep(index + 1)
                        }
                      }}
                      sx={{ mr: 1 }}
                    >
                      {index === reservationSteps.length - 1 ? 'Submit Reservation' : 'Continue'}
                    </Button>
                    <Button
                      disabled={index === 0}
                      onClick={() => setReservationStep(index - 1)}
                    >
                      Back
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReservationDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default PetShopDashboard