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
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Avatar,
  Badge,
  useTheme
} from '@mui/material'
import {
  Pets as PetsIcon,
  ArrowBack as BackIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  ShoppingCart as CartIcon,
  CalendarToday as CalendarIcon,
  Info as InfoIcon,
  MedicalInformation as MedicalIcon,
  PhotoLibrary as PhotoIcon,
  Reviews as ReviewsIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CheckCircle as CheckIcon,
  QrCode as QrCodeIcon,
  Verified as VerifiedIcon,
  LocalShipping as ShippingIcon,
  SupportAgent as SupportIcon,
  HealthAndSafety as HealthIcon,
  Home as HomeIcon,
  FamilyRestroom as FamilyIcon,
  Psychology as PsychologyIcon,
  Restaurant as FoodIcon,
  Vaccines as VaccineIcon,
  Edit as EditIcon,
  Close as CloseIcon
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
  const [pet, setPet] = useState(null)
  const [activeTab, setActiveTab] = useState(0)
  const [wishloading, setWishloading] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [reviews, setReviews] = useState([])
  const [myRating, setMyRating] = useState(0)
  const [myComment, setMyComment] = useState('')
  const [similarPets, setSimilarPets] = useState([])
  
  // Reservation state
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false)
  const [reservationStep, setReservationStep] = useState(0)
  const [reservationData, setReservationData] = useState({
    purchaseMethod: 'online',
    contactInfo: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
    reservationType: 'visit',
    visitDetails: {
      preferredDate: '',
      preferredTime: 'morning',
    },
    deliveryAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      phone: user?.phone || '',
    },
    communicationPreferences: {
      preferredMethod: 'both',
      notificationFrequency: 'immediate'
    },
    notes: ''
  })

  const reservationSteps = [
    'Choose Purchase Method',
    'Contact Information',
    'Reservation Type',
    'Communication Preferences',
    'Review & Confirm'
  ]

  const loadPetDetails = async () => {
    try {
      setLoading(true)
      // Try public listing first
      let res
      try {
        res = await petShopAPI.getPublicListing(id)
        setPet(res.data.data.item)
      } catch (err) {
        // If not publicly available (reserved/sold), fallback to user-access endpoint
        const resp = await petShopAPI.get(`/user/listings/${id}`)
        setPet(resp.data.data.item)
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load pet')
    } finally {
      setLoading(false)
    }
  }

  const loadExtras = async () => {
    try {
      // reviews
      const r = await petShopAPI.getItemReviews(id)
      setReviews(r?.data?.data?.reviews || [])
      // wishlist membership
      const w = await petShopAPI.listMyWishlist()
      const exists = (w?.data?.data?.items || []).some(x => x.itemId === id)
      setIsWishlisted(exists)
      
      // Load similar pets
      if (pet?.speciesId?._id) {
        const similarRes = await petShopAPI.listPublicListings({
          speciesId: pet.speciesId._id,
          limit: 4,
          excludeId: id
        });
        setSimilarPets(similarRes?.data?.data?.items || []);
      }
    } catch (_) {}
  }

  useEffect(() => {
    loadPetDetails()
  }, [id])

  useEffect(() => {
    if (pet) {
      loadExtras()
    }
  }, [pet])

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

  const handleReserve = () => {
    setReservationDialogOpen(true)
  }

  const handleReservationNext = () => {
    if (reservationStep < reservationSteps.length - 1) {
      setReservationStep(reservationStep + 1)
    }
  }

  const handleReservationBack = () => {
    if (reservationStep > 0) {
      setReservationStep(reservationStep - 1)
    }
  }

  const handleReservationSubmit = async () => {
    try {
      const payload = {
        itemId: id,
        ...reservationData
      }
      
      // For purchase method, we need to use the correct endpoint
      if (reservationData.purchaseMethod === 'online') {
        await petShopAPI.createReservation(payload)
      } else {
        await petShopAPI.createPurchaseReservation(payload)
      }
      
      alert('Reservation submitted successfully!')
      setReservationDialogOpen(false)
      setReservationStep(0)
    } catch (e) {
      alert('Failed to submit reservation: ' + (e?.response?.data?.message || 'Unknown error'))
    }
  }

  const formatAge = (age, ageUnit) => {
    if (!age) return 'Age not specified'
    if (ageUnit === 'months' && age >= 12) {
      const years = Math.floor(age / 12)
      const months = age % 12
      return `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` ${months} month${months > 1 ? 's' : ''}` : ''}`
    }
    return `${age} ${ageUnit || 'year'}${age > 1 && ageUnit ? (ageUnit.endsWith('s') ? '' : 's') : ''}`
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  if (!pet) return null

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button 
        startIcon={<BackIcon />} 
        onClick={() => navigate(-1)} 
        sx={{ mb: 2 }}
      >
        Back
      </Button>
      
      <Grid container spacing={3}>
        {/* Left Column - Images and Basic Info */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardMedia
              component="img"
              height="400"
              image={resolveMediaUrl((pet.images?.find(i => i.isPrimary)?.url) || pet.images?.[0]?.url) || '/placeholder-pet.svg'}
              alt={pet?.name || 'Pet'}
              sx={{ objectFit: 'cover' }}
            />
            
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1">
                  {pet.name || 'Unnamed Pet'}
                </Typography>
                <IconButton 
                  onClick={toggleWishlist}
                  color={isWishlisted ? "error" : "default"}
                  disabled={wishloading}
                >
                  <FavoriteIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip 
                  label={`${pet.speciesId?.displayName || pet.speciesId?.name || 'Species'}`} 
                  color="primary" 
                  variant="outlined"
                />
                <Chip 
                  label={`${pet.breedId?.name || 'Breed'}`} 
                  color="secondary" 
                  variant="outlined"
                />
                <Chip 
                  label={formatAge(pet.age, pet.ageUnit)} 
                  color="default" 
                  variant="outlined"
                />
                <Chip 
                  label={pet.gender} 
                  color={pet.gender === 'male' ? 'primary' : 'secondary'} 
                  variant="outlined"
                />
                <Chip 
                  label={`₹${(pet.price || 0).toLocaleString()}`} 
                  color="success" 
                  variant="outlined"
                />
                <Chip 
                  label={pet.status.replace('_', ' ')} 
                  color={pet.status === 'available_for_sale' ? 'success' : pet.status === 'reserved' ? 'warning' : 'default'} 
                  variant="outlined"
                />
              </Box>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {pet.description || 'No description available for this pet.'}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="contained" 
                  size="large" 
                  startIcon={<CheckIcon />}
                  onClick={handleReserve}
                  disabled={pet.status !== 'available_for_sale'}
                  sx={{ flex: 1 }}
                >
                  Reserve Now
                </Button>
                <Button 
                  variant="outlined" 
                  size="large" 
                  startIcon={<ShareIcon />}
                  sx={{ flex: 0.5 }}
                >
                  Share
                </Button>
              </Box>
            </CardContent>
          </Card>
          
          {/* Tabs for detailed information */}
          <Card sx={{ mt: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Overview" icon={<InfoIcon />} />
              <Tab label="Photos" icon={<PhotoIcon />} />
              <Tab label="Medical Info" icon={<MedicalIcon />} />
              <Tab label="Reviews" icon={<ReviewsIcon />} />
              <Tab label="Similar Pets" icon={<PetsIcon />} />
            </Tabs>
            
            <CardContent>
              {activeTab === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Basic Information</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Species</Typography>
                      <Typography>{pet.speciesId?.displayName || pet.speciesId?.name || 'Not specified'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Breed</Typography>
                      <Typography>{pet.breedId?.name || 'Not specified'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Age</Typography>
                      <Typography>{formatAge(pet.age, pet.ageUnit)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Gender</Typography>
                      <Typography>{pet.gender || 'Not specified'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Color</Typography>
                      <Typography>{pet.color || 'Not specified'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Weight</Typography>
                      <Typography>{pet.weight ? `${pet.weight} ${pet.weightUnit || 'kg'}` : 'Not specified'}</Typography>
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Additional Details</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Pet Code</Typography>
                      <Typography>{pet.petCode || 'Not assigned'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Store</Typography>
                      <Typography>{pet.storeName || 'Not specified'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Availability</Typography>
                      <Typography>{pet.status.replace('_', ' ') || 'Not specified'}</Typography>
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Pet Characteristics</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <FamilyIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="body2">Good with Kids</Typography>
                        <Typography variant="h6">{pet.characteristics?.goodWithKids ? 'Yes' : 'No'}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <PsychologyIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                        <Typography variant="body2">Temperament</Typography>
                        <Typography variant="h6">{pet.characteristics?.temperament || 'N/A'}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <FoodIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                        <Typography variant="body2">Diet</Typography>
                        <Typography variant="h6">{pet.characteristics?.diet || 'N/A'}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <VaccineIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                        <Typography variant="body2">Vaccinated</Typography>
                        <Typography variant="h6">{pet.characteristics?.vaccinated ? 'Yes' : 'No'}</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}
              
              {activeTab === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Photo Gallery</Typography>
                  <Grid container spacing={2}>
                    {pet.images?.map((img, index) => (
                      <Grid item xs={6} sm={4} key={index}>
                        <Card>
                          <CardMedia
                            component="img"
                            height="150"
                            image={resolveMediaUrl(img.url) || '/placeholder-pet.svg'}
                            alt={`Pet image ${index + 1}`}
                            sx={{ objectFit: 'cover' }}
                          />
                          {img.caption && (
                            <CardContent>
                              <Typography variant="body2" color="text.secondary">
                                {img.caption}
                              </Typography>
                            </CardContent>
                          )}
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
              
              {activeTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Medical Information</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Health documents and vaccination records
                  </Typography>
                  {pet.healthDocs?.length > 0 ? (
                    <Box>
                      {pet.healthDocs.map((doc, index) => (
                        <Box key={index} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                          <Typography variant="subtitle1">{doc.title || `Document ${index + 1}`}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {doc.description || 'No description available'}
                          </Typography>
                          <Button 
                            size="small" 
                            sx={{ mt: 1 }}
                            onClick={() => window.open(resolveMediaUrl(doc.url), '_blank')}
                          >
                            View Document
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography>No medical documents available for this pet.</Typography>
                  )}
                </Box>
              )}
              
              {activeTab === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Customer Reviews</Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Rating value={4.8} readOnly precision={0.5} />
                      <Typography variant="body2">4.8 (24 reviews)</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Rating value={myRating} onChange={(_, v) => setMyRating(v || 0)} />
                      <TextField 
                        size="small" 
                        label="Your review" 
                        value={myComment} 
                        onChange={(e) => setMyComment(e.target.value)} 
                        sx={{ flex: 1 }} 
                      />
                      <Button variant="contained" onClick={submitReview}>Submit</Button>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {reviews.map((review) => (
                      <Box key={review._id} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1">Anonymous User</Typography>
                          <Rating value={review.rating} readOnly size="small" />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </Typography>
                        {review.comment && (
                          <Typography variant="body2">
                            {review.comment}
                          </Typography>
                        )}
                      </Box>
                    ))}
                    
                    {reviews.length === 0 && (
                      <Typography color="text.secondary">No reviews yet. Be the first to review this pet!</Typography>
                    )}
                  </Box>
                </Box>
              )}
              
              {activeTab === 4 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Similar Pets</Typography>
                  
                  {similarPets.length > 0 ? (
                    <Grid container spacing={2}>
                      {similarPets.map((similarPet) => (
                        <Grid item xs={12} sm={6} md={3} key={similarPet._id}>
                          <Card 
                            sx={{ cursor: 'pointer' }}
                            onClick={() => {
                              // Navigate to the similar pet's details page
                              navigate(`/User/petshop/pet/${similarPet._id}`);
                              // Reload the page to show the new pet
                              window.location.reload();
                            }}
                          >
                            <CardMedia
                              component="img"
                              height="140"
                              image={resolveMediaUrl(similarPet.images?.[0]?.url) || '/placeholder-pet.svg'}
                              alt={similarPet.name || 'Pet'}
                              sx={{ objectFit: 'cover' }}
                            />
                            <CardContent>
                              <Typography variant="subtitle1" component="div">
                                {similarPet.name || 'Unnamed Pet'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {similarPet.breedId?.name || 'Breed'}
                              </Typography>
                              <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                                ₹{similarPet.price?.toLocaleString() || 'N/A'}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography color="text.secondary">No similar pets found.</Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Right Column - Store Info and Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ width: 56, height: 56, mr: 2, bgcolor: 'primary.main' }}>
                  <PetsIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{pet.storeName || 'Pet Shop'}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <VerifiedIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      Verified Store
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocationIcon sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="body2">
                  {pet.store?.address?.street}, {pet.store?.address?.city}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PhoneIcon sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="body2">
                  {pet.store?.phone || 'Not provided'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EmailIcon sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="body2">
                  {pet.store?.email || 'Not provided'}
                </Typography>
              </Box>
              
              <Button 
                variant="outlined" 
                fullWidth
                sx={{ mb: 2 }}
                onClick={() => navigate(`/User/petshop/shop/${pet.storeId}`)}
              >
                Visit Store
              </Button>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>Reservation Benefits</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckIcon sx={{ color: 'success.main', mr: 1, fontSize: 20 }} />
                  <Typography variant="body2">Guaranteed availability</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckIcon sx={{ color: 'success.main', mr: 1, fontSize: 20 }} />
                  <Typography variant="body2">Personal consultation</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckIcon sx={{ color: 'success.main', mr: 1, fontSize: 20 }} />
                  <Typography variant="body2">Flexible payment options</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckIcon sx={{ color: 'success.main', mr: 1, fontSize: 20 }} />
                  <Typography variant="body2">Post-adoption support</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Need Help?</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Have questions about this pet or the reservation process?
              </Typography>
              <Button 
                variant="outlined" 
                fullWidth
                startIcon={<PhoneIcon />}
                sx={{ mb: 1 }}
              >
                Call Store
              </Button>
              <Button 
                variant="outlined" 
                fullWidth
                startIcon={<SupportIcon />}
              >
                Chat with Support
              </Button>
            </CardContent>
          </Card>
          
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShippingIcon sx={{ fontSize: 32, color: 'primary.main', mr: 1 }} />
                <Typography variant="h6">Delivery Options</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Available for pets with special arrangements. Contact store for details.
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                disabled
              >
                Check Availability
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Reservation Dialog */}
      <Dialog 
        open={reservationDialogOpen} 
        onClose={() => setReservationDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Reserve {pet?.name || 'Pet'}
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={reservationStep} orientation="vertical">
            {reservationSteps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  {index === 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body1" gutterBottom>
                        Choose your preferred purchase method:
                      </Typography>
                      <Button
                        variant={reservationData.purchaseMethod === 'online' ? 'contained' : 'outlined'}
                        onClick={() => setReservationData(prev => ({
                          ...prev,
                          purchaseMethod: 'online'
                        }))}
                        fullWidth
                        sx={{ mb: 1, justifyContent: 'flex-start' }}
                      >
                        <Box sx={{ textAlign: 'left' }}>
                          <Typography variant="subtitle1">Online Purchase</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Reserve online and pay through our secure payment gateway
                          </Typography>
                        </Box>
                      </Button>
                      <Button
                        variant={reservationData.purchaseMethod === 'offline' ? 'contained' : 'outlined'}
                        onClick={() => setReservationData(prev => ({
                          ...prev,
                          purchaseMethod: 'offline'
                        }))}
                        fullWidth
                        sx={{ justifyContent: 'flex-start' }}
                      >
                        <Box sx={{ textAlign: 'left' }}>
                          <Typography variant="subtitle1">Offline Purchase</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Reserve and visit the store to complete the purchase
                          </Typography>
                        </Box>
                      </Button>
                    </Box>
                  )}
                  
                  {index === 1 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" gutterBottom>Contact Information</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Full Name"
                            value={reservationData.contactInfo.name}
                            onChange={(e) => setReservationData(prev => ({
                              ...prev,
                              contactInfo: { ...prev.contactInfo, name: e.target.value }
                            }))}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={reservationData.contactInfo.email}
                            onChange={(e) => setReservationData(prev => ({
                              ...prev,
                              contactInfo: { ...prev.contactInfo, email: e.target.value }
                            }))}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Phone Number"
                            value={reservationData.contactInfo.phone}
                            onChange={(e) => setReservationData(prev => ({
                              ...prev,
                              contactInfo: { ...prev.contactInfo, phone: e.target.value }
                            }))}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                  
                  {index === 2 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" gutterBottom>Reservation Type</Typography>
                      <Button
                        variant={reservationData.reservationType === 'visit' ? 'contained' : 'outlined'}
                        onClick={() => setReservationData(prev => ({
                          ...prev,
                          reservationType: 'visit'
                        }))}
                        fullWidth
                        sx={{ mb: 2, justifyContent: 'flex-start' }}
                      >
                        <Box sx={{ textAlign: 'left' }}>
                          <Typography variant="subtitle1">Visit Store</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Schedule a visit to meet the pet at the store
                          </Typography>
                        </Box>
                      </Button>
                      
                      {reservationData.reservationType === 'visit' && (
                        <Box sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Preferred Date"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={reservationData.visitDetails.preferredDate}
                                onChange={(e) => setReservationData(prev => ({
                                  ...prev,
                                  visitDetails: { ...prev.visitDetails, preferredDate: e.target.value }
                                }))}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Preferred Time"
                                select
                                value={reservationData.visitDetails.preferredTime}
                                onChange={(e) => setReservationData(prev => ({
                                  ...prev,
                                  visitDetails: { ...prev.visitDetails, preferredTime: e.target.value }
                                }))}
                              >
                                <MenuItem value="morning">Morning (9 AM - 12 PM)</MenuItem>
                                <MenuItem value="afternoon">Afternoon (12 PM - 5 PM)</MenuItem>
                                <MenuItem value="evening">Evening (5 PM - 8 PM)</MenuItem>
                              </TextField>
                            </Grid>
                          </Grid>
                        </Box>
                      )}
                    </Box>
                  )}
                  
                  {index === 3 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" gutterBottom>Communication Preferences</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Preferred Contact Method"
                            select
                            value={reservationData.communicationPreferences.preferredMethod}
                            onChange={(e) => setReservationData(prev => ({
                              ...prev,
                              communicationPreferences: { 
                                ...prev.communicationPreferences, 
                                preferredMethod: e.target.value 
                              }
                            }))}
                          >
                            <MenuItem value="email">Email</MenuItem>
                            <MenuItem value="phone">Phone</MenuItem>
                            <MenuItem value="both">Both</MenuItem>
                          </TextField>
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Notification Frequency"
                            select
                            value={reservationData.communicationPreferences.notificationFrequency}
                            onChange={(e) => setReservationData(prev => ({
                              ...prev,
                              communicationPreferences: { 
                                ...prev.communicationPreferences, 
                                notificationFrequency: e.target.value 
                              }
                            }))}
                          >
                            <MenuItem value="immediate">Immediate</MenuItem>
                            <MenuItem value="daily">Daily Digest</MenuItem>
                            <MenuItem value="weekly">Weekly Summary</MenuItem>
                          </TextField>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                  
                  {index === 4 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" gutterBottom>Review Your Reservation</Typography>
                      <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            <strong>Pet:</strong> {pet?.name}
                          </Typography>
                          <Typography><strong>Price:</strong> ₹{pet?.price?.toLocaleString()}</Typography>
                          <Typography><strong>Purchase Method:</strong> {reservationData.purchaseMethod}</Typography>
                          <Typography><strong>Reservation Type:</strong> {reservationData.reservationType}</Typography>
                          {reservationData.reservationType === 'visit' && (
                            <>
                              <Typography><strong>Visit Date:</strong> {reservationData.visitDetails.preferredDate}</Typography>
                              <Typography><strong>Visit Time:</strong> {reservationData.visitDetails.preferredTime}</Typography>
                            </>
                          )}
                          <Typography><strong>Contact:</strong> {reservationData.contactInfo.name} ({reservationData.contactInfo.email}, {reservationData.contactInfo.phone})</Typography>
                        </CardContent>
                      </Card>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Additional Notes"
                        value={reservationData.notes}
                        onChange={(e) => setReservationData(prev => ({
                          ...prev,
                          notes: e.target.value
                        }))}
                      />
                    </Box>
                  )}
                  
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => {
                        if (index === reservationSteps.length - 1) {
                          handleReservationSubmit()
                        } else {
                          handleReservationNext()
                        }
                      }}
                      sx={{ mr: 1 }}
                    >
                      {index === reservationSteps.length - 1 ? 'Submit Reservation' : 'Continue'}
                    </Button>
                    <Button
                      disabled={index === 0}
                      onClick={handleReservationBack}
                    >
                      Back
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReservationDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default EnhancedPetDetails