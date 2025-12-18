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
  Chip, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Alert, 
  CircularProgress, 
  Avatar, 
  Divider, 
  IconButton, 
  Menu, 
  MenuItem 
} from '@mui/material'
import { 
  Pets as PetsIcon, 
  History as HistoryIcon, 
  LocalHospital as MedicalIcon, 
  ShoppingCart as PurchaseIcon, 
  Home as HomeIcon, 
  CalendarToday as DateIcon, 
  LocationOn as LocationIcon, 
  MoreVert as MoreVertIcon, 
  Visibility as ViewIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon 
} from '@mui/icons-material'
import { apiClient, userPetsAPI, resolveMediaUrl } from '../../../services/api'

const MyUserPets = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ownedPets, setOwnedPets] = useState([])
  const [selectedPet, setSelectedPet] = useState(null)
  const [petHistory, setPetHistory] = useState([])
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [purchases, setPurchases] = useState([])
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [menuPet, setMenuPet] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingPet, setDeletingPet] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadOwnedPets = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Load user's pets
      const [ownedRes, adoptedRes, purchasedRes] = await Promise.allSettled([
        userPetsAPI.list({}),
        apiClient.get('/adoption/user/my-adopted-pets'),
        apiClient.get('/petshop/user/my-purchased-pets')
      ])

      let allPets = []
      
      // Process user-created pets
      if (ownedRes.status === 'fulfilled') {
        const userPets = Array.isArray(ownedRes.value.data?.data) ? ownedRes.value.data.data : (ownedRes.value.data?.data?.pets || [])
        userPets.forEach(pet => {
          allPets.push({
            ...pet,
            source: 'user',
            sourceLabel: 'My Pet',
            isUserCreated: true,
            userPetId: pet._id
          })
        })
      }

      // Process adopted pets
      if (adoptedRes.status === 'fulfilled') {
        const adoptedPets = Array.isArray(adoptedRes.value.data?.data) ? adoptedRes.value.data.data : (adoptedRes.value.data?.data?.pets || [])
        adoptedPets.forEach(pet => {
          allPets.push({
            ...pet,
            source: 'adoption',
            sourceLabel: 'Adopted Pet',
            tags: ['adoption']
          })
        })
      }

      // Process purchased pets
      if (purchasedRes.status === 'fulfilled') {
        const purchasedPets = Array.isArray(purchasedRes.value.data?.data?.pets) ? purchasedRes.value.data.data.pets : (purchasedRes.value.data?.data || [])
        purchasedPets.forEach(pet => {
          allPets.push({
            ...pet,
            source: 'purchased',
            sourceLabel: 'Purchased Pet',
            tags: ['purchased']
          })
        })
      }

      // Remove duplicates based on petCode or _id
      const uniquePets = allPets.filter((pet, index, self) => 
        index === self.findIndex(p => (p.petCode || p._id) === (pet.petCode || pet._id))
      )

      setOwnedPets(uniquePets)
    } catch (e) {
      console.error('Error loading owned pets:', e)
      setError(e?.response?.data?.message || 'Failed to load owned pets')
    } finally {
      setLoading(false)
    }
  }

  const loadMyPurchases = async () => {
    try {
      const res = await apiClient.get('/petshop/user/public/reservations')
      const all = res?.data?.data?.reservations || []
      // Show only purchases that are paid or awaiting pickup/delivery
      const awaiting = all.filter(r => ['paid', 'ready_pickup'].includes(r.status))
      setPurchases(awaiting)
    } catch (_) { /* non-blocking */ }
  }

  const loadPetHistory = async (petId) => {
    try {
      setHistoryLoading(true)
      const response = await apiClient.get(`/pets/${petId}/history`)
      // backend returns combined sections; adapt if structure differs
      const data = response.data?.data
      const history = data?.history || data?.ownershipHistory || []
      setPetHistory(history)
    } catch (e) {
      setError('Failed to load pet history')
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadOwnedPets()
    loadMyPurchases()
  }, [])

  const handleViewHistory = async (pet) => {
    setSelectedPet(pet)
    setHistoryDialogOpen(true)
    await loadPetHistory(pet._id)
  }

  const handleMenuOpen = (event, pet) => {
    setMenuAnchor(event.currentTarget)
    setMenuPet(pet)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setMenuPet(null)
  }

  const handleViewDetails = () => {
    if (menuPet) {
      if (menuPet.source === 'adoption') {
        navigate(`/User/adoption/my-adopted-pets/${menuPet._id}`)
      } else if (menuPet.source === 'purchased') {
        navigate(`/User/petshop/my-purchased-pets/${menuPet._id || menuPet.petCode}`)
      } else {
        navigate(`/User/pets/${menuPet._id}`)
      }
    }
    handleMenuClose()
  }

  const handleEditPet = () => {
    if (menuPet) {
      if (menuPet.source === 'adoption') {
        alert('Adopted pets cannot be edited. Please contact the adoption center if you need to make changes.')
      } else if (menuPet.source === 'purchased') {
        alert('Purchased pets cannot be edited.')
      } else {
        navigate(`/User/pets/${menuPet._id}/edit`)
      }
    }
    handleMenuClose()
  }

  const handleDeletePet = () => {
    if (menuPet) {
      if (menuPet.source === 'adoption' || menuPet.source === 'purchased') {
        alert('This pet cannot be deleted.')
      } else {
        setDeletingPet(menuPet)
        setDeleteDialogOpen(true)
      }
    }
    handleMenuClose()
  }

  const confirmDeletePet = async () => {
    if (!deletingPet) return
    
    try {
      setDeleting(true)
      await userPetsAPI.delete(deletingPet._id)
      await loadOwnedPets()
      setDeleteDialogOpen(false)
      setDeletingPet(null)
    } catch (e) {
      setError('Failed to delete pet')
    } finally {
      setDeleting(false)
    }
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          My Pets
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          All pets you own, including adopted and purchased pets
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {ownedPets.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <PetsIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 1 }}>No pets found</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You don't have any pets yet.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/User/pets/add')}
          >
            Add Your First Pet
          </Button>
        </Card>
      ) : (
        <>
          <Grid container spacing={3}>
            {ownedPets.map((pet) => (
              <Grid item xs={12} sm={6} md={4} key={pet._id || pet.petCode}>
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
                  onClick={handleViewDetails}
                >
                  {/* Menu Button */}
                  <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                    <IconButton 
                      size="small" 
                      sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.8)',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMenuOpen(e, pet)
                      }}
                    >
                      <MoreVertIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                  
                  {/* Pet Image */}
                  <CardMedia
                    component="img"
                    height="180"
                    image={pet.images && pet.images.length > 0 ? resolveMediaUrl(pet.images[0]?.url || pet.images[0]) : '/placeholder-pet.svg'}
                    alt={pet.name}
                    onError={(e) => { e.currentTarget.src = '/placeholder-pet.svg' }}
                    sx={{ objectFit: 'cover' }}
                  />
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Pet Name */}
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {pet.name || 'Unnamed Pet'}
                    </Typography>
                    
                    {/* Pet Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {getGenderIcon(pet.gender)}
                      <Typography variant="body2" color="text.secondary">
                        {pet.gender || 'Unknown'} • {pet.age || '-'} {pet.ageUnit || 'months'}
                      </Typography>
                    </Box>
                    
                    {/* Pet Details */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>Species:</strong> {pet.species?.name || pet.species || '-'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>Breed:</strong> {pet.breed?.name || pet.breed || '-'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Color:</strong> {pet.color || '-'}
                      </Typography>
                    </Box>
                    
                    {/* Source Badge */}
                    <Chip
                      label={pet.sourceLabel || 'My Pet'}
                      size="small"
                      color={
                        pet.source === 'adoption' ? 'secondary' : 
                        pet.source === 'purchased' ? 'info' : 'primary'
                      }
                      sx={{ fontWeight: 'bold' }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <ViewIcon sx={{ mr: 1 }} /> View Details
        </MenuItem>
        <MenuItem onClick={handleEditPet}>
          <EditIcon sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={handleDeletePet}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {deletingPet?.name || 'this pet'}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmDeletePet} 
            color="error" 
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default MyUserPets