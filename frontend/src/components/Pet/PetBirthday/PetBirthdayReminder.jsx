import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Alert
} from '@mui/material'
import { Cake as CakeIcon } from '@mui/icons-material'
import { usePetBirthday } from './usePetBirthday'
import PetBirthdayList from './PetBirthdayList'

const PetBirthdayReminder = ({ pets }) => {
  const [dismissedPets, setDismissedPets] = useState([])
  const { petsWithoutPreference, loading, error } = usePetBirthday(pets, dismissedPets)
  
  const handleDismiss = (petId) => {
    setDismissedPets(prev => [...prev, petId])
  }

  if (petsWithoutPreference.length === 0) {
    return null
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CakeIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Set Birthday for Your Pets</Typography>
        </Box>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          Setting a birthday for your pets allows us to automatically calculate and update their ages.
        </Alert>
        
        <PetBirthdayList 
          pets={petsWithoutPreference}
          onDismiss={handleDismiss}
          loading={loading}
        />
      </CardContent>
    </Card>
  )
}

export default PetBirthdayReminder