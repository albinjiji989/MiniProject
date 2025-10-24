import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Check as CheckIcon
} from '@mui/icons-material'
import { apiClient } from '../../../services/api'

const PurchasePet = () => {
  const navigate = useNavigate()
  const { id } = useParams() // Pet inventory ID
  const [loading, setLoading] = useState(false)
  const [pet, setPet] = useState(null)
  const [customerName, setCustomerName] = useState('')
  const [petName, setPetName] = useState('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  useEffect(() => {
    if (id) {
      fetchPetDetails()
    }
  }, [id])

  const fetchPetDetails = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/petshop/inventory/${id}`)
      setPet(response.data.data.item)
    } catch (err) {
      console.error('Fetch pet error:', err)
      showSnackbar('Failed to load pet details', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const handlePurchase = async () => {
    try {
      if (!customerName.trim()) {
        showSnackbar('Customer name is required', 'error')
        return
      }
      
      if (!petName.trim()) {
        showSnackbar('Pet name is required', 'error')
        return
      }

      setLoading(true)
      
      // Update the pet with the customer's chosen name
      const response = await apiClient.put(`/petshop/inventory/${id}`, {
        name: petName.trim(),
        status: 'sold',
        soldAt: new Date(),
        buyerId: null // In a real system, this would be the customer's user ID
      })
      
      showSnackbar(`Successfully purchased ${petName}!`)
      
      // Navigate to Manage Inventory after success
      navigate('/manager/petshop/manage-inventory', { 
        state: { 
          message: `Pet purchased and named ${petName}`, 
          refresh: true 
        } 
      })
      
    } catch (err) {
      console.error('Purchase error:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Failed to process purchase'
      showSnackbar(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !pet) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (!pet) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Pet not found</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/manager/petshop/manage-inventory')}
            sx={{ mr: 2 }}
            disabled={loading}
          >
            Back to Inventory
          </Button>
          <Typography variant="h4" component="h1">
            Purchase Pet
          </Typography>
        </Box>
      </Box>

      {/* Pet Details Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Pet Details
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1">
                <strong>PetCode:</strong> {pet.petCode}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1">
                <strong>Category:</strong> {pet.categoryId?.name || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1">
                <strong>Species:</strong> {pet.speciesId?.name || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1">
                <strong>Breed:</strong> {pet.breedId?.name || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1">
                <strong>Gender:</strong> {pet.gender}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1">
                <strong>Age:</strong> {pet.age} {pet.ageUnit}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1">
                <strong>Price:</strong> ₹{pet.price}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1">
                <strong>Status:</strong> 
                <Chip 
                  label={pet.status} 
                  size="small" 
                  color={
                    pet.status === 'available_for_sale' ? 'success' : 
                    pet.status === 'sold' ? 'default' : 'primary'
                  }
                  sx={{ ml: 1 }}
                />
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Purchase Form */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Customer Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Customer Name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                disabled={loading}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Pet Name *"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="Enter the name the customer wants for their pet"
                disabled={loading}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Note:</strong> The pet will be officially named "{petName || '...'}" after this purchase is completed. 
                  This name will appear on all future documentation and records for this pet.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              color="success"
              onClick={handlePurchase}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
            >
              {loading ? 'Processing Purchase...' : 'Complete Purchase'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Snackbar */}
      {snackbar.open && (
        <Alert 
          severity={snackbar.severity}
          sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      )}
    </Box>
  )
}

export default PurchasePet