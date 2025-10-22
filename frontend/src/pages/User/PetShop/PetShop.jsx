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
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material'
import {
  Search as SearchIcon,
  Store as StoreIcon,
  Pets as PetsIcon,
  ShoppingCart as ShoppingCartIcon,
  Build as ServicesIcon,
  LocationOn as LocationIcon,
  Star as StarIcon
} from '@mui/icons-material'
import { petShopAPI } from '../../../services/api'

const PetShop = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tabValue, setTabValue] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [petShops, setPetShops] = useState([])

  useEffect(() => {
    loadPetShops()
  }, [])

  const loadPetShops = async () => {
    try {
      setLoading(true)
      const response = await petShopAPI.listPublicShops()
      setPetShops(response.data.data.petShops || [])
    } catch (err) {
      setError('Failed to load pet shops')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  const filteredShops = petShops.filter(shop =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.address?.city?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
      {/* Hero Section */}
      <Paper 
        elevation={0}
        sx={{ 
          mb: 4, 
          p: 4, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          borderRadius: 2,
          color: 'white'
        }}
      >
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
          Find Your Perfect Pet Companion
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
          Discover pets, products, and services from trusted pet shops
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            size="large" 
            sx={{ bgcolor: 'white', color: '#667eea', fontWeight: 'bold' }}
            onClick={() => navigate('/User/petshop/shop')}
          >
            Browse Pets
          </Button>
          <Button 
            variant="outlined" 
            size="large" 
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
            onClick={() => navigate('/User/petshop/reservations')}
          >
            My Reservations
          </Button>
        </Box>
      </Paper>

      {/* Search Section */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search pet shops by name or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 600 }}
        />
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="All Shops" icon={<StoreIcon />} />
        <Tab label="Pets Available" icon={<PetsIcon />} />
        <Tab label="Products" icon={<ShoppingCartIcon />} />
        <Tab label="Services" icon={<ServicesIcon />} />
      </Tabs>

      <Grid container spacing={3}>
        {filteredShops.map((shop) => (
          <Grid item xs={12} md={6} lg={4} key={shop._id}>
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
              <CardMedia
                component="img"
                height="200"
                image={shop.images?.[0]?.url ? `/modules/petshop/uploads/${shop.images[0].url}` : '/placeholder-shop.jpg'}
                alt={shop.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {shop.name}
                  </Typography>
                  <Chip 
                    label="Verified" 
                    size="small" 
                    color="success" 
                    variant="outlined"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {shop.address?.city || 'Location not specified'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <StarIcon sx={{ color: 'gold', fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body2">
                    4.5 (128 reviews)
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`${shop.stats?.pets || 0} Pets`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`${shop.stats?.products || 0} Products`} 
                    size="small" 
                    color="secondary" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`${shop.stats?.services || 0} Services`} 
                    size="small" 
                    color="success" 
                    variant="outlined"
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Capacity: {shop.capacity?.current || 0}/{shop.capacity?.total || 0}
                  </Typography>
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={() => navigate(`/User/petshop/shop/${shop._id}`)}
                  >
                    View Shop
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredShops.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <StoreIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No pet shops found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search criteria
          </Typography>
        </Box>
      )}
    </Container>
  )
}

export default PetShop
