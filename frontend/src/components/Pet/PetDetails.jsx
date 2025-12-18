import React from 'react'
import { 
  Box, 
  Card, 
  CardContent, 
  CardHeader, 
  Chip, 
  Divider, 
  Grid, 
  Typography 
} from '@mui/material'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../services/api'

const PetDetails = ({ petId, variant = 'user' }) => {
  // If petId is not provided, get it from URL params
  const { id } = useParams()
  const effectivePetId = petId || id
  
  const { data: pet, isLoading, error } = useQuery({
    queryKey: ['pet', effectivePetId],
    queryFn: async () => {
      const response = await apiClient.get(`/pets/${effectivePetId}`)
      return response.data.data.pet
    },
    enabled: !!effectivePetId
  })
  
  if (isLoading) {
    return <Typography>Loading...</Typography>
  }
  
  if (error) {
    return <Typography color="error">Error loading pet details</Typography>
  }
  
  if (!pet) {
    return <Typography>Pet not found</Typography>
  }
  
  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title={pet.name}
              subheader={`Pet ID: ${pet.petId || pet.petCode}`}
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Species
                  </Typography>
                  <Typography variant="body1">
                    {pet.species?.name || pet.customBreedInfo?.species || 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Breed
                  </Typography>
                  <Typography variant="body1">
                    {pet.breed?.name || pet.customBreedInfo?.breed || 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Age
                  </Typography>
                  <Typography variant="body1">
                    {pet.age} {pet.ageUnit}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Gender
                  </Typography>
                  <Typography variant="body1">
                    {pet.gender}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Weight
                  </Typography>
                  <Typography variant="body1">
                    {pet.weight?.value} {pet.weight?.unit}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Color
                  </Typography>
                  <Typography variant="body1">
                    {pet.color}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Status
                  </Typography>
                  <Chip 
                    label={pet.currentStatus} 
                    color={
                      pet.currentStatus === 'Available' ? 'success' :
                      pet.currentStatus === 'Adopted' ? 'info' :
                      pet.currentStatus === 'Reserved' ? 'warning' : 'default'
                    }
                  />
                </Grid>
                {pet.temperament?.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Temperament
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {pet.temperament.map((trait, index) => (
                        <Chip 
                          key={index} 
                          label={trait} 
                          size="small" 
                          sx={{ mr: 1, mb: 1 }} 
                        />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
          
          {pet.medicalHistory?.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardHeader title="Medical History" />
              <Divider />
              <CardContent>
                {pet.medicalHistory.map((record, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">
                      {record.type} - {new Date(record.date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {record.description}
                    </Typography>
                    {record.veterinarian && (
                      <Typography variant="caption">
                        Veterinarian: {record.veterinarian}
                      </Typography>
                    )}
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Actions" />
            <Divider />
            <CardContent>
              {variant === 'manager' ? (
                <Box>
                  <Typography>Edit pet details</Typography>
                  <Typography>Update medical records</Typography>
                  <Typography>Manage ownership</Typography>
                </Box>
              ) : (
                <Box>
                  <Typography>Adopt this pet</Typography>
                  <Typography>Save to wishlist</Typography>
                  <Typography>Contact shelter</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default PetDetails