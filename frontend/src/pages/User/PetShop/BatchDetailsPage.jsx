import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  Alert,
  Stack,
  Divider,
  IconButton,
  Skeleton,
  Avatar,
  useMediaQuery,
  useTheme,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Share as ShareIcon,
  Schedule as ScheduleIcon,
  Pets as PetsIcon,
  LocalOffer as PriceIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  NavigateNext as NextIcon,
  Verified as VerifiedIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { apiClient, resolveMediaUrl } from '../../../services/api';

// Helper to extract URL from image object or string
const getImageUrl = (img) => {
  if (!img) return '/placeholder-pet.svg';
  if (typeof img === 'string') return img;
  if (img.url) return img.url;
  return '/placeholder-pet.svg';
};

const BatchDetailsPage = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [batch, setBatch] = useState(location.state?.batch || null);
  const [loading, setLoading] = useState(!batch);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!batch) {
      loadBatchDetails();
    } else {
      // Set first image
      initializeImages();
    }
    
    // Check if already favorited
    const favorites = JSON.parse(localStorage.getItem('petshop_favorites') || '[]');
    setIsFavorite(favorites.includes(batchId));
  }, [batchId]);

  const initializeImages = () => {
    // Priority: male images, then female, then general images
    if (batch?.maleImages?.length > 0 || batch?.femaleImages?.length > 0 || batch?.images?.length > 0) {
      setSelectedImage(0);
    }
  };

  const loadBatchDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Try to fetch from public stocks endpoint
      const response = await apiClient.get(`/petshop/user/public/stocks/${batchId}`);
      const stockData = response.data.data;
      
      setBatch(stockData);
      initializeImages();
    } catch (err) {
      console.error('Error loading batch:', err);
      setError(err.response?.data?.message || 'Failed to load pet details');
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = () => {
    const favorites = JSON.parse(localStorage.getItem('petshop_favorites') || '[]');
    if (isFavorite) {
      const index = favorites.indexOf(batchId);
      if (index > -1) favorites.splice(index, 1);
    } else {
      if (!favorites.includes(batchId)) favorites.push(batchId);
    }
    localStorage.setItem('petshop_favorites', JSON.stringify(favorites));
    setIsFavorite(!isFavorite);
  };

  const handleBuyNow = () => {
    // Navigate to application page or show purchase dialog
    navigate('/user/petshop/apply', { state: { batch } });
  };

  const handleReservePet = (pet) => {
    setSelectedPet(pet);
    setReserveDialogOpen(true);
  };

  const confirmReservation = async () => {
    // TODO: Implement reservation logic with backend
    console.log('Reserving pet:', selectedPet, 'Notes:', notes);
    // For now, just close the dialog
    setReserveDialogOpen(false);
    setSelectedPet(null);
    setNotes('');
  };

  // Get all images for gallery
  const getAllImages = () => {
    const images = [];
    
    if (batch?.maleImages?.length > 0) {
      batch.maleImages.forEach(img => images.push({ src: img, gender: 'male' }));
    }
    
    if (batch?.femaleImages?.length > 0) {
      batch.femaleImages.forEach(img => images.push({ src: img, gender: 'female' }));
    }
    
    if (batch?.images?.length > 0 && images.length === 0) {
      batch.images.forEach(img => images.push({ src: img, gender: null }));
    }
    
    return images;
  };

  const imageGallery = getAllImages();
  const currentImage = imageGallery[selectedImage] || { src: '/placeholder-pet.svg', gender: null };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 1 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={5}>
            <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error || !batch) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error || 'Pet batch not found'}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/user/petshop/dashboard')}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  const maleCount = batch.counts?.male || batch.maleCount || 0;
  const femaleCount = batch.counts?.female || batch.femaleCount || 0;
  const totalAvailable = batch.availableCount || batch.counts?.total || (maleCount + femaleCount);
  const price = batch.price?.min || batch.price || 0;
  const discountPrice = batch.discountPrice;
  const hasDiscount = discountPrice && discountPrice < price;
  const originalPrice = hasDiscount ? price : 0;
  const discount = hasDiscount ? Math.round(((price - discountPrice) / price) * 100) : 0;
  const breedName = batch.breedId?.name || batch.breed?.name || 'Unknown Breed';
  const speciesName = batch.speciesId?.displayName || batch.speciesId?.name || batch.species?.displayName || 'Unknown Species';

  return (
    <Box sx={{ backgroundColor: '#f8f9fa', minHeight: '100vh', pb: 4 }}>
      <Container maxWidth="lg" sx={{ pt: 2 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs separator={<NextIcon fontSize="small" />} sx={{ mb: 2 }}>
          <Link
            underline="hover"
            color="inherit"
            sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            onClick={() => navigate('/user/petshop/dashboard')}
          >
            Pet Shop
          </Link>
          <Typography color="text.primary">{breedName}</Typography>
        </Breadcrumbs>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Left: Image Gallery */}
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 2 }}>
              {/* Main Image */}
              <Box sx={{ position: 'relative', backgroundColor: '#f5f5f5' }}>
                <Box
                  component="img"
                  src={resolveMediaUrl(getImageUrl(currentImage.src))}
                  alt={breedName}
                  onError={(e) => { e.target.src = '/placeholder-pet.svg'; }}
                  sx={{
                    width: '100%',
                    height: { xs: 300, sm: 400, md: 500 },
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
                
                {/* Gender Badge on Main Image */}
                {currentImage.gender && (
                  <Chip
                    icon={currentImage.gender === 'male' ? <MaleIcon /> : <FemaleIcon />}
                    label={currentImage.gender === 'male' ? 'Male' : 'Female'}
                    sx={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      backgroundColor: currentImage.gender === 'male' ? '#2196f3' : '#e91e63',
                      color: 'white',
                      fontWeight: 600
                    }}
                  />
                )}

                {/* Favorite Button */}
                <IconButton
                  onClick={handleFavoriteToggle}
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    backgroundColor: 'white',
                    '&:hover': { backgroundColor: 'white' }
                  }}
                >
                  {isFavorite ? (
                    <FavoriteIcon sx={{ color: '#e91e63' }} />
                  ) : (
                    <FavoriteBorderIcon />
                  )}
                </IconButton>
              </Box>

              {/* Thumbnail Gallery */}
              {imageGallery.length > 1 && (
                <Box sx={{ p: 2, backgroundColor: 'white', borderTop: '1px solid #e0e0e0' }}>
                  <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
                    {imageGallery.map((img, idx) => (
                      <Box
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        sx={{
                          position: 'relative',
                          flexShrink: 0,
                          cursor: 'pointer',
                          border: selectedImage === idx ? '3px solid' : '2px solid',
                          borderColor: selectedImage === idx 
                            ? (img.gender === 'male' ? '#2196f3' : img.gender === 'female' ? '#e91e63' : 'primary.main')
                            : '#e0e0e0',
                          borderRadius: 1,
                          overflow: 'hidden',
                          opacity: selectedImage === idx ? 1 : 0.6,
                          transition: 'all 0.2s',
                          '&:hover': { opacity: 1 }
                        }}
                      >
                        <Box
                          component="img"
                          src={resolveMediaUrl(getImageUrl(img.src))}
                          alt={`Thumbnail ${idx + 1}`}
                          onError={(e) => { e.target.src = '/placeholder-pet.svg'; }}
                          sx={{
                            width: 80,
                            height: 80,
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                        {img.gender && (
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 2,
                              right: 2,
                              backgroundColor: img.gender === 'male' ? '#2196f3' : '#e91e63',
                              color: 'white',
                              borderRadius: '50%',
                              width: 20,
                              height: 20,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.7rem',
                              fontWeight: 700
                            }}
                          >
                            {img.gender === 'male' ? 'M' : 'F'}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Card>
          </Grid>

          {/* Right: Product Details - Sticky on Desktop */}
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                position: { md: 'sticky' },
                top: { md: 90 },
                pb: 3,
              }}
            >
            {/* Breed & Species */}
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {batch.breedId?.name || 'Unknown Breed'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {batch.speciesId?.name || 'Unknown Species'}
            </Typography>

            {/* Rating & Verified Badge */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
              <Chip
                icon={<VerifiedIcon />}
                label="Verified Breeder"
                color="success"
                size="small"
              />
              <Rating value={4.5} precision={0.5} size="small" readOnly />
              <Typography variant="body2" color="text.secondary">
                (4.5)
              </Typography>
            </Stack>

            <Divider sx={{ mb: 3 }} />

            {/* Pricing */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Price Range
              </Typography>
              <Stack direction="row" alignItems="baseline" spacing={1}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  ₹{price.toLocaleString()}
                </Typography>
                {discount > 0 && (
                  <>
                    <Typography
                      variant="h6"
                      sx={{
                        textDecoration: 'line-through',
                        color: 'text.secondary',
                      }}
                    >
                      ₹{originalPrice.toLocaleString()}
                    </Typography>
                    <Chip
                      label={`${discount}% OFF`}
                      color="error"
                      size="small"
                    />
                  </>
                )}
              </Stack>
            </Box>

            {/* Availability - Gender Split */}
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Available Stock
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Card
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    backgroundColor: maleCount > 0 ? 'primary.50' : 'grey.100',
                    border: '1px solid',
                    borderColor: maleCount > 0 ? 'primary.main' : 'grey.300',
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      width: 40,
                      height: 40,
                      mx: 'auto',
                      mb: 1,
                    }}
                  >
                    <Typography variant="h6">♂</Typography>
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {maleCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Males Available
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    backgroundColor: femaleCount > 0 ? '#fce4ec' : 'grey.100',
                    border: '1px solid',
                    borderColor: femaleCount > 0 ? '#ec407a' : 'grey.300',
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: '#ec407a',
                      width: 40,
                      height: 40,
                      mx: 'auto',
                      mb: 1,
                    }}
                  >
                    <Typography variant="h6" sx={{ color: 'white' }}>♀</Typography>
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {femaleCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Females Available
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            {/* What's Included */}
            <Card sx={{ mb: 3, backgroundColor: 'grey.50' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  What's Included
                </Typography>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />
                    <Typography variant="body2">Health Certificate & Vaccination</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />
                    <Typography variant="body2">7-Day Money Back Guarantee</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />
                    <Typography variant="body2">Free Shipping & Delivery</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />
                    <Typography variant="body2">24/7 Customer Support</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* CTA Buttons */}
            <Stack spacing={2}>
              {batch.status !== 'sold_out' ? (
                <>
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={<CartIcon />}
                    onClick={() => navigate(`/User/petshop/stock/${batch._id}`)}
                    sx={{
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      boxShadow: 2,
                      textTransform: 'none',
                    }}
                  >
                    Buy
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    startIcon={<ShareIcon />}
                    sx={{ py: 1.5 }}
                  >
                    Share This Batch
                  </Button>
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Submit an application to reserve your pet. Our team will contact you within
                    24 hours.
                  </Alert>
                </>
              ) : (
                <Alert severity="warning">This batch is currently sold out</Alert>
              )}
            </Stack>
          </Box>
        </Grid>
      </Grid>

        {/* Available Pets Section */}
        {inventory.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
            Available Pets in This Batch
          </Typography>
          <Grid container spacing={2}>
            {inventory
              .filter((pet) => !pet.reservedBy)
              .map((pet) => (
                <Grid item xs={12} sm={6} md={4} key={pet._id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    {pet.imageIds?.[0] && (
                      <CardMedia
                        component="img"
                        image={resolveMediaUrl(pet.imageIds[0])}
                        alt={pet.petName}
                        sx={{
                          height: 200,
                          objectFit: 'cover',
                        }}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {pet.petName}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        <Chip
                          label={pet.gender || 'Unknown'}
                          size="small"
                          color={pet.gender === 'Male' ? 'primary' : 'secondary'}
                        />
                        <Chip label={`${pet.ageMonths} months`} size="small" variant="outlined" />
                      </Stack>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        ₹{pet.price?.toLocaleString()}
                      </Typography>
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => handleReservePet(pet)}
                      >
                        Reserve Now
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </Box>
        )}

        {/* Reservation Dialog */}
        <Dialog
        open={reserveDialogOpen}
        onClose={() => {
          setReserveDialogOpen(false);
          setSelectedPet(null);
          setNotes('');
          setQuantity(1);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Reserve {selectedPet?.petName}</Typography>
            <IconButton onClick={() => setReserveDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            {selectedPet?.imageIds?.[0] && (
              <Box
                component="img"
                src={resolveMediaUrl(selectedPet.imageIds[0])}
                alt={selectedPet.petName}
                sx={{
                  width: '100%',
                  height: 250,
                  objectFit: 'cover',
                  borderRadius: 2,
                }}
              />
            )}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                Price
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                ₹{selectedPet?.price?.toLocaleString()}
              </Typography>
            </Box>
            <TextField
              fullWidth
              label="Additional Notes (Optional)"
              multiline
              rows={3}
              placeholder="Tell us about your preferences or requirements..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Alert severity="info">
              This pet will be reserved for 7 days. Complete your purchase to confirm ownership.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setReserveDialogOpen(false)} size="large">
            Cancel
          </Button>
          <Button variant="contained" onClick={confirmReservation} size="large" startIcon={<CartIcon />}>
            Proceed to Checkout
          </Button>
        </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default BatchDetailsPage;
