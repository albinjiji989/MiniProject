import React, { useMemo, useState } from 'react'
import { Box, Typography, Card, CardContent, Button, Grid, Alert, IconButton, CircularProgress } from '@mui/material'
import { 
  ArrowBack as ArrowBackIcon, 
  Delete as DeleteIcon, 
  ArrowLeft as ArrowLeftIcon, 
  ArrowRight as ArrowRightIcon,
  AddAPhoto as AddPhotoIcon,
  Pets as PetsIcon
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { userPetsAPI } from '../../../services/api'

const AddPetDetails = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const step1 = useMemo(() => location.state?.step1 || {}, [location.state])

  const [images, setImages] = useState(step1?.images || [])
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length + images.length > 5) {
      setError('You can upload maximum 5 images')
      return
    }
    
    files.forEach(file => {
      if (!file.type.match('image.*')) {
        setError('Please select only image files')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setImages(prev => [...prev, e.target.result])
      }
      reader.readAsDataURL(file)
    })
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      if (!step1?.name) throw new Error('Basic details missing. Please start again.')

      const payload = {
        ...step1,
        images: images.map((img, idx) => ({ url: img, isPrimary: idx === 0 }))
      }
      
      const res = await userPetsAPI.create(payload)
      const pet = res?.data?.data?.pet || res?.data?.pet
      
      // After successful creation: go to success page with pet info
      navigate('/User/pets/add/success', { 
        replace: true, 
        state: { 
          petId: pet?._id, 
          petCode: pet?.petCode, 
          name: pet?.name 
        } 
      })
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to create pet')
    } finally {
      setIsSubmitting(false)
    }
  }

  const restartFlow = () => navigate('/User/pets/add', { replace: true })

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Add Pet — Details
        </Typography>
      </Box>

      {!step1?.name ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Missing basic details. <Button color="inherit" size="small" onClick={restartFlow}>Start again</Button>
        </Alert>
      ) : null}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Review Basic Information
          </Typography>
          <Box sx={{ 
            p: 2, 
            bgcolor: 'grey.50', 
            borderRadius: 1, 
            mb: 3,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Name</Typography>
                <Typography variant="body1">{step1?.name || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Gender</Typography>
                <Typography variant="body1">{step1?.gender || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Age</Typography>
                <Typography variant="body1">
                  {step1?.age ?? '—'} {step1?.ageUnit || ''}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Species</Typography>
                <Typography variant="body1">
                  {step1?.speciesId ? 'Selected' : '—'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Breed</Typography>
                <Typography variant="body1">
                  {step1?.breedId ? 'Selected' : '—'}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Typography variant="h6" sx={{ mb: 2 }}>
            Add Photos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload photos of your pet. You can upload up to 5 images. The first image will be used as the primary photo.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="image-upload"
                type="file"
                onChange={handleFileSelect}
                multiple
              />
              <label htmlFor="image-upload">
                <Button 
                  variant="outlined" 
                  component="span"
                  startIcon={<AddPhotoIcon />}
                >
                  Upload Images
                </Button>
              </label>
              <Typography variant="caption" sx={{ ml: 1 }}>
                Add up to 5 photos (first will be primary)
              </Typography>
            </Grid>
            
            {images?.length > 0 ? (
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Uploaded Images ({images.length}/5)
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {images.map((src, idx) => (
                    <Box 
                      key={idx} 
                      sx={{ 
                        display: 'inline-flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        p: 1, 
                        border: '1px solid', 
                        borderColor: 'divider', 
                        borderRadius: 1,
                        position: 'relative'
                      }}
                    >
                      <Box 
                        component="img" 
                        src={src} 
                        alt={`pet-${idx}`} 
                        sx={{ 
                          width: 100, 
                          height: 100, 
                          objectFit: 'cover', 
                          borderRadius: 0.5,
                          mb: 1
                        }} 
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => moveImage(idx, -1)} 
                          disabled={idx === 0}
                        >
                          <ArrowLeftIcon fontSize="inherit" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => moveImage(idx, 1)} 
                          disabled={idx === images.length - 1}
                        >
                          <ArrowRightIcon fontSize="inherit" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => removeImage(idx)}
                        >
                          <DeleteIcon fontSize="inherit" />
                        </IconButton>
                      </Box>
                      {idx === 0 && (
                        <Typography 
                          variant="caption" 
                          color="primary" 
                          sx={{ 
                            position: 'absolute', 
                            top: 4, 
                            right: 4, 
                            bgcolor: 'white', 
                            px: 0.5, 
                            borderRadius: 1,
                            fontWeight: 'bold'
                          }}
                        >
                          Primary
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 4, 
                  border: '2px dashed', 
                  borderColor: 'divider', 
                  borderRadius: 1 
                }}>
                  <PetsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No images uploaded yet
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>

          <Box sx={{ 
            mt: 3, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            pt: 2,
            borderTop: 1,
            borderColor: 'divider'
          }}>
            <Button 
              variant="outlined" 
              onClick={restartFlow}
            >
              Start Over
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={isSubmitting}
              onClick={handleSubmit}
              endIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            >
              {isSubmitting ? 'Creating Pet...' : 'Create Pet'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default AddPetDetails