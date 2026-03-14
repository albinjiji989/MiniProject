import React, { useEffect, useState } from 'react'
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CircularProgress, 
  Chip,
  Stack,
  Alert
} from '@mui/material'
import { apiClient, userPetsAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'

const Pets = () => {
  const [pets, setPets] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

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
        console.log('🐾 SPECIES/BREED DEBUG:', allPets.slice(0, 3).map(p => ({
          name: p.name,
          species: p.species,
          speciesId: p.speciesId,
          breed: p.breed,
          breedId: p.breedId
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
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: 'primary.main', fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}>My Pets</Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>You have {pets.length} pet{pets.length !== 1 ? 's' : ''} in your collection</Typography>
      </Box>
      
      {pets.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: { xs: 6, sm: 8 }, bgcolor: 'grey.50', borderRadius: 2, mx: { xs: 1, sm: 0 } }}>
          <Box sx={{ fontSize: { xs: 48, sm: 64 }, mb: 2 }}>🐾</Box>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>No pets yet</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontSize: { xs: '0.875rem', sm: '1rem' }, px: { xs: 2, sm: 0 } }}>
            You haven't added any pets to your collection yet.
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {pets.map((pet) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={pet._id || pet.petCode}>
                <Card
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
                    height: '100%',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
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
                      height: { xs: 160, sm: 180 },
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
                                  
                  <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }} gutterBottom>
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
                                        
                        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {(() => {
                            // Handle species display
                            let speciesDisplay = 'Unknown Species';
                            if (pet.species) {
                              if (typeof pet.species === 'string') {
                                speciesDisplay = pet.species;
                              } else if (pet.species.displayName) {
                                speciesDisplay = pet.species.displayName;
                              } else if (pet.species.name) {
                                speciesDisplay = pet.species.name;
                              }
                            } else if (pet.speciesId) {
                              if (typeof pet.speciesId === 'string') {
                                speciesDisplay = pet.speciesId;
                              } else if (pet.speciesId.displayName) {
                                speciesDisplay = pet.speciesId.displayName;
                              } else if (pet.speciesId.name) {
                                speciesDisplay = pet.speciesId.name;
                              }
                            }

                            // Handle breed display
                            let breedDisplay = 'Unknown Breed';
                            if (pet.breed) {
                              if (typeof pet.breed === 'string') {
                                breedDisplay = pet.breed;
                              } else if (pet.breed.name) {
                                breedDisplay = pet.breed.name;
                              } else if (pet.breed.displayName) {
                                breedDisplay = pet.breed.displayName;
                              }
                            } else if (pet.breedId) {
                              if (typeof pet.breedId === 'string') {
                                breedDisplay = pet.breedId;
                              } else if (pet.breedId.name) {
                                breedDisplay = pet.breedId.name;
                              } else if (pet.breedId.displayName) {
                                breedDisplay = pet.breedId.displayName;
                              }
                            }

                            return `${speciesDisplay} • ${breedDisplay}`;
                          })()}
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
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                          {pet.description.length > 80 ? pet.description.substring(0, 80) + '...' : pet.description}
                        </Typography>
                      )}
                                      
                      <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                          Added: {pet.createdAt || pet.acquiredDate || pet.adoptionDate || pet.purchaseDate ? 
                            new Date(pet.createdAt || pet.acquiredDate || pet.adoptionDate || pet.purchaseDate).toLocaleDateString() : 
                            'Unknown'}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Container>
  );
};

export default Pets



