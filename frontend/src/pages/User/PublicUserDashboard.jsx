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
  alpha
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
  ArrowForward as ArrowIcon
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { modulesAPI, userPetsAPI, apiClient, adoptionAPI, resolveMediaUrl } from '../../services/api'
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
  const [myPets, setMyPets] = useState([])
  const [ownedPets, setOwnedPets] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [activityError, setActivityError] = useState('')

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setActivityLoading(true)
      setActivityError('')
      
      // Load all data in parallel to reduce loading time
      const [petsRes, ownedRes, activityRes, adoptedRes] = await Promise.allSettled([
        userPetsAPI.list(),
        apiClient.get('/pets/my-pets'),
        apiClient.get('/user-dashboard/activities'),
        adoptionAPI.getMyAdoptedPets()
      ])
      
      // Process pets from PetNew model
      let allPets = []
      if (petsRes.status === 'fulfilled') {
        const petNewPets = petsRes.value.data?.data || []
        allPets = [...allPets, ...petNewPets]
      }
      
      // Process core owned pets
      if (ownedRes.status === 'fulfilled') {
        const corePets = ownedRes.value.data?.data?.pets || []
        allPets = [...allPets, ...corePets]
      }

      // Process adopted pets
      let adoptedPets = []
      if (adoptedRes.status === 'fulfilled') {
        adoptedPets = adoptedRes.value.data?.data || []
      }

      // Map adopted pets to pet-like objects
      const mappedAdoptedPets = adoptedPets.map(pet => ({
        _id: pet._id,
        name: pet.name || 'Pet',
        images: pet.images || [],
        petCode: pet.petCode,
        breed: pet.breed,
        species: pet.species,
        gender: pet.gender || 'Unknown',
        status: 'adopted',
        currentStatus: 'adopted',
        tags: ['adoption'],
        adoptionDate: pet.adoptionDate
      }))

      // Combine all pets and remove duplicates
      const combinedPets = [...allPets, ...mappedAdoptedPets]
      const uniquePets = combinedPets.filter((pet, index, self) => 
        index === self.findIndex(p => (p.petCode || p._id) === (pet.petCode || pet._id))
      )
      
      setMyPets(uniquePets)
      setOwnedPets(uniquePets)
      
      // Process recent activity
      if (activityRes.status === 'fulfilled') {
        const items = activityRes.value.data?.data?.activities || []
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
      } else {
        setRecentActivity([])
        setActivityError(activityRes.reason?.response?.data?.message || 'Failed to load recent activity')
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setMyPetsError(error?.response?.data?.message || 'Failed to load pets')
    } finally {
      setLoading(false)
      setActivityLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Load modules data - only active modules
  useEffect(() => {
    (async () => {
      setModulesLoading(true)
      setModulesError('')
      try {
        const res = await modulesAPI.list()
        // Filter to only show active modules
        const list = (res.data?.data || []).filter(module => module.status === 'active')
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

  const getModulePath = (key) => {
    const pathMap = {
      'adoption': '/User/adoption',
      'veterinary': '/User/veterinary',
      'rescue': '/User/rescue',
      'petshop': '/User/petshop',
      'pharmacy': '/User/pharmacy',
      'ecommerce': '/User/ecommerce',
      'temporary-care': '/User/temporary-care'
    }
    return pathMap[key] || '/User/dashboard'
  }

  // Only show real, working features
  const staticCards = [
    {
      key: 'pet-management',
      title: 'Pet Management',
      description: 'Manage your pets and view their information',
      icon: <PetIcon sx={{ fontSize: 40 }} />,
      path: '/User/pets',
      isActive: true
    },
  ]

  // Gradient presets for action cards
  const gradientPresets = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // purple
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // pink
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // blue
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // green
  ]

  const getGradientFor = (index) => gradientPresets[index % gradientPresets.length]

  // Function to get the primary image for a pet
  const getPetImageUrl = (pet) => {
    // For user-created pets from PetNew model
    if (pet.images && pet.images.length > 0) {
      // Find primary image or use first image
      const primaryImage = pet.images.find(img => img.isPrimary) || pet.images[0];
      if (primaryImage && primaryImage.url) {
        return resolveMediaUrl(primaryImage.url);
      }
    }
    
    // Fallback to imageUrl if available
    if (pet.imageUrl) {
      return resolveMediaUrl(pet.imageUrl);
    }
    
    // Default placeholder
    return '/placeholder-pet.svg';
  };

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
      </Box>

      {/* My Pets Section */}
      <Box sx={{ mb: 4 }}>
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
        <Card>
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
                  Add your pet to get started
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/User/pets/add')}>
                  Add Pet
                </Button>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto', pb: 1 }}>
                <Box sx={{ display: 'flex', gap: 2, minWidth: '100%' }}>
                  {allMyPets.slice(0, 4).map((pet) => (
                    <Card 
                      key={pet._id || pet.petCode} 
                      sx={{ minWidth: 240, flex: '0 0 auto', cursor: 'pointer', '&:hover': { boxShadow: 4 } }} 
                      onClick={() => {
                        // Check if this is an adopted pet by looking for the 'adoption' tag
                        if (pet?.tags?.includes('adoption')) {
                          // For adopted pets, navigate to the adoption details page
                          navigate(`/User/adoption/my-adopted-pets/${pet._id}`)
                        } else {
                          // For regular user pets, use the existing navigation
                          navigate(`/User/pets/${pet._id}`)
                        }
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            component="img"
                            src={getPetImageUrl(pet)}
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
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Chip 
                                label={pet.status || pet.currentStatus || 'Owned'} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                              {pet.tags?.includes('adoption') && (
                                <Chip label="Adopted" size="small" color="success" variant="outlined" />
                              )}
                            </Box>
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
      </Box>

      {/* Quick Actions - Only real features */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={6}>
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
        
        <Grid item xs={12} sm={6} md={6}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
            color: 'white',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }} onClick={() => navigate('/User/pets')}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <PetIcon sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                My Pets
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                View all your pets
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
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
                  {recentActivity.slice(0, 5).map((activity) => (
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
                onClick={() => navigate('/User/pets')}
              >
                View All Activity
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Available Services - Only real, active modules */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <StarIcon color="primary" />
          Available Services
        </Typography>
        
        {modulesError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {modulesError}
          </Alert>
        )}
        
        {modulesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : modules.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <HomeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                No services available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Check back later for new services
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {staticCards.concat(
              modules.map(m => {
                const path = getModulePath(m.key)
                return {
                  key: m.key,
                  title: m.name,
                  description: m.description,
                  icon: getModuleIcon(m.icon),
                  path: path,
                  isActive: true
                }
              })
            ).map((module, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  onClick={() => navigate(module.path)}
                  sx={{
                    background: getGradientFor(index),
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: 3,
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
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
        )}
      </Box>
    </UserLayout>
  )
}

export default PublicUserDashboard