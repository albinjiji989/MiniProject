import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../../../services/api';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CircularProgress, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  FormControl, 
  Grid, 
  IconButton, 
  InputLabel, 
  MenuItem, 
  Select, 
  TextField, 
  Typography 
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  CloudUpload as CloudUploadIcon, 
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const PostImportProcessing = () => {
  const navigate = useNavigate();
  const { importId } = useParams();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPet, setSelectedPet] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    adoptionFee: '',
    status: 'available'
  });

  // Fetch imported pets
  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/adoption/manager/pets?status=processing');
        setPets(response.data.data.pets || []);
      } catch (err) {
        setError('Failed to fetch imported pets: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, []);

  const handleProcessPet = (pet) => {
    setSelectedPet(pet);
    setFormData({
      adoptionFee: pet.adoptionFee || '',
      status: pet.status || 'available'
    });
    setDialogOpen(true);
  };

  const handleSavePet = async () => {
    if (!selectedPet) return;

    try {
      setSaving(true);
      const updateData = {
        adoptionFee: parseFloat(formData.adoptionFee) || 0,
        status: formData.status
      };

      await apiClient.put(`/adoption/manager/pets/${selectedPet._id}`, updateData);
      
      // Update local state
      setPets(pets.map(pet => 
        pet._id === selectedPet._id 
          ? { ...pet, ...updateData, status: updateData.status }
          : pet
      ));
      
      setSuccess('Pet updated successfully!');
      setDialogOpen(false);
      setSelectedPet(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update pet: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (petId, file, type) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const endpoint = type === 'image' 
        ? '/adoption/manager/pets/upload' 
        : '/adoption/manager/pets/upload-document';
      
      await apiClient.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Refresh pet data
      const response = await apiClient.get('/adoption/manager/pets?status=processing');
      setPets(response.data.data.pets || []);
      
      setSuccess(`${type === 'image' ? 'Image' : 'Document'} uploaded successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to upload ${type}: ` + (err.response?.data?.message || err.message));
    }
  };

  const handleFileInputChange = (event, petId, type) => {
    const file = event.target.files[0];
    if (file) {
      handleFileUpload(petId, file, type);
    }
  };

  const renderPetCard = (pet) => {
    const hasImages = pet.images && pet.images.length > 0;
    const hasDocuments = pet.documents && pet.documents.length > 0;
    const isComplete = hasImages && pet.adoptionFee > 0 && pet.status === 'available';

    return (
      <Card key={pet._id} sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6">{pet.name || 'Unnamed Pet'}</Typography>
              <Typography variant="body2" color="textSecondary">
                {pet.breed}, {pet.species}, {pet.category}
              </Typography>
              <Typography variant="body2">
                Gender: {pet.gender} | Age: {pet.age} {pet.ageUnit} | Weight: {pet.weight} kg
              </Typography>
              <Typography variant="body2">
                Vaccination Status: {pet.vaccinationStatus}
              </Typography>
              {pet.adoptionFee > 0 && (
                <Typography variant="body2">
                  Adoption Fee: ₹{pet.adoptionFee}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {isComplete ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
                    <CheckCircleIcon sx={{ mr: 1 }} />
                    <Typography variant="body2">Ready for Adoption</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'warning.main' }}>
                    <WarningIcon sx={{ mr: 1 }} />
                    <Typography variant="body2">Needs Processing</Typography>
                  </Box>
                )}
                
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => handleProcessPet(pet)}
                >
                  {isComplete ? 'Edit Details' : 'Process Pet'}
                </Button>
                
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button
                    component="label"
                    variant="outlined"
                    size="small"
                    startIcon={<CloudUploadIcon />}
                  >
                    Upload Image
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleFileInputChange(e, pet._id, 'image')}
                    />
                  </Button>
                  
                  <Button
                    component="label"
                    variant="outlined"
                    size="small"
                    startIcon={<CloudUploadIcon />}
                  >
                    Upload Document
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileInputChange(e, pet._id, 'document')}
                    />
                  </Button>
                </Box>
                
                {hasImages && (
                  <Typography variant="caption" color="success.main">
                    {pet.images.length} image(s) uploaded
                  </Typography>
                )}
                
                {hasDocuments && (
                  <Typography variant="caption" color="success.main">
                    {pet.documents.length} document(s) uploaded
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Post-Import Processing
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3 }}>
        Process your imported pets by uploading images/documents, setting adoption fees, and making them available for adoption.
      </Typography>
      
      {error && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
          {error}
        </Box>
      )}
      
      {success && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 1 }}>
          {success}
        </Box>
      )}
      
      {pets.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h6" color="textSecondary">
            No pets need processing
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            All your imported pets have been processed and are ready for adoption.
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }}
            onClick={() => navigate('/manager/adoption/pets')}
          >
            View All Pets
          </Button>
        </Box>
      ) : (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Pets Needing Processing ({pets.length})
          </Typography>
          
          {pets.map(renderPetCard)}
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              variant="outlined"
              onClick={() => navigate('/manager/adoption/import')}
            >
              Back to Import
            </Button>
            
            <Button 
              variant="contained"
              onClick={() => navigate('/manager/adoption/pets')}
            >
              View All Pets
            </Button>
          </Box>
        </>
      )}
      
      {/* Process Pet Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedPet ? `${selectedPet.name || 'Unnamed Pet'} - Process Details` : 'Process Pet'}
        </DialogTitle>
        
        <DialogContent>
          {selectedPet && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Adoption Fee (₹)"
                    type="number"
                    value={formData.adoptionFee}
                    onChange={(e) => setFormData({...formData, adoptionFee: e.target.value})}
                    InputProps={{
                      inputProps: { min: 0, step: 100 }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      label="Status"
                    >
                      <MenuItem value="available">Available for Adoption</MenuItem>
                      <MenuItem value="processing">Still Processing</MenuItem>
                      <MenuItem value="reserved">Reserved</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSavePet} 
            variant="contained" 
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PostImportProcessing;