import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Avatar,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  AppBar,
  Toolbar,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Business as StoreIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  People as PeopleIcon,
  Pets as PetsIcon,
  Assignment as AssignmentIcon,
  TrendingUp as StatsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'

const ModuleAdminDashboardTemplate = ({ moduleName, moduleIcon, moduleColor }) => {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalItems: 0,
    activeItems: 0,
    pendingItems: 0,
    completedItems: 0
  })
  const [recentItems, setRecentItems] = useState([])
  const [storeInfo, setStoreInfo] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch store-specific data
      const [petsRes, statsRes] = await Promise.all([
        api.get('/pets').catch(() => ({ data: { data: { pets: [] } } })),
        api.get(`/${moduleName}/stats`).catch(() => ({ data: { stats: {} } }))
      ])
      
      const pets = petsRes.data.data?.pets || []
      const moduleStats = statsRes.data.stats || {}
      
      // Calculate statistics
      setStats({
        totalItems: pets.length,
        activeItems: pets.filter(pet => pet.currentStatus === 'available').length,
        pendingItems: pets.filter(pet => pet.currentStatus === 'pending').length,
        completedItems: pets.filter(pet => pet.currentStatus === 'adopted').length
      })
      
      // Get recent items
      const recentItemsData = pets
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(item => ({
          id: item._id,
          name: item.name,
          status: item.currentStatus,
          createdAt: item.createdAt,
          type: 'pet' // This would be dynamic based on module
        }))
      
      setRecentItems(recentItemsData)
      
      // Set store information
      setStoreInfo({
        name: user.storeName || `${moduleName} Store`,
        location: user.storeLocation || {},
        phone: user.storeDetails?.phone || 'N/A',
        email: user.storeDetails?.email || 'N/A'
      })
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setStats({
        totalItems: 0,
        activeItems: 0,
        pendingItems: 0,
        completedItems: 0
      })
      setRecentItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
  }

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${color}15, ${color}05)` }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: color, mr: 2 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: color }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Navigation Bar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} Management - {storeInfo?.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">
              Welcome, {user?.name}
            </Typography>
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Container maxWidth="xl">
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center' }}>
              {moduleIcon}
              <Box sx={{ ml: 2 }}>
                <Typography variant="h4" component="span">
                  {moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {storeInfo?.name} - Store Management
                </Typography>
              </Box>
            </Typography>
          </Box>

          {/* Store Information */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <StoreIcon sx={{ mr: 1 }} />
                Store Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Address
                      </Typography>
                      <Typography variant="body1">
                        {storeInfo?.location?.addressLine1 || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {storeInfo?.location?.city}, {storeInfo?.location?.state} {storeInfo?.location?.zipCode}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1">
                        {storeInfo?.phone}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1">
                        {storeInfo?.email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PeopleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Store ID
                      </Typography>
                      <Typography variant="body1">
                        {user?.storeId || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Items"
                value={stats.totalItems}
                icon={<PetsIcon />}
                color={moduleColor}
                subtitle="In your store"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Active Items"
                value={stats.activeItems}
                icon={<AssignmentIcon />}
                color="#4caf50"
                subtitle="Currently available"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Pending Items"
                value={stats.pendingItems}
                icon={<StatsIcon />}
                color="#ff9800"
                subtitle="Awaiting approval"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Completed Items"
                value={stats.completedItems}
                icon={<ViewIcon />}
                color="#2196f3"
                subtitle="Successfully processed"
              />
            </Grid>
          </Grid>

          {/* Recent Items */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <PetsIcon sx={{ mr: 1 }} />
                  Recent Items
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{ bgcolor: moduleColor }}
                >
                  Add New Item
                </Button>
              </Box>
              
              {recentItems.length === 0 ? (
                <Alert severity="info">
                  No items found in your store. Add some items to get started!
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>
                            <Chip 
                              label={item.type} 
                              size="small" 
                              color="primary" 
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={item.status} 
                              size="small" 
                              color={item.status === 'available' ? 'success' : 'default'} 
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <IconButton size="small">
                              <EditIcon />
                            </IconButton>
                            <IconButton size="small">
                              <ViewIcon />
                            </IconButton>
                            <IconButton size="small">
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Container>
      </Box>
    </Box>
  )
}

export default ModuleAdminDashboardTemplate


