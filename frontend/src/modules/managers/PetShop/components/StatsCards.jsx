import React from 'react'
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box 
} from '@mui/material'
import { 
  AddPhotoAlternate as AddPhotoAlternateIcon,
  Pending as PendingIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material'

const StatsCards = ({ 
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

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: '#e3f2fd', borderLeft: '4px solid #1976d2' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {totalPets}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Pets
                </Typography>
              </Box>
              <AddPhotoAlternateIcon sx={{ fontSize: 40, color: '#1976d2' }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: '#fff3e0', borderLeft: '4px solid #f57c00' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {inventory.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Need Images
                </Typography>
              </Box>
              <PendingIcon sx={{ fontSize: 40, color: '#f57c00' }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: '#e8f5e9', borderLeft: '4px solid #4caf50' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {readyForRelease.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Ready for Release
                </Typography>
              </Box>
              <CheckCircleIcon sx={{ fontSize: 40, color: '#4caf50' }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: '#fce4ec', borderLeft: '4px solid #e91e63' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {selectedPets}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Selected
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default StatsCards