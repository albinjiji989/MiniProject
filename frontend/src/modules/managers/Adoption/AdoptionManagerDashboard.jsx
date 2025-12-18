import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, authAPI, resolveMediaUrl } from '../../../services/api';
import { AuthContext } from '../../../contexts/AuthContext';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import PetsIcon from '@mui/icons-material/Pets';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const AdoptionManagerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dispatch } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState([]);
  const [applications, setApplications] = useState([]);
  const [reports, setReports] = useState(null);
  
  // Store identity prompt
  const [storeDialogOpen, setStoreDialogOpen] = useState(false);
  const [storeNameInput, setStoreNameInput] = useState('');
  const [pincodeInput, setPincodeInput] = useState('');

  useEffect(() => {
    const abort = new AbortController();
    // Try cache first (60s TTL)
    try {
      const raw = sessionStorage.getItem('adoption_mgr_dash')
      if (raw) {
        const cached = JSON.parse(raw)
        if (cached && Date.now() - (cached.ts || 0) < 60_000) {
          setPets(cached.pets || [])
          setApplications(cached.apps || [])
          setReports(cached.reports || {})
          setLoading(false)
        }
      }
    } catch {}
    fetchData(abort.signal);
    
    // If manager has storeId but no storeName, prompt to set it
    if (user?.role === 'adoption_manager' && user?.storeId && !user?.storeName) {
      setStoreNameInput('')
      setStoreDialogOpen(true)
    }
    
    return () => abort.abort();
  }, [user]);

  const fetchData = async (signal) => {
    try {
      setLoading(true);
      const reqs = [
        apiClient.get('/adoption/manager/pets', { params: { page: 1, limit: 6, fields: 'name,breed,species,status,ageDisplay,images', lean: false }, signal }), // Changed lean to false
        apiClient.get('/adoption/manager/applications', { params: { page: 1, limit: 5, fields: 'status,userId.name,petId.name,petId.breed', lean: true }, signal }),
        apiClient.get('/adoption/manager/reports', { signal })
      ];
      const [p, a, r] = await Promise.allSettled(reqs);

      if (p.status === 'fulfilled') {
        const raw = p.value.data?.data?.pets || [];
        // Keep full objects including images for display
        const minimal = raw.map(x => ({
          _id: x._id,
          name: x.name,
          breed: x.breed,
          species: x.species,
          status: x.status,
          ageDisplay: x.ageDisplay,
          images: x.images || [] // Keep full images array
        }));
        setPets(minimal);
      }
      if (a.status === 'fulfilled') {
        const raw = a.value.data?.data?.applications || [];
        const minimal = raw.map(x => ({
          _id: x._id,
          status: x.status,
          userId: x.userId ? { name: x.userId.name } : null,
          petId: x.petId ? { name: x.petId.name, breed: x.petId.breed } : null,
        }));
        setApplications(minimal);
      }
      if (r.status === 'fulfilled') {
        setReports(r.value.data?.data || {});
      }
      // Save cache
      try {
        sessionStorage.setItem('adoption_mgr_dash', JSON.stringify({
          ts: Date.now(),
          pets,
          apps: applications,
          reports
        }))
      } catch {}
    } catch (error) {
      console.error('Error fetching manager data:', error);
    } finally {
      setLoading(false);
    }
  };

  const kpis = useMemo(() => ({
    totalPets: pets.length,
    availablePets: pets.filter(p => p.status === 'available').length,
    pendingApps: applications.filter(a => a.status === 'pending').length,
    revenue: reports?.totalRevenue || 0
  }), [pets, applications, reports]);

  const StatusChip = ({ status }) => {
    const map = {
      available: { color: 'success', label: 'AVAILABLE' },
      reserved: { color: 'warning', label: 'RESERVED' },
      adopted: { color: 'primary', label: 'ADOPTED' },
      pending: { color: 'warning', label: 'PENDING' },
      approved: { color: 'success', label: 'APPROVED' },
      rejected: { color: 'error', label: 'REJECTED' },
      completed: { color: 'success', label: 'COMPLETED' },
    };
    const meta = map[status] || { color: 'default', label: (status || '').toUpperCase() };
    return <Chip size="small" color={meta.color} label={meta.label} variant="outlined" />
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Adoption Manager</Typography>
          <Typography variant="body2" color="text.secondary">Overview of pets, applications, and operations</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<AutoAwesomeIcon />} onClick={() => navigate('/manager/adoption/aiml-dashboard')}>
            AI/ML Insights
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData}>Refresh</Button>
          <Button variant="contained" onClick={() => navigate('/manager/adoption/wizard/start')}>Add New Pet</Button>
        </Stack>
      </Box>

      {/* Store Identity Badge */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Chip color="primary" label={`Store ID: ${user?.storeId || 'Pending assignment'}`} />
        <Chip color={user?.storeName ? 'success' : 'warning'} label={`Store Name: ${user?.storeName || 'Not set'}`} />
        {!user?.storeName && (
          <Button size="small" variant="contained" onClick={() => setStoreDialogOpen(true)}>
            Set Store Name
          </Button>
        )}
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PetsIcon color="primary" />
              <Box>
                <Typography variant="caption" color="text.secondary">Total Pets</Typography>
                <Typography variant="h5" fontWeight={700}>{kpis.totalPets}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircleIcon color="success" />
              <Box>
                <Typography variant="caption" color="text.secondary">Available</Typography>
                <Typography variant="h5" fontWeight={700}>{kpis.availablePets}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PendingActionsIcon color="warning" />
              <Box>
                <Typography variant="caption" color="text.secondary">Pending Applications</Typography>
                <Typography variant="h5" fontWeight={700}>{kpis.pendingApps}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <MonetizationOnIcon color="success" />
              <Box>
                <Typography variant="caption" color="text.secondary">Revenue</Typography>
                <Typography variant="h5" fontWeight={700}>₹{kpis.revenue.toLocaleString()}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Pets */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>Recent Pets</Typography>
            <Button 
              size="small" 
              endIcon={<VisibilityIcon />} 
              onClick={() => navigate('/manager/adoption/pets')}
            >
              View All
            </Button>
          </Box>
          {pets.length > 0 ? (
            <Grid container spacing={2}>
              {pets.slice(0, 4).map((pet) => (
                <Grid item xs={12} sm={6} md={3} key={pet._id}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 3 }
                    }}
                    onClick={() => navigate(`/manager/adoption/pets/${pet._id}`)}
                  >
                    {pet.images?.length > 0 && (
                      <Box 
                        component="img"
                        src={resolveMediaUrl(pet.images[0]?.url || pet.images[0])}
                        alt={pet.name}
                        sx={{ 
                          height: 120, 
                          objectFit: 'cover',
                          borderTopLeftRadius: 4,
                          borderTopRightRadius: 4
                        }}
                        onError={(e) => { e.currentTarget.src = '/placeholder-pet.svg' }}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600} noWrap>
                        {pet.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {pet.breed} • {pet.species}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pet.ageDisplay}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <StatusChip status={pet.status} />
                      </Box>
                    </CardContent>
                    <Divider />
                    <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
                      <IconButton size="small" onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/manager/adoption/pets/${pet._id}/edit`);
                      }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              No pets added yet
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Recent Applications */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>Recent Applications</Typography>
            <Button 
              size="small" 
              endIcon={<VisibilityIcon />} 
              onClick={() => navigate('/manager/adoption/applications')}
            >
              View All
            </Button>
          </Box>
          {applications.length > 0 ? (
            <Box sx={{ overflowX: 'auto' }}>
              <Box component="table" sx={{ minWidth: 600, width: '100%' }}>
                <Box component="thead">
                  <Box component="tr">
                    <Box component="th" sx={{ textAlign: 'left', pb: 1, pr: 2 }}>Applicant</Box>
                    <Box component="th" sx={{ textAlign: 'left', pb: 1, pr: 2 }}>Pet</Box>
                    <Box component="th" sx={{ textAlign: 'left', pb: 1, pr: 2 }}>Status</Box>
                  </Box>
                </Box>
                <Box component="tbody">
                  {applications.slice(0, 5).map((app) => (
                    <Box 
                      component="tr" 
                      key={app._id} 
                      sx={{ 
                        '&:hover': { backgroundColor: 'action.hover' },
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate(`/manager/adoption/applications/${app._id}`)}
                    >
                      <Box component="td" sx={{ py: 1, pr: 2 }}>
                        <Typography variant="body2">{app.userId?.name || 'Unknown'}</Typography>
                      </Box>
                      <Box component="td" sx={{ py: 1, pr: 2 }}>
                        <Typography variant="body2">{app.petId?.name || 'Unknown'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {app.petId?.breed}
                        </Typography>
                      </Box>
                      <Box component="td" sx={{ py: 1, pr: 2 }}>
                        <StatusChip status={app.status} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              No applications yet
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Store Setup Dialog */}
      <Dialog open={storeDialogOpen} onClose={() => setStoreDialogOpen(false)}>
        <DialogTitle>Set Store Identity</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Store Name"
            fullWidth
            value={storeNameInput}
            onChange={(e) => setStoreNameInput(e.target.value)}
            helperText="Enter a name for your adoption center"
          />
          <TextField
            margin="dense"
            label="Pincode"
            fullWidth
            value={pincodeInput}
            onChange={(e) => setPincodeInput(e.target.value)}
            helperText="Enter your store's pincode"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStoreDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={async () => {
              try {
                await authAPI.updateProfile({
                  storeName: storeNameInput,
                  pincode: pincodeInput
                });
                dispatch({
                  type: 'UPDATE_USER',
                  payload: {
                    ...user,
                    storeName: storeNameInput,
                    pincode: pincodeInput
                  }
                });
                setStoreDialogOpen(false);
              } catch (error) {
                console.error('Error updating store info:', error);
              }
            }}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdoptionManagerDashboard;