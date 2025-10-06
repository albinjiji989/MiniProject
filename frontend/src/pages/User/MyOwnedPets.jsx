import React, { useState, useEffect } from 'react'
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
  Divider
} from '@mui/material'
import {
  Pets as PetsIcon,
  History as HistoryIcon,
  LocalHospital as MedicalIcon,
  ShoppingCart as PurchaseIcon,
  Home as HomeIcon,
  CalendarToday as DateIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material'
import { apiClient } from '../../services/api'
const MyOwnedPets = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ownedPets, setOwnedPets] = useState([])
  const [selectedPet, setSelectedPet] = useState(null)
  const [petHistory, setPetHistory] = useState([])
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [purchases, setPurchases] = useState([])

  const loadOwnedPets = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/pets/my-pets')
      setOwnedPets(response.data.data.pets || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load owned pets')
    } finally {
      setLoading(false)
    }
  }

  const loadMyPurchases = async () => {
    try {
      const res = await apiClient.get('/petshop/public/reservations')
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
    if (!url) return '/placeholder-pet.svg'
    // Support data URLs saved from Add Pet flow
    if (/^data:image\//i.test(url)) return url
    if (/^https?:\/\//i.test(url)) return url
    const apiBase = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
    const origin = apiBase.replace(/\/?api\/?$/, '')
    return `${origin}${url.startsWith('/') ? '' : '/'}${url}`
  }

  const renderPetCard = (pet) => (
    <Grid item xs={12} sm={6} md={4} key={pet._id}>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardMedia
          component="img"
          height="200"
          image={buildImageUrl(pet.images?.find(img => img.isPrimary)?.url || pet.images?.[0]?.url)}
          alt={pet.name}
          sx={{ objectFit: 'cover' }}
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h6" gutterBottom>
            {pet.name}
          </Typography>
          
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Chip 
              label={pet.petCode} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
            <Chip 
              label={pet.status || pet.currentStatus || 'Owned'} 
              size="small" 
              color="success"
            />
            {((pet.tags && pet.tags.includes('petshop')) || pet.source === 'petshop') && (
              <Chip label="Pet Shop" size="small" color="secondary" variant="outlined" />
            )}
            {pet.source === 'adoption' && (
              <Chip label="Adoption" size="small" color="secondary" variant="outlined" />
            )}
          </Box>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Species:</strong> {pet.speciesId?.name || pet.species?.name || 'Unknown'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Breed:</strong> {pet.breedId?.name || pet.breed?.name || 'Unknown'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Age:</strong> {pet.age || 'Unknown'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Gender:</strong> {pet.gender || 'Unknown'}
          </Typography>
          
          {pet.acquiredDate && (
            <Box display="flex" alignItems="center" gap={0.5} mt={1}>
              <DateIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2" color="text.secondary">
                Acquired: {new Date(pet.acquiredDate).toLocaleDateString()}
              </Typography>
            </Box>
          )}
          
          {pet.source && (
            <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
              <LocationIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2" color="text.secondary">
                Source: {pet.source.replace('_', ' ')}
              </Typography>
            </Box>
          )}
        </CardContent>
        
        <Box sx={{ p: 2, pt: 0 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<HistoryIcon />}
            onClick={() => handleViewHistory(pet)}
          >
            View History
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center' }}>
        <PetsIcon sx={{ mr: 2 }} />
        My Owned Pets
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {ownedPets.map(renderPetCard)}
        
        {ownedPets.length === 0 && (
          <Grid item xs={12}>
            <Box textAlign="center" py={8}>
              <PetsIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No owned pets found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pets you purchase from the pet shop will appear here after delivery is completed.
              </Typography>
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
    </Container>
  )
}

export default MyOwnedPets
