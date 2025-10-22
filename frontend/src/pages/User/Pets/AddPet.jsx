import React, { useEffect, useState } from 'react'
import { Box, Typography, Card, CardContent, Button, Grid, TextField, MenuItem, Alert, Avatar, IconButton, CircularProgress } from '@mui/material'
import { ArrowBack as ArrowBackIcon, AddAPhoto as AddPhotoIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { userPetsAPI } from '../../../services/api'
import { processImageFiles } from '../../../utils/imageUtils'
import RequestModal from '../../../components/Common/RequestModal'

const AddPet = () => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    speciesId: '',
    breedId: '',
    gender: 'Unknown',
    age: '',
    ageUnit: 'months'
  })
  const [images, setImages] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [speciesList, setSpeciesList] = useState([])
  const [breedList, setBreedList] = useState([])
  const [requestMessage, setRequestMessage] = useState('')
  const [showRequestModal, setShowRequestModal] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('📤 Submitting pet creation form');
    setIsSubmitting(true);
    setError('');
    try {
      if (!form.name?.trim()) throw new Error('Pet name is required');
      if (!form.gender) throw new Error('Gender is required');
      if (form.age === '' || form.age === null) throw new Error('Age is required');
      
      // Prepare data for submission
      const payload = {
        name: form.name,
        age: form.age ? Number(form.age) : undefined,
        ageUnit: form.ageUnit,
        gender: form.gender,
        speciesId: form.speciesId || undefined,
        breedId: form.breedId || undefined,
        images: images.map((img, idx) => ({ url: img.url, isPrimary: idx === 0 }))
      };
      
      console.log('📦 Sending payload:', JSON.stringify(payload, null, 2));
      
      // Add a timeout to see if there's a network issue
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const res = await userPetsAPI.create(payload);
      clearTimeout(timeoutId);
      
      console.log('✅ Pet creation response:', res);
      
      const pet = res?.data?.data?.pet || res?.data?.pet;
      
      // Navigate to success page with pet info
      navigate('/User/pets/add/success', { 
        state: { 
          petId: pet?._id, 
          petCode: pet?.petCode, 
          name: pet?.name 
        } 
      });
    } catch (err) {
      console.error('❌ Error creating pet:', err);
      if (err.name === 'AbortError') {
        setError('Request timeout. Please try again.');
      } else {
        setError(err?.response?.data?.message || err.message || 'Failed to create pet');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = async (event) => {
    const files = event.target.files;
    console.log('📁 Selected files:', files.length);
    
    if (!files || files.length === 0) return;
    
    try {
      const result = await processImageFiles(files, 5, 5); // Max 5 files, 5MB each
      
      if (!result.success) {
        setError(result.error);
        return;
      }
      
      if (result.images.length + images.length > 5) {
        setError('You can upload maximum 5 images');
        return;
      }
      
      setImages(prev => [...prev, ...result.images]);
    } catch (err) {
      console.error('❌ Error processing files:', err);
      setError('Error processing files: ' + err.message);
    }
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  // Load categories and species on mount
  useEffect(() => {
    (async () => {
      try {
        const catRes = await userPetsAPI.getCategories()
        const cats = catRes.data?.data || []
        setCategories(cats)
        if (cats.length && !categoryId) {
          setCategoryId(cats[0]._id)
        }
        // Load species for selected category if any
        const selected = cats[0]
        if (selected) {
          const spRes = await userPetsAPI.getSpeciesActive(selected.name)
          setSpeciesList(spRes.data?.data || [])
        } else {
          setSpeciesList([])
        }
      } catch (e) {
        setCategories([])
        setSpeciesList([])
      }
    })()
  }, [])

  // When category changes, load species for that category
  useEffect(() => {
    (async () => {
      if (!categoryId) return
      const cat = categories.find((c) => String(c._id) === String(categoryId))
      if (!cat) return
      try {
        const spRes = await userPetsAPI.getSpeciesActive(cat.name)
        setSpeciesList(spRes.data?.data || [])
      } catch (e) {
        setSpeciesList([])
      }
    })()
  }, [categoryId, categories])

  // Load breeds when species changes
  useEffect(() => {
    (async () => {
      setBreedList([])
      setForm((f) => ({ ...f, breedId: '', petDetailsId: '' }))
      if (!form.speciesId) return
      try {
        const res = await userPetsAPI.getBreedsBySpecies(form.speciesId)
        setBreedList(res.data?.data || [])
      } catch (e) {
        setBreedList([])
      }
    })()
  }, [form.speciesId])

  const submitRequest = async (type) => {
    try {
      setIsSubmitting(true)
      setError('')
      if (type === 'species') {
        await userPetsAPI.submitCustomRequest({
          requestType: 'species',
          speciesName: requestMessage || 'Requested species',
          speciesDisplayName: requestMessage || 'Requested species',
          reason: 'Requested from Add Pet page'
        })
      } else if (type === 'breed') {
        await userPetsAPI.submitCustomRequest({
          requestType: 'breed',
          speciesId: form.speciesId,
          breedName: requestMessage || 'Requested breed',
          reason: 'Requested from Add Pet page'
        })
      }
      setRequestMessage('')
      // Show success message or redirect
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to submit request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/User/pets')}
            sx={{ mr: 2 }}
          >
            Back to Pets
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Add New Pet
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="success"
          onClick={() => setShowRequestModal(true)}
        >
          Request New Data
        </Button>
      </Box>

      <Card component="form" onSubmit={handleSubmit}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Pet Information
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please provide information about your pet. You can upload up to 5 images.
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {/* Image Upload Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Pet Images</Typography>
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
                disabled={images.length >= 5}
              >
                Upload Images ({images.length}/5)
              </Button>
            </label>
            
            {images.length > 0 && (
              <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                {images.map((img, index) => (
                  <Box key={index} sx={{ position: 'relative' }}>
                    <Avatar 
                      src={img.url} 
                      sx={{ width: 80, height: 80, borderRadius: 1 }} 
                      variant="rounded"
                    />
                    <IconButton 
                      size="small" 
                      sx={{ 
                        position: 'absolute', 
                        top: -8, 
                        right: -8, 
                        bgcolor: 'white',
                        boxShadow: 1
                      }}
                      onClick={() => removeImage(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                    {index === 0 && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          position: 'absolute', 
                          bottom: 0, 
                          left: 0, 
                          right: 0, 
                          bgcolor: 'rgba(0,0,0,0.7)', 
                          color: 'white', 
                          textAlign: 'center',
                          borderBottomLeftRadius: 4,
                          borderBottomRightRadius: 4
                        }}
                      >
                        Primary
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth required label="Name" name="name" value={form.name} onChange={handleChange} />
            </Grid>
            {categories.length > 0 && (
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth required label="Category" name="categoryId" value={categoryId} onChange={(e)=>{ setCategoryId(e.target.value); setForm((f)=>({ ...f, speciesId: '', breedId: '', petDetailsId: '' })); setBreedList([]); }}>
                  {categories.map((c) => (
                    <MenuItem key={c._id} value={c._id}>{c.displayName || c.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth required label="Species" name="speciesId" value={form.speciesId} onChange={handleChange}>
                {speciesList
                  .filter((s) => {
                    if (!categoryId) return true
                    const cat = categories.find((c) => String(c._id) === String(categoryId))
                    const selectedCategoryName = (cat?.name || '').toLowerCase()
                    return String(s.category || '').toLowerCase() === selectedCategoryName
                  })
                  .map((s) => (
                  <MenuItem key={s._id} value={s._id}>{s.displayName || s.name}</MenuItem>
                ))}
              </TextField>
              {!speciesList.length && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  No species available. Ask admin to add species. You can also submit a request.
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <TextField size="small" placeholder="Species name" value={requestMessage} onChange={(e)=>setRequestMessage(e.target.value)} />
                    <Button size="small" variant="outlined" onClick={() => submitRequest('species')}>Request Species</Button>
                  </Box>
                </Alert>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth required label="Breed" name="breedId" value={form.breedId} onChange={handleChange} disabled={!form.speciesId || !breedList.length}>
                {breedList.map((b) => (
                  <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
                ))}
              </TextField>
              {form.speciesId && !breedList.length && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  No breeds available for selected species. You can submit a request.
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <TextField size="small" placeholder="Breed name" value={requestMessage} onChange={(e)=>setRequestMessage(e.target.value)} />
                    <Button size="small" variant="outlined" onClick={() => submitRequest('breed')}>Request Breed</Button>
                  </Box>
                </Alert>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Gender" name="gender" value={form.gender} onChange={handleChange}>
                {['Male','Female','Unknown'].map((g) => (
                  <MenuItem key={g} value={g}>{g}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth type="number" label="Age" name="age" value={form.age} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField select fullWidth label="Age Unit" name="ageUnit" value={form.ageUnit} onChange={handleChange}>
                {['weeks','months','years'].map((u) => (
                  <MenuItem key={u} value={u}>{u}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="outlined" onClick={() => navigate('/User/pets')}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={isSubmitting}
              endIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            >
              {isSubmitting ? 'Creating Pet...' : 'Create Pet'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <RequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={() => {
          console.log('Request submitted successfully')
          // Optionally reload data here
        }}
      />
    </Box>
  )
}

export default AddPet