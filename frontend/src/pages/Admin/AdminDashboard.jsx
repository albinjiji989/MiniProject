import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  Alert,
  Snackbar,
  CircularProgress,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material'
import {
  People as UsersIcon,
  Business as ModuleIcon,
  BusinessCenter as BusinessIcon,
  Pets as PetsIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assignment as AssignmentIcon,
  PersonAdd as PersonAddIcon,
  Category as CategoryIcon,
  Biotech as SpeciesIcon,
  Pets as BreedIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { userAPI as usersAPI, modulesAPI, managersAPI, apiClient, dashboardAPI } from '../../services/api'
import {
  speciesAPI,
  breedsAPI,
  petsAPI as adminPetsAPI,
  customBreedRequestsAPI,
  petCategoriesAPI,
} from '../../services/petSystemAPI'
import AdminStatCard from '../../components/Admin/AdminStatCard'

const AdminDashboard = () => {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Statistics data
  const [stats, setStats] = useState({
    users: { total: 0, active: 0, new: 0, growth: 0 },
    managers: { total: 0, active: 0, pending: 0, growth: 0 },
    pets: { total: 0, available: 0, adopted: 0, growth: 0 },
    species: { total: 0, active: 0, growth: 0 },
    breeds: { total: 0, active: 0, growth: 0 },
    modules: { total: 0, active: 0, growth: 0 },
    breedRequests: { total: 0, pending: 0, approved: 0, growth: 0 },
    categories: { total: 0, active: 0, growth: 0 },
  })

  // Analytics data
  const [analytics, setAnalytics] = useState({
    recentActivities: [],
  })

  // Recent activities
  const [recentActivities, setRecentActivities] = useState([])
  const [systemAlerts, setSystemAlerts] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, []) // Empty dependency array to run only once

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Use the new comprehensive dashboard API with fallback
      const [statsResponse, activitiesResponse, alertsResponse] = await Promise.allSettled([
        dashboardAPI.getStats().catch(err => {
          console.warn('Dashboard stats API not available, using fallback:', err.message)
          return { data: null }
        }),
        dashboardAPI.getRecentActivities(10).catch(err => {
          console.warn('Dashboard activities API not available:', err.message)
          return { data: [] }
        }),
        dashboardAPI.getSystemAlerts().catch(err => {
          console.warn('Dashboard alerts API not available:', err.message)
          return { data: [] }
        })
      ])

      // Process stats data
      if (statsResponse.status === 'fulfilled' && statsResponse.value?.data) {
        const apiResponse = statsResponse.value.data
        const data = apiResponse.data // The actual data is nested under .data
        
        // Ensure all required properties exist with defaults
        const processedStats = {
          users: data.users || { total: 0, active: 0, new: 0, growth: 0 },
          managers: data.managers || { total: 0, active: 0, pending: 0, growth: 0 },
          pets: data.pets || { total: 0, available: 0, adopted: 0, growth: 0, bySpecies: [], byHealthStatus: [] },
          species: data.species || { total: 0, active: 0, growth: 0 },
          breeds: data.breeds || { total: 0, active: 0, growth: 0 },
          modules: data.modules || { total: 0, active: 0, growth: 0 },
          breedRequests: data.breedRequests || { total: 0, pending: 0, approved: 0, growth: 0 },
          categories: data.categories || { total: 0, active: 0, growth: 0 },
        }
        
        setStats(processedStats)
        
        // Set analytics data from the comprehensive stats
        setAnalytics({
          recentActivities: processedStats.pets.recent || [],
        })
      } else {
        // Fallback: show dashboard with zero values but no error
        setStats({
          users: { total: 0, active: 0, new: 0, growth: 0 },
          managers: { total: 0, active: 0, pending: 0, growth: 0 },
          pets: { total: 0, available: 0, adopted: 0, growth: 0 },
          species: { total: 0, active: 0, growth: 0 },
          breeds: { total: 0, active: 0, growth: 0 },
          modules: { total: 0, active: 0, growth: 0 },
          breedRequests: { total: 0, pending: 0, approved: 0, growth: 0 },
          categories: { total: 0, active: 0, growth: 0 },
        })
        setAnalytics({
          recentActivities: [],
        })
      }

      // Process activities data
      if (activitiesResponse.status === 'fulfilled' && activitiesResponse.value?.data) {
        setRecentActivities(Array.isArray(activitiesResponse.value.data) ? activitiesResponse.value.data : [])
      }

      // Process alerts data
      if (alertsResponse.status === 'fulfilled' && alertsResponse.value?.data) {
        setSystemAlerts(Array.isArray(alertsResponse.value.data) ? alertsResponse.value.data : [])
      }

    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError('Dashboard is loading with limited functionality. Some features may not be available.')
      
      // Set fallback data even on error
      setStats({
        users: { total: 0, active: 0, new: 0, growth: 0 },
        managers: { total: 0, active: 0, pending: 0, growth: 0 },
        pets: { total: 0, available: 0, adopted: 0, growth: 0 },
        species: { total: 0, active: 0, growth: 0 },
        breeds: { total: 0, active: 0, growth: 0 },
        modules: { total: 0, active: 0, growth: 0 },
        breedRequests: { total: 0, pending: 0, approved: 0, growth: 0 },
        categories: { total: 0, active: 0, growth: 0 },
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Admin Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Welcome back! Here's what's happening in your system.
        </Typography>
      </Box>

      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <Box mb={3}>
          {systemAlerts.map((alert) => (
            <Alert
              key={alert.id}
              severity={alert.type}
              action={alert.action && (
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => {
                    if (alert.actionUrl) {
                      navigate(alert.actionUrl)
                    } else if (alert.action === 'View Invites') {
                      navigate('/admin/managers')
                    } else if (alert.action === 'Review Requests') {
                      navigate('/admin/custom-breed-requests')
                    }
                  }}
                >
                  {alert.action}
                </Button>
              )}
              sx={{ mb: 1 }}
            >
              {alert.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* Main Statistics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <AdminStatCard
            title="Public Users"
            value={stats.users?.total || 0}
            subtitle={`${stats.users?.active || 0} active, ${stats.users?.new || 0} new`}
            icon={UsersIcon}
            color="primary.main"
            growth={stats.users?.growth || 0}
            onClick={() => navigate('/admin/users')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <AdminStatCard
            title="Managers"
            value={stats.managers?.total || 0}
            subtitle={`${stats.managers?.active || 0} active managers`}
            icon={BusinessIcon}
            color="warning.main"
            growth={stats.managers?.growth || 0}
            onClick={() => navigate('/admin/managers')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <AdminStatCard
            title="Total Pets"
            value={stats.pets?.total || 0}
            subtitle={`${stats.pets?.available || 0} available, ${stats.pets?.adopted || 0} adopted`}
            icon={PetsIcon}
            color="success.main"
            growth={stats.pets?.growth || 0}
            onClick={() => navigate('/admin/pets')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <AdminStatCard
            title="Breed Requests"
            value={stats.breedRequests?.total || 0}
            subtitle={`${stats.breedRequests?.pending || 0} pending review`}
            icon={AssignmentIcon}
            color="info.main"
            growth={stats.breedRequests?.growth || 0}
            onClick={() => navigate('/admin/custom-breed-requests')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <AdminStatCard
            title="Species"
            value={stats.species?.total || 0}
            subtitle={`${stats.species?.active || 0} active species`}
            icon={SpeciesIcon}
            color="secondary.main"
            growth={stats.species?.growth || 0}
            onClick={() => navigate('/admin/species')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <AdminStatCard
            title="Breeds"
            value={stats.breeds?.total || 0}
            subtitle={`${stats.breeds?.active || 0} active breeds`}
            icon={BreedIcon}
            color="info.main"
            growth={stats.breeds?.growth || 0}
            onClick={() => navigate('/admin/breeds')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <AdminStatCard
            title="Pet Categories"
            value={stats.categories?.total || 0}
            subtitle={`${stats.categories?.active || 0} active categories`}
            icon={CategoryIcon}
            color="success.main"
            growth={stats.categories?.growth || 0}
            onClick={() => navigate('/admin/pet-categories')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <AdminStatCard
            title="Modules"
            value={stats.modules?.total || 0}
            subtitle={`${stats.modules?.active || 0} active modules`}
            icon={ModuleIcon}
            color="warning.main"
            growth={stats.modules?.growth || 0}
            onClick={() => navigate('/admin/modules')}
          />
        </Grid>
      </Grid>



      {/* Quick Actions - Simplified */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Quick Actions</Typography>
            <Tooltip title="Refresh Dashboard">
              <IconButton onClick={loadDashboardData} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={() => navigate('/admin/manager-invite')}
                sx={{ py: 2 }}
              >
                Invite Manager
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CategoryIcon />}
                onClick={() => navigate('/admin/pet-categories')}
                sx={{ py: 2 }}
              >
                Add Pet Category
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<SpeciesIcon />}
                onClick={() => navigate('/admin/species')}
                sx={{ py: 2 }}
              >
                Manage Species
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<BreedIcon />}
                onClick={() => navigate('/admin/breeds')}
                sx={{ py: 2 }}
              >
                Manage Breeds
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Recent Activities</Typography>
              {recentActivities.length > 0 ? (
                <List>
                  {recentActivities.map((activity) => {
                    const IconComponent = activity.icon === 'PersonAdd' ? PersonAddIcon : 
                                        activity.icon === 'Pets' ? PetsIcon : 
                                        activity.icon === 'Assignment' ? AssignmentIcon : PersonAddIcon
                    return (
                      <ListItem key={activity.id} divider>
                        <ListItemIcon>
                          <IconComponent />
                        </ListItemIcon>
                        <ListItemText
                          primary={activity.message}
                          secondary={new Date(activity.time).toLocaleString()}
                        />
                      </ListItem>
                    )
                  })}
                </List>
              ) : (
                <Typography color="text.secondary">No recent activities</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>System Overview</Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Total Users</Typography>
                  <Chip label={stats.users?.total || 0} size="small" color="primary" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Active Managers</Typography>
                  <Chip label={stats.managers?.active || 0} size="small" color="warning" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Available Pets</Typography>
                  <Chip label={stats.pets?.available || 0} size="small" color="success" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Pending Requests</Typography>
                  <Chip label={stats.breedRequests?.pending || 0} size="small" color="error" />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess('')}
      >
        <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default AdminDashboard