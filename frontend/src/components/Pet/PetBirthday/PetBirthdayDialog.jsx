import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Typography,
  Box,
  CircularProgress
} from '@mui/material'
import { apiClient } from '../../../services/api'

const PetBirthdayDialog = ({ open, onClose, pet, onSuccess }) => {
  const [preferredBirthday, setPreferredBirthday] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmitPreference = async () => {
    if (!preferredBirthday) {
      setError('Please select a preferred birthday')
      return
    }

    const birthdayValue = parseInt(preferredBirthday)
    if (isNaN(birthdayValue) || birthdayValue < 1 || birthdayValue > 31) {
      setError('Preferred birthday must be between 1 and 31')
      return
    }

    // Validate selected pet data
    if (!pet || !pet._id) {
      setError('Invalid pet data. Please try again.')
      return
    }

    if (pet.age === undefined || pet.age === null) {
      setError('Pet age information is missing.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Determine the pet model type
      let petModel = 'Pet'
      if (pet?.source === 'adoption') {
        petModel = 'AdoptionPet'
      } else if (pet?.source === 'petshop') {
        petModel = 'PetInventoryItem'
      } else if (pet?.tags?.includes('user-added')) {
        petModel = 'PetNew'
      }

      const response = await apiClient.post('/pets/birthday/birthday-preference', {
        petId: pet._id,
        petModel: petModel,
        currentAge: {
          value: pet.age,
          unit: pet.ageUnit || 'months'
        },
        preferredBirthday: birthdayValue
      })

      if (response.data.success) {
        setSuccess('Birthday preference set successfully!')
        // Call onSuccess callback
        if (onSuccess) {
          onSuccess()
        }
      } else {
        setError(response.data.message || 'Failed to set birthday preference')
      }
    } catch (err) {
      console.error('Error setting birthday preference:', err)
      setError(err.response?.data?.message || 'Failed to set birthday preference. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Set Pet Birthday Preference</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          
          {pet && (
            <Typography variant="body1" sx={{ mb: 3 }}>
              Your pet <strong>{pet.name}</strong> is currently {pet.age} {pet.ageUnit || 'months'} old. 
              You can set a preferred birthday for your pet, and we'll automatically calculate 
              their age going forward.
            </Typography>
          )}
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Preferred Birthday (Day of Month)</InputLabel>
            <Select
              value={preferredBirthday}
              onChange={(e) => setPreferredBirthday(e.target.value)}
              label="Preferred Birthday (Day of Month)"
              disabled={!!loading || !!success}
            >
              {[...Array(31)].map((_, i) => (
                <MenuItem key={i + 1} value={i + 1}>
                  {i + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            We'll calculate your pet's actual birth date based on their current age and 
            your preferred birthday. From then on, their age will automatically update.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={!!loading || !!success}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmitPreference} 
          variant="contained" 
          disabled={!!loading || !preferredBirthday || !!success}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Setting...' : success ? 'Done' : 'Set Birthday'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PetBirthdayDialog