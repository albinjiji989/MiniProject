import React, { useMemo, useState } from 'react'
import { Box, Typography, Card, CardContent, Button, Grid, TextField, Alert, IconButton, Chip } from '@mui/material'
import { ArrowBack as ArrowBackIcon, Delete as DeleteIcon, ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon } from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { petsAPI } from '../../../services/api'

const AddPetDetails = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const step1 = useMemo(() => location.state?.step1 || {}, [location.state])

  const [color, setColor] = useState('')
  const [images, setImages] = useState(step1?.images || [])
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        // eslint-disable-next-line no-await-in-loop
        const b64 = await toBase64(file)
        results.push(b64)
      } catch (_) {}
    }

  const moveImage = (index, dir) => {
    setImages((prev) => {
      const arr = [...prev]
      const newIndex = index + dir
      if (newIndex < 0 || newIndex >= arr.length) return arr
      const tmp = arr[newIndex]
      arr[newIndex] = arr[index]
      arr[index] = tmp
      return arr
    })
  }

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }
    setImages((prev) => [...prev, ...results])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      if (!step1?.name) throw new Error('Basic details missing. Please start again.')

      const payload = {
        ...step1,
        ...(color?.trim() ? { color: color.trim() } : {}),
        images: images.map((b64, idx) => ({ url: b64, isPrimary: idx === 0 }))
      }
      const res = await petsAPI.createPet(payload)
      const pet = res?.data?.data?.pet || res?.data?.pet
      // After successful creation: go to success page with pet info
      navigate('/User/pets/add/success', { replace: true, state: { petId: pet?._id, petCode: pet?.petCode, name: pet?.name } })
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to create pet')
    } finally {
      setIsSubmitting(false)
    }
  }

  const restartFlow = () => navigate('/User/pets/add', { replace: true })

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mr: 2 }}>Back</Button>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Add Pet — Details</Typography>
      </Box>

      {!step1?.name ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Missing basic details. <Button color="inherit" size="small" onClick={restartFlow}>Start again</Button>
        </Alert>
      ) : null}

      <Card component="form" onSubmit={handleSubmit}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Basic: {step1?.name || '—'} • {step1?.gender || '—'} • {step1?.age ?? '—'} {step1?.ageUnit || ''}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Color (optional)" value={color} onChange={(e) => setColor(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ mb: 1 }}>Preview</Typography>
              <Box sx={{ width: 48, height: 48, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: color || 'transparent' }} />
              {color && (
                <Chip size="small" label={color} sx={{ ml: 1, mt: 1 }} />
              )}
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" component="label">
                Upload Images
                <input type="file" hidden multiple accept="image/*" onChange={onFilesSelected} />
              </Button>
              <Typography variant="caption" sx={{ ml: 1 }}>
                Add 1 or more photos (first will be primary)
              </Typography>
            </Grid>
            {images?.length ? (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {images.map((src, idx) => (
                    <Box key={idx} sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Box component="img" src={src} alt={`pet-${idx}`} sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 0.5 }} />
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton size="small" onClick={() => moveImage(idx, -1)} disabled={idx === 0}><ArrowLeftIcon fontSize="inherit" /></IconButton>
                        <IconButton size="small" onClick={() => moveImage(idx, 1)} disabled={idx === images.length - 1}><ArrowRightIcon fontSize="inherit" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => removeImage(idx)}><DeleteIcon fontSize="inherit" /></IconButton>
                      </Box>
                      {idx === 0 && <Typography variant="caption" color="text.secondary">Primary</Typography>}
                    </Box>
                  ))}
                </Box>
              </Grid>
            ) : null}
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={restartFlow}>Start Over</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>Create Pet</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default AddPetDetails
