import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  CardActions,
  Tooltip
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Pets as PetIcon,
  Home as HomeIcon,
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
  Notifications as NotificationIcon,
  Star as StarIcon,
  ArrowForward as ArrowIcon,
  Block as BlockIcon,
  Construction as ConstructionIcon,
  Schedule as ScheduleIcon
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
  const [modulesLoading, setModulesLoading] = useState(false)
  const [modulesError, setModulesError] = useState('')
  const [modules, setModules] = useState([])
  const [softBlockedMsg, setSoftBlockedMsg] = useState('')
  const [myPets, setMyPets] = useState([])
  const [myPetsLoading, setMyPetsLoading] = useState(false)
  const [myPetsError, setMyPetsError] = useState('')
  const [ownedPets, setOwnedPets] = useState([])
  const [petshopPurchases, setPetshopPurchases] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [availableServices, setAvailableServices] = useState([])
  // Recent activity panel state
  const [activityLoading, setActivityLoading] = useState(false)
  const [activityError, setActivityError] = useState('')


  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setActivityLoading(true)
      setActivityError('')
      
      // Load user's pets
      const petsRes = await userPetsAPI.list()
      setMyPets(petsRes.data?.data?.pets || [])
      
      // Load core owned pets (from core Pet model)
      let coreOwned = []
      try {
        const ownedRes = await apiClient.get('/pets/my-pets')
        coreOwned = ownedRes.data?.data?.pets || []
      } catch (e) {
        console.log('No owned pets or error loading:', e.message)
      }

      // Load petshop reservations to include purchases
      let purchases = []
      try {
        const resvRes = await apiClient.get('/petshop/public/reservations')
        const all = resvRes.data?.data?.reservations || []
        purchases = all.filter(r => ['paid','ready_pickup','completed','at_owner'].includes(r.status))
        setPetshopPurchases(purchases)
      } catch (e) {
        setPetshopPurchases([])
      }

      // Merge for display: core owned + purchased items (map inventory item as pet-like)
      const mappedPurchases = purchases.map(r => ({
        _id: r.itemId?._id || r._id,
        name: r.itemId?.name || 'Pet',
        images: r.itemId?.images || [],
        petCode: r.itemId?.petCode,
        breedId: r.itemId?.breedId,
        breed: r.itemId?.breedId?.name,
        gender: r.itemId?.gender || 'Unknown',
        status: r.status,
        currentStatus: r.status,
        tags: ['petshop'],
      }))

      // De-duplicate by petCode or _id
      const byKey = new Map()
      ;[...coreOwned, ...mappedPurchases].forEach(p => {
        const key = p.petCode || p._id
        if (key && !byKey.has(key)) byKey.set(key, p)
      })
      setOwnedPets(Array.from(byKey.values()))
      
      // Load recent activity (best-effort)
      try {
        const res = await apiClient.get('/user-dashboard/activities')
        const items = res.data?.data?.activities || []
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
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
      setActivityLoading(false)
    }
  }

  // Build absolute image URL for pet images
  // Supports:
  // - data URLs saved from Add Pet flow
  // - absolute URLs
  // - relative URLs from API
  const buildImageUrl = (url) => {
    if (!url) return '/placeholder-pet.svg'
    if (/^data:image\//i.test(url)) return url
    if (/^https?:\/\//i.test(url)) return url
    const apiBase = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
    const origin = apiBase.replace(/\/?api\/?$/, '')
    return `${origin}${url.startsWith('/') ? '' : '/'}${url}`
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Listen for soft-block events (403)
  useEffect(() => {
    const onSoftBlock = (e) => {
      setSoftBlockedMsg(e?.detail?.message || 'Your account access is restricted by admin. Some features are disabled.')
    }
    window.addEventListener('auth:soft-block', onSoftBlock)
    return () => window.removeEventListener('auth:soft-block', onSoftBlock)
  }, [])

  // Load modules data
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

  // Unified list of pets from all sources
  const allMyPets = useMemo(() => {
    const byKey = new Map()
    const add = (p) => {
      if (!p) return
      const key = p.petCode || p._id
      if (!key) return
      if (!byKey.has(key)) byKey.set(key, p)
    }
    myPets.forEach(add)
    ownedPets.forEach(add)
    return Array.from(byKey.values())
  }, [myPets, ownedPets])

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
      key: 'pet-management',
      title: 'Pet Management',
      description: 'Manage your pets, view medical records, and track their history',
      icon: <PetIcon sx={{ fontSize: 40 }} />, // inherit white
      color: 'primary',
      path: '/User/pets',
      isActive: true,
      statusMessage: '',
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

  // Gradient presets for action cards (cycles across items)
  const gradientPresets = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // purple
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // pink
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // blue
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // green
  ]

  // Deterministic gradient per module to avoid similar colors
  const gradientMap = {
    'pet-management': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // purple
    'adoption': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // pink
    'petshop': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // blue
    'veterinary': 'linear-gradient(135deg, #36d1dc 0%, #5b86e5 100%)', // teal-blue
    'pharmacy': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // green-teal
    'rescue': 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', // orange
    'temporary-care': 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', // light blue
    'ecommerce': 'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)', // orange-red
    'owned-pets': 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', // violet-pink
  }

  const getGradientFor = (key, index) => gradientMap[key] || gradientPresets[index % gradientPresets.length]

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
        {/* Removed subtitle per request */}
        {/* Removed Quick Stats row as requested */}
      </Box>

      {/* My Pets (all sources combined) - directly below welcome */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PetIcon color="primary" />
          My Pets ({allMyPets.length})
        </Typography>
        {allMyPets.length > 0 && (
          <Button size="small" variant="outlined" onClick={() => navigate('/User/pets')}>
            View All
          </Button>
        )}
      </Box>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : allMyPets.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PetIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>No pets yet</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add your pet, or adopt/buy to see them here.
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/User/pets/add')}>
                Add Pet
              </Button>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto', pb: 1 }}>
              <Box sx={{ display: 'flex', gap: 2, minWidth: '100%' }}>
                {allMyPets.map((pet) => (
                  <Card key={pet._id || pet.petCode} sx={{ minWidth: 240, flex: '0 0 auto', cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => navigate('/User/pets')}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {(() => {
                          const src = buildImageUrl(
                            (pet.images?.find?.(img => img?.isPrimary)?.url) ||
                            (pet.images?.[0]?.url) ||
                            pet.imageUrl ||
                            ''
                          )
                          return (
                            <Box
                              component="img"
                              src={src}
                              alt={pet.name || 'Pet'}
                              onError={(e) => { e.currentTarget.src = '/placeholder-pet.svg' }}
                              sx={{
                                width: 56,
                                height: 56,
                                objectFit: 'cover',
                                borderRadius: '8px',
                                border: '1px solid',
                                borderColor: 'divider'
                              }}
                            />
                          )
                        })()}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, overflow: 'hidden' }}>
                            <Typography variant="h6" noWrap sx={{ fontWeight: 'bold' }}>
                              {pet.name || 'Unnamed Pet'}
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
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {(pet.breedId?.name || pet.breed?.name || pet.breed || 'Breed not specified')} • {(pet.gender || 'Gender not set')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(pet.status || pet.currentStatus || 'Owned')}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

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
          }} onClick={() => navigate('/User/owned-pets')}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <PetIcon sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                My Owned Pets
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                View purchased pets ({ownedPets.length})
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
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
            // For public/user dashboard, treat 'active' as usable regardless of manager dashboard availability
            const isActive = m.status === 'active'
            const isBlocked = m.status === 'blocked'
            const isMaintenance = m.status === 'maintenance'
            const isComingSoon = m.status === 'coming_soon'

            let statusMessage = ''
            if (isBlocked) statusMessage = m.blockReason || 'Service Blocked'
            else if (isMaintenance) statusMessage = m.maintenanceMessage || 'Under Maintenance'
            else if (isComingSoon) statusMessage = 'Coming Soon'

            return {
              key: m.key,
              title: m.name,
              description: m.description || statusMessage,
              icon: getModuleIcon(m.icon),
              path: isActive ? path : '#',
              isActive,
              isBlocked,
              isMaintenance,
              isComingSoon,
              statusMessage,
            }
          })
        ).map((module, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              onClick={() => module.isActive ? navigate(module.path) : null}
              sx={{
                background: getGradientFor(module.key, index),
                color: 'white',
                cursor: module.isActive ? 'pointer' : 'default',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: 3,
                '&:hover': module.isActive ? { transform: 'translateY(-4px)', boxShadow: 6 } : {},
                position: 'relative',
                overflow: 'hidden',
                opacity: module.isActive ? 1 : 0.95,
              }}
            >
              {!module.isActive && (() => {
                const isBlocked = module.isBlocked
                const isMaintenance = module.isMaintenance
                const label = module.statusMessage || (isBlocked ? 'Service Blocked' : isMaintenance ? 'Under Maintenance' : 'Coming Soon')
                const icon = isBlocked ? <BlockIcon sx={{ fontSize: 16, mr: 0.5 }} /> : isMaintenance ? <ConstructionIcon sx={{ fontSize: 16, mr: 0.5 }} /> : <ScheduleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                const badgeBg = isBlocked ? 'rgba(244,67,54,0.9)' : isMaintenance ? 'rgba(255,167,38,0.9)' : 'rgba(33,150,243,0.9)'
                const bannerBg = isBlocked ? 'rgba(244,67,54,0.2)' : isMaintenance ? 'rgba(255,167,38,0.2)' : 'rgba(33,150,243,0.2)'
                return (
                  <>
                    {/* Prominent top-right badge */}
                    <Tooltip title={label}>
                      <Box sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        bgcolor: badgeBg,
                        color: 'white',
                        px: 1.2,
                        py: 0.6,
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        boxShadow: 3,
                        border: '1px solid rgba(255,255,255,0.35)'
                      }}>
                        {icon}
                        {label}
                      </Box>
                    </Tooltip>
                    {/* Bottom status banner */}
                    <Box sx={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      bgcolor: bannerBg,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      py: 0.75,
                      px: 2,
                      fontSize: 13,
                      fontWeight: 600,
                      backdropFilter: 'blur(2px)'
                    }}>
                      {icon}
                      <span>{label}</span>
                    </Box>
                    {/* Subtle dim overlay for inactive */}
                    <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.06)' }} />
                  </>
                )
              })()}
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 2, mb: 1, color: 'white' }}>
                  {module.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {module.title}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {module.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </UserLayout>
  )
}

export default PublicUserDashboard