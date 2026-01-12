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
        
        // Use the unified API endpoint that returns all pets with temporaryCareStatus
        const response = await userPetsAPI.getAllPets();
        const allPets = response.data?.data?.pets || [];
        
        console.log('🐾 LOADED PETS FROM UNIFIED API:', allPets.length);
        console.log('🐾 SAMPLE PET DATA:', allPets[0]);
        console.log('🐾 ALL PETS:', allPets.map(p => ({
          name: p.name,
          petCode: p.petCode,
          source: p.source,
          hasImages: !!p.images,
          imagesLength: p.images?.length,
          firstImageUrl: p.images?.[0]?.url,
          temporaryCareStatus: p.temporaryCareStatus
        })));
        
        setPets(allPets);
      } catch (e) {
        console.error('❌ Error loading pets:', e);
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
                    console.log('🖱️ CLICKED PET:', { _id: pet._id, petCode: pet.petCode, name: pet.name, source: pet.source });
                    // ALWAYS use petCode for navigation - it's the universal identifier
                    if (pet.petCode) {
                      console.log('✅ Using petCode route:', `/User/pets/centralized/${pet.petCode}`);
                      navigate(`/User/pets/centralized/${pet.petCode}`);
                    } else {
                      console.log('⚠️ No petCode, using _id route:', `/User/pets/${pet._id}`);
                      // Fallback to _id only for user pets without petCode
                      navigate(`/User/pets/${pet._id}`);
                    }
                  }}
                  sx={{
                    minWidth: 280,
                    maxWidth: 320,
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'visible',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { 
                      transform: 'translateY(-8px)',
                      boxShadow: (theme) => {
                        const isAdopted = pet?.tags?.includes('adoption') || pet?.status === 'adopted';
                        const isPurchased = pet?.tags?.includes('purchased') || pet?.source === 'petshop';
                        const color = isAdopted ? '#10b981' : isPurchased ? '#3b82f6' : '#8b5cf6';
                        return `0 12px 24px rgba(${parseInt(color.slice(1,3),16)}, ${parseInt(color.slice(3,5),16)}, ${parseInt(color.slice(5,7),16)}, 0.3)`;
                      }
                    }
                  }}
                >
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                    }}
                  >
                    {/* Color Band at Top */}
                    <Box sx={{ 
                      height: 6,
                      background: (() => {
                        const isAdopted = pet?.tags?.includes('adoption') || pet?.status === 'adopted';
                        const isPurchased = pet?.tags?.includes('purchased') || pet?.source === 'petshop';
                        return isAdopted 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : isPurchased 
                          ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                          : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
                      })(),
                      borderTopLeftRadius: 'inherit',
                      borderTopRightRadius: 'inherit'
                    }} />
                    
                    {/* Pet Image */}
                    <Box
                      component="img"
                      src={(() => {
                        // Images are already resolved URLs from backend
                        if (pet.images && Array.isArray(pet.images) && pet.images.length > 0) {
                          const primaryImage = pet.images.find(img => img.isPrimary) || pet.images[0];
                          if (primaryImage && primaryImage.url) {
                            return primaryImage.url; // Already resolved by backend
                          }
                        }
                        return '/placeholder-pet.svg';
                      })()}
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
                            {pet.species?.displayName || pet.species?.name || 'Unknown Species'} • {pet.breed?.name || 'Unknown Breed'}
                          </Typography>
                        </Box>
                                        
                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                          <Chip 
                            label={pet.currentStatus || 'Unknown'} 
                            size="small" 
                            color="primary" 
                            variant="filled" 
                            sx={{ fontSize: '0.7rem' }}
                          />
                          
                          {/* Temporary Care Tag */}
                          {pet.temporaryCareStatus?.inCare && (
                            <Chip 
                              label="In Temporary Care" 
                              size="small" 
                              color="warning" 
                              variant="filled"
                              sx={{ 
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                bgcolor: 'warning.main',
                                color: 'warning.contrastText'
                              }}
                            />
                          )}
                                          
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
                                        
                        {pet.description && pet.description !== 'N/A' && pet.description.trim() !== '' && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.8rem' }}>
                            {pet.description.length > 80 ? pet.description.substring(0, 80) + '...' : pet.description}
                          </Typography>
                        )}
                                        
                        <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="caption" color="text.secondary">
                            Added: {pet.createdAt || pet.acquiredDate || pet.adoptionDate || pet.purchaseDate ? 
                              new Date(pet.createdAt || pet.acquiredDate || pet.adoptionDate || pet.purchaseDate).toLocaleDateString() : 
                              'Unknown'}
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



