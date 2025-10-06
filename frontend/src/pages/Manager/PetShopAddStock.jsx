import React, { useState } from 'react'
import { Box, Paper, Typography, Grid, TextField, Button, Alert, CircularProgress } from '@mui/material'
import { useAuth } from '../../contexts/AuthContext'
import { apiClient } from '../../services/api'

const PetShopAddStock = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    speciesId: '',
    breedId: '',
    price: '',
    quantity: 1,
    description: ''
  })

  // Note: Species/Breeds metadata endpoints not available; using free-text optional IDs

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        name: form.name,
        speciesId: form.speciesId || undefined,
        breedId: form.breedId || undefined,
        price: Number(form.price) || 0,
        quantity: Number(form.quantity) || 1,
        description: form.description || ''
      }
      const res = await apiClient.post('/petshop/inventory', payload)
      setSuccess(res.data?.message || 'Pet added to inventory successfully')
      setForm({ name: '', speciesId: '', breedId: '', price: '', quantity: 1, description: '' })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add stock')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Add Stock</Typography>
      <Paper sx={{ p: 3 }}>
        {user?.storeId && (
          <Alert severity="info" sx={{ mb: 2 }}>Adding to your store ID: <strong>{user.storeId}</strong></Alert>
        )}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Price" name="price" type="number" value={form.price} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Species ID (optional)" name="speciesId" value={form.speciesId} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Breed ID (optional)" name="breedId" value={form.breedId} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Quantity" name="quantity" type="number" value={form.quantity} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Description" name="description" value={form.description} onChange={handleChange} multiline minRows={3} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={20} /> : 'Add to Inventory'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  )
}

export default PetShopAddStock
