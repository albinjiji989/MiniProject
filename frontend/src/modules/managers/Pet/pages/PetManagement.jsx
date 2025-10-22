import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { usePets, usePetActions, useOwnedPets } from '../hooks/usePets';
import PetList from '../components/PetList';
import PetForm from '../components/PetForm';

const PetManagement = () => {
  const [searchParams, setSearchParams] = useState({
    q: '',
    species: '',
    status: '',
    page: 1
  });
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [dialogError, setDialogError] = useState('');
  
  const { pets, loading, error, pagination } = usePets(searchParams);
  const { ownedPets, loading: ownedLoading } = useOwnedPets();
  const { createPet, loading: createLoading } = usePetActions();

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  const handleCreatePet = async (petData) => {
    try {
      setDialogError('');
      await createPet(petData);
      setShowCreateDialog(false);
    } catch (err) {
      setDialogError(err.message);
    }
  };

  const handleViewPet = (pet) => {
    // Navigate to pet details page
    window.location.hash = `/manager/pets/${pet._id}`;
  };

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          Pet Management
        </Typography>
        <Button 
          startIcon={<AddIcon />} 
          onClick={() => setShowCreateDialog(true)}
          variant="contained"
        >
          Add New Pet
        </Button>
      </Box>

      <Box component="form" onSubmit={handleSearch} sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search Pets"
              value={searchParams.q}
              onChange={(e) => setSearchParams(prev => ({ ...prev, q: e.target.value }))}
              placeholder="Name, breed, color..."
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Species</InputLabel>
              <Select
                value={searchParams.species}
                onChange={(e) => setSearchParams(prev => ({ ...prev, species: e.target.value }))}
                label="Species"
              >
                <MenuItem value="">All Species</MenuItem>
                <MenuItem value="dog">Dog</MenuItem>
                <MenuItem value="cat">Cat</MenuItem>
                <MenuItem value="bird">Bird</MenuItem>
                <MenuItem value="rabbit">Rabbit</MenuItem>
                <MenuItem value="hamster">Hamster</MenuItem>
                <MenuItem value="fish">Fish</MenuItem>
                <MenuItem value="reptile">Reptile</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={searchParams.status}
                onChange={(e) => setSearchParams(prev => ({ ...prev, status: e.target.value }))}
                label="Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="Available">Available</MenuItem>
                <MenuItem value="Adopted">Adopted</MenuItem>
                <MenuItem value="Reserved">Reserved</MenuItem>
                <MenuItem value="Under Treatment">Under Treatment</MenuItem>
                <MenuItem value="Deceased">Deceased</MenuItem>
                <MenuItem value="Fostered">Fostered</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button 
              fullWidth 
              type="submit" 
              variant="contained" 
              startIcon={<SearchIcon />}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Box>

      {ownedLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Your Pets ({ownedPets?.length || 0})
          </Typography>
          <PetList 
            pets={ownedPets?.slice(0, 3) || []} 
            loading={ownedLoading}
            onView={handleViewPet}
          />
        </Box>
      )}

      <Typography variant="h6" sx={{ mb: 2 }}>
        All Pets
      </Typography>
      <PetList 
        pets={pets} 
        loading={loading} 
        error={error}
        onView={handleViewPet}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      <Dialog 
        open={showCreateDialog} 
        onClose={() => setShowCreateDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Add New Pet</DialogTitle>
        <DialogContent>
          {dialogError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {dialogError}
            </Alert>
          )}
          <PetForm 
            onSubmit={handleCreatePet} 
            onCancel={() => setShowCreateDialog(false)}
            loading={createLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PetManagement;