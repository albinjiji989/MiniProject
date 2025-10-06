import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  useTheme,
  alpha,
  LinearProgress
} from '@mui/material'
import {
  Store as PetShopIcon,
  Pets as PetsIcon,
  People as StaffIcon,
  Warning as WarningIcon,
  ShoppingCart as ProductIcon,
  Build as ServiceIcon,
  AttachMoney as RevenueIcon,
  Inventory as InventoryIcon,
  Assessment as ReportsIcon,
  BookOnline as ReservationsIcon,
  LocalShipping as OrdersIcon,
  TrendingUp as TrendingUpIcon,
  Settings as SettingsIcon
} from '@mui/icons-material'
import { Favorite as FavoriteIcon, AttachMoney as AttachMoneyIcon } from '@mui/icons-material'
import { Refresh as RefreshIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../../services/api'
import { useAuth } from '../../../contexts/AuthContext'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material'
import { formatDistanceToNow } from 'date-fns'

const PetShopManagerDashboard = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { user, updateProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [error, setError] = useState('')
  const [recentActivities, setRecentActivities] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)
  const [stats, setStats] = useState({
    totalAnimals: 0,
    availableForSale: 0,
    staffMembers: 0,
    totalProducts: 0,
    totalServices: 0,
    monthlyRevenue: 0,
    pendingOrders: 0,
    lowStockItems: 0
  })

  // Store identity prompt
  const [storeDialogOpen, setStoreDialogOpen] = useState(false)
  const [storeNameInput, setStoreNameInput] = useState('')

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadStats(),
        loadRecentActivities()
      ])
      setLastUpdated(new Date())
    } catch (err) {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
    // If manager has storeId but no storeName, prompt to set it
    if (user?.role?.includes('manager') && user?.storeId && !user?.storeName) {
      setStoreNameInput('')
      setStoreDialogOpen(true)
    }
    const intervalId = setInterval(() => {
      loadDashboardData()
    }, 60000) // auto-refresh every 60s
    return () => clearInterval(intervalId)
  }, [])

  const loadStats = async () => {
    try {
      // Combine: use /petshop/stats for staff/products/services, and inventory counts for animals
      const [statsRes, invAllRes, invSaleRes] = await Promise.all([
        apiClient.get('/petshop/stats'),
        apiClient.get('/petshop/inventory?limit=1'),
        apiClient.get('/petshop/inventory?status=available_for_sale&limit=1')
      ])
      
      const statsData = statsRes.data?.data || {}
      const totalAnimals = invAllRes.data?.data?.pagination?.total || 0
      const availableForSale = invSaleRes.data?.data?.pagination?.total || 0
      const lowStockItems = 0
      
      // Get pending purchase orders count
      let pendingOrders = 0
      try {
        const ordersRes = await apiClient.get('/petshop/orders?status=pending')
        pendingOrders = ordersRes.data.meta?.total || 0
      } catch (err) {
        console.warn('Could not fetch pending orders:', err.message)
      }
      
      setStats({
        totalAnimals,
        availableForSale,
        staffMembers: statsData.staffMembers || 0,
        totalProducts: statsData.totalProducts || 0,
        totalServices: statsData.totalServices || 0,
        monthlyRevenue: statsData.monthlyRevenue || 0,
        pendingOrders,
        lowStockItems
      })
    } catch (err) {
      console.error('Error loading stats:', err)
      throw new Error('Failed to load pet shop statistics')
    }
  }
  const loadRecentActivities = async () => {
    try {
      setActivitiesLoading(true)
      
      // Get recent internal inventory updates (manager view) and wishlist items
      const [inventoryRes, wishlistRes] = await Promise.allSettled([
        apiClient.get('/petshop/inventory?limit=5'),
        apiClient.get('/petshop/public/wishlist?limit=3')
      ])
      const activities = []
      const now = new Date()
      
      // Process inventory updates if successful
      if (inventoryRes.status === 'fulfilled' && inventoryRes.value?.data?.data?.items) {
        inventoryRes.value.data.data.items.forEach(item => {
          const updatedAt = new Date(item.updatedAt || item.createdAt || now)
          const timeDiff = now - updatedAt
          const daysDiff = timeDiff / (1000 * 60 * 60 * 24)
          
          // Only show recent updates (last 7 days)
          if (daysDiff <= 7) {
            const itemName = item.name || item.title || 'Pet'
            
            activities.push({
              id: `inventory-${item._id || item.id || Math.random().toString(36).substr(2, 9)}`,
              type: 'inventory',
              message: `Inventory updated: ${itemName} (${item.status?.replace('_',' ') || 'in petshop'})`,
              time: formatDistanceToNow(updatedAt, { addSuffix: true }),
              ts: updatedAt.getTime(),
              priority: 'medium',
              amount: item.price ? `₹${parseFloat(item.price).toLocaleString()}` : null
            })
          }
        })
      }
      
      // Process wishlist items if successful
      if (wishlistRes.status === 'fulfilled') {
        const wl = wishlistRes.value?.data
        let wishlistItems = []
        if (Array.isArray(wl?.data)) wishlistItems = wl.data
        else if (Array.isArray(wl?.data?.items)) wishlistItems = wl.data.items
        else if (Array.isArray(wl?.items)) wishlistItems = wl.items
        else wishlistItems = []

        for (const item of wishlistItems) {
          const itemData = item.itemId || item
          activities.push({
            id: `wishlist-${item._id || item.id || Math.random().toString(36).substr(2, 9)}`,
            type: 'wishlist',
            message: `Item added to wishlist: ${itemData?.name || 'Pet'}`,
            time: formatDistanceToNow(new Date(item.createdAt || now), { addSuffix: true }),
            ts: new Date(item.createdAt || now).getTime(),
            priority: 'low'
          })
        }
      }
      
      // Sort by time and limit to 6 most recent
      setRecentActivities(
        activities
          .sort((a, b) => (b.ts || 0) - (a.ts || 0))
          .slice(0, 6)
      )
    } catch (err) {
      console.error('Error loading activities:', err)
      // Don't show error to user for activities, just log it
      setRecentActivities([])
    } finally {
      setActivitiesLoading(false)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error'
      case 'medium': return 'warning'
      case 'low': return 'info'
      default: return 'default'
    }
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'inventory': return <InventoryIcon />
      case 'wishlist': return <FavoriteIcon />
      case 'sale': return <AttachMoneyIcon />
      case 'reservation': return <ReservationsIcon />
      default: return <TrendingUpIcon />
    }
  }

  if (loading) {
    return (
      <>
        {/* Loading indicator */}
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </>
    )
  }
  // Don't block render for activities loading, show partial data
  return (
    <>
      {/* Welcome Section */}
      <Box sx={{ 
        mb: 4,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        borderRadius: 3,
        p: 4,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Store Identity Badge */}
        {user?.role?.includes('manager') && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Chip color="primary" label={`Store ID: ${user?.storeId || 'Pending assignment'}`} />
            <Chip color={user?.storeName ? 'success' : 'warning'} label={`Store Name: ${user?.storeName || 'Not set'}`} />
            {!user?.storeName && (
              <Button size="small" variant="contained" onClick={() => setStoreDialogOpen(true)}>
                Set Store Name
              </Button>
            )}
          </Box>
        )}
        <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={loadDashboardData}>
            Refresh
          </Button>
          {lastUpdated && (
            <Typography variant="caption" color="textSecondary">
              Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </Typography>
          )}
        </Box>
        <Typography variant="h3" sx={{ 
          mb: 2, 
          fontWeight: 800,
          color: 'primary.main'
        }}>
          Welcome back, {user?.name?.split(' ')[0] || 'Manager'}! 👋
        </Typography>
        <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
          Here's what's happening in your pet shop today
        </Typography>
        
        {/* Quick Stats Bar */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
              ₹{stats.monthlyRevenue?.toLocaleString() || '0'}
            </Typography>
            <Typography variant="body2" color="textSecondary">Monthly Revenue</Typography>
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
              {stats.pendingOrders || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">Pending Orders</Typography>
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
              {stats.lowStockItems || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">Low Stock Alerts</Typography>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white',
            '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {stats.totalAnimals || 0}
                  </Typography>
                  <Typography variant="body2">
                    Total Animals
                  </Typography>
                </Box>
                <PetsIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

      {/* Management Shortcuts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 1 }}>Management Shortcuts</Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' } }} onClick={() => navigate('/manager/petshop/add-stock')}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Add Pet Stock</Typography>
                  <Typography variant="body2" color="textSecondary">Create new inventory entries</Typography>
                </Box>
                <InventoryIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' } }} onClick={() => navigate('/manager/petshop/manage-inventory')}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Manage Inventory</Typography>
                  <Typography variant="body2" color="textSecondary">Search, filter, bulk actions</Typography>
                </Box>
                <SettingsIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' } }} onClick={() => navigate('/manager/petshop/pricing-rules')}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Pricing Rules</Typography>
                  <Typography variant="body2" color="textSecondary">Define automatic pricing</Typography>
                </Box>
                <TrendingUpIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' } }} onClick={() => navigate('/manager/petshop/for-sale')}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Available For Sale</Typography>
                  <Typography variant="body2" color="textSecondary">Released items ({stats.availableForSale || 0})</Typography>
                </Box>
                <PetsIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
            color: 'white',
            '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {stats.availableForSale || 0}
                  </Typography>
                  <Typography variant="body2">
                    Available for Sale
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
            color: 'white',
            '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {stats.totalProducts || 0}
                  </Typography>
                  <Typography variant="body2">
                    Products
                  </Typography>
                </Box>
                <ProductIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', 
            color: 'white',
            '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {stats.totalServices || 0}
                  </Typography>
                  <Typography variant="body2">
                    Services
                  </Typography>
                </Box>
                <ServiceIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', 
            color: 'white',
            '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {stats.staffMembers || 0}
                  </Typography>
                  <Typography variant="body2">
                    Staff Members
                  </Typography>
                </Box>
                <StaffIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Activities */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon />
                Recent Activities
              </Typography>
              <List>
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <ListItem key={activity.id} divider>
                      <ListItemIcon>
                        {getActivityIcon(activity.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.message}
                        secondary={activity.time}
                      />
                      {activity.amount && (
                        <Typography variant="body2" color="text.primary">
                          {activity.amount}
                        </Typography>
                      )}
                      <Chip
                        label={activity.priority}
                        color={getPriorityColor(activity.priority)}
                        size="small"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText 
                      primary="No recent activities" 
                      primaryTypographyProps={{ color: 'text.secondary', fontStyle: 'italic' }}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon color="primary" />
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button 
                    variant="contained" 
                    fullWidth
                    startIcon={<InventoryIcon />}
                    onClick={() => navigate('/manager/petshop/inventory')}
                    sx={{ 
                      py: 2, 
                      flexDirection: 'column', 
                      gap: 1,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                  >
                    <Box>Inventory</Box>
                    <Typography variant="caption">Manage Stock</Typography>
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button 
                    variant="contained" 
                    fullWidth
                    startIcon={<OrdersIcon />}
                    onClick={() => navigate('/manager/petshop/orders')}
                    sx={{ 
                      py: 2, 
                      flexDirection: 'column', 
                      gap: 1,
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                    }}
                  >
                    <Box>Orders</Box>
                    <Typography variant="caption">View & Process</Typography>
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button 
                    variant="contained" 
                    fullWidth
                    startIcon={<ReservationsIcon />}
                    onClick={() => navigate('/manager/petshop/reservations')}
                    sx={{ 
                      py: 2, 
                      flexDirection: 'column', 
                      gap: 1,
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                    }}
                  >
                    <Box>Reservations</Box>
                    <Typography variant="caption">Bookings</Typography>
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button 
                    variant="contained" 
                    fullWidth
                    startIcon={<ReportsIcon />}
                    onClick={() => navigate('/manager/petshop/reports')}
                    sx={{ 
                      py: 2, 
                      flexDirection: 'column', 
                      gap: 1,
                      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                    }}
                  >
                    <Box>Reports</Box>
                    <Typography variant="caption">Analytics</Typography>
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    variant="outlined" 
                    fullWidth
                    startIcon={<StaffIcon />}
                    onClick={() => navigate('/manager/petshop/staff')}
                    sx={{ py: 1.5 }}
                  >
                    Manage Staff & Settings
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Set Store Name Dialog */}
      <Dialog open={storeDialogOpen} onClose={() => setStoreDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Set Your Store Name</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Store ID: <strong>{user?.storeId || 'Pending assignment'}</strong>
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Store Name"
            placeholder="e.g., Happy Paws Pet Shop"
            value={storeNameInput}
            onChange={(e) => setStoreNameInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStoreDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              const name = storeNameInput.trim()
              if (!name) return
              const res = await updateProfile({ storeName: name })
              if (res?.success) {
                setStoreDialogOpen(false)
                setLastUpdated(new Date())
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default PetShopManagerDashboard
