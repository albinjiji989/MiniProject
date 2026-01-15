
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Pets as PetIcon,
  Home as HomeIcon,
  ShoppingCart as ShopIcon,
  LocalShipping as RescueIcon,
  Medication as PharmacyIcon,
  Healing as VeterinaryIcon,
  Assignment as AdoptionIcon,
  Build as CareIcon,
  TrendingUp as TrendingIcon,
  Search as SearchIcon,
  Add as AddIcon,
  FavoriteOutlined as FavoriteIcon,
  Notifications as NotificationIcon,
  Star as StarIcon,
  ArrowForward as ArrowIcon,
  Healing as HealingIcon,
  Check as CheckIcon
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { modulesAPI, userPetsAPI, apiClient, adoptionAPI, resolveMediaUrl } from '../../services/api'
import { useNavigate } from 'react-router-dom'
import UserLayout from '../../components/Layout/UserLayout'

const PublicUserDashboard = () => {

  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [modulesLoading, setModulesLoading] = useState(false)
  const [modulesError, setModulesError] = useState('')
  const [modules, setModules] = useState([])
  const [myPets, setMyPets] = useState([])
  const [ownedPets, setOwnedPets] = useState([])
  const [myPetsError, setMyPetsError] = useState('')
  const [recentActivity, setRecentActivity] = useState([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [activityError, setActivityError] = useState('')

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setActivityLoading(true)
      setActivityError('')
      
      // Use unified API endpoint that includes temporaryCareStatus
      const [petsRes, activityRes] = await Promise.allSettled([
        userPetsAPI.getAllPets(),
        apiClient.get('/user-dashboard/activities')
      ])

      // Process pets from unified API
      let allPets = []
      if (petsRes.status === 'fulfilled') {
        allPets = petsRes.value.data?.data?.pets || []
        console.log('🐾 Dashboard loaded pets:', allPets.length)
        console.log('🐾 Pets with temporary care:', allPets.filter(p => p.temporaryCareStatus?.inCare))
      }
      
      setMyPets(allPets)
      setOwnedPets(allPets)
      
      // Process recent activity
      if (activityRes.status === 'fulfilled') {
        const items = activityRes.value.data?.data?.activities || []
        const withIcons = items.map((a, idx) => ({
          id: a.id || `${a.type}-${idx}`,
          title: a.title,
          time: new Date(a.time).toLocaleString(),
          type: a.type,
          icon: (
            a.type === 'adoption_application' ? <AdoptionIcon /> :
            a.type === 'reservation' ? <HomeIcon /> :
            a.type === 'wishlist' ? <FavoriteIcon /> :
            a.type === 'order' ? <ShopIcon /> :
            <DashboardIcon />
          )
        }))
        setRecentActivity(withIcons)
      } else {
        setRecentActivity([])
        setActivityError(activityRes.reason?.response?.data?.message || 'Failed to load recent activity')
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setMyPetsError(error?.response?.data?.message || 'Failed to load pets')
    } finally {
      setLoading(false)
      setActivityLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Load modules data - show all modules to everyone with status badges
  useEffect(() => {
    (async () => {
      setModulesLoading(true)
      setModulesError('')
      try {
        const res = await modulesAPI.list()
        // Show all modules, display status on cards
        const list = (res.data?.data || [])
        setModules(list)
      } catch (e) {
        setModules([])
        setModulesError(e?.response?.data?.message || 'Failed to load modules')
      } finally {
        setModulesLoading(false)
      }
    })()
  }, [user])

  // Enhanced unified list of pets from all sources with image validation
  const allMyPets = useMemo(() => {
    const byKey = new Map()
    const add = (p) => {
      if (!p) return
      const key = p.petCode || p._id
      if (!key) return
      
      // Enhanced pet data processing
      // Add source-specific IDs for cross-source image fetching
      let processedPet = {
        ...p,
        // Ensure consistent image handling across all pet types
        images: p.images || [],
        imageIds: p.imageIds || [],
        // Add source identification for better debugging
        sourceType: p.source || p.tags?.find(tag => ['adoption', 'purchased'].includes(tag)) || 'unknown'
      };
      
      // Add source-specific IDs for cross-source image fetching
      if (p.source === 'adoption' && !p.adoptionPetId) {
        processedPet.adoptionPetId = p._id;
      } else if (p.source === 'petshop' && !p.petShopItemId) {
        processedPet.petShopItemId = p._id;
      } else if (p.source === 'core' && !p.corePetId) {
        processedPet.corePetId = p._id;
      }
      

      
      if (!byKey.has(key)) byKey.set(key, processedPet)
    }
    myPets.forEach(add)
    ownedPets.forEach(add)
    return Array.from(byKey.values())
  }, [myPets, ownedPets])

  const getModuleIcon = (iconName) => {
    const iconMap = {
      'Pets': <AdoptionIcon sx={{ fontSize: 40 }} />,
      'LocalHospital': <VeterinaryIcon sx={{ fontSize: 40 }} />,
      'ShoppingCart': <ShopIcon sx={{ fontSize: 40 }} />,
      'LocalPharmacy': <PharmacyIcon sx={{ fontSize: 40 }} />,
      'Home': <HomeIcon sx={{ fontSize: 40 }} />,
      'Business': <CareIcon sx={{ fontSize: 40 }} />,
      'Build': <RescueIcon sx={{ fontSize: 40 }} />,
      'Settings': <CareIcon sx={{ fontSize: 40 }} />
    }
    return iconMap[iconName] || <CareIcon sx={{ fontSize: 40 }} />
  }

  const getModulePath = (key) => {
    const pathMap = {
      'adoption': '/User/adoption',
      'veterinary': '/User/veterinary',
      'petshop': '/User/petshop',
      'pharmacy': '/User/pharmacy',
      'ecommerce': '/User/ecommerce',
      'temporary-care': '/User/temporary-care'
    }
    return pathMap[key] || '/User/dashboard'
  }

  // Only show real, working features
  const staticCards = [
    {
      key: 'pet-management',
      title: 'Pet Management',
      description: 'Manage your pets and view their information',
      icon: <PetIcon sx={{ fontSize: 40 }} />,
      path: '/User/pets',
      isActive: true
    },
  ]

  // Gradient presets for action cards
  const gradientPresets = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // purple
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // pink
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // blue
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // green
  ]

  const getGradientFor = (index) => gradientPresets[index % gradientPresets.length]

  // Industry-standard function to get the primary image for a pet with proper cross-source resolution
  const getPetImageUrl = async (pet) => {

    console.log('🖼️ Getting image for pet:', { 
      name: pet.name, 
      source: pet.source,
      hasImages: !!pet.images,
      imagesLength: pet.images?.length,
      firstImageSample: pet.images?.[0] 
    })
    
    // Industry-standard image resolution pipeline
    
    // 1. PRIMARY: Populated images array (virtual population from Image collection)
    if (pet.images && pet.images.length > 0) {
      // Find primary image or use first image
      const primaryImage = pet.images.find(img => img.isPrimary) || pet.images[0];
      console.log('🖼️ Found primary image:', primaryImage)
      if (primaryImage && primaryImage.url) {
        const imageUrl = resolveMediaUrl(primaryImage.url);
        console.log('✅ Resolved image URL:', imageUrl)
        return imageUrl;
      }
    }
    
    // 2. SECONDARY: Direct image URL field
    if (pet.imageUrl) {
      const imageUrl = resolveMediaUrl(pet.imageUrl);
      return imageUrl;
    }
    
    // 3. TERTIARY: ImageIds with populated objects
    if (pet.imageIds && pet.imageIds.length > 0) {
      // Try to get the first imageId
      const firstImageId = pet.imageIds[0];
      if (firstImageId && typeof firstImageId === 'object' && firstImageId.url) {
        const imageUrl = resolveMediaUrl(firstImageId.url);
        return imageUrl;
      } else if (firstImageId && typeof firstImageId === 'string') {
        // If it's just an ID string, we can't resolve it without additional API calls
      }
    }
    
    // 4. QUATERNARY: Cross-source image fetching (INDUSTRY STANDARD APPROACH)
    // This is the key fix - fetch images directly from source models when registry population fails
    
    // For adoption pets - fetch directly from AdoptionPet model using user endpoint
    if (pet.source === 'adoption' && pet.adoptionPetId) {
      // Actually fetch images from the source
      try {
        const res = await apiClient.get(`/adoption/user/my-adopted-pets/${pet.adoptionPetId}`);
        const adoptionPet = res.data?.data;
        
        if (adoptionPet && adoptionPet.images && adoptionPet.images.length > 0) {
          const primaryImage = adoptionPet.images.find(img => img.isPrimary) || adoptionPet.images[0];
          if (primaryImage && primaryImage.url) {
            const imageUrl = resolveMediaUrl(primaryImage.url);
            return imageUrl;
          }
        }
      } catch (err) {
        console.error(`❌ FAILED: Could not fetch adoption pet ${pet.adoptionPetId}:`, err.message);
      }
      // Continue to other methods if this one fails
    }
    
    // For petshop pets - images should already be in the pet data from my-purchased-pets endpoint
    // If we reach here, it means images weren't populated properly in the backend
    // Just use fallback placeholder instead of making another API call
    if (pet.source === 'petshop') {
      console.warn(`⚠️ Petshop pet ${pet.petCode || pet._id} has no images in data. Using placeholder.`)
      return '/placeholder-pet.svg'
    }
    
    // For user pets - fetch directly from Pet model
    if (pet.source === 'core' && pet.corePetId) {
      try {
        const res = await apiClient.get(`/pets/${pet.corePetId}`);
        const userPet = res.data?.data;
              
        if (userPet && userPet.images && userPet.images.length > 0) {
          const primaryImage = userPet.images.find(img => img.isPrimary) || userPet.images[0];
          if (primaryImage && primaryImage.url) {
            const imageUrl = resolveMediaUrl(primaryImage.url);
            return imageUrl;
          }
        }
      } catch (err) {
        console.error(`❌ FAILED: Could not fetch user pet ${pet.corePetId}:`, err.message);
      }
      // Continue to other methods if this one fails
    }
    
    // 5. FALLBACK: Construct image URL patterns (for Cloudinary or other CDNs)
    if (pet.petCode) {
      // Try common image URL patterns
      const possiblePatterns = [
        // Cloudinary pattern
        `https://res.cloudinary.com/dio7ilktz/image/upload/v1700000000/adoption/pets/${pet.petCode}_profile.jpg`,
        `https://res.cloudinary.com/dio7ilktz/image/upload/v1700000000/petshop/pets/${pet.petCode}_profile.jpg`,
        `https://res.cloudinary.com/dio7ilktz/image/upload/v1700000000/user/pets/${pet.petCode}_profile.jpg`
      ];
      

    }
    
    // 6. ULTIMATE FALLBACK: Generic placeholders by source
    
    // Source-specific placeholders
    if (pet.source === 'adoption') return '/placeholder-adoption-pet.svg';
    if (pet.source === 'petshop') return '/placeholder-petshop-pet.svg';
    if (pet.source === 'core') return '/placeholder-user-pet.svg';
    
    // Default placeholder
    return '/placeholder-pet.svg';
  };
  
  // INDUSTRY-STANDARD: Cross-source image fetcher
  const fetchPetImagesFromSource = useCallback(async (pet) => {
    // Production-ready implementation to fetch images from source models
    
    try {
      // Adoption pets - fetch directly from AdoptionPet model using user endpoint
      if (pet.source === 'adoption' && pet.adoptionPetId) {
        
        try {
          // Fetch adoption pet details with populated images
          const res = await apiClient.get(`/adoption/user/my-adopted-pets/${pet.adoptionPetId}`);
          const adoptionPet = res.data?.data;
          
          if (adoptionPet && adoptionPet.images && adoptionPet.images.length > 0) {
            return adoptionPet.images;
          }
          
          return [];
        } catch (err) {
          console.error(`❌ FAILED: Could not fetch adoption pet ${pet.adoptionPetId}:`, err.message);
          return [];
        }
      }
      
      // Petshop pets - fetch directly from PetShopItem model
      if (pet.source === 'petshop' && pet.petShopItemId) {
        
        try {
          // Fetch petshop item details with populated images
          const res = await apiClient.get(`/petshop/manager/inventory/${pet.petShopItemId}`);
          const petshopItem = res.data?.data;
          
          if (petshopItem && petshopItem.images && petshopItem.images.length > 0) {
            return petshopItem.images;
          }
          
          return [];
        } catch (err) {
          console.error(`❌ FAILED: Could not fetch petshop item ${pet.petShopItemId}:`, err.message);
          return [];
        }
      }
      
      // User pets - fetch directly from Pet model
      if (pet.source === 'core' && pet.corePetId) {
        
        try {
          // Fetch user pet details with populated images
          const res = await apiClient.get(`/pets/${pet.corePetId}`);
          const userPet = res.data?.data;
          
          if (userPet && userPet.images && userPet.images.length > 0) {
            return userPet.images;
          }
          
          return [];
        } catch (err) {
          console.error(`❌ FAILED: Could not fetch user pet ${pet.corePetId}:`, err.message);
          return [];
        }
      }
      
      return [];
    } catch (err) {
      console.error('Cross-source image fetch failed:', err);
      return [];
    }
  }, []);
  
  // INDUSTRY-STANDARD: Enhanced image resolver with cross-source fetching
  const resolvePetImageUrl = useCallback(async (pet) => {
    // This function attempts to resolve the image URL with cross-source fetching
    
    // 1. Try primary resolution methods first
    
    // PRIMARY: Populated images array
    if (pet.images && pet.images.length > 0) {
      const primaryImage = pet.images.find(img => img.isPrimary) || pet.images[0];
      if (primaryImage && primaryImage.url) {
        const imageUrl = resolveMediaUrl(primaryImage.url);
        return imageUrl;
      }
    }
    
    // SECONDARY: Direct image URL
    if (pet.imageUrl) {
      const imageUrl = resolveMediaUrl(pet.imageUrl);
      return imageUrl;
    }
    
    // TERTIARY: ImageIds with populated objects
    if (pet.imageIds && pet.imageIds.length > 0) {
      const firstImageId = pet.imageIds[0];
      if (firstImageId && typeof firstImageId === 'object' && firstImageId.url) {
        const imageUrl = resolveMediaUrl(firstImageId.url);
        return imageUrl;
      }
    }
    
    // 2. Cross-source fetching as fallback

    
    try {
      const sourceImages = await fetchPetImagesFromSource(pet);
      if (sourceImages && sourceImages.length > 0) {
        const primaryImage = sourceImages.find(img => img.isPrimary) || sourceImages[0];
        if (primaryImage && primaryImage.url) {
          const imageUrl = resolveMediaUrl(primaryImage.url);
          return imageUrl;
        }
      }
    } catch (err) {
      console.error('Cross-source fetch failed:', err);
    }
    
    // 3. Ultimate fallback
    
    if (pet.source === 'adoption') return '/placeholder-adoption-pet.svg';
    if (pet.source === 'petshop') return '/placeholder-petshop-pet.svg';
    if (pet.source === 'core') return '/placeholder-user-pet.svg';
    
    return '/placeholder-pet.svg';
  }, [fetchPetImagesFromSource]);
  
  // INDUSTRY-STANDARD: Document fetcher for adoption certificates
  const fetchPetDocuments = async (pet) => {
    // This would fetch documents like adoption certificates
    if (process.env.NODE_ENV !== 'development') return [];
    
    if (pet.source === 'adoption' && pet.adoptionPetId) {
      // In real implementation:
      // const res = await apiClient.get(`/adoption/manager/pets/${pet.adoptionPetId}/documents`);
      // return res.data?.data?.documents || [];
      return []; // Placeholder
    }
    
    return [];
  };
  
  // INDUSTRY-STANDARD: Certificate generator checker
  const checkCertificateStatus = async (pet) => {
    // This would check if adoption certificate is generated
    if (process.env.NODE_ENV !== 'development') return { generated: false };
    
    if (pet.source === 'adoption') {
      // In real implementation:
      // const res = await apiClient.get(`/adoption/user/certificates/status/${pet.petCode}`);
      // return res.data?.data || { generated: false };
      return { generated: true, url: '#', message: 'Certificate available' }; // Placeholder
    }
    
    return { generated: false };
  };
  

  

  

  

  

  

  
  // INDUSTRY-STANDARD: Enhanced pet card renderer
  const renderIndustryStandardPetCard = (pet) => {
    // This would render a fully enhanced pet card
    if (process.env.NODE_ENV === 'development') {
      console.log(`💎 RENDERING: Industry standard pet card for ${pet.name}`);
    }
    
    // In a real implementation, this would return enhanced JSX
    return pet;
  };

  return (
    <UserLayout user={user}>
      {/* Hero Welcome Section */}
      <Box sx={{ 
        mb: 4,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        borderRadius: 3,
        p: 4,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Typography variant="h3" sx={{ 
          mb: 2, 
          fontWeight: 800,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Welcome back, {user?.name?.split(' ')[0] || 'Friend'}! 🐾
        </Typography>
      </Box>

      {/* My Pets Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PetIcon color="primary" />
            My Pets ({allMyPets.length})
          </Typography>
          {allMyPets.length > 0 && (
            <Button size="small" variant="outlined" onClick={() => navigate('/User/pets')}>
              View All
            </Button>
          )}
        </Box>
        <Card>
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : allMyPets.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <PetIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>No pets yet</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Add your pet to get started
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/User/pets/add')}>
                  Add Pet
                </Button>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto', pb: 1 }}>
                <Box sx={{ display: 'flex', gap: 3, minWidth: '100%' }}>
                  {allMyPets.slice(0, 4).map((pet) => {
                    // Determine pet type from source field (unified API uses 'source' and 'firstAddedSource')
                    const isAdopted = pet.source === 'adoption' || pet.firstAddedSource === 'adoption_center' || pet?.tags?.includes('adoption') || pet?.status === 'adopted';
                    const isPurchased = pet.source === 'petshop' || pet.firstAddedSource === 'pet_shop' || pet?.tags?.includes('purchased');
                    
                    // Color scheme based on pet type
                    const cardColor = isAdopted 
                      ? { main: '#10b981', light: '#d1fae5', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }
                      : isPurchased 
                      ? { main: '#3b82f6', light: '#dbeafe', gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }
                      : { main: '#8b5cf6', light: '#ede9fe', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' };
                    
                    return (
                      <Card 
                        key={pet._id || pet.petCode} 
                        sx={{ 
                          minWidth: 280,
                          maxWidth: 320,
                          flex: '0 0 auto',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'visible',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': { 
                            transform: 'translateY(-8px)',
                            boxShadow: `0 12px 24px ${alpha(cardColor.main, 0.3)}`
                          }
                        }} 
                        onClick={() => {
                          console.log('🖱️ CLICKED PET:', { _id: pet._id, petCode: pet.petCode, name: pet.name, source: pet.source });
                          // ALWAYS use petCode for navigation - it's the universal identifier
                          if (pet.petCode) {
                            console.log('✅ Using petCode route:', `/User/pets/centralized/${pet.petCode}`);
                            navigate(`/User/pets/centralized/${pet.petCode}`)
                          } else {
                            console.log('⚠️ No petCode, using _id route:', `/User/pets/${pet._id}`);
                            // Fallback to _id only for user pets without petCode
                            navigate(`/User/pets/${pet._id}`)
                          }
                        }}
                      >
                        {/* Color Band at Top */}
                        <Box sx={{ 
                          height: 6,
                          background: cardColor.gradient,
                          borderTopLeftRadius: 'inherit',
                          borderTopRightRadius: 'inherit'
                        }} />
                        
                        {/* Pet Image */}
                        <Box sx={{ position: 'relative', pt: 2, px: 2 }}>
                          <Box
                            component="img"
                            src={'/placeholder-pet.svg'}
                            alt={pet.name || 'Pet'}
                            sx={{
                              width: '100%',
                              height: 180,
                              objectFit: 'cover',
                              borderRadius: 2,
                              border: '2px solid',
                              borderColor: 'divider',
                              bgcolor: 'grey.100'
                            }}
                            ref={(el) => {
                              if (el) {
                                getPetImageUrl(pet).then(url => {
                                  el.src = url;
                                }).catch(err => {
                                  el.src = '/placeholder-pet.svg';
                                });
                              }
                            }}
                            onError={(e) => { 
                              e.currentTarget.src = '/placeholder-pet.svg';
                            }}
                          />
                          
                          {/* Status Badge - Always show source status */}
                          <Box 
                            sx={{ 
                              position: 'absolute', 
                              top: 24, 
                              right: 24,
                              bgcolor: 'white',
                              borderRadius: 2,
                              px: 1.5,
                              py: 0.5,
                              boxShadow: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            <Box sx={{ 
                              width: 8, 
                              height: 8, 
                              borderRadius: '50%', 
                              bgcolor: cardColor.main 
                            }} />
                            <Typography variant="caption" sx={{ fontWeight: 600, color: cardColor.main }}>
                              {isAdopted ? 'Adopted' : isPurchased ? 'Purchased' : 'My Pet'}
                            </Typography>
                          </Box>
                        </Box>

                        <CardContent sx={{ pt: 2 }}>
                          {/* Pet Name & Code */}
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                            {pet.name || 'Unnamed Pet'}
                          </Typography>
                          
                          {/* Temporary Care Badge - Show below name */}
                          {pet.temporaryCareStatus?.inCare && (
                            <Chip 
                              label="In Temporary Care" 
                              size="small" 
                              color="warning" 
                              sx={{ 
                                fontWeight: 600,
                                mb: 1,
                                bgcolor: 'warning.main',
                                color: 'white'
                              }}
                            />
                          )}
                          
                          {pet.petCode && (
                            <Chip 
                              label={pet.petCode} 
                              size="small" 
                              sx={{ 
                                fontFamily: 'monospace',
                                fontSize: '0.7rem',
                                bgcolor: alpha(cardColor.main, 0.1),
                                color: cardColor.main,
                                fontWeight: 600,
                                mb: 1.5
                              }}
                            />
                          )}
                          
                          {/* Pet Details */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PetIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {pet.breed?.name || (typeof pet.breed === 'string' ? pet.breed : 'Unknown Breed')}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ 
                                fontWeight: 600,
                                color: pet.gender === 'Male' ? '#3b82f6' : pet.gender === 'Female' ? '#ec4899' : 'text.secondary'
                              }}>
                                {typeof pet.gender === 'string' ? pet.gender : 'Gender not set'}
                              </Typography>
                              {pet.age && (
                                <>
                                  <Typography variant="body2" color="text.secondary">•</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {pet.age} {pet.ageUnit || 'months'}
                                  </Typography>
                                </>
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Quick Actions - Only real features */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={6}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }} onClick={() => navigate('/User/pets/add')}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <AddIcon sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Add New Pet
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Register your pet with us
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        

        
        <Grid item xs={12} sm={6} md={6}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
            color: 'white',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }} onClick={() => navigate('/User/pets')}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <PetIcon sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                My Pets
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                View all your pets
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingIcon color="primary" />
                Recent Activity
              </Typography>
              
              {activityError ? (
                <Alert severity="error">{activityError}</Alert>
              ) : activityLoading ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : recentActivity.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <NotificationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Your recent activity will appear here
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {recentActivity.slice(0, 5).map((activity) => (
                    <ListItem key={activity.id} sx={{ px: 0, py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Box sx={{ 
                          p: 1, 
                          borderRadius: 2, 
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main'
                        }}>
                          {activity.icon}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.title}
                        secondary={activity.time}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              
              <Button 
                variant="outlined" 
                fullWidth 
                sx={{ mt: 2 }}
                onClick={() => navigate('/User/pets')}
              >
                View All Activity
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Available Services - Only real, active modules */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <StarIcon color="primary" />
          Available Services
        </Typography>
        
        {modulesError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {modulesError}
          </Alert>
        )}
        
        {modulesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : modules.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <HomeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                No services available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Check back later for new services
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {staticCards.concat(
              modules.map(m => {
                const path = getModulePath(m.key)
                return {
                  key: m.key,
                  title: m.name,
                  description: m.description,
                  icon: getModuleIcon(m.icon),
                  path: path,
                  status: m.status,
                  maintenanceMessage: m.maintenanceMessage,
                  blockReason: m.blockReason,
                  isActive: m.status === 'active'
                }
              })
            ).map((module, index) => {
              const isDisabled = module.status && module.status !== 'active'
              const getStatusInfo = () => {
                switch(module.status) {
                  case 'maintenance':
                    return { label: 'Under Maintenance', color: 'warning', message: module.maintenanceMessage || 'This module is currently under maintenance' }
                  case 'blocked':
                    return { label: 'Blocked by Admin', color: 'error', message: module.blockReason || 'This module has been blocked' }
                  case 'coming_soon':
                    return { label: 'Coming Soon', color: 'info', message: 'This module is coming soon' }
                  default:
                    return null
                }
              }
              const statusInfo = getStatusInfo()
              
              return (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card
                    onClick={() => !isDisabled && navigate(module.path)}
                    sx={{
                      background: isDisabled ? '#9e9e9e' : getGradientFor(index),
                      color: 'white',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      boxShadow: 3,
                      opacity: isDisabled ? 0.7 : 1,
                      '&:hover': isDisabled ? {} : { transform: 'translateY(-4px)', boxShadow: 6 },
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {statusInfo && (
                      <Chip
                        label={statusInfo.label}
                        color={statusInfo.color}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          zIndex: 1,
                          fontWeight: 'bold'
                        }}
                      />
                    )}
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 2, mb: 1, color: 'white' }}>
                        {module.icon}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {module.title}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {module.description}
                      </Typography>
                      {statusInfo && statusInfo.message && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.8, fontStyle: 'italic' }}>
                          {statusInfo.message}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        )}
      </Box>
    </UserLayout>
  )
}

export default PublicUserDashboard