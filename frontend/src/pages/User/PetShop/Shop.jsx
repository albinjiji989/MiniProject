import React, { useEffect, useState } from 'react'
import { Box, Container, Typography, Grid, Card, CardContent, CardMedia, Chip, Button, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material'
import { petShopStockAPI } from '../../../services/api'
import { speciesAPI, breedsAPI } from '../../../services/petSystemAPI'
import { useNavigate } from 'react-router-dom'
import { Pets as PetsIcon, Male, Female } from '@mui/icons-material'
import { resolveMediaUrl } from '../../../services/api'

const Shop = () => {
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [batches, setBatches] = useState([])
  const [species, setSpecies] = useState([])
  const [breedsBySpecies, setBreedsBySpecies] = useState({})
  const [filters, setFilters] = useState({ speciesId: '', breedId: '', minPrice: '', maxPrice: '' })

  const load = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filters.speciesId) params.speciesId = filters.speciesId
      if (filters.breedId) params.breedId = filters.breedId
      if (filters.minPrice) params.minPrice = filters.minPrice
      if (filters.maxPrice) params.maxPrice = filters.maxPrice
      const res = await petShopStockAPI.listPublicStocks(params)
      // Support both batches and stocks for backward compatibility
      setBatches(res.data.data.batches || res.data.data.stocks || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load pet batches')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() // eslint-disable-next-line
  }, [])

  useEffect(() => { seedSpecies() }, [])

  const seedSpecies = async () => {
    try {
      const res = await speciesAPI.list()
      setSpecies(res?.data?.data || res?.data || [])
    } catch (e) {}
  }

  const ensureBreeds = async (speciesId) => {
    if (!speciesId || breedsBySpecies[speciesId]) return
    try {
      const res = await breedsAPI.getBySpecies(speciesId)
      setBreedsBySpecies((prev) => ({ ...prev, [speciesId]: res?.data?.data || res?.data || [] }))
    } catch (e) {
      setBreedsBySpecies((prev) => ({ ...prev, [speciesId]: [] }))
    }
  }

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}><CircularProgress /></Box>
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: 'primary.main' }}>
        Pet Batches
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="species">Species</InputLabel>
          <Select labelId="species" label="Species" value={filters.speciesId} onChange={async (e) => {
            const val = e.target.value
            setFilters((f) => ({ ...f, speciesId: val, breedId: '' }))
            await ensureBreeds(val)
          }}>
            <MenuItem value=""><em>All</em></MenuItem>
            {species.map((s) => (
              <MenuItem key={s._id || s.id} value={s._id || s.id}>{s.displayName || s.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }} disabled={!filters.speciesId}>
          <InputLabel id="breed">Breed</InputLabel>
          <Select labelId="breed" label="Breed" value={filters.breedId} onChange={(e) => setFilters((f) => ({ ...f, breedId: e.target.value }))}>
            <MenuItem value=""><em>All</em></MenuItem>
            {(breedsBySpecies[filters.speciesId] || []).map((b) => (
              <MenuItem key={b._id || b.id} value={b._id || b.id}>{b.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField label="Min Price" type="number" value={filters.minPrice} onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))} />
        <TextField label="Max Price" type="number" value={filters.maxPrice} onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))} />
        <Button variant="contained" onClick={load}>Filter</Button>
        <Button onClick={() => { setFilters({ speciesId: '', breedId: '', minPrice: '', maxPrice: '' }); setItems([]); setTimeout(load, 0) }}>Reset</Button>
      </Box>

      <Grid container spacing={3}>
        {batches.map((batch) => {
          const displayImage = batch.images && batch.images.length > 0 
            ? resolveMediaUrl(batch.images[0]?.url || batch.images[0]) 
            : null
          const categoryName = batch.category || batch.tags?.[0] || 'Pet'
          const speciesName = batch.species?.displayName || batch.species?.name || 'Species'
          const breedName = batch.breed?.name || 'Breed'
          const ageDisplay = batch.age ? `${batch.age} ${batch.ageUnit || 'months'}` : 'Age not specified'
          
          return (
            <Grid item xs={12} sm={6} md={4} key={batch._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
                onClick={() => navigate(`/User/petshop/stock/${batch._id}`)}
              >
                <CardMedia 
                  component="img"
                  sx={{ height: 200, objectFit: 'cover' }}
                  image={displayImage || '/placeholder-pet.svg'}
                  alt={batch.name || 'Pet Batch'}
                />
                <CardContent>
                  {batch.category && (
                    <Chip 
                      label={categoryName} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />
                  )}
                  <Typography variant="h6" gutterBottom>
                    {batch.name || `${breedName} ${speciesName}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {speciesName} • {breedName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Age: {ageDisplay}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    {batch.maleCount > 0 && (
                      <Chip 
                        icon={<Male fontSize="small" />}
                        label={`${batch.maleCount} Male`} 
                        size="small" 
                        color="info" 
                        variant="outlined"
                      />
                    )}
                    {batch.femaleCount > 0 && (
                      <Chip 
                        icon={<Female fontSize="small" />}
                        label={`${batch.femaleCount} Female`} 
                        size="small" 
                        color="secondary" 
                        variant="outlined"
                      />
                    )}
                    <Chip 
                      label={`₹${batch.price || 0}`} 
                      size="small" 
                      color="success" 
                      variant="filled"
                    />
                  </Box>
                  <Button 
                    variant="contained" 
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/User/petshop/stock/${batch._id}`)
                    }}
                  >
                    View Batch Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {batches.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <PetsIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No pet batches available right now</Typography>
        </Box>
      )}
    </Container>
  )
}

export default Shop
