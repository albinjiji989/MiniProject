import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Chip, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  ArrowBack as BackIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { usePet, usePetActions } from '../hooks/usePets';
import PetForm from '../components/PetForm';
import { 
  formatPetAge, 
  formatPetGender, 
  formatPetWeight, 
  formatPetSize,
  formatPetLocation
} from '../utils/petUtils';

const PetDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { pet, loading, error } = usePet(id);
  const { updatePet, loading: updateLoading, error: updateError } = usePetActions();
  const [editMode, setEditMode] = useState(false);

  const handleBack = () => {
    navigate('/manager/pets');
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
  };

  const handleSubmitEdit = async (petData) => {
    try {
      await updatePet(id, petData);
      setEditMode(false);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Box sx={{ mt: 2 }}>
          <Button startIcon={<BackIcon />} onClick={handleBack}>
            Back to Pets
          </Button>
        </Box>
      </Container>
    );
  }

  if (!pet) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning">Pet not found</Alert>
        <Box sx={{ mt: 2 }}>
          <Button startIcon={<BackIcon />} onClick={handleBack}>
            Back to Pets
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button startIcon={<BackIcon />} onClick={handleBack}>
          Back to Pets
        </Button>
        {!editMode && (
          <Button startIcon={<EditIcon />} onClick={handleEdit} variant="contained">
            Edit Pet
          </Button>
        )}
      </Box>

      {editMode ? (
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Edit Pet
            </Typography>
            <PetForm 
              pet={pet} 
              onSubmit={handleSubmitEdit} 
              onCancel={handleCancelEdit}
              loading={updateLoading}
              error={updateError}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                {pet.name}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mt: 2 }}>Basic Information</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography><strong>Species:</strong> {pet.species?.name || pet.species || 'Unknown'}</Typography>
                    <Typography><strong>Breed:</strong> {pet.breed?.name || pet.breed || 'Unknown'}</Typography>
                    <Typography><strong>Gender:</strong> {formatPetGender(pet.gender)}</Typography>
                    <Typography><strong>Age:</strong> {formatPetAge(pet.age, pet.ageUnit)}</Typography>
                    <Typography><strong>Color:</strong> {pet.color || 'Not specified'}</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mt: 2 }}>Physical Details</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography><strong>Weight:</strong> {formatPetWeight(pet.weight)}</Typography>
                    <Typography><strong>Size:</strong> {formatPetSize(pet.size)}</Typography>
                    <Typography><strong>Status:</strong> 
                      <Chip 
                        label={pet.currentStatus || 'Unknown'} 
                        size="small" 
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                    <Typography><strong>Health:</strong> 
                      <Chip 
                        label={pet.healthStatus || 'Unknown'} 
                        size="small" 
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2 }}>Description</Typography>
                  <Typography sx={{ mt: 1 }}>
                    {pet.description || 'No description provided'}
                  </Typography>
                </Grid>
                
                {pet.location && (
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mt: 2 }}>Location</Typography>
                    <Typography sx={{ mt: 1 }}>
                      {formatPetLocation(pet.location)}
                    </Typography>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2 }}>System Information</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography><strong>Pet Code:</strong> {pet.petCode || 'Not assigned'}</Typography>
                    <Typography><strong>Pet ID:</strong> {pet.petId || 'Not assigned'}</Typography>
                    <Typography><strong>Created:</strong> {pet.createdAt ? new Date(pet.createdAt).toLocaleDateString() : 'Unknown'}</Typography>
                    <Typography><strong>Last Updated:</strong> {pet.updatedAt ? new Date(pet.updatedAt).toLocaleDateString() : 'Unknown'}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </>
      )}
    </Container>
  );
};

export default PetDetails;