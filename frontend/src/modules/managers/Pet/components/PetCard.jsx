import React from 'react';
import { 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Chip, 
  Box, 
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Male as MaleIcon, 
  Female as FemaleIcon, 
  Help as UnknownIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { formatPetAge, formatPetGender, getPetStatusColor, getPetHealthStatusColor } from '../utils/petUtils';

const PetCard = ({ pet, onEdit, onDelete, onView }) => {
  const getStatusIcon = (gender) => {
    switch (gender) {
      case 'Male':
        return <MaleIcon sx={{ color: 'primary.main' }} />;
      case 'Female':
        return <FemaleIcon sx={{ color: 'secondary.main' }} />;
      default:
        return <UnknownIcon sx={{ color: 'text.secondary' }} />;
    }
  };

  const handleCardClick = () => {
    if (onView) {
      onView(pet);
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        cursor: onView ? 'pointer' : 'default',
        '&:hover': onView ? { boxShadow: 3 } : {}
      }}
      onClick={handleCardClick}
    >
      {pet.images && pet.images.length > 0 && (
        <CardMedia
          component="img"
          height="140"
          image={pet.images[0]?.url || '/placeholder-pet.png'}
          alt={pet.name}
        />
      )}
      
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Typography gutterBottom variant="h6" component="div">
            {pet.name}
          </Typography>
          <Box>
            {onEdit && (
              <Tooltip title="Edit">
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(pet); }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title="Delete">
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(pet); }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
        
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          {getStatusIcon(pet.gender)}
          <Typography variant="body2" color="text.secondary">
            {formatPetGender(pet.gender)} • {formatPetAge(pet.age, pet.ageUnit)}
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {pet.breed?.name || pet.breed || 'Unknown Breed'}
        </Typography>
        
        <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
          <Chip 
            label={pet.currentStatus || 'Unknown Status'} 
            size="small" 
            color={getPetStatusColor(pet.currentStatus)} 
          />
          <Chip 
            label={pet.healthStatus || 'Unknown Health'} 
            size="small" 
            color={getPetHealthStatusColor(pet.healthStatus)} 
          />
        </Box>
        
        {pet.petCode && (
          <Typography variant="caption" color="text.secondary">
            Pet Code: {pet.petCode}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default PetCard;