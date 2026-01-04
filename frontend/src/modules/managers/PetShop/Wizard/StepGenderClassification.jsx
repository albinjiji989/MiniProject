import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Alert,
  Paper,
  Card,
  CardContent,
  CardMedia,
  CircularProgress
} from '@mui/material'
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon } from '@mui/icons-material'

const KEY = 'petshop_wizard'

export default function StepGenderClassification() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    maleCount: 0,
    femaleCount: 0,
    maleImages: [],
    femaleImages: []
  })
  const [uploading, setUploading] = useState(false)

  // Load existing data
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '{}')
      const genderData = saved.gender || {}
      
      setForm({
        maleCount: parseInt(genderData.maleCount) || 0,
        femaleCount: parseInt(genderData.femaleCount) || 0,
        maleImages: genderData.maleImages || [],
        femaleImages: genderData.femaleImages || []
      })
    } catch (e) {
      console.error('Failed to load saved data', e)
    }
  }, [])

  const save = (newForm) => {
    const prev = JSON.parse(localStorage.getItem(KEY) || '{}')
    const next = { ...prev, gender: newForm }
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  const updateQuantity = (field, value) => {
    const numValue = Math.max(0, parseInt(value) || 0)
    const updatedForm = { ...form, [field]: numValue }
    
    setForm(updatedForm)
    save(updatedForm)
    
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleImageUpload = async (e, gender) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      
      // Convert to base64 for storage (or you can keep file reference)
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result
        const updatedForm = { 
          ...form, 
          [gender === 'male' ? 'maleImages' : 'femaleImages']: [base64]
        }
        
        setForm(updatedForm)
        save(updatedForm)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError(`Failed to upload ${gender} image: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (gender) => {
    const updatedForm = { 
      ...form, 
      [gender === 'male' ? 'maleImages' : 'femaleImages']: []
    }
    setForm(updatedForm)
    save(updatedForm)
  }

  const validate = () => {
    const totalAssigned = form.maleCount + form.femaleCount
    if (totalAssigned === 0) {
      setError('At least one pet must be assigned (male or female)')
      return false
    }
    return true
  }

  const next = () => {
    if (!validate()) return
    navigate('/manager/petshop/wizard/review')
  }

  const back = () => navigate('/manager/petshop/wizard/pricing')

  return (
    <Box className="space-y-6">
      <Typography variant="h6" sx={{ mb: 2 }}>Gender Classification & Images</Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Define the gender split and upload representative images for each gender.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Gender Distribution</Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Male Count"
              value={form.maleCount}
              onChange={(e) => updateQuantity('maleCount', e.target.value)}
              InputProps={{
                inputProps: { min: 0 }
              }}
              helperText="Number of male pets in this stock"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Female Count"
              value={form.femaleCount}
              onChange={(e) => updateQuantity('femaleCount', e.target.value)}
              InputProps={{
                inputProps: { min: 0 }
              }}
              helperText="Number of female pets in this stock"
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Summary</Typography>
          <Typography variant="body2">Male: {form.maleCount}</Typography>
          <Typography variant="body2">Female: {form.femaleCount}</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
            Total: {form.maleCount + form.femaleCount}
          </Typography>
        </Box>
      </Paper>

      {/* Image Upload Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>Upload Images</Typography>
        
        <Grid container spacing={3}>
          {/* Male Image Upload */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>Male Image</Typography>
                
                {form.maleImages.length > 0 ? (
                  <Box>
                    <CardMedia
                      component="img"
                      height="200"
                      image={form.maleImages[0]}
                      alt="Male pet"
                      sx={{ mb: 2, borderRadius: 1 }}
                    />
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => removeImage('male')}
                    >
                      Remove Image
                    </Button>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: '2px dashed #ccc',
                      borderRadius: 1,
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                    component="label"
                  >
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'male')}
                      disabled={uploading}
                    />
                    {uploading ? (
                      <CircularProgress />
                    ) : (
                      <Box>
                        <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="body2">Click to upload male image</Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Female Image Upload */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>Female Image</Typography>
                
                {form.femaleImages.length > 0 ? (
                  <Box>
                    <CardMedia
                      component="img"
                      height="200"
                      image={form.femaleImages[0]}
                      alt="Female pet"
                      sx={{ mb: 2, borderRadius: 1 }}
                    />
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => removeImage('female')}
                    >
                      Remove Image
                    </Button>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: '2px dashed #ccc',
                      borderRadius: 1,
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                    component="label"
                  >
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'female')}
                      disabled={uploading}
                    />
                    {uploading ? (
                      <CircularProgress />
                    ) : (
                      <Box>
                        <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="body2">Click to upload female image</Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button 
          variant="outlined" 
          onClick={back}
          size="large"
        >
          Back
        </Button>
        <Button 
          variant="contained" 
          onClick={next}
          size="large"
          disabled={form.maleCount + form.femaleCount === 0}
        >
          Next: Review & Submit
        </Button>
      </Box>
    </Box>
  )
}