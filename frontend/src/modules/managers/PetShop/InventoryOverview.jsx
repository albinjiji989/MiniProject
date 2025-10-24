import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  Snackbar
} from '@mui/material'
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  Inventory as InventoryIcon,
  Publish as PublishIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material'
import { apiClient } from '../../../services/api'

const InventoryOverview = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [stats, setStats] = useState({
    totalInventory: 0,
    inPetshop: 0,
    published: 0,
    totalValue: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const [allRes, inShopRes, pubRes] = await Promise.all([
        apiClient.get('/petshop/manager/inventory?limit=1'),
        apiClient.get('/petshop/manager/inventory?status=in_petshop&limit=1'),
        apiClient.get('/petshop/manager/inventory?status=available_for_sale&limit=50')
      ])
      const totalInventory = allRes.data?.data?.pagination?.total || 0
      const inPetshop = inShopRes.data?.data?.pagination?.total || 0
      const publishedItems = pubRes.data?.data?.items || []
      const published = pubRes.data?.data?.pagination?.total ?? publishedItems.length
      const totalValue = publishedItems.reduce((sum, item) => sum + (Number(item.price || 0)), 0)
      
      setStats({ totalInventory, inPetshop, published, totalValue })
    } catch (err) {
      console.error('Fetch stats error:', err)
      showSnackbar('Failed to load statistics', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h4" component="h1" gutterBottom>
        PetShop Inventory Management
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        Manage your pet inventory, pricing, and public listings
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {stats.totalInventory}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Inventory
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                {stats.inPetshop}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                In PetShop
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {stats.published}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Published
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">
                ₹{stats.totalValue.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AddIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5">Add New Stock</Typography>
              </Box>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                Add new pets to your inventory with multi-step age and gender distribution
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => navigate('/manager/petshop/wizard/basic')}
              >
                Add New Stock
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <InventoryIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Typography variant="h5">Manage Inventory</Typography>
              </Box>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                Edit individual pets, set prices, and release to public
              </Typography>
              <Button
                variant="contained"
                size="large"
                fullWidth
                color="success"
                onClick={() => navigate('/manager/petshop/manage-inventory')}
              >
                Manage Inventory
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SettingsIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Typography variant="h5">Pricing Rules</Typography>
              </Box>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                Set up automatic pricing based on age, gender, and breed
              </Typography>
              <Button
                variant="contained"
                size="large"
                fullWidth
                color="warning"
              >
                Manage Pricing
              </Button>
            </CardContent>
          </Card>
        </Grid> */}
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default InventoryOverview
