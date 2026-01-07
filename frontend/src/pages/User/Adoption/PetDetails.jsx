import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Grid, 
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  useTheme,
  useMediaQuery,
  alpha,
  Paper
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
  Pets as PetsIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  LocationOn as LocationIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon
} from '@mui/icons-material'
import { adoptionAPI, resolveMediaUrl } from '../../../services/api'

const PetDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [pet, setPet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    const loadPet = async () => {
      try {
        setLoading(true)
        setError('')
        
        // Use the public pet endpoint for available pets
        const res = await adoptionAPI.getPet(id)
        const petData = res.data?.data || res.data
        console.log('Pet data received:', petData)
        setPet(petData)
        
        // Set first image as selected
        if (petData.images && petData.images.length > 0) {
          setSelectedImage(0)
        }
      } catch (e) {
        console.error('Failed to load pet details:', e)
        setError(e?.response?.data?.message || 'Failed to load pet details')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadPet()
    }
  }, [id])

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error || !pet) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Pet not found'}
        </Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/User/adoption')}>
          Back to Adoption
        </Button>
      </Container>
    )
  }

  const images = pet.images || []
  const currentImage = images[selectedImage] || {}

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back Button */}
      <Button 
        startIcon={<BackIcon />} 
        onClick={() => navigate('/User/adoption')}
        sx={{ mb: 3 }}
      >
        Back to Adoption
      </Button>

      <Grid container spacing={3}>
        {/* Left: Images */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            {/* Main Image */}
            <Box 
              sx={{ 
                position: 'relative',
                width: '100%', 
                height: 400, 
                bgcolor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {images.length > 0 ? (
                <img 
                  src={resolveMediaUrl(currentImage.url || currentImage)} 
                  alt={pet.name || 'Pet'} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-pet.svg'
                  }}
                />
              ) : (
                <Box sx={{ textAlign: 'center' }}>
                  <PetsIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
                  <Typography color="text.secondary">No image available</Typography>
                </Box>
              )}
              
              {/* Favorite Button */}
              <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setIsFavorite(!isFavorite)}
                  sx={{ 
                    bgcolor: 'white',
                    color: isFavorite ? 'error.main' : 'grey.700',
                    '&:hover': { bgcolor: 'grey.100' },
                    minWidth: 'auto',
                    p: 1
                  }}
                >
                  {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </Button>
              </Box>
            </Box>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <Box sx={{ display: 'flex', gap: 1, p: 2, overflowX: 'auto' }}>
                {images.map((img, idx) => (
                  <Box
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    sx={{
                      width: 80,
                      height: 80,
                      flexShrink: 0,
                      cursor: 'pointer',
                      border: 2,
                      borderColor: selectedImage === idx ? 'primary.main' : 'transparent',
                      borderRadius: 1,
                      overflow: 'hidden',
                      transition: 'border-color 0.2s',
                      '&:hover': { borderColor: 'primary.light' }
                    }}
                  >
                    <img 
                      src={resolveMediaUrl(img.url || img)} 
                      alt={`${pet.name} ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-pet.svg'
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right: Details */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" fontWeight={700} gutterBottom>
                    {pet.name || 'Unnamed Pet'}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {pet.breed} • {pet.species}
                  </Typography>
                </Box>
                <Avatar 
                  sx={{ 
                    bgcolor: pet.gender === 'Male' ? 'info.main' : 'pink.400',
                    width: 56,
                    height: 56
                  }}
                >
                  {pet.gender === 'Male' ? <MaleIcon /> : <FemaleIcon />}
                </Avatar>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Basic Info */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Age
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {pet.ageDisplay || `${pet.age} ${pet.ageUnit}`}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Gender
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {pet.gender}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Size
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {pet.size || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Color
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {pet.color || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Health & Vaccination */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Health Status
                </Typography>
                <Chip 
                  label={pet.healthStatus || 'Unknown'} 
                  color={pet.healthStatus === 'Healthy' ? 'success' : 'warning'}
                  size="small"
                  sx={{ mb: 2 }}
                />
                
                {pet.vaccinationStatus && Array.isArray(pet.vaccinationStatus) && pet.vaccinationStatus.length > 0 && (
                  <>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Vaccinations
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {pet.vaccinationStatus.map((vaccine, idx) => (
                        <Chip 
                          key={idx}
                          label={vaccine}
                          size="small"
                          icon={<CheckCircleIcon />}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Description */}
              {pet.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    About {pet.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pet.description}
                  </Typography>
                </Box>
              )}

              {/* Adoption Fee */}
              <Box 
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  p: 2,
                  borderRadius: 2,
                  mb: 3
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block">
                  Adoption Fee
                </Typography>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  ₹{pet.adoptionFee || 0}
                </Typography>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => navigate(`/User/adoption/wizard/${pet._id}/applicant`)}
                  sx={{ py: 1.5 }}
                >
                  Apply for Adoption
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default PetDetails
