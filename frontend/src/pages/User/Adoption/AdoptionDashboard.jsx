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
  Skeleton
} from '@mui/material'
import {
  Search as SearchIcon,
  Pets as PetIcon,
  Favorite as FavoriteIcon,
  Assignment as ApplicationIcon,
  CheckCircle as AdoptedIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material'
import { adoptionAPI, resolveMediaUrl } from '../../../services/api'
import { useNavigate, useLocation } from 'react-router-dom'
import ModuleDashboardLayout from '../../../components/Module/ModuleDashboardLayout'

const AdoptionDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState([]);
  const [applications, setApplications] = useState([]);
  const [adopted, setAdopted] = useState([]);
  const [tab, setTab] = useState('browse');
  const [searchTerm, setSearchTerm] = useState('');
  
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
      const [petsRes, applicationsRes, adoptedRes] = await Promise.all([
        adoptionAPI.listPets(),
        adoptionAPI.listMyRequests(),
        adoptionAPI.getMyAdoptedPets()
      ]);

      console.log('Fetched pets:', petsRes.data.data.pets);
      setPets(petsRes.data.data.pets || []);
      setApplications(applicationsRes.data.data || []);
      setAdopted(adoptedRes.data.data || [])
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
    { key: 'applications', label: 'My Applications', icon: <ApplicationIcon /> },
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
      {/* Search Bar */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          fullWidth
          placeholder="Search pets by name, breed, or species..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
      </Box>
      
      {/* Pet Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <Skeleton variant="rectangular" height={180} />
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
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3
                    }
                  }}
                >
                  {/* Pet Image */}
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
                        loading="lazy" 
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
                  
                  {/* Pet Info */}
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
                    
                    {/* Pet Details Grid */}
                    <Box 
                      component="dl" 
                      sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 1,
                        fontSize: '0.8rem',
                        mb: 2
                      }}
                    >
                      <>
                        <dt>Gender:</dt>
                        <dd>{pet.gender}</dd>
                        
                        <dt>Age:</dt>
                        <dd>{pet.ageDisplay || `${pet.age} ${pet.ageUnit}`}</dd>
                        
                        <dt>Health:</dt>
                        <dd>{pet.healthStatus}</dd>
                        
                        <dt>Fee:</dt>
                        <dd>₹{pet.adoptionFee || 0}</dd>
                      </>
                    </Box>
                    
                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 'auto' }}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        sx={{ flex: 1, minWidth: 80 }}
                        onClick={() => {
                          console.log('View Details clicked, pet._id:', pet._id);
                          navigate(`/User/adoption/detail/${pet._id}`);
                        }}
                      >
                        View Details
                      </Button>
                      <Button 
                        size="small" 
                        variant="contained" 
                        sx={{ flex: 1, minWidth: 80 }}
                        onClick={() => {
                          console.log('Adopt clicked, pet._id:', pet._id);
                          navigate(`/User/adoption/wizard/${pet._id}/applicant`);
                        }}
                      >
                        Adopt
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
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
                <PetIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No pets found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {searchTerm ? 'Try adjusting your search criteria' : 'No pets available right now'}
                </Typography>
              </Box>
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
    <ModuleDashboardLayout
      title="Adoption Center"
      description="Find your perfect companion"
      actions={actions}
      stats={stats}
      tabs={tabs}
      activeTab={tab}
      onTabChange={handleTabChange}
    >
      {tab === 'browse' && renderBrowse()}
      {tab === 'applications' && renderApplications()}
      {tab === 'adopted' && renderAdopted()}
    </ModuleDashboardLayout>
  );
};

export default AdoptionDashboard;