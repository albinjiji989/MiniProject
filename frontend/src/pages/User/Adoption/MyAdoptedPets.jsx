import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient, resolveMediaUrl } from '../../../services/api'
import { Box, Typography, Grid, Card, CardMedia, CardContent, Chip, Button } from '@mui/material'

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
        const res = await apiClient.get('/adoption/my-adopted-pets')
        const raw = res?.data?.data || []
        const normalized = raw.map(p => ({
          id: p._id || p.id,
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
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>My Adopted Pets</Typography>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      {loading && <Typography>Loading...</Typography>}
      {!loading && pets.length === 0 && (
        <Typography color="text.secondary">You haven't adopted any pets yet.</Typography>
      )}
      <Grid container spacing={3}>
        {pets.map((pet) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={pet.id}>
            <Card>
              {pet.image && (
                <CardMedia component="img" height="180" image={pet.image} alt={pet.name} sx={{ objectFit:'cover' }} />
              )}
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{pet.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{pet.breed} • {pet.species}</Typography>
                <Chip size="small" label={`Adopted on ${pet.adoptionDate}`} />
                {pet.description && (
                  <Typography variant="body2" sx={{ mt: 1 }}>{pet.description}</Typography>
                )}
                <Box sx={{ mt: 1 }}>
                  <Button size="small" onClick={()=>navigate(`/User/pets`)}>View My Pets</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
