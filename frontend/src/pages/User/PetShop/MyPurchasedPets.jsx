import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { petShopAPI, resolveMediaUrl } from '../../../services/api'
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  Chip, 
  Button, 
  CircularProgress,
  Avatar,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material'
import {
  MoreVert as MoreVertIcon,
  CalendarToday as CalendarIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Help as HelpIcon,
  Pets as PetsIcon
} from '@mui/icons-material'

export default function MyPurchasedPets() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [pets, setPets] = useState([])
  const [error, setError] = useState('')
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [selectedPet, setSelectedPet] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await petShopAPI.getMyPurchasedPets()
        console.log('Purchased pets API response:', res)
        const raw = res?.data?.data?.pets || []
        console.log('Raw purchased pets data:', raw)
        const normalized = raw.map(pet => ({
          id: pet._id || pet.id,
          petCode: pet.petCode,
          name: pet.name || 'Pet',
          species: (typeof pet.species === 'object' && pet.species !== null) ? (pet.species.name || pet.species.displayName || '-') : (pet.species || '-'),
          breed: (typeof pet.breed === 'object' && pet.breed !== null) ? (pet.breed.name || '-') : (pet.breed || '-'),
          gender: pet.gender || '-',
          image: resolveMediaUrl(pet?.images?.[0]?.url || ''),
          purchaseDate: pet.acquiredDate ? new Date(pet.acquiredDate).toLocaleDateString() : '-',
          description: pet.description || ''
        }))
        console.log('Normalized purchased pets data:', normalized)
        setPets(normalized)
      } catch (e) {
        setError('Failed to load purchased pets')
        console.error('Error loading purchased pets:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleMenuOpen = (event, pet) => {
    event.stopPropagation()
    setMenuAnchor(event.currentTarget)
    setSelectedPet(pet)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setSelectedPet(null)
  }

  const handleViewDetails = () => {
    if (selectedPet) {
      navigate(`/User/petshop/my-purchased-pets/${selectedPet.id || selectedPet.petCode}`)
    }
    handleMenuClose()
  }

  const getGenderIcon = (gender) => {
    switch (gender?.toLowerCase()) {
      case 'male':
        return <MaleIcon sx={{ fontSize: 16, color: 'primary.main' }} />
      case 'female':
        return <FemaleIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
      default:
        return <HelpIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>My Purchased Pets</Typography>
      </Box>
      
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {!loading && pets.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>You haven't purchased any pets yet.</Typography>
          <Button variant="contained" onClick={() => navigate('/User/petshop')}>Buy a Pet</Button>
        </Box>
      )}
      
      <Grid container spacing={3}>
        {pets.map((pet) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={pet.id || pet.petCode}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
              onClick={() => navigate(`/User/petshop/my-purchased-pets/${pet.id || pet.petCode}`)}
            >
              {/* Menu Button */}
              <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                <IconButton 
                  size="small" 
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }
                  }}
                  onClick={(e) => handleMenuOpen(e, pet)}
                >
                  <MoreVertIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
              
              {pet.image ? (
                <CardMedia 
                  component="img" 
                  height="180" 
                  image={pet.image} 
                  alt={pet.name} 
                  sx={{ objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.src = '/placeholder-pet.svg' }}
                />
              ) : (
                <Box sx={{ 
                  height: 180, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: 'grey.100'
                }}>
                  <Typography variant="h3" color="text.secondary">🐾</Typography>
                </Box>
              )}
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>{pet.name}</Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {getGenderIcon(pet.gender)}
                  <Typography variant="body2" color="text.secondary">
                    {pet.gender} • {pet.breed}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Species: {pet.species}
                </Typography>
                
                <Chip 
                  size="small" 
                  label={`Purchased on ${pet.purchaseDate}`} 
                  sx={{ mb: 1 }}
                />
                
                {pet.description && (
                  <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                    {pet.description}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleViewDetails}>
          View Details
        </MenuItem>
      </Menu>
    </Box>
  )
}