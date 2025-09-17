import React, { useState } from 'react'
import { Box, Typography, Card, CardContent, Button, Grid, TextField, MenuItem, Alert, Avatar } from '@mui/material'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { petsAPI } from '../../services/api'

const AddPet = () => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    species: '',
    breed: '',
    color: '',
    gender: 'unknown',
    age: '',
    size: 'medium',
    weight: '',
    microchipId: ''
  })
  const [images, setImages] = useState([])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      const payload = {
        name: form.name,
        species: form.species,
        breed: form.breed || undefined,
        color: form.color || undefined,
        gender: form.gender || 'unknown',
        size: form.size || 'medium',
        ageYears: form.age ? Number(form.age) : undefined,
        weightKg: form.weight ? Number(form.weight) : undefined,
        microchipId: form.microchipId || undefined,
        images: images.length ? images : undefined,
      }
      await petsAPI.createPet(payload)
      navigate('/pets')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create pet')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onFilesSelected = async (event) => {
    const files = Array.from(event.target.files || [])
    const toBase64 = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    const results = []
    for (const file of files) {
      try {
        const b64 = await toBase64(file)
        results.push(b64)
      } catch (e) { /* ignore single file failure */ }
    }
    setImages((prev) => [...prev, ...results])
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/pets')}
          sx={{ mr: 2 }}
        >
          Back to Pets
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Add New Pet
        </Typography>
      </Box>

      <Card component="form" onSubmit={handleSubmit}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Add New Pet
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth required label="Name" name="name" value={form.name} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth required label="Species" name="species" value={form.species} onChange={handleChange}>
                {['dog','cat','bird','rabbit','hamster','fish','reptile','other'].map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Breed" name="breed" value={form.breed} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Color" name="color" value={form.color} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Gender" name="gender" value={form.gender} onChange={handleChange}>
                {['male','female','unknown'].map((g) => (
                  <MenuItem key={g} value={g}>{g}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth type="number" label="Age (years)" name="age" value={form.age} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField select fullWidth label="Size" name="size" value={form.size} onChange={handleChange}>
                {['small','medium','large','extra_large'].map((sz) => (
                  <MenuItem key={sz} value={sz}>{sz}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth type="number" label="Weight (kg)" name="weight" value={form.weight} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Microchip ID" name="microchipId" value={form.microchipId} onChange={handleChange} />
            </Grid>
            {/* Image upload */}
            <Grid item xs={12}>
              <Button component="label" variant="outlined">
                Upload Images
                <input hidden multiple accept="image/*" type="file" onChange={onFilesSelected} />
              </Button>
            </Grid>
            {images.length > 0 && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {images.map((src, idx) => (
                    <Avatar key={idx} src={src} variant="rounded" sx={{ width: 72, height: 72 }} />
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate('/pets')}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>Save Pet</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default AddPet
