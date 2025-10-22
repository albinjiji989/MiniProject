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
                <Typography variant="caption" color="text.secondary">Total Revenue</Typography>
                <Typography variant="h5" fontWeight={700}>₹{kpis.revenue}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Quick Actions</Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button variant="outlined" onClick={() => navigate('/manager/adoption/pets')}>Manage Pets</Button>
            <Button variant="outlined" onClick={() => navigate('/manager/adoption/applications')}>View Applications</Button>
            <Button variant="outlined" onClick={() => navigate('/manager/adoption/reports')}>Reports</Button>
            <Button variant="outlined" onClick={() => navigate('/manager/adoption/import')}>Import CSV</Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Recent Pets - Grid View with Images */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>Recent Pets</Typography>
          <Button size="small" onClick={() => navigate('/manager/adoption/pets')}>View all pets</Button>
        </Box>
        <Grid container spacing={2}>
          {pets.slice(0, 6).map(p => {
            const getFirstImageUrl = (pet) => {
              const images = pet?.images || [];
              if (!images || images.length === 0) return '';
              
              // Handle different image object structures
              const firstImage = images[0];
              let url = '';
              
              if (typeof firstImage === 'string') {
                url = firstImage;
              } else if (firstImage && typeof firstImage === 'object') {
                // Handle populated image object from backend
                if (firstImage.url) {
                  url = firstImage.url;
                } else if (firstImage._id && firstImage.entityType) {
                  // This is a full Image model object
                  url = firstImage.url || '';
                }
              }
              
              if (!url) return '';
              
              // Handle different URL types
              if (String(url).startsWith('data:')) return url; // render data URL directly
              if (String(url).startsWith('blob:')) return ''; // skip blob URLs
              
              return url; // Return raw URL, will be resolved by resolveMediaUrl below
            };
            
            const imageUrl = getFirstImageUrl(p);
            const resolvedImageUrl = imageUrl ? resolveMediaUrl(imageUrl) : null;
            
            return (
              <Grid item xs={12} sm={6} md={4} lg={2} key={p._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 } }}>
                  <Box sx={{ position: 'relative', width: '100%', height: 140, bgcolor: 'grey.100', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {resolvedImageUrl ? (
                      <img loading="lazy" src={resolvedImageUrl} alt={p.name || 'Pet'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { 
                        console.log('Dashboard image load error for:', resolvedImageUrl);
                        e.currentTarget.src = '/placeholder-pet.svg' 
                      }} />
                    ) : (
                      <Typography variant="caption" color="text.secondary">No image</Typography>
                    )}
                  </Box>
                  <CardContent sx={{ flex: 1, pb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap>{p.name || 'No name'}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{p.breed}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{p.species}</Typography>
                    <StatusChip status={p.status} />
                  </CardContent>
                  <Stack direction="row" spacing={0.5} sx={{ p: 1 }}>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/manager/adoption/pets/${p._id}`); }} title="View">
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/manager/adoption/pets/${p._id}/edit`); }} title="Edit">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Card>
              </Grid>
            );
          })}
          {pets.length === 0 && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">No pets yet. <Button size="small" onClick={() => navigate('/manager/adoption/wizard/start')}>Add a new pet</Button></Typography>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Recent Applications */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>Recent Applications</Typography>
                <Button size="small" onClick={() => navigate('/manager/adoption/applications')}>View all</Button>
              </Box>
              <Divider sx={{ mb: 1 }} />
              <Stack spacing={1}>
                {(applications.slice(0, 5)).map(a => (
                  <Box key={a._id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{a.userId?.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{a.petId?.name} • {a.petId?.breed}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <StatusChip status={a.status} />
                      <Button size="small" onClick={() => navigate(`/manager/adoption/applications/${a._id}`)}>Open</Button>
                    </Stack>
                  </Box>
                ))}
                {applications.length === 0 && (
                  <Typography variant="body2" color="text.secondary">No applications yet.</Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Set Store Name Dialog */}
      <Dialog open={storeDialogOpen} onClose={() => setStoreDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Set Your Store Name</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Store ID: <strong>{user?.storeId || 'Pending assignment'}</strong>
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Store Name"
            placeholder="e.g., Happy Paws Adoption Center"
            value={storeNameInput}
            onChange={(e) => setStoreNameInput(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Pincode (Optional)"
            placeholder="e.g., 123456"
            value={pincodeInput}
            onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputProps={{ maxLength: 6 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStoreDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={async () => {
              const name = storeNameInput.trim()
              if (!name) return
              // Prepare data for update
              const updateData = { storeName: name }
              if (pincodeInput && pincodeInput.length === 6) {
                updateData.pincode = pincodeInput
              }
              // Use the authAPI to update user profile directly
              try {
                await authAPI.updateProfile(updateData)
                // Refresh the user data from the backend to get updated store info
                const res = await authAPI.getMe()
                if (res?.data?.data?.user) {
                  // Update the AuthContext with fresh user data
                  dispatch({
                    type: 'UPDATE_USER',
                    payload: res.data.data.user
                  })
                }
                setStoreDialogOpen(false)
              } catch (error) {
                console.error('Error updating store info:', error)
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdoptionManagerDashboard;