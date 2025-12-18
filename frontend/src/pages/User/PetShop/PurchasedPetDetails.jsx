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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  MedicalServices as MedicalIcon,
  History as HistoryIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
  Help as HelpIcon,
  Pets as PetsIcon
} from '@mui/icons-material'
import { petShopAPI, resolveMediaUrl } from '../../../services/api'

const PurchasedPetDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [pet, setPet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showMedicalForm, setShowMedicalForm] = useState(false)
  const [medicalForm, setMedicalForm] = useState({
    description: '',
    veterinarian: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [menuAnchor, setMenuAnchor] = useState(null)

  useEffect(() => {
    const loadPet = async () => {
      try {
        setLoading(true)
        // Get all purchased pets and find the one with matching ID
        const res = await petShopAPI.getMyPurchasedPets()
        const allPets = res.data?.data?.pets || []
        const petData = allPets.find(p => p._id === id || p.petCode === id)
        
        if (!petData) {
          setError('Pet not found')
          return
        }
        
        console.log('Purchased pet data received:', petData)
        setPet(petData)
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load pet details')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadPet()
    }
  }, [id])

  const getPrimaryImageUrl = () => {
    try {
      if (pet?.images && Array.isArray(pet.images) && pet.images.length > 0) {
        const primaryImage = pet.images.find(img => img?.isPrimary) || pet.images[0]
        if (primaryImage?.url) {
          return resolveMediaUrl(primaryImage.url)
        }
      }
    } catch (error) {
      console.error('Error getting primary image URL:', error)
    }
    return '/placeholder-pet.svg'
  }

  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
  }

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

  const handleAddMedicalRecord = () => {
    // For now, just close the dialog and show a message
    // In a real implementation, this would add the medical record to the pet
    setShowMedicalForm(false)
    setMedicalForm({
      description: '',
      veterinarian: '',
      date: new Date().toISOString().split('T')[0]
    })
    alert('Medical record added successfully')
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
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          startIcon={<BackIcon />} 
          onClick={() => navigate('/User/petshop/purchased')}
          variant="outlined"
        >
          Back to Purchased Pets
        </Button>
      </Container>
    )
  }

  if (!pet) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="warning">
          Pet not found
        </Alert>
        <Button 
          startIcon={<BackIcon />} 
          onClick={() => navigate('/User/petshop/purchased')}
          variant="outlined"
        >
          Back to Purchased Pets
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          onClick={() => navigate('/User/petshop/purchased')}
          sx={{ mr: 2 }}
        >
          <BackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 700, flex: 1 }}>
          {pet.name}
        </Typography>
        <IconButton onClick={handleMenuOpen}>
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>
            <EditIcon sx={{ mr: 1 }} /> Edit Details
          </MenuItem>
        </Menu>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {typeof error === 'object' ? error.message || JSON.stringify(error) : error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Pet Image and Basic Info */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <Box
              component="img"
              src={getPrimaryImageUrl()}
              alt={pet.name}
              sx={{
                width: '100%',
                height: 300,
                objectFit: 'cover',
                borderRadius: '8px 8px 0 0'
              }}
              onError={(e) => { e.currentTarget.src = '/placeholder-pet.svg' }}
            />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mr: 1 }}>
                  {pet.name}
                </Typography>
                {getGenderIcon(pet.gender)}
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Basic Information
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Species:</strong> {(typeof pet.species === 'object' && pet.species !== null) ? (pet.species.name || pet.species.displayName || 'Not specified') : (pet.species || 'Not specified')}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Breed:</strong> {(typeof pet.breed === 'object' && pet.breed !== null) ? (pet.breed.name || 'Not specified') : (pet.breed || 'Not specified')}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Gender:</strong> {pet.gender || 'Not specified'}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Age:</strong> {pet.age} {pet.ageUnit || 'years'}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Color:</strong> {pet.color || 'Not specified'}
                </Typography>
              </Box>
              
              <Chip 
                label={`Purchased on ${pet.purchaseDate || 'Unknown date'}`} 
                color="primary" 
                variant="outlined" 
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Pet Details and Medical History */}
        <Grid item xs={12} md={8}>
          {/* Description */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Description
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {pet.description || 'No description available'}
              </Typography>
            </CardContent>
          </Card>

          {/* Medical Records */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Medical Records
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                Medical records functionality will be implemented in a future update.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Medical Record Dialog */}
      <Dialog open={showMedicalForm} onClose={() => setShowMedicalForm(false)}>
        <DialogTitle>Add Medical Record</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={medicalForm.description}
            onChange={(e) => setMedicalForm({...medicalForm, description: e.target.value})}
          />
          <TextField
            margin="dense"
            label="Veterinarian"
            fullWidth
            value={medicalForm.veterinarian}
            onChange={(e) => setMedicalForm({...medicalForm, veterinarian: e.target.value})}
          />
          <TextField
            margin="dense"
            label="Date"
            type="date"
            fullWidth
            value={medicalForm.date}
            onChange={(e) => setMedicalForm({...medicalForm, date: e.target.value})}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMedicalForm(false)}>Cancel</Button>
          <Button onClick={handleAddMedicalRecord} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default PurchasedPetDetails