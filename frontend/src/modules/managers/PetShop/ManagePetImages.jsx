import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Alert,
  Card,
  CardContent,
  IconButton,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import { 
  AddAPhoto as AddPhotoIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material'
import { apiClient, resolveMediaUrl } from '../../../services/api'

export default function ManagePetImages() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pet, setPet] = useState(null)
  const [images, setImages] = useState([])
  const [openUploadDialog, setOpenUploadDialog] = useState(false)

  // Helper function to build proper image URLs
  const buildImageUrl = (url) => {
    if (!url) return '/placeholder-pet.svg'
    return resolveMediaUrl(url)
  }

  useEffect(() => {
    loadPet()
  }, [id])

  const loadPet = async () => {
    try {
      setLoading(true)
      // Fix: Use the correct endpoint for manager inventory
      const res = await apiClient.get(`/petshop/manager/inventory/${id}`)
      setPet(res.data.data.item)
      // Ensure we're using the properly built image URLs
      const petImages = (res.data.data.item.images || []).map(img => ({
        ...img,
        url: buildImageUrl(img.url)
      }))
      setImages(petImages)
    } catch (err) {
      console.error('Error loading pet:', err)
      setError('Failed to load pet details')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (event) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    
    setSaving(true)
    setError('')
    setSuccess('')
    
    try {
      // For direct file upload, we need to use the upload endpoint
      const file = files[0]
      const formData = new FormData()
      formData.append('file', file)
      
      // Upload image directly using the correct endpoint
      const uploadRes = await apiClient.post(`/petshop/manager/inventory/${id}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      // Refresh pet data to get updated images
      await loadPet()
      setSuccess('Image uploaded successfully')
      setOpenUploadDialog(false)
    } catch (err) {
      console.error('Error uploading images:', err)
      setError('Failed to upload images: ' + (err.response?.data?.message || err.message))
    } finally {
      setSaving(false)
    }
  }

  const removeImage = async (imageId) => {
    try {
      setSaving(true);
      // Call the backend API to remove the image reference from the pet
      await apiClient.delete(`/petshop/manager/inventory/${id}/images/${imageId}`);
      
      // Refresh pet data to get updated images
      await loadPet();
      setSuccess('Image removed successfully');
    } catch (err) {
      console.error('Error removing image:', err);
      setError('Failed to remove image: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  }

  const publishPet = async () => {
    try {
      setSaving(true)
      if (images.length === 0) {
        setError('Please upload at least one image before publishing')
        return
      }
      
      await apiClient.put(`/petshop/manager/inventory/${id}`, { status: 'available_for_sale' })
      setSuccess('Pet published successfully!')
      
      // Redirect to available for sale page after a short delay
      setTimeout(() => {
        navigate('/manager/petshop/for-sale')
      }, 1500)
    } catch (err) {
      console.error('Error publishing pet:', err)
      setError('Failed to publish pet: ' + (err.response?.data?.message || err.message))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    )
  }

  if (!pet) {
    return (
      <Box>
        <Typography variant="h6">Pet not found</Typography>
        <Button onClick={() => navigate('/manager/petshop/inventory')}>Back to Inventory</Button>
      </Box>
    )
  }

  return (
    <Box className="space-y-6">
      <Typography variant="h6" sx={{ mb: 2 }}>Manage Pet Images</Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>
      )}
      
      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6">{pet.name || `Pet ${pet.petCode}`}</Typography>
              <Typography variant="body2" color="textSecondary">
                {pet.breedId?.name} {pet.speciesId?.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Gender: {pet.gender} | Age: {pet.age} {pet.ageUnit}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6">Status: {pet.status}</Typography>
              <Typography variant="body2" color="textSecondary">
                Price: ₹{pet.price?.toFixed(2) || '0.00'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Images ({images.length}/5)</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddPhotoIcon />}
          onClick={() => setOpenUploadDialog(true)}
          disabled={saving || images.length >= 5}
        >
          Add Image
        </Button>
      </Box>
      
      {images.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <AddPhotoIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>No images uploaded</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Upload images to showcase this pet
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<UploadIcon />}
            onClick={() => setOpenUploadDialog(true)}
          >
            Upload Image
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {images.map((image) => (
            <Grid item xs={12} sm={6} md={4} key={image._id}>
              <Card>
                <Box sx={{ position: 'relative', pt: '75%' }}>
                  <img
                    src={image.url}
                    alt={`Pet ${pet.name || pet.petCode}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.src = '/placeholder-pet.svg'
                    }}
                  />
                  <IconButton
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' }
                    }}
                    onClick={() => removeImage(image._id)}
                    disabled={saving}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                  {image.isPrimary && (
                    <Box sx={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      bgcolor: 'primary.main',
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem'
                    }}>
                      Primary
                    </Box>
                  )}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/manager/petshop/manage-inventory')}
        >
          Back to Inventory
        </Button>
        <Button 
          variant="contained" 
          onClick={publishPet}
          disabled={saving || images.length === 0}
        >
          {saving ? <CircularProgress size={24} /> : 'Publish Pet'}
        </Button>
      </Box>
      
      <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)}>
        <DialogTitle>Upload Image</DialogTitle>
        <DialogContent>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={saving}
            style={{ display: 'none' }}
            id="image-upload"
          />
          <label htmlFor="image-upload">
            <Button 
              variant="outlined" 
              component="span"
              disabled={saving}
              fullWidth
            >
              {saving ? <CircularProgress size={24} /> : 'Select Image'}
            </Button>
          </label>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Supported formats: JPG, PNG, GIF, WEBP
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUploadDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}