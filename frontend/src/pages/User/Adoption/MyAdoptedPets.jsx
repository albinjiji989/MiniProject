import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adoptionAPI, resolveMediaUrl } from '../../../services/api'
import { Box, Typography, Grid, Card, CardMedia, CardContent, Chip, Button, CircularProgress } from '@mui/material'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'

export default function MyAdoptedPets() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [pets, setPets] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await adoptionAPI.getMyAdoptedPets()
        const raw = res?.data?.data || []
        const normalized = raw.map(p => ({
          id: p._id || p.id,
          petCode: p.petCode || p._id || p.id,
          name: p.name || 'Pet',
          species: p.species || '-',
          breed: p.breed || '-',
          gender: p.gender || '-',
          image: resolveMediaUrl(p?.images?.[0]?.url || ''),
          adoptionDate: p.adoptionDate ? new Date(p.adoptionDate).toLocaleDateString() : '-',
          description: p.description || ''
        }))
        setPets(normalized)
      } catch (e) {
        setError('Failed to load adopted pets')
        console.error('Error loading adopted pets:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>My Adopted Pets</Typography>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/User/adoption')}
        >
          Back to Adoption Center
        </Button>
      </Box>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}
      {!loading && pets.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>You haven't adopted any pets yet.</Typography>
          <Button variant="contained" onClick={() => navigate('/User/adoption')}>Adopt a Pet</Button>
        </Box>
      )}
      <Grid container spacing={3}>
        {pets.map((pet) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={pet.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {pet.image ? (
                <CardMedia 
                  component="img" 
                  height="180" 
                  image={pet.image} 
                  alt={pet.name} 
                  sx={{ objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.src = '/placeholder-pet.svg' }}
                />
              ) : (
                <Box sx={{ 
                  height: 180, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: 'grey.100'
                }}>
                  <Typography variant="h3" color="text.secondary">🐾</Typography>
                </Box>
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>{pet.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {pet.breed} • {pet.species}
                </Typography>
                <Chip 
                  size="small" 
                  label={`Adopted on ${pet.adoptionDate}`} 
                  sx={{ mb: 1 }}
                />
                {pet.description && (
                  <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                    {pet.description}
                  </Typography>
                )}
                <Box sx={{ mt: 2 }}>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => navigate(`/User/adoption/detail/${pet.petCode}`)}
                  >
                    View Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}