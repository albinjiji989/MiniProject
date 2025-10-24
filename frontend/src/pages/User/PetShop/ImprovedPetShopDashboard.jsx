import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  CardMedia,
  CardActions,
  Tabs,
  Tab,
  Snackbar,
  Tooltip,
  IconButton,
  Paper,
  InputBase,
  Divider,
  Container,
  useTheme,
  alpha,
  Pagination,
  useMediaQuery,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import {
  Store as PetShopIcon,
  Pets as PetsIcon,
  Favorite as FavoriteIcon,
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
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Home as HomeIcon,
  ShoppingCart as CartIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material'
import ModuleDashboardLayout from '../../../components/Module/ModuleDashboardLayout'
import { useAuth } from '../../../contexts/AuthContext'
import { petShopAPI, resolveMediaUrl } from '../../../services/api'

// Import the new components
import ReservationDialog from '../../../components/PetShop/Dashboard/ReservationDialog'
import PaymentDialog from '../../../components/PetShop/Dashboard/PaymentDialog'
import HandoverDialog from '../../../components/PetShop/Dashboard/HandoverDialog'
import QrCodeDialog from '../../../components/PetShop/Dashboard/QrCodeDialog'
import FiltersDialog from '../../../components/PetShop/Dashboard/FiltersDialog'
import SortDialog from '../../../components/PetShop/Dashboard/SortDialog'

const ImprovedPetShopDashboard = () => {
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
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false)
  const [selectedPet, setSelectedPet] = useState(null)
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
  
  // Payment state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('razorpay')
  const [processingPayment, setProcessingPayment] = useState(false)
  
  // Handover state
  const [handoverDialogOpen, setHandoverDialogOpen] = useState(false)
  const [handoverData, setHandoverData] = useState({
    otp: '',
    qrDialogOpen: false
  })
  
  // Dialog states
  const [filtersDialogOpen, setFiltersDialogOpen] = useState(false)
  const [sortDialogOpen, setSortDialogOpen] = useState(false)
  
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
        petShopAPI.getUserStats(),
        petShopAPI.listPublicListings({ limit: 50 }),
        petShopAPI.listPublicShops(),
        petShopAPI.listMyWishlist(),
        petShopAPI.listMyReservations()
      ])
      
      setStats({
        totalPetShops: statsRes?.data?.data?.totalShops || 0,
        availableForSale: statsRes?.data?.data?.availablePets || 0,
        myWishlistItems: wishlistRes?.data?.data?.items?.length || 0,
        myReservations: reservationsRes?.data?.data?.reservations?.length || 0
      })
      
      setFeaturedPets(petsRes?.data?.data?.items || [])
      setAllPets(petsRes?.data?.data?.items || [])
      setPetShops(shopsRes?.data?.data?.shops || [])
      setWishlistItems(wishlistRes?.data?.data?.items || [])
      setReservations(reservationsRes?.data?.data?.reservations || [])
      
      setError('')
    } catch (err) {
      console.error('Dashboard data fetch error:', err)
      setError(err.response?.data?.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
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
    setReservationDialogOpen(true)
  }

  const handleReservationSubmit = async () => {
    try {
      const payload = {
        itemId: selectedPet._id,
        reservationType: reservationData.reservationType,
        contactInfo: reservationData.contactInfo,
        visitDetails: reservationData.visitDetails,
        notes: reservationData.notes
      }
      
      // Create reservation with the correct endpoint
      const response = await petShopAPI.createReservation(payload)
      
      setSnackbar({
        open: true,
        message: `Reservation created successfully! Code: ${response.data.data.reservation.reservationCode}`,
        severity: 'success'
      })
      
      setReservationDialogOpen(false)
      setReservationData({
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
      await petShopAPI.addToWishlist(petId)
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

  const handleCancelReservation = async (reservation) => {
    try {
      await petShopAPI.cancelReservation(reservation._id)
      // Update local state
      setReservations(prev => prev.map(r => 
        r._id === reservation._id 
          ? { ...r, status: 'cancelled' } 
          : r
      ))
      // Show success message
      setSnackbar({
        open: true,
        message: 'Reservation cancelled successfully!',
        severity: 'success'
      })
    } catch (e) {
      setSnackbar({
        open: true,
        message: 'Failed to cancel reservation: ' + (e?.response?.data?.message || 'Unknown error'),
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
      'paid': 'success',
      'ready_pickup': 'primary',
      'delivered': 'success',
      'at_owner': 'success',
      'cancelled': 'error'
    }
    return colors[status] || 'default'
  }

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Pending',
      'manager_review': 'Under Review',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'going_to_buy': 'Going to Buy',
      'payment_pending': 'Payment Pending',
      'paid': 'Paid',
      'ready_pickup': 'Ready for Pickup',
      'delivered': 'Delivered',
      'at_owner': 'Pet with Owner',
      'cancelled': 'Cancelled'
    }
    return labels[status] || status
  }

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
    
    // Sort pets
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

  // Quick actions for the dashboard
  const quickActions = [
    {
      label: 'Browse Pets',
      icon: <PetsIcon />,
      onClick: () => setTabValue(1),
      color: 'primary'
    },
    {
      label: 'My Reservations',
      icon: <ScheduleIcon />,
      onClick: () => setTabValue(3),
      color: 'secondary'
    },
    {
      label: 'Wishlist',
      icon: <FavoriteIcon />,
      onClick: () => navigate('/User/petshop/wishlist'),
      color: 'error'
    }
  ]

  // Stat cards for the dashboard
  const statCards = [
    {
      title: 'Available Pets',
      value: stats.availableForSale,
      icon: <PetsIcon />,
      color: 'primary'
    },
    {
      title: 'Pet Shops',
      value: stats.totalPetShops,
      icon: <PetShopIcon />,
      color: 'secondary'
    },
    {
      title: 'Wishlist Items',
      value: stats.myWishlistItems,
      icon: <FavoriteIcon />,
      color: 'error'
    },
    {
      title: 'Active Reservations',
      value: stats.myReservations,
      icon: <ScheduleIcon />,
      color: 'info'
    }
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
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
        <ModuleDashboardLayout
          title="Pet Shop"
          description="Find your perfect companion and manage your pet journey"
          actions={quickActions}
          stats={statCards}
        >
          {/* Featured Pets Tab */}
          {tabValue === 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Featured Pets
              </Typography>
              {featuredPets.length === 0 ? (
                <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                  <CardContent sx={{ textAlign: 'center', py: 5 }}>
                    <PetsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                      No pets available at the moment
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Check back later for new arrivals!
                    </Typography>
                    <Button variant="outlined" onClick={() => setTabValue(1)}>
                      Browse All Pets
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Grid container spacing={{ xs: 2, md: 3 }}>
                  {featuredPets.slice(0, 6).map((pet) => (
                    <Grid item xs={12} sm={6} md={4} key={pet._id}>
                      <Card sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        transition: 'all 0.3s ease-in-out',
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: 2,
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: 6
                        }
                      }}>
                        <Box sx={{ position: 'relative' }}>
                          <CardMedia
                            component="img"
                            height="200"
                            image={resolveMediaUrl(pet.images?.[0]?.url) || '/placeholder-pet.svg'}
                            alt={pet.name || 'Pet'}
                            sx={{ objectFit: 'cover' }}
                          />
                          {pet.petCode && (
                            <Chip 
                              label={pet.petCode} 
                              size="small" 
                              color="primary" 
                              variant="filled"
                              sx={{ 
                                position: 'absolute', 
                                top: 12, 
                                right: 12,
                                fontWeight: 'bold',
                                boxShadow: 1
                              }}
                            />
                          )}
                          <Box sx={{ 
                            position: 'absolute', 
                            bottom: 12, 
                            left: 12,
                            bgcolor: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              ₹{pet.price ? pet.price.toLocaleString() : 'Price not set'}
                            </Typography>
                          </Box>
                        </Box>
                        <CardContent sx={{ flexGrow: 1, pb: '16px !important' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                              {pet.name || 'Unnamed Pet'}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            {pet.storeName || 'Pet Shop'} • {formatAge(pet.age, pet.ageUnit)}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <StarIcon sx={{ color: 'gold', fontSize: 16, mr: 0.5 }} />
                            <Typography variant="body2">
                              {pet.rating ? `${pet.rating}/5` : 'No rating'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            {pet.gender === 'male' ? (
                              <MaleIcon sx={{ fontSize: 16, color: 'primary.main', mr: 0.5 }} />
                            ) : pet.gender === 'female' ? (
                              <FemaleIcon sx={{ fontSize: 16, color: 'secondary.main', mr: 0.5 }} />
                            ) : null}
                            <Typography variant="body2" color="textSecondary">
                              {pet.breedId?.name || 'Breed'} • {pet.gender || 'Gender not specified'}
                            </Typography>
                          </Box>
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                          <Button 
                            size="small" 
                            startIcon={<FavoriteIcon />}
                            onClick={() => handleAddToWishlist(pet._id)}
                            variant="outlined"
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

          {/* Browse Pets Tab */}
          {tabValue === 1 && (
            <Box sx={{ mt: 3 }}>
              {/* Search and Filters */}
              <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: 2 }}>
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
                      onClick={() => setFiltersDialogOpen(true)}
                      sx={{ borderRadius: 2 }}
                    >
                      Filters
                    </Button>
                    <Button 
                      variant="outlined" 
                      startIcon={<SortIcon />}
                      onClick={() => setSortDialogOpen(true)}
                      sx={{ borderRadius: 2 }}
                    >
                      Sort
                    </Button>
                    <Button 
                      variant="outlined" 
                      startIcon={<ClearIcon />}
                      onClick={resetFilters}
                      sx={{ borderRadius: 2 }}
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
                <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                  <CardContent sx={{ textAlign: 'center', py: 5 }}>
                    <PetsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                      No pets match your search criteria
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Try adjusting your filters or search terms
                    </Typography>
                    <Button variant="outlined" onClick={resetFilters} sx={{ borderRadius: 2 }}>
                      Reset Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Grid container spacing={{ xs: 2, md: 3 }}>
                    {getPaginatedPets().map((pet) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={pet._id}>
                        <Card sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column',
                          transition: 'all 0.3s ease-in-out',
                          borderRadius: 2,
                          overflow: 'hidden',
                          boxShadow: 2,
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: 6
                          }
                        }}>
                          <Box sx={{ position: 'relative' }}>
                            <CardMedia
                              component="img"
                              height="180"
                              image={resolveMediaUrl(pet.images?.[0]?.url) || '/placeholder-pet.svg'}
                              alt={pet.name || 'Pet'}
                              sx={{ objectFit: 'cover' }}
                            />
                            {pet.petCode && (
                              <Chip 
                                label={pet.petCode} 
                                size="small" 
                                color="primary" 
                                variant="filled"
                                sx={{ 
                                  position: 'absolute', 
                                  top: 12, 
                                  right: 12,
                                  fontWeight: 'bold',
                                  boxShadow: 1
                                }}
                              />
                            )}
                            <Box sx={{ 
                              position: 'absolute', 
                              bottom: 12, 
                              left: 12,
                              bgcolor: 'rgba(0, 0, 0, 0.7)',
                              color: 'white',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1
                            }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                ₹{pet.price ? pet.price.toLocaleString() : 'Price not set'}
                              </Typography>
                            </Box>
                          </Box>
                          <CardContent sx={{ flexGrow: 1, pb: '16px !important' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold' }}>
                                {pet.name || 'Unnamed Pet'}
                              </Typography>
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
                              <Typography variant="body2">
                                {pet.rating ? `${pet.rating}/5` : 'No rating'}
                              </Typography>
                            </Box>
                          </CardContent>
                          <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                            <IconButton 
                              size="small"
                              onClick={() => handleAddToWishlist(pet._id)}
                              color="default"
                            >
                              <FavoriteIcon />
                            </IconButton>
                            <Button 
                              size="small" 
                              variant="contained" 
                              onClick={() => navigate(`/User/petshop/pet/${pet._id}`)}
                              sx={{ borderRadius: 2 }}
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
                      sx={{ 
                        '.MuiPaginationItem-root': { borderRadius: 2 },
                        '.Mui-selected': { bgcolor: 'primary.main' }
                      }}
                    />
                  </Box>
                </>
              )}
            </Box>
          )}

          {/* Pet Shops Tab */}
          {tabValue === 2 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Pet Shops Near You
              </Typography>
              <Grid container spacing={{ xs: 2, md: 3 }}>
                {petShops.map((shop) => (
                  <Grid item xs={12} md={6} key={shop._id}>
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        transition: 'all 0.3s ease-in-out',
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: 2,
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4
                        }
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                            <PetShopIcon />
                          </Avatar>
                          <Typography variant="h6">
                            {shop.name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="textSecondary">
                            {shop.address?.city || 'Location not specified'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <PetsIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            Capacity: {shop.capacity?.current || 0}/{shop.capacity?.total || 0} pets
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => navigate(`/User/petshop/shop/${shop._id}`)}
                            startIcon={<PetShopIcon />}
                            sx={{ borderRadius: 2 }}
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
                            sx={{ borderRadius: 2 }}
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

          {/* My Activity Tab */}
          {tabValue === 3 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                My Activity
              </Typography>
              <Grid container spacing={{ xs: 2, md: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                          <FavoriteIcon />
                        </Avatar>
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
                            sx={{ mt: 2, borderRadius: 2 }}
                            onClick={() => setTabValue(1)}
                          >
                            Browse Pets
                          </Button>
                        </Box>
                      ) : (
                        <Box>
                          {wishlistItems.slice(0, 3).map((wishlistItem, index) => (
                            <Card key={index} sx={{ display: 'flex', mb: 2, boxShadow: 1, borderRadius: 2 }}>
                              <CardMedia
                                component="img"
                                sx={{ width: 100, height: 100, objectFit: 'cover' }}
                                image={resolveMediaUrl(wishlistItem.itemId?.images?.[0]?.url) || '/placeholder-pet.svg'}
                                alt={wishlistItem.itemId?.name || 'Pet'}
                              />
                              <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <CardContent sx={{ flex: '1 0 auto', pb: '8px !important' }}>
                                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                    {wishlistItem.itemId?.name || 'Pet'}
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                    {wishlistItem.itemId?.breedId?.name || 'Breed'}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <StarIcon sx={{ color: 'gold', fontSize: 16, mr: 0.5 }} />
                                    <Typography variant="body2">
                                      {wishlistItem.itemId?.rating ? `${wishlistItem.itemId.rating}/5` : 'No rating'}
                                    </Typography>
                                  </Box>
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 1 }}>
                                  <Typography variant="body2" color="primary">
                                    ₹{wishlistItem.itemId?.price?.toLocaleString() || 'N/A'}
                                  </Typography>
                                  <Button 
                                    size="small" 
                                    variant="outlined" 
                                    onClick={() => navigate(`/User/petshop/pet/${wishlistItem.itemId?._id}`)}
                                    sx={{ borderRadius: 2 }}
                                  >
                                    View
                                  </Button>
                                </CardActions>
                              </Box>
                            </Card>
                          ))}
                          {wishlistItems.length > 3 && (
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                              ...and {wishlistItems.length - 3} more
                            </Typography>
                          )}
                        </Box>
                      )}
                      <Button 
                        variant="outlined" 
                        fullWidth
                        sx={{ mt: 2, borderRadius: 2 }}
                        onClick={() => navigate('/User/petshop/wishlist')}
                      >
                        View Full Wishlist
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          <ScheduleIcon />
                        </Avatar>
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
                            sx={{ mt: 2, borderRadius: 2 }}
                            onClick={() => setTabValue(1)}
                          >
                            Browse Pets
                          </Button>
                        </Box>
                      ) : (
                        <Box>
                          {reservations.slice(0, 3).map((reservation, index) => (
                            <Accordion key={index} sx={{ mb: 1, borderRadius: 2 }}>
                              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {reservation.itemId?.name || 'Pet'}
                                  </Typography>
                                  <Chip 
                                    label={getStatusLabel(reservation.status)} 
                                    size="small" 
                                    color={getReservationStatusColor(reservation.status)}
                                  />
                                </Box>
                              </AccordionSummary>
                              <AccordionDetails>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  <Typography variant="caption" color="textSecondary">
                                    Code: {reservation.reservationCode}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    Price: ₹{reservation.itemId?.price?.toLocaleString() || 'N/A'}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                    <Button 
                                      size="small"
                                      variant="outlined"
                                      onClick={() => navigate(`/User/petshop/reservation/${reservation._id}`)}
                                      sx={{ borderRadius: 2 }}
                                    >
                                      View Details
                                    </Button>
                                    
                                    {/* Show "Make Decision" button when reservation is approved */}
                                    {reservation.status === 'approved' && (
                                      <Button 
                                        size="small"
                                        variant="contained"
                                        color="success"
                                        onClick={() => navigate(`/User/petshop/purchase-decision/${reservation._id}`)}
                                        sx={{ borderRadius: 2 }}
                                      >
                                        Make Decision
                                      </Button>
                                    )}
                                    
                                    {/* Show "Pay Now" button when user has decided to buy */}
                                    {(reservation.status === 'going_to_buy' || reservation.status === 'payment_pending') && (
                                      <Button 
                                        size="small"
                                        variant="contained"
                                        startIcon={<PaymentIcon />}
                                        onClick={() => navigate(`/User/petshop/payment/${reservation._id}`)}
                                        sx={{ borderRadius: 2 }}
                                      >
                                        Pay Now
                                      </Button>
                                    )}
                                    
                                    {/* Show "Handover" button when pet is ready for pickup */}
                                    {reservation.status === 'ready_pickup' && (
                                      <Button 
                                        size="small"
                                        variant="contained"
                                        startIcon={<QrCodeIcon />}
                                        onClick={() => navigate(`/User/petshop/handover/${reservation._id}`)}
                                        sx={{ borderRadius: 2 }}
                                      >
                                        Handover
                                      </Button>
                                    )}
                                    
                                    {/* Show cancel option for pending reservations */}
                                    {['pending', 'approved', 'going_to_buy', 'payment_pending'].includes(reservation.status) && (
                                      <Button 
                                        size="small"
                                        variant="outlined"
                                        startIcon={<CancelIcon />}
                                        onClick={() => handleCancelReservation(reservation)}
                                        color="error"
                                        sx={{ borderRadius: 2 }}
                                      >
                                        Cancel
                                      </Button>
                                    )}
                                  </Box>
                                </Box>
                              </AccordionDetails>
                            </Accordion>
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
                        sx={{ mt: 2, borderRadius: 2 }}
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
      <ReservationDialog
        open={reservationDialogOpen}
        onClose={() => setReservationDialogOpen(false)}
        selectedPet={selectedPet}
        reservationData={reservationData}
        setReservationData={setReservationData}
        onSubmit={handleReservationSubmit}
      />

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        selectedReservation={selectedReservation}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        onPayment={() => {}} // Add payment handler
        processingPayment={processingPayment}
      />

      {/* Handover Dialog */}
      <HandoverDialog
        open={handoverDialogOpen}
        onClose={() => setHandoverDialogOpen(false)}
        selectedReservation={selectedReservation}
        handoverData={handoverData}
        setHandoverData={setHandoverData}
        onVerifyOtp={() => {}} // Add OTP verification handler
        onShowQrCode={() => setHandoverData(prev => ({ ...prev, qrDialogOpen: true }))}
      />

      {/* QR Code Dialog */}
      <QrCodeDialog
        open={handoverData.qrDialogOpen}
        onClose={() => setHandoverData(prev => ({ ...prev, qrDialogOpen: false }))}
        selectedReservation={selectedReservation}
      />

      {/* Filters Dialog */}
      <FiltersDialog
        open={filtersDialogOpen}
        onClose={() => setFiltersDialogOpen(false)}
        filters={filters}
        setFilters={setFilters}
      />

      {/* Sort Dialog */}
      <SortDialog
        open={sortDialogOpen}
        onClose={() => setSortDialogOpen(false)}
        sortOption={sortOption}
        setSortOption={setSortOption}
      />

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

export default ImprovedPetShopDashboard