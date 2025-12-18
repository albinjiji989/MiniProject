import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  LocalHospital,
  History,
  Pets,
  LocationOn,
  AttachMoney,
  CalendarToday,
  Scale,
  Palette,
  Source as SourceIcon,
  Person as PersonIcon,
  Store as StoreIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../services/api';

const PetRegistryDetails = () => {
  const navigate = useNavigate();
  const { petCode } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [pet, setPet] = useState(null);
  const [registry, setRegistry] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPetData();
  }, [petCode]);

  const loadPetData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/pet-registry/${petCode}`);
      const data = response.data?.data || {};
      
      setRegistry(data.registry);
      setPet(data.details);
    } catch (err) {
      setError('Failed to load pet data');
      console.error('Error loading pet data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'success',
      adopted: 'primary',
      sold: 'info',
      fostered: 'warning',
      medical: 'error',
      deceased: 'default'
    };
    return colors[status] || 'default';
  };

  const getSourceColor = (source) => {
    const colors = {
      petshop: 'primary',
      adoption: 'secondary',
      user: 'success'
    };
    return colors[source] || 'default';
  };

  const getLocationColor = (location) => {
    const colors = {
      'at_petshop': 'primary',
      'at_adoption_center': 'secondary',
      'at_owner': 'success',
      'in_hospital': 'error',
      'in_temporary_care': 'warning'
    };
    return colors[location] || 'default';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!registry) {
    return (
      <Alert severity="error">
        Pet not found in registry
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Pet Registry Details - {registry.name}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            onClick={loadPetData}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Registry Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Pets sx={{ mr: 1, verticalAlign: 'middle' }} />
                Registry Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Pet Code
                  </Typography>
                  <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                    {registry.petCode}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Name
                  </Typography>
                  <Typography variant="h6">
                    {registry.name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Source
                  </Typography>
                  <Chip
                    label={registry.sourceLabel || registry.source}
                    color={getSourceColor(registry.source)}
                    size="small"
                    icon={<SourceIcon />}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    First Added
                  </Typography>
                  <Typography variant="body1">
                    {registry.firstAddedAt ? formatDate(registry.firstAddedAt) : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    First Added By
                  </Typography>
                  <Typography variant="body1">
                    {registry.firstAddedBy?.name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    First Added Source
                  </Typography>
                  <Typography variant="body1">
                    {registry.firstAddedSource?.replace(/_/g, ' ') || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
                Current Status
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Location
                  </Typography>
                  <Chip
                    label={registry.currentLocation?.replace(/_/g, ' ') || 'N/A'}
                    color={getLocationColor(registry.currentLocation)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Status
                  </Typography>
                  <Chip
                    label={registry.currentStatus || 'N/A'}
                    color={getStatusColor(registry.currentStatus)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Owner
                  </Typography>
                  <Typography variant="body1">
                    {registry.currentOwnerId?.name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Last Seen
                  </Typography>
                  <Typography variant="body1">
                    {registry.lastSeenAt ? formatDate(registry.lastSeenAt) : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Last Transfer
                  </Typography>
                  <Typography variant="body1">
                    {registry.lastTransferAt ? formatDate(registry.lastTransferAt) : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Physical Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Scale sx={{ mr: 1, verticalAlign: 'middle' }} />
                Physical Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    <Palette sx={{ fontSize: 16, mr: 0.5 }} />
                    Color
                  </Typography>
                  <Typography variant="body1">
                    {registry.color || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Gender
                  </Typography>
                  <Typography variant="body1">
                    {registry.gender || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Age
                  </Typography>
                  <Typography variant="body1">
                    {registry.age} {registry.ageUnit}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Species
                  </Typography>
                  <Typography variant="body1">
                    {registry.species?.displayName || registry.species?.name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Breed
                  </Typography>
                  <Typography variant="body1">
                    {registry.breed?.name || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Source-Specific Details */}
        {pet && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {registry.source === 'petshop' && <StoreIcon sx={{ mr: 1, verticalAlign: 'middle' }} />}
                  {registry.source === 'adoption' && <Pets sx={{ mr: 1, verticalAlign: 'middle' }} />}
                  {registry.source === 'user' && <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />}
                  Source Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {registry.source === 'petshop' && pet && (
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Store Name
                      </Typography>
                      <Typography variant="body1">
                        {pet.storeName || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Price
                      </Typography>
                      <Typography variant="body1">
                        {pet.price ? `$${pet.price}` : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Status
                      </Typography>
                      <Typography variant="body1">
                        {pet.status || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Available
                      </Typography>
                      <Typography variant="body1">
                        {pet.isAvailable ? 'Yes' : 'No'}
                      </Typography>
                    </Grid>
                  </Grid>
                )}

                {registry.source === 'adoption' && pet && (
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Adoption Fee
                      </Typography>
                      <Typography variant="body1">
                        {pet.adoptionFee ? `$${pet.adoptionFee}` : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Status
                      </Typography>
                      <Typography variant="body1">
                        {pet.status || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Adopter
                      </Typography>
                      <Typography variant="body1">
                        {pet.adopterUserId?.name || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                )}

                {registry.source === 'user' && pet && (
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Owner
                      </Typography>
                      <Typography variant="body1">
                        {pet.ownerId?.name || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Status
                      </Typography>
                      <Typography variant="body1">
                        {pet.currentStatus || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Ownership History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  <History sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Ownership History
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {registry.ownershipHistory && registry.ownershipHistory.length > 0 ? (
                <List dense>
                  {registry.ownershipHistory.slice(0, 5).map((history) => (
                    <ListItem key={history._id}>
                      <ListItemIcon>
                        <History color="secondary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${history.transferType} on ${formatDate(history.transferDate)}`}
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              {history.newOwnerId?.name || 'Unknown'} 
                              {history.previousOwnerId && ` ← ${history.previousOwnerId.name || 'Unknown'}`}
                            </Typography>
                            {history.transferReason && (
                              <Typography variant="body2" component="div" color="textSecondary">
                                Reason: {history.transferReason}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                  {registry.ownershipHistory.length > 5 && (
                    <ListItem>
                      <ListItemText
                        primary={`+${registry.ownershipHistory.length - 5} more transfers`}
                        sx={{ fontStyle: 'italic' }}
                      />
                    </ListItem>
                  )}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No ownership history available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PetRegistryDetails;