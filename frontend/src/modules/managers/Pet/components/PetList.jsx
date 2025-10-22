import React from 'react';
import { 
  Grid, 
  Typography, 
  Alert, 
  CircularProgress, 
  Box,
  Pagination,
  Stack
} from '@mui/material';
import PetCard from './PetCard';

const PetList = ({ 
  pets, 
  loading, 
  error, 
  onEdit, 
  onDelete, 
  onView,
  pagination,
  onPageChange
}) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!pets || pets.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No pets found. Try adjusting your search criteria.
      </Alert>
    );
  }

  return (
    <>
      <Grid container spacing={3}>
        {pets.map((pet) => (
          <Grid item xs={12} sm={6} md={4} key={pet._id}>
            <PetCard 
              pet={pet} 
              onEdit={onEdit} 
              onDelete={onDelete} 
              onView={onView} 
            />
          </Grid>
        ))}
      </Grid>
      
      {pagination && (
        <Stack spacing={2} alignItems="center" sx={{ mt: 4 }}>
          <Pagination 
            count={pagination.pages} 
            page={pagination.current} 
            onChange={(event, page) => onPageChange(page)}
            color="primary"
            showFirstButton
            showLastButton
          />
          <Typography variant="body2" color="text.secondary">
            Page {pagination.current} of {pagination.pages} • Total {pagination.total} pets
          </Typography>
        </Stack>
      )}
    </>
  );
};

export default PetList;