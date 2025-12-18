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
import { apiClient, userPetsAPI, resolveMediaUrl } from '../../services/api'

const MyOwnedPets = () => {
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
      setError('') // Clear previous errors
      
      // Load both centralized registry pets AND user-created pets
      const [registryRes, userPetsRes] = await Promise.allSettled([
        apiClient.get('/pets/my-pets'), // Centralized registry (via PetRegistry)
        userPetsAPI.list({ limit: 100 }) // User-created pets from PetNew
      ])
      
      let allPets = []
      const userCreatedPetCodes = new Set() // Set of PetNew petCodes
      const petNewMap = new Map() // Map petCode to full PetNew object
      
      // First, get user-created pets from PetNew (these are deletable)
      if (userPetsRes.status === 'fulfilled') {
        const userCreatedPets = userPetsRes.value.data.data || []
        console.log('✅ User-created pets from PetNew:')
        userCreatedPets.forEach(pet => {
          console.log(`  - ID: ${pet._id}, Name: ${pet.name}, petCode: ${pet.petCode || 'NONE'}`)
          if (pet.petCode) {
            userCreatedPetCodes.add(pet.petCode)
            petNewMap.set(pet.petCode, pet)
          }
        })
      } else {
        console.error('Failed to load user-created pets:', userPetsRes.reason)
        setError('Failed to load some of your pets. Please try again.')
      }
      
      // Then, get pets from centralized registry
      if (registryRes.status === 'fulfilled') {
        const registryPets = registryRes.value.data.data.pets || []
        console.log('📋 Registry pets (from PetRegistry):')
        
        registryPets.forEach(pet => {
          // Check if this pet is user-created by matching petCode
          const isUserCreated = pet.source === 'core' && pet.petCode && userCreatedPetCodes.has(pet.petCode)
          
          console.log(`  - petCode: ${pet.petCode}, Name: ${pet.name}, Source: ${pet.source}, isUserCreated: ${isUserCreated}`)
          
          if (isUserCreated) {
            // Merge registry data with PetNew data
            const petNewData = petNewMap.get(pet.petCode)
            allPets.push({
              ...pet,
              ...petNewData, // Prefer PetNew data for display
              _id: pet._id, // Use registry _id for viewing
              isUserCreated: true,
              userPetId: petNewData?._id, // Use PetNew _id for edit/delete operations
              source: 'core',
              petCode: pet.petCode // Keep petCode from registry
            })
          } else {
            // Pet from petshop or adoption
            allPets.push({
              ...pet,
              isUserCreated: false,
              userPetId: undefined,
              source: pet.source || 'unknown'
            })
          }
        })
      } else {
        console.error('Failed to load registry pets:', registryRes.reason)
        setError('Failed to load some of your pets. Please try again.')
      }
      
      console.log('🎯 Final merged pets:')
      allPets.forEach(p => {
        console.log(`  - petCode: ${p.petCode}, Name: ${p.name}, isUserCreated: ${p.isUserCreated}, userPetId: ${p.userPetId}, source: ${p.source}`)
      })
      
      setOwnedPets(allPets)
    } catch (e) {
      console.error('Error loading owned pets:', e)
      setError(e?.response?.data?.message || 'Failed to load owned pets. Please try again.')
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
      // For user-created pets, use the PetNew _id
      // For other pets (adoption, petshop), use the registry _id
      if (menuPet.isUserCreated && menuPet.userPetId) {
        navigate(`/User/pets/${menuPet.userPetId}`)
      } else {
        navigate(`/User/pets/${menuPet._id}`)
      }
    }
    handleMenuClose()
  }

  const handleEdit = () => {
    // Allow editing of all pets, including those from adoption or pet shop
    if (menuPet) {
      // For user-created pets, use the PetNew _id
      // For other pets (adoption, petshop), use the registry _id
      if (menuPet.isUserCreated && menuPet.userPetId) {
        navigate(`/User/pets/${menuPet.userPetId}/edit`)
      } else {
        // For pets from pet shop or adoption, we'll create a special edit route
        navigate(`/User/pets/${menuPet._id}/edit-basic`)
      }
    }
    handleMenuClose()
  }

  const handleDeleteClick = () => {
    // Only allow deletion of user-created pets
    if (!menuPet?.isUserCreated) {
      setError('Cannot delete this pet. Only manually added pets can be deleted.')
      handleMenuClose()
      return
    }
    setDeletingPet(menuPet)
    setDeleteDialogOpen(true)
    handleMenuClose()
  }

  const handleDeleteConfirm = async () => {
    if (!deletingPet) return
    
    try {
      setDeleting(true)
      setError('') // Clear previous errors
      
      // Use userPetId if available (for PetNew model), otherwise use _id
      const petId = deletingPet.userPetId || deletingPet._id
      
      await userPetsAPI.delete(petId)
      // Remove from list
      setOwnedPets(prev => prev.filter(p => p._id !== deletingPet._id))
      setDeleteDialogOpen(false)
      setDeletingPet(null)
    } catch (e) {
      const errorMsg = e?.response?.data?.message || 'Failed to delete pet'
      
      // If 404, it means the pet is not in PetNew (user-added pets)
      if (e?.response?.status === 404) {
        setError('This pet cannot be deleted because it was not manually added by you. Only manually added pets can be deleted.')
      } else {
        setError(errorMsg)
      }
      
      setDeleteDialogOpen(false)
      setDeletingPet(null)
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setDeletingPet(null)
  }

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'created':
      case 'added_to_inventory':
        return <PetsIcon sx={{ color: 'white', fontSize: 20 }} />
      case 'reservation_made':
      case 'reservation_approved':
        return <PurchaseIcon sx={{ color: 'white', fontSize: 20 }} />
      case 'payment_completed':
        return <PurchaseIcon sx={{ color: 'white', fontSize: 20 }} />
      case 'ownership_transferred':
        return <HomeIcon sx={{ color: 'white', fontSize: 20 }} />
      case 'medical_checkup':
      case 'vaccination':
        return <MedicalIcon sx={{ color: 'white', fontSize: 20 }} />
      default:
        return <HistoryIcon sx={{ color: 'white', fontSize: 20 }} />
    }
  }

  const formatEventDescription = (event) => {
    const baseDescription = event.eventDescription || 'Pet event recorded'
    const date = new Date(event.timestamp).toLocaleDateString()
    const time = new Date(event.timestamp).toLocaleTimeString()
    
    return {
      title: baseDescription,
      subtitle: `${date} at ${time}`,
      details: event.metadata
    }
  }

  const buildImageUrl = (url) => {
    console.log('Building image URL from:', url);
    if (!url) return '/placeholder-pet.svg';
    return resolveMediaUrl(url);
  }

  const renderPetCard = (pet) => (
    <Grid item xs={12} sm={6} md={4} key={pet._id || pet.petCode || pet.name}>
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          position: 'relative',
          border: pet.source === 'core' ? '2px solid #4CAF50' : 
                 pet.source === 'petshop' ? '2px solid #2196F3' : 
                 pet.source === 'adoption' ? '2px solid #FF9800' : 'none',
          boxShadow: 3,
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6
          }
        }}
      >
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
          <IconButton 
            size="small" 
            onClick={(e) => handleMenuOpen(e, pet)}
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.9)', 
              '&:hover': { bgcolor: 'white' },
              boxShadow: 1
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
        
        {/* Source indicator badge */}
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 8, 
            left: 8, 
            zIndex: 1,
            bgcolor: pet.source === 'core' ? 'success.main' : 
                    pet.source === 'petshop' ? 'primary.main' : 
                    pet.source === 'adoption' ? 'warning.main' : 'grey.500',
            color: 'white',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}
        >
          {pet.source === 'core' ? 'USER ADDED' : 
           pet.source === 'petshop' ? 'PET SHOP' : 
           pet.source === 'adoption' ? 'ADOPTION' : 
           pet.source?.toUpperCase()}
        </Box>
        
        <CardMedia
          component="img"
          height="200"
          image={
            (() => {
              // Handle different image data structures
              let imageUrl = null;
              
              // If images is an array of objects with url property
              if (Array.isArray(pet.images) && pet.images.length > 0) {
                const primaryImage = pet.images.find(img => img?.isPrimary);
                const firstImage = pet.images[0];
                imageUrl = primaryImage?.url || firstImage?.url || firstImage;
              }
              // If images is a single object with url property
              else if (pet.images?.url) {
                imageUrl = pet.images.url;
              }
              // If images is a string URL
              else if (typeof pet.images === 'string') {
                imageUrl = pet.images;
              }
              
              console.log('Pet:', pet.name, 'Image data:', pet.images, 'Selected URL:', imageUrl);
              return buildImageUrl(imageUrl);
            })()
          }
          alt={pet.name || 'Unnamed Pet'}
          sx={{ 
            objectFit: 'cover', 
            cursor: 'pointer',
            bgcolor: 'grey.200'
          }}
          onClick={() => {
            // For user-created pets, use the PetNew _id
            // For other pets (adoption, petshop), use the registry _id
            if (pet.isUserCreated && pet.userPetId) {
              navigate(`/User/pets/${pet.userPetId}`)
            } else {
              navigate(`/User/pets/${pet._id}`)
            }
          }}
          onError={(e) => {
            console.log('Image load error for pet:', pet.name, 'Image data:', pet.images);
            e.currentTarget.src = '/placeholder-pet.svg';
          }}
          onLoad={(e) => {
            console.log('Image loaded successfully for pet:', pet.name);
          }}
        />
        
        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Box>
              <Typography 
                gutterBottom 
                variant="h6" 
                component="div" 
                sx={{ 
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {pet.name || 'Unnamed Pet'}
              </Typography>
              {pet.petCode && (
                <Chip 
                  label={pet.petCode} 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                  sx={{ mb: 1 }}
                />
              )}
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Avatar 
              sx={{ 
                width: 24, 
                height: 24, 
                fontSize: 12,
                bgcolor: pet.source === 'core' ? 'success.light' : 
                        pet.source === 'petshop' ? 'primary.light' : 
                        pet.source === 'adoption' ? 'warning.light' : 'grey.300'
              }}
              src={buildImageUrl(
                Array.isArray(pet.images) && pet.images.length > 0 
                  ? (pet.images.find(img => img?.isPrimary)?.url || pet.images[0]?.url || pet.images[0])
                  : (typeof pet.images === 'string' ? pet.images : pet.images?.url)
              )}
            >
              {pet.speciesId?.displayName?.charAt(0) || pet.speciesId?.name?.charAt(0) || pet.name?.charAt(0) || 'P'}
            </Avatar>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {pet.speciesId?.displayName || pet.speciesId?.name || 'Unknown Species'} • {pet.breedId?.name || 'Unknown Breed'}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Typography variant="body2">
              Age: {pet.age || 0} {pet.ageUnit || 'months'}
            </Typography>
            {pet.gender && (
              <Chip 
                label={pet.gender} 
                size="small" 
                color={pet.gender === 'Male' ? 'primary' : pet.gender === 'Female' ? 'secondary' : 'default'}
                sx={{ ml: 1 }}
              />
            )}
          </Box>
          
          {pet.color && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Color: {pet.color}
            </Typography>
          )}
          
          {pet.acquiredDate && (
            <Box display="flex" alignItems="center" gap={0.5} mt={1}>
              <DateIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2" color="text.secondary">
                Acquired: {new Date(pet.acquiredDate).toLocaleDateString()}
              </Typography>
            </Box>
          )}
          
          <Box display="flex" alignItems="center" gap={0.5} mt={1}>
            <LocationIcon sx={{ fontSize: 16 }} />
            <Typography variant="body2" color="text.secondary">
              Status: {pet.currentStatus === 'owned' ? 'Owned' : 
                      pet.currentStatus === 'sold' ? 'Purchased' : 
                      pet.currentStatus === 'adopted' ? 'Adopted' : 
                      pet.currentStatus || 'Unknown'}
            </Typography>
          </Box>
        </CardContent>
        
        <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={() => handleViewHistory(pet)}
            size="small"
          >
            History
          </Button>
          <Button
            fullWidth
            variant="contained"
            startIcon={<ViewIcon />}
            onClick={() => {
              // Check if this is an adopted pet by looking for the 'adoption' source
              if (pet.source === 'adoption') {
                // For adopted pets, navigate to the adoption details page
                navigate(`/User/adoption/my-adopted-pets/${pet._id}`)
              } else {
                // For user-created pets, use the PetNew _id
                // For other pets (petshop), use the registry _id
                if (pet.isUserCreated && pet.userPetId) {
                  navigate(`/User/pets/${pet.userPetId}`)
                } else {
                  navigate(`/User/pets/${pet._id}`)
                }
              }
            }}
            size="small"
          >
            View Details
          </Button>
        </Box>
      </Card>
    </Grid>
  )

  const renderHistoryDialog = () => (
    <Dialog 
      open={historyDialogOpen} 
      onClose={() => setHistoryDialogOpen(false)} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar src={buildImageUrl(selectedPet?.images?.[0]?.url)}>
            {selectedPet?.name?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6">{selectedPet?.name} History</Typography>
            <Typography variant="body2" color="text.secondary">
              Pet Code: {selectedPet?.petCode}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {historyLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : petHistory.length > 0 ? (
          <Box>
            {petHistory.map((event, index) => {
              const eventInfo = formatEventDescription(event)
              return (
                <Box key={index} sx={{ display: 'flex', mb: 3 }}>
                  <Box sx={{ mr: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                      {getEventIcon(event.eventType)}
                    </Avatar>
                    {index < petHistory.length - 1 && (
                      <Box sx={{ width: 2, height: 40, bgcolor: 'grey.300', mt: 1 }} />
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" component="div">
                      {eventInfo.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {eventInfo.subtitle}
                    </Typography>
                    
                    {event.performedBy && (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        <strong>Performed by:</strong> {event.performedByRole || 'User'}
                      </Typography>
                    )}
                    
                    {event.metadata && (
                      <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        {event.metadata.purchaseAmount && (
                          <Typography variant="body2">
                            <strong>Amount:</strong> ₹{event.metadata.purchaseAmount}
                          </Typography>
                        )}
                        {event.metadata.customerName && (
                          <Typography variant="body2">
                            <strong>Customer:</strong> {event.metadata.customerName}
                          </Typography>
                        )}
                        {event.metadata.deliveryMethod && (
                          <Typography variant="body2">
                            <strong>Delivery:</strong> {event.metadata.deliveryMethod}
                          </Typography>
                        )}
                        {event.metadata.notes && (
                          <Typography variant="body2">
                            <strong>Notes:</strong> {event.metadata.notes}
                          </Typography>
                        )}
                      </Box>
                    )}
                    
                    {index < petHistory.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                </Box>
              )
            })}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
            No history available for this pet
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  )

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
            <PetsIcon sx={{ mr: 2 }} />
            My Owned Pets
          </Typography>
        </Box>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading your pets...
          </Typography>
        </Box>
      </Container>
    )
  }

  const handleRefresh = () => {
    loadOwnedPets();
    loadMyPurchases();
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
          <PetsIcon sx={{ mr: 2 }} />
          My Owned Pets
        </Typography>
        <Button 
          variant="outlined" 
          onClick={handleRefresh}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Note:</strong> You can only edit or delete pets that you manually added. 
        Pets from adoption or pet shop cannot be modified here - please contact the respective service for assistance.
      </Alert>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3}>
        {ownedPets.map(renderPetCard)}
        
        {ownedPets.length === 0 && !loading && (
          <Grid item xs={12}>
            <Box textAlign="center" py={8}>
              <PetsIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No owned pets found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Pets you purchase from the pet shop or adopt will appear here after the process is completed.
              </Typography>
              <Button 
                variant="outlined" 
                onClick={handleRefresh}
                sx={{ mt: 2 }}
              >
                Refresh List
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Awaiting Delivery/Pickup from Pet Shop */}
      {purchases.length > 0 && (
        <>
          <Divider sx={{ my: 4 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Awaiting Delivery / Pickup
          </Typography>
          <Grid container spacing={3}>
            {purchases.map(r => (
              <Grid item xs={12} md={6} lg={4} key={r._id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="180"
                    image={buildImageUrl(r.itemId?.images?.[0]?.url)}
                    alt={r.itemId?.name || 'Pet'}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="h6">{r.itemId?.name || 'Pet'}</Typography>
                      <Chip label={r.status} size="small" color={r.status === 'paid' ? 'warning' : 'primary'} />
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      {r.itemId?.petCode && <Chip label={r.itemId.petCode} size="small" variant="outlined" />}
                      <Chip label="Pet Shop" size="small" color="secondary" variant="outlined" />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Amount: ₹{(r.paymentDetails?.amount || r.itemId?.price || 0).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Reservation Code: {r.reservationCode}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {renderHistoryDialog()}

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem 
          onClick={handleEdit}
          disabled={!menuPet?.isUserCreated}
        >
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit Pet
          {!menuPet?.isUserCreated && 
            <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>(Not editable)</Typography>
          }
        </MenuItem>
        <MenuItem 
          onClick={handleDeleteClick} 
          sx={{ color: menuPet?.isUserCreated ? 'error.main' : 'text.disabled' }}
          disabled={!menuPet?.isUserCreated}
        >
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete Pet
          {!menuPet?.isUserCreated && 
            <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>(Not deletable)</Typography>
          }
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Pet?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deletingPet?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
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

export default MyOwnedPets