import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../services/api';
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
  Stack
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
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState([]);
  const [applications, setApplications] = useState([]);
  const [reports, setReports] = useState(null);

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
    return () => abort.abort();
  }, []);

  const fetchData = async (signal) => {
    try {
      setLoading(true);
      const reqs = [
        apiClient.get('/adoption/manager/pets', { params: { page: 1, limit: 12, fields: 'name,breed,species,status,ageDisplay', lean: true }, signal }),
        apiClient.get('/adoption/manager/applications', { params: { page: 1, limit: 12, fields: 'status,userId.name,petId.name,petId.breed', lean: true }, signal }),
        apiClient.get('/adoption/manager/reports', { signal })
      ];
      const [p, a, r] = await Promise.allSettled(reqs);

      if (p.status === 'fulfilled') {
        const raw = p.value.data?.data?.pets || [];
        // Minimal projection client-side as well, just in case backend ignores fields
        const minimal = raw.map(x => ({
          _id: x._id,
          name: x.name,
          breed: x.breed,
          species: x.species,
          status: x.status,
          ageDisplay: x.ageDisplay,
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

      {/* Recent Pets & Applications */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>Recent Pets</Typography>
                <Button size="small" onClick={() => navigate('/manager/adoption/pets')}>View all</Button>
              </Box>
              <Divider sx={{ mb: 1 }} />
              <Stack spacing={1}>
                {(pets.slice(0, 5)).map(p => (
                  <Box key={p._id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{p.breed} • {p.species}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <StatusChip status={p.status} />
                      <IconButton size="small" onClick={() => navigate(`/manager/adoption/pets/${p._id}`)}><VisibilityIcon fontSize="inherit" /></IconButton>
                      <IconButton size="small" onClick={() => navigate(`/manager/adoption/pets/${p._id}/edit`)}><EditIcon fontSize="inherit" /></IconButton>
                    </Stack>
                  </Box>
                ))}
                {pets.length === 0 && (
                  <Typography variant="body2" color="text.secondary">No pets yet. Start by adding a new pet.</Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
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
    </Box>
  );
};

export default AdoptionManagerDashboard;
