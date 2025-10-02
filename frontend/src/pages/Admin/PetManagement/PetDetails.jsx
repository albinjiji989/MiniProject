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
  Palette
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { petsAPI, medicalRecordsAPI, ownershipHistoryAPI } from '../../../services/petSystemAPI';

const PetDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [pet, setPet] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [ownershipHistory, setOwnershipHistory] = useState([]);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    loadPetData();
  }, [id]);

  const loadPetData = async () => {
    setLoading(true);
    try {
      const [petRes, medicalRes, ownershipRes] = await Promise.all([
        petsAPI.getById(id),
        medicalRecordsAPI.getByPet(id),
        ownershipHistoryAPI.getByPet(id)
      ]);

      setPet(petRes.data?.data || petRes.data);
      setMedicalRecords(medicalRes.data?.data || medicalRes.data || []);
      setOwnershipHistory(ownershipRes.data?.data || ownershipRes.data || []);
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
      fostered: 'warning',
      medical: 'error',
      deceased: 'default'
    };
    return colors[status] || 'default';
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
                    {pet.weightKg ? `${pet.weightKg} kg` : 'N/A'}
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
                    {pet.temperament || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Special Needs
                  </Typography>
                  <Typography variant="body1">
                    {pet.specialNeeds || 'None'}
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
              
              {medicalRecords.length > 0 ? (
                <List dense>
                  {medicalRecords.slice(0, 3).map((record) => (
                    <ListItem key={record._id}>
                      <ListItemIcon>
                        <LocalHospital color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={record.recordType}
                        secondary={`${formatDate(record.date)} - ${record.description}`}
                      />
                    </ListItem>
                  ))}
                  {medicalRecords.length > 3 && (
                    <ListItem>
                      <ListItemText
                        primary={`+${medicalRecords.length - 3} more records`}
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
              
              {ownershipHistory.length > 0 ? (
                <List dense>
                  {ownershipHistory.slice(0, 5).map((history) => (
                    <ListItem key={history._id}>
                      <ListItemIcon>
                        <History color="secondary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Transfer on ${formatDate(history.transferDate)}`}
                        secondary={`Reason: ${history.reason}`}
                      />
                    </ListItem>
                  ))}
                  {ownershipHistory.length > 5 && (
                    <ListItem>
                      <ListItemText
                        primary={`+${ownershipHistory.length - 5} more transfers`}
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