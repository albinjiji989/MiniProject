import React from 'react'
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box,
  LinearProgress
} from '@mui/material'
import { 
  AddPhotoAlternate as AddPhotoAlternateIcon,
  Pending as PendingIcon,
  CheckCircle as CheckCircleIcon,
  Publish as PublishIcon,
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material'

const EnhancedStatsSection = ({ 
  inventory, 
  readyForRelease, 
  releasedPets, 
  purchasedPets, 
  selectedIds, 
  selectedReadyIds, 
  selectedReleasedIds, 
  selectedPurchasedIds 
}) => {
  const totalPets = inventory.length + readyForRelease.length + releasedPets.length + purchasedPets.length
  const selectedPets = selectedIds.length + selectedReadyIds.length + selectedReleasedIds.length + selectedPurchasedIds.length
  
  // Calculate percentages for progress bars
  const pendingPercentage = totalPets > 0 ? Math.round((inventory.length / totalPets) * 100) : 0
  const readyPercentage = totalPets > 0 ? Math.round((readyForRelease.length / totalPets) * 100) : 0
  const releasedPercentage = totalPets > 0 ? Math.round((releasedPets.length / totalPets) * 100) : 0
  const purchasedPercentage = totalPets > 0 ? Math.round((purchasedPets.length / totalPets) * 100) : 0
  
  // Calculate total value of inventory
  const calculateTotalValue = (pets) => {
    return pets.reduce((total, pet) => total + (Number(pet.price) || 0), 0)
  }
  
  const pendingValue = calculateTotalValue(inventory)
  const readyValue = calculateTotalValue(readyForRelease)
  const releasedValue = calculateTotalValue(releasedPets)
  const purchasedValue = calculateTotalValue(purchasedPets)
  const totalValue = pendingValue + readyValue + releasedValue + purchasedValue

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {/* Total Pets Card */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ 
          bgcolor: '#e3f2fd', 
          borderLeft: '4px solid #1976d2', 
          height: '100%',
          boxShadow: 2,
          borderRadius: 2,
          transition: 'transform 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: 4
          }
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="#1976d2">
                  {totalPets}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Pets
                </Typography>
              </Box>
              <AddPhotoAlternateIcon sx={{ fontSize: 40, color: '#1976d2' }} />
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Inventory Value: ₹{totalValue.toLocaleString()}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Pending Images Card */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ 
          bgcolor: '#fff3e0', 
          borderLeft: '4px solid #f57c00', 
          height: '100%',
          boxShadow: 2,
          borderRadius: 2,
          transition: 'transform 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: 4
          }
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="#f57c00">
                  {inventory.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Need Images
                </Typography>
              </Box>
              <PendingIcon sx={{ fontSize: 40, color: '#f57c00' }} />
            </Box>
            <Box sx={{ mt: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={pendingPercentage} 
                sx={{ 
                  bgcolor: 'rgba(245, 124, 0, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#f57c00'
                  }
                }} 
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  {pendingPercentage}%
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  ₹{pendingValue.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Ready for Release Card */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ 
          bgcolor: '#e8f5e9', 
          borderLeft: '4px solid #4caf50', 
          height: '100%',
          boxShadow: 2,
          borderRadius: 2,
          transition: 'transform 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: 4
          }
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="#4caf50">
                  {readyForRelease.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Ready for Release
                </Typography>
              </Box>
              <CheckCircleIcon sx={{ fontSize: 40, color: '#4caf50' }} />
            </Box>
            <Box sx={{ mt: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={readyPercentage} 
                sx={{ 
                  bgcolor: 'rgba(76, 175, 80, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#4caf50'
                  }
                }} 
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  {readyPercentage}%
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  ₹{readyValue.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Released Pets Card */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ 
          bgcolor: '#e1f5fe', 
          borderLeft: '4px solid #0288d1', 
          height: '100%',
          boxShadow: 2,
          borderRadius: 2,
          transition: 'transform 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: 4
          }
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="#0288d1">
                  {releasedPets.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Released Pets
                </Typography>
              </Box>
              <PublishIcon sx={{ fontSize: 40, color: '#0288d1' }} />
            </Box>
            <Box sx={{ mt: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={releasedPercentage} 
                sx={{ 
                  bgcolor: 'rgba(2, 136, 209, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#0288d1'
                  }
                }} 
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  {releasedPercentage}%
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  ₹{releasedValue.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Purchased Pets Card - New Card */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ 
          bgcolor: '#f3e5f5', 
          borderLeft: '4px solid #7b1fa2', 
          height: '100%',
          boxShadow: 2,
          borderRadius: 2,
          transition: 'transform 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: 4
          }
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="#7b1fa2">
                  {purchasedPets.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Purchased Pets
                </Typography>
              </Box>
              <ShoppingCartIcon sx={{ fontSize: 40, color: '#7b1fa2' }} />
            </Box>
            <Box sx={{ mt: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={purchasedPercentage} 
                sx={{ 
                  bgcolor: 'rgba(123, 31, 162, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#7b1fa2'
                  }
                }} 
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  {purchasedPercentage}%
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  ₹{purchasedValue.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Selected Pets Card - Enhanced */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ 
          bgcolor: '#fce4ec', 
          borderLeft: '4px solid #e91e63', 
          height: '100%',
          boxShadow: 2,
          borderRadius: 2,
          transition: 'transform 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: 4
          }
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="#e91e63">
                  {selectedPets}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Selected Pets
                </Typography>
              </Box>
              <TrendingUpIcon sx={{ fontSize: 40, color: '#e91e63' }} />
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                {totalPets > 0 ? Math.round((selectedPets / totalPets) * 100) : 0}% of inventory
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default EnhancedStatsSection