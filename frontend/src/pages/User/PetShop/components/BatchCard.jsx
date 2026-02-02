import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  Grid,
  Tooltip,
  Stack,
  LinearProgress,
  Badge,
  Avatar,
  Paper
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ShoppingCart as CartIcon,
  Pets as PetsIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  CalendarToday as AgeIcon
} from '@mui/icons-material';
import { resolveMediaUrl } from '../../../../services/api';

/**
 * BatchCard Component
 * Displays a single batch OR individual pet inventory item in grid format
 * Handles both new batch system and legacy inventory items
 * Shows full pet details: image, species, breed, price, and action buttons
 */
const BatchCard = ({ batch, onSelect, onReserve, isFavorite, onFavoriteToggle }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Determine if this is a batch or individual item
  const isBatch = batch?.counts || (batch?.samplePets && batch?.ageRange);
  
  // ==================== IMAGE HANDLING ====================
  // Helper function to extract URL from image object or string
  const getImageUrl = (img) => {
    if (!img) return null;
    // If it's already a string URL, return it
    if (typeof img === 'string') return img;
    // If it's an object with url property
    if (img.url) return img.url;
    // If it's an object with path property
    if (img.path) return img.path;
    // If it's an object with _id (ObjectId), we can't resolve it here, return null
    return null;
  };
  
  // Get male and female images separately for batch display
  let maleImage = '/placeholder-pet.svg';
  let femaleImage = '/placeholder-pet.svg';
  let primaryImage = '/placeholder-pet.svg';
  
  if (isBatch) {
    // For batches, try to get separate male and female images
    // Check maleImages array first
    if (batch.maleImages?.length > 0) {
      const imgUrl = getImageUrl(batch.maleImages[0]);
      if (imgUrl) maleImage = resolveMediaUrl(imgUrl);
    } else if (batch.maleImageIds?.length > 0) {
      const imgUrl = getImageUrl(batch.maleImageIds[0]);
      if (imgUrl) maleImage = resolveMediaUrl(imgUrl);
    }
    
    // Check femaleImages array
    if (batch.femaleImages?.length > 0) {
      const imgUrl = getImageUrl(batch.femaleImages[0]);
      if (imgUrl) femaleImage = resolveMediaUrl(imgUrl);
    } else if (batch.femaleImageIds?.length > 0) {
      const imgUrl = getImageUrl(batch.femaleImageIds[0]);
      if (imgUrl) femaleImage = resolveMediaUrl(imgUrl);
    }
    
    // Fallback to combined images array if no gender-specific images
    if (maleImage === '/placeholder-pet.svg' && femaleImage === '/placeholder-pet.svg') {
      if (batch.images?.length > 0) {
        const imgUrl = getImageUrl(batch.images[0]);
        if (imgUrl) {
          primaryImage = resolveMediaUrl(imgUrl);
          maleImage = primaryImage;
          femaleImage = primaryImage;
        }
      }
    } else {
      // Use male image as primary if available, otherwise female
      primaryImage = maleImage !== '/placeholder-pet.svg' ? maleImage : femaleImage;
    }
  } else {
    // Individual inventory item format
    if (batch.images?.length > 0) {
      const imgUrl = getImageUrl(batch.images[0]);
      if (imgUrl) primaryImage = resolveMediaUrl(imgUrl);
    } 
    else if (batch.imageIds?.length > 0) {
      const imageId = batch.imageIds[0];
      const imgUrl = getImageUrl(imageId);
      if (imgUrl) primaryImage = resolveMediaUrl(imgUrl);
    }
    maleImage = primaryImage;
    femaleImage = primaryImage;
  }

  // ==================== TEXT CONTENT ====================
  // Extract breed and species with fallbacks
  let breedName = '';
  let speciesName = '';
  let petName = '';
  let price = 0;
  let itemStatus = 'available';
  let itemId = batch._id;

  if (isBatch) {
    breedName = batch.breedId?.name || batch.breed?.name || 'Unknown Breed';
    speciesName = batch.speciesId?.displayName || batch.speciesId?.name || batch.species?.displayName || batch.species?.name || 'Unknown Species';
    // For batches, show price range if available
    price = batch.price?.min || batch.price || 0;
    itemStatus = batch.status || 'available';
  } else {
    // Individual inventory item (stock-based)
    breedName = batch.breedId?.name || batch.breed?.name || batch.breedName || 'Unknown Breed';
    speciesName = batch.speciesId?.displayName || batch.speciesId?.name || batch.species?.displayName || batch.species?.name || batch.speciesName || 'Unknown Species';
    petName = batch.name || batch.petName || '';
    price = batch.price || 0;
    itemStatus = batch.status || 'available';
    itemId = batch._id;
  }

  // Availability badge
  const availableCount = isBatch ? (batch.availability?.available || batch.counts?.total || 0) : 1;
  const isAvailable = itemStatus === 'available_for_sale' || itemStatus === 'available';
  const isReserved = itemStatus === 'reserved';
  const isSoldOut = itemStatus === 'sold' || !isAvailable;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease',
        border: '1px solid #e0e0e0',
        borderRadius: 1.5,
        overflow: 'hidden',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
          borderColor: 'primary.main'
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dual Image Section for Batches */}
      {isBatch && batch.counts && (batch.counts.male > 0 && batch.counts.female > 0) ? (
        <Box sx={{ position: 'relative', height: 180, backgroundColor: '#f5f5f5' }}>
          {/* Split view: Male on left, Female on right */}
          <Grid container sx={{ height: '100%' }}>
            {/* Male Side */}
            <Grid item xs={6} sx={{ position: 'relative', borderRight: '1px solid white' }}>
              <CardMedia
                component="img"
                height="180"
                image={maleImage}
                alt="Male"
                onError={(e) => {
                  e.target.src = '/placeholder-pet.svg';
                }}
                sx={{
                  objectFit: 'cover',
                  height: '100%',
                  transition: 'transform 0.2s ease',
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                }}
              />
              {/* Male Badge */}
              <Chip
                icon={<MaleIcon sx={{ fontSize: '0.8rem', color: 'white !important' }} />}
                label={batch.counts.male}
                size="small"
                sx={{
                  position: 'absolute',
                  bottom: 6,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#2196f3',
                  color: 'white',
                  fontWeight: 600,
                  height: 22,
                  fontSize: '0.75rem',
                  '& .MuiChip-label': { px: 0.5 }
                }}
              />
            </Grid>

            {/* Female Side */}
            <Grid item xs={6} sx={{ position: 'relative' }}>
              <CardMedia
                component="img"
                height="180"
                image={femaleImage}
                alt="Female"
                onError={(e) => {
                  e.target.src = '/placeholder-pet.svg';
                }}
                sx={{
                  objectFit: 'cover',
                  height: '100%',
                  transition: 'transform 0.2s ease',
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                }}
              />
              {/* Female Badge */}
              <Chip
                icon={<FemaleIcon sx={{ fontSize: '0.8rem', color: 'white !important' }} />}
                label={batch.counts.female}
                size="small"
                sx={{
                  position: 'absolute',
                  bottom: 6,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#e91e63',
                  color: 'white',
                  fontWeight: 600,
                  height: 22,
                  fontSize: '0.75rem',
                  '& .MuiChip-label': { px: 0.5 }
                }}
              />
            </Grid>
          </Grid>

          {/* Total Count Chip */}
          <Chip
            label={availableCount}
            size="small"
            color="success"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              fontWeight: 600,
              height: 22,
              fontSize: '0.75rem'
            }}
          />
        </Box>
      ) : (
        /* Single Image Section for individual items or single-gender batches */
        <Box sx={{ position: 'relative', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
          <CardMedia
            component="img"
            height="180"
            image={primaryImage}
            alt={breedName}
            onError={(e) => {
              e.target.src = '/placeholder-pet.svg';
            }}
            sx={{
              objectFit: 'cover',
              transition: 'transform 0.2s ease',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)'
            }}
          />
          
          {/* Availability Badge */}
          <Chip
            label={availableCount}
            size="small"
            color={isAvailable ? 'success' : 'error'}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              fontWeight: 600,
              height: 22,
              fontSize: '0.75rem'
            }}
          />

          {/* Status Chip */}
          <Chip
            label={isSoldOut ? 'Sold Out' : isReserved ? 'Reserved' : 'Available'}
            color={isSoldOut ? 'error' : isReserved ? 'warning' : 'success'}
            size="small"
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              fontWeight: 600,
              height: 22,
              fontSize: '0.75rem'
            }}
          />
        </Box>
      )}

      {/* Content Section */}
      <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
        {/* Breed (Primary) */}
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            fontWeight: 700, 
            mb: 0.3, 
            color: '#1976d2',
            fontSize: '1.1rem',
            lineHeight: 1.2
          }}
        >
          {breedName}
        </Typography>

        {/* Species (Secondary) */}
        <Typography 
          variant="body2" 
          color="textSecondary" 
          sx={{ 
            mb: 1, 
            fontSize: '0.85rem'
          }}
        >
          {speciesName}
        </Typography>

        {/* Age (for batches) */}
        {isBatch && batch.age && (
          <Stack direction="row" spacing={0.5} sx={{ mb: 1, alignItems: 'center' }}>
            <AgeIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
            <Typography variant="caption" color="textSecondary">
              {batch.age} {batch.ageUnit || 'months'}
            </Typography>
          </Stack>
        )}

        {/* Compact Gender Info */}
        {isBatch && batch.counts && (
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
            <Chip
              icon={<MaleIcon sx={{ fontSize: '0.8rem' }} />}
              label={batch.counts.male}
              size="small"
              sx={{ 
                height: 22, 
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                fontWeight: 600,
                '& .MuiChip-icon': { color: '#1976d2', ml: 0.5 },
                '& .MuiChip-label': { px: 0.5 }
              }}
            />
            <Chip
              icon={<FemaleIcon sx={{ fontSize: '0.8rem' }} />}
              label={batch.counts.female}
              size="small"
              sx={{ 
                height: 22, 
                backgroundColor: '#fce4ec',
                color: '#c2185b',
                fontWeight: 600,
                '& .MuiChip-icon': { color: '#c2185b', ml: 0.5 },
                '& .MuiChip-label': { px: 0.5 }
              }}
            />
          </Stack>
        )}

        {/* Compact Price */}
        <Box 
          sx={{ 
            backgroundColor: '#f5f5f5',
            borderRadius: 1, 
            p: 1, 
            textAlign: 'center'
          }}
        >
          <Typography variant="h6" color="primary" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
            ₹{price.toLocaleString()}
          </Typography>
        </Box>
      </CardContent>

      {/* Actions Section */}
      <CardActions sx={{ pt: 0, px: 1.5, pb: 1.5, justifyContent: 'space-between', gap: 1 }}>
        <Button
          size="small"
          startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          color={isFavorite ? 'error' : 'inherit'}
          onClick={() => onFavoriteToggle?.(batch._id)}
          sx={{ minWidth: 0, px: 1 }}
        >
          {isFavorite ? 'Saved' : 'Save'}
        </Button>
        
        <Stack direction="row" spacing={0.5} sx={{ flex: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onSelect?.(batch)}
            sx={{ flex: 1, textTransform: 'none' }}
          >
            View
          </Button>
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<CartIcon />}
            disabled={isSoldOut || isReserved}
            onClick={() => onReserve?.(batch)}
            sx={{ flex: 1, textTransform: 'none' }}
          >
            {isReserved ? 'Reserved' : isSoldOut ? 'Sold' : 'Buy'}
          </Button>
        </Stack>
      </CardActions>
    </Card>
  );
};

export default BatchCard;
