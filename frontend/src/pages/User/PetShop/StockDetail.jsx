import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
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
  CircularProgress,
  Alert,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Stack,
  Paper,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Breadcrumbs,
  Link,
  useTheme,
  alpha
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  ShoppingCart as CartIcon,
  Pets as PetsIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Info as InfoIcon,
  LocalOffer as OfferIcon,
  Check as CheckIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  Store as StoreIcon,
  Security as SecurityIcon,
  LocalShipping as ShippingIcon,
  VerifiedUser as VerifiedIcon
} from '@mui/icons-material'
import { petShopStockAPI, resolveMediaUrl } from '../../../services/api'
import { handleApiError } from '../../../utils/notifications'
import PurchaseApplicationForm from './PurchaseApplicationForm'

const StockDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stock, setStock] = useState(null)
  const [maleCount, setMaleCount] = useState(0)
  const [femaleCount, setFemaleCount] = useState(0)
  const [selectedGender, setSelectedGender] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)

  // Load stock details
  const loadStock = async () => {
    try {
      setLoading(true)
      const response = await petShopStockAPI.getPublicStockById(id)
      const stockData = response.data.data.stock
      setStock(stockData)
      
      // Check if favorite
      const favorites = JSON.parse(localStorage.getItem('petshop_favorites') || '[]')
      setIsFavorite(favorites.includes(id))
    } catch (err) {
      handleApiError(err, 'Failed to load stock details')
      setError('Failed to load stock details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStock()
  }, [id])
  
  useEffect(() => {
    // Check for preferred gender from URL
    const params = new URLSearchParams(location.search)
    const g = params.get('gender')
    if (g && stock) {
      const genderLower = g.toLowerCase()
      if (genderLower === 'male' && stock.maleCount > 0) {
        setSelectedGender('male')
        setMaleCount(1)
      } else if (genderLower === 'female' && stock.femaleCount > 0) {
        setSelectedGender('female')
        setFemaleCount(1)
      }
    }
  }, [location.search, stock])
  
  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('petshop_favorites') || '[]')
    if (isFavorite) {
      const updated = favorites.filter(fid => fid !== id)
      localStorage.setItem('petshop_favorites', JSON.stringify(updated))
      setIsFavorite(false)
    } else {
      favorites.push(id)
      localStorage.setItem('petshop_favorites', JSON.stringify(favorites))
      setIsFavorite(true)
    }
  }

  const handlePurchase = () => {
    // Validate selection
    if (!selectedGender) {
      alert('Please select a gender first')
      return
    }
    
    const count = selectedGender === 'male' ? maleCount : femaleCount
    if (count === 0) {
      alert('Please select at least one pet to purchase')
      return
    }
    
    if (selectedGender === 'male' && maleCount > (stock?.maleCount || 0)) {
      alert(`Only ${stock?.maleCount} male pets available`)
      return
    }
    
    if (selectedGender === 'female' && femaleCount > (stock?.femaleCount || 0)) {
      alert(`Only ${stock?.femaleCount} female pets available`)
      return
    }
    
    setOpenDialog(true)
  }
  
  const handleQuantityChange = (gender, action) => {
    if (gender === 'male') {
      if (action === 'increment' && maleCount < stock.maleCount) {
        setMaleCount(prev => prev + 1)
        setSelectedGender('male')
      } else if (action === 'decrement' && maleCount > 0) {
        setMaleCount(prev => prev - 1)
      }
    } else {
      if (action === 'increment' && femaleCount < stock.femaleCount) {
        setFemaleCount(prev => prev + 1)
        setSelectedGender('female')
      } else if (action === 'decrement' && femaleCount > 0) {
        setFemaleCount(prev => prev - 1)
      }
    }
  }

  const handleApplicationSuccess = (application) => {
    // Show success message and navigate to applications page
    alert('Application submitted successfully! You will be notified once reviewed.')
    navigate('/User/petshop/my-applications')
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }
  
  const getTotalPrice = () => {
    return (maleCount + femaleCount) * stock?.price || 0
  }
  
  const getImages = () => {
    const images = []
    if (stock?.maleImages?.length > 0) {
      stock.maleImages.forEach(img => images.push({ url: img, gender: 'Male' }))
    }
    if (stock?.femaleImages?.length > 0) {
      stock.femaleImages.forEach(img => images.push({ url: img, gender: 'Female' }))
    }
    if (images.length === 0 && stock?.images?.length > 0) {
      stock.images.forEach(img => images.push({ url: img, gender: 'Unspecified' }))
    }
    return images
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/User/petshop/dashboard')}>
          Back to Dashboard
        </Button>
      </Container>
    )
  }

  if (!stock) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>Stock not found</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/User/petshop/dashboard')}>
          Back to Dashboard
        </Button>
      </Container>
    )
  }

  const allImages = getImages()
  const totalCount = maleCount + femaleCount

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', pb: 6 }}>
      {/* Breadcrumb Navigation */}
      <Box sx={{ bgcolor: 'white', borderBottom: 1, borderColor: 'divider', py: 2 }}>
        <Container maxWidth="lg">
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
            <Link 
              color="inherit" 
              href="#" 
              onClick={(e) => { e.preventDefault(); navigate('/User/dashboard'); }}
              sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
              Home
            </Link>
            <Link 
              color="inherit" 
              href="#" 
              onClick={(e) => { e.preventDefault(); navigate('/User/petshop/dashboard'); }}
              sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
            >
              <StoreIcon sx={{ mr: 0.5 }} fontSize="small" />
              Pet Shop
            </Link>
            <Typography color="text.primary">{stock.name}</Typography>
          </Breadcrumbs>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          {/* Left Column - Images */}
          <Grid item xs={12} md={7}>
            <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: 'white' }}>
              {/* Main Image */}
              <Box sx={{ position: 'relative', bgcolor: '#f9fafb' }}>
                <CardMedia
                  component="img"
                  sx={{ 
                    width: '100%', 
                    height: { xs: 350, md: 500 }, 
                    objectFit: 'contain',
                    p: 2
                  }}
                  image={
                    allImages[selectedImage]
                      ? resolveMediaUrl(allImages[selectedImage].url?.url || allImages[selectedImage].url)
                      : '/placeholder-pet.svg'
                  }
                  alt={stock.name}
                />
                
                {/* Favorite Button */}
                <IconButton
                  onClick={toggleFavorite}
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    bgcolor: 'white',
                    boxShadow: 2,
                    '&:hover': { bgcolor: 'white', transform: 'scale(1.1)' }
                  }}
                >
                  {isFavorite ? (
                    <FavoriteIcon color="error" />
                  ) : (
                    <FavoriteBorderIcon />
                  )}
                </IconButton>
                
                {/* Gender Badge */}
                {allImages[selectedImage]?.gender && (
                  <Chip
                    icon={allImages[selectedImage].gender === 'Male' ? <MaleIcon /> : <FemaleIcon />}
                    label={allImages[selectedImage].gender}
                    color={allImages[selectedImage].gender === 'Male' ? 'primary' : 'secondary'}
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      left: 16
                    }}
                  />
                )}
              </Box>
              
              {/* Thumbnail Gallery */}
              {allImages.length > 1 && (
                <Box sx={{ p: 2, display: 'flex', gap: 1, overflowX: 'auto' }}>
                  {allImages.map((img, idx) => (
                    <Box
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      sx={{
                        minWidth: 80,
                        height: 80,
                        borderRadius: 1,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: selectedImage === idx ? 2 : 1,
                        borderColor: selectedImage === idx ? 'primary.main' : 'divider',
                        transition: 'all 0.2s',
                        '&:hover': { transform: 'scale(1.05)' }
                      }}
                    >
                      <img
                        src={resolveMediaUrl(img.url?.url || img.url) || '/placeholder-pet.svg'}
                        alt={`${stock.name} ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
              
              {/* Tabs for Details */}
              <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                  <Tab label="Description" />
                  <Tab label="Details" />
                  <Tab label="Care Info" />
                </Tabs>
                
                <Box sx={{ p: 3 }}>
                  {activeTab === 0 && (
                    <Stack spacing={2}>
                      <Typography variant="h6" gutterBottom>
                        About this Batch
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        This batch contains {stock.maleCount + stock.femaleCount} pets of the same breed, age, and characteristics.
                        Each pet will receive a unique identification code upon purchase.
                      </Typography>
                      <Box>
                        <Chip label={`${stock.maleCount + stock.femaleCount} Total Pets`} icon={<PetsIcon />} sx={{ mr: 1 }} />
                        <Chip label={stock.category || 'Pet'} color="primary" variant="outlined" />
                      </Box>
                    </Stack>
                  )}
                  
                  {activeTab === 1 && (
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                        <Typography color="text.secondary">Species</Typography>
                        <Typography fontWeight={600}>{stock.species?.displayName || stock.species?.name || 'N/A'}</Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                        <Typography color="text.secondary">Breed</Typography>
                        <Typography fontWeight={600}>{stock.breed?.name || 'N/A'}</Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                        <Typography color="text.secondary">Age</Typography>
                        <Typography fontWeight={600}>{stock.age} {stock.ageUnit || 'months'}</Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                        <Typography color="text.secondary">Color</Typography>
                        <Typography fontWeight={600}>{stock.color || 'Various'}</Typography>
                      </Box>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                        <Typography color="text.secondary">Size</Typography>
                        <Typography fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                          {stock.size || 'Medium'}
                        </Typography>
                      </Box>
                    </Stack>
                  )}
                  
                  {activeTab === 2 && (
                    <Stack spacing={2}>
                      <Alert severity="info" icon={<InfoIcon />}>
                        Each pet comes with basic health certification and care guidelines.
                      </Alert>
                      <Typography variant="body2" color="text.secondary">
                        • Regular veterinary check-ups recommended<br />
                        • Proper nutrition and exercise required<br />
                        • Vaccination schedule will be provided<br />
                        • Suitable for families and individuals
                      </Typography>
                    </Stack>
                  )}
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Right Column - Purchase Options */}
          <Grid item xs={12} md={5}>
            <Stack spacing={2}>
              {/* Title Card */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: 'white' }}>
                <Typography variant="h4" gutterBottom fontWeight={700}>
                  {stock.name}
                </Typography>
                
                {stock.category && (
                  <Chip 
                    label={stock.category} 
                    color="primary" 
                    size="small"
                    sx={{ mb: 2 }}
                  />
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 2 }}>
                  <Typography variant="h4" color="primary" fontWeight={700}>
                    {formatPrice(stock.price)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    per pet
                  </Typography>
                </Box>
                
                {stock.discountPrice && stock.discountPrice < stock.price && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography 
                      variant="body1" 
                      sx={{ textDecoration: 'line-through' }}
                      color="text.secondary"
                    >
                      {formatPrice(stock.discountPrice)}
                    </Typography>
                    <Chip 
                      label={`${Math.round((1 - stock.discountPrice / stock.price) * 100)}% OFF`}
                      color="error" 
                      size="small"
                      icon={<OfferIcon />}
                    />
                  </Box>
                )}
                
                <Typography variant="body2" color="text.secondary">
                  {stock.storeName || 'Pet Shop'}
                </Typography>
              </Paper>

              {/* Stock Availability */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: 'white' }}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Available Pets
                </Typography>
                
                <Grid container spacing={2}>
                  {/* Male Selection */}
                  <Grid item xs={6}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        p: 2,
                        borderColor: selectedGender === 'male' ? 'primary.main' : 'divider',
                        borderWidth: selectedGender === 'male' ? 2 : 1,
                        bgcolor: selectedGender === 'male' ? alpha(theme.palette.primary.main, 0.05) : 'transparent'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Badge badgeContent={stock.maleCount} color="primary" max={999}>
                          <MaleIcon color="primary" sx={{ fontSize: 32 }} />
                        </Badge>
                        <Typography variant="h6" sx={{ ml: 1 }} fontWeight={600}>
                          Male
                        </Typography>
                      </Box>
                      
                      <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                        {stock.maleCount} available
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleQuantityChange('male', 'decrement')}
                          disabled={maleCount === 0}
                        >
                          <RemoveIcon />
                        </IconButton>
                        
                        <TextField
                          value={maleCount}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0
                            setMaleCount(Math.max(0, Math.min(val, stock.maleCount)))
                          }}
                          inputProps={{ 
                            min: 0, 
                            max: stock.maleCount,
                            style: { textAlign: 'center' }
                          }}
                          sx={{ width: 60 }}
                          size="small"
                        />
                        
                        <IconButton 
                          size="small" 
                          onClick={() => handleQuantityChange('male', 'increment')}
                          disabled={maleCount >= stock.maleCount}
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>
                    </Card>
                  </Grid>
                  
                  {/* Female Selection */}
                  <Grid item xs={6}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        p: 2,
                        borderColor: selectedGender === 'female' ? 'secondary.main' : 'divider',
                        borderWidth: selectedGender === 'female' ? 2 : 1,
                        bgcolor: selectedGender === 'female' ? alpha(theme.palette.secondary.main, 0.05) : 'transparent'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Badge badgeContent={stock.femaleCount} color="secondary" max={999}>
                          <FemaleIcon color="secondary" sx={{ fontSize: 32 }} />
                        </Badge>
                        <Typography variant="h6" sx={{ ml: 1 }} fontWeight={600}>
                          Female
                        </Typography>
                      </Box>
                      
                      <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                        {stock.femaleCount} available
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleQuantityChange('female', 'decrement')}
                          disabled={femaleCount === 0}
                        >
                          <RemoveIcon />
                        </IconButton>
                        
                        <TextField
                          value={femaleCount}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0
                            setFemaleCount(Math.max(0, Math.min(val, stock.femaleCount)))
                          }}
                          inputProps={{ 
                            min: 0, 
                            max: stock.femaleCount,
                            style: { textAlign: 'center' }
                          }}
                          sx={{ width: 60 }}
                          size="small"
                        />
                        
                        <IconButton 
                          size="small" 
                          onClick={() => handleQuantityChange('female', 'increment')}
                          disabled={femaleCount >= stock.femaleCount}
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>

              {/* Order Summary */}
              {totalCount > 0 && (
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    borderRadius: 2, 
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    border: 1,
                    borderColor: 'primary.main'
                  }}
                >
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Order Summary
                  </Typography>
                  
                  {maleCount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        <MaleIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                        {maleCount} Male {maleCount > 1 ? 'pets' : 'pet'}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatPrice(maleCount * stock.price)}
                      </Typography>
                    </Box>
                  )}
                  
                  {femaleCount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        <FemaleIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                        {femaleCount} Female {femaleCount > 1 ? 'pets' : 'pet'}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatPrice(femaleCount * stock.price)}
                      </Typography>
                    </Box>
                  )}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight={700}>
                      Total
                    </Typography>
                    <Typography variant="h6" color="primary" fontWeight={700}>
                      {formatPrice(getTotalPrice())}
                    </Typography>
                  </Box>
                  
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<CartIcon />}
                    onClick={handlePurchase}
                    sx={{ 
                      py: 1.5,
                      fontWeight: 600,
                      fontSize: '1.1rem'
                    }}
                  >
                    Purchase Now
                  </Button>
                </Paper>
              )}
              
              {totalCount === 0 && (
                <Alert severity="info" icon={<InfoIcon />}>
                  Select at least one pet to proceed with purchase
                </Alert>
              )}

              {/* Trust Badges */}
              <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'white' }}>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedIcon color="success" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      Verified Healthy Pets
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon color="primary" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      Secure Payment Gateway
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShippingIcon color="info" fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      Safe Delivery Available
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>

      {/* Purchase Application Form */}
      <PurchaseApplicationForm
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        stock={stock}
        selectedGender={selectedGender}
        quantity={selectedGender === 'male' ? maleCount : femaleCount}
        onSuccess={handleApplicationSuccess}
      />
    </Box>
  )
}

export default StockDetail