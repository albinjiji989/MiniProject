import React from 'react';
import { Box, Typography, Card, CardContent, Avatar, Chip, Skeleton, Button } from '@mui/material';
import { Pets as PetsIcon, Add as AddIcon, ArrowForward as ArrowIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { resolveMediaUrl } from '../../../services/api';

const PetList = ({ pets, loading }) => {
  const navigate = useNavigate();
  
  const handleAddPet = () => {
    navigate('/User/pets/add');
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PetsIcon color="primary" />
          My Pets ({pets.length})
        </Typography>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => navigate('/User/pets')}
          endIcon={<ArrowIcon />}
        >
          View All
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
          {[1, 2, 3].map((i) => (
            <Card key={i} sx={{ minWidth: 280, flex: '0 0 auto' }}>
              <CardContent>
                <Skeleton variant="rectangular" height={60} width={60} sx={{ borderRadius: 2, mb: 2 }} />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" />
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : pets.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <PetsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              No pets yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add your first pet to get started with all our services
            </Typography>
            <Button 
              variant="contained" 
              size="large" 
              startIcon={<AddIcon />} 
              onClick={handleAddPet}
              sx={{ px: 4 }}
            >
              Add Your First Pet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
          {pets.map((pet) => (
            <Card 
              key={pet._id || pet.petCode} 
              sx={{ 
                minWidth: 280, 
                flex: '0 0 auto', 
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  transform: 'translateY(-3px)',
                  boxShadow: 3
                }
              }} 
              onClick={() => navigate(`/User/pets/${pet._id || 'view'}`)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {(() => {
                    const src = resolveMediaUrl(
                      (pet.images?.find?.(img => img?.isPrimary)?.url) ||
                      (pet.images?.[0]?.url) ||
                      pet.imageUrl ||
                      ''
                    );
                    return (
                      <Box
                        component="img"
                        src={src}
                        alt={pet.name || 'Pet'}
                        onError={(e) => { e.currentTarget.src = '/placeholder-pet.svg'; }}
                        sx={{
                          width: 60,
                          height: 60,
                          objectFit: 'cover',
                          borderRadius: '12px',
                          border: '2px solid',
                          borderColor: 'divider'
                        }}
                      />
                    );
                  })()}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="h6" noWrap sx={{ fontWeight: 'bold' }}>
                        {pet.name || 'Unnamed Pet'}
                      </Typography>
                      {(pet.petCode || pet.code) && (
                        <Chip 
                          label={pet.petCode || pet.code} 
                          size="small" 
                          variant="outlined"
                          sx={{ 
                            fontFamily: 'monospace', 
                            fontSize: '0.7rem',
                            height: 20
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {/* Handle case where breed might be an object - MATCHING PETS LIST PAGE */}
                      {(typeof pet.breed === 'object' && pet.breed !== null ? 
                        (pet.breed.name || pet.breed._id || JSON.stringify(pet.breed)) : 
                        (pet.breedId?.name || pet.breed?.name || pet.breed || 'Breed not specified'))} 
                      • 
                      {/* Handle case where gender might be an object - MATCHING PETS LIST PAGE */}
                      {(typeof pet.gender === 'object' && pet.gender !== null ? 
                        (pet.gender.name || pet.gender._id || JSON.stringify(pet.gender)) : 
                        (pet.gender || 'Gender not set'))}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip 
                        label={pet.status || pet.currentStatus || 'Owned'} 
                        size="small" 
                        color={
                          pet.status === 'adopted' ? 'success' :
                          pet.status === 'reserved' ? 'warning' :
                          'primary'
                        }
                        variant="outlined"
                      />
                      {/* UPDATED TAG HANDLING - MATCHING PETS LIST PAGE */}
                      {pet.tags?.includes('purchased') && (
                        <Chip label="Purchased" size="small" color="info" variant="outlined" />
                      )}
                      {pet.tags?.includes('adoption') && (
                        <Chip label="Adopted" size="small" color="success" variant="outlined" />
                      )}
                      {pet.tags?.includes('petshop') && (
                        <Chip label="Pet Shop" size="small" color="info" variant="outlined" />
                      )}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default PetList;