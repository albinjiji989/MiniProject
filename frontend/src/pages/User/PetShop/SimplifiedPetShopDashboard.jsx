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
  Badge,
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
  Insights as InsightsIcon
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

const SimplifiedPetShopDashboard = () => {
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
      title: 'Browse Pets', 
      icon: <PetsIcon sx={{ fontSize: 32 }} />, 
      color: 'bg-blue-500',
      onClick: () => navigate('/User/petshop/shop'),
    },
    { 
      title: 'My Reservations', 
      icon: <EventIcon sx={{ fontSize: 32 }} />, 
      color: 'bg-green-500',
      onClick: () => navigate('/User/petshop/reservations'),
    },
    { 
      title: 'Wishlist', 
      icon: <FavoriteIcon sx={{ fontSize: 32 }} />, 
      color: 'bg-red-500',
      onClick: () => navigate('/User/petshop/wishlist'),
    }
  ];

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
          {/* Tab content would go here */}
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

export default SimplifiedPetShopDashboard