import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  ShoppingCart as CartIcon,
  Pets as PetsIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material'
import { petShopStockAPI } from '../../../services/api'
import { handleApiError } from '../../../utils/notifications'

const StockDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stock, setStock] = useState(null)
  const [maleCount, setMaleCount] = useState(0)
  const [femaleCount, setFemaleCount] = useState(0)
  const [openDialog, setOpenDialog] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState(0)
  const [orderDetails, setOrderDetails] = useState(null)

  // Load stock details
  const loadStock = async () => {
    try {
      setLoading(true)
      const response = await petShopStockAPI.getPublicStockById(id)
      setStock(response.data.data.stock)
    } catch (err) {
      handleApiError(err, 'Failed to load stock details')
      setError('Failed to load stock details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStock()
  }, [id])

  const handlePurchase = () => {
    if (maleCount === 0 && femaleCount === 0) {
      alert('Please select at least one pet to purchase')
      return
    }
    
    if (maleCount > (stock?.maleCount || 0)) {
      alert(`Only ${stock?.maleCount} male pets available`)
      return
    }
    
    if (femaleCount > (stock?.femaleCount || 0)) {
      alert(`Only ${stock?.femaleCount} female pets available`)
      return
    }
    
    setOpenDialog(true)
  }

  const handleConfirmPurchase = async () => {
    try {
      setLoading(true)
      
      // Reserve pets from stock
      const reservationData = {
        stockId: id,
        maleCount,
        femaleCount
      }
      
      const response = await petShopStockAPI.reservePetsFromStock(reservationData)
      
      // Move to payment step
      setOrderDetails(response.data.data)
      setCheckoutStep(1)
      
    } catch (err) {
      handleApiError(err, 'Failed to reserve pets')
      setError('Failed to reserve pets')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    try {
      setLoading(true)
      
      // Create individual pets from stock with unique pet codes
      const reservationData = {
        stockId: id,
        maleCount,
        femaleCount
      }
      
      const response = await petShopStockAPI.reservePetsFromStock(reservationData)
      
      // Move to confirmation step
      setCheckoutStep(2)
      
      // In a real implementation, you would integrate with Razorpay here
      // After payment is confirmed, the backend would generate individual pets with unique codes
      
    } catch (err) {
      handleApiError(err, 'Failed to reserve pets')
      setError('Failed to reserve pets')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
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

  if (!stock) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">Stock not found</Alert>
      </Container>
    )
  }

  const steps = ['Reserve Pets', 'Payment', 'Confirmation']

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button 
        startIcon={<BackIcon />} 
        onClick={() => navigate('/User/petshop/stocks')}
        sx={{ mb: 2 }}
      >
        Back to Stocks
      </Button>

      <Grid container spacing={4}>
        {/* Stock Images */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {stock.name}
              </Typography>
              
              <Grid container spacing={2}>
                {stock.maleImages && stock.maleImages.length > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="200"
                        image={stock.maleImages[0]?.url || ''}
                        alt="Male pet"
                      />
                      <CardContent>
                        <Typography variant="body1" align="center">
                          <MaleIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                          Male Pets
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                
                {stock.femaleImages && stock.femaleImages.length > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="200"
                        image={stock.femaleImages[0]?.url || ''}
                        alt="Female pet"
                      />
                      <CardContent>
                        <Typography variant="body1" align="center">
                          <FemaleIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                          Female Pets
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Stock Details and Purchase Options */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Stock Details
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1"><strong>Species:</strong></Typography>
                  <Typography>{stock.species?.displayName || stock.species?.name || 'N/A'}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1"><strong>Breed:</strong></Typography>
                  <Typography>{stock.breed?.name || 'N/A'}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1"><strong>Age:</strong></Typography>
                  <Typography>{stock.age} {stock.ageUnit}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1"><strong>Color:</strong></Typography>
                  <Typography>{stock.color || 'N/A'}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1"><strong>Size:</strong></Typography>
                  <Typography>{stock.size}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1"><strong>Price per pet:</strong></Typography>
                  <Typography variant="h6" color="primary">{formatPrice(stock.price)}</Typography>
                </Box>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Available Pets
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <MaleIcon sx={{ mr: 1 }} />
                          <Typography variant="h6">Male</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Available: {stock.maleCount}
                        </Typography>
                        <TextField
                          fullWidth
                          type="number"
                          label="Quantity"
                          value={maleCount}
                          onChange={(e) => setMaleCount(Math.max(0, Math.min(parseInt(e.target.value) || 0, stock.maleCount)))}
                          inputProps={{ min: 0, max: stock.maleCount }}
                          margin="normal"
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <FemaleIcon sx={{ mr: 1 }} />
                          <Typography variant="h6">Female</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Available: {stock.femaleCount}
                        </Typography>
                        <TextField
                          fullWidth
                          type="number"
                          label="Quantity"
                          value={femaleCount}
                          onChange={(e) => setFemaleCount(Math.max(0, Math.min(parseInt(e.target.value) || 0, stock.femaleCount)))}
                          inputProps={{ min: 0, max: stock.femaleCount }}
                          margin="normal"
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                <Box>
                  <Typography variant="body1">Total Pets: {maleCount + femaleCount}</Typography>
                  <Typography variant="h6" color="primary">
                    Total: {formatPrice((maleCount + femaleCount) * stock.price)}
                  </Typography>
                </Box>
                
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CartIcon />}
                  onClick={handlePurchase}
                  disabled={maleCount === 0 && femaleCount === 0}
                >
                  Purchase
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Purchase Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Purchase Pets from Stock</DialogTitle>
        <DialogContent>
          <Stepper activeStep={checkoutStep} alternativeLabel sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {checkoutStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Confirm Your Selection
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You are purchasing:
              </Typography>
              <ul>
                {maleCount > 0 && (
                  <li>{maleCount} Male {stock.name}(s)</li>
                )}
                {femaleCount > 0 && (
                  <li>{femaleCount} Female {stock.name}(s)</li>
                )}
              </ul>
              <Typography variant="body1">
                Total: {formatPrice((maleCount + femaleCount) * stock.price)}
              </Typography>
            </Box>
          )}
          
          {checkoutStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Payment
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Proceed to payment to complete your purchase.
              </Typography>
              {/* In a real implementation, you would integrate with Razorpay here */}
            </Box>
          )}
          
          {checkoutStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Purchase Confirmed!
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Your purchase has been confirmed. Individual pets will be generated with unique pet codes.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You can view your purchased pets in your dashboard.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          
          {checkoutStep === 0 && (
            <Button onClick={handleConfirmPurchase} variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Confirm Reservation'}
            </Button>
          )}
          
          {checkoutStep === 1 && (
            <Button onClick={handlePayment} variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Pay Now'}
            </Button>
          )}
          
          {checkoutStep === 2 && (
            <Button 
              onClick={() => {
                setOpenDialog(false)
                navigate('/User/petshop/my-purchased-pets')
              }} 
              variant="contained"
            >
              View Purchased Pets
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default StockDetail