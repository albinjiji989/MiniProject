import React from 'react'
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Chip,
  Checkbox,
  IconButton,
  Tooltip
} from '@mui/material'
import PetAgeDisplay from './PetAgeDisplay'
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Publish as PublishIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  AddPhotoAlternate as AddPhotoAlternateIcon,
  CloudUpload as CloudUploadIcon,
  Pending as PendingIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { resolveMediaUrl } from '../../../../services/api'

const PetCard = ({ item, isSelected, onSelect, onAction, isPending = false }) => {
  const navigate = useNavigate()

  // Helper function to build proper image URLs
  const buildImageUrl = (url) => {
    if (!url) return null
    return resolveMediaUrl(url)
  }

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        border: isSelected ? '3px solid #1976d2' : '1px solid #e0e0e0',
        boxShadow: isSelected ? 6 : 2,
        transition: 'all 0.3s ease-in-out',
        borderRadius: 3,
        overflow: 'hidden',
        '&:hover': {
          boxShadow: 8,
          transform: 'translateY(-5px)'
        }
      }}
    >
      <Box sx={{ position: 'relative', pt: '75%', bgcolor: '#f5f5f5' }}>
        {item.images && item.images.length > 0 ? (
          <>
            <img 
              src={buildImageUrl(item.images[0]?.url) || '/placeholder-image.png'} 
              alt={item.name || item.petCode}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
            <Box 
              sx={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#eeeeee'
              }}
            >
              <AddPhotoAlternateIcon sx={{ fontSize: 48, color: '#9e9e9e' }} />
            </Box>
          </>
        ) : (
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#eeeeee'
            }}
          >
            <AddPhotoAlternateIcon sx={{ fontSize: 48, color: '#9e9e9e' }} />
          </Box>
        )}
        {isPending && (
          <Chip 
            icon={<PendingIcon />}
            label="Needs Images"
            color="warning"
            size="small"
            sx={{ 
              position: 'absolute', 
              top: 8, 
              left: 8,
              fontWeight: 'bold'
            }}
          />
        )}
        <Checkbox
          checked={isSelected}
          onChange={() => onSelect(item._id)}
          sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8,
            bgcolor: 'white',
            borderRadius: '50%',
            '& .MuiSvgIcon-root': { fontSize: 20 }
          }}
        />
        {item.images && item.images.length > 0 && (
          <Chip 
            label={`${item.images.length} image${item.images.length > 1 ? 's' : ''}`}
            size="small"
            sx={{ 
              position: 'absolute', 
              bottom: 8, 
              right: 8,
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        )}
      </Box>
      
      <CardContent sx={{ flexGrow: 1, pb: 1, bgcolor: '#fafafa' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" fontWeight="bold" noWrap color="primary">
            {item.name || 'Unnamed Pet'}
          </Typography>
          <Chip 
            label={item.petCode || `PET-${item._id?.slice(-6)}`} 
            size="small" 
            color="primary" 
            variant="filled"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
        
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="body2" color="textSecondary" noWrap sx={{ mb: 0.5 }}>
            <strong>{item.speciesId?.displayName || item.speciesId?.name || 'Unknown Species'}</strong> • {item.breedId?.name || 'Unknown Breed'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="body2" color="textSecondary" component="span">
              <strong>Age:</strong>
            </Typography>
            <PetAgeDisplay petCode={item.petCode} initialAge={item.age} initialAgeUnit={item.ageUnit} />
            <Typography variant="body2" color="textSecondary" component="span">
              • <strong>Gender:</strong> {item.gender}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, pt: 1, borderTop: '1px solid #eee' }}>
          <Typography variant="h5" color="primary" fontWeight="bold">
            ₹{Number(item.price || 0).toLocaleString()}
          </Typography>
          <Chip 
            label={item.status?.replace('_', ' ') || 'in stock'} 
            size="small" 
            color={item.status === 'available_for_sale' ? 'success' : 'default'}
            variant="filled"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
      </CardContent>
      
      <CardActions sx={{ pt: 1, px: 1, pb: 1, bgcolor: '#f5f5f5', justifyContent: 'space-around' }}>
        <Tooltip title="Edit Pet Details">
          <IconButton 
            size="small" 
            onClick={() => onAction('edit', item)}
            sx={{ 
              bgcolor: '#e3f2fd',
              '&:hover': { bgcolor: '#bbdefb' }
            }}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
        
        {isPending ? (
          <Tooltip title="Add Image">
            <IconButton 
              size="small" 
              color="secondary" 
              onClick={() => onAction('upload', item)}
              sx={{ 
                bgcolor: '#fff3e0',
                '&:hover': { bgcolor: '#ffe0b2' }
              }}
            >
              <AddPhotoAlternateIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="View Details">
            <IconButton 
              size="small" 
              onClick={() => onAction('view', item)}
              sx={{ 
                bgcolor: '#e8f5e9',
                '&:hover': { bgcolor: '#c8e6c9' }
              }}
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
        )}
        
        {/* Generate Pets button for stock items */}
        {item.maleCount !== undefined && item.femaleCount !== undefined && (item.maleCount > 0 || item.femaleCount > 0) && (
          <Tooltip title="Generate Pets from Stock">
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => onAction('generate', item)}
              sx={{ 
                bgcolor: '#e3f2fd',
                '&:hover': { bgcolor: '#bbdefb' }
              }}
            >
              <PublishIcon />
            </IconButton>
          </Tooltip>
        )}
        
        <Tooltip title="View Pet History">
          <IconButton 
            size="small" 
            color="info"
            onClick={() => onAction('history', item)}
            sx={{ 
              bgcolor: '#e1f5fe',
              '&:hover': { bgcolor: '#b3e5fc' }
            }}
          >
            <HistoryIcon />
          </IconButton>
        </Tooltip>
        
        {!isPending && item.status !== 'available_for_sale' && (
          <Tooltip title="Release to Public">
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => onAction('release', [item._id])}
              sx={{ 
                bgcolor: '#e8f5e9',
                '&:hover': { bgcolor: '#c8e6c9' }
              }}
            >
              <PublishIcon />
            </IconButton>
          </Tooltip>
        )}
        
        <Tooltip title="Remove from Sale">
          <IconButton 
            size="small" 
            color="error"
            onClick={() => onAction('delete', item._id)}
            sx={{ 
              bgcolor: '#ffebee',
              '&:hover': { bgcolor: '#ffcdd2' }
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  )
}

export default PetCard