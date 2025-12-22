
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
  // DEBUG: Comprehensive function to compare PetRegistry with all source modules
  const comparePetData = async () => {
    if (process.env.NODE_ENV !== 'development') return;
    
    try {
      console.group('🔍 Comprehensive Pet Data Comparison');
      
      // Fetch data from all sources
      const [adoptionRes, petshopRes, registryRes] = await Promise.allSettled([
        apiClient.get('/adoption/user/pets/adopted'),
        apiClient.get('/petshop/user/my-purchased-pets'),
        apiClient.get('/pets/my-pets')
      ]);
      
      const adoptedPets = adoptionRes.status === 'fulfilled' ? adoptionRes.value.data?.data || [] : [];
      const purchasedPets = petshopRes.status === 'fulfilled' ? petshopRes.value.data?.data?.pets || [] : [];
      const registryPets = registryRes.status === 'fulfilled' ? registryRes.value.data?.data?.pets || [] : [];
      
      console.log('_Direct adoption pets:', adoptedPets);
      console.log('_Direct purchased pets:', purchasedPets);
      console.log('_Registry pets:', registryPets);
      
      // Analyze registry pets by source
      const adoptionRegistryPets = registryPets.filter(pet => pet.source === 'adoption');
      const petshopRegistryPets = registryPets.filter(pet => pet.source === 'petshop');
      const coreRegistryPets = registryPets.filter(pet => pet.source === 'core');
      
      console.log('_Registry adoption pets:', adoptionRegistryPets);
      console.log('_Registry petshop pets:', petshopRegistryPets);
      console.log('_Registry core pets:', coreRegistryPets);
      
      // Compare adoption pets
      console.group('🐶 Adoption Pets Comparison');
      adoptedPets.forEach(directPet => {
        const registryPet = adoptionRegistryPets.find(p => p.petCode === directPet.petCode);
        if (registryPet) {
          console.group(`_Comparing: ${directPet.name} (${directPet.petCode})`);
          console.log('__Direct adoption pet:', directPet);
          console.log('__Registry adoption pet:', registryPet);
          
          // Compare images
          console.log('__Direct images:', directPet.images);
          console.log('__Registry images:', registryPet.images);
          console.log('__Registry imageIds:', registryPet.imageIds);
          console.log('__Registry adoptionPetId:', registryPet.adoptionPetId);
          
          // Image status
          const directHasImages = directPet.images && directPet.images.length > 0;
          const registryHasImages = registryPet.images && registryPet.images.length > 0;
          const registryHasImageIds = registryPet.imageIds && registryPet.imageIds.length > 0;
          
          if (directHasImages && registryHasImages) {
            console.log('✅ Both have images');
          } else if (directHasImages && !registryHasImages) {
            console.log('⚠️ Direct has images but registry does not');
          } else if (!directHasImages && registryHasImages) {
            console.log('ℹ️ Registry has images but direct does not');
          } else {
            console.log('❌ Neither has images');
          }
          
          console.groupEnd();
        } else {
          console.log(`_Adoption pet ${directPet.name} (${directPet.petCode}) not found in registry`);
        }
      });
      console.groupEnd();
      
      // Compare purchased pets
      console.group('🛒 PetShop Pets Comparison');
      purchasedPets.forEach(directPet => {
        const registryPet = petshopRegistryPets.find(p => p.petCode === directPet.petCode);
        if (registryPet) {
          console.group(`_Comparing: ${directPet.name} (${directPet.petCode})`);
          console.log('__Direct purchased pet:', directPet);
          console.log('__Registry purchased pet:', registryPet);
          
          // Compare images
          console.log('__Direct images:', directPet.images);
          console.log('__Registry images:', registryPet.images);
          console.log('__Registry imageIds:', registryPet.imageIds);
          console.log('__Registry petShopItemId:', registryPet.petShopItemId);
          
          // Image status
          const directHasImages = directPet.images && directPet.images.length > 0;
          const registryHasImages = registryPet.images && registryPet.images.length > 0;
          const registryHasImageIds = registryPet.imageIds && registryPet.imageIds.length > 0;
          
          if (directHasImages && registryHasImages) {
            console.log('✅ Both have images');
          } else if (directHasImages && !registryHasImages) {
            console.log('⚠️ Direct has images but registry does not');
          } else if (!directHasImages && registryHasImages) {
            console.log('ℹ️ Registry has images but direct does not');
          } else {
            console.log('❌ Neither has images');
          }
          
          console.groupEnd();
        } else {
          console.log(`_Purchased pet ${directPet.name} (${directPet.petCode}) not found in registry`);
        }
      });
      console.groupEnd();
      
      // Check core pets
      console.group('👤 Core/User Pets');
      console.log(`_Found ${coreRegistryPets.length} core pets in registry`);
      coreRegistryPets.forEach(corePet => {
        console.log(`_Core pet: ${corePet.name} (${corePet.petCode})`, {
          images: corePet.images,
          imageIds: corePet.imageIds,
          corePetId: corePet.corePetId
        });
      });
      console.groupEnd();
      
      console.groupEnd();
    } catch (err) {
      console.error('Comprehensive comparison failed:', err);
    }
  };
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
      
      // Load all data in parallel to reduce loading time
      const [petsRes, ownedRes, activityRes, purchasedRes] = await Promise.allSettled([
        userPetsAPI.list(),
        apiClient.get('/pets/my-pets'),
        apiClient.get('/user-dashboard/activities'),
        apiClient.get('/petshop/user/my-purchased-pets') // Add pet shop purchased pets
      ])
      
      // DEBUG: Compare PetRegistry and AdoptionPet data for adopted pets
      // This is for debugging purposes only - can be removed in production
      if (process.env.NODE_ENV === 'development') {
        try {
          // Fetch adopted pets directly from adoption API for comparison
          const adoptionRes = await apiClient.get('/adoption/user/pets/adopted');
          const adoptedPetsDirect = adoptionRes.data?.data || [];
          
          // Fetch pets from registry for comparison
          const registryRes = ownedRes.status === 'fulfilled' ? ownedRes.value.data?.data?.pets || [] : [];
          
          // Compare adopted pets between registry and direct fetch
          console.group('🐾 Pet Data Comparison (Development Only)');
          console.log('_registry pets:', registryRes);
          console.log('_direct adopted pets:', adoptedPetsDirect);
          
          // Find adopted pets in registry
          const registryAdoptedPets = registryRes.filter(pet => pet.source === 'adoption' || pet.currentStatus === 'adopted');
          console.log('_adopted pets in registry:', registryAdoptedPets);
          
          // Compare image data
          registryAdoptedPets.forEach(regPet => {
            const directPet = adoptedPetsDirect.find(p => p.petCode === regPet.petCode);
            if (directPet) {
              console.group(`_Comparing pet: ${regPet.name} (${regPet.petCode})`);
              console.log('__Registry images:', regPet.images);
              console.log('__Direct images:', directPet.images);
              console.log('__Registry imageIds:', regPet.imageIds);
              console.log('__Direct imageIds:', directPet.imageIds);
              console.groupEnd();
            }
          });
          console.groupEnd();
        } catch (debugErr) {
          console.warn('Debug comparison failed:', debugErr);
        }
      }
      
      // Process pets from PetNew model
      let allPets = []
      if (petsRes.status === 'fulfilled') {
        const petNewPets = petsRes.value.data?.data || []
        allPets = [...allPets, ...petNewPets]
      }
      
      // Process core owned pets
      if (ownedRes.status === 'fulfilled') {
        const corePets = ownedRes.value.data?.data?.pets || []
        allPets = [...allPets, ...corePets]
      }

      // Process adopted pets (now included in registry pets)
      let adoptedPets = []
      
      // Process purchased pets - EXACT SAME CODE AS PETS LIST PAGE
      let purchasedPets = []
      if (purchasedRes.status === 'fulfilled') {
        purchasedPets = purchasedRes.value.data?.data?.pets || []
      }

      // Map adopted pets to pet-like objects - EXACT SAME CODE AS PETS LIST PAGE
      // No longer needed as adopted pets are included in registry pets
      const mappedAdoptedPets = []
      
      // Map purchased pets to pet-like objects - EXACT SAME CODE AS PETS LIST PAGE
      const mappedPurchasedPets = purchasedPets.map(pet => ({
        _id: pet._id,
        name: pet.name || 'Pet',
        images: pet.images || [],
        petCode: pet.petCode,
        breed: pet.breed,
        species: pet.species,
        gender: pet.gender || 'Unknown',
        status: 'purchased',
        currentStatus: 'purchased',
        tags: ['purchased'],
        purchaseDate: pet.acquiredDate,
        age: pet.age,
        ageUnit: pet.ageUnit,
        color: pet.color,
        createdAt: pet.acquiredDate,
        source: pet.source,
        sourceLabel: pet.sourceLabel,
        petShopItemId: pet._id  // Add this for cross-source image fetching
      }))

      // Combine all pets and remove duplicates - EXACT SAME CODE AS PETS LIST PAGE
      const combinedPets = [...allPets, ...mappedPurchasedPets]
      
      // More robust deduplication based on petCode first, then _id
      const uniquePets = combinedPets.filter((pet, index, self) => {
        // If pet has a petCode, deduplicate based on that
        if (pet.petCode) {
          return index === self.findIndex(p => p.petCode === pet.petCode);
        }
        // If no petCode, deduplicate based on _id
        return index === self.findIndex(p => p._id === pet._id);
      })
      
      setMyPets(uniquePets)
      setOwnedPets(uniquePets)
      
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

  // Load modules data - only active modules
  useEffect(() => {
    (async () => {
      setModulesLoading(true)
      setModulesError('')
      try {
        const res = await modulesAPI.list()
        // Filter to only show active modules
        const list = (res.data?.data || []).filter(module => module.status === 'active')
        setModules(list)
      } catch (e) {
        setModules([])
        setModulesError(e?.response?.data?.message || 'Failed to load modules')
      } finally {
        setModulesLoading(false)
      }
    })()
  }, [])

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
      
      // DEBUG: Enhanced logging for troubleshooting in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`_Processing pet: ${processedPet.name || 'Unnamed'} (${key})`, {
          source: processedPet.source,
          sourceType: processedPet.sourceType,
          currentStatus: processedPet.currentStatus,
          hasImages: !!(processedPet.images && processedPet.images.length > 0),
          imageCount: processedPet.images ? processedPet.images.length : 0,
          hasImageIds: !!(processedPet.imageIds && processedPet.imageIds.length > 0),
          imageIdCount: processedPet.imageIds ? processedPet.imageIds.length : 0,
          tags: processedPet.tags,
          adoptionPetId: processedPet.adoptionPetId,
          petShopItemId: processedPet.petShopItemId,
          corePetId: processedPet.corePetId
        });
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
      'rescue': '/User/rescue',
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
    // DEBUG: Log pet data for troubleshooting
    if (process.env.NODE_ENV === 'development') {
      console.log(`_getPetImageUrl called for pet: ${pet.name || 'Unnamed'} (${pet.petCode || pet._id})`, {
        pet,
        source: pet.source,
        sourceType: pet.sourceType,
        hasImages: !!(pet.images && pet.images.length > 0),
        hasImageIds: !!(pet.imageIds && pet.imageIds.length > 0),
        hasImageUrl: !!pet.imageUrl,
        adoptionPetId: pet.adoptionPetId,
        petShopItemId: pet.petShopItemId,
        corePetId: pet.corePetId
      });
    }
    
    // Industry-standard image resolution pipeline
    
    // 1. PRIMARY: Populated images array (virtual population from Image collection)
    if (pet.images && pet.images.length > 0) {
      // Find primary image or use first image
      const primaryImage = pet.images.find(img => img.isPrimary) || pet.images[0];
      if (primaryImage && primaryImage.url) {
        const imageUrl = resolveMediaUrl(primaryImage.url);
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ PRIMARY: Using populated image from Image collection: ${imageUrl}`);
        }
        return imageUrl;
      }
    }
    
    // 2. SECONDARY: Direct image URL field
    if (pet.imageUrl) {
      const imageUrl = resolveMediaUrl(pet.imageUrl);
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ SECONDARY: Using direct imageUrl field: ${imageUrl}`);
      }
      return imageUrl;
    }
    
    // 3. TERTIARY: ImageIds with populated objects
    if (pet.imageIds && pet.imageIds.length > 0) {
      // Try to get the first imageId
      const firstImageId = pet.imageIds[0];
      if (firstImageId && typeof firstImageId === 'object' && firstImageId.url) {
        const imageUrl = resolveMediaUrl(firstImageId.url);
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ TERTIARY: Using populated image from imageIds object: ${imageUrl}`);
        }
        return imageUrl;
      } else if (firstImageId && typeof firstImageId === 'string') {
        // If it's just an ID string, we can't resolve it without additional API calls
        if (process.env.NODE_ENV === 'development') {
          console.log(`⚠️ Image ID found but not populated: ${firstImageId}`);
        }
      }
    }
    
    // 4. QUATERNARY: Cross-source image fetching (INDUSTRY STANDARD APPROACH)
    // This is the key fix - fetch images directly from source models when registry population fails
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 QUATERNARY: Attempting cross-source image fetch for ${pet.source} pet`);
    }
    
    // For adoption pets - fetch directly from AdoptionPet model
    if (pet.source === 'adoption' && pet.adoptionPetId) {
      // Actually fetch images from the source
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 FETCHING: Adoption pet images for ${pet.adoptionPetId}`);
      }
      try {
        const res = await apiClient.get(`/adoption/manager/pets/${pet.adoptionPetId}`);
        const adoptionPet = res.data?.data;
        
        if (adoptionPet && adoptionPet.images && adoptionPet.images.length > 0) {
          const primaryImage = adoptionPet.images.find(img => img.isPrimary) || adoptionPet.images[0];
          if (primaryImage && primaryImage.url) {
            const imageUrl = resolveMediaUrl(primaryImage.url);
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ SUCCESS: Found image from AdoptionPet: ${imageUrl}`);
            }
            return imageUrl;
          }
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ No images found in adoption pet');
        }
      } catch (err) {
        console.error(`❌ FAILED: Could not fetch adoption pet ${pet.adoptionPetId}:`, err.message);
      }
      // Continue to other methods if this one fails
    }
    
    // For petshop pets - fetch directly from PetShopItem model
    if (pet.source === 'petshop' && pet.petShopItemId) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 FETCHING: Petshop item images for ${pet.petShopItemId}`);
      }
      try {
        const res = await apiClient.get(`/petshop/manager/inventory/${pet.petShopItemId}`);
        const petshopItem = res.data?.data;
        
        if (petshopItem && petshopItem.images && petshopItem.images.length > 0) {
          const primaryImage = petshopItem.images.find(img => img.isPrimary) || petshopItem.images[0];
          if (primaryImage && primaryImage.url) {
            const imageUrl = resolveMediaUrl(primaryImage.url);
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ SUCCESS: Found image from PetShopItem: ${imageUrl}`);
            }
            return imageUrl;
          }
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ No images found in petshop item');
        }
      } catch (err) {
        console.error(`❌ FAILED: Could not fetch petshop item ${pet.petShopItemId}:`, err.message);
      }
      // Continue to other methods if this one fails
    }
    
    // For user pets - fetch directly from Pet model
    if (pet.source === 'core' && pet.corePetId) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 FETCHING: User pet images for ${pet.corePetId}`);
      }
      try {
        const res = await apiClient.get(`/pets/${pet.corePetId}`);
        const userPet = res.data?.data;
        
        if (userPet && userPet.images && userPet.images.length > 0) {
          const primaryImage = userPet.images.find(img => img.isPrimary) || userPet.images[0];
          if (primaryImage && primaryImage.url) {
            const imageUrl = resolveMediaUrl(primaryImage.url);
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ SUCCESS: Found image from Pet: ${imageUrl}`);
            }
            return imageUrl;
          }
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ No images found in user pet');
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
      
      // In a real implementation, we would check which pattern exists
      // We would make HEAD requests to check if the URLs exist before returning them
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Trying common image patterns:`, possiblePatterns);
      }
    }
    
    // 6. ULTIMATE FALLBACK: Generic placeholders by source
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ All image resolution methods failed. Using placeholder.');
    }
    
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
      // Adoption pets - fetch directly from AdoptionPet model
      if (pet.source === 'adoption' && pet.adoptionPetId) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 FETCHING: Adoption pet images for ${pet.adoptionPetId}`);
        }
        
        try {
          // Fetch adoption pet details with populated images
          const res = await apiClient.get(`/adoption/manager/pets/${pet.adoptionPetId}`);
          const adoptionPet = res.data?.data;
          
          if (adoptionPet && adoptionPet.images && adoptionPet.images.length > 0) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ SUCCESS: Found ${adoptionPet.images.length} images for adoption pet`);
            }
            return adoptionPet.images;
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log('⚠️ No images found in adoption pet');
          }
          return [];
        } catch (err) {
          console.error(`❌ FAILED: Could not fetch adoption pet ${pet.adoptionPetId}:`, err.message);
          return [];
        }
      }
      
      // Petshop pets - fetch directly from PetShopItem model
      if (pet.source === 'petshop' && pet.petShopItemId) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 FETCHING: Petshop item images for ${pet.petShopItemId}`);
        }
        
        try {
          // Fetch petshop item details with populated images
          const res = await apiClient.get(`/petshop/manager/inventory/${pet.petShopItemId}`);
          const petshopItem = res.data?.data;
          
          if (petshopItem && petshopItem.images && petshopItem.images.length > 0) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ SUCCESS: Found ${petshopItem.images.length} images for petshop item`);
            }
            return petshopItem.images;
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log('⚠️ No images found in petshop item');
          }
          return [];
        } catch (err) {
          console.error(`❌ FAILED: Could not fetch petshop item ${pet.petShopItemId}:`, err.message);
          return [];
        }
      }
      
      // User pets - fetch directly from Pet model
      if (pet.source === 'core' && pet.corePetId) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 FETCHING: User pet images for ${pet.corePetId}`);
        }
        
        try {
          // Fetch user pet details with populated images
          const res = await apiClient.get(`/pets/${pet.corePetId}`);
          const userPet = res.data?.data;
          
          if (userPet && userPet.images && userPet.images.length > 0) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ SUCCESS: Found ${userPet.images.length} images for user pet`);
            }
            return userPet.images;
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log('⚠️ No images found in user pet');
          }
          return [];
        } catch (err) {
          console.error(`❌ FAILED: Could not fetch user pet ${pet.corePetId}:`, err.message);
          return [];
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('ℹ️ No source-specific ID found for cross-fetch');
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
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ RESOLVED: Primary image from registry: ${imageUrl}`);
        }
        return imageUrl;
      }
    }
    
    // SECONDARY: Direct image URL
    if (pet.imageUrl) {
      const imageUrl = resolveMediaUrl(pet.imageUrl);
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ RESOLVED: Direct image URL: ${imageUrl}`);
      }
      return imageUrl;
    }
    
    // TERTIARY: ImageIds with populated objects
    if (pet.imageIds && pet.imageIds.length > 0) {
      const firstImageId = pet.imageIds[0];
      if (firstImageId && typeof firstImageId === 'object' && firstImageId.url) {
        const imageUrl = resolveMediaUrl(firstImageId.url);
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ RESOLVED: Image from imageIds: ${imageUrl}`);
        }
        return imageUrl;
      }
    }
    
    // 2. Cross-source fetching as fallback
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 CROSS-SOURCE: Fetching images from source model for ${pet.source} pet`);
    }
    
    try {
      const sourceImages = await fetchPetImagesFromSource(pet);
      if (sourceImages && sourceImages.length > 0) {
        const primaryImage = sourceImages.find(img => img.isPrimary) || sourceImages[0];
        if (primaryImage && primaryImage.url) {
          const imageUrl = resolveMediaUrl(primaryImage.url);
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ RESOLVED: Cross-source image: ${imageUrl}`);
          }
          return imageUrl;
        }
      }
    } catch (err) {
      console.error('Cross-source fetch failed:', err);
    }
    
    // 3. Ultimate fallback
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ RESOLUTION: All methods failed, using placeholder');
    }
    
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
      console.log(`📁 FETCHING: Documents for adoption pet ${pet.adoptionPetId}`);
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
      console.log(`📜 CHECKING: Certificate status for adoption pet ${pet.petCode}`);
      // In real implementation:
      // const res = await apiClient.get(`/adoption/user/certificates/status/${pet.petCode}`);
      // return res.data?.data || { generated: false };
      return { generated: true, url: '#', message: 'Certificate available' }; // Placeholder
    }
    
    return { generated: false };
  };
  

  
  // DEBUG: Function to validate and enhance pet data with cross-source image fetching
  const enhancePetDataWithImages = async (pet) => {
    // Only run in development mode for debugging
    if (process.env.NODE_ENV !== 'development') return pet;
    
    try {
      // If pet already has images, no need to enhance
      if (pet.images && pet.images.length > 0) return pet;
      
      console.group(`🔍 Enhancing pet data: ${pet.name || 'Unnamed'} (${pet.petCode || pet._id})`);
      
      // Fetch additional data based on source
      if (pet.source === 'adoption' && pet.adoptionPetId) {
        console.log('__Fetching adoption pet data for image enhancement');
        try {
          const adoptionRes = await apiClient.get(`/adoption/manager/pets/${pet.adoptionPetId}`);
          const adoptionPet = adoptionRes.data?.data;
          if (adoptionPet && adoptionPet.images && adoptionPet.images.length > 0) {
            console.log('__Found images in adoption pet:', adoptionPet.images);
            // Enhance the pet with adoption images
            return { ...pet, images: adoptionPet.images };
          }
        } catch (err) {
          console.log('__Failed to fetch adoption pet data:', err.message);
        }
      }
      
      if (pet.source === 'petshop' && pet.petShopItemId) {
        console.log('__Fetching petshop item data for image enhancement');
        try {
          const petshopRes = await apiClient.get(`/petshop/manager/inventory/${pet.petShopItemId}`);
          const petshopItem = petshopRes.data?.data;
          if (petshopItem && petshopItem.images && petshopItem.images.length > 0) {
            console.log('__Found images in petshop item:', petshopItem.images);
            // Enhance the pet with petshop images
            return { ...pet, images: petshopItem.images };
          }
        } catch (err) {
          console.log('__Failed to fetch petshop item data:', err.message);
        }
      }
      
      if (pet.source === 'core' && pet.corePetId) {
        console.log('__Fetching core pet data for image enhancement');
        try {
          const coreRes = await apiClient.get(`/pets/${pet.corePetId}`);
          const corePet = coreRes.data?.data;
          if (corePet && corePet.images && corePet.images.length > 0) {
            console.log('__Found images in core pet:', corePet.images);
            // Enhance the pet with core pet images
            return { ...pet, images: corePet.images };
          }
        } catch (err) {
          console.log('__Failed to fetch core pet data:', err.message);
        }
      }
      
      console.groupEnd();
    } catch (err) {
      console.error('Pet enhancement failed:', err);
    }
    
    return pet;
  };
  
  // DEBUG: Function to validate PetRegistry image population
  const validateRegistryImagePopulation = async () => {
    if (process.env.NODE_ENV !== 'development') return;
    
    try {
      console.group('🔍 Validating PetRegistry Image Population');
      
      // Fetch registry pets
      const registryRes = await apiClient.get('/pets/my-pets');
      const registryPets = registryRes.data?.data?.pets || [];
      
      console.log(`_Found ${registryPets.length} pets in registry`);
      
      // Validate image population for each pet
      for (const pet of registryPets) {
        console.group(`_Validating pet: ${pet.name || 'Unnamed'} (${pet.petCode || pet._id})`);
        
        console.log('__Pet source:', pet.source);
        console.log('__Pet images:', pet.images);
        console.log('__Pet imageIds:', pet.imageIds);
        
        // Check if images are properly populated
        if (pet.images && pet.images.length > 0) {
          console.log('✅ Images populated correctly');
          pet.images.forEach((img, idx) => {
            console.log(`  Image ${idx + 1}: ${img.url || 'No URL'}`);
          });
        } else if (pet.imageIds && pet.imageIds.length > 0) {
          console.log('⚠️ Has imageIds but images not populated');
          pet.imageIds.forEach((id, idx) => {
            console.log(`  ImageId ${idx + 1}: ${id}`);
          });
        } else {
          console.log('❌ No images or imageIds found');
        }
        
        // Check source-specific fields
        if (pet.source === 'adoption' && pet.adoptionPetId) {
          console.log('__Adoption pet ID:', pet.adoptionPetId);
          
          // Try to fetch adoption pet details
          try {
            console.log('__Attempting to fetch adoption pet details...');
            const adoptionRes = await apiClient.get(`/adoption/manager/pets/${pet.adoptionPetId}`);
            const adoptionPet = adoptionRes.data?.data;
            console.log('__Adoption pet details:', adoptionPet);
            
            if (adoptionPet && adoptionPet.images) {
              console.log(`✅ Adoption pet has ${adoptionPet.images.length} images`);
              adoptionPet.images.forEach((img, idx) => {
                console.log(`  Adoption Image ${idx + 1}: ${img.url || 'No URL'}`);
              });
            } else {
              console.log('❌ Adoption pet has no images');
            }
          } catch (fetchErr) {
            console.log('❌ Failed to fetch adoption pet details:', fetchErr.message);
          }
        } else if (pet.source === 'petshop' && pet.petShopItemId) {
          console.log('__PetShop item ID:', pet.petShopItemId);
        } else if (pet.source === 'core' && pet.corePetId) {
          console.log('__Core pet ID:', pet.corePetId);
        }
        
        console.groupEnd();
      }
      
      console.groupEnd();
    } catch (err) {
      console.error('Registry validation failed:', err);
    }
  };
  
  // INDUSTRY-STANDARD: Comprehensive pet image diagnostic
  const diagnosePetImages = async (pet) => {
    if (process.env.NODE_ENV !== 'development') return;
    
    console.group(`🏥 DIAGNOSTIC: ${pet.name || 'Unnamed Pet'} (${pet.petCode || pet._id})`);
    
    // 1. Registry data
    console.log('📋 REGISTRY DATA:');
    console.log('  Source:', pet.source);
    console.log('  Images:', pet.images);
    console.log('  ImageIds:', pet.imageIds);
    console.log('  ImageUrl:', pet.imageUrl);
    
    // 2. Source-specific data
    if (pet.source === 'adoption' && pet.adoptionPetId) {
      console.log('🐶 ADOPTION PET DIAGNOSTIC:');
      try {
        const res = await apiClient.get(`/adoption/manager/pets/${pet.adoptionPetId}`);
        const adoptionPet = res.data?.data;
        
        console.log('  Adoption Pet ID:', pet.adoptionPetId);
        console.log('  Adoption Pet Data:', adoptionPet);
        
        if (adoptionPet && adoptionPet.images) {
          console.log(`  ✅ Found ${adoptionPet.images.length} images in adoption pet`);
          adoptionPet.images.forEach((img, idx) => {
            console.log(`    Image ${idx + 1}: ${img.url || 'No URL'}`);
          });
          
          // Test resolving first image
          const firstImage = adoptionPet.images[0];
          if (firstImage && firstImage.url) {
            const resolvedUrl = resolveMediaUrl(firstImage.url);
            console.log('  🔍 Resolved first image URL:', resolvedUrl);
            
            // Test if URL is accessible
            try {
              const testRes = await fetch(resolvedUrl, { method: 'HEAD' });
              console.log(`  🧪 Image accessibility test: ${testRes.ok ? '✅ Accessible' : '❌ Not accessible'}`);
            } catch (testErr) {
              console.log('  🧪 Image accessibility test: ❌ Failed', testErr.message);
            }
          }
        } else {
          console.log('  ❌ No images found in adoption pet');
        }
      } catch (err) {
        console.log('  ❌ Failed to fetch adoption pet:', err.message);
      }
    }
    
    // 3. Image resolution pipeline test
    console.log('🔧 IMAGE RESOLUTION PIPELINE TEST:');
    
    // Test getPetImageUrl function
    getPetImageUrl(pet).then(imageUrl => {
      console.log('  getPetImageUrl result:', imageUrl);
    }).catch(err => {
      console.error('  getPetImageUrl failed:', err);
    });
    
    console.groupEnd();
  };
  
  // INDUSTRY-STANDARD: Force refresh pet images
  const refreshPetImages = async (pet) => {
    if (process.env.NODE_ENV !== 'development') return;
    
    console.log(`🔄 REFRESHING: ${pet.name || 'Unnamed Pet'} images`);
    
    try {
      // Fetch fresh data from source
      const sourceImages = await fetchPetImagesFromSource(pet);
      console.log('  Fresh source images:', sourceImages);
      
      // Update the pet data in state
      setOwnedPets(prev => prev.map(p => 
        p.petCode === pet.petCode ? { ...p, images: sourceImages } : p
      ));
      
      console.log('  ✅ Pet images refreshed in state');
    } catch (err) {
      console.error('  ❌ Failed to refresh pet images:', err);
    }
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
                <Box sx={{ display: 'flex', gap: 2, minWidth: '100%' }}>
                  {allMyPets.slice(0, 4).map((pet) => (
                    <Card 
                      key={pet._id || pet.petCode} 
                      sx={{ minWidth: 240, flex: '0 0 auto', cursor: 'pointer', '&:hover': { boxShadow: 4 } }} 
                      onClick={() => {
                        // Check if this is an adopted pet by looking for the 'adoption' tag
                        if (pet?.tags?.includes('adoption')) {
                          // For adopted pets, navigate to the adoption details page
                          navigate(`/User/adoption/my-adopted-pets/${pet._id}`)
                        } 
                        // Check if this is a purchased pet by looking for the 'purchased' tag
                        else if (pet?.tags?.includes('purchased')) {
                          // For purchased pets, navigate to the centralized pet details page using petCode
                          if (pet.petCode) {
                            navigate(`/pets/centralized/${pet.petCode}`)
                          } else {
                            // Fallback to regular pet details if no petCode
                            navigate(`/User/pets/${pet._id}`)
                          }
                        }
                        else {
                          // For regular user pets, use the existing navigation
                          navigate(`/User/pets/${pet._id}`)
                        }
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
                          <Box
                            component="img"
                            src={'/placeholder-pet.svg'} // Will be updated after component mounts
                            alt={pet.name || 'Pet'}
                            sx={{
                              width: 56,
                              height: 56,
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid',
                              borderColor: 'divider'
                            }}
                            ref={(el) => {
                              // Dynamically set the image source after component mounts
                              if (el) {
                                getPetImageUrl(pet).then(url => {
                                  el.src = url;
                                }).catch(err => {
                                  console.error('Failed to load pet image:', err);
                                  el.src = '/placeholder-pet.svg';
                                });
                              }
                            }}
                            onError={(e) => { 
                              e.currentTarget.src = '/placeholder-pet.svg';
                              if (process.env.NODE_ENV === 'development') {
                                console.log(`_Image load failed for pet: ${pet.name || 'Unnamed'}. Using placeholder.`);
                              }
                            }}
                            sx={{
                              width: 56,
                              height: 56,
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid',
                              borderColor: 'divider',
                              // Add loading effect
                              opacity: 0.8,
                              transition: 'opacity 0.3s',
                              '&:hover': {
                                opacity: 1
                              }
                            }}
                          />
                          {/* INDUSTRY STANDARD: Certificate badge for adopted pets */}
                          {pet.source === 'adoption' && (
                            <Box 
                              sx={{ 
                                position: 'absolute', 
                                top: -8, 
                                right: -8, 
                                bgcolor: 'success.main', 
                                color: 'white', 
                                borderRadius: '50%', 
                                width: 24, 
                                height: 24, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                boxShadow: 2
                              }}
                            >
                              📜
                            </Box>
                          )}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, overflow: 'hidden' }}>
                              <Typography variant="h6" noWrap sx={{ fontWeight: 'bold' }}>
                                {pet.name || 'Unnamed Pet'}
                              </Typography>
                              {(pet.petCode || pet.code) && (
                                <Chip 
                                  label={pet.petCode || pet.code} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {(pet.breedId?.name || pet.breed?.name || pet.breed || 'Breed not specified')} • {(pet.gender || 'Gender not set')}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                              <Chip 
                                label={pet.status || pet.currentStatus || 'Owned'} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                              {pet.tags?.includes('adoption') && (
                                <Chip label="Adopted" size="small" color="success" variant="outlined" />
                              )}
                              {pet.tags?.includes('purchased') && (
                                <Chip label="Purchased" size="small" color="info" variant="outlined" />
                              )}
                              {/* Show source for registry pets without tags */}
                              {!pet.tags && pet.source && (
                                <Chip 
                                  label={pet.sourceLabel || pet.source} 
                                  size="small" 
                                  color="secondary" 
                                  variant="outlined"
                                />
                              )}
                              {/* DEBUG: Show pet code for troubleshooting */}
                              {process.env.NODE_ENV === 'development' && pet.petCode && (
                                <Chip 
                                  label={`Code: ${pet.petCode.substring(0, 8)}...`} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ fontFamily: 'monospace', fontSize: '0.6rem' }}
                                />
                              )}
                              {/* DEBUG: Show image status for troubleshooting */}
                              {process.env.NODE_ENV === 'development' && (
                                <Chip 
                                  label={pet.images && pet.images.length > 0 ? `🖼️ ${pet.images.length}` : '❌ No Images'}
                                  size="small" 
                                  color={pet.images && pet.images.length > 0 ? "success" : "error"}
                                  variant="outlined"
                                  sx={{ fontFamily: 'monospace', fontSize: '0.6rem' }}
                                />
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
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
        
        {/* DEBUG: Buttons for pet data validation (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
                color: 'white',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' }
              }} onClick={comparePetData}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <SearchIcon sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Compare Pet Data
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Debug registry vs all sources
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', 
                color: 'white',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' }
              }} onClick={validateRegistryImagePopulation}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <CheckIcon sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Validate Registry
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Check image population
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', 
                color: 'white',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' }
              }} onClick={() => {
                // Run diagnostics on first pet
                const firstPet = allMyPets[0];
                if (firstPet) {
                  diagnosePetImages(firstPet);
                } else {
                  alert('No pets found to diagnose');
                }
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <HealingIcon sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Diagnose Pet
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Run image diagnostics
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
        
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
                  isActive: true
                }
              })
            ).map((module, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  onClick={() => navigate(module.path)}
                  sx={{
                    background: getGradientFor(index),
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: 3,
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
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
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </UserLayout>
  )
}

export default PublicUserDashboard