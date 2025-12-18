import React from 'react'
import { Card, CardContent, CardMedia, Typography, Chip } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const PetCard = ({ pet, variant = 'default' }) => {
  const navigate = useNavigate()
  
  const handleClick = () => {
    if (variant === 'manager') {
      navigate(`/manager/petshop/inventory/${pet._id}`)
    } else {
      navigate(`/User/petshop/pet/${pet._id}`)
    }
  }
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: 3
        }
      }}
      onClick={handleClick}
    >
      {pet.imageIds?.length > 0 && (
        <CardMedia
          component="img"
          height="140"
          image={`/api/images/${pet.imageIds[0]}`}
          alt={pet.name}
        />
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="div">
          {pet.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {pet.breed?.name || pet.customBreedInfo?.breed || 'Unknown Breed'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Age: {pet.age} {pet.ageUnit}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gender: {pet.gender}
        </Typography>
        {pet.currentStatus && (
          <Chip 
            label={pet.currentStatus} 
            size="small" 
            sx={{ mt: 1 }} 
            color={
              pet.currentStatus === 'Available' ? 'success' :
              pet.currentStatus === 'Adopted' ? 'info' :
              pet.currentStatus === 'Reserved' ? 'warning' : 'default'
            }
          />
        )}
      </CardContent>
    </Card>
  )
}

export default PetCard