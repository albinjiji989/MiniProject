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
  FileUpload as UploadIcon,
  FileDownload as DownloadIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { userAPI as usersAPI, modulesAPI, managersAPI, apiClient } from '../../services/api'
import {
  speciesAPI,
  breedsAPI,
  petsAPI as adminPetsAPI,
  customBreedRequestsAPI,
} from '../../services/petSystemAPI'

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
  })

  // Recent activities
  const [recentActivities, setRecentActivities] = useState([])
  const [systemAlerts, setSystemAlerts] = useState([])


  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Fetch real statistics from backend APIs with error handling
      const results = await Promise.allSettled([
        usersAPI.getStats(),
        modulesAPI.listAdmin(),
        managersAPI.list(),
        adminPetsAPI.getStats(),
        speciesAPI.getStats(),
        breedsAPI.getStats(),
        customBreedRequestsAPI.getStats()
      ])

      // Extract data with proper error handling
      const usersResponse = results[0].status === 'fulfilled' ? results[0].value : null
      const modulesResponse = results[1].status === 'fulfilled' ? results[1].value : null
      const managersResponse = results[2].status === 'fulfilled' ? results[2].value : null
      const petsResponse = results[3].status === 'fulfilled' ? results[3].value : null
      const speciesResponse = results[4].status === 'fulfilled' ? results[4].value : null
      const breedsResponse = results[5].status === 'fulfilled' ? results[5].value : null
      const breedRequestsResponse = results[6].status === 'fulfilled' ? results[6].value : null

      // Process users data
      const usersData = usersResponse?.data || {}
      const usersStats = {
        total: usersData.totalUsers || usersData.total || 0,
        active: usersData.activeUsers || usersData.active || 0,
        new: usersData.newUsers || usersData.recent || 0,
        growth: usersData.growthRate || 0
      }

      // Process managers data
      let managersStats = { total: 0, active: 0, pending: 0, growth: 0 }
      if (managersResponse?.data) {
        const managersArray = Array.isArray(managersResponse.data) 
          ? managersResponse.data 
          : (managersResponse.data.managers || [])
        managersStats = {
          total: managersArray.length,
          active: managersArray.filter(m => m.isActive !== false).length,
          pending: 0,
          growth: 0
        }
      }

      // Process pets data
      const petsData = petsResponse?.data || {}
      const petsStats = {
        total: petsData.totalPets || petsData.total || 0,
        available: petsData.availablePets || petsData.available || 0,
        adopted: petsData.adoptedPets || petsData.adopted || 0,
        growth: petsData.growthRate || 0
      }

      // Process species data
      const speciesData = speciesResponse?.data || {}
      const speciesStats = {
        total: speciesData.total || 0,
        active: speciesData.active || 0,
        growth: 0
      }

      // Process breeds data
      const breedsData = breedsResponse?.data || {}
      const breedsStats = {
        total: breedsData.total || 0,
        active: breedsData.active || 0,
        growth: 0
      }

      // Process modules data
      const modulesData = Array.isArray(modulesResponse?.data) ? modulesResponse.data : []
      const modulesStats = {
        total: modulesData.length,
        active: modulesData.filter(m => m.status === 'active').length,
        growth: 0
      }

      // Process breed requests data
      const breedRequestsData = breedRequestsResponse?.data || {}
      const breedRequestsStats = {
        total: breedRequestsData.total || 0,
        pending: breedRequestsData.pending || 0,
        approved: breedRequestsData.approved || 0,
        growth: 0
      }

      setStats({
        users: usersStats,
        managers: managersStats,
        pets: petsStats,
        species: speciesStats,
        breeds: breedsStats,
        modules: modulesStats,
        breedRequests: breedRequestsStats,
      })

      // Generate recent activities
      const activities = []
      
      // Add recent users
      if (usersData.recentUsers && Array.isArray(usersData.recentUsers)) {
        usersData.recentUsers.slice(0, 2).forEach((user, index) => {
          activities.push({
            id: `user-${user._id || index}`,
            type: 'user_registered',
            message: `New user registered: ${user.name || user.email || 'Unknown user'}`,
            time: user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Just now',
            icon: <PersonAddIcon />
          })
        })
      }

      // Add recent pets
      if (petsData.recentPets && Array.isArray(petsData.recentPets)) {
        petsData.recentPets.slice(0, 2).forEach((pet, index) => {
          activities.push({
            id: `pet-${pet._id || index}`,
            type: 'pet_added',
            message: `Pet "${pet.name || 'Unknown'}" added to system`,
            time: pet.createdAt ? new Date(pet.createdAt).toLocaleString() : 'Just now',
            icon: <PetsIcon />
          })
        })
      }

      setRecentActivities(activities.slice(0, 5))

      // Generate system alerts
      const alerts = []
      
      // Check for pending breed requests
      if (breedRequestsStats.pending > 0) {
        alerts.push({
          id: 'pending-requests',
          type: 'warning',
          message: `${breedRequestsStats.pending} breed request${breedRequestsStats.pending > 1 ? 's' : ''} need${breedRequestsStats.pending === 1 ? 's' : ''} review`,
          action: 'Review Requests'
        })
      }

      // Check for API connection issues
      const failedApis = results.filter(r => r.status === 'rejected').length
      if (failedApis > 0) {
        alerts.push({
          id: 'api-errors',
          type: 'error',
          message: `Failed to load data from ${failedApis} API endpoint${failedApis > 1 ? 's' : ''}. Some statistics may be incomplete.`,
          action: null
        })
      }

      setSystemAlerts(alerts)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError('Failed to load dashboard data. Please check your network connection and try again later.')
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, subtitle, icon, color, growth, onClick }) => (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        '&:hover': onClick ? { transform: 'translateY(-4px)', boxShadow: 4 } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
            <Typography color="textSecondary" variant="body2">
              {subtitle}
            </Typography>
            {growth !== undefined && growth !== null && (
              <Box display="flex" alignItems="center" mt={1}>
                {growth >= 0 ? (
                  <TrendingUpIcon color="success" fontSize="small" />
                ) : (
                  <TrendingDownIcon color="error" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  color={growth >= 0 ? 'success.main' : 'error.main'}
                  sx={{ ml: 0.5 }}
                >
                  {Math.abs(growth)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  )

  const QuickActionCard = ({ title, description, icon, color, onClick }) => (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
      }}
      onClick={onClick}
    >
      <CardContent sx={{ textAlign: 'center', py: 3 }}>
        <Avatar sx={{ bgcolor: `${color}.main`, width: 48, height: 48, mx: 'auto', mb: 2 }}>
          {icon}
        </Avatar>
        <Typography variant="h6" component="h3" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  )

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
                <Button color="inherit" size="small" onClick={() => {
                  if (alert.action === 'View Invites') navigate('/admin/managers')
                  if (alert.action === 'Review Requests') navigate('/admin/custom-breed-requests')
                }}>
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

      {/* Main Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Public Users"
            value={stats.users.total}
            subtitle={`${stats.users.active} active, ${stats.users.new} new this week`}
            icon={<UsersIcon />}
            color="primary"
            growth={stats.users.growth}
            onClick={() => navigate('/admin/users')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Managers"
            value={stats.managers.total}
            subtitle={`${stats.managers.active} active, ${stats.managers.pending} pending`}
            icon={<BusinessIcon />}
            color="warning"
            growth={stats.managers.growth}
            onClick={() => navigate('/admin/managers')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Pets"
            value={stats.pets.total}
            subtitle={`${stats.pets.available} available, ${stats.pets.adopted} adopted`}
            icon={<PetsIcon />}
            color="success"
            growth={stats.pets.growth}
            onClick={() => navigate('/admin/pets')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Breed Requests"
            value={stats.breedRequests.total}
            subtitle={`${stats.breedRequests.pending} pending, ${stats.breedRequests.approved} approved`}
            icon={<AssignmentIcon />}
            color="info"
            growth={stats.breedRequests.growth}
            onClick={() => navigate('/admin/custom-breed-requests')}
          />
        </Grid>
      </Grid>

      {/* Secondary Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Species"
            value={stats.species.total}
            subtitle={`${stats.species.active} active`}
            icon={<PetsIcon />}
            color="secondary"
            growth={stats.species.growth}
            onClick={() => navigate('/admin/species')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Breeds"
            value={stats.breeds.total}
            subtitle={`${stats.breeds.active} active`}
            icon={<PetsIcon />}
            color="secondary"
            growth={stats.breeds.growth}
            onClick={() => navigate('/admin/breeds')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Modules"
            value={stats.modules.total}
            subtitle={`${stats.modules.active} active`}
            icon={<ModuleIcon />}
            color="primary"
            growth={stats.modules.growth}
            onClick={() => navigate('/admin/modules')}
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
            Quick Actions
          </Typography>
        </Grid>

        {/* Pet Management */}
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Add Pet"
            description="Add a new pet to the system"
            icon={<AddIcon />}
            color="success"
            onClick={() => navigate('/admin/pets/add')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Import Pets"
            description="Import pets from CSV file"
            icon={<UploadIcon />}
            color="info"
            onClick={() => navigate('/admin/pets/import')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Export Data"
            description="Export system data to CSV"
            icon={<DownloadIcon />}
            color="primary"
            onClick={() => {/* Export functionality */ }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Invite Manager"
            description="Send invitation to new manager"
            icon={<PersonAddIcon />}
            color="warning"
            onClick={() => navigate('/admin/managers')}
          />
        </Grid>
      </Grid>

      {/* Recent Activities */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Recent Activities
              </Typography>
              <List>
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem>
                      <ListItemIcon>
                        {activity.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.message}
                        secondary={activity.time}
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Error/Success Messages */}
      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      )}

      {success && (
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>
      )}
    </Container>
  )
}

export default AdminDashboard