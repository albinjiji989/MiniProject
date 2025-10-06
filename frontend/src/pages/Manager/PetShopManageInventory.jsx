import React, { useEffect, useMemo, useState } from 'react'
import { Box, Paper, Typography, Grid, TextField, MenuItem, Button, Alert, CircularProgress, Stack, Chip } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiClient } from '../../services/api'

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

const PetShopManageInventory = () => {
  const navigate = useNavigate()
  const query = useQuery()
  const id = query.get('id')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [item, setItem] = useState(null)
  const [species, setSpecies] = useState([])
  const [breeds, setBreeds] = useState([])

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const [res, sp, br] = await Promise.allSettled([
        apiClient.get(`/petshop/inventory/${id}`),
        apiClient.get('/core/species?limit=100'),
        apiClient.get('/core/breeds?limit=100')
      ])
      if (res.status === 'fulfilled') setItem(res.value.data?.data?.item || null)
      if (sp.status === 'fulfilled') setSpecies(sp.value.data?.data?.items || sp.value.data?.data || [])
      if (br.status === 'fulfilled') setBreeds(br.value.data?.data?.items || br.value.data?.data || [])
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load item')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (id) load() }, [id])

  const updateField = (name, value) => setItem(prev => ({ ...prev, [name]: value }))

  const handleSave = async () => {
    if (!id) return
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      const payload = {
        name: item?.name,
        speciesId: item?.speciesId?._id || item?.speciesId,
        breedId: item?.breedId?._id || item?.breedId,
        price: Number(item?.price) || 0,
        status: item?.status || 'in_stock',
        description: item?.description || ''
      }
      const res = await apiClient.put(`/petshop/inventory/${id}`, payload)
      setSuccess(res.data?.message || 'Updated')
      await load()
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to update item')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    if (!window.confirm('Delete this inventory item?')) return
    try {
      await apiClient.delete(`/petshop/inventory/${id}`)
      navigate('/manager/petshop/inventory')
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to delete item')
    }
  }

  if (!id) {
    return (
      <Alert severity="warning">No item id specified. Go back to <Button onClick={() => navigate('/manager/petshop/inventory')}>Inventory</Button></Alert>
    )
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px"><CircularProgress /></Box>
    )
  }

  if (!item) {
    return <Alert severity="error">Inventory item not found</Alert>
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Manage Inventory</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate('/manager/petshop/inventory')}>Back</Button>
          <Button color="error" onClick={handleDelete}>Delete</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </Stack>
      </Stack>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField label="Name" value={item.name || ''} onChange={(e) => updateField('name', e.target.value)} fullWidth />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField label="Price" type="number" value={item.price || ''} onChange={(e) => updateField('price', e.target.value)} fullWidth />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField select label="Status" value={item.status || 'in_stock'} onChange={(e) => updateField('status', e.target.value)} fullWidth>
              <MenuItem value="in_stock">In Stock</MenuItem>
              <MenuItem value="available_for_sale">Available for Sale</MenuItem>
              <MenuItem value="reserved">Reserved</MenuItem>
              <MenuItem value="sold">Sold</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField select label="Species" value={item.speciesId?._id || item.speciesId || ''} onChange={(e) => updateField('speciesId', e.target.value)} fullWidth>
              <MenuItem value=""><em>None</em></MenuItem>
              {species.map(s => (
                <MenuItem key={s._id || s.id} value={s._id || s.id}>{s.displayName || s.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField select label="Breed" value={item.breedId?._id || item.breedId || ''} onChange={(e) => updateField('breedId', e.target.value)} fullWidth>
              <MenuItem value=""><em>None</em></MenuItem>
              {breeds.map(b => (
                <MenuItem key={b._id || b.id} value={b._id || b.id}>{b.name}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField label="Description" value={item.description || ''} onChange={(e) => updateField('description', e.target.value)} fullWidth multiline minRows={3} />
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label={`Code: ${item.petCode || '-'}`} size="small" />
              {item.shop?.name && <Chip label={`Shop: ${item.shop.name}`} size="small" />}
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}

export default PetShopManageInventory
