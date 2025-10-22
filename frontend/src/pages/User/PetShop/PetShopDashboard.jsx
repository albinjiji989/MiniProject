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
import ModuleDashboardLayout from '../../../components/Module/ModuleDashboardLayout'
import { useAuth } from '../../../contexts/AuthContext'
import { apiClient, resolveMediaUrl } from '../../../services/api'

const PetShopDashboard = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
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
        apiClient.get('/petshop/user/public/listings?limit=12'),
        apiClient.get('/petshop/user/public/shops?limit=8'),
        apiClient.get('/petshop/user/public/wishlist'),
        apiClient.get('/petshop/user/public/reservations')
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

  // Unified layout config
  const quickActions = [
    { label: 'Browse Pets', onClick: () => navigate('/User/petshop/shop'), color: 'bg-emerald-600' },
    { label: 'My Wishlist', onClick: () => navigate('/User/petshop/wishlist'), color: 'bg-blue-600' },
    { label: 'My Reservations', onClick: () => navigate('/User/petshop/reservations'), color: 'bg-indigo-600' },
  ]
  const statCards = [
    { label: 'Pet Shops', value: stats.totalPetShops || 0, icon: '🏪' },
    { label: 'Available Pets', value: stats.availableForSale || 0, icon: '🐾' },
    { label: 'My Wishlist', value: stats.myWishlistItems || 0, icon: '❤️' },
  ]
  const tabDefs = [
    { key: 'featured', label: 'Featured Pets' },
    { key: 'browse', label: 'Browse All' },
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pt: 2 }}>
      <Container maxWidth="xl" sx={{ px: 3 }}>
        <ModuleDashboardLayout
          title="Pet Shop"
          description="Browse pets, manage wishlist and reservations"
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Browse All Pets
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<SearchIcon />}
              onClick={() => navigate('/User/petshop/shop')}
            >
              Advanced Search
            </Button>
          </Box>
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
                    image={resolveMediaUrl(pet.images?.[0]?.url) || '/placeholder-pet.svg'}
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
                      onClick={() => navigate(`/User/petshop/pet/${pet._id}`)}
                      startIcon={<ViewIcon />}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
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
                    <Button 
                      variant="outlined" 
                      sx={{ mt: 2 }}
                      onClick={() => navigate(`/User/petshop/shop/${shop._id}`)}
                    >
                      Visit Shop
                    </Button>
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
                  <Button 
                    variant="outlined" 
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
                            <Tooltip title="View Reservation Details">
                              <IconButton 
                                size="small"
                                onClick={() => navigate(`/User/petshop/reservation/${reservation._id}`)}
                              >
                                <ViewIcon />
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
                  <Button 
                    variant="outlined" 
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