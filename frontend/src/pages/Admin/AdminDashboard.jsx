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
  Shield as SecurityShieldIcon,
  Pets as PetsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  LocalHospital as MedicalIcon,
  History as HistoryIcon,
  Assignment as AssignmentIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as DateIcon,
  PersonAdd as PersonAddIcon,
  FileUpload as UploadIcon,
  FileDownload as DownloadIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon,
  Group as GroupIcon,
  Store as StoreIcon,
  LocalPharmacy as PharmacyIcon,
  Home as HomeIcon,
  LocalShipping as ShippingIcon,
  Healing as HealingIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { usersAPI, modulesAPI, managersAPI, apiClient } from '../../services/api'
import { 
  speciesAPI, 
  breedsAPI, 
  petsAPI as adminPetsAPI,
  customBreedRequestsAPI,
  medicalRecordsAPI,
  ownershipHistoryAPI
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
    medicalRecords: { total: 0, recent: 0, growth: 0 },
    ownershipHistory: { total: 0, recent: 0, growth: 0 }
  })
  
  // Recent activities
  const [recentActivities, setRecentActivities] = useState([])
  const [systemAlerts, setSystemAlerts] = useState([])
  const [health, setHealth] = useState({ status: 'unknown', message: '', checkedAt: null })

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    // Real system health (API ping)
    const loadHealth = async () => {
      try {
        const res = await apiClient.get('/health')
        setHealth({ status: res.data?.status || 'unknown', message: res.data?.message || '', checkedAt: new Date() })
      } catch (e) {
        setHealth({ status: 'down', message: e?.response?.data?.message || 'API unreachable', checkedAt: new Date() })
      }
    }
    loadHealth()
    const id = setInterval(loadHealth, 60000) // refresh every minute
    return () => clearInterval(id)
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const results = await Promise.allSettled([
        usersAPI.getPublicUsers({ limit: 1000 }),           // 0 - public users only
        modulesAPI.list(),                                  // 1
        managersAPI.list(),                                 // 2
        adminPetsAPI.getAll({ limit: 1000 }),               // 3
        speciesAPI.list({ limit: 1000 }),                   // 4
        breedsAPI.list({ limit: 1000 }),                    // 5
        customBreedRequestsAPI.list({ limit: 1000 }),       // 6
        medicalRecordsAPI.list({ limit: 1000 }),            // 7
        ownershipHistoryAPI.list({ limit: 1000 })           // 8
      ])

      const getData = (idx) => {
        const r = results[idx]
        if (r.status === 'fulfilled') return r.value?.data
        console.warn('AdminDashboard data fetch failed for index', idx, r.reason)
        return null
      }

      const usersRes = getData(0) || {}
      const modulesRes = getData(1) || {}
      const managersRes = getData(2) || {}
      const petsRes = getData(3) || {}
      const speciesRes = getData(4) || {}
      const breedsRes = getData(5) || {}
      const breedRequestsRes = getData(6) || {}
      const medicalRes = getData(7) || {}
      const ownershipRes = getData(8) || {}

      // Process statistics
      const usersData = usersRes?.data?.users || usersRes?.data || usersRes || []
      const managersData = managersRes?.data?.managers || managersRes?.data || managersRes || []
      const petsData = petsRes?.data || petsRes || []
      const speciesData = speciesRes?.data || speciesRes || []
      const breedsData = breedsRes?.data || breedsRes || []
      const modulesData = modulesRes?.data || modulesRes || []
      const breedRequestsData = breedRequestsRes?.data || breedRequestsRes || []
      const medicalData = medicalRes?.data || medicalRes || []
      const ownershipData = ownershipRes?.data || ownershipRes || []
      
      setStats({
        users: {
          total: usersData.length || 0,
          active: usersData.filter(u => u.isActive).length || 0,
          new: usersData.filter(u => new Date(u.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length || 0,
          growth: null // Real growth calculation would require historical data
        },
        managers: {
          total: managersData.length || 0,
          active: managersData.filter(m => m.isActive).length || 0,
          pending: 0, // No pending invites in current data
          growth: null
        },
        pets: {
          total: petsData.length || 0,
          available: petsData.filter(p => p.currentStatus === 'Available').length || 0,
          adopted: petsData.filter(p => p.currentStatus === 'Adopted').length || 0,
          growth: null
        },
        species: {
          total: speciesData.length || 0,
          active: speciesData.filter(s => s.isActive).length || 0,
          growth: null
        },
        breeds: {
          total: breedsData.length || 0,
          active: breedsData.filter(b => b.isActive).length || 0,
          growth: null
        },
        modules: {
          total: modulesData.length || 0,
          active: modulesData.filter(m => m.isActive).length || 0,
          growth: null
        },
        breedRequests: {
          total: breedRequestsData.length || 0,
          pending: breedRequestsData.filter(r => r.status === 'pending').length || 0,
          approved: breedRequestsData.filter(r => r.status === 'approved').length || 0,
          growth: null
        },
        medicalRecords: {
          total: medicalData.length || 0,
          recent: medicalData.filter(m => new Date(m.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length || 0,
          growth: null
        },
        ownershipHistory: {
          total: ownershipData.length || 0,
          recent: ownershipData.filter(o => new Date(o.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length || 0,
          growth: null
        }
      })

      // Generate real recent activities from actual data
      const realActivities = []
      
      // Add recent users
      const recentUsers = usersData
        .filter(u => new Date(u.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000))
        .slice(0, 3)
        .map(user => ({
          id: `user-${user._id}`,
          type: 'user_registered',
          message: `New user registered: ${user.name}`,
          time: new Date(user.createdAt).toLocaleString(),
          icon: <PersonAddIcon />
        }))
      
      // Add recent pets
      const recentPets = petsData
        .filter(p => new Date(p.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000))
        .slice(0, 3)
        .map(pet => ({
          id: `pet-${pet._id}`,
          type: 'pet_adopted',
          message: `Pet "${pet.name}" added to system`,
          time: new Date(pet.createdAt).toLocaleString(),
          icon: <PetsIcon />
        }))
      
      // Add recent breed requests
      const recentRequests = breedRequestsData
        .filter(r => new Date(r.submittedAt || r.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000))
        .slice(0, 3)
        .map(request => ({
          id: `request-${request._id}`,
          type: 'breed_request',
          message: `New breed request: ${request.breedName || request.customBreedName}`,
          time: new Date(request.submittedAt || request.createdAt).toLocaleString(),
          icon: <AssignmentIcon />
        }))
      
      // Combine and sort by time
      const allActivities = [...recentUsers, ...recentPets, ...recentRequests]
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 5)
      
      setRecentActivities(allActivities)

      // Generate real system alerts based on actual data
      const realAlerts = []
      
      // Check for pending breed requests
      const pendingRequests = breedRequestsData.filter(r => r.status === 'pending').length
      if (pendingRequests > 0) {
        realAlerts.push({
          id: 'pending-requests',
          type: 'warning',
          message: `${pendingRequests} breed request${pendingRequests > 1 ? 's' : ''} need${pendingRequests === 1 ? 's' : ''} review`,
          action: 'Review Requests'
        })
      }
      
      // Check for under review requests
      const underReviewRequests = breedRequestsData.filter(r => r.status === 'under_review').length
      if (underReviewRequests > 0) {
        realAlerts.push({
          id: 'under-review-requests',
          type: 'info',
          message: `${underReviewRequests} breed request${underReviewRequests > 1 ? 's' : ''} under review`,
          action: 'View Requests'
        })
      }
      
      // Check for inactive users
      const inactiveUsers = usersData.filter(u => !u.isActive).length
      if (inactiveUsers > 0) {
        realAlerts.push({
          id: 'inactive-users',
          type: 'warning',
          message: `${inactiveUsers} inactive user${inactiveUsers > 1 ? 's' : ''}`,
          action: 'View Users'
        })
      }
      
      // Check for recent system activity
      const recentActivityCount = allActivities.length
      if (recentActivityCount > 0) {
        realAlerts.push({
          id: 'recent-activity',
          type: 'success',
          message: `${recentActivityCount} recent activit${recentActivityCount > 1 ? 'ies' : 'y'} in the last 24 hours`,
          action: null
        })
      }
      
      setSystemAlerts(realAlerts)

    } catch (err) {
      setError('Failed to load dashboard data')
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
        <Grid item xs={12} sm={6} md={3}>
            <StatCard
            title="Medical Records"
            value={stats.medicalRecords.total}
            subtitle={`${stats.medicalRecords.recent} recent`}
            icon={<MedicalIcon />}
            color="error"
            growth={stats.medicalRecords.growth}
            onClick={() => navigate('/admin/medical-records')}
            />
          </Grid>
        </Grid>

      {/* Management Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
            Management
            </Typography>
        </Grid>
              <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Public Users"
            description="Manage public users"
            icon={<UsersIcon />}
            color="primary"
                  onClick={() => navigate('/admin/users')}
          />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Managers"
            description="Manage module managers"
            icon={<BusinessIcon />}
            color="warning"
                  onClick={() => navigate('/admin/managers')}
          />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Modules"
            description="Manage system modules"
            icon={<ModuleIcon />}
            color="info"
                  onClick={() => navigate('/admin/modules')}
          />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="All Pets"
            description="Manage pets"
            icon={<PetsIcon />}
            color="success"
            onClick={() => navigate('/admin/pets')}
          />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Medical Records"
            description="Manage medical records"
            icon={<MedicalIcon />}
            color="error"
            onClick={() => navigate('/admin/medical-records')}
          />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Ownership History"
            description="Manage ownership transfers"
            icon={<HistoryIcon />}
            color="secondary"
            onClick={() => navigate('/admin/ownership-history')}
          />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Species"
            description="Manage species"
            icon={<PetsIcon />}
            color="secondary"
                  onClick={() => navigate('/admin/species')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Breeds"
            description="Manage breeds"
            icon={<PetsIcon />}
            color="secondary"
            onClick={() => navigate('/admin/breeds')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Breed Requests"
            description="Review custom requests"
            icon={<AssignmentIcon />}
            color="info"
            onClick={() => navigate('/admin/custom-breed-requests')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Centralized Pets"
            description="View all pets in registry"
            icon={<PetsIcon />}
            color="primary"
            onClick={() => navigate('/admin/pets/centralized')}
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
            onClick={() => {/* Export functionality */}}
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

      {/* Module Management Quick Actions */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
            Module Management
                </Typography>
              </Grid>
              
        <Grid item xs={12} sm={6} md={2}>
          <QuickActionCard
            title="Adoption"
            icon={<HomeIcon />}
            color="success"
            description="Manage adoptions"
            onClick={() => navigate('/adoption')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <QuickActionCard
            title="Pet Shop"
            icon={<StoreIcon />}
            color="info"
            description="Manage pet shops"
            onClick={() => navigate('/petshop')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <QuickActionCard
            title="Rescue"
            icon={<ShippingIcon />}
            color="warning"
            description="Manage rescues"
            onClick={() => navigate('/rescue')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <QuickActionCard
            title="E-commerce"
            icon={<StoreIcon />}
            color="primary"
            description="Manage store"
            onClick={() => navigate('/ecommerce')}
          />
              </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <QuickActionCard
            title="Pharmacy"
            icon={<PharmacyIcon />}
            color="secondary"
            description="Manage pharmacy"
            onClick={() => navigate('/pharmacy')}
          />
              </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <QuickActionCard
            title="Veterinary"
            icon={<HealingIcon />}
            color="error"
            description="Manage veterinary"
            onClick={() => navigate('/veterinary')}
          />
              </Grid>
          </Grid>

      {/* Recent Activities and System Status */}
      <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
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

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                System Status
              </Typography>
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">API Health</Typography>
                  <Chip 
                    size="small"
                    label={health.status === 'OK' ? 'Online' : (health.status || 'Unknown')}
                    color={health.status === 'OK' ? 'success' : (health.status === 'down' ? 'error' : 'default')}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {health.message || 'Health endpoint status'}{health.checkedAt ? ` • Checked at ${health.checkedAt.toLocaleTimeString()}` : ''}
                </Typography>
              </Box>
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
