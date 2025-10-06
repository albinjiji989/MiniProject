import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Grid,
  Card,
  CardContent,
  CardMedia,
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
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Favorite as AdoptionIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Logout as LogoutIcon,
  Pets as PetsIcon,
} from '@mui/icons-material'
import { useAuth } from '../../../contexts/AuthContext'
import { apiClient, resolveMediaUrl } from '../../../services/api'

const Adoption = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [pets, setPets] = React.useState([])
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(12)
  const [total, setTotal] = React.useState(0)
  const [filters, setFilters] = React.useState({ species: '', breed: '', gender: '', age: '' })

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleBackToDashboard = () => {
    navigate('/dashboard')
  }

  const loadPets = React.useCallback(async () => {
    try {
      setLoading(true)
      // Use adoption public list with pagination
      const res = await apiClient.get('/adoption/public/pets', { params: { page, limit, ...filters } })
      const raw = res?.data?.data?.pets || res?.data?.pets || res?.data || []
      const normalized = (Array.isArray(raw) ? raw : []).map((p) => ({
        id: p._id || p.id,
        name: p.name || p.petName || 'Pet',
        breed: p.breed || p.petBreed || p.species || 'Unknown',
        age: p.age || p.ageYears || 0,
        ageUnit: p.ageUnit || 'months',
        gender: p.gender || 'Unknown',
        image: resolveMediaUrl((p.images?.[0]?.url) || p.image || p.photoUrl || '' ) || 'https://via.placeholder.com/400x300?text=Pet',
        status: p.status || p.currentStatus || 'available',
        description: p.description || 'No description provided.',
        code: p.petCode || p.code || p.pet_code || '',
        adoptionFee: p.adoptionFee || 0,
        species: p.species || 'Unknown',
        color: p.color || 'Unknown',
        healthStatus: p.healthStatus || 'good',
        temperament: p.temperament || 'friendly'
      }))
      setPets(normalized)
      const pag = res?.data?.data?.pagination
      setTotal(pag?.total || normalized.length)
    } catch (e) {
      console.error('Error loading adoption pets:', e)
      setPets([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, limit, filters])

  React.useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoading(true)
        await loadPets()
      } catch (e) {
        // handled in loadPets
      } finally {
        setLoading(false)
      }
    }
    loadInitial()
  }, [loadPets])

  const applyFilters = () => { setPage(1); loadPets() }

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
          <AdoptionIcon sx={{ fontSize: 32, color: '#4caf50', mr: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#333' }}>
            Adoption Management
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
    switch (status?.toLowerCase()) {
      case 'available': return 'success'
      case 'reserved': return 'warning'
      case 'adopted': return 'info'
      case 'pending': return 'warning'
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
              Available Pets for Adoption
            </Typography>
            <Typography variant="body1" sx={{ color: '#666' }}>
              Find your perfect companion from our loving pets
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField size="small" label="Species" value={filters.species} onChange={(e)=>setFilters(f=>({...f, species:e.target.value}))} />
            <TextField size="small" label="Breed" value={filters.breed} onChange={(e)=>setFilters(f=>({...f, breed:e.target.value}))} />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="gender">Gender</InputLabel>
              <Select labelId="gender" label="Gender" value={filters.gender} onChange={(e)=>setFilters(f=>({...f, gender:e.target.value}))}>
                <MenuItem value="">Any</MenuItem>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="age">Age</InputLabel>
              <Select labelId="age" label="Age" value={filters.age} onChange={(e)=>setFilters(f=>({...f, age:e.target.value}))}>
                <MenuItem value="">Any</MenuItem>
                <MenuItem value={12}>0–12 months</MenuItem>
                <MenuItem value={24}>13–24 months</MenuItem>
                <MenuItem value={36}>25–36 months</MenuItem>
                <MenuItem value={37}>36+ months</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" startIcon={<FilterIcon />} sx={{ borderColor: '#4caf50', color: '#4caf50' }} onClick={applyFilters}>Apply</Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#388e3c' } }}
            >
              Add Pet
            </Button>
          </Box>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <CardContent>
                <PetsIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {pets.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Pets
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <CardContent>
                <AdoptionIcon sx={{ fontSize: 40, color: '#2196f3', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {pets.filter(pet => pet.status?.toLowerCase() === 'available').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Available
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <CardContent>
                <AdoptionIcon sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {pets.filter(pet => pet.status?.toLowerCase() === 'reserved' || pet.status?.toLowerCase() === 'pending').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <CardContent>
                <AdoptionIcon sx={{ fontSize: 40, color: '#9c27b0', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {pets.filter(pet => pet.status?.toLowerCase() === 'adopted').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Adopted
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Pets Grid */}
        <Grid container spacing={3}>
          {loading && (
            <Grid item xs={12}><Typography>Loading...</Typography></Grid>
          )}
          {!loading && pets.length === 0 && (
            <Grid item xs={12}><Typography color="text.secondary">No pets found.</Typography></Grid>
          )}
          {pets.map((pet) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={pet.id}>
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
                <CardMedia
                  component="img"
                  height="200"
                  image={pet.image}
                  alt={pet.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{pet.name}</span>
                      {pet.code && (
                        <Chip label={pet.code} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
                      )}
                    </Typography>
                    <Chip 
                      label={pet.status} 
                      color={getStatusColor(pet.status)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {pet.breed} • {pet.age} {pet.ageUnit} old • {pet.gender}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {pet.description}
                  </Typography>
                  {pet.adoptionFee > 0 && (
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50', mb: 1 }}>
                      Adoption Fee: ₹{pet.adoptionFee}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button 
                    size="small" 
                    variant="outlined"
                    sx={{ borderColor: '#4caf50', color: '#4caf50' }}
                    onClick={() => navigate(`/User/adoption/${pet.id}`)}
                  >
                    View Details
                  </Button>
                  <Button 
                    size="small" 
                    variant="contained"
                    sx={{ backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#388e3c' } }}
                    onClick={() => navigate(`/User/adoption/apply/applicant?petId=${pet.id}`)}
                  >
                    Adopt
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mt: 3 }}>
          <Typography variant="caption" color="text.secondary">Total: {total}</Typography>
          <Pagination count={Math.max(1, Math.ceil(total/limit))} page={page} onChange={(_,p)=>setPage(p)} size="small" />
        </Box>
      </Container>
    </Box>
  )
}

export default Adoption



