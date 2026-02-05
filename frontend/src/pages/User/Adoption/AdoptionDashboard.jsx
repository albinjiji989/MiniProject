import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Skeleton,
  Container,
  Paper,
  IconButton
} from '@mui/material'
import {
  Search as SearchIcon,
  Pets as PetIcon,
  Favorite as FavoriteIcon,
  Assignment as ApplicationIcon,
  CheckCircle as AdoptedIcon,
  AutoAwesome as AutoAwesomeIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Cake as CakeIcon,
  HealthAndSafety as HealthIcon
} from '@mui/icons-material'
import { adoptionAPI, resolveMediaUrl } from '../../../services/api'
import { useNavigate, useLocation } from 'react-router-dom'

const AdoptionDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState([]);
  const [applications, setApplications] = useState([]);
  const [adopted, setAdopted] = useState([]);
  const [tab, setTab] = useState('browse');
  const [searchTerm, setSearchTerm] = useState('');
  const [profileStatus, setProfileStatus] = useState(null);
  const [error, setError] = useState('');
  
  // Filter pets based on search term
  const filteredPets = pets.filter(pet => 
    (pet.name || 'Unnamed Pet').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pet.breed || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pet.species || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchData();
  }, []);

  // Sync active tab from current route
  useEffect(() => {
    if (location.pathname.includes('/adoption/applications')) {
      setTab('applications')
    } else if (location.pathname.includes('/adoption/adopted')) {
      setTab('adopted')
    } else {
      setTab('browse')
    }
  }, [location.pathname])

  const fetchData = async () => {
    try {
      setLoading(true);
      const [petsRes, applicationsRes, adoptedRes, profileRes] = await Promise.all([
        adoptionAPI.listPets(),
        adoptionAPI.listMyRequests(),
        adoptionAPI.getMyAdoptedPets(),
        adoptionAPI.getAdoptionProfileStatus()
      ]);

      console.log('Fetched pets:', petsRes.data.data.pets);
      setPets(petsRes.data.data.pets || []);
      setApplications(applicationsRes.data.data || []);
      setAdopted(adoptedRes.data.data || []);
      if (profileRes.data.success) {
        setProfileStatus(profileRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching adoption data:', error);
      setError('Failed to load adoption data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const actions = [
    { label: 'My Applications', onClick: () => navigate('/User/adoption/applications'), icon: <ApplicationIcon /> },
    { label: 'My Adoptions', onClick: () => navigate('/User/adoption/adopted'), icon: <AdoptedIcon /> },
    { label: 'AI/ML Insights', onClick: () => navigate('/User/adoption/aiml-dashboard'), icon: <AutoAwesomeIcon /> }
  ]

  const stats = [
    { label: 'Available Pets', value: pets.length, icon: <PetIcon /> },
    { label: 'My Applications', value: applications.length, icon: <ApplicationIcon /> },
    { label: 'Adopted Pets', value: adopted.length, icon: <FavoriteIcon /> },
  ]

  const tabs = [
    { key: 'browse', label: 'Browse Pets', icon: <PetIcon /> },
    { key: 'adopted', label: 'My Adoptions', icon: <FavoriteIcon /> },
  ]

  const handleTabChange = (key) => {
    setTab(key)
    if (key === 'applications') navigate('/User/adoption/applications')
    else if (key === 'adopted') navigate('/User/adoption/adopted')
    else navigate('/User/adoption')
  }

  const renderBrowse = () => (
    <Box>
      {/* Hero Section */}
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 3,
          p: 4,
          mb: 4,
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Find Your Perfect Companion 🐾
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.95 }}>
            Every pet deserves a loving home. Start your adoption journey today!
          </Typography>
        </Box>
        
        {/* Decorative Elements */}
        <Box 
          sx={{ 
            position: 'absolute', 
            right: -50, 
            top: -50, 
            width: 200, 
            height: 200, 
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)'
          }} 
        />
        <Box 
          sx={{ 
            position: 'absolute', 
            right: 100, 
            bottom: -30, 
            width: 150, 
            height: 150, 
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)'
          }} 
        />
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {/* AI Profile Widget */}
        {profileStatus && !profileStatus.isComplete && (
          <Grid item xs={12}>
            <Paper 
              elevation={2}
              sx={{ 
                p: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                }
              }}
              onClick={() => navigate('/user/adoption/profile-wizard')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AutoAwesomeIcon sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      🎯 Unlock AI-Powered Matches!
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Complete your profile to get personalized pet recommendations
                    </Typography>
                  </Box>
                </Box>
                <Button 
                  variant="contained" 
                  sx={{ 
                    bgcolor: 'white', 
                    color: '#667eea',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                  }}
                >
                  Complete Profile
                </Button>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                    Profile {profileStatus.completionPercentage}% Complete
                  </Typography>
                  <Box sx={{ 
                    height: 8, 
                    bgcolor: 'rgba(255,255,255,0.3)', 
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      width: `${profileStatus.completionPercentage}%`, 
                      height: '100%', 
                      bgcolor: 'white',
                      transition: 'width 0.3s ease'
                    }} />
                  </Box>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {profileStatus.completedFields}/{profileStatus.totalFields}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* AI Smart Matches Widget */}
        {profileStatus && profileStatus.isComplete && (
          <Grid item xs={12}>
            <Paper 
              elevation={2}
              sx={{ 
                p: 3,
                background: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
                color: 'white',
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                }
              }}
              onClick={() => navigate('/user/adoption/smart-matches')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AutoAwesomeIcon sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      ✅ Profile Complete! View Your Top Matches
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      See AI-powered recommendations based on your lifestyle
                    </Typography>
                  </Box>
                </Box>
                <Button 
                  variant="contained" 
                  sx={{ 
                    bgcolor: 'white', 
                    color: '#4caf50',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                  }}
                >
                  View Matches
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}
        
        <Grid item xs={12} sm={4}>
          <Paper 
            elevation={0}
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            sx={{ 
              p: 3, 
              textAlign: 'center',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
              }
            }}
          >
            <PetIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" fontWeight={700}>{pets.length}</Typography>
            <Typography variant="body2">Pets Waiting</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper 
            elevation={0}
            onClick={() => navigate('/User/adoption/applications')}
            sx={{ 
              p: 3, 
              textAlign: 'center',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
              }
            }}
          >
            <ApplicationIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" fontWeight={700}>{applications.length}</Typography>
            <Typography variant="body2">Your Applications</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper 
            elevation={0}
            onClick={() => navigate('/User/adoption/adopted')}
            sx={{ 
              p: 3, 
              textAlign: 'center',
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: 'white',
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
              }
            }}
          >
            <FavoriteIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" fontWeight={700}>{adopted.length}</Typography>
            <Typography variant="body2">Adopted Pets</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Search Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 4, borderRadius: 2, border: '2px solid', borderColor: 'divider' }}>
        <TextField
          fullWidth
          placeholder="Search by name, breed, or species..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': { border: 'none' }
            }
          }}
        />
      </Paper>
      
      {/* Pet Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <Skeleton variant="rectangular" height={250} />
                <CardContent>
                  <Skeleton variant="text" sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="60%" sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" height={36} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={3}>
          {filteredPets.length > 0 ? (
            filteredPets.map(pet => (
              <Grid item xs={12} sm={6} md={4} key={pet._id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: 3,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    border: '2px solid transparent',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  {/* Pet Image */}
                  <Box 
                    sx={{ 
                      position: 'relative', 
                      width: '100%', 
                      height: 250, 
                      bgcolor: 'grey.100', 
                      overflow: 'hidden'
                    }}
                  >
                    {pet.images && pet.images.length > 0 ? (
                      <img 
                        loading="lazy" 
                        src={resolveMediaUrl(pet.images[0]?.url || '')} 
                        alt={pet.name || 'Pet'} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => { 
                          e.currentTarget.src = '/placeholder-pet.svg';
                        }} 
                      />
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <PetIcon sx={{ fontSize: 80, color: 'grey.300' }} />
                      </Box>
                    )}
                    
                    {/* Favorite Icon Overlay */}
                    <IconButton 
                      sx={{ 
                        position: 'absolute', 
                        top: 8, 
                        right: 8,
                        bgcolor: 'white',
                        boxShadow: 2,
                        '&:hover': { bgcolor: 'white', transform: 'scale(1.1)' }
                      }}
                    >
                      <FavoriteBorderIcon sx={{ color: 'error.main' }} />
                    </IconButton>
                  </Box>
                  
                  {/* Pet Info */}
                  <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                      {pet.breed} • {pet.species}
                    </Typography>
                    
                    {/* Pet Details with Icons */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {pet.gender?.toLowerCase() === 'male' ? 
                          <MaleIcon sx={{ color: '#2196f3', fontSize: 20 }} /> : 
                          <FemaleIcon sx={{ color: '#e91e63', fontSize: 20 }} />
                        }
                        <Typography variant="body2" fontWeight={500}>
                          {pet.gender}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CakeIcon sx={{ color: '#ff9800', fontSize: 20 }} />
                        <Typography variant="body2" fontWeight={500}>
                          {pet.ageDisplay || `${pet.age} ${pet.ageUnit}`}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HealthIcon sx={{ color: '#4caf50', fontSize: 20 }} />
                        <Typography variant="body2" fontWeight={500}>
                          {pet.healthStatus}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        fullWidth
                        variant="outlined" 
                        onClick={() => navigate(`/User/adoption/detail/${pet._id}`)}
                        sx={{ 
                          borderRadius: 2,
                          fontWeight: 600,
                          borderWidth: 2,
                          '&:hover': { borderWidth: 2 }
                        }}
                      >
                        Details
                      </Button>
                      <Button 
                        fullWidth
                        variant="contained" 
                        onClick={() => navigate(`/User/adoption/wizard/${pet._id}/applicant`)}
                        sx={{ 
                          borderRadius: 2,
                          fontWeight: 600,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)'
                          }
                        }}
                      >
                        Adopt Me
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 8,
                  textAlign: 'center',
                  borderRadius: 3,
                  border: '2px dashed',
                  borderColor: 'divider'
                }}
              >
                <PetIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                <Typography variant="h5" fontWeight={600} color="text.secondary" gutterBottom>
                  No pets found
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {searchTerm ? 'Try adjusting your search criteria' : 'Check back soon for new pets!'}
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  )

  const renderApplications = () => (
    <Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : applications.length > 0 ? (
        <Box sx={{ overflowX: 'auto' }}>
          <Box sx={{ minWidth: 600 }}>
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                gap: 2,
                p: 2,
                bgcolor: 'background.paper',
                borderBottom: '1px solid',
                borderColor: 'divider',
                fontWeight: 'bold'
              }}
            >
              <Box>Pet</Box>
              <Box>Status</Box>
              <Box>Reason</Box>
              <Box>Date</Box>
              <Box>Action</Box>
            </Box>
            {applications.map(application => (
              <Box 
                key={application._id}
                sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                  gap: 2,
                  p: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <Box>
                  <Typography variant="subtitle2">
                    {application.petId?.name || 'Unnamed Pet'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {application.petId?.species} • {application.petId?.breed}
                  </Typography>
                </Box>
                <Box>
                  <Chip 
                    size="small" 
                    label={application.status} 
                    color={application.status === 'approved' ? 'success' : application.status === 'rejected' ? 'error' : 'default'} 
                  />
                </Box>
                <Box>
                  {application.status === 'rejected' ? (application.rejectionReason || '-') : '-'}
                </Box>
                <Box>
                  {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : '-'}
                </Box>
                <Box>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    onClick={() => navigate(`/User/adoption/applications/${application._id}`)}
                  >
                    View
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      ) : (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            py: 8,
            textAlign: 'center'
          }}
        >
          <ApplicationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No applications yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Apply for a pet to see your applications here
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<PetIcon />}
            onClick={() => navigate('/User/adoption')}
          >
            Browse Pets
          </Button>
        </Box>
      )}
    </Box>
  )

  const renderAdopted = () => (
    <Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : adopted.length > 0 ? (
        <Grid container spacing={3}>
          {adopted.map(pet => (
            <Grid item xs={12} sm={6} md={4} key={pet._id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
                }}
              >
                <Box 
                  sx={{ 
                    position: 'relative', 
                    width: '100%', 
                    height: 180, 
                    bgcolor: 'grey.100', 
                    overflow: 'hidden', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  {pet.images && pet.images.length > 0 ? (
                    <img 
                      src={resolveMediaUrl(pet.images[0]?.url || '')} 
                      alt={pet.name || 'Pet'} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      onError={(e) => { 
                        e.currentTarget.src = '/placeholder-pet.svg';
                      }} 
                    />
                  ) : (
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Box 
                        component="img" 
                        src="/placeholder-pet.svg" 
                        alt="No image" 
                        sx={{ width: 60, height: 60, opacity: 0.5, mb: 1 }} 
                      />
                      <Typography variant="caption" color="text.secondary">No image</Typography>
                    </Box>
                  )}
                </Box>
                
                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', mb: 1 }}>
                    <Box>
                      <Typography variant="h6" fontWeight={600} noWrap>
                        {pet.name || 'Unnamed Pet'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {pet.breed} • {pet.species}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 'auto' }}>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      sx={{ flex: 1, minWidth: 80 }}
                      onClick={() => navigate(`/User/adoption/adopted/${pet._id}`)}
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            py: 8,
            textAlign: 'center'
          }}
        >
          <FavoriteIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No adopted pets yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Adopt a pet to see them here
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<PetIcon />}
            onClick={() => navigate('/User/adoption')}
          >
            Browse Pets
          </Button>
        </Box>
      )}
    </Box>
  )

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa', py: 4 }}>
      <Container maxWidth="xl">
        {renderBrowse()}
      </Container>
    </Box>
  );
};

export default AdoptionDashboard;