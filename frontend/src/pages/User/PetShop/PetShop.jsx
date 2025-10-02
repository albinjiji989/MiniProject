import React, { useState, useEffect } from 'react'
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
  Alert
} from '@mui/material'
import {
  Search as SearchIcon,
  Store as StoreIcon,
  Pets as PetsIcon,
  ShoppingCart as ShoppingCartIcon,
  Build as ServicesIcon
} from '@mui/icons-material'
import { apiClient } from '../../../services/api'

const PetShop = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tabValue, setTabValue] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [petShops, setPetShops] = useState([])
  const [selectedShop, setSelectedShop] = useState(null)

  useEffect(() => {
    loadPetShops()
  }, [])

  const loadPetShops = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/petshop')
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Pet Shops
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Find the best pet shops near you for pets, products, and services
        </Typography>
      </Box>

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
                  boxShadow: 4
                }
              }}
            >
              <CardMedia
                component="div"
                sx={{
                  height: 200,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <StoreIcon sx={{ fontSize: 60, color: 'white', opacity: 0.8 }} />
              </CardMedia>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {shop.name}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {shop.address?.street}, {shop.address?.city}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`${shop.pets?.length || 0} Pets`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`${shop.products?.length || 0} Products`} 
                    size="small" 
                    color="secondary" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`${shop.services?.length || 0} Services`} 
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
                    onClick={() => setSelectedShop(shop)}
                  >
                    View Details
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
