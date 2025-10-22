import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Chip, Button } from '@mui/material';
import { apiClient } from '../../../services/api';

const CentralizedPetDashboard = () => {
  const [stats, setStats] = useState({
    bySource: {},
    byStatus: {},
    byLocation: {}
  });
  const [recentPets, setRecentPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch statistics
        const statsResponse = await apiClient.get('/pets/centralized/stats/overview');
        setStats(statsResponse.data.data);
        
        // Fetch recent pets
        const recentResponse = await apiClient.get('/pets/centralized/recent/5');
        setRecentPets(recentResponse.data.data.pets || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getSourceColor = (source) => {
    switch (source) {
      case 'core': return 'success';
      case 'adoption': return 'primary';
      case 'petshop': return 'secondary';
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

  const getLocationColor = (location) => {
    switch (location) {
      case 'at_owner': return 'info';
      case 'at_adoption_center': return 'primary';
      case 'at_petshop': return 'secondary';
      case 'in_transit': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return <Typography>Loading dashboard...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Centralized Pet Dashboard</Typography>
      
      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>By Source</Typography>
              {Object.entries(stats.bySource).map(([source, count]) => (
                <Box key={source} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Chip 
                    label={source} 
                    color={getSourceColor(source)} 
                    size="small" 
                    variant="outlined"
                  />
                  <Typography>{count}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>By Status</Typography>
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <Box key={status} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Chip 
                    label={status} 
                    color={getStatusColor(status)} 
                    size="small" 
                    variant="outlined"
                  />
                  <Typography>{count}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>By Location</Typography>
              {Object.entries(stats.byLocation).map(([location, count]) => (
                <Box key={location} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Chip 
                    label={location} 
                    color={getLocationColor(location)} 
                    size="small" 
                    variant="outlined"
                  />
                  <Typography>{count}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Recent Pets */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Recently Registered Pets</Typography>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => window.location.href = '/admin/pets/centralized'}
            >
              View All
            </Button>
          </Box>
          
          {recentPets.length > 0 ? (
            <Grid container spacing={2}>
              {recentPets.map((pet) => (
                <Grid item xs={12} sm={6} md={4} key={pet.petCode}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1">
                          {pet.name || 'Unnamed Pet'}
                        </Typography>
                        <Chip 
                          label={pet.source} 
                          color={getSourceColor(pet.source)} 
                          size="small" 
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {pet.petCode}
                      </Typography>
                      
                      {pet.species && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {pet.species.name}
                        </Typography>
                      )}
                      
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip 
                          label={pet.currentStatus} 
                          color={getStatusColor(pet.currentStatus)} 
                          size="small" 
                          variant="outlined"
                        />
                        <Chip 
                          label={pet.currentLocation} 
                          color={getLocationColor(pet.currentLocation)} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography color="text.secondary">No recently registered pets</Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CentralizedPetDashboard;