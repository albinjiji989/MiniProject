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
  Tooltip,
  Divider,
  Avatar,
  Skeleton
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Pets as PetsIcon,
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
  Schedule as ScheduleIcon,
  CalendarToday as CalendarIcon,
  MedicalInformation as MedicalIcon,
  Vaccines as VaccineIcon,
  History as HistoryIcon,
  EventAvailable as EventIcon,
  LocalHospital as HospitalIcon,
  LocalPharmacy as PharmacyIconAlt,
  Store as StoreIcon,
  Hotel as HotelIcon,
  VolunteerActivism as VolunteerIcon,
  ShoppingCartCheckout as CartIcon,
  SupportAgent as SupportIcon,
  Chat as ChatIcon,
  Build as BuildIcon
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { modulesAPI, userPetsAPI, apiClient, adoptionAPI, resolveMediaUrl, petShopAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'
import UserLayout from '../../components/Layout/UserLayout'

const UserDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [modulesLoading, setModulesLoading] = useState(false)
  const [modulesError, setModulesError] = useState('')
  const [modules, setModules] = useState([])
  const [myPets, setMyPets] = useState([])
  const [petshopPurchases, setPetshopPurchases] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [activityError, setActivityError] = useState('')
  const [stats, setStats] = useState({
    totalPets: 0,
    upcomingAppointments: 0,
    pendingAdoptions: 0,
    reservations: 0
  })

  // Load all dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setActivityLoading(true)
      setActivityError('')
      
      // Load all data in parallel
      const [petsRes, ownedRes, resvRes, activityRes, adoptedRes, vetRes] = await Promise.allSettled([
        userPetsAPI.list(),
        apiClient.get('/pets/my-pets'),
        apiClient.get('/petshop/user/public/reservations'),
        apiClient.get('/user-dashboard/activities'),
        adoptionAPI.getMyAdoptedPets(),
        apiClient.get('/veterinary/user/appointments') // Get real veterinary appointments
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
      
      // Process petshop purchases
      let purchases = []
      if (resvRes.status === 'fulfilled') {
        const all = resvRes.value.data?.data?.reservations || []
        purchases = all.filter(r => ['paid','ready_pickup','completed','at_owner'].includes(r.status))
        setPetshopPurchases(purchases)
      }

      // Process adopted pets
      let adoptedPets = []
      if (adoptedRes.status === 'fulfilled') {
        adoptedPets = adoptedRes.value.data?.data || []
      }

      // Process veterinary appointments
      let upcomingAppointments = []
      if (vetRes.status === 'fulfilled') {
        upcomingAppointments = vetRes.value.data?.data?.appointments || []
      }

      // Map purchased items to pet-like objects
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
      const combinedPets = [...allPets, ...mappedPurchases, ...mappedAdoptedPets]
      const uniquePets = combinedPets.filter((pet, index, self) => 
        index === self.findIndex(p => (p.petCode || p._id) === (pet.petCode || pet._id))
      )
      
      setMyPets(uniquePets)
      
      // Update stats with real data
      setStats({
        totalPets: uniquePets.length,
        upcomingAppointments: upcomingAppointments.length,
        pendingAdoptions: 0, // Would come from adoption API
        reservations: purchases.length
      })
      
      // Set upcoming appointments
      setUpcomingAppointments(upcomingAppointments.slice(0, 5)) // Show only first 5
      
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
            a.type === 'medical' ? <MedicalIcon /> :
            a.type === 'vaccination' ? <VaccineIcon /> :
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
    } finally {
      setLoading(false)
      setActivityLoading(false)
    }
  }

  // Load modules
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

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData()
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
    return Array.from(byKey.values())
  }, [myPets])

  // Service categories for better organization
  const serviceCategories = [
    {
      title: "Health & Medical",
      icon: <MedicalIcon />,
      color: "#FF6B6B",
      services: [
        { name: "Veterinary Appointments", icon: <HospitalIcon />, path: "/User/veterinary", description: "Book checkups and treatments" },
        { name: "Vaccination Records", icon: <VaccineIcon />, path: "/User/pets", description: "Track vaccination schedules" },
        { name: "Medical History", icon: <MedicalIcon />, path: "/User/pets", description: "View complete health records" },
        { name: "Pharmacy", icon: <PharmacyIconAlt />, path: "/User/pharmacy", description: "Order pet medications" }
      ]
    },
    {
      title: "Care & Boarding",
      icon: <HotelIcon />,
      color: "#4ECDC4",
      services: [
        { name: "Temporary Care", icon: <HotelIcon />, path: "/User/temporary-care", description: "Short-term pet boarding" },
        { name: "Grooming Services", icon: <BuildIcon />, path: "/User/petshop", description: "Professional grooming" },
        { name: "Pet Walking", icon: <PetsIcon />, path: "/User/temporary-care", description: "Daily walks and exercise" }
      ]
    },
    {
      title: "Shopping & Adoption",
      icon: <ShopIcon />,
      color: "#45B7D1",
      services: [
        { name: "Pet Shop", icon: <StoreIcon />, path: "/User/petshop", description: "Buy pets and supplies" },
        { name: "Adoption Center", icon: <FavoriteIcon />, path: "/User/adoption", description: "Adopt loving pets" },
        { name: "E-commerce", icon: <CartIcon />, path: "/User/ecommerce", description: "Pet accessories and food" }
      ]
    },
    {
      title: "Community & Support",
      icon: <SupportIcon />,
      color: "#96CEB4",
      services: [
        { name: "Rescue Services", icon: <VolunteerIcon />, path: "/User/rescue", description: "Report and rescue animals" },
        { name: "Support Center", icon: <SupportIcon />, path: "/User/help", description: "Get help and support" },
        { name: "Community Forum", icon: <ChatIcon />, path: "/User/community", description: "Connect with other pet owners" }
      ]
    }
  ]

  // Quick action buttons
  const quickActions = [
    { title: 'Add New Pet', icon: <AddIcon />, path: '/User/pets/add', color: '#6C5CE7' },
    { title: 'Book Appointment', icon: <CalendarIcon />, path: '/User/veterinary', color: '#FF6B6B' },
    { title: 'Find Adoption', icon: <FavoriteIcon />, path: '/User/adoption', color: '#FF9F43' },
    { title: 'Shop Products', icon: <ShopIcon />, path: '/User/ecommerce', color: '#4ECDC4' }
  ]

  const [upcomingAppointments, setUpcomingAppointments] = useState([])

  return (
    <UserLayout user={user}>
      {/* Welcome Section */}
      <Box sx={{ 
        mb: 4,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        borderRadius: 3,
        p: { xs: 2, sm: 3, md: 4 },
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Typography variant="h3" sx={{ 
          mb: 1, 
          fontWeight: 800,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Welcome back, {user?.name?.split(' ')[0] || 'Friend'}! 🐾
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Let's take great care of your furry friends today
        </Typography>
        
        {/* Stats Cards */}
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ bgcolor: alpha('#6C5CE7', 0.1), border: '1px solid', borderColor: '#6C5CE7' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#6C5CE7' }}>
                      {stats.totalPets}
                    </Typography>
                    <Typography variant="body2" color="#6C5CE7">
                      My Pets
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#6C5CE7', width: 48, height: 48 }}>
                    <PetsIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ bgcolor: alpha('#FF6B6B', 0.1), border: '1px solid', borderColor: '#FF6B6B' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#FF6B6B' }}>
                      {stats.upcomingAppointments}
                    </Typography>
                    <Typography variant="body2" color="#FF6B6B">
                      Appointments
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#FF6B6B', width: 48, height: 48 }}>
                    <CalendarIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ bgcolor: alpha('#4ECDC4', 0.1), border: '1px solid', borderColor: '#4ECDC4' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4ECDC4' }}>
                      {stats.reservations}
                    </Typography>
                    <Typography variant="body2" color="#4ECDC4">
                      Reservations
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#4ECDC4', width: 48, height: 48 }}>
                    <EventIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ bgcolor: alpha('#FF9F43', 0.1), border: '1px solid', borderColor: '#FF9F43' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#FF9F43' }}>
                      {stats.pendingAdoptions}
                    </Typography>
                    <Typography variant="body2" color="#FF9F43">
                      Adoptions
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#FF9F43', width: 48, height: 48 }}>
                    <FavoriteIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Quick Actions */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <StarIcon color="primary" />
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          {quickActions.map((action, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    transform: 'translateY(-5px)',
                    boxShadow: 3,
                    bgcolor: alpha(action.color, 0.05)
                  },
                  border: `1px solid ${alpha(action.color, 0.3)}`
                }}
                onClick={() => navigate(action.path)}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Avatar sx={{ 
                    bgcolor: alpha(action.color, 0.1), 
                    color: action.color, 
                    width: 56, 
                    height: 56, 
                    mx: 'auto', 
                    mb: 2 
                  }}>
                    {action.icon}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {action.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* My Pets Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PetsIcon color="primary" />
            My Pets ({allMyPets.length})
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => navigate('/User/pets')}
            endIcon={<ArrowIcon />}
          >
            View All
          </Button>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
            {[1, 2, 3].map((i) => (
              <Card key={i} sx={{ minWidth: 280, flex: '0 0 auto' }}>
                <CardContent>
                  <Skeleton variant="rectangular" height={60} width={60} sx={{ borderRadius: 2, mb: 2 }} />
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="60%" />
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : allMyPets.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <PetsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                No pets yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add your first pet to get started with all our services
              </Typography>
              <Button 
                variant="contained" 
                size="large" 
                startIcon={<AddIcon />} 
                onClick={() => navigate('/User/pets/add')}
                sx={{ px: 4 }}
              >
                Add Your First Pet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
            {allMyPets.slice(0, 4).map((pet) => (
              <Card 
                key={pet._id || pet.petCode} 
                sx={{ 
                  minWidth: 280, 
                  flex: '0 0 auto', 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    transform: 'translateY(-3px)',
                    boxShadow: 3
                  }
                }} 
                onClick={() => navigate(`/User/pets/${pet._id || 'view'}`)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {(() => {
                      const src = resolveMediaUrl(
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
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: '12px',
                            border: '2px solid',
                            borderColor: 'divider'
                          }}
                        />
                      )
                    })()}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="h6" noWrap sx={{ fontWeight: 'bold' }}>
                          {pet.name || 'Unnamed Pet'}
                        </Typography>
                        {(pet.petCode || pet.code) && (
                          <Chip 
                            label={pet.petCode || pet.code} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              fontFamily: 'monospace', 
                              fontSize: '0.7rem',
                              height: 20
                            }}
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
                          color={
                            pet.status === 'adopted' ? 'success' :
                            pet.status === 'reserved' ? 'warning' :
                            'primary'
                          }
                          variant="outlined"
                        />
                        {pet.tags?.includes('petshop') && (
                          <Chip label="Pet Shop" size="small" color="info" variant="outlined" />
                        )}
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
        )}
      </Box>

      {/* Service Categories */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <BuildIcon color="primary" />
          Pet Care Services
        </Typography>
        <Grid container spacing={3}>
          {serviceCategories.map((category, categoryIndex) => (
            <Grid item xs={12} md={6} key={categoryIndex}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Avatar sx={{ 
                      bgcolor: alpha(category.color, 0.1), 
                      color: category.color, 
                      width: 56, 
                      height: 56 
                    }}>
                      {category.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {category.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Everything you need for {category.title.toLowerCase()}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Grid container spacing={2}>
                    {category.services.map((service, serviceIndex) => (
                      <Grid item xs={12} sm={6} key={serviceIndex}>
                        <Card 
                          sx={{ 
                            height: '100%', 
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': { 
                              transform: 'translateY(-2px)',
                              boxShadow: 2,
                              borderColor: category.color
                            },
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                          onClick={() => navigate(service.path)}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                              <Avatar sx={{ 
                                bgcolor: alpha(category.color, 0.1), 
                                color: category.color, 
                                width: 36, 
                                height: 36 
                              }}>
                                {service.icon}
                              </Avatar>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                {service.name}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {service.description}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Two Column Layout for Recent Activity and Upcoming Appointments */}
      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
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
                <Box sx={{ textAlign: 'center', py: 4 }}>
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
                onClick={() => navigate('/User/activity')}
              >
                View All Activity
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Upcoming Appointments */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon color="primary" />
                Upcoming Appointments
              </Typography>
              
              {upcomingAppointments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CalendarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No upcoming appointments
                  </Typography>
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={() => navigate('/User/veterinary')}
                  >
                    Book Appointment
                  </Button>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {upcomingAppointments.map((appointment) => (
                    <ListItem 
                      key={appointment._id} 
                      sx={{ 
                        px: 0, 
                        py: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        mb: 1,
                        '&:last-child': { mb: 0 }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Avatar sx={{ 
                          width: 36, 
                          height: 36, 
                          bgcolor: alpha('#4ECDC4', 0.1),
                          color: '#4ECDC4'
                        }}>
                          <EventIcon />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={appointment.serviceName || appointment.type || 'Appointment'}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {appointment.petName || 'Pet'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(appointment.appointmentDate).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                      />
                      <Chip 
                        label={appointment.status || 'Scheduled'} 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              
              <Button 
                variant="outlined" 
                fullWidth 
                sx={{ mt: 2 }}
                onClick={() => navigate('/User/veterinary/appointments')}
              >
                Manage Appointments
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </UserLayout>
  )
}

export default UserDashboard