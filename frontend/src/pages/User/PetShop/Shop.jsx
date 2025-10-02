import React, { useEffect, useState } from 'react'
import { Box, Container, Typography, Grid, Card, CardContent, CardMedia, Chip, Button, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material'
import { petShopAPI } from '../../../services/api'
import { speciesAPI, breedsAPI } from '../../../services/petSystemAPI'
import { useNavigate } from 'react-router-dom'
import { Pets as PetsIcon } from '@mui/icons-material'

const Shop = () => {
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [items, setItems] = useState([])
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
      const res = await petShopAPI.listPublicListings(params)
      setItems(res.data.data.items || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load pets for sale')
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
        Pets for Sale
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
        {items.map((it) => (
          <Grid item xs={12} sm={6} md={4} key={it._id}>
            <Card sx={{ height: '100%' }}>
              <CardMedia component="div" sx={{ height: 180, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PetsIcon sx={{ fontSize: 60, color: 'white', opacity: 0.85 }} />
              </CardMedia>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {it.name || 'Pet'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  <Chip label={`Price: ${it.price || 0}`} size="small" color="success" variant="outlined" />
                  <Chip label={it.status} size="small" color="primary" variant="outlined" />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" size="small" onClick={() => navigate(`/User/petshop/pet/${it._id}`)}>
                    View Details
                  </Button>
                  <Button size="small" disabled>
                    Buy (Coming Soon)
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {items.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <PetsIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No pets available right now</Typography>
        </Box>
      )}
    </Container>
  )
}

export default Shop
