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
  CircularProgress,
  Alert,
  Paper,
  useTheme
} from '@mui/material'
import {
  Search as SearchIcon,
  Store as StoreIcon,
  Pets as PetsIcon,
  Favorite as FavoriteIcon,
  BookOnline as ReserveIcon,
  TrendingUp as TrendingIcon,
  LocationOn as LocationIcon,
  Star as StarIcon
} from '@mui/icons-material'
import { petShopAPI } from '../../../services/api'
import { useAuth } from '../../../contexts/AuthContext'

const UserPetShopDashboard = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    totalPetShops: 0,
    availablePets: 0,
    myWishlist: 0,
    myReservations: 0
  })
  const [featuredPets, setFeaturedPets] = useState([])
  const [petShops, setPetShops] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load all data in parallel
      const [statsRes, petsRes, shopsRes] = await Promise.all([
        petShopAPI.getUserStats(),
        petShopAPI.listPublicListings({ limit: 8, status: 'available_for_sale' }),
        petShopAPI.listPublicShops({ limit: 6 })
      ])
      
      setStats({
        totalPetShops: statsRes.data.data.totalPetShops || 0,
        availablePets: statsRes.data.data.availableForSale || 0,
        myWishlist: statsRes.data.data.myWishlistItems || 0,
        myReservations: statsRes.data.data.myReservations || 0
      })
      
      setFeaturedPets(petsRes.data.data.items || [])
      setPetShops(shopsRes.data.data.petShops || [])
    } catch (err) {
      console.error('Dashboard data fetch error:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { 
      label: 'Browse Pets', 
      icon: <PetsIcon />, 
      onClick: () => navigate('/User/petshop/shop'),
      color: '#667eea'
    },
    { 
      label: 'My Wishlist', 
      icon: <FavoriteIcon />, 
      onClick: () => navigate('/User/petshop/wishlist'),
      color: '#f093fb'
    },
    { 
      label: 'My Reservations', 
      icon: <ReserveIcon />, 
      onClick: () => navigate('/User/petshop/reservations'),
      color: '#4facfe'
    }
  ]

  const statCards = [
    { 
      label: 'Pet Shops', 
      value: stats.totalPetShops, 
      icon: <StoreIcon sx={{ fontSize: 32 }} />,
      color: '#667eea'
    },
    { 
      label: 'Available Pets', 
      value: stats.availablePets, 
      icon: <PetsIcon sx={{ fontSize: 32 }} />,
      color: '#f093fb'
    },
    { 
      label: 'My Wishlist', 
      value: stats.myWishlist, 
      icon: <FavoriteIcon sx={{ fontSize: 32 }} />,
      color: '#4facfe'
    },
    { 
      label: 'My Reservations', 
      value: stats.myReservations, 
      icon: <ReserveIcon sx={{ fontSize: 32 }} />,
      color: '#43e97b'
    }
  ]

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
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
          Welcome to Pet Shop, {user?.name?.split(' ')[0] || 'Pet Lover'}!
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Find your perfect companion and everything you need for your pet
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={4} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                background: `linear-gradient(135deg, ${action.color} 0%, ${theme.palette.grey[800]} 100%)`,
                color: 'white',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)'
                }
              }}
              onClick={action.onClick}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {action.icon}
                  <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>
                    {action.label}
                  </Typography>
                </Box>
                <Typography variant="body2">
                  Access your {action.label.toLowerCase()} quickly
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box 
                    sx={{ 
                      width: 60, 
                      height: 60, 
                      borderRadius: '50%', 
                      backgroundColor: `${stat.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: stat.color
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Search Section */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, backgroundColor: theme.palette.grey[100] }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Find Your Perfect Pet
        </Typography>
        <TextField
          fullWidth
          placeholder="Search for pets by breed, species, or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              navigate(`/User/petshop/shop?search=${encodeURIComponent(searchTerm)}`)
            }
          }}
        />
        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          <Chip 
            label="Dogs" 
            onClick={() => navigate('/User/petshop/shop?species=dog')} 
            sx={{ cursor: 'pointer' }} 
          />
          <Chip 
            label="Cats" 
            onClick={() => navigate('/User/petshop/shop?species=cat')} 
            sx={{ cursor: 'pointer' }} 
          />
          <Chip 
            label="Birds" 
            onClick={() => navigate('/User/petshop/shop?species=bird')} 
            sx={{ cursor: 'pointer' }} 
          />
          <Chip 
            label="Small Pets" 
            onClick={() => navigate('/User/petshop/shop?species=small')} 
            sx={{ cursor: 'pointer' }} 
          />
        </Box>
      </Paper>

      {/* Featured Pets */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Featured Pets
          </Typography>
          <Button 
            variant="outlined" 
            endIcon={<TrendingIcon />}
            onClick={() => navigate('/User/petshop/shop')}
          >
            View All
          </Button>
        </Box>
        
        {featuredPets.length > 0 ? (
          <Grid container spacing={3}>
            {featuredPets.map((pet) => (
              <Grid item xs={12} sm={6} md={3} key={pet._id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 6
                    }
                  }}
                  onClick={() => navigate(`/User/petshop/pet/${pet._id}`)}
                >
                  <CardMedia
                    component="img"
                    height="180"
                    image={pet.images?.[0]?.url ? `/modules/petshop/uploads/${pet.images[0].url}` : '/placeholder-pet.svg'}
                    alt={pet.name || 'Pet'}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="div">
                        {pet.name || 'Unnamed Pet'}
                      </Typography>
                      <Chip 
                        label={`₹${pet.price?.toLocaleString() || 'N/A'}`} 
                        size="small" 
                        color="primary" 
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <StarIcon sx={{ color: 'gold', fontSize: 16, mr: 0.5 }} />
                      <Typography variant="body2">4.8 (24 reviews)</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PetsIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {pet.breedId?.name || 'Breed'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {pet.storeName || 'Pet Shop'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">
            No featured pets available at the moment. Check back later!
          </Alert>
        )}
      </Box>

      {/* Pet Shops */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Popular Pet Shops
          </Typography>
          <Button 
            variant="outlined" 
            endIcon={<StoreIcon />}
            onClick={() => navigate('/User/petshop')}
          >
            View All Shops
          </Button>
        </Box>
        
        {petShops.length > 0 ? (
          <Grid container spacing={3}>
            {petShops.map((shop) => (
              <Grid item xs={12} sm={6} md={4} key={shop._id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 6
                    }
                  }}
                  onClick={() => navigate(`/User/petshop/shop/${shop._id}`)}
                >
                  <CardMedia
                    component="img"
                    height="150"
                    image={shop.images?.[0]?.url ? `/modules/petshop/uploads/${shop.images[0].url}` : '/placeholder-shop.jpg'}
                    alt={shop.name}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="div">
                        {shop.name}
                      </Typography>
                      <Chip 
                        label="Verified" 
                        size="small" 
                        color="success" 
                        variant="outlined"
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {shop.address?.city || 'Location'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <StarIcon sx={{ color: 'gold', fontSize: 16, mr: 0.5 }} />
                      <Typography variant="body2">4.6 (128 reviews)</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Chip 
                        label={`${shop.stats?.pets || 0} Pets`} 
                        size="small" 
                        variant="outlined"
                      />
                      <Button size="small" variant="outlined">
                        Visit Shop
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">
            No pet shops available at the moment.
          </Alert>
        )}
      </Box>
    </Container>
  )
}

export default UserPetShopDashboard