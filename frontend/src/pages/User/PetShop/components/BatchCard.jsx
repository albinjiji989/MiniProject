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
  Badge
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
  // Get primary image - handle both batch and item formats with proper fallbacks
  let primaryImage = '/placeholder-pet.svg';
  
  if (isBatch) {
    // Batch format: get from images array or samplePets
    if (batch.images?.length > 0) {
      primaryImage = resolveMediaUrl(batch.images[0]);
    } else if (batch.samplePets?.length > 0 && batch.samplePets[0]?.imageIds?.length > 0) {
      const imageId = batch.samplePets[0].imageIds[0];
      primaryImage = resolveMediaUrl(imageId?.url || imageId);
    }
  } else {
    // Individual inventory item format
    if (batch.imageIds?.length > 0) {
      // imageIds can be ObjectId strings or Image objects with .url
      const imageId = batch.imageIds[0];
      primaryImage = resolveMediaUrl(imageId?.url || imageId);
    } else if (batch.images?.length > 0) {
      primaryImage = resolveMediaUrl(batch.images[0].url || batch.images[0]);
    }
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
    breedName = batch.breedId?.name || 'Unknown Breed';
    speciesName = batch.speciesId?.displayName || batch.speciesId?.name || 'Unknown Species';
    // For batches, show price range if available
    price = batch.price?.min || batch.price || 0;
    itemStatus = batch.status || 'available';
  } else {
    // Individual inventory item
    breedName = batch.breedId?.name || batch.breedName || 'Unknown Breed';
    speciesName = batch.speciesId?.displayName || batch.speciesId?.name || batch.speciesName || batch.species || 'Unknown Species';
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
        transition: 'all 0.3s ease',
        border: '1px solid #e0e0e0',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-8px)'
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section */}
      <Box sx={{ position: 'relative', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
        <CardMedia
          component="img"
          height="250"
          image={primaryImage}
          alt={breedName}
          onError={(e) => {
            e.target.src = '/placeholder-pet.svg';
          }}
          sx={{
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)'
          }}
        />
        
        {/* Availability Badge */}
        <Badge
          badgeContent={availableCount}
          color={isAvailable ? 'success' : 'error'}
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            '& .MuiBadge-badge': {
              backgroundColor: isAvailable ? '#4caf50' : '#f44336',
              color: 'white',
              fontSize: '0.75rem',
              padding: '0 6px',
              borderRadius: '12px',
              fontWeight: 'bold'
            }
          }}
        >
          <Tooltip title={`${availableCount} ${isBatch ? 'available' : 'in stock'}`}>
            <PetsIcon sx={{ color: 'white', fontSize: '1.5rem' }} />
          </Tooltip>
        </Badge>

        {/* Status Chip */}
        <Chip
          label={isSoldOut ? 'Sold Out' : isReserved ? 'Reserved' : 'Available'}
          color={isSoldOut ? 'error' : isReserved ? 'warning' : 'success'}
          sx={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            fontWeight: 'bold'
          }}
        />
      </Box>

      {/* Content Section */}
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Breed (Primary) */}
        <Typography variant="h6" component="div" sx={{ fontWeight: 700, mb: 0.5, color: '#1976d2' }}>
          {breedName}
        </Typography>

        {/* Species (Secondary) */}
        <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontSize: '0.9rem' }}>
          {speciesName}
        </Typography>

        {/* Pet Name (if individual item) */}
        {petName && !isBatch && (
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5, fontStyle: 'italic' }}>
            {petName}
          </Typography>
        )}

        {/* Age Range (for batches) */}
        {isBatch && batch.ageRange && (
          <Stack direction="row" spacing={0.5} sx={{ mb: 1, alignItems: 'center' }}>
            <AgeIcon sx={{ fontSize: '0.9rem', color: 'primary.main' }} />
            <Typography variant="caption" color="textSecondary">
              {batch.ageRange.min}-{batch.ageRange.max} {batch.ageRange.unit || 'months'}
            </Typography>
          </Stack>
        )}

        {/* Gender Distribution (for batches) */}
        {isBatch && batch.counts && (
          <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
            <Tooltip title={`Male: ${batch.counts.male || 0}`}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <MaleIcon sx={{ fontSize: '0.9rem', color: '#2196f3' }} />
                <Typography variant="caption">{batch.counts.male || 0}</Typography>
              </Stack>
            </Tooltip>
            <Tooltip title={`Female: ${batch.counts.female || 0}`}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <FemaleIcon sx={{ fontSize: '0.9rem', color: '#e91e63' }} />
                <Typography variant="caption">{batch.counts.female || 0}</Typography>
              </Stack>
            </Tooltip>
          </Stack>
        )}

        {/* Price - Prominent Display */}
        <Box sx={{ backgroundColor: '#f0f0f0', borderRadius: 1, p: 1, mb: 1 }}>
          <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
            ₹{price.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {isBatch ? 'Price per pet' : 'For this pet'}
          </Typography>
        </Box>

        {/* Description (short snippet for individual items) */}
        {!isBatch && batch.description && (
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
            {batch.description.substring(0, 60)}...
          </Typography>
        )}
      </CardContent>

      {/* Actions Section */}
      <CardActions sx={{ pt: 0, pb: 1, justifyContent: 'space-between', gap: 1 }}>
        <Tooltip title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
          <Button
            size="small"
            startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            color={isFavorite ? 'error' : 'inherit'}
            onClick={() => onFavoriteToggle?.(batch._id)}
            sx={{ minWidth: 0 }}
          >
            {isFavorite ? 'Saved' : 'Save'}
          </Button>
        </Tooltip>
        
        <Stack direction="row" spacing={0.5} sx={{ flex: 1 }}>
          <Tooltip title="View details">
            <Button
              size="small"
              variant="outlined"
              onClick={() => onSelect?.(batch)}
              sx={{ flex: 1 }}
            >
              Details
            </Button>
          </Tooltip>
          <Tooltip title={isSoldOut ? 'Out of stock' : 'Reserve & buy this pet'}>
            <span style={{ flex: 1 }}>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CartIcon />}
                disabled={isSoldOut || isReserved}
                onClick={() => onReserve?.(batch)}
                fullWidth
                sx={{ textTransform: 'none' }}
              >
                {isReserved ? 'Reserved' : isSoldOut ? 'Unavailable' : 'Buy Now'}
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </CardActions>
    </Card>
  );

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        border: '1px solid #e0e0e0',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-8px)'
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section */}
      <Box sx={{ position: 'relative', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
        <CardMedia
          component="img"
          height="250"
          image={primaryImage}
          alt={breedName}
          onError={(e) => {
            e.target.src = '/placeholder-pet.svg';
          }}
          sx={{
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)'
          }}
        />
        
        {/* Availability Badge */}
        <Badge
          badgeContent={availableCount}
          color={isAvailable ? 'success' : 'error'}
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            '& .MuiBadge-badge': {
              backgroundColor: isAvailable ? '#4caf50' : '#f44336',
              color: 'white',
              fontSize: '0.75rem',
              padding: '0 6px',
              borderRadius: '12px',
              fontWeight: 'bold'
            }
          }}
        >
          <Tooltip title={`${availableCount} ${isBatch ? 'available' : 'in stock'}`}>
            <PetsIcon sx={{ color: 'white', fontSize: '1.5rem' }} />
          </Tooltip>
        </Badge>

        {/* Status Chip */}
        <Chip
          label={isSoldOut ? 'Sold Out' : isReserved ? 'Reserved' : 'Available'}
          color={isSoldOut ? 'error' : isReserved ? 'warning' : 'success'}
          sx={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            fontWeight: 'bold'
          }}
        />
      </Box>

      {/* Content Section */}
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Breed (Primary) */}
        <Typography variant="h6" component="div" sx={{ fontWeight: 700, mb: 0.5, color: '#1976d2' }}>
          {breedName}
        </Typography>

        {/* Species (Secondary) */}
        <Typography variant="body2" color="textSecondary" sx={{ mb: 1, fontSize: '0.9rem' }}>
          {speciesName}
        </Typography>

        {/* Pet Name (if individual item) */}
        {petName && !isBatch && (
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5, fontStyle: 'italic' }}>
            {petName}
          </Typography>
        )}

        {/* Age Range (for batches) */}
        {isBatch && batch.ageRange && (
          <Stack direction="row" spacing={0.5} sx={{ mb: 1, alignItems: 'center' }}>
            <AgeIcon sx={{ fontSize: '0.9rem', color: 'primary.main' }} />
            <Typography variant="caption" color="textSecondary">
              {batch.ageRange.min}-{batch.ageRange.max} {batch.ageRange.unit || 'months'}
            </Typography>
          </Stack>
        )}

        {/* Gender Distribution (for batches) */}
        {isBatch && batch.counts && (
          <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
            <Tooltip title={`Male: ${batch.counts.male || 0}`}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <MaleIcon sx={{ fontSize: '0.9rem', color: '#2196f3' }} />
                <Typography variant="caption">{batch.counts.male || 0}</Typography>
              </Stack>
            </Tooltip>
            <Tooltip title={`Female: ${batch.counts.female || 0}`}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <FemaleIcon sx={{ fontSize: '0.9rem', color: '#e91e63' }} />
                <Typography variant="caption">{batch.counts.female || 0}</Typography>
              </Stack>
            </Tooltip>
          </Stack>
        )}

        {/* Price - Prominent Display */}
        <Box sx={{ backgroundColor: '#f0f0f0', borderRadius: 1, p: 1, mb: 1 }}>
          <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
            ₹{price.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {isBatch ? 'Price per pet' : 'For this pet'}
          </Typography>
        </Box>

        {/* Description (short snippet for individual items) */}
        {!isBatch && batch.description && (
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
            {batch.description.substring(0, 60)}...
          </Typography>
        )}
      </CardContent>

      {/* Actions Section */}
      <CardActions sx={{ pt: 0, pb: 1, justifyContent: 'space-between', gap: 1 }}>
        <Tooltip title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
          <Button
            size="small"
            startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            color={isFavorite ? 'error' : 'inherit'}
            onClick={() => onFavoriteToggle?.(batch._id)}
            sx={{ minWidth: 0 }}
          >
            {isFavorite ? 'Saved' : 'Save'}
          </Button>
        </Tooltip>
        
        <Stack direction="row" spacing={0.5} sx={{ flex: 1 }}>
          <Tooltip title="View details">
            <Button
              size="small"
              variant="outlined"
              onClick={() => onSelect?.(batch)}
              sx={{ flex: 1 }}
            >
              Details
            </Button>
          </Tooltip>
          <Tooltip title={isSoldOut ? 'Out of stock' : 'Reserve & buy this pet'}>
            <span style={{ flex: 1 }}>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CartIcon />}
                disabled={isSoldOut || isReserved}
                onClick={() => onReserve?.(batch)}
                fullWidth
                sx={{ textTransform: 'none' }}
              >
                {isReserved ? 'Reserved' : isSoldOut ? 'Unavailable' : 'Buy Now'}
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </CardActions>
    </Card>
  );
};

export default BatchCard;
