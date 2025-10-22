import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Avatar,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  LocalHospital as VeterinaryIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Logout as LogoutIcon,
  Schedule as ScheduleIcon,
  Pets as PetsIcon,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { petsAPI, veterinaryAPI } from '../../services/api'

const Veterinary = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [petDialogOpen, setPetDialogOpen] = React.useState(false)
  const [pets, setPets] = React.useState([])
  const [petsLoading, setPetsLoading] = React.useState(false)
  const [petsError, setPetsError] = React.useState('')
  const [selectedPetId, setSelectedPetId] = React.useState('')

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const openSelectPet = async () => {
    setPetDialogOpen(true)
    setPetsLoading(true)
    setPetsError('')
    try {
      const res = await petsAPI.getPets({ page: 1, limit: 50, mine: true })
      setPets(res.data?.data?.pets || [])
    } catch (e) {
      setPetsError(e?.response?.data?.message || 'Failed to load pets')
    } finally {
      setPetsLoading(false)
    }
  }

  const confirmSelectPet = () => {
    if (!selectedPetId) return
    setPetDialogOpen(false)
    // proceed to booking flow with selectedPetId (extend as needed)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleBackToDashboard = () => {
    navigate('/dashboard')
  }

  const [clinics, setClinics] = React.useState([])
  const [appointments, setAppointments] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    const loadVetData = async () => {
      setLoading(true)
      setError('')
      try {
        const [clinicsRes, apptRes] = await Promise.all([
          veterinaryAPI.getClinics().catch(() => ({ data: { data: { clinics: [] } } })),
          veterinaryAPI.getAppointments().catch(() => ({ data: { data: { appointments: [] } } })),
        ])
        const rawClinics = clinicsRes.data?.data?.clinics || clinicsRes.data?.clinics || []
        const normalizedClinics = rawClinics.map((c) => ({
          id: c._id || c.id,
          name: c.name || 'Clinic',
          location: c.location || c.address || '-',
          phone: c.phone || '-',
          rating: c.rating || 0,
          reviews: c.reviews || 0,
          specialties: c.specialties || [],
          image: c.image || '/placeholder-pet.svg',
        }))
        setClinics(normalizedClinics)

        const rawAppts = apptRes.data?.data?.appointments || apptRes.data?.appointments || []
        const normalizedAppts = rawAppts.map((a) => ({
          id: a._id || a.id,
          petName: a.petName || (a.pet && a.pet.name) || 'Pet',
          petType: a.petType || (a.pet && a.pet.species) || '-',
          clinic: (a.clinic && a.clinic.name) || a.clinicName || '-',
          date: a.date || '-',
          time: a.time || '-',
          type: a.type || 'Checkup',
          status: a.status || 'Scheduled',
        }))
        setAppointments(normalizedAppts)
      } catch (e) {
        setError('Failed to load veterinary data')
        setClinics([])
        setAppointments([])
      } finally {
        setLoading(false)
      }
    }
    loadVetData()
  }, [])

  const Navbar = () => (
    <AppBar 
      position="sticky" 
      elevation={0} 
      sx={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.1)',
        color: '#333'
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          onClick={handleBackToDashboard}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <VeterinaryIcon sx={{ fontSize: 32, color: '#4caf50', mr: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#333' }}>
            Veterinary Services
          </Typography>
        </Box>

        {isMobile ? (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMobileMenuToggle}
          >
            <MenuIcon />
          </IconButton>
        ) : (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body1" sx={{ color: '#333', mr: 2 }}>
              {user?.name || 'User'}
            </Typography>
            <IconButton onClick={handleLogout} color="inherit">
              <LogoutIcon />
            </IconButton>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  )

  const MobileMenu = () => (
    <Drawer
      anchor="right"
      open={mobileMenuOpen}
      onClose={handleMobileMenuToggle}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          backgroundColor: '#f8f9fa'
        }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Menu
          </Typography>
          <IconButton onClick={handleMobileMenuToggle}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={handleBackToDashboard}>
              <ListItemText primary="Back to Dashboard" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout}>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  )

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled': return 'info'
      case 'Confirmed': return 'success'
      case 'Completed': return 'default'
      case 'Cancelled': return 'error'
      default: return 'default'
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Navbar />
      <MobileMenu />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#333' }}>
              Veterinary Care Services
            </Typography>
            <Typography variant="body1" sx={{ color: '#666' }}>
              Professional veterinary care for your beloved pets
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              sx={{ borderColor: '#4caf50', color: '#4caf50' }}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              sx={{ borderColor: '#4caf50', color: '#4caf50' }}
            >
              Filter
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#388e3c' } }}
              onClick={openSelectPet}
            >
              Book Appointment
            </Button>
          </Box>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <CardContent>
                <VeterinaryIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {clinics.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Veterinary Clinics
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <CardContent>
                <ScheduleIcon sx={{ fontSize: 40, color: '#2196f3', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {appointments.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Appointments
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <CardContent>
                <PetsIcon sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {appointments.filter(apt => apt.status === 'Scheduled').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Scheduled
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <CardContent>
                <VeterinaryIcon sx={{ fontSize: 40, color: '#9c27b0', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {appointments.filter(apt => apt.status === 'Completed').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Veterinary Clinics */}
          <Grid item xs={12} md={8}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#333' }}>
              Available Clinics
            </Typography>
            <Grid container spacing={3}>
              {clinics.map((clinic) => (
                <Grid item xs={12} md={6} key={clinic.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          src={clinic.image}
                          sx={{ width: 60, height: 60, mr: 2 }}
                        />
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {clinic.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {clinic.location}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        📞 {clinic.phone}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          ⭐ {clinic.rating}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ({clinic.reviews} reviews)
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {clinic.specialties.map((specialty, index) => (
                          <Chip 
                            key={index}
                            label={specialty} 
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </CardContent>
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button 
                        size="small" 
                        variant="outlined"
                        sx={{ borderColor: '#4caf50', color: '#4caf50' }}
                      >
                        View Details
                      </Button>
                      <Button 
                        size="small" 
                        variant="contained"
                        sx={{ backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#388e3c' } }}
                      >
                        Book Appointment
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Recent Appointments */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Recent Appointments
                </Typography>
                {appointments.map((appointment) => (
                  <Box key={appointment.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {appointment.petName} ({appointment.petType})
                      </Typography>
                      <Chip 
                        label={appointment.status} 
                        color={getStatusColor(appointment.status)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {appointment.clinic}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {appointment.date} at {appointment.time} - {appointment.type}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
      {/* Select Pet Dialog */}
      <Drawer anchor="bottom" open={petDialogOpen} onClose={()=>setPetDialogOpen(false)} sx={{ '& .MuiDrawer-paper': { p: 2 } }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Select Pet</Typography>
          <IconButton onClick={()=>setPetDialogOpen(false)}><CloseIcon /></IconButton>
        </Box>
        {petsLoading ? (
          <Typography>Loading pets...</Typography>
        ) : petsError ? (
          <Typography color="error">{petsError}</Typography>
        ) : pets.length === 0 ? (
          <Typography>No pets found. Add a pet first.</Typography>
        ) : (
          <List>
            {pets.map((p) => (
              <ListItem key={p._id} disablePadding>
                <ListItemButton selected={selectedPetId===p._id} onClick={()=>setSelectedPetId(p._id)}>
                  <Avatar src={(p.images&&p.images[0])||undefined} sx={{ mr: 2 }} />
                  <ListItemText primary={p.name} secondary={`${p.species} • ${p.breed || '-'}`} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={()=>setPetDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!selectedPetId} onClick={confirmSelectPet}>Continue</Button>
        </Box>
      </Drawer>
    </Box>
  )
}

export default Veterinary