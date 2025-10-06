import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material'
import {
  LocalShipping as DeliveryIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Home as HomeIcon,
  Store as StoreIcon
} from '@mui/icons-material'
import { petShopManagerAPI } from '../../services/api'

const PetShopDeliveryManagement = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deliveries, setDeliveries] = useState([])
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  const loadDeliveries = async () => {
    try {
      setLoading(true)
      const response = await petShopManagerAPI.listReservations()
      const allReservations = response.data.data.reservations || []
      
      // Filter for deliveries (paid orders)
      const deliveryItems = allReservations.filter(r => 
        ['paid', 'ready_pickup', 'delivered', 'at_owner'].includes(r.status)
      )
      
      setDeliveries(deliveryItems)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load deliveries')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDeliveries()
  }, [])

  const handleStatusUpdate = async (deliveryId, newStatus) => {
    try {
      setUpdating(true)
      await petShopManagerAPI.updateDeliveryStatus(deliveryId, newStatus, deliveryNotes)
      await loadDeliveries()
      setDialogOpen(false)
      setSelectedDelivery(null)
      setDeliveryNotes('')
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to update delivery status')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'warning'
      case 'ready_pickup': return 'info'
      case 'completed': return 'success'
      default: return 'default'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <PendingIcon />
      case 'ready_pickup': return <DeliveryIcon />
      case 'completed': return <CompletedIcon />
      default: return <PendingIcon />
    }
  }

  const getDeliverySteps = (delivery) => {
    const steps = [
      { label: 'Payment Received', completed: true },
      { label: 'Preparing for Pickup/Delivery', completed: ['ready_pickup', 'completed'].includes(delivery.status) },
      { label: 'Ready for Pickup/Completed', completed: delivery.status === 'completed' }
    ]
    return steps
  }

  const renderDeliveryCard = (delivery) => (
    <Grid item xs={12} key={delivery._id}>
      <Card>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={2}>
              <Avatar
                sx={{ width: 80, height: 80, mx: 'auto' }}
                src={delivery.itemId?.images?.[0]?.url}
              >
                {delivery.itemId?.name?.charAt(0)}
              </Avatar>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Typography variant="h6" fontWeight="bold">
                {delivery.itemId?.name || 'Pet Name'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Order: #{delivery.reservationCode || delivery._id.slice(-6)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Customer: {delivery.userId?.name}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                {delivery.paymentDetails?.deliveryMethod === 'delivery' ? (
                  <>
                    <HomeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    <Typography variant="body2">Home Delivery</Typography>
                  </>
                ) : (
                  <>
                    <StoreIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    <Typography variant="body2">Store Pickup</Typography>
                  </>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <Box>
                <Chip 
                  icon={getStatusIcon(delivery.status)}
                  label={delivery.status.replace('_', ' ').toUpperCase()}
                  color={getStatusColor(delivery.status)}
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Amount: ₹{delivery.paymentDetails?.amount?.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Paid: {new Date(delivery.paymentDetails?.paidAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <Box display="flex" flexDirection="column" gap={1}>
                {delivery.status === 'paid' && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => {
                      setSelectedDelivery(delivery)
                      setDialogOpen(true)
                    }}
                  >
                    Mark Ready
                  </Button>
                )}
                
                {delivery.status === 'ready_pickup' && (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={() => {
                      setSelectedDelivery(delivery)
                      setDialogOpen(true)
                    }}
                  >
                    Mark Completed
                  </Button>
                )}
                
                {delivery.status === 'completed' && (
                  <Chip
                    label="Completed"
                    color="success"
                    size="small"
                  />
                )}
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSelectedDelivery(delivery)
                    setDialogOpen(true)
                  }}
                >
                  View Details
                </Button>
              </Box>
            </Grid>
          </Grid>
          
          {delivery.paymentDetails?.deliveryAddress && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="medium">Delivery Address:</Typography>
              <Typography variant="body2">
                {delivery.paymentDetails.deliveryAddress.street}<br/>
                {delivery.paymentDetails.deliveryAddress.city}, {delivery.paymentDetails.deliveryAddress.state}<br/>
                {delivery.paymentDetails.deliveryAddress.zipCode}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Grid>
  )

  const renderStatusDialog = () => (
    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        Delivery Management - {selectedDelivery?.itemId?.name}
      </DialogTitle>
      <DialogContent>
        {selectedDelivery && (
          <Box>
            <Typography variant="h6" gutterBottom>Order Details</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Pet:</strong> {selectedDelivery.itemId?.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Customer:</strong> {selectedDelivery.userId?.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Phone:</strong> {selectedDelivery.userId?.phone}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Amount:</strong> ₹{selectedDelivery.paymentDetails?.amount?.toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Payment Date:</strong> {new Date(selectedDelivery.paymentDetails?.paidAt).toLocaleDateString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Delivery Method:</strong> {selectedDelivery.paymentDetails?.deliveryMethod === 'delivery' ? 'Home Delivery' : 'Store Pickup'}
                </Typography>
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom>Delivery Progress</Typography>
            <Stepper orientation="vertical" sx={{ mb: 3 }}>
              {getDeliverySteps(selectedDelivery).map((step, index) => (
                <Step key={index} active={step.completed}>
                  <StepLabel>{step.label}</StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary">
                      {step.completed ? 'Completed' : 'Pending'}
                    </Typography>
                  </StepContent>
                </Step>
              ))}
            </Stepper>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Delivery Notes"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Add any notes about the delivery..."
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
        {selectedDelivery?.status === 'paid' && (
          <Button
            variant="contained"
            onClick={() => handleStatusUpdate(selectedDelivery._id, 'ready_pickup')}
            disabled={updating}
          >
            {updating ? <CircularProgress size={20} /> : 'Mark Ready for Pickup'}
          </Button>
        )}
        {selectedDelivery?.status === 'ready_pickup' && (
          <Button
            variant="contained"
            color="success"
            onClick={() => handleStatusUpdate(selectedDelivery._id, 'completed')}
            disabled={updating}
          >
            {updating ? <CircularProgress size={20} /> : 'Mark as Completed'}
          </Button>
        )}
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
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Delivery Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PendingIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {deliveries.filter(d => d.status === 'paid').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Awaiting Preparation
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <DeliveryIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {deliveries.filter(d => d.status === 'ready_pickup').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ready for Pickup
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CompletedIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {deliveries.filter(d => d.status === 'completed').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CompletedIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {deliveries.filter(d => d.status === 'cancelled').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cancelled
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delivery List */}
      <Grid container spacing={3}>
        {deliveries.map(renderDeliveryCard)}
        
        {deliveries.length === 0 && (
          <Grid item xs={12}>
            <Box textAlign="center" py={8}>
              <DeliveryIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No deliveries found
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {renderStatusDialog()}
    </Container>
  )
}

export default PetShopDeliveryManagement
