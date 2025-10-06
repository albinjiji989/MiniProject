import React from 'react'
import { Box, Typography, Card, CardContent, Button, Chip } from '@mui/material'
import { CheckCircle as CheckIcon, Pets as PetsIcon } from '@mui/icons-material'
import { useLocation, useNavigate } from 'react-router-dom'

const AddPetSuccess = () => {
  const { state } = useLocation()
  const navigate = useNavigate()
  const petId = state?.petId
  const petCode = state?.petCode
  const name = state?.name

  return (
    <Box>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CheckIcon color="success" />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Pet created successfully</Typography>
          </Box>

          <Typography variant="body1" sx={{ mb: 2 }}>
            {name ? `"${name}" has been added to your pets.` : 'Your pet has been added to your pets.'}
          </Typography>

          {petCode && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Pet Code</Typography>
              <Chip label={petCode} color="primary" variant="outlined" sx={{ fontFamily: 'monospace', fontWeight: 700 }} />
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 1 }}>
            {petId && (
              <Button variant="contained" startIcon={<PetsIcon />} onClick={() => navigate(`/User/pets/${petId}`, { replace: true })}>
                View Pet Profile
              </Button>
            )}
            <Button variant="outlined" onClick={() => navigate('/User/owned-pets', { replace: true })}>
              Go to Owned Pets
            </Button>
            <Button onClick={() => navigate('/User/pets/add', { replace: true })}>
              Add Another Pet
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default AddPetSuccess
