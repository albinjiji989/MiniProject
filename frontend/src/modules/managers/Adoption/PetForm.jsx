import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient, resolveMediaUrl } from '../../../services/api';
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia, 
  Grid, 
  Button, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  InputAdornment,
  FormHelperText, 
  Chip, 
  Alert, 
  CircularProgress, 
  IconButton, 
  Tooltip,
  Avatar
} from '@mui/material';
import { 
  ArrowBack as BackIcon, 
  AddPhotoAlternate as AddPhotoIcon, 
  PictureAsPdf as PdfIcon, 
  Delete as DeleteIcon,
  Pets as PetsIcon,
  Info as InfoIcon,
  AttachMoney as MoneyIcon,
  HealthAndSafety as HealthIcon,
  ColorLens as ColorIcon,
  Scale as WeightIcon,
  Cake as AgeIcon,
  Wc as GenderIcon
} from '@mui/icons-material';

const initial = { name: '', breed: '', species: '', age: 0, ageUnit: 'months', gender: 'male', color: '', weight: 0, healthStatus: 'good', vaccinationStatus: 'not_vaccinated', description: '', adoptionFee: 0, category: '', dateOfBirth: '', dobAccuracy: 'estimated', useAge: true };

const PetForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [isPending, setIsPending] = useState(false);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [speciesLookup, setSpeciesLookup] = useState({}); // Map species name to species object
  const [species, setSpecies] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState('');
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [saving, setSaving] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [apiErrors, setApiErrors] = useState({
    species: '',
    breeds: '',
    petCode: '',
    submit: ''
  });
  // Media state for create flow
  const [images, setImages] = useState([]); // [{url,isPrimary,caption}]
  const [documents, setDocuments] = useState([]); // [{url}]
  const imgInputRef = useRef(null);
  const docInputRef = useRef(null);

  // Fetch species (active) and derive categories from species for manager dropdowns
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        setFetchingMeta(true);
        setApiErrors(prev => ({ ...prev, species: '' }));
        let spec = [];
        try {
          setDebugInfo('Fetching species from /admin/species/active...');
          const speciesActiveRes = await apiClient.get('/admin/species/active');
          spec = speciesActiveRes.data?.data || speciesActiveRes.data || [];
          setDebugInfo(`Found ${spec.length} active species`);
        } catch (e1) {
          setDebugInfo(`Active species failed (${e1.response?.status}), trying all species...`);
          try {
            const speciesAllRes = await apiClient.get('/admin/species');
            spec = speciesAllRes.data?.data || speciesAllRes.data || [];
            setDebugInfo(`Found ${spec.length} total species`);
          } catch (e2) {
            setDebugInfo(`Both species endpoints failed. Giving up.`);
            setApiErrors(prev => ({ ...prev, species: `Failed to load species: ${e1.message}; ${e2.message}` }));
            return;
          }
        }
        setSpecies(spec);
        
        // Create lookup map for species
        const speciesMap = {};
        spec.forEach(s => {
          speciesMap[s.name] = s;
        });
        setSpeciesLookup(speciesMap);
        
        // Derive categories from species
        const cats = [...new Set(spec.map(s => (s.category?.displayName || s.category?.name || s.category || '').toString()).filter(Boolean))];
        setCategories(cats);
        setDebugInfo(`Derived ${cats.length} categories from species`);
      } catch (e) {
        setDebugInfo(`Fetch meta failed: ${e.message}`);
        console.error('Fetch meta failed', e);
      } finally {
        setFetchingMeta(false);
      }
    };
    fetchMeta();
  }, []);

  // When editing, load existing pet data
  useEffect(() => {
    const loadPet = async () => {
      if (!isEdit) return;
      try {
        setDebugInfo('Loading existing pet data...');
        const res = await apiClient.get(`/adoption/manager/pets/${id}`);
        const p = res.data?.data;
        if (!p) throw new Error('Pet not found');
        
        // Check if pet is pending
        setIsPending(p.status === 'pending');
        
        // Map pet data to form fields
        const mapped = {
          name: p.name || '',
          breed: p.breed || '',
          species: p.species || '',
          age: p.age || 0,
          ageUnit: p.ageUnit || 'months',
          gender: p.gender || 'male',
          color: p.color || '',
          weight: p.weight || 0,
          healthStatus: p.healthStatus || 'good',
          vaccinationStatus: p.vaccinationStatus || 'not_vaccinated',
          description: p.description || '',
          adoptionFee: p.adoptionFee || 0,
          category: p.category || '',
          petCode: p.petCode || '',
          dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '',
          dobAccuracy: p.dobAccuracy || 'estimated',
          useAge: !p.dateOfBirth // Default to age input if no DOB
        };
        setForm(mapped);
        
        // Set species selection
        if (mapped.species) {
          // First try exact match
          let matchedSpec = (species || []).find(s => s.name === mapped.species);
          
          // If no exact match, try case-insensitive match
          if (!matchedSpec) {
            matchedSpec = (species || []).find(s => s.name.toLowerCase() === mapped.species.toLowerCase());
          }
          
          if (matchedSpec) {
            setSelectedSpeciesId(matchedSpec._id || matchedSpec.id);
          }
        }
        
        setDebugInfo('Pet data loaded');
        
        // Load media
        if (Array.isArray(p.images)) {
          const imageUrls = p.images.map(img => ({
            _id: img?._id || (typeof img === 'object' && img?.url ? img.url.split('/').pop().split('.')[0] : null),
            url: resolveMediaUrl(typeof img === 'string' ? img : (img?.url || '')),
            isPrimary: img?.isPrimary || false,
            caption: img?.caption || ''
          })).filter(img => img.url);
          setImages(imageUrls);
        }
        if (Array.isArray(p.documents)) {
          const docUrls = p.documents.map(doc => ({
            _id: doc?._id || (typeof doc === 'object' && doc?.url ? doc.url.split('/').pop().split('.')[0] : null),
            url: resolveMediaUrl(typeof doc === 'string' ? doc : (doc?.url || '')),
            name: doc?.name || (typeof doc === 'string' ? doc.split('/').pop() : 'document')
          })).filter(doc => doc.url);
          setDocuments(docUrls);
        }
      } catch (e) {
        setDebugInfo(`Load pet failed: ${e.message}`);
        console.error('Load pet failed', e);
        setError('Failed to load pet data');
      }
    };
    loadPet();
  }, [id, isEdit]);

  // When species changes, map to id and fetch breeds for that species (also handled in onChange, but keep to sync external setForm)
  useEffect(() => {
    const syncBreeds = async () => {
      try {
        const spec = (species || []).find(s => (s._id || s.id) === selectedSpeciesId);
        const sid = spec?._id || selectedSpeciesId || '';
        if (sid) {
          const brRes = await apiClient.get(`/admin/breeds/species/${sid}`);
          setBreeds(brRes.data?.data || []);
        } else {
          setBreeds([]);
        }
        // ensure category reflects species
        const catName = (spec?.category?.displayName || spec?.category?.name || spec?.category || '').toString();
        if (catName && form.category !== catName) setForm(f => ({ ...f, category: catName }));
      } catch (e) {
        setBreeds([]);
      }
    };
    syncBreeds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpeciesId]);

  const onChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for species, breed, and category - they must be updated together
    if (name === 'species' || name === 'breed' || name === 'category') {
      // For species selection, we need to update all three fields
      if (name === 'species') {
        const selectedSpec = species.find(s => (s._id || s.id) === value);
        if (selectedSpec) {
          setSelectedSpeciesId(value);
          
          // Update all three fields together
          setForm(prev => ({
            ...prev,
            species: selectedSpec.name,
            category: (selectedSpec.category?.displayName || selectedSpec.category?.name || selectedSpec.category || '').toString()
          }));
          
          // Fetch breeds for this species
          fetchBreedsForSpecies(value);
        } else {
          setSelectedSpeciesId('');
          setBreeds([]);
          
          // Clear all three fields
          setForm(prev => ({
            ...prev,
            species: '',
            breed: '',
            category: ''
          }));
        }
      } else if (name === 'breed') {
        // When breed changes, we don't change species or category
        setForm(prev => ({ ...prev, breed: value }));
      } else if (name === 'category') {
        // When category changes, we don't change species or breed
        setForm(prev => ({ ...prev, category: value }));
      }
    } else {
      // For all other fields, update individually
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const fetchBreedsForSpecies = async (speciesId) => {
    try {
      const brRes = await apiClient.get(`/admin/breeds/species/${speciesId}`);
      setBreeds(brRes.data?.data || []);
    } catch (e) {
      setBreeds([]);
    }
  };

  const onChooseImage = () => imgInputRef.current?.click();
  const onChooseDocument = () => docInputRef.current?.click();

  const onImageSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    setSaving(true);
    try {
      const newImages = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const dataUrl = await readAsDataUrl(file);
        newImages.push({ 
          url: dataUrl, 
          isPrimary: images.length === 0 && newImages.length === 0,
          name: file.name,
          type: file.type,
          size: file.size
        });
      }
      setImages(prev => [...prev, ...newImages]);
    } catch (err) {
      setError(err?.response?.data?.error || 'Image processing failed');
    } finally {
      setSaving(false);
    }
  };

  const onDocumentSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    setSaving(true);
    try {
      const newDocs = [];
      for (const file of files) {
        const dataUrl = await readAsDataUrl(file);
        newDocs.push({ url: dataUrl, name: file.name, type: file.type, size: file.size });
      }
      setDocuments(prev => [...prev, ...newDocs]);
    } catch (err) {
      setError(err?.response?.data?.error || 'Document processing failed');
    } finally {
      setSaving(false);
    }
  };

  // Direct upload functions for immediate upload (similar to PetDetails)
  const directUploadImages = async (files) => {
    if (!files.length || !id) return [];
    
    setSaving(true);
    try {
      const newImageIds = [];
      
      // Upload each image to server
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await apiClient.post('/adoption/manager/pets/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (res.data?.data?._id) {
          newImageIds.push(res.data.data._id);
        }
      }
      
      // Get current image IDs and link all images to pet
      const currentImagesRes = await apiClient.get(`/adoption/manager/pets/${id}`);
      const currentImageIds = (currentImagesRes.data?.data?.imageIds || []).filter(id => typeof id === 'string' && id.length > 0);
      
      // Update pet with all image IDs (existing + new)
      await apiClient.put(`/adoption/manager/pets/${id}`, {
        imageIds: [...currentImageIds, ...newImageIds]
      });
      
      // Reload pet data to show new images
      const updatedPetRes = await apiClient.get(`/adoption/manager/pets/${id}`);
      const updatedPet = updatedPetRes.data?.data;
      
      // Update local state to reflect new images
      if (Array.isArray(updatedPet.images)) {
        const imageUrls = updatedPet.images.map(img => ({
          _id: img?._id || (typeof img === 'object' && img?.url ? img.url.split('/').pop().split('.')[0] : null),
          url: resolveMediaUrl(typeof img === 'string' ? img : (img?.url || '')),
          isPrimary: img?.isPrimary || false,
          caption: img?.caption || ''
        })).filter(img => img.url);
        setImages(imageUrls);
      }
      
      return newImageIds;
    } catch (e) {
      console.error('Direct image upload failed', e);
      setError('Failed to upload images. Please try again.');
      return [];
    } finally {
      setSaving(false);
    }
  };

  const directUploadDocuments = async (files) => {
    if (!files.length || !id) return [];
    
    setSaving(true);
    try {
      const newDocIds = [];
      
      // Upload each document to server
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await apiClient.post('/adoption/manager/pets/upload-document', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (res.data?.data?._id) {
          newDocIds.push(res.data.data._id);
        }
      }
      
      // Get current document IDs and link all documents to pet
      const currentPetRes = await apiClient.get(`/adoption/manager/pets/${id}`);
      const currentDocIds = (currentPetRes.data?.data?.documentIds || []).filter(id => typeof id === 'string' && id.length > 0);
      
      // Update pet with all document IDs (existing + new)
      await apiClient.put(`/adoption/manager/pets/${id}`, {
        documentIds: [...currentDocIds, ...newDocIds]
      });
      
      // Reload pet data to show new documents
      const updatedPetRes = await apiClient.get(`/adoption/manager/pets/${id}`);
      const updatedPet = updatedPetRes.data?.data;
      
      // Update local state to reflect new documents
      if (Array.isArray(updatedPet.documents)) {
        const docUrls = updatedPet.documents.map(doc => ({
          _id: doc?._id || (typeof doc === 'object' && doc?.url ? doc.url.split('/').pop().split('.')[0] : null),
          url: resolveMediaUrl(typeof doc === 'string' ? doc : (doc?.url || '')),
          name: doc?.name || (typeof doc === 'string' ? doc.split('/').pop() : 'document')
        })).filter(doc => doc.url);
        setDocuments(docUrls);
      }
      
      return newDocIds;
    } catch (e) {
      console.error('Direct document upload failed', e);
      setError('Failed to upload documents. Please try again.');
      return [];
    } finally {
      setSaving(false);
    }
  };

  // Direct upload handlers
  const onDirectImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    await directUploadImages(files);
  };

  const onDirectDocumentUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    await directUploadDocuments(files);
  };

  const readAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const setPrimaryImage = (index) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      isPrimary: i === index
    })));
  };

  const publishPet = async () => {
    if (!id) return;
    
    if (!window.confirm('Are you sure you want to publish this pet? This will make it available for adoption.')) return;
    
    try {
      setLoading(true);
      // Publish the pet
      await apiClient.post('/adoption/manager/pets/publish', { petIds: [id] });
      
      // Redirect to pending pets list
      alert('Pet published successfully!');
      navigate('../..');
    } catch (e) {
      const errorMsg = e?.response?.data?.error || e?.response?.data?.message || e.message || 'Publish failed';
      setError(errorMsg);
      setApiErrors(prev => ({ ...prev, submit: `Publish error: ${errorMsg}` }));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setApiErrors(prev => ({ ...prev, submit: '' }));
    
    try {
      // Validation
      if (!form.species) {
        setApiErrors(prev => ({ ...prev, species: 'Species is required' }));
        return;
      }
      if (!form.breed) {
        setApiErrors(prev => ({ ...prev, breeds: 'Breed is required' }));
        return;
      }
      if (!form.gender) {
        setApiErrors(prev => ({ ...prev, submit: 'Gender is required' }));
        return;
      }
      
      // Only submit expected fields for backend AdoptionPet model
      const payload = {
        name: form.name,
        species: form.species,
        breed: form.breed,
        age: Number(form.age) || 0, // defaulted; can be updated later
        ageUnit: form.ageUnit,
        gender: form.gender || 'male',
        color: form.color || 'unknown',
        weight: Number(form.weight) || 0,
        healthStatus: form.healthStatus || 'good',
        vaccinationStatus: form.vaccinationStatus || 'not_vaccinated',
        description: form.description || '',
        adoptionFee: Number(form.adoptionFee) || 0,
        category: form.category || ''
      };
      
      setDebugInfo(`Submitting ${isEdit ? 'update' : 'create'} request...`);
      
      let res;
      if (isEdit) {
        // For updates, only send changed fields to avoid overwriting with defaults
        const changedFields = {};
        Object.keys(payload).forEach(key => {
          if (payload[key] !== initial[key]) {
            changedFields[key] = payload[key];
          }
        });
        res = await apiClient.put(`/adoption/manager/pets/${id}`, changedFields);
      } else {
        res = await apiClient.post('/adoption/manager/pets', payload);
      }
      
      const petId = res.data?.data?._id || res.data?.data?.id || id;
      if (!petId) throw new Error('Pet ID not returned from server');
      
      setDebugInfo(`${isEdit ? 'Updated' : 'Created'} pet with ID: ${petId}`);
      
      // For new pets, we need to handle media uploads
      if (!isEdit) {
        // For new pets, we need to distinguish between new uploads and existing media
        const newImages = images.filter(img => img.url.startsWith('data:'));
        const newDocuments = documents.filter(doc => doc.url.startsWith('data:'));
        
        const imageIds = [];
        const docIds = [];
        
        // Upload new images
        for (const img of newImages) {
          if (img.url.startsWith('data:')) {
            const blob = await (await fetch(img.url)).blob();
            const formData = new FormData();
            formData.append('file', blob, img.name || 'image.jpg');
            const uploadRes = await apiClient.post('/adoption/manager/pets/upload', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (uploadRes.data?.data?._id) {
              imageIds.push(uploadRes.data.data._id);
            }
          }
        }
        
        // Upload new documents
        for (const doc of newDocuments) {
          if (doc.url.startsWith('data:')) {
            const blob = await (await fetch(doc.url)).blob();
            const formData = new FormData();
            formData.append('file', blob, doc.name);
            const uploadRes = await apiClient.post('/adoption/manager/pets/upload-document', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (uploadRes.data?.data?._id) {
              docIds.push(uploadRes.data.data._id);
            }
          }
        }
        
        // Link all media to pet
        if (imageIds.length > 0 || docIds.length > 0) {
          setDebugInfo('Linking media to pet...');
          await apiClient.put(`/adoption/manager/pets/${petId}`, {
            imageIds: imageIds,
            documentIds: docIds
          });
        }
      }
      
      // Success - redirect to appropriate page based on pet status
      alert(isEdit ? 'Pet updated successfully!' : 'Pet created successfully!');
      // Redirect to pet list after successful save
      navigate('..');
    } catch (e2) {
      const errorMsg = e2?.response?.data?.error || e2?.response?.data?.message || e2.message || 'Save failed';
      setError(errorMsg);
      setApiErrors(prev => ({ ...prev, submit: `${e2.response?.status}: ${errorMsg}` }));
      setDebugInfo(prev => prev + ` | Submit error: ${e2.response?.status} ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // No code regeneration in create mode; code is generated by backend upon creation

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Card variant="outlined" sx={{ border: 'none', boxShadow: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: 56, 
              height: 56, 
              borderRadius: '50%', 
              bgcolor: 'primary.light', 
              color: 'primary.main'
            }}>
              <PetsIcon sx={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                {isPending ? 'Complete Pending Pet' : isEdit ? 'Edit Pet' : 'Add New Pet'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {isPending 
                  ? 'This pet was imported via CSV and is currently pending. Add images and documents, then publish it to make it available for adoption.' 
                  : 'You can do a quick intake now and complete details later. Species is required; other fields can be added later.'}
              </Typography>
            </Box>
          </Box>
          
          {apiErrors.submit && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {apiErrors.submit}
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={onSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField 
                  fullWidth
                  label="Pet Name"
                  name="name" 
                  placeholder="e.g., Bruno" 
                  value={form.name} 
                  onChange={onChange} 
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Gender *</InputLabel>
                  <Select 
                    name="gender" 
                    value={form.gender} 
                    onChange={onChange}
                    label="Gender *"
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField 
                  fullWidth
                  label="Color"
                  name="color" 
                  placeholder="e.g., Brown, Black & White" 
                  value={form.color} 
                  onChange={onChange} 
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField 
                  fullWidth
                  type="number"
                  label="Weight (kg)"
                  name="weight" 
                  value={form.weight} 
                  onChange={onChange} 
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Health Status</InputLabel>
                  <Select 
                    name="healthStatus" 
                    value={form.healthStatus} 
                    onChange={onChange}
                    label="Health Status"
                  >
                    <MenuItem value="excellent">Excellent</MenuItem>
                    <MenuItem value="good">Good</MenuItem>
                    <MenuItem value="fair">Fair</MenuItem>
                    <MenuItem value="poor">Poor</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Vaccination Status</InputLabel>
                  <Select 
                    name="vaccinationStatus" 
                    value={form.vaccinationStatus} 
                    onChange={onChange}
                    label="Vaccination Status"
                  >
                    <MenuItem value="fully_vaccinated">Fully Vaccinated</MenuItem>
                    <MenuItem value="partially_vaccinated">Partially Vaccinated</MenuItem>
                    <MenuItem value="not_vaccinated">Not Vaccinated</MenuItem>
                    <MenuItem value="unknown">Unknown</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>

              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField 
                  fullWidth
                  type="number"
                  label="Adoption Fee"
                  name="adoptionFee" 
                  value={form.adoptionFee} 
                  onChange={onChange} 
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Age Input Method:
                  </Typography>
                  <Button
                    size="small"
                    variant={form.useAge ? 'contained' : 'outlined'}
                    onClick={() => setForm(prev => ({ ...prev, useAge: true }))}
                  >
                    Use Age
                  </Button>
                  <Button
                    size="small"
                    variant={!form.useAge ? 'contained' : 'outlined'}
                    onClick={() => setForm(prev => ({ ...prev, useAge: false }))}
                  >
                    Use Date of Birth
                  </Button>
                </Box>
              </Grid>
              
              {form.useAge ? (
                <Grid item xs={12} md={6}>
                  <Grid container spacing={2}>
                    <Grid item xs={8}>
                      <TextField 
                        fullWidth
                        type="number"
                        label="Age"
                        name="age" 
                        value={form.age} 
                        onChange={onChange} 
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><AgeIcon fontSize="small" /></InputAdornment>,
                          inputProps: { min: 0 }
                        }}
                        helperText="Will be converted to estimated date of birth"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <FormControl fullWidth>
                        <InputLabel>Unit</InputLabel>
                        <Select 
                          name="ageUnit" 
                          value={form.ageUnit} 
                          onChange={onChange}
                          label="Unit"
                        >
                          <MenuItem value="years">Years</MenuItem>
                          <MenuItem value="months">Months</MenuItem>
                          <MenuItem value="weeks">Weeks</MenuItem>
                          <MenuItem value="days">Days</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>
              ) : (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField 
                      fullWidth
                      type="date"
                      label="Date of Birth"
                      name="dateOfBirth" 
                      value={form.dateOfBirth} 
                      onChange={onChange}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><AgeIcon fontSize="small" /></InputAdornment>,
                      }}
                      helperText="Enter the pet's actual date of birth"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>DOB Accuracy</InputLabel>
                      <Select 
                        name="dobAccuracy" 
                        value={form.dobAccuracy} 
                        onChange={onChange}
                        label="DOB Accuracy"
                      >
                        <MenuItem value="exact">Exact - Known birth date</MenuItem>
                        <MenuItem value="estimated">Estimated - Approximate date</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}
              
              {isEdit && (
                <Grid item xs={12} md={6}>
                  <TextField 
                    fullWidth
                    label="Pet Code"
                    value={form.petCode || ''} 
                    InputProps={{
                      readOnly: true,
                    }}
                    helperText="Auto-generated unique code displayed after creation."
                  />
                </Grid>
              )}
              
              <Grid item xs={12} md={6}>
                <TextField 
                  fullWidth
                  label="Category"
                  value={form.category || ''} 
                  InputProps={{
                    readOnly: true,
                  }}
                  helperText="Category is derived from the selected species."
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!apiErrors.species} disabled={fetchingMeta}>
                  <InputLabel>Species *</InputLabel>
                  <Select
                    name="species"
                    value={selectedSpeciesId}
                    onChange={onChange}
                    label="Species *"
                  >
                    <MenuItem value="">Select species</MenuItem>
                    {species.map(s => (
                      <MenuItem key={s._id || s.id} value={s._id || s.id}>{s.displayName || s.name || s.title}</MenuItem>
                    ))}
                  </Select>
                  {!fetchingMeta && species.length===0 && (
                    <FormHelperText>No species available. Please ensure admin has created species or try refreshing.</FormHelperText>
                  )}
                  {apiErrors.species && <FormHelperText>{apiErrors.species}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!apiErrors.breeds} disabled={breeds.length === 0}>
                  <InputLabel>Breed *</InputLabel>
                  <Select
                    name="breed"
                    value={form.breed}
                    onChange={onChange}
                    label="Breed *"
                  >
                    <MenuItem value="">{breeds.length ? 'Select breed' : 'No breeds available (ask Admin to add)'}</MenuItem>
                    {breeds.map(b => (
                      <MenuItem key={b._id || b.id} value={(b.name || b.title || '').toString()}>{b.name || b.title}</MenuItem>
                    ))}
                  </Select>
                  {!fetchingMeta && selectedSpeciesId && breeds.length===0 && (
                    <FormHelperText>No breeds configured for this species. Please contact Admin to add breeds.</FormHelperText>
                  )}
                  {apiErrors.breeds && <FormHelperText>{apiErrors.breeds}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField 
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  name="description" 
                  placeholder="Describe the pet's personality, habits, special needs, etc." 
                  value={form.description} 
                  onChange={onChange} 
                />
              </Grid>
              
              {/* Image Upload Section */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AddPhotoIcon /> Pet Images
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={onChooseImage}
                  >
                    Upload Image
                  </Button>
                  <input
                    type="file"
                    ref={imgInputRef}
                    onChange={onDirectImageUpload}
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Upload clear photos of the pet (optional but recommended)
                  </Typography>
                </Box>
                
                {/* Image Preview */}
                {images.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1 }}>
                      Uploaded Images:
                    </Typography>
                    <Grid container spacing={2}>
                      {images.map((img, index) => (
                        <Grid item xs={6} sm={4} md={3} key={index}>
                          <Box sx={{ position: 'relative' }}>
                            <CardMedia 
                              component="img" 
                              height="140" 
                              image={img.url} 
                              alt={`Preview ${index + 1}`} 
                              sx={{ borderRadius: 1 }}
                              onError={(e) => { e.currentTarget.src = '/placeholder-pet.svg' }}
                            />
                            {img.isPrimary && (
                              <Chip 
                                label="Primary" 
                                size="small" 
                                color="primary" 
                                sx={{ 
                                  position: 'absolute', 
                                  top: 8, 
                                  left: 8 
                                }} 
                              />
                            )}
                            <Box 
                              sx={{ 
                                position: 'absolute', 
                                inset: 0,
                                bgcolor: 'rgba(0,0,0,0)',
                                transition: 'bgcolor 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                                '&:hover': {
                                  bgcolor: 'rgba(0,0,0,0.3)'
                                }
                              }}
                            >
                              {!img.isPrimary && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => setPrimaryImage(index)}
                                  sx={{ opacity: 0, '&:hover': { opacity: 1 }, transition: 'opacity 0.2s' }}
                                >
                                  Set Primary
                                </Button>
                              )}
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                onClick={() => removeImage(index)}
                                sx={{ opacity: 0, '&:hover': { opacity: 1 }, transition: 'opacity 0.2s' }}
                              >
                                Remove
                              </Button>
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Grid>
              
              {/* Document Upload Section */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PdfIcon /> Documents
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={onChooseDocument}
                  >
                    Upload Document
                  </Button>
                  <input
                    type="file"
                    ref={docInputRef}
                    onChange={onDirectDocumentUpload}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    multiple
                    style={{ display: 'none' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Upload medical records, certificates, or other documents (PDF, DOC, DOCX, TXT, JPG, PNG)
                  </Typography>
                </Box>
                
                {/* Document Preview */}
                {documents.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1 }}>
                      Uploaded Documents:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {documents.map((doc, index) => (
                        <Card 
                          key={index} 
                          variant="outlined" 
                          sx={{ display: 'flex', alignItems: 'center', p: 1, bgcolor: 'grey.50' }}
                        >
                          <Avatar 
                            sx={{ 
                              bgcolor: 'grey.200', 
                              color: 'grey.700',
                              width: 32,
                              height: 32,
                              mr: 1
                            }}
                          >
                            {doc.type?.includes('pdf') ? '📄' : doc.type?.startsWith('image/') ? '🖼️' : '📝'}
                          </Avatar>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography 
                              variant="body2" 
                              noWrap
                              sx={{ fontWeight: 500 }}
                            >
                              {doc.name || (typeof doc === 'string' ? doc.split('/').pop() : 'Document')}
                            </Typography>
                            {doc.size && (
                              <Typography variant="caption" color="text.secondary">
                                {(doc.size / 1024 / 1024).toFixed(2)} MB
                              </Typography>
                            )}
                          </Box>
                          <Tooltip title="Delete document">
                            <IconButton 
                              size="small" 
                              onClick={() => removeDocument(index)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Card>
                      ))}
                    </Box>
                  </Box>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    {loading ? 'Saving...' : isPending ? 'Save & Continue' : isEdit ? 'Update Pet' : 'Add Pet'}
                  </Button>
                  {isPending && (
                    <Button 
                      type="button" 
                      variant="contained" 
                      color="success"
                      disabled={loading}
                      onClick={publishPet}
                      startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                      Publish Pet
                    </Button>
                  )}
                  <Button 
                    type="button" 
                    variant="outlined" 
                    onClick={()=>navigate('..')} 
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        
          {/* Debug Info (only shown in development) */}
          {debugInfo && process.env.NODE_ENV === 'development' && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
              <Typography variant="caption" color="warning.dark">
                <strong>Debug:</strong> {debugInfo}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default PetForm;