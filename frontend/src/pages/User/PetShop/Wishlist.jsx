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
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  Pets as PetsIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material'
import { petShopAPI, resolveMediaUrl } from '../../../services/api'
import { handleApiError, showSuccessMessage, formatAge } from '../../../utils/notifications'

const Wishlist = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [wishlistItems, setWishlistItems] = useState([])

  const loadWishlist = async () => {
    try {
      setLoading(true)
      const res = await petShopAPI.listMyWishlist()
      setWishlistItems(res?.data?.data?.items || [])
    } catch (e) {
      const errorMessage = handleApiError(e, 'Failed to load wishlist')
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWishlist()
  }, [])

  const removeFromWishlist = async (itemId) => {
    try {
      await petShopAPI.removeFromWishlist(itemId)
      // Update local state
      setWishlistItems(prev => prev.filter(item => item.itemId !== itemId))
      showSuccessMessage('Pet removed from wishlist!')
    } catch (e) {
      handleApiError(e, 'Failed to remove from wishlist')
    }
  }

  const handleReserve = (petId) => {
    navigate(`/User/petshop/pet/${petId}`)
  }

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
      <Button 
        startIcon={<BackIcon />} 
        onClick={() => navigate(-1)} 
        sx={{ mb: 2 }}
      >
        Back
      </Button>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          My Wishlist
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Pets you've saved for later
        </Typography>
      </Box>

      {wishlistItems.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <PetsIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Your wishlist is empty
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Start adding pets you love to your wishlist
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/User/petshop/shop')}
          >
            Browse Pets
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {wishlistItems.map((wishlistItem) => {
            const pet = wishlistItem.itemId
            return (
              <Grid item xs={12} sm={6} md={4} key={wishlistItem._id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
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
                      <Tooltip title="Remove from wishlist">
                        <IconButton 
                          size="small" 
                          onClick={() => removeFromWishlist(pet._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {pet.speciesId?.displayName || pet.speciesId?.name || 'Species'} • {pet.breedId?.name || 'Breed'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Chip 
                        label={formatAge(pet.age, pet.ageUnit)} 
                        size="small" 
                        variant="outlined"
                      />
                      <Chip 
                        label={pet.gender} 
                        size="small" 
                        color={pet.gender === 'male' ? 'primary' : 'secondary'} 
                        variant="outlined"
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                        ₹{pet.price ? pet.price.toLocaleString() : 'N/A'}
                      </Typography>
                      <Chip 
                        label={pet.status} 
                        size="small" 
                        color={pet.status === 'available' ? 'success' : pet.status === 'reserved' ? 'warning' : 'default'} 
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                  
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button 
                      variant="contained" 
                      fullWidth
                      startIcon={<CartIcon />}
                      onClick={() => handleReserve(pet._id)}
                      disabled={pet.status !== 'available'}
                    >
                      {pet.status === 'available' ? 'Reserve Now' : 'Not Available'}
                    </Button>
                  </Box>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}
    </Container>
  )
}

export default Wishlist