import React, { useEffect, useState } from 'react'
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  CircularProgress, 
  Chip,
  Stack,
  Alert
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { apiClient, userPetsAPI, resolveMediaUrl } from '../../services/api'
import { useNavigate } from 'react-router-dom'

const Pets = () => {
  const [pets, setPets] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Function to get pet image URL synchronously
  const getPetImageUrl = (pet) => {
    // Try various sources for pet images
    if (pet.images && Array.isArray(pet.images) && pet.images.length > 0) {
      // Look for primary image first
      const primaryImage = pet.images.find(img => img.isPrimary);
      if (primaryImage && primaryImage.url) {
        return resolveMediaUrl(primaryImage.url);
      }
      
      // If no primary image, use the first image
      const firstImage = pet.images[0];
      if (firstImage && firstImage.url) {
        return resolveMediaUrl(firstImage.url);
      }
    }
    
    // Check if images is an object (not array) - could be from populate
    if (pet.images && typeof pet.images === 'object' && !Array.isArray(pet.images) && pet.images.url) {
      return resolveMediaUrl(pet.images.url);
    }
    
    // Check imageIds
    if (pet.imageIds && Array.isArray(pet.imageIds) && pet.imageIds.length > 0) {
      const firstImageId = pet.imageIds[0];
      if (firstImageId && typeof firstImageId === 'object' && firstImageId.url) {
        return resolveMediaUrl(firstImageId.url);
      }
      // If imageIds contains just URLs as strings
      if (typeof firstImageId === 'string') {
        return resolveMediaUrl(firstImageId);
      }
    }
    
    // Check if pet has a single image URL field
    if (pet.image && typeof pet.image === 'string') {
      return resolveMediaUrl(pet.image);
    }
    
    if (pet.imageUrl && typeof pet.imageUrl === 'string') {
      return resolveMediaUrl(pet.imageUrl);
    }
    
    // Fallback to placeholder
    return '/placeholder-pet.svg';
  };
  
  // Async function to fetch images from source models
  const fetchPetImageFromSource = async (pet) => {
    try {
      // For adoption pets - fetch directly from AdoptionPet model using user endpoint
      if (pet.source === 'adoption' && pet.adoptionPetId) {
        try {
          const res = await apiClient.get(`/adoption/user/my-adopted-pets/${pet.adoptionPetId}`);
          const adoptionPet = res.data?.data;
          
          if (adoptionPet && adoptionPet.images && adoptionPet.images.length > 0) {
            const primaryImage = adoptionPet.images.find(img => img.isPrimary) || adoptionPet.images[0];
            if (primaryImage && primaryImage.url) {
              return resolveMediaUrl(primaryImage.url);
            }
          }
        } catch (err) {
          console.error(`❌ FAILED: Could not fetch adoption pet ${pet.adoptionPetId}:`, err.message);
        }
      }
      
      // For petshop pets - fetch directly from PetShopItem model
      if (pet.source === 'petshop' && pet.petShopItemId) {
        try {
          const res = await apiClient.get(`/petshop/manager/inventory/${pet.petShopItemId}`);
          const petshopItem = res.data?.data;
                
          if (petshopItem && petshopItem.images && petshopItem.images.length > 0) {
            const primaryImage = petshopItem.images.find(img => img.isPrimary) || petshopItem.images[0];
            if (primaryImage && primaryImage.url) {
              return resolveMediaUrl(primaryImage.url);
            }
          }
        } catch (err) {
          console.error(`❌ FAILED: Could not fetch petshop item ${pet.petShopItemId}:`, err.message);
        }
      }
      
      // For user pets - fetch directly from Pet model
      if (pet.source === 'core' && pet.corePetId) {
        try {
          const res = await apiClient.get(`/pets/${pet.corePetId}`);
          const userPet = res.data?.data;
                
          if (userPet && userPet.images && userPet.images.length > 0) {
            const primaryImage = userPet.images.find(img => img.isPrimary) || userPet.images[0];
            if (primaryImage && primaryImage.url) {
              return resolveMediaUrl(primaryImage.url);
            }
          }
        } catch (err) {
          console.error(`❌ FAILED: Could not fetch user pet ${pet.corePetId}:`, err.message);
        }
      }
      
      // If no image found from source, return placeholder
      return '/placeholder-pet.svg';
    } catch (err) {
      console.error('Cross-source image fetch failed:', err);
      return '/placeholder-pet.svg';
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');
        
        // Load all pets from all sources in parallel
        const [
          userPetsRes, 
          ownedPetsRes, 
          purchasedPetsRes, 
          adoptedPetsRes
        ] = await Promise.allSettled([
          userPetsAPI.list(),
          apiClient.get('/pets/my-pets'),
          apiClient.get('/petshop/user/my-purchased-pets'),
          apiClient.get('/adoption/user/my-adopted-pets')
        ]);
        
        let allPets = [];
        
        // Process user pets
        if (userPetsRes.status === 'fulfilled') {
          const userPets = userPetsRes.value.data?.data || [];
          allPets = [...allPets, ...userPets];
        }
        
        // Process owned pets
        if (ownedPetsRes.status === 'fulfilled') {
          const ownedPets = ownedPetsRes.value.data?.data?.pets || [];
          allPets = [...allPets, ...ownedPets];
        }
        
        // Process purchased pets
        if (purchasedPetsRes.status === 'fulfilled') {
          const purchasedPets = purchasedPetsRes.value.data?.data?.pets || [];
          allPets = [...allPets, ...purchasedPets];
        }
        
        // Process adopted pets
        if (adoptedPetsRes.status === 'fulfilled') {
          const adoptedPets = adoptedPetsRes.value.data?.data || [];
          allPets = [...allPets, ...adoptedPets];
        }
        
        // Remove duplicates based on petCode or _id
        const uniquePets = allPets.filter((pet, index, self) => {
          // If pet has a petCode, deduplicate based on that
          if (pet.petCode) {
            return index === self.findIndex(p => p.petCode === pet.petCode);
          }
          // If no petCode, deduplicate based on _id
          return index === self.findIndex(p => p._id === pet._id);
        });
        
        setPets(uniquePets);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load pets');
      } finally {
        setLoading(false);
      }
    })();
  }, [])

  if (loading) {
    return (
      <Container sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress size={60} />
      </Container>
    );
  }
  
  if (error) return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>My Pets</Typography>
        <Typography variant="h6" color="text.secondary">You have {pets.length} pet{pets.length !== 1 ? 's' : ''} in your collection</Typography>
      </Box>
      
      {pets.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Box sx={{ fontSize: 64, mb: 2 }}>🐾</Box>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>No pets yet</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You haven't added any pets to your collection yet. Start building your pet family today!
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            startIcon={<AddIcon />}
            onClick={() => navigate('/User/pets/add')}
          >
            Add Your First Pet
          </Button>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {pets.map((pet) => (
              <Grid item xs={12} sm={6} md={4} key={pet._id || pet.petCode}>
                <Box
                  onClick={() => {
                    console.log('Pet card clicked:', pet);
                    // Navigate to the appropriate pet details page
                    // Prioritize petCode-based navigation for centralized registry
                    if (pet.petCode) {
                      console.log('Navigating to centralized pet:', `/pets/centralized/${pet.petCode}`);
                      navigate(`/pets/centralized/${pet.petCode}`);
                    } else if (pet._id) {
                      console.log('Navigating to user pet:', `/User/pets/${pet._id}`);
                      navigate(`/User/pets/${pet._id}`);
                    } else {
                      console.log('No valid ID found for pet');
                      // If no valid ID found, try to use the original logic
                      navigate(`/User/pets/${pet._id || pet.petCode}`);
                    }
                  }}
                  sx={{
                    cursor: 'pointer',
                    height: '100%',
                    '&:hover': { 
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      border: 1,
                      borderColor: 'divider',
                    }}
                  >
                    {/* Pet Image */}
                    <Box
                      component="img"
                      src={'/placeholder-pet.svg'} // Will be updated after component mounts
                      alt={pet.name || 'Pet'}
                      sx={{
                        width: '100%',
                        height: 220,
                        objectFit: 'cover',
                        borderRadius: '8px 8px 0 0',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                      ref={(el) => {
                        if (el) {
                          // First try the basic image resolution
                          const basicImageUrl = getPetImageUrl(pet);
                          if (basicImageUrl && !basicImageUrl.includes('placeholder')) {
                            el.src = basicImageUrl;
                            return;
                          }
                                          
                          // If basic resolution fails, try cross-source fetching
                          fetchPetImageFromSource(pet).then(url => {
                            if (url && !url.includes('placeholder')) {
                              el.src = url;
                            }
                          }).catch(err => {
                            console.error('Failed to fetch pet image from source:', err);
                            // Keep the placeholder if all attempts fail
                          });
                        }
                      }}
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-pet.svg';
                      }}
                    />
                                    
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }} gutterBottom>
                            {pet.name || 'Unnamed Pet'}
                            {pet.petCode && (
                              <Chip 
                                label={pet.petCode} 
                                size="small" 
                                variant="outlined" 
                                color="secondary"
                                sx={{ ml: 1, fontFamily: 'monospace', fontSize: '0.7rem' }} 
                              />
                            )}
                          </Typography>
                                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {pet.species?.name || pet.species || 'Unknown Species'} • {pet.breed || 'Unknown Breed'}
                          </Typography>
                        </Box>
                                        
                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                          <Chip 
                            label={pet.status || pet.currentStatus || 'Unknown'} 
                            size="small" 
                            color="primary" 
                            variant="filled" 
                            sx={{ fontSize: '0.7rem' }}
                          />
                                          
                          {pet.gender && (
                            <Chip 
                              label={pet.gender} 
                              size="small" 
                              color="secondary" 
                              variant="outlined" 
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                                          
                          {pet.age && pet.ageUnit && (
                            <Chip 
                              label={`${pet.age} ${pet.ageUnit}`} 
                              size="small" 
                              variant="outlined" 
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                                          
                          {pet.tags && Array.isArray(pet.tags) && pet.tags.map((tag, idx) => (
                            <Chip 
                              key={idx}
                              label={tag} 
                              size="small" 
                              variant="outlined" 
                              color="info"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          ))}
                                          
                          {pet.source && (
                            <Chip 
                              label={pet.source} 
                              size="small" 
                              variant="outlined" 
                              color="warning"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Stack>
                                        
                        {pet.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.8rem' }}>
                            {pet.description.length > 80 ? pet.description.substring(0, 80) + '...' : pet.description}
                          </Typography>
                        )}
                                        
                        <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="caption" color="text.secondary">
                            Added: {pet.createdAt ? new Date(pet.createdAt).toLocaleDateString() : 'Unknown'}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            ))}
          </Grid>
          
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button 
              variant="contained" 
              color="primary"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => navigate('/User/pets/add')}
              sx={{ px: 4 }}
            >
              Add New Pet
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
};

export default Pets



