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
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Favorite as AdoptionIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Pets as PetsIcon,
  EmojiEvents,
  AutoAwesome,
  Close
} from '@mui/icons-material'
import { useAuth } from '../../../contexts/AuthContext'
import { apiClient, resolveMediaUrl } from '../../../services/api'
import { Dialog, DialogTitle, DialogContent, DialogActions, Alert, LinearProgress } from '@mui/material'

const Adoption = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [loading, setLoading] = React.useState(false)
  const [pets, setPets] = React.useState([])
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(12)
  const [total, setTotal] = React.useState(0)
  const [filters, setFilters] = React.useState({ species: '', breed: '', gender: '', age: '' })
  
  // Profile state
  const [profileStatus, setProfileStatus] = React.useState(null)
  const [showWelcomeDialog, setShowWelcomeDialog] = React.useState(false)
  const [dismissedWelcome, setDismissedWelcome] = React.useState(false)

  const handleBackToDashboard = () => {
    navigate('/user/dashboard')
  }

  const loadPets = React.useCallback(async () => {
    try {
      setLoading(true)
      // Use adoption user public list with pagination (aligned to backend)
      const res = await apiClient.get('/adoption/user/public/pets', { params: { page, limit, ...filters } })
      const raw = res?.data?.data?.pets || res?.data?.pets || res?.data || []
      const normalized = (Array.isArray(raw) ? raw : []).map((p) => ({
        id: p._id || p.id,
        name: p.name || p.petName || 'Pet',
        breed: p.breed || p.petBreed || p.species || 'Unknown',
        age: p.age || p.ageYears || 0,
        ageUnit: p.ageUnit || 'months',
        gender: p.gender || 'Unknown',
        image: resolveMediaUrl((p.images?.[0]?.url) || p.image || p.photoUrl || '' ) || '/placeholder-pet.svg',
        status: p.status || p.currentStatus || 'available',
        description: p.description || 'No description provided.',
        code: p.petCode || p.code || p.pet_code || '',
        adoptionFee: p.adoptionFee || 0,
        species: p.species || 'Unknown',
        color: p.color || 'Unknown',
        healthStatus: p.healthStatus || 'good',
        temperament: p.temperament || 'friendly',
        createdBy: p.createdBy || null // Include creator information
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
        await loadProfileStatus()
      } catch (e) {
        // handled in loadPets
      } finally {
        setLoading(false)
      }
    }
    loadInitial()
  }, [loadPets])

  const loadProfileStatus = async () => {
    try {
      const res = await apiClient.get('/adoption/user/profile/adoption/status')
      if (res.data.success) {
        setProfileStatus(res.data.data)
        
        // Show welcome dialog if profile not complete and not dismissed
        const dismissed = localStorage.getItem('adoption_welcome_dismissed')
        if (!res.data.data.isComplete && !dismissed) {
          setShowWelcomeDialog(true)
        }
      }
    } catch (error) {
      console.error('Error loading profile status:', error)
    }
  }

  const handleDismissWelcome = () => {
    setShowWelcomeDialog(false)
    localStorage.setItem('adoption_welcome_dismissed', 'true')
    setDismissedWelcome(true)
  }

  const handleStartProfile = () => {
    setShowWelcomeDialog(false)
    navigate('/user/adoption/profile-wizard')
  }

  const applyFilters = () => { setPage(1); loadPets() }



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
    <Container maxWidth="xl" sx={{ py: 4, mt: 4 }}>
        {/* Welcome Dialog for First-Time Visitors */}
        <Dialog open={showWelcomeDialog} onClose={handleDismissWelcome} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AutoAwesome sx={{ fontSize: 40, color: '#4caf50', mr: 2 }} />
                <Typography variant="h6">Get AI-Powered Pet Matches!</Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Complete your adoption profile to receive personalized pet recommendations based on your lifestyle, living situation, and preferences.
            </Typography>
            
            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                We'll ask about:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                <li>🏠 Your living space (home type, size, yard)</li>
                <li>🏃 Your activity level and daily schedule</li>
                <li>👨‍👩‍👧‍👦 Family composition (children, other pets)</li>
                <li>💰 Budget for adoption and pet care</li>
                <li>❤️ Your pet preferences</li>
              </Box>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              Takes only 3-5 minutes! You can browse pets now and complete your profile anytime to unlock AI matches.
            </Alert>

            <Typography variant="body2" color="text.secondary">
              Your profile helps us recommend pets that truly match your lifestyle, increasing adoption success rates by up to 40%!
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={handleDismissWelcome} color="inherit">
              Maybe Later
            </Button>
            <Button 
              variant="contained" 
              onClick={handleStartProfile}
              startIcon={<EmojiEvents />}
              sx={{ bgcolor: '#4caf50' }}
            >
              Complete Profile Now
            </Button>
          </DialogActions>
        </Dialog>

        {/* Profile Completion Banner */}
        {profileStatus && !profileStatus.isComplete && !dismissedWelcome && (
          <Alert 
            severity="info" 
            sx={{ mb: 3 }}
            action={
              <Button 
                size="small" 
                onClick={() => navigate('/user/adoption/profile-wizard')}
                sx={{ color: '#fff', borderColor: '#fff' }}
                variant="outlined"
              >
                Complete Now
              </Button>
            }
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                🎯 Unlock AI-Powered Matches! Profile {profileStatus.completionPercentage}% Complete
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={profileStatus.completionPercentage} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  bgcolor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': { bgcolor: '#fff' }
                }}
              />
              <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                Complete your profile to see personalized match scores on every pet!
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Profile Complete Success Banner */}
        {profileStatus && profileStatus.isComplete && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              ✅ Profile Complete! You can now see AI match scores for all pets.
            </Typography>
            <Typography variant="caption">
              Click "AI Smart Matches" to see your top recommendations, or browse below to see match scores for each pet.
            </Typography>
          </Alert>
        )}

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
            <Button 
              variant="contained" 
              startIcon={<AutoAwesome />} 
              sx={{ 
                bgcolor: 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)',
                background: 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)',
                boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
              }} 
              onClick={() => navigate('/user/adoption/smart-matches')}
            >
              AI Smart Matches
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<EmojiEvents />} 
              sx={{ borderColor: '#4caf50', color: '#4caf50' }} 
              onClick={() => navigate('/user/adoption/profile-wizard')}
            >
              Complete Profile
            </Button>
          </Box>
        </Box>
        
        {/* Filters */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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

        {/* Debug link for troubleshooting */}
        <Box sx={{ mb: 2, textAlign: 'right' }}>
          <Button 
            size="small" 
            variant="text" 
            onClick={() => navigate('/User/adoption/debug')}
            sx={{ color: '#666', textDecoration: 'underline' }}
          >
            Debug Pet Issues
          </Button>
        </Box>

        {/* Pets Grid */}
        <Grid container spacing={2}>
          {loading && (
            <Grid item xs={12}><Typography>Loading...</Typography></Grid>
          )}
          {!loading && pets.length === 0 && (
            <Grid item xs={12}>
              <Typography color="text.secondary">No pets found.</Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/User/adoption/debug')}
                >
                  Debug Pet Issues
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    setFilters({ species: '', breed: '', gender: '', age: '' })
                    setPage(1)
                    loadPets()
                  }}
                >
                  Reset Filters
                </Button>
              </Box>
            </Grid>
          )}
          {pets.map((pet) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={pet.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height="180"
                  image={pet.image}
                  alt={pet.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                      {pet.name}
                    </Typography>
                    <Chip 
                      label={pet.status} 
                      color={getStatusColor(pet.status)}
                      size="small"
                      sx={{ height: 20 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem' }}>
                    {pet.breed} • {pet.gender}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, fontSize: '0.85rem', minHeight: 40 }}>
                    {pet.description.length > 80 ? `${pet.description.substring(0, 80)}...` : pet.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                      {pet.adoptionFee > 0 ? `₹${pet.adoptionFee}` : 'Free'}
                    </Typography>
                    {pet.code && (
                      <Chip label={pet.code} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem', fontFamily: 'monospace' }} />
                    )}
                  </Box>
                </CardContent>
                <CardActions sx={{ p: 1, pt: 0 }}>
                  <Button 
                    size="small" 
                    variant="outlined"
                    fullWidth
                    sx={{ 
                      borderColor: '#4caf50', 
                      color: '#4caf50',
                      fontSize: '0.75rem',
                      minHeight: 32
                    }}
                    onClick={() => navigate(`/User/adoption/${pet.id}`)}
                  >
                    View Details
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
  )
}

export default Adoption



