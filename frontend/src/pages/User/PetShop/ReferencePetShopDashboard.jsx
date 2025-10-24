// This is a reference file containing the original EnhancedPetShopDashboard implementation
// It will be used as a basis for creating a new, improved pet shop dashboard

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
  useMediaQuery,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText as MuiListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails
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
  LocalOffer as TagIcon,
  ExpandMore as ExpandMoreIcon,
  Home as HomeIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  PhoneAndroid as UpiIcon,
  Chat as ChatIcon,
  Notifications as NotificationIcon,
  AccessTime as TimeIcon,
  Assignment as AssignmentIcon,
  Storefront as StorefrontIcon,
  OnlinePrediction as OnlineIcon,
  OfflinePin as OfflineIcon
} from '@mui/icons-material'
import ModuleDashboardLayout from '../../../components/Module/ModuleDashboardLayout'
import { useAuth } from '../../../contexts/AuthContext'
import { petShopAPI, resolveMediaUrl } from '../../../services/api'
import { QRCodeSVG } from 'qrcode.react'

const ReferencePetShopDashboard = () => {
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
  
  // Payment state
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('razorpay')
  const [processingPayment, setProcessingPayment] = useState(false)
  
  // Handover state
  const [handoverDialog, setHandoverDialog] = useState(false)
  const [handoverData, setHandoverData] = useState({
    otp: '',
    qrDialogOpen: false
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
        petShopAPI.getUserStats(),
        petShopAPI.listPublicListings({ limit: 50 }),
        petShopAPI.listPublicShops({ limit: 8 }),
        petShopAPI.listMyWishlist(),
        petShopAPI.listMyReservations()
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
        reservationType: reservationData.reservationType,
        contactInfo: reservationData.contactInfo,
        visitDetails: reservationData.visitDetails,
        notes: reservationData.notes
      }
      
      // Create reservation with the correct endpoint
      const response = await petShopAPI.createReservation(payload);
      
      setSnackbar({
        open: true,
        message: `Reservation created successfully! Code: ${response.data.data.reservation.reservationCode}`,
        severity: 'success'
      })
      
      setReservationDialog(false)
      setReservationStep(0)
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

  // Define reservation steps with proper descriptions
  const reservationSteps = [
    {
      label: 'Choose Reservation Type',
      description: 'Select how you want to complete your purchase'
    },
    {
      label: 'Contact Information',
      description: 'Provide your contact details for communication'
    },
    {
      label: 'Visit Details',
      description: 'Specify your preferred visit date and time'
    },
    {
      label: 'Review & Submit',
      description: 'Review your reservation details before submitting'
    }
  ]

  // Update the reservation type selection to show proper information
  const getReservationTypeDescription = (type) => {
    switch (type) {
      case 'online_booking':
        return {
          title: 'Online Booking',
          description: 'Complete your purchase online with secure payment processing.',
          steps: [
            '1. Confirm your reservation',
            '2. Complete secure online payment',
            '3. Receive confirmation via email/SMS',
            '4. Visit the store or get home delivery'
          ]
        };
      case 'offline_verification':
        return {
          title: 'Offline Purchase - Store Visit',
          description: 'You\'ll visit the store in person to complete your purchase.',
          steps: [
            '1. Confirm your reservation',
            '2. Receive your QR code via email/SMS',
            '3. Visit the store with the QR code',
            '4. Complete the purchase in person'
          ]
        };
      default:
        return {
          title: 'Online Booking',
          description: 'Complete your purchase online with secure payment processing.',
          steps: [
            '1. Confirm your reservation',
            '2. Complete secure online payment',
            '3. Receive confirmation via email/SMS',
            '4. Visit the store or get home delivery'
          ]
        };
    }
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

  // Payment functions
  const handleProceedToPayment = (reservation) => {
    setSelectedReservation(reservation)
    setPaymentDialog(true)
  }

  const handlePayment = async () => {
    try {
      setProcessingPayment(true)
      
      // For Razorpay integration
      if (paymentMethod === 'razorpay') {
        const amountPaise = Math.round((selectedReservation.itemId?.price || 0) * 100)
        const orderRes = await petShopAPI.createRazorpayOrder({ 
          amount: amountPaise, 
          currency: 'INR', 
          receipt: `reservation_${selectedReservation._id}_${Date.now()}` 
        })
        
        const { data, keyId } = orderRes.data
        const options = {
          key: keyId,
          amount: data.amount,
          currency: data.currency,
          name: 'Pet Shop Payment',
          description: `Payment for ${selectedReservation.itemId?.name || 'pet'}`,
          order_id: data.id,
          handler: async function (response) {
            try {
              const verifyRes = await petShopAPI.verifyRazorpay({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
              
              if (verifyRes.data?.success || verifyRes.data?.data?.valid) {
                // Payment successful, redirect to purchase decision
                setPaymentDialog(false)
                navigate(`/User/petshop/purchase-decision/${selectedReservation._id}`)
              } else {
                setSnackbar({
                  open: true,
                  message: 'Payment verification failed. If amount deducted, please contact support.',
                  severity: 'error'
                })
              }
            } catch (e) {
              setSnackbar({
                open: true,
                message: 'Payment verification error',
                severity: 'error'
              })
            }
          },
          prefill: {
            name: selectedReservation.contactInfo?.name || '',
            email: selectedReservation.contactInfo?.email || '',
            contact: selectedReservation.contactInfo?.phone || ''
          },
          theme: { color: '#0ea5ea' }
        }
        
        if (window.Razorpay) {
          const rzp = new window.Razorpay(options)
          rzp.open()
        } else {
          setSnackbar({
            open: true,
            message: 'Payment SDK not loaded',
            severity: 'error'
          })
        }
      } else {
        // For other payment methods, redirect to purchase decision
        setTimeout(() => {
          setPaymentDialog(false)
          navigate(`/User/petshop/purchase-decision/${selectedReservation._id}`)
        }, 2000)
      }
    } catch (e) {
      setSnackbar({
        open: true,
        message: e?.response?.data?.message || 'Failed to process payment',
        severity: 'error'
      })
    } finally {
      setProcessingPayment(false)
    }
  }

  // Handover functions
  const handleViewHandover = (reservation) => {
    setSelectedReservation(reservation)
    setHandoverDialog(true)
  }

  const handleVerifyOtp = async () => {
    try {
      // In a real implementation, this would call the API to verify the OTP
      // For now, we'll simulate a successful verification
      setTimeout(() => {
        setSnackbar({
          open: true,
          message: 'OTP verified successfully! You can now pick up your pet.',
          severity: 'success'
        })
        setHandoverDialog(false)
        fetchDashboardData() // Refresh to show updated status
      }, 1500)
    } catch (e) {
      setSnackbar({
        open: true,
        message: e?.response?.data?.message || 'Failed to verify OTP',
        severity: 'error'
      })
    }
  }

  const handleShowQrCode = () => {
    setHandoverData(prev => ({ ...prev, qrDialogOpen: true }))
  }

  // Define steps for the handover process
  const handoverSteps = [
    { 
      label: 'Reservation Confirmed', 
      status: ['paid', 'ready_pickup', 'completed'],
      description: 'Your reservation has been confirmed and payment processed.'
    },
    { 
      label: 'Preparation', 
      status: ['ready_pickup', 'completed'],
      description: 'The pet shop is preparing your pet for pickup.'
    },
    { 
      label: 'Ready for Pickup', 
      status: ['ready_pickup', 'completed'],
      description: 'Your pet is ready for pickup. Please visit the store with the required documents.'
    },
    { 
      label: 'Verification', 
      status: ['completed'],
      description: 'Verify your identity at the store using the OTP or QR code.'
    },
    { 
      label: 'Handover Complete', 
      status: ['completed'],
      description: 'Pet handover completed successfully. Enjoy your new companion!'
    }
  ]

  // Determine current step based on reservation status
  const getCurrentStep = () => {
    if (!selectedReservation) return 0
    
    const status = selectedReservation.status
    if (status === 'paid') return 0
    if (status === 'ready_pickup') return 2
    if (status === 'completed') return 4
    return 0
  }

  // Add the missing handleCancelReservation function
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
              {featuredPets.map((pet) => (
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

      {tabValue === 1 && (
        <Box>
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
                  onClick={() => document.getElementById('filters-dialog').style.display = 'block'}
                  sx={{ borderRadius: 2 }}
                >
                  Filters
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<SortIcon />}
                  onClick={() => document.getElementById('sort-dialog').style.display = 'block'}
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
                          color={isPetWishlisted(pet._id) ? "error" : "default"}
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

      {tabValue === 2 && (
        <Box>
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
                        startIcon={<StoreIcon />}
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

      {tabValue === 3 && (
        <Box>
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
                        <Accordion key={index} sx={{ mb: 1 }}>
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

      {/* Payment Dialog */}
      <Dialog 
        open={paymentDialog} 
        onClose={() => setPaymentDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Payment for {selectedReservation?.itemId?.name || 'Pet'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>Payment Method</Typography>
              
              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      mb: 2, 
                      borderColor: paymentMethod === 'razorpay' ? 'primary.main' : 'divider',
                      borderWidth: paymentMethod === 'razorpay' ? 2 : 1
                    }}
                  >
                    <CardContent>
                      <FormControlLabel 
                        value="razorpay" 
                        control={<Radio />} 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CreditCardIcon />
                            <Typography>Credit/Debit Card</Typography>
                          </Box>
                        }
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        Pay securely using your credit or debit card through Razorpay
                      </Typography>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      mb: 2, 
                      borderColor: paymentMethod === 'upi' ? 'primary.main' : 'divider',
                      borderWidth: paymentMethod === 'upi' ? 2 : 1
                    }}
                  >
                    <CardContent>
                      <FormControlLabel 
                        value="upi" 
                        control={<Radio />} 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <UpiIcon />
                            <Typography>UPI</Typography>
                          </Box>
                        }
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        Pay instantly using any UPI app
                      </Typography>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      mb: 2, 
                      borderColor: paymentMethod === 'netbanking' ? 'primary.main' : 'divider',
                      borderWidth: paymentMethod === 'netbanking' ? 2 : 1
                    }}
                  >
                    <CardContent>
                      <FormControlLabel 
                        value="netbanking" 
                        control={<Radio />} 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BankIcon />
                            <Typography>Net Banking</Typography>
                          </Box>
                        }
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        Pay directly from your bank account
                      </Typography>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      borderColor: paymentMethod === 'offline' ? 'primary.main' : 'divider',
                      borderWidth: paymentMethod === 'offline' ? 2 : 1
                    }}
                  >
                    <CardContent>
                      <FormControlLabel 
                        value="offline" 
                        control={<Radio />} 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <OfflineIcon />
                            <Typography>Offline Payment</Typography>
                          </Box>
                        }
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        Visit the store to make payment in person
                      </Typography>
                    </CardContent>
                  </Card>
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>Order Summary</Typography>
              <Card variant="outlined">
                <CardContent>
                  <Typography><strong>Pet:</strong> {selectedReservation?.itemId?.name}</Typography>
                  <Typography><strong>Price:</strong> ₹{selectedReservation?.itemId?.price?.toLocaleString()}</Typography>
                  <Typography><strong>Quantity:</strong> {selectedReservation?.quantity}</Typography>
                  <Typography><strong>Total:</strong> ₹{selectedReservation?.totalPrice?.toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePaymentSubmit}>Pay Now</Button>
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
          Reserve {selectedPet?.name || 'Pet'}
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={index} orientation="vertical">
            {reservationSteps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  {index === 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>Choose Reservation Type</Typography>
                      
                      <RadioGroup
                        value={reservationData.reservationType}
                        onChange={(e) => setReservationData(prev => ({
                          ...prev,
                          reservationType: e.target.value
                        }))}
                      >
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            mb: 2, 
                            borderColor: reservationData.reservationType === 'online_booking' ? 'primary.main' : 'divider',
                            borderWidth: reservationData.reservationType === 'online_booking' ? 2 : 1
                          }}
                        >
                          <CardContent>
                            <FormControlLabel 
                              value="online_booking" 
                              control={<Radio />} 
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <OnlineIcon />
                                  <Typography>Online Booking</Typography>
                                </Box>
                              }
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                              Complete your purchase online with secure payment processing.
                            </Typography>
                            
                            {reservationData.reservationType === 'online_booking' && (
                              <Box sx={{ ml: 4 }}>
                                <Typography variant="subtitle2" color="primary.main">Next Steps:</Typography>
                                <Typography variant="body2" component="div">
                                  <ol style={{ paddingLeft: 20, margin: '8px 0' }}>
                                    <li>Confirm your reservation</li>
                                    <li>Complete secure online payment</li>
                                    <li>Receive confirmation via email/SMS</li>
                                    <li>Visit the store or get home delivery</li>
                                  </ol>
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                        
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            borderColor: reservationData.reservationType === 'offline_verification' ? 'primary.main' : 'divider',
                            borderWidth: reservationData.reservationType === 'offline_verification' ? 2 : 1
                          }}
                        >
                          <CardContent>
                            <FormControlLabel 
                              value="offline_verification" 
                              control={<Radio />} 
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <OfflineIcon />
                                  <Typography>Offline Purchase - Store Visit</Typography>
                                </Box>
                              }
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                              You'll visit the store in person to complete your purchase.
                            </Typography>
                            
                            {reservationData.reservationType === 'offline_verification' && (
                              <Box sx={{ ml: 4 }}>
                                <Typography variant="subtitle2" color="primary.main">Next Steps:</Typography>
                                <Typography variant="body2" component="div">
                                  <ol style={{ paddingLeft: 20, margin: '8px 0' }}>
                                    <li>Confirm your reservation</li>
                                    <li>Receive your QR code via email/SMS</li>
                                    <li>Visit the store with the QR code</li>
                                    <li>Complete the purchase in person</li>
                                  </ol>
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </RadioGroup>
                    </Box>
                  )}

                  {index === 1 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>Enter Contact Information</Typography>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={reservationData.contactInfo.phone}
                        onChange={(e) => setReservationData(prev => ({
                          ...prev,
                          contactInfo: {
                            ...prev.contactInfo,
                            phone: e.target.value
                          }
                        }))}
                      />
                      <TextField
                        fullWidth
                        label="Email Address"
                        value={reservationData.contactInfo.email}
                        onChange={(e) => setReservationData(prev => ({
                          ...prev,
                          contactInfo: {
                            ...prev.contactInfo,
                            email: e.target.value
                          }
                        }))}
                        sx={{ mt: 2 }}
                      />
                    </Box>
                  )}

                  {index === 2 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>Choose Visit Details</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Preferred Date"
                            type="date"
                            value={reservationData.visitDetails.preferredDate}
                            onChange={(e) => setReservationData(prev => ({
                              ...prev,
                              visitDetails: {
                                ...prev.visitDetails,
                                preferredDate: e.target.value
                              }
                            }))}
                            InputLabelProps={{
                              shrink: true,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Preferred Time"
                            type="time"
                            value={reservationData.visitDetails.preferredTime}
                            onChange={(e) => setReservationData(prev => ({
                              ...prev,
                              visitDetails: {
                                ...prev.visitDetails,
                                preferredTime: e.target.value
                              }
                            }))}
                            InputLabelProps={{
                              shrink: true,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <FormControl fullWidth>
                            <InputLabel id="reservation-type-label">Reservation Type</InputLabel>
                            <Select
                              labelId="reservation-type-label"
                              id="reservation-type"
                              value={reservationData.reservationType}
                              label="Reservation Type"
                              onChange={(e) => setReservationData(prev => ({
                                ...prev,
                                reservationType: e.target.value
                              }))}
                            >
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
                          <Typography><strong>Type:</strong> {getReservationTypeDescription(reservationData.reservationType).title}</Typography>
                          <Typography><strong>Contact:</strong> {reservationData.contactInfo.phone} / {reservationData.contactInfo.email}</Typography>
                          <Typography><strong>Visit Date:</strong> {reservationData.visitDetails.preferredDate || 'Not specified'}</Typography>
                          <Typography><strong>Visit Time:</strong> {reservationData.visitDetails.preferredTime}</Typography>
                        </CardContent>
                      </Card>
                      
                      {/* Show additional information based on reservation type */}
                      {reservationData.reservationType === 'offline_verification' && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          <Typography variant="subtitle2">Offline Purchase Information</Typography>
                          <Typography variant="body2">
                            After confirming your reservation, you'll receive a QR code via email/SMS. 
                            Please bring this QR code when visiting the store to complete your purchase in person.
                          </Typography>
                        </Alert>
                      )}
                      
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
                      </Typography>
                    </CardContent>
                  </Card>
                </RadioGroup>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Order Summary</Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1">Base Price</Typography>
                    <Typography variant="body1">₹{(selectedReservation?.itemId?.price || 0).toLocaleString()}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="h6">Total Amount</Typography>
                    <Typography variant="h6">₹{(selectedReservation?.itemId?.price || 0).toLocaleString()}</Typography>
                  </Box>
                  
                  <Button 
                    variant="contained" 
                    size="large"
                    startIcon={<PaymentIcon />}
                    onClick={handlePayment}
                    disabled={processingPayment}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    {processingPayment ? <CircularProgress size={24} /> : 'Pay Now'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Handover Dialog */}
      <Dialog 
        open={handoverDialog} 
        onClose={() => setHandoverDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Handover Details for {selectedReservation?.itemId?.name || 'Pet'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>Handover Progress</Typography>
              
