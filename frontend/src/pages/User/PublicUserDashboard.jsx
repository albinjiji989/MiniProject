import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  Avatar,
  useTheme,
  alpha,
  LinearProgress,
  CardActions
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Pets as PetIcon,
  Home as HomeIcon,
  LocalHospital as MedicalIcon,
  ShoppingCart as ShopIcon,
  LocalShipping as RescueIcon,
  Medication as PharmacyIcon,
  Healing as VeterinaryIcon,
  Assignment as AdoptionIcon,
  Build as CareIcon,
  TrendingUp as TrendingIcon,
  Search as SearchIcon,
  Add as AddIcon,
  FavoriteOutlined as FavoriteIcon,
  CalendarToday as CalendarIcon,
  Notifications as NotificationIcon,
  Star as StarIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { modulesAPI, userPetsAPI, apiClient } from '../../services/api'
import { useNavigate } from 'react-router-dom'
import UserLayout from '../../components/Layout/UserLayout'

const PublicUserDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [modules, setModules] = useState([])
  const [modulesLoading, setModulesLoading] = useState(false)
  const [modulesError, setModulesError] = useState('')
  const [myPets, setMyPets] = useState([])
  const [myPetsLoading, setMyPetsLoading] = useState(false)
  const [myPetsError, setMyPetsError] = useState('')
  const [softBlockedMsg, setSoftBlockedMsg] = useState('')
  const [recentActivity, setRecentActivity] = useState([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [activityError, setActivityError] = useState('')


  useEffect(() => {
    (async () => {
      setModulesLoading(true)
      setModulesError('')
      try {
        const res = await modulesAPI.list()
        const list = (res.data?.data || [])
        setModules(list)
      } catch (e) {
        setModules([])
        setModulesError(e?.response?.data?.message || 'Failed to load modules')
      } finally {
        setModulesLoading(false)
      }
    })()
  }, [])

  // Load recent activity (from real API)
  useEffect(() => {
    (async () => {
      setActivityLoading(true)
      setActivityError('')
      try {
        const res = await apiClient.get('/user-dashboard/activities')
        const items = res.data?.data?.activities || []
        // Normalize for UI: map basic icon by type
        const withIcons = items.map((a, idx) => ({
          id: a.id || `${a.type}-${idx}`,
          title: a.title,
          time: new Date(a.time).toLocaleString(),
          type: a.type,
          icon: (
            a.type === 'adoption_application' ? <AdoptionIcon /> :
            a.type === 'reservation' ? <HomeIcon /> :
            a.type === 'wishlist' ? <FavoriteIcon /> :
            a.type === 'order' ? <ShopIcon /> :
            <DashboardIcon />
          )
        }))
        setRecentActivity(withIcons)
      } catch (e) {
        setRecentActivity([])
        setActivityError(e?.response?.data?.message || 'Failed to load recent activity')
      } finally {
        setActivityLoading(false)
      }
    })()
  }, [])

  // Listen for soft-block events (403)
  useEffect(() => {
    const onSoftBlock = (e) => {
      setSoftBlockedMsg(e?.detail?.message || 'Your account access is restricted by admin. Some features are disabled.')
    }
    window.addEventListener('auth:soft-block', onSoftBlock)
    return () => window.removeEventListener('auth:soft-block', onSoftBlock)
  }, [])

  // Load current user's pets (first section of dashboard)
  useEffect(() => {
    (async () => {
      setMyPetsLoading(true)
      setMyPetsError('')
      try {
        const res = await userPetsAPI.list({ page: 1, limit: 8 })
        const data = Array.isArray(res.data?.data) ? res.data.data : (res.data || [])
        setMyPets(data || [])
      } catch (e) {
        setMyPets([])
        setMyPetsError(e?.response?.data?.message || 'Failed to load your pets')
      } finally {
        setMyPetsLoading(false)
      }
    })()
  }, [])

  const getModuleIcon = (iconName) => {
    const iconMap = {
      'Pets': <AdoptionIcon sx={{ fontSize: 40 }} />,
      'LocalHospital': <VeterinaryIcon sx={{ fontSize: 40 }} />,
      'ShoppingCart': <ShopIcon sx={{ fontSize: 40 }} />,
      'LocalPharmacy': <PharmacyIcon sx={{ fontSize: 40 }} />,
      'Home': <HomeIcon sx={{ fontSize: 40 }} />,
      'Business': <CareIcon sx={{ fontSize: 40 }} />,
      'Build': <RescueIcon sx={{ fontSize: 40 }} />,
      'Settings': <CareIcon sx={{ fontSize: 40 }} />
    }
    return iconMap[iconName] || <CareIcon sx={{ fontSize: 40 }} />
  }

  const getModuleColor = (color) => {
    const colorMap = {
      '#4CAF50': 'success',
      '#2196F3': 'info', 
      '#FF9800': 'warning',
      '#9C27B0': 'secondary',
      '#F44336': 'error',
      '#607D8B': 'primary',
      '#795548': 'info'
    }
    return colorMap[color] || 'primary'
  }

  const getModulePath = (key) => {
    const pathMap = {
      'adoption': '/adoption',
      'veterinary': '/veterinary',
      'rescue': '/rescue',
      'petshop': '/petshop',
      'pharmacy': '/pharmacy',
      'ecommerce': '/ecommerce',
      'temporary-care': '/temporary-care'
    }
    return pathMap[key] || '/'
  }

  const staticCards = [
    {
      title: 'Pet Management',
      description: 'Manage your pets, view medical records, and track their history',
      icon: <PetIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: 'primary',
      path: '/User/pets',
      features: ['Add/Edit Pets', 'Medical Records', 'Vaccination History', 'Ownership History']
    },
  ]

  const quickActions = [
    { title: 'Add New Pet', icon: <AddIcon />, path: '/User/pets/add' },
    { title: 'Find Adoption', icon: <SearchIcon />, path: '/adoption' },
    { title: 'Shop Products', icon: <ShopIcon />, path: '/ecommerce' },
    
  ]

  const sidebarItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { label: 'My Pets', icon: <PetIcon />, path: '/pets' },
    { label: 'Adoption', icon: <AdoptionIcon />, path: '/adoption' },
    { label: 'Pet Shop', icon: <HomeIcon />, path: '/petshop' },
    { label: 'Rescue', icon: <RescueIcon />, path: '/rescue' },
    { label: 'Temporary Care', icon: <CareIcon />, path: '/temporary-care' },
    { label: 'Pharmacy', icon: <PharmacyIcon />, path: '/pharmacy' },
    { label: 'Veterinary', icon: <VeterinaryIcon />, path: '/veterinary' },
    { label: 'Shop', icon: <ShopIcon />, path: '/ecommerce' }
  ]

  return (
    <UserLayout user={user}>
      {/* Hero Welcome Section */}
      <Box sx={{ 
        mb: 4,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        borderRadius: 3,
        p: 4,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Typography variant="h3" sx={{ 
          mb: 2, 
          fontWeight: 800,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Welcome back, {user?.name?.split(' ')[0] || 'Friend'}! 🐾
        </Typography>
        <Typography variant="h6" color="textSecondary" sx={{ mb: 3, maxWidth: 600 }}>
          Your one-stop platform for all pet care needs. Manage your pets, find services, and connect with the pet community.
        </Typography>
        
        {/* Quick Stats */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {myPets.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">My Pets</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {modules.filter(m => m.status === 'active').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">Active Services</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                {recentActivity.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">Recent Activities</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                24/7
              </Typography>
              <Typography variant="body2" color="textSecondary">Support Available</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {softBlockedMsg && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {softBlockedMsg}
        </Alert>
      )}
      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }} onClick={() => navigate('/User/pets/add')}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <AddIcon sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Add New Pet
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Register your pet with us
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
            color: 'white',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }} onClick={() => navigate('/User/adoption')}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <FavoriteIcon sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Find Adoption
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Adopt a loving companion
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
            color: 'white',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }} onClick={() => navigate('/User/petshop')}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <ShopIcon sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Pet Shop
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Buy pets & supplies
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', 
            color: 'white',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }} onClick={() => navigate('/User/veterinary')}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <MedicalIcon sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Veterinary
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Book health checkups
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* My Pets Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PetIcon color="primary" />
                  My Pets ({myPets.length})
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/User/pets/add')}>
                  Add Pet
                </Button>
              </Box>
              
              {myPetsError && <Alert severity="error" sx={{ mb: 2 }}>{myPetsError}</Alert>}
              
              {myPetsLoading ? (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {[1,2,3].map(i => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <CircularProgress size={40} />
                      <Box>
                        <LinearProgress sx={{ width: 120, mb: 1 }} />
                        <LinearProgress sx={{ width: 80 }} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : myPets.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <PetIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>No pets registered yet</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Add your pet to track health records, appointments, and more
                  </Typography>
                  <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/User/pets/add')}>
                    Add My First Pet
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {myPets.slice(0, 4).map((pet) => (
                    <Grid item xs={12} sm={6} key={pet._id}>
                      <Card 
                        onClick={() => navigate('/User/pets')} 
                        sx={{ 
                          cursor: 'pointer', 
                          transition: 'all 0.2s',
                          '&:hover': { 
                            transform: 'translateY(-2px)',
                            boxShadow: 4 
                          } 
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                              {pet.name?.charAt(0)?.toUpperCase() || 'P'}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                  {pet.name}
                                </Typography>
                                {(pet.petCode || pet.code) && (
                                  <Chip 
                                    label={pet.petCode || pet.code} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                                  />
                                )}
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                {pet.age ? `${pet.age} ${pet.ageUnit || ''}` : 'Age not set'} • {pet.gender || 'Gender not set'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {pet.breed || 'Breed not specified'}
                              </Typography>
                            </Box>
                            <ArrowIcon color="action" />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                  {myPets.length > 4 && (
                    <Grid item xs={12}>
                      <Button 
                        variant="outlined" 
                        fullWidth 
                        onClick={() => navigate('/User/pets')}
                        sx={{ mt: 1 }}
                      >
                        View All {myPets.length} Pets
                      </Button>
                    </Grid>
                  )}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingIcon color="primary" />
                Recent Activity
              </Typography>
              
              {activityError ? (
                <Alert severity="error">{activityError}</Alert>
              ) : activityLoading ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : recentActivity.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <NotificationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Your recent activity will appear here
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {recentActivity.map((activity) => (
                    <ListItem key={activity.id} sx={{ px: 0, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Box sx={{ 
                          p: 1, 
                          borderRadius: 2, 
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main'
                        }}>
                          {activity.icon}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.title}
                        secondary={activity.time}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              
              <Button 
                variant="outlined" 
                fullWidth 
                sx={{ mt: 2 }}
                onClick={() => navigate('/User/activity')}
              >
                View All Activity
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Available Services */}
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <StarIcon color="primary" />
        Available Services
      </Typography>
      
      {modulesError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {modulesError}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {staticCards.concat(
          modules.map(m => {
            const path = getModulePath(m.key)
            const isActive = m.status === 'active' && m.hasManagerDashboard
            const isBlocked = m.status === 'blocked'
            const isMaintenance = m.status === 'maintenance'
            const isComingSoon = m.status === 'coming_soon' || !m.hasManagerDashboard
            
            let statusMessage = ''
            let statusColor = 'default'
            
            if (isBlocked) {
              statusMessage = m.blockReason || 'Service is currently blocked'
              statusColor = 'error'
            } else if (isMaintenance) {
              statusMessage = m.maintenanceMessage || 'Service is under maintenance'
              statusColor = 'warning'
            } else if (isComingSoon) {
              statusMessage = 'Coming soon'
              statusColor = 'info'
            } else if (isActive) {
              statusMessage = 'Active'
              statusColor = 'success'
            }
            
            return {
              title: m.name,
              description: m.description || statusMessage,
              icon: getModuleIcon(m.icon),
              color: getModuleColor(m.color),
              path: isActive ? path : '#',
              isActive,
              isBlocked,
              isMaintenance,
              isComingSoon,
              statusMessage,
              statusColor,
              features: []
            }
          })
        ).map((module, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                cursor: module.isActive ? 'pointer' : 'default',
                '&:hover': module.isActive ? {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                } : {}
              }}
              onClick={() => module.isActive ? navigate(module.path) : null}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {module.icon}
                  <Typography variant="h6" sx={{ ml: 2, fontWeight: 600 }}>
                    {module.title}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                  {module.description}
                </Typography>

                {/* Status Display */}
                <Box sx={{ mb: 2 }}>
                  {module.statusMessage && (
                    <Chip 
                      label={module.statusMessage} 
                      size="small" 
                      color={module.statusColor}
                      sx={{ mb: 1 }}
                    />
                  )}
                </Box>

                {module.features.length > 0 && (
                  <List dense sx={{ mb: 2 }}>
                    {module.features.map((feature, featureIndex) => (
                      <ListItem key={featureIndex} sx={{ py: 0.5, px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: `${module.color}.main` }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature} 
                          primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
              
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  variant={module.isActive ? "contained" : "outlined"}
                  color={module.color}
                  fullWidth
                  disabled={!module.isActive}
                  startIcon={module.isActive ? <ArrowIcon /> : null}
                >
                  {module.isActive ? `Access ${module.title}` : 
                   module.isBlocked ? 'Service Blocked' :
                   module.isMaintenance ? 'Under Maintenance' :
                   'Coming Soon'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </UserLayout>
  )
}

export default PublicUserDashboard