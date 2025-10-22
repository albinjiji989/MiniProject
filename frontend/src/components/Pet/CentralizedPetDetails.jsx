import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Chip, Card, CardContent, Grid, Button, CircularProgress } from '@mui/material';
import { apiClient } from '../../services/api';

const CentralizedPetDetails = () => {
  const { petCode } = useParams();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPet = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/pets/centralized/${petCode}`);
        setPet(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching pet details');
      } finally {
        setLoading(false);
      }
    };

    if (petCode) {
      fetchPet();
    }
  }, [petCode]);

  const getSourceLabel = (source) => {
    switch (source) {
      case 'core': return 'User Added';
      case 'adoption': return 'Adoption';
      case 'petshop': return 'Pet Shop';
      default: return source;
    }
  };

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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
        <Button onClick={() => window.history.back()} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  if (!pet) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Pet not found</Typography>
        <Button onClick={() => window.history.back()} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Button onClick={() => window.history.back()} sx={{ mb: 2 }}>
        ← Back to Registry
      </Button>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Typography variant="h4">
              {pet.name || 'Unnamed Pet'}
            </Typography>
            <Box>
              <Chip 
                label={getSourceLabel(pet.source)} 
                color={getSourceColor(pet.source)} 
                sx={{ mr: 1 }}
              />
              <Chip 
                label={pet.currentStatus} 
                color={getStatusColor(pet.currentStatus)} 
              />
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" sx={{ mb: 2 }}>Basic Information</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Pet Code</Typography>
                  <Typography>{pet.petCode}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Current Location</Typography>
                  <Typography>{pet.currentLocation}</Typography>
                </Grid>
                
                {pet.species && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Species</Typography>
                    <Typography>{pet.species.name}</Typography>
                  </Grid>
                )}
                
                {pet.breed && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Breed</Typography>
                    <Typography>{pet.breed.name}</Typography>
                  </Grid>
                )}
                
                {pet.currentOwnerId && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Current Owner</Typography>
                    <Typography>{pet.currentOwnerId.name}</Typography>
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                  <Typography>
                    {new Date(pet.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
                  <Typography>
                    {new Date(pet.updatedAt).toLocaleDateString()}
                  </Typography>
                </Grid>
                
                {pet.lastTransferAt && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Last Transfer</Typography>
                    <Typography>
                      {new Date(pet.lastTransferAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 2 }}>Source Data</Typography>
              
              {pet.sourceData ? (
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Source: {getSourceLabel(pet.source)}
                  </Typography>
                  
                  {pet.sourceData.age && (
                    <Typography variant="body2">
                      Age: {pet.sourceData.age} {pet.sourceData.ageUnit}
                    </Typography>
                  )}
                  
                  {pet.sourceData.gender && (
                    <Typography variant="body2">
                      Gender: {pet.sourceData.gender}
                    </Typography>
                  )}
                  
                  {pet.sourceData.color && (
                    <Typography variant="body2">
                      Color: {pet.sourceData.color}
                    </Typography>
                  )}
                  
                  {pet.sourceData.healthStatus && (
                    <Typography variant="body2">
                      Health Status: {pet.sourceData.healthStatus}
                    </Typography>
                  )}
                  
                  {pet.sourceData.description && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Description: {pet.sourceData.description}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No additional source data available
                </Typography>
              )}
            </Grid>

            {pet.images && pet.images.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>Images</Typography>
                <Grid container spacing={2}>
                  {pet.images.map((image, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                      <img 
                        src={image.url} 
                        alt={`${pet.name} ${index + 1}`} 
                        style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 4 }}
                        onError={(e) => {
                          e.target.src = '/placeholder-pet.svg';
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CentralizedPetDetails;