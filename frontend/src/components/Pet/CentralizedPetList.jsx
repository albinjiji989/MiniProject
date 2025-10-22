import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, Chip, Button, TextField, Select, MenuItem, FormControl, InputLabel, Pagination, Stack } from '@mui/material';
import { apiClient } from '../../services/api';

const CentralizedPetList = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPets = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: search || undefined,
        source: sourceFilter || undefined,
        status: statusFilter || undefined
      };

      const response = await apiClient.get('/pets/centralized', { params });
      setPets(response.data.data.pets || []);
      setTotal(response.data.data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching pets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, [page, search, sourceFilter, statusFilter]);

  const getSourceColor = (source) => {
    switch (source) {
      case 'adoption': return 'primary';
      case 'petshop': return 'secondary';
      case 'core': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'adopted': return 'primary';
      case 'owned': return 'info';
      case 'sold': return 'warning';
      default: return 'default';
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return <Typography>Loading pets...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Centralized Pet Registry</Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
        />
        <FormControl size="small">
          <InputLabel>Source</InputLabel>
          <Select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            label="Source"
          >
            <MenuItem value="">All Sources</MenuItem>
            <MenuItem value="core">User Added</MenuItem>
            <MenuItem value="adoption">Adoption</MenuItem>
            <MenuItem value="petshop">Pet Shop</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="available">Available</MenuItem>
            <MenuItem value="adopted">Adopted</MenuItem>
            <MenuItem value="owned">Owned</MenuItem>
            <MenuItem value="sold">Sold</MenuItem>
            <MenuItem value="at_owner">At Owner</MenuItem>
            <MenuItem value="at_adoption_center">At Adoption Center</MenuItem>
            <MenuItem value="at_petshop">At Pet Shop</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Pet Grid */}
      <Grid container spacing={3}>
        {pets.map((pet) => (
          <Grid item xs={12} sm={6} md={4} key={pet.petCode}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="div">
                    {pet.name || 'Unnamed Pet'}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip 
                      label={pet.source} 
                      color={getSourceColor(pet.source)} 
                      size="small" 
                      variant="outlined"
                    />
                    <Chip 
                      label={pet.currentStatus} 
                      color={getStatusColor(pet.currentStatus)} 
                      size="small" 
                      variant="outlined"
                    />
                  </Stack>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Code: {pet.petCode}
                </Typography>
                
                {pet.species && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Species: {pet.species.name}
                  </Typography>
                )}
                
                {pet.breed && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Breed: {pet.breed.name}
                  </Typography>
                )}
                
                {pet.currentOwnerId && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Owner: {pet.currentOwnerId.name}
                  </Typography>
                )}
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Location: {pet.currentLocation}
                </Typography>
                
                {pet.images && pet.images.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <img 
                      src={pet.images[0].url} 
                      alt={pet.name} 
                      style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 4 }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </Box>
                )}
              </CardContent>
              
              <Box sx={{ p: 2, pt: 0 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  fullWidth
                  onClick={() => window.location.href = `/pets/centralized/${pet.petCode}`}
                >
                  View Details
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {pets.length === 0 && !loading && (
        <Typography sx={{ textAlign: 'center', py: 4 }}>
          No pets found
        </Typography>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(event, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default CentralizedPetList;