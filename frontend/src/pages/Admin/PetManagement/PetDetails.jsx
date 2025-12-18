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
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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
import { petsAPI } from '../../../services/petSystemAPI';
import { api } from '../../../services/api';

const PetDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [pet, setPet] = useState(null);
  const [registry, setRegistry] = useState(null);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    loadPetData();
  }, [id]);

  const loadPetData = async () => {
    setLoading(true);
    try {
      // First get the pet details
      const petRes = await petsAPI.getById(id);
      const petData = petRes.data?.data || petRes.data;
      setPet(petData);
      
      // If pet has a petCode, also get registry details
      if (petData.petCode) {
        try {
          const registryRes = await api.get(`/admin/pet-registry/${petData.petCode}`);
          const registryData = registryRes.data?.data || {};
          setRegistry(registryData.registry);
        } catch (registryErr) {
          console.warn('Could not load registry data:', registryErr);
        }
      }
    } catch (err) {
      setError('Failed to load pet data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await petsAPI.delete(id);
      navigate('/admin/pets');
    } catch (err) {
      setError('Failed to delete pet');
    }
    setDeleteDialog(false);
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

  if (!pet) {
    return (
      <Alert severity="error">
        Pet not found
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Pet Details - {pet.name}
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => navigate(`/admin/pets/edit/${id}`)}
            sx={{ mr: 1 }}
          >
            Edit Pet
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={() => setDeleteDialog(true)}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Pets sx={{ mr: 1, verticalAlign: 'middle' }} />
                Basic Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Pet ID
                  </Typography>
                  <Typography variant="h6">
                    #{pet.petId}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Pet Code
                  </Typography>
                  <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                    {pet.petCode || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Name
                  </Typography>
                  <Typography variant="body1">
                    {pet.name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Gender
                  </Typography>
                  <Typography variant="body1">
                    {pet.gender}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Species
                  </Typography>
                  <Typography variant="body1">
                    {pet.speciesId?.name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Breed
                  </Typography>
                  <Typography variant="body1">
                    {pet.breedId?.name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Date of Birth
                  </Typography>
                  <Typography variant="body1">
                    {pet.dateOfBirth ? formatDate(pet.dateOfBirth) : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Age
                  </Typography>
                  <Typography variant="body1">
                    {pet.age} {pet.ageUnit}
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
                    {pet.color || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Size
                  </Typography>
                  <Typography variant="body1">
                    {pet.size || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Weight
                  </Typography>
                  <Typography variant="body1">
                    {pet.weight?.value ? `${pet.weight.value} ${pet.weight.unit}` : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    <AttachMoney sx={{ fontSize: 16, mr: 0.5 }} />
                    Adoption Fee
                  </Typography>
                  <Typography variant="body1">
                    {pet.adoptionFee ? `$${pet.adoptionFee}` : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {pet.description || 'No description available'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Registry Information (if available) */}
        {registry && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <SourceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Registry Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Source
                    </Typography>
                    <Chip
                      label={registry.sourceLabel || registry.source}
                      color={getSourceColor(registry.source)}
                      size="small"
                    />
                  </Grid>
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
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => navigate(`/admin/pet-registry/${registry.petCode}`)}
                    >
                      View Full Registry Details
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Location & Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
                Location & Status
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Location
                  </Typography>
                  <Typography variant="body1">
                    {pet.location || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Store ID
                  </Typography>
                  <Typography variant="body1">
                    {pet.storeId || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Store Name
                  </Typography>
                  <Typography variant="body1">
                    {pet.storeName || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Temperament
                  </Typography>
                  <Typography variant="body1">
                    {pet.temperament?.join(', ') || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Special Needs
                  </Typography>
                  <Typography variant="body1">
                    {pet.specialNeeds?.join(', ') || 'None'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Medical Records */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  <LocalHospital sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Medical Records
                </Typography>
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={() => navigate(`/admin/pets/${id}/medical-records`)}
                >
                  Manage
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {pet.medicalHistory && pet.medicalHistory.length > 0 ? (
                <List dense>
                  {pet.medicalHistory.slice(0, 3).map((record) => (
                    <ListItem key={record._id}>
                      <ListItemIcon>
                        <LocalHospital color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={record.type}
                        secondary={`${formatDate(record.date)} - ${record.description}`}
                      />
                    </ListItem>
                  ))}
                  {pet.medicalHistory.length > 3 && (
                    <ListItem>
                      <ListItemText
                        primary={`+${pet.medicalHistory.length - 3} more records`}
                        sx={{ fontStyle: 'italic' }}
                      />
                    </ListItem>
                  )}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No medical records available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Ownership History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  <History sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Ownership History
                </Typography>
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={() => navigate(`/admin/pets/${id}/ownership-history`)}
                >
                  Manage
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {pet.ownershipHistory && pet.ownershipHistory.length > 0 ? (
                <List dense>
                  {pet.ownershipHistory.slice(0, 5).map((history) => (
                    <ListItem key={history._id}>
                      <ListItemIcon>
                        <History color="secondary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Transfer on ${formatDate(history.startDate)}`}
                        secondary={`Reason: ${history.reason}`}
                      />
                    </ListItem>
                  ))}
                  {pet.ownershipHistory.length > 5 && (
                    <ListItem>
                      <ListItemText
                        primary={`+${pet.ownershipHistory.length - 5} more transfers`}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Pet</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this pet? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PetDetails;