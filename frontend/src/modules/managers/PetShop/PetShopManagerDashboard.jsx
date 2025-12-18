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
  useTheme,
  alpha
} from '@mui/material'
import {
  Store as PetShopIcon,
  Pets as PetsIcon,
  People as StaffIcon,
  ShoppingCart as ProductIcon,
  Build as ServiceIcon,
  AttachMoney as RevenueIcon,
  Assessment as ReportsIcon,
  BookOnline as ReservationsIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Favorite as FavoriteIcon,
  Inventory as InventoryIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingUp as AnalyticsIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { apiClient, authAPI } from '../../../services/api'
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
  const [pincodeInput, setPincodeInput] = useState('')

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      // Refresh user data to ensure store information is up to date
      try {
        const res = await authAPI.getMe()
        if (res?.data?.data?.user) {
          // Only update profile if there are actual changes to avoid infinite loops
          const currentUser = user || {};
          const newUser = res.data.data.user || {};
          
          // Check if there are meaningful changes
          const hasChanges = 
            currentUser.storeName !== newUser.storeName ||
            currentUser.storeId !== newUser.storeId ||
            currentUser.needsStoreSetup !== newUser.needsStoreSetup;
            
          if (hasChanges) {
            // Use updateProfile function properly
            await updateProfile(res.data.data.user);
          }
        }
      } catch (err) {
        console.warn('Failed to refresh user data:', err)
      }
      
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
    const initializeDashboard = async () => {
      loadDashboardData()
      // If manager has storeId but no storeName, prompt to set it
      if (user?.role?.includes('manager') && user?.storeId && !user?.storeName) {
        setStoreNameInput('')
        setStoreDialogOpen(true)
      }
    }
    
    initializeDashboard()
  }, []) // Empty dependency array to only run once on mount

  const loadStats = async () => {
    try {
      // Combine: use /petshop/stats for staff/products/services, and inventory counts for animals
      const [statsRes, invAllRes, invSaleRes] = await Promise.all([
        apiClient.get('/petshop/manager/stats'),
        apiClient.get('/petshop/manager/inventory?limit=1'),
        apiClient.get('/petshop/manager/inventory?status=available_for_sale&limit=1')
      ])
      
      const statsData = statsRes.data?.data || {}
      const totalAnimals = invAllRes.data?.data?.pagination?.total || 0
      const availableForSale = invSaleRes.data?.data?.pagination?.total || 0
      const lowStockItems = 0
      
      // Get pending purchase orders count
      let pendingOrders = 0
      try {
        const ordersRes = await apiClient.get('/petshop/manager/orders?status=pending')
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
        apiClient.get('/petshop/manager/inventory?limit=5'),
        apiClient.get('/petshop/user/public/wishlist?limit=3')
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
          <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={async () => {
            // Refresh user data first
            try {
              const res = await authAPI.getMe()
              if (res?.data?.data?.user) {
                // Only update if there are actual changes
                const currentUser = user || {};
                const newUser = res.data.data.user || {};
                
                // Check if there are meaningful changes
                const hasChanges = 
                  currentUser.storeName !== newUser.storeName ||
                  currentUser.storeId !== newUser.storeId ||
                  currentUser.needsStoreSetup !== newUser.needsStoreSetup;
                  
                if (hasChanges) {
                  // Use updateProfile function properly
                  await updateProfile(res.data.data.user);
                }
              }
            } catch (err) {
              console.warn('Failed to refresh user data:', err)
            }
            // Then refresh dashboard data
            loadDashboardData()
          }}>
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

      {/* Essential Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
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

        <Grid item xs={12} sm={6} md={3}>
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

        <Grid item xs={12} sm={6} md={3}>
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

        <Grid item xs={12} sm={6} md={3}>
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
        {/* Essential Management Sections */}
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Essential Management</Typography>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' } }} onClick={() => navigate('/manager/petshop/manage-inventory')}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Manage Inventory</Typography>
                  <Typography variant="body2" color="textSecondary">View and manage your pet inventory</Typography>
                </Box>
                <SettingsIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' } }} onClick={() => navigate('/manager/petshop/reservations')}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Reservations</Typography>
                  <Typography variant="body2" color="textSecondary">Manage pet reservations</Typography>
                </Box>
                <ReservationsIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' } }} onClick={() => navigate('/manager/petshop/orders')}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Orders & Invoices</Typography>
                  <Typography variant="body2" color="textSecondary">View orders and invoices</Typography>
                </Box>
                <ReceiptIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' } }} onClick={() => navigate('/manager/petshop/aiml-dashboard')}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>AI/ML Dashboard</Typography>
                  <Typography variant="body2" color="textSecondary">Machine learning insights</Typography>
                </Box>
                <AnalyticsIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Stock Management Section */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Stock Management</Typography>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' } }} onClick={() => navigate('/manager/petshop/wizard/basic')}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Add New Stock</Typography>
                  <Typography variant="body2" color="textSecondary">Create new pet stocks in bulk</Typography>
                </Box>
                <PetsIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' } }} onClick={() => navigate('/manager/petshop/stocks')}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Manage Stocks</Typography>
                  <Typography variant="body2" color="textSecondary">View and manage existing pet stocks</Typography>
                </Box>
                <InventoryIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
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

          {/* Quick Stats Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssessmentIcon color="primary" />
                Quick Stats
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="textSecondary">Total Revenue</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>₹{stats.monthlyRevenue?.toLocaleString() || '0'}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">Available Pets</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{stats.availableForSale || 0}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">Pending Reservations</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{stats.pendingOrders || 0}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Quick Stats Summary */}
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              cursor: 'pointer',
              '&:hover': { 
                transform: 'translateY(-2px)', 
                transition: 'transform 0.2s',
                boxShadow: 3
              }
            }}
            onClick={() => navigate('/manager/petshop/analytics')}
          >
            <CardContent sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssessmentIcon sx={{ fontSize: 32, color: 'primary.main', mr: 1 }} />
                <Typography variant="h6">Analytics</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                View detailed analytics and reports for your pet shop
              </Typography>
              <Button 
                size="small" 
                variant="outlined"
                sx={{ mt: 'auto' }}
              >
                View Analytics
              </Button>
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
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Pincode (Optional)"
            placeholder="e.g., 123456"
            value={pincodeInput}
            onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputProps={{ maxLength: 6 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStoreDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              const name = storeNameInput.trim()
              if (!name) return
              // Prepare data for update
              const updateData = { storeName: name }
              if (pincodeInput && pincodeInput.length === 6) {
                updateData.pincode = pincodeInput
              }
              // Use the authAPI to update user profile directly
              try {
                await authAPI.updateProfile(updateData)
                // Refresh the user data from the backend to get updated store info
                const res = await authAPI.getMe()
                if (res?.data?.data?.user) {
                  // Only update if there are actual changes
                  const currentUser = user || {};
                  const newUser = res.data.data.user || {};
                  
                  // Check if there are meaningful changes
                  const hasChanges = 
                    currentUser.storeName !== newUser.storeName ||
                    currentUser.storeId !== newUser.storeId ||
                    currentUser.needsStoreSetup !== newUser.needsStoreSetup;
                    
                  if (hasChanges) {
                    // Use updateProfile function properly
                    await updateProfile(res.data.data.user);
                  }
                }
                setStoreDialogOpen(false)
                setLastUpdated(new Date())
              } catch (error) {
                setError(error?.response?.data?.message || 'Failed to update store info')
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