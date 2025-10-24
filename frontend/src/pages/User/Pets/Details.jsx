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
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Chip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  useTheme,
  alpha,
  useMediaQuery
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  MedicalServices as MedicalIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
  Help as HelpIcon,
  Pets as PetsIcon
} from '@mui/icons-material'
import { userPetsAPI, petsAPI, resolveMediaUrl, apiClient } from '../../../services/api'

const UserPetDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [pet, setPet] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [medicalHistory, setMedicalHistory] = useState([])
  const [medicalHistoryLoading, setMedicalHistoryLoading] = useState(false)

  const loadPet = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log(`🔍 Fetching pet with ID: ${id} for user: ${localStorage.getItem('userId') || 'unknown'}`)
      
      // First try to load from centralized registry (for pets from petshop/adoption)
      try {
        const res = await petsAPI.getPet(id)
        const petData = res.data?.data?.pet || res.data?.data || res.data
        console.log('✅ Pet data received from centralized registry:', petData)
        setPet(petData)
        
        // Load medical history
        loadMedicalHistory()
        return
      } catch (centralizedError) {
        console.log('❌ Failed to load from centralized registry, trying registry by ID:', centralizedError.message)
        // If that fails, try to get from registry by ID
        try {
          const res = await petsAPI.getRegistryPet(id)
          const petData = res.data?.data?.pet || res.data?.data || res.data
          console.log('✅ Pet data received from registry by ID:', petData)
          setPet(petData)
          
          // Load medical history
          loadMedicalHistory()
          return
        } catch (registryError) {
          console.log('❌ Failed to load from registry by ID, trying userPetsAPI:', registryError.message)
          // If that fails, try userPetsAPI (for user-created pets)
          try {
            const res = await userPetsAPI.get(id)
            const petData = res.data?.data || res.data?.pet || res.data
            console.log('✅ Pet data received from userPetsAPI:', petData)
            setPet(petData)
            
            // Load medical history
            loadMedicalHistory()
            return
          } catch (userError) {
            console.log('❌ Failed to load from userPetsAPI:', userError.message)
            // Last resort: check if this might be a reservation ID
            try {
              const reservationRes = await apiClient.get(`/petshop/user/public/reservations/${id}`)
              const reservation = reservationRes.data?.data?.reservation
              if (reservation && reservation.itemId) {
                console.log('💡 Found reservation, redirecting to item ID:', reservation.itemId._id)
                // Redirect to the actual pet ID
                navigate(`/User/pets/${reservation.itemId._id}`, { replace: true })
                return
              }
            } catch (reservationError) {
              console.log('Reservation check failed:', reservationError.message)
            }
            
            console.log('❌ Pet not found for ID:', id)
            throw new Error('Pet not found in any system. Please check the ID or contact support.')
          }
        }
      }
    } catch (e) {
      setError(e?.message || 'Failed to load pet. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const loadMedicalHistory = async () => {
    try {
      setMedicalHistoryLoading(true)
      // Try to load medical history from centralized registry first
      try {
        const res = await petsAPI.getHistory(id)
        setMedicalHistory(res.data?.data?.history || res.data?.data?.medicalHistory || [])
      } catch (centralizedError) {
        // Fall back to userPetsAPI
        try {
          const res = await userPetsAPI.getMedicalHistory(id)
          setMedicalHistory(res.data?.data?.medicalHistory || [])
        } catch (userError) {
          console.log('Failed to load medical history from both APIs:', { centralizedError, userError })
          setMedicalHistory([])
        }
      }
    } catch (e) {
      console.error('Failed to load medical history:', e)
    } finally {
      setMedicalHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadPet()
  }, [id])

  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
  }

  const handleEdit = () => {
    handleMenuClose()
    // Determine which edit route to use based on pet source
    if (pet?.source === 'core' || !pet?.source) {
      // User-created pet
      navigate(`/User/pets/${id}/edit`)
    } else {
      // Pet from petshop or adoption
      navigate(`/User/pets/${id}/edit-basic`)
    }
  }

  const handleDeleteClick = () => {
    handleMenuClose()
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true)
      setDeleteError('')
      
      // Only user-created pets can be deleted
      if (pet?.source === 'core' || !pet?.source) {
        await userPetsAPI.delete(id)
        navigate('/User/pets', { state: { message: 'Pet deleted successfully' } })
      } else {
        setDeleteError('Only manually added pets can be deleted. Pets from pet shop or adoption cannot be deleted.')
      }
    } catch (e) {
      setDeleteError(e?.response?.data?.message || 'Failed to delete pet')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setDeleteError('')
  }

  const getPrimaryImageUrl = () => {
    try {
      console.log('Getting primary image URL for pet:', pet?.name, 'Images:', pet?.images);
      if (pet.images && Array.isArray(pet.images) && pet.images.length > 0) {
        const primaryImage = pet.images.find(img => img?.isPrimary) || pet.images[0];
        console.log('Selected primary image:', primaryImage);
        if (primaryImage?.url) {
          const url = resolveMediaUrl(primaryImage.url);
          console.log('Resolved image URL:', url);
          return url;
        }
      }
    } catch (error) {
      console.error('Error getting primary image URL:', error);
    }
    return '/placeholder-pet.svg';
  };

  const getGenderIcon = (gender) => {
    switch (gender?.toLowerCase()) {
      case 'male':
        return <MaleIcon sx={{ fontSize: 18, color: 'primary.main' }} />
      case 'female':
        return <FemaleIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
      default:
        return <HelpIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
    }
  }

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/User/pets')}>
          Back to Pets
        </Button>
      </Container>
    )
  }

  if (!pet) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>Pet not found</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/User/pets')}>
          Back to Pets
        </Button>
      </Container>
    )
  }

  return (
    <Container sx={{ py: { xs: 2, sm: 4 } }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2
      }}>
        <Button 
          variant="outlined" 
          startIcon={<BackIcon />} 
          onClick={() => navigate('/User/pets')}
          sx={{ alignSelf: 'flex-start' }}
        >
          Back to My Pets
        </Button>
        <IconButton 
          onClick={handleMenuOpen}
          sx={{ 
            bgcolor: 'background.paper',
            boxShadow: 2,
            '&:hover': { bgcolor: 'background.paper' }
          }}
        >
          <MoreVertIcon />
        </IconButton>
      </Box>

      <Card sx={{ mb: 3, boxShadow: 4 }}>
        <CardContent>
          <Grid container spacing={4}>
            {/* Pet Image */}
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 200,
                    height: 200,
                    margin: '0 auto 16px',
                    border: `6px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    boxShadow: 4,
                    bgcolor: 'background.paper'
                  }}
                  src={getPrimaryImageUrl()}
                  onError={(e) => { e.currentTarget.src = '/placeholder-pet.svg' }}
                >
                  <PetsIcon sx={{ fontSize: 80, color: 'primary.main' }} />
                </Avatar>
                
                {pet.currentStatus && (
                  <Chip 
                    label={pet.currentStatus} 
                    color={pet.currentStatus === 'Available' ? 'success' : 'default'}
                    size="medium"
                    sx={{ 
                      fontWeight: 700,
                      fontSize: '1rem',
                      height: 32
                    }}
                  />
                )}
              </Box>
            </Grid>
            
            {/* Pet Details */}
            <Grid item xs={12} md={8}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  {pet.name}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getGenderIcon(pet.gender)}
                    <Typography variant="h6" color="text.secondary">
                      {pet.gender || 'Unknown'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="h6" color="text.secondary">
                      {pet.age || '-'} {pet.ageUnit || 'months'}
                    </Typography>
                  </Box>
                </Box>
                
                {pet.petCode && (
                  <Box sx={{ 
                    display: 'inline-block',
                    p: 1,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: 1,
                    mb: 2
                  }}>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      Pet Code: {pet.petCode}
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Species</Typography>
                  <Typography variant="h6">
                    {pet.speciesId?.displayName || pet.speciesId?.name || pet.species || '-'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Breed</Typography>
                  <Typography variant="h6">
                    {pet.breedId?.name || pet.breed || '-'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Color</Typography>
                  <Typography variant="h6">{pet.color || '-'}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Health Status</Typography>
                  <Typography variant="h6">{pet.healthStatus || '-'}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Size</Typography>
                  <Typography variant="h6">{pet.size || '-'}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Weight</Typography>
                  <Typography variant="h6">
                    {pet.weight?.value ? `${pet.weight.value} ${pet.weight.unit || 'kg'}` : '-'}
                  </Typography>
                </Grid>
              </Grid>
              
              {/* Additional Images (if any) */}
              {pet.images && Array.isArray(pet.images) && pet.images.length > 1 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Additional Photos</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {pet.images
                      .filter(img => img && !img.isPrimary)
                      .map((img, index) => {
                        if (!img?.url) return null;
                        return (
                          <Box
                            key={index}
                            component="img"
                            src={resolveMediaUrl(img.url)}
                            alt={`Additional ${index}`}
                            sx={{
                              width: 80,
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              // Could implement a lightbox here
                            }}
                            onError={(e) => { e.currentTarget.src = '/placeholder-pet.svg' }}
                          />
                        );
                      })
                    }
                  </Box>
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        <Button 
          variant="contained"
          startIcon={<MedicalIcon />}
          onClick={() => {
            // Determine which medical history route to use
            if (pet?.source === 'core' || !pet?.source) {
              // User-created pet
              navigate(`/User/pets/${id}/medical-history`)
            } else {
              // Pet from petshop or adoption - use the centralized API
              navigate(`/User/pets/${id}/medical-history`)
            }
          }}
          size="large"
          fullWidth={isMobile}
        >
          Add Medical Record
        </Button>
        <Button 
          variant="outlined"
          startIcon={<HistoryIcon />}
          onClick={() => {
            // Determine which history route to use
            if (pet?.source === 'core' || !pet?.source) {
              // User-created pet
              navigate(`/User/pets/${id}/history`)
            } else {
              // Pet from petshop or adoption
              navigate(`/User/pets/${id}/history`)
            }
          }}
          size="large"
          fullWidth={isMobile}
        >
          View Full History
        </Button>
      </Box>

      {/* Medical History Section */}
      <Card sx={{ mb: 3, boxShadow: 2 }}>
        <CardContent>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Medical History ({medicalHistory.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {medicalHistoryLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : medicalHistory.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <MedicalIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">No medical history records found.</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add your first medical record using the button above.
                  </Typography>
                </Box>
              ) : (
                <List>
                  {medicalHistory.map((record, index) => (
                    <React.Fragment key={index}>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {record.description}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography component="span" variant="body1" color="text.primary" sx={{ display: 'block', mb: 0.5 }}>
                                {record.veterinarian}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography component="span" variant="body2" color="text.secondary">
                                  {record.date ? new Date(record.date).toLocaleDateString() : 'Date not specified'}
                                </Typography>
                              </Box>
                            </>
                          }
                        />
                      </ListItem>
                      {index < medicalHistory.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>
    </Container>
  )
}

export default UserPetDetails