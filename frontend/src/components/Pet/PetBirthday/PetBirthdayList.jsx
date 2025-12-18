import React, { useState } from 'react'
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Typography,
  Box,
  CircularProgress
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { apiClient } from '../../../services/api'
import PetBirthdayDialog from './PetBirthdayDialog'

const PetBirthdayList = ({ pets, onDismiss, loading }) => {
  const [showBirthdayDialog, setShowBirthdayDialog] = useState(false)
  const [selectedPet, setSelectedPet] = useState(null)
  const [success, setSuccess] = useState('')

  const handleSetBirthday = (pet) => {
    setSelectedPet(pet)
    setSuccess('')
    setShowBirthdayDialog(true)
  }

  const handlePreferenceSet = () => {
    // Remove the pet from the list after preference is set
    if (selectedPet) {
      // Close dialog after success
      setTimeout(() => {
        setShowBirthdayDialog(false)
        setSelectedPet(null)
      }, 1500)
    }
  }

  return (
    <>
      <List>
        {pets.map((pet) => (
          <ListItem 
            key={pet._id} 
            sx={{ 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 1, 
              mb: 1,
              '&:last-child': { mb: 0 }
            }}
          >
            <ListItemText 
              primary={pet.name} 
              secondary={`${pet.age} ${pet.ageUnit || 'months'} old`}
            />
            <ListItemSecondaryAction>
              <Chip 
                label="No Birthday Set" 
                size="small" 
                color="warning" 
                variant="outlined" 
                sx={{ mr: 1 }}
              />
              <Button 
                size="small" 
                variant="contained" 
                onClick={() => handleSetBirthday(pet)}
                disabled={loading || !!success}
                sx={{ mr: 1 }}
              >
                Set Birthday
              </Button>
              <IconButton 
                size="small" 
                onClick={() => onDismiss(pet._id)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      {/* Birthday Preference Dialog */}
      {selectedPet && (
        <PetBirthdayDialog
          open={showBirthdayDialog}
          onClose={() => setShowBirthdayDialog(false)}
          pet={selectedPet}
          onSuccess={handlePreferenceSet}
        />
      )}
    </>
  )
}

export default PetBirthdayList