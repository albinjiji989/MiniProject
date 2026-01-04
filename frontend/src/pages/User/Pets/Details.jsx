import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTheme, alpha } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Container,
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  Cake as CakeIcon,
  ArrowBack as BackIcon,
  MoreVert as MoreVertIcon,
  Pets as PetsIcon,
  CalendarToday as CalendarIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Help as HelpIcon,
  MedicalInformation as MedicalIcon,
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { apiClient, petsAPI, userPetsAPI, petShopAPI, resolveMediaUrl } from '../../../services/api';

const UserPetDetails = () => {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [pet, setPet] = useState(null)
  const [petType, setPetType] = useState(null) // 'user' or 'centralized'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [medicalHistory, setMedicalHistory] = useState([])
  const [medicalHistoryLoading, setMedicalHistoryLoading] = useState(false)
  const [showBirthdayDialog, setShowBirthdayDialog] = useState(false);
  const [birthdayPreference, setBirthdayPreference] = useState(null);
  const [preferredBirthday, setPreferredBirthday] = useState('');
  const [birthdayLoading, setBirthdayLoading] = useState(false);
  const [birthdayError, setBirthdayError] = useState('');
  const [birthdaySuccess, setBirthdaySuccess] = useState('');
  
  const loadPetDetails = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log(`🔍 Fetching pet with ID: ${id} for user: ${localStorage.getItem('userId') || 'unknown'}`)
      
      // Check if the ID is a petCode format (3 letters + 5 digits)
      if (/^[A-Z]{3}\d{5}$/.test(id)) {
        // If ID looks like a petCode, try centralized registry first
        try {
          const res = await apiClient.get(`/pets/centralized/${id}`)
          const petData = res.data?.data?.pet || res.data?.data || res.data
          console.log('✅ Pet data received from centralized registry by petCode:', {
            petData,
            images: petData?.images,
            imagesCount: petData?.images?.length || 0,
            imageIds: petData?.imageIds,
            imageIdsCount: petData?.imageIds?.length || 0
          })
          setPet(petData)
          setPetType('centralized')
          
          // Load medical history
          loadMedicalHistory()
          return
        } catch (centralizedError) {
          console.log('❌ Pet not found in centralized registry by petCode:', centralizedError.message)
        }
      }
      
      // Try to get the pet from the core Pet table first
      try {
        const res = await apiClient.get(`/pets/${id}`)
        const petData = res.data?.data?.pet || res.data?.data || res.data
        console.log('✅ Pet data received from core Pet table:', {
          petData,
          images: petData?.images,
          imagesCount: petData?.images?.length || 0,
          imageIds: petData?.imageIds,
          imageIdsCount: petData?.imageIds?.length || 0
        })
        setPet(petData)
        setPetType('user')
        
        // Load medical history
        loadMedicalHistory()
        return
      } catch (corePetError) {
        console.log('❌ Pet not found in core Pet table, trying other sources:', corePetError.message)
        
        // Check if this might be an adoption pet that has been transferred
        // Try to get the adoption pet to see if it was transferred
        try {
          const adoptionRes = await apiClient.get(`/adoption/user/pets/${id}`)
          const adoptionPetData = adoptionRes.data?.data?.pet || adoptionRes.data?.data || adoptionRes.data
          console.log('🔍 Found adoption pet, checking if transferred:', adoptionPetData)
          
          // If adoption pet exists but is marked as adopted, redirect to the corresponding core pet
          if (adoptionPetData && adoptionPetData.status === 'adopted' && adoptionPetData.adopterUserId) {
            // Try to find the corresponding pet in the centralized registry using the petCode
            if (adoptionPetData.petCode) {
              try {
                const corePetRes = await apiClient.get(`/pets/centralized/${adoptionPetData.petCode}`)
                const corePetData = corePetRes.data?.data?.pet || corePetRes.data?.data || corePetRes.data
                if (corePetData) {
                  console.log('✅ Found corresponding centralized pet, redirecting...')
                  // Update the URL to use the new pet ID
                  navigate(`/User/pets/${corePetData._id}`, { replace: true })
                  return
                }
              } catch (corePetError) {
                console.log('⚠️ No corresponding centralized pet found for petCode:', adoptionPetData.petCode)
              }
            }
          }
          
          // If we have adoption pet data but it's not transferred, use it
          setPet(adoptionPetData)
          setPetType('adoption')
          loadMedicalHistory()
          return
        } catch (adoptionError) {
          console.log('❌ Not an adoption pet, trying centralized registry:', adoptionError.message)
          
          // First try to load from centralized registry (for pets from petshop/adoption)
          try {
            const res = await apiClient.get(`/pets/centralized/${id}`)
            const petData = res.data?.data?.pet || res.data?.data || res.data
            console.log('✅ Pet data received from centralized registry:', {
              petData,
              images: petData?.images,
              imagesCount: petData?.images?.length || 0,
              imageIds: petData?.imageIds,
              imageIdsCount: petData?.imageIds?.length || 0
            })
            setPet(petData)
            setPetType('centralized')
            
            // Load medical history
            loadMedicalHistory()
            return
          } catch (centralizedError) {
            console.log('❌ Failed to load from centralized registry, trying registry by ID:', centralizedError.message)
            // If that fails, try to get from registry by ID
            try {
              const res = await apiClient.get(`/pets/registry/${id}`)
              const petData = res.data?.data?.pet || res.data?.data || res.data
              console.log('✅ Pet data received from registry by ID:', {
                petData,
                images: petData?.images,
                imagesCount: petData?.images?.length || 0,
                imageIds: petData?.imageIds,
                imageIdsCount: petData?.imageIds?.length || 0
              })
              setPet(petData)
              setPetType('centralized')
              
              // Load medical history
              loadMedicalHistory()
              return
            } catch (registryError) {
              console.log('❌ Failed to load from registry by ID, trying userPetsAPI:', registryError.message)
              // If that fails, try userPetsAPI (for user-created pets)
              try {
                const res = await userPetsAPI.get(id)
                const petData = res.data?.data || res.data?.pet || res.data
                console.log('✅ Pet data received from userPetsAPI:', {
                  petData,
                  images: petData?.images,
                  imagesCount: petData?.images?.length || 0,
                  imageIds: petData?.imageIds,
                  imageIdsCount: petData?.imageIds?.length || 0
                })
                setPet(petData)
                setPetType('user')
                
                // Load medical history
                loadMedicalHistory()
                return
              } catch (userError) {
                console.log('❌ Failed to load from userPetsAPI:', userError.message);
                // Last resort: check if this might be a petshop item ID
                try {
                  const listingRes = await petShopAPI.getPublicListing(id);
                  const listing = listingRes.data?.data?.item || listingRes.data?.data || listingRes.data;
                  if (listing && listing._id) {
                    console.log('💡 Found petshop listing, using listing data directly');
                    // Use the listing data directly
                    setPet(listing);
                    setPetType('centralized');
                    
                    // Load medical history
                    loadMedicalHistory();
                    return;
                  }
                } catch (listingError) {
                  console.log('Petshop listing check failed:', listingError.message);
                }
                
                // Check if this is a purchased pet from petshop
                try {
                  const purchasedPetsRes = await petShopAPI.getMyPurchasedPets();
                  const purchasedPets = purchasedPetsRes.data?.data?.pets || [];
                  const purchasedPet = purchasedPets.find(pet => pet._id === id || pet.petCode === id);
                  
                  if (purchasedPet) {
                    console.log('💡 Found purchased pet, using purchased pet data directly');
                    // Use the purchased pet data directly
                    setPet(purchasedPet);
                    setPetType('centralized');
                    
                    // Load medical history
                    loadMedicalHistory();
                    return;
                  }
                } catch (purchasedError) {
                  console.log('Purchased pet check failed:', purchasedError.message);
                }
                
                // Pet code lookup already attempted at the beginning of this function
                
                console.log('❌ Pet not found for ID:', id)
                throw new Error('Pet not found in any system. Please check the ID or contact support.')
              }
            }
          }
        }
      }
    } catch (e) {
      setError(e?.message || 'Failed to load pet. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const loadMedicalHistory = async () => {
    try {
      setMedicalHistoryLoading(true)
      // Use the appropriate API based on pet type
      if (petType === 'user') {
        // For user pets, directly load medical history from userPetsAPI
        try {
          const res = await userPetsAPI.getMedicalHistory(id)
          setMedicalHistory(res.data?.data?.medicalHistory || [])
        } catch (error) {
          console.log('Failed to load medical history from userPetsAPI:', error)
          setMedicalHistory([])
        }
      } else {
        // For centralized pets (including petshop), try centralized registry first
        try {
          const res = await apiClient.get(`/pets/history/${id}`)
          setMedicalHistory(res.data?.data?.history || res.data?.data?.medicalHistory || [])
        } catch (centralizedError) {
          // For petshop pets, try the petshop specific endpoint
          if (pet?.source === 'petshop') {
            try {
              // Petshop pets might not have medical history yet, so we'll set an empty array
              setMedicalHistory([])
            } catch (petshopError) {
              console.log('Failed to load medical history from petshop API:', petshopError)
              setMedicalHistory([])
            }
          } else {
            // Fall back to userPetsAPI for other centralized pets
            try {
              const res = await userPetsAPI.getMedicalHistory(id)
              setMedicalHistory(res.data?.data?.medicalHistory || [])
            } catch (userError) {
              console.log('Failed to load medical history from both APIs:', { centralizedError, userError })
              setMedicalHistory([])
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to load medical history:', e)
      setMedicalHistory([])
    } finally {
      setMedicalHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadPetDetails()
  }, [id])

  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
  }

  const handleEdit = () => {
    handleMenuClose()
    // Determine which edit route to use based on pet type and URL path
    if (petType === 'user' || location.pathname.includes('/pets/centralized/')) {
      // User-created pet or centralized pet (no edit available)
      // For centralized pets, we don't allow direct editing since they come from other sources
      if (location.pathname.includes('/pets/centralized/')) {
        // For centralized pets, we might want to redirect to a different view or show a message
        // For now, let's just show a message or do nothing
        console.log('Cannot edit centralized pet directly');
        return;
      } else {
        navigate(`/User/pets/${id}/edit`)
      }
    } else {
      // Pet from petshop or adoption
      navigate(`/User/pets/${id}/edit-basic`)
    }
  }

  const handleDeleteClick = () => {
    handleMenuClose()
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true)
      setDeleteError('')
      
      // Check if pet is accessed via centralized route
      if (location.pathname.includes('/pets/centralized/')) {
        setDeleteError('Centralized pets cannot be deleted directly. They are managed in their respective systems.');
        return;
      }
      
      // Only user-created pets can be deleted
      if (pet?.source === 'core' || !pet?.source) {
        await userPetsAPI.delete(id)
        navigate('/User/pets', { state: { message: 'Pet deleted successfully' } })
      } else {
        setDeleteError('Only manually added pets can be deleted. Pets from pet shop or adoption cannot be deleted.')
      }
    } catch (e) {
      setDeleteError(e?.response?.data?.message || 'Failed to delete pet')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setDeleteError('')
  }

  const getPrimaryImageUrl = () => {
    try {
      console.log('🔍 Getting primary image URL for pet:', {
        name: pet?.name,
        petCode: pet?.petCode,
        images: pet?.images,
        imagesCount: pet?.images?.length || 0,
        imageIds: pet?.imageIds,
        imageIdsCount: pet?.imageIds?.length || 0
      });
      
      // First check if we have populated images array
      if (pet.images && Array.isArray(pet.images) && pet.images.length > 0) {
        const primaryImage = pet.images.find(img => img?.isPrimary) || pet.images[0];
        console.log('🖼️ Selected primary image from images array:', primaryImage);
        if (primaryImage?.url) {
          const url = resolveMediaUrl(primaryImage.url);
          console.log('✅ Resolved image URL from images array:', url);
          return url;
        } else {
          console.log('⚠️ Primary image found but no URL in images array:', primaryImage);
        }
      } 
      // If no images array, check if we have imageIds that contain actual image data
      else if (pet.imageIds && Array.isArray(pet.imageIds) && pet.imageIds.length > 0) {
        console.log('🖼️ Checking imageIds for image data...');
        
        // Check the first item in imageIds to see what it contains
        const firstItem = pet.imageIds[0];
        console.log('First imageIds item:', firstItem);
        
        // If imageIds contains full image objects with urls
        if (firstItem && typeof firstItem === 'object' && firstItem.url) {
          const primaryImage = pet.imageIds.find(img => img?.isPrimary) || pet.imageIds[0];
          console.log('🖼️ Selected primary image from imageIds:', primaryImage);
          if (primaryImage?.url) {
            const url = resolveMediaUrl(primaryImage.url);
            console.log('✅ Resolved image URL from imageIds (full objects):', url);
            return url;
          }
        }
        // If imageIds contains just strings or ObjectIds
        else if (typeof firstItem === 'string' || (firstItem && firstItem.constructor && firstItem.constructor.name === 'ObjectID')) {
          console.log('⚠️ imageIds contains ObjectIds or strings, need backend to populate images');
        } else {
          console.log('⚠️ imageIds content type unknown:', typeof firstItem, firstItem);
          // Sometimes imageIds might contain the image data directly in a different format
          console.log('Full imageIds content:', pet.imageIds);
        }
      }
      
      console.log('⚠️ No usable images found in pet object');
    } catch (error) {
      console.error('❌ Error getting primary image URL:', error);
    }
    console.log('🔄 Returning placeholder image');
    return '/placeholder-pet.svg';
  };

  const getGenderIcon = (gender) => {
    switch (gender?.toLowerCase()) {
      case 'male':
        return <MaleIcon sx={{ fontSize: 18, color: 'primary.main' }} />
      case 'female':
        return <FemaleIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
      default:
        return <HelpIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
    }
  }

  const handleSetBirthday = () => {
    setPreferredBirthday('');
    setBirthdayError('');
    setBirthdaySuccess('');
    setShowBirthdayDialog(true);
  };

  const handleSubmitPreference = async () => {
    if (!preferredBirthday) {
      setBirthdayError('Please select a preferred birthday');
      return;
    }

    if (preferredBirthday < 1 || preferredBirthday > 31) {
      setBirthdayError('Preferred birthday must be between 1 and 31');
      return;
    }

    setBirthdayLoading(true);
    setBirthdayError('');
    setBirthdaySuccess('');

    try {
      // Determine the pet model type
      let petModel = 'Pet';
      if (pet?.source === 'adoption') {
        petModel = 'AdoptionPet';
      } else if (pet?.source === 'petshop') {
        petModel = 'PetInventoryItem';
      } else if (pet?.tags?.includes('user-added')) {
        petModel = 'PetNew';
      }

      const response = await apiClient.post('/pets/birthday-preference', {
        petId: pet._id,
        petModel: petModel,
        currentAge: {
          value: pet.age,
          unit: pet.ageUnit || 'months'
        },
        preferredBirthday: parseInt(preferredBirthday)
      });

      if (response.data.success) {
        setBirthdaySuccess('Birthday preference set successfully!');
        setBirthdayPreference(response.data.data.preference);
        // Reload pet details to update age calculation
        loadPetDetails();
        // Close dialog after 1.5 seconds
        setTimeout(() => {
          setShowBirthdayDialog(false);
        }, 1500);
      } else {
        setBirthdayError(response.data.message || 'Failed to set birthday preference');
      }
    } catch (err) {
      setBirthdayError(err.response?.data?.message || 'Failed to set birthday preference');
    } finally {
      setBirthdayLoading(false);
    }
  };

  // Helper function to get ordinal suffix
  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/User/pets')}>
          Back to Pets
        </Button>
      </Container>
    )
  }

  if (!pet) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>Pet not found</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/User/pets')}>
          Back to Pets
        </Button>
      </Container>
    )
  }

  return (
    <Container sx={{ py: { xs: 2, sm: 4 } }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2
      }}>
        <Button 
          variant="outlined" 
          startIcon={<BackIcon />} 
          onClick={() => navigate('/User/pets')}
          sx={{ alignSelf: 'flex-start' }}
        >
          Back to My Pets
        </Button>
        <IconButton 
          onClick={handleMenuOpen}
          sx={{ 
            bgcolor: 'background.paper',
            boxShadow: 2,
            '&:hover': { bgcolor: 'background.paper' }
          }}
        >
          <MoreVertIcon />
        </IconButton>
      </Box>

      <Card sx={{ mb: 3, boxShadow: 4 }}>
        <CardContent>
          <Grid container spacing={4}>
            {/* Pet Image */}
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 200,
                    height: 200,
                    margin: '0 auto 16px',
                    border: `6px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    boxShadow: 4,
                    bgcolor: 'background.paper'
                  }}
                  src={getPrimaryImageUrl()}
                  onError={(e) => { e.currentTarget.src = '/placeholder-pet.svg' }}
                >
                  <PetsIcon sx={{ fontSize: 80, color: 'primary.main' }} />
                </Avatar>
                
                {pet.currentStatus && (
                  <Chip 
                    label={pet.currentStatus} 
                    color={pet.currentStatus === 'Available' ? 'success' : 'default'}
                    size="medium"
                    sx={{ 
                      fontWeight: 700,
                      fontSize: '1rem',
                      height: 32
                    }}
                  />
                )}
              </Box>
            </Grid>
            
            {/* Pet Details */}
            <Grid item xs={12} md={8}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  {pet.name}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getGenderIcon(pet.gender)}
                    <Typography variant="h6" color="text.secondary">
                      {pet.gender || 'Unknown'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="h6" color="text.secondary">
                      {pet.age || '-'} {pet.ageUnit || 'months'}
                    </Typography>
                  </Box>
                </Box>
                
                {pet.petCode && (
                  <Box sx={{ 
                    display: 'inline-block',
                    p: 1,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: 1,
                    mb: 2
                  }}>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      Pet Code: {pet.petCode}
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Species</Typography>
                  <Typography variant="h6">
                    {pet.species && typeof pet.species === 'object' 
                      ? (pet.species.displayName || pet.species.name || '-') 
                      : (pet.species || '-')}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Breed</Typography>
                  <Typography variant="h6">
                    {pet.breed && typeof pet.breed === 'object' 
                      ? (pet.breed.name || '-') 
                      : (pet.breed || '-')}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Color</Typography>
                  <Typography variant="h6">{pet.color || '-'}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Health Status</Typography>
                  <Typography variant="h6">{pet.healthStatus || '-'}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Size</Typography>
                  <Typography variant="h6">{pet.size || '-'}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Weight</Typography>
                  <Typography variant="h6">
                    {pet.weight?.value ? `${pet.weight.value} ${pet.weight.unit || 'kg'}` : '-'}
                  </Typography>
                </Grid>
              </Grid>
              
              {/* Additional Images (if any) */}
              {pet.images && Array.isArray(pet.images) && pet.images.length > 1 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Additional Photos</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {pet.images
                      .filter(img => img && !img.isPrimary)
                      .map((img, index) => {
                        if (!img?.url) return null;
                        return (
                          <Box
                            key={index}
                            component="img"
                            src={resolveMediaUrl(img.url)}
                            alt={`Additional ${index}`}
                            sx={{
                              width: 80,
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              // Could implement a lightbox here
                            }}
                            onError={(e) => { e.currentTarget.src = '/placeholder-pet.svg' }}
                          />
                        );
                      })
                    }
                  </Box>
                </Box>
              )}
                              
              {/* Documents Section for Adoption Pets */}
              {pet.source === 'adoption' && pet.documents && Array.isArray(pet.documents) && pet.documents.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Documents</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {pet.documents.map((doc, index) => {
                      if (!doc?.url) return null;
                      return (
                        <Box
                          key={index}
                          sx={{
                            p: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            minWidth: 120,
                            textAlign: 'center'
                          }}
                        >
                          <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                            {doc.type || `Document ${index + 1}`}
                          </Typography>
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => window.open(resolveMediaUrl(doc.url), '_blank')}
                            sx={{ fontSize: '0.7rem' }}
                          >
                            View
                          </Button>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}
                              
              {/* Source-specific Additional Information */}
              {pet.source === 'adoption' && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Adoption Information</Typography>
                  <Grid container spacing={2}>
                    {pet.adoptionDate && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Adoption Date</Typography>
                        <Typography variant="h6">{new Date(pet.adoptionDate).toLocaleDateString()}</Typography>
                      </Grid>
                    )}
                    {pet.adoptionFee && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Adoption Fee</Typography>
                        <Typography variant="h6">${pet.adoptionFee}</Typography>
                      </Grid>
                    )}
                    {pet.adoptionStatus && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Adoption Status</Typography>
                        <Typography variant="h6">{pet.adoptionStatus}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
                              
              {pet.source === 'petshop' && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Pet Shop Information</Typography>
                  <Grid container spacing={2}>
                    {pet.purchaseDate && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Purchase Date</Typography>
                        <Typography variant="h6">{new Date(pet.purchaseDate).toLocaleDateString()}</Typography>
                      </Grid>
                    )}
                    {pet.purchasePrice && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Purchase Price</Typography>
                        <Typography variant="h6">${pet.purchasePrice}</Typography>
                      </Grid>
                    )}
                    {pet.petShopName && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">Pet Shop</Typography>
                        <Typography variant="h6">{pet.petShopName}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Source-specific Additional Details */}
      {pet.source === 'adoption' && pet.description && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>About This Pet</Typography>
            <Typography variant="body1">{pet.description}</Typography>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        flexWrap: 'wrap'
      }}>
        <Button 
          variant="contained"
          startIcon={<MedicalIcon />}
          onClick={() => {
            // Determine which medical history route to use based on pet type
            if (petType === 'user') {
              // User-created pet
              navigate(`/User/pets/${id}/medical-history?petType=user`)
            } else {
              // Pet from petshop or adoption - use the centralized API
              navigate(`/User/pets/${id}/medical-history?petType=centralized`)
            }
          }}
          size="large"
          fullWidth={isMobile}
        >
          Add Medical Record
        </Button>
        <Button 
          variant="outlined"
          startIcon={<HistoryIcon />}
          onClick={() => {
            // Determine which history route to use based on pet type
            if (petType === 'user') {
              // User-created pet
              navigate(`/User/pets/${id}/history?petType=user`)
            } else {
              // Pet from petshop or adoption
              navigate(`/User/pets/${id}/history?petType=centralized`)
            }
          }}
          size="large"
          fullWidth={isMobile}
        >
          View Full History
        </Button>
        
        {/* Source-specific actions */}
        {pet.source === 'adoption' && (
          <Button 
            variant="outlined"
            startIcon={<PetsIcon />}
            onClick={() => {
              // Navigate to adoption application details
              navigate(`/user/adoption/applications/${pet.adoptionApplicationId || pet._id}`);
            }}
            size="large"
            fullWidth={isMobile}
          >
            View Adoption Application
          </Button>
        )}
      </Box>

      {/* Medical History Section */}
      <Card sx={{ mb: 3, boxShadow: 2 }}>
        <CardContent>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Medical History ({medicalHistory.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {medicalHistoryLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : medicalHistory.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <MedicalIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">No medical history records found.</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add your first medical record using the button above.
                  </Typography>
                </Box>
              ) : (
                <List>
                  {medicalHistory.map((record, index) => (
                    <React.Fragment key={index}>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {record.description}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography component="span" variant="body1" color="text.primary" sx={{ display: 'block', mb: 0.5 }}>
                                {record.veterinarian}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography component="span" variant="body2" color="text.secondary">
                                  {record.date ? new Date(record.date).toLocaleDateString() : 'Date not specified'}
                                </Typography>
                              </Box>
                            </>
                          }
                        />
                      </ListItem>
                      {index < medicalHistory.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>
      
      {/* Birthday Preference Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Birthday Preference</Typography>
            {!birthdayPreference && (
              <Button 
                variant="outlined" 
                size="small"
                onClick={handleSetBirthday}
              >
                Set Birthday Preference
              </Button>
            )}
          </Box>
          
          {birthdayPreference ? (
            <Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Preferred Birthday:</strong> {birthdayPreference.preferredBirthday}
                {getOrdinalSuffix(birthdayPreference.preferredBirthday)} of the month
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Calculated Birth Date:</strong> {new Date(birthdayPreference.calculatedBirthDate).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your pet's age will automatically update based on this birth date.
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You haven't set a birthday preference for {pet?.name}. Setting a preferred birthday 
                will allow us to automatically calculate and update your pet's age.
              </Typography>
              <Button 
                variant="contained" 
                onClick={handleSetBirthday}
              >
                Set Birthday Preference
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* Birthday Preference Dialog */}
      <Dialog open={showBirthdayDialog} onClose={() => setShowBirthdayDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Set Pet Birthday Preference</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {birthdayError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {birthdayError}
              </Alert>
            )}
            {birthdaySuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {birthdaySuccess}
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
                disabled={birthdayLoading || birthdaySuccess}
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
          <Button onClick={() => setShowBirthdayDialog(false)} disabled={birthdayLoading || birthdaySuccess}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitPreference} 
            variant="contained" 
            disabled={birthdayLoading || !preferredBirthday || birthdaySuccess}
            startIcon={birthdayLoading ? <CircularProgress size={20} /> : null}
          >
            {birthdayLoading ? 'Setting...' : birthdaySuccess ? 'Done' : 'Set Birthday'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 2 }} />
          Edit Pet
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <DeleteIcon sx={{ mr: 2 }} />
          Delete Pet
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Delete Pet?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this pet? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            {deleting ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default UserPetDetails
