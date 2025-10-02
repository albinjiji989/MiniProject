import React, { useState, useEffect } from 'react'
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
  Skeleton
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
  Sort as SortIcon
} from '@mui/icons-material'
import { apiClient } from '../../../services/api'
import { useAuth } from '../../../contexts/AuthContext'

const PetShopDashboard = () => {
  const theme = useTheme()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tabValue, setTabValue] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  
  // State for data
  const [stats, setStats] = useState({
    totalPetShops: 0,
    availableForSale: 0,
    myWishlistItems: 0,
    myReservations: 0
  })
  const [featuredPets, setFeaturedPets] = useState([])
  const [petShops, setPetShops] = useState([])
  const [wishlistItems, setWishlistItems] = useState([])
  const [reservations, setReservations] = useState([])
  
  // Removed mock user; using authenticated user from context
  
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
        apiClient.get('/petshop/public/listings?limit=12'),
        apiClient.get('/petshop/public/shops?limit=8'),
        apiClient.get('/petshop/public/wishlist'),
        apiClient.get('/petshop/public/reservations/enhanced')
      ])
      
      setStats(statsRes.data.data)
      setFeaturedPets(petsRes.data.data.items || [])
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
  }

  const handleReservePet = (pet) => {
    setSelectedPet(pet)
    setReservationData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        phone: user?.phone || '',
        email: user?.email || ''
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
      
      const response = await apiClient.post('/petshop/public/reservations/enhanced', payload)
      
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
      await apiClient.post('/petshop/public/wishlist', { itemId: petId })
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
      'payment_pending': 'warning',
      'paid': 'success',
      'ready_pickup': 'primary',
      'completed': 'success',
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
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: 'background.default',
      pt: 2
    }}>
      {/* Simple Top Bar */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4,
        px: 3,
        py: 2,
        bgcolor: 'background.paper',
        boxShadow: 1,
        borderRadius: 2
      }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          PetShop Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<SearchIcon />}>
            Search
          </Button>
          <Button variant="contained" startIcon={<FilterIcon />}>
            Filter
          </Button>
        </Box>
      </Box>

      {/* Main Content Container */}
      <Container maxWidth="xl" sx={{ px: 3 }}>
        {/* Hero Section */}
        <Box sx={{ 
          mb: 4,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          borderRadius: 3,
          p: 4,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Typography variant="h3" sx={{ 
            mb: 2, 
            fontWeight: 800,
            color: 'primary.main'
          }}>
            Find Your Perfect Pet
          </Typography>
          <Typography variant="h6" color="textSecondary" sx={{ mb: 3, maxWidth: 600 }}>
            Discover amazing pets from trusted pet shops and reserve your new companion today
          </Typography>
          
          {/* Search Bar */}
          <Paper sx={{ 
            p: 1, 
            display: 'flex', 
            alignItems: 'center',
            maxWidth: 500,
            boxShadow: 2
          }}>
            <SearchIcon sx={{ color: 'text.secondary', mr: 1, ml: 1 }} />
            <InputBase
              placeholder="Search pets, breeds, or shops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1, px: 1 }}
            />
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <IconButton onClick={() => setFilterOpen(true)}>
              <FilterIcon />
            </IconButton>
            <Button variant="contained" sx={{ ml: 1 }}>
              Search
            </Button>
          </Paper>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              color: 'white'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Pet Shops Available
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {loading ? '...' : (stats.totalPetShops || 0)}
                    </Typography>
                  </Box>
                  <PetShopIcon sx={{ fontSize: 40, opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
              color: 'white'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      Available Pets
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {loading ? '...' : (stats.availableForSale || 0)}
                    </Typography>
                  </Box>
                  <PetsIcon sx={{ fontSize: 40, opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
              color: 'white'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      My Wishlist
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {loading ? '...' : (stats.myWishlistItems || 0)}
                    </Typography>
                  </Box>
                  <FavoriteIcon sx={{ fontSize: 40, opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', 
              color: 'white'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      My Reservations
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {loading ? '...' : (stats.myReservations || 0)}
                    </Typography>
                  </Box>
                  <ReserveIcon sx={{ fontSize: 40, opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 4, borderRadius: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
              py: 2
            },
            '& .Mui-selected': {
              color: 'primary.main'
            }
          }}
        >
          <Tab 
            label="Featured Pets" 
            icon={<StarIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Browse All" 
            icon={<PetsIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Pet Shops" 
            icon={<PetShopIcon />}
            iconPosition="start"
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                My Activity
                {reservations.length > 0 && (
                  <Chip 
                    label={reservations.length} 
                    size="small" 
                    color="primary"
                    sx={{ height: 20, minWidth: 20 }}
                  />
                )}
              </Box>
            }
            icon={<ReserveIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Featured Pets Section */}
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
                      image={pet.images?.[0]?.url || '/api/placeholder/300/200'}
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
                        {pet.storeName || 'Pet Shop'} • {pet.age || 'Age not specified'} {pet.ageUnit || ''}
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
                        onClick={() => handleReservePet(pet)}
                      >
                        Reserve
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Browse All Tab */}
      {tabValue === 1 && (
        <Box>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            Browse All Pets
          </Typography>
          <Grid container spacing={3}>
            {featuredPets.map((pet) => (
              <Grid item xs={12} sm={6} md={3} key={pet._id}>
                <Card sx={{ 
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-2px)' }
                }}>
                  <CardMedia
                    component="img"
                    height="150"
                    image={pet.images?.[0]?.url || '/api/placeholder/300/200'}
                    alt={pet.name || 'Pet'}
                  />
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {pet.name || 'Unnamed Pet'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      ₹{pet.price ? pet.price.toLocaleString() : 'Price not set'}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      onClick={() => handleReservePet(pet)}
                      startIcon={<ReserveIcon />}
                    >
                      Reserve
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Pet Shops Tab */}
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
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {shop.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      <LocationIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      {shop.address?.city || 'Location not specified'}
                    </Typography>
                    <Typography variant="body2">
                      Capacity: {shop.capacity?.current || 0}/{shop.capacity?.total || 0}
                    </Typography>
                    <Button variant="outlined" sx={{ mt: 2 }}>
                      Visit Shop
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* My Activity Tab */}
      {tabValue === 3 && (
        <Box>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            My Activity
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    My Wishlist ({wishlistItems.length})
                  </Typography>
                  {wishlistItems.length === 0 ? (
                    <Typography variant="body2" color="textSecondary">
                      Your wishlist is empty. Start adding pets you love!
                    </Typography>
                  ) : (
                    <Box>
                      {wishlistItems.slice(0, 3).map((wishlistItem, index) => (
                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">
                            {wishlistItem.itemId?.name || 'Pet'}
                          </Typography>
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
                  <Button variant="outlined" sx={{ mt: 2 }}>
                    View Full Wishlist
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    My Reservations ({reservations.length})
                  </Typography>
                  {reservations.length === 0 ? (
                    <Typography variant="body2" color="textSecondary">
                      No active reservations. Reserve a pet today!
                    </Typography>
                  ) : (
                    <Box>
                      {reservations.slice(0, 3).map((reservation, index) => (
                        <Box key={index} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {reservation.itemId?.name || 'Pet'}
                            </Typography>
                            <Chip 
                              label={reservation.status} 
                              size="small" 
                              color={getReservationStatusColor(reservation.status)}
                            />
                          </Box>
                          <Typography variant="caption" color="textSecondary">
                            Code: {reservation.reservationCode}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Tooltip title="Track Reservation">
                              <IconButton size="small">
                                <QrCodeIcon />
                              </IconButton>
                            </Tooltip>
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
                  <Button variant="outlined" sx={{ mt: 2 }}>
                    View All Reservations
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

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
      </Container>
    </Box>
  )
}

export default PetShopDashboard
