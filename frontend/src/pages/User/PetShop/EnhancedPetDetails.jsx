import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Chip, 
  Button, 
  CircularProgress, 
  Alert, 
  TextField, 
  Rating, 
  Divider, 
  Stack,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Avatar,
  Paper,
  useTheme,
  alpha
} from '@mui/material'
import { 
  Pets as PetsIcon, 
  ArrowBack as BackIcon,
  Favorite as FavoriteIcon,
  ShoppingCart as ShoppingCartIcon,
  Star as StarIcon,
  CalendarToday as CalendarIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Palette as PaletteIcon,
  Scale as ScaleIcon,
  Vaccines as VaccineIcon,
  Store as StoreIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon,
  LocalOffer as PriceIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material'
import { petShopAPI, resolveMediaUrl } from '../../../services/api'
import { useAuth } from '../../../contexts/AuthContext'

const EnhancedPetDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [item, setItem] = useState(null)
  const [notes, setNotes] = useState('')
  const [reserving, setReserving] = useState(false)
  const [wishloading, setWishloading] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [reviews, setReviews] = useState([])
  const [myRating, setMyRating] = useState(0)
  const [myComment, setMyComment] = useState('')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0) // Track selected image

  // Format age for display
  const formatAge = (age, ageUnit) => {
    if (!age) return 'Age not specified'
    if (ageUnit === 'months' && age >= 12) {
      const years = Math.floor(age / 12)
      const months = age % 12
      return `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` ${months} month${months > 1 ? 's' : ''}` : ''}`
    }
    return `${age} ${ageUnit || 'year'}${age > 1 && ageUnit ? (ageUnit.endsWith('s') ? '' : 's') : ''}`
  }

  const load = async () => {
    try {
      setLoading(true)
      // Try public listing first
      let res
      try {
        res = await petShopAPI.getPublicListing(id)
        setItem(res.data.data.item)
      } catch (err) {
        // If not publicly available (reserved/sold), fallback to user-access endpoint
        const resp = await petShopAPI.getUserAccessibleItem(id)
        setItem(resp.data.data.item)
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load pet')
    } finally { 
      setLoading(false) 
    }
  }

  const toggleWishlist = async () => {
    try {
      setWishloading(true)
      if (isWishlisted) {
        await petShopAPI.removeFromWishlist(id)
        setIsWishlisted(false)
      } else {
        await petShopAPI.addToWishlist(id)
        setIsWishlisted(true)
      }
    } catch (e) {
      alert('Wishlist action failed')
    } finally { 
      setWishloading(false) 
    }
  }

  const submitReview = async () => {
    try {
      if (!myRating) return alert('Please select a rating')
      await petShopAPI.createReview({ itemId: id, rating: myRating, comment: myComment })
      setMyRating(0)
      setMyComment('')
      const r = await petShopAPI.getItemReviews(id)
      setReviews(r?.data?.data?.reviews || [])
    } catch (e) {
      alert('Failed to submit review')
    }
  }

  useEffect(() => { 
    load() 
  }, [id])

  useEffect(() => {
    const fetchExtras = async () => {
      try {
        // reviews
        const r = await petShopAPI.getItemReviews(id)
        setReviews(r?.data?.data?.reviews || [])
        // wishlist membership
        const w = await petShopAPI.listMyWishlist()
        const exists = (w?.data?.data?.items || []).some(x => x.itemId === id)
        setIsWishlisted(exists)
      } catch (_) {}
    }
    fetchExtras()
  }, [id])

  // SEO tags
  useEffect(() => {
    if (!item) return
    if (item.metaTitle) document.title = item.metaTitle
    const ensureMeta = (name) => {
      let el = document.querySelector(`meta[name="${name}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('name', name)
        document.head.appendChild(el)
      }
      return el
    }
    if (item.metaDescription) ensureMeta('description').setAttribute('content', item.metaDescription)
    if (item.metaKeywords && Array.isArray(item.metaKeywords)) ensureMeta('keywords').setAttribute('content', item.metaKeywords.join(', '))
  }, [item])

  // Reset selected image when item changes
  useEffect(() => {
    if (item) {
      setSelectedImageIndex(0);
    }
  }, [item]);

  // Handle keyboard navigation for images
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!item?.images || item.images.length <= 1) return;
      
      if (e.key === 'ArrowLeft') {
        setSelectedImageIndex(prev => (prev > 0 ? prev - 1 : item.images.length - 1));
      } else if (e.key === 'ArrowRight') {
        setSelectedImageIndex(prev => (prev < item.images.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, selectedImageIndex]);

  const handleReserve = () => {
    // Navigate to the new reservation wizard
    navigate(`/User/petshop/reserve/${id}`)
  }

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}><CircularProgress /></Box>
  if (error) return <Container maxWidth="md" sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>
  if (!item) return null

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
      
      <Grid container spacing={3}>
        {/* Left Column - Images and Main Info */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            {/* Main Image Carousel */}
            {item?.images?.length > 0 ? (
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="400"
                  image={resolveMediaUrl(item.images[selectedImageIndex]?.url || (item.images.find(i=>i.isPrimary)?.url) || item.images[0]?.url)}
                  alt={item.images[selectedImageIndex]?.caption || item?.name || 'Pet'}
                  sx={{ objectFit: 'cover' }}
                />
                {item?.images?.length > 1 && (
                  <>
                    <Box sx={{
                      position: 'absolute',
                      bottom: 16,
                      right: 16,
                      bgcolor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      fontWeight: 'bold'
                    }}>
                      {selectedImageIndex + 1} / {item.images.length}
                    </Box>
                    
                    {/* Navigation arrows */}
                    <IconButton
                      sx={{
                        position: 'absolute',
                        left: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.7)'
                        }
                      }}
                      onClick={() => setSelectedImageIndex(prev => (prev > 0 ? prev - 1 : item.images.length - 1))}
                      title="Previous image (Left arrow key)"
                    >
                      <BackIcon sx={{ transform: 'rotate(180deg)' }} />
                    </IconButton>
                    
                    <IconButton
                      sx={{
                        position: 'absolute',
                        right: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.7)'
                        }
                      }}
                      onClick={() => setSelectedImageIndex(prev => (prev < item.images.length - 1 ? prev + 1 : 0))}
                      title="Next image (Right arrow key)"
                    >
                      <BackIcon />
                    </IconButton>
                  </>
                )
              }
            </Box>
            ) : (
              <CardMedia component="div" sx={{ height: 400, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PetsIcon sx={{ fontSize: 120, color: 'white', opacity: 0.85 }} />
              </CardMedia>
            )}
            
            {/* Thumbnail Gallery */}
            {item?.images?.length > 1 && (
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Pet Images ({item.images.length})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Click thumbnails or use arrow keys to navigate
                  </Typography>
                </Box>
                <ImageList cols={4} rowHeight={100}>
                  {item.images.map((image, index) => (
                    <ImageListItem 
                      key={image._id}
                      sx={{
                        cursor: 'pointer',
                        border: index === selectedImageIndex ? `3px solid ${theme.palette.primary.main}` : '2px solid transparent',
                        borderRadius: 1,
                        overflow: 'hidden',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: 3
                        }
                      }}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <img
                        src={resolveMediaUrl(image.url)}
                        alt={image.caption || `Pet image ${index + 1}`}
                        loading="lazy"
                        style={{ 
                          height: '100%', 
                          width: '100%', 
                          objectFit: 'cover'
                        }}
                      />
                      {image.caption && (
                        <ImageListItemBar
                          title={image.caption}
                        />
                      )}
                      {index === selectedImageIndex && (
                        <Box sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          bgcolor: 'primary.main',
                          color: 'white',
                          borderRadius: '50%',
                          width: 20,
                          height: 20,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <CheckCircleIcon sx={{ fontSize: 16 }} />
                        </Box>
                      )}
                    </ImageListItem>
                  ))}
                </ImageList>
              </Box>
            )}
          </Card>
          
          {/* Pet Description */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                About {item.name || 'This Pet'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {item.description || 'No description available for this pet.'}
              </Typography>
              
              {/* Health Information */}
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 3 }}>
                Health Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckIcon sx={{ color: 'success.main', mr: 1 }} />
                    <Typography variant="body1">
                      <strong>Vaccination Status:</strong> {item.vaccinationStatus || 'Not specified'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckIcon sx={{ color: 'success.main', mr: 1 }} />
                    <Typography variant="body1">
                      <strong>Health Certificate:</strong> {item.healthCertificate ? 'Available' : 'Not available'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  {item.vaccinations && item.vaccinations.length > 0 && (
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Vaccinations:
                      </Typography>
                      {item.vaccinations.map((vaccination, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <VaccineIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                          <Typography variant="body2">
                            {vaccination.name} - {new Date(vaccination.date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          {/* Reviews Section */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Reviews
              </Typography>
              
              {/* Add Review */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.grey[100], 0.5) }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Leave a Review</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Rating value={myRating} onChange={(_, v) => setMyRating(v || 0)} />
                </Box>
                <TextField 
                  fullWidth 
                  label="Your Review (optional)" 
                  value={myComment} 
                  onChange={(e) => setMyComment(e.target.value)} 
                  multiline 
                  minRows={2} 
                  sx={{ mb: 1 }} 
                />
                <Button variant="contained" onClick={submitReview}>Submit Review</Button>
              </Paper>
              
              {/* Existing Reviews */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {reviews.map((rv) => (
                  <Paper key={rv._id} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        {rv.user?.name?.charAt(0) || 'U'}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {rv.user?.name || 'User'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Rating value={rv.rating} readOnly size="small" />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(rv.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    {rv.comment && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {rv.comment}
                      </Typography>
                    )}
                  </Paper>
                ))}
                {reviews.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No reviews yet. Be the first to review this pet!
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Right Column - Details and Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              {/* Pet Name and Code */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {item.name || 'Pet'}
                </Typography>
                {item.petCode && (
                  <Chip 
                    label={item.petCode} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                )}
              </Box>
              
              {/* Price and Status */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
                    ₹{item.price ? item.price.toLocaleString() : 'Price not set'}
                  </Typography>
                  {item.price && (
                    <Typography variant="body2" color="text.secondary">
                      Includes all taxes
                    </Typography>
                  )}
                </Box>
                <Chip 
                  label={item.status.replace('_', ' ')} 
                  color={
                    item.status === 'available_for_sale' ? 'success' : 
                    item.status === 'reserved' ? 'warning' : 
                    item.status === 'sold' ? 'default' : 'primary'
                  } 
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
              
              {/* Pet Details */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Pet Details
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarIcon sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Age</Typography>
                        <Typography variant="body1">{formatAge(item.age, item.ageUnit)}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {item.gender === 'male' ? (
                        <MaleIcon sx={{ fontSize: 20, mr: 1, color: 'primary.main' }} />
                      ) : item.gender === 'female' ? (
                        <FemaleIcon sx={{ fontSize: 20, mr: 1, color: 'secondary.main' }} />
                      ) : (
                        <InfoIcon sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                      )}
                      <Box>
                        <Typography variant="body2" color="text.secondary">Gender</Typography>
                        <Typography variant="body1">{item.gender || 'Not specified'}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PaletteIcon sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Color</Typography>
                        <Typography variant="body1">{item.color || 'Not specified'}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ScaleIcon sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Weight</Typography>
                        <Typography variant="body1">
                          {item.weight ? `${item.weight} kg` : 'Not specified'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PetsIcon sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Breed</Typography>
                        <Typography variant="body1">
                          {item.breedId?.name || 'Not specified'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <StoreIcon sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Pet Shop</Typography>
                        <Typography variant="body1">
                          {item.storeName || 'Not specified'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
              
              {/* Actions */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Reserve This Pet
                </Typography>
                <TextField 
                  fullWidth 
                  label="Notes (optional)" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  multiline 
                  minRows={2} 
                  sx={{ mb: 2 }} 
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button 
                    variant="contained" 
                    disabled={reserving} 
                    onClick={handleReserve}
                    startIcon={<ShoppingCartIcon />}
                    size="large"
                    sx={{ py: 1.5 }}
                  >
                    Reserve Now
                  </Button>
                  {/* Removed Buy Now button as per requirements */}
                  <Button 
                    variant="text" 
                    disabled={wishloading} 
                    onClick={toggleWishlist}
                    startIcon={<FavoriteIcon />}
                    size="large"
                    sx={{ py: 1.5 }}
                    color={isWishlisted ? "error" : "inherit"}
                  >
                    {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  </Button>
                </Box>
              </Box>
              
              {/* Additional Info */}
              <Box sx={{ bgcolor: alpha(theme.palette.info.light, 0.1), p: 2, borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <InfoIcon sx={{ mr: 1, color: 'info.main' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Important Information
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  After purchase, you'll receive detailed care instructions and support from our team. 
                  All pets come with a health guarantee and vaccination records.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default EnhancedPetDetails