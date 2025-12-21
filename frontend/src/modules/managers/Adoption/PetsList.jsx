import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient, resolveMediaUrl } from '../../../services/api'
import { Box, Grid, Card, CardContent, Typography, Stack, Button, TextField, Select, MenuItem, FormControl, InputLabel, Chip, Pagination, Checkbox, IconButton, Divider, Dialog, DialogTitle, DialogContent } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

const PetsList = () => {
  const navigate = useNavigate()
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(9)
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [showPending, setShowPending] = useState(false)
  const [species, setSpecies] = useState('')
  const [breed, setBreed] = useState('')
  const [gender, setGender] = useState('')
  const [sortBy, setSortBy] = useState('dateAdded')
  const [sortOrder, setSortOrder] = useState('desc')
  const [speciesOptions, setSpeciesOptions] = useState([])
  const [breedOptions, setBreedOptions] = useState([])
  const [draftOnly, setDraftOnly] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [quickView, setQuickView] = useState({ open: false, pet: null, loading: false })
  const [thumbById, setThumbById] = useState({})
  const fileInputsRef = useRef({})

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit])

  const extractUrl = (item) => {
    if (!item) return ''
    if (typeof item === 'string') return item
    if (typeof item.url === 'string') return item.url
    if (item.url && typeof item.url.url === 'string') return item.url.url
    return ''
  }

  const triggerUpload = (petId) => {
    if (!fileInputsRef.current[petId]) return
    fileInputsRef.current[petId].click()
  }

  const handleFileSelected = async (petId, e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!petId || !file) return
    try {
      const form = new FormData()
      form.append('file', file)
      const up = await apiClient.post('/adoption/manager/pets/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      const imageId = up.data?.data?._id
      const url = up.data?.data?.url
      if (imageId) {
        await apiClient.put(`/adoption/manager/pets/${petId}`, { imageIds: [imageId] })
        if (url) {
          setThumbById(prev => ({ ...prev, [petId]: resolveMediaUrl(url) }))
        }
      }
    } catch (err) {
      alert(err?.response?.data?.error || 'Upload failed')
    }
  }

  const getFirstImageUrl = (pet) => {
    const images = pet?.images || [];
    if (!images || images.length === 0) return '';
    
    // Handle different image object structures
    const firstImage = images[0];
    let url = '';
    
    if (typeof firstImage === 'string') {
      url = firstImage;
    } else if (firstImage && typeof firstImage === 'object') {
      // Handle populated image object from backend
      if (firstImage.url) {
        url = firstImage.url;
      } else if (firstImage._id && firstImage.entityType) {
        // This is a full Image model object
        url = firstImage.url || '';
      }
    }
    
    if (!url) return '';
    
    // Handle different URL types
    if (String(url).startsWith('data:')) return url; // render data URL directly
    if (String(url).startsWith('blob:')) return ''; // skip blob URLs
    
    return resolveMediaUrl(url);
  }

  // Fallback: if a pet has no image in list payload, fetch its media endpoint to get first image URL
  const ensureThumbLoaded = async (petId) => {
    if (!petId || thumbById[petId]) return
    try {
      const res = await apiClient.get(`/adoption/manager/pets/${petId}/media`)
      const imgs = res.data?.data?.images || []
      const first = imgs.find(it => {
        const u = extractUrl(it)
        return u && !String(u).startsWith('blob:')
      })
      let url = ''
      if (first) {
        const raw = extractUrl(first)
        url = String(raw).startsWith('data:') ? raw : resolveMediaUrl(raw)
      }
      if (url) setThumbById(prev => ({ ...prev, [petId]: url }))
    } catch (_) {}
  }

  const StatusChip = ({ value }) => {
    const map = {
      available: { color: 'success', label: 'AVAILABLE' },
      reserved: { color: 'warning', label: 'RESERVED' },
      adopted: { color: 'primary', label: 'ADOPTED' },
    }
    const meta = map[value] || { color: 'default', label: (value || '').toUpperCase() }
    return <Chip size="small" color={meta.color} label={meta.label} variant="outlined" />
  }

  const isDraft = (pet) => !pet.name || String(pet.name).startsWith('Unknown-') || !pet.breed || String(pet.breed).toLowerCase()==='unknown'

  // Helper to compute age display when backend virtual is missing
  const computeAgeDisplay = (age, ageUnit) => {
    const n = Number(age || 0)
    switch (ageUnit) {
      case 'years':
        return `${n} year${n !== 1 ? 's' : ''}`
      case 'months': {
        const years = Math.floor(n / 12)
        const months = n % 12
        if (years > 0 && months > 0) return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`
        if (years > 0) return `${years} year${years !== 1 ? 's' : ''}`
        return `${months} month${months !== 1 ? 's' : ''}`
      }
      case 'weeks':
        return `${n} week${n !== 1 ? 's' : ''}`
      case 'days':
        return `${n} day${n !== 1 ? 's' : ''}`
      default:
        return `${n}`
    }
  }

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('Loading pets with params:', { search: q, status, page, limit });
      const res = await apiClient.get('/adoption/manager/pets', { 
        params: { 
          search: q, 
          status: showPending ? 'pending' : status, 
          species: species || undefined,
          breed: breed || undefined,
          gender: gender || undefined,
          sortBy: sortBy || undefined,
          sortOrder: sortOrder || undefined,
          page, 
          limit,
          fields: '_id,name,breed,species,status,ageDisplay,age,ageUnit,petCode,images,documents,gender,color,weight',
          lean: false  // Changed from true to false to ensure virtuals are populated
        } 
      })
      console.log('Pets API response:', res.data);
      const raw = res.data?.data?.pets || []
      // Minimize each item to reduce memory/CPU: keep only fields we render and a single thumbnail url
      const minimal = raw.map((p) => {
        try {
          // Extract the first image URL properly
          let firstUrl = '';
          if (Array.isArray(p.images) && p.images.length > 0) {
            const firstImage = p.images[0];
            if (typeof firstImage === 'string') {
              firstUrl = firstImage;
            } else if (firstImage && typeof firstImage === 'object' && firstImage.url) {
              firstUrl = firstImage.url;
            }
          }
          
          const minimal = {
            _id: p._id,
            name: p.name,
            breed: p.breed,
            species: p.species,
            age: p.age,
            ageUnit: p.ageUnit,
            ageDisplay: p.ageDisplay,
            status: p.status,
            petCode: p.petCode,
            gender: p.gender,
            color: p.color,
            weight: p.weight,
            images: p.images || [], // Keep full images array for proper processing
          }
          // Backfill ageDisplay if missing
          if (!minimal.ageDisplay && (minimal.age !== undefined || minimal.ageUnit !== undefined)) {
            minimal.ageDisplay = computeAgeDisplay(minimal.age, minimal.ageUnit)
          }
          return minimal
        } catch (err) {
          console.error('Error processing pet:', p, err);
          // Return a safe fallback
          return {
            _id: p._id || Math.random().toString(),
            name: p.name || 'Unknown',
            breed: p.breed || 'Unknown',
            species: p.species || 'Unknown',
            age: p.age,
            ageUnit: p.ageUnit,
            ageDisplay: p.ageDisplay || '',
            status: p.status || 'available',
            petCode: p.petCode || '',
            gender: p.gender,
            color: p.color,
            weight: p.weight,
            images: p.images || []
          }
        }
      })
      setPets(minimal)
      // Always try to load/refresh thumbs from media endpoint to ensure a valid served URL
      minimal.forEach(p=>ensureThumbLoaded(p._id))
      setTotal(res.data?.data?.pagination?.total || 0)
      setSelected(new Set())
    } catch (e) {
      console.error('Load pets failed', e)
      const errorMsg = e?.response?.data?.error || e?.message || 'Unknown error'
      setError(errorMsg)
      // Show error to user
      alert('Failed to load pets: ' + errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const onDelete = async (id) => {
    if (!id) {
      alert('Missing pet id. Please refresh and try again.')
      return
    }
    if (!window.confirm('Delete this pet?')) return
    try {
      await apiClient.delete(`/adoption/manager/pets/${id}`)
      const remaining = (total - 1) - ((page - 1) * limit)
      if (remaining <= 0 && page > 1) setPage(page - 1)
      else load()
    } catch (e) {
      alert(e?.response?.data?.error || 'Delete failed')
    }
  }

  const publishPets = async (petIds) => {
    try {
      const res = await apiClient.post('/adoption/manager/pets/publish', { petIds });
      load(); // Refresh the list
      
      // Show success message
      const publishedCount = res.data?.data?.published || petIds.length;
      setError(null);
      
      // Use a more professional notification
      console.log(`${publishedCount} pet(s) published successfully!`);
      
      // Optionally, you could implement a proper notification system here
      // For now, we'll just rely on the UI refresh to show the change
      return true;
    } catch (e) {
      const errorMsg = e?.response?.data?.error || 'Failed to publish pet(s)';
      setError(errorMsg);
      console.error('Publish error:', errorMsg);
      return false;
    }
  };

  const unpublishPets = async (petIds) => {
    try {
      // To unpublish, we set the status back to pending
      const updatePromises = petIds.map(petId => 
        apiClient.put(`/adoption/manager/pets/${petId}`, { status: 'pending' })
      );
      
      await Promise.all(updatePromises);
      load(); // Refresh the list
      
      setError(null);
      console.log(`${petIds.length} pet(s) unpublished successfully!`);
      
      // Optionally, you could implement a proper notification system here
      return true;
    } catch (e) {
      const errorMsg = e?.response?.data?.error || 'Failed to unpublish pet(s)';
      setError(errorMsg);
      console.error('Unpublish error:', errorMsg);
      return false;
    }
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return
    if (!window.confirm(`Delete ${selected.size} selected pet(s)?`)) return
    try {
      const ids = Array.from(selected)
      await apiClient.post('/adoption/manager/pets/bulk-delete', { ids })
      setSelected(new Set())
      load()
    } catch (e) {
      alert(e?.response?.data?.error || 'Bulk delete failed')
    }
  }

  const publishPendingPets = async () => {
    if (selected.size === 0) return
    if (!window.confirm(`Publish ${selected.size} selected pending pet(s) to make them available for adoption?`)) return
    const ids = Array.from(selected)
    const success = await publishPets(ids)
    if (success) {
      setSelected(new Set())
    }
  }

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openQuickView = async (id) => {
    setQuickView({ open: true, pet: null, loading: true })
    try {
      const res = await apiClient.get(`/adoption/manager/pets/${id}`, { params: { fields: 'name,petCode,breed,species,status,ageDisplay,gender,color,weight,description', lean: true } })
      setQuickView({ open: true, pet: res.data?.data, loading: false })
    } catch (e) {
      setQuickView({ open: true, pet: null, loading: false })
      alert(e?.response?.data?.error || 'Failed to load pet')
    }
  }

  const closeQuickView = () => setQuickView({ open: false, pet: null, loading: false })

  const resetFilters = () => {
    setQ('');
    setStatus('');
    setSpecies('');
    setBreed('');
    setGender('');
    setSortBy('dateAdded');
    setSortOrder('desc');
    setPage(1);
  }

  // Fetch species and breeds for filter dropdowns
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        // Fetch unique species
        const speciesRes = await apiClient.get('/adoption/manager/pets', { 
          params: { 
            fields: 'species',
            limit: 1000
          } 
        });
        const allPets = speciesRes.data?.data?.pets || [];
        const uniqueSpecies = [...new Set(allPets.map(pet => pet.species).filter(Boolean))];
        setSpeciesOptions(uniqueSpecies);
        
        // Fetch unique breeds
        const breedRes = await apiClient.get('/adoption/manager/pets', { 
          params: { 
            fields: 'breed',
            limit: 1000
          } 
        });
        const allBreeds = breedRes.data?.data?.pets || [];
        const uniqueBreeds = [...new Set(allBreeds.map(pet => pet.breed).filter(Boolean))];
        setBreedOptions(uniqueBreeds);
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
      }
    };
    
    fetchFilters();
  }, []);

  useEffect(() => { load() }, [page, limit, q, status, species, breed, gender, sortBy, sortOrder])
  // Debounce search/status changes to avoid spamming API and heavy re-renders
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1)
      load()
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, species, breed, gender, sortBy, sortOrder])

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 3,
        minHeight: '100%',
        '@keyframes pulse': {
          '0%': { opacity: 1 },
          '50%': { opacity: 0.4 },
          '100%': { opacity: 1 }
        }
      }}
    >
      {/* Header with Title and Controls */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' }, 
          justifyContent: 'space-between',
          gap: 2,
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 1,
          boxShadow: 1
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          Adoption Pets
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({total} total)
          </Typography>
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <TextField 
            size="small" 
            placeholder="Search pets..." 
            value={q} 
            onChange={(e)=>setQ(e.target.value)} 
            sx={{ minWidth: 150 }}
          />
          {!showPending ? (
            <>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="status">Status</InputLabel>
                <Select 
                  labelId="status" 
                  label="Status" 
                  value={status} 
                  onChange={(e)=>setStatus(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="adopted">Adopted</MenuItem>
                  <MenuItem value="reserved">Reserved</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="species">Species</InputLabel>
                <Select 
                  labelId="species" 
                  label="Species" 
                  value={species} 
                  onChange={(e)=>setSpecies(e.target.value)}
                >
                  <MenuItem value="">All Species</MenuItem>
                  {speciesOptions.map(spec => (
                    <MenuItem key={spec} value={spec}>{spec}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="gender">Gender</InputLabel>
                <Select 
                  labelId="gender" 
                  label="Gender" 
                  value={gender} 
                  onChange={(e)=>setGender(e.target.value)}
                >
                  <MenuItem value="">All Genders</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="breed">Breed</InputLabel>
                <Select 
                  labelId="breed" 
                  label="Breed" 
                  value={breed} 
                  onChange={(e)=>setBreed(e.target.value)}
                >
                  <MenuItem value="">All Breeds</MenuItem>
                  {breedOptions.map(br => (
                    <MenuItem key={br} value={br}>{br}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="sort">Sort By</InputLabel>
                <Select 
                  labelId="sort" 
                  label="Sort By" 
                  value={`${sortBy}-${sortOrder}`} 
                  onChange={(e) => {
                    const [by, order] = e.target.value.split('-');
                    setSortBy(by);
                    setSortOrder(order);
                  }}
                >
                  <MenuItem value="dateAdded-desc">Newest First</MenuItem>
                  <MenuItem value="dateAdded-asc">Oldest First</MenuItem>
                  <MenuItem value="name-asc">Name (A-Z)</MenuItem>
                  <MenuItem value="name-desc">Name (Z-A)</MenuItem>
                  <MenuItem value="species-asc">Species (A-Z)</MenuItem>
                  <MenuItem value="breed-asc">Breed (A-Z)</MenuItem>
                  <MenuItem value="age-asc">Age (Low to High)</MenuItem>
                  <MenuItem value="age-desc">Age (High to Low)</MenuItem>
                </Select>
              </FormControl>
              <Button 
                variant="outlined" 
                onClick={()=>{ setPage(1); load() }}
                startIcon={<SearchIcon />}
              >
                Filter
              </Button>
              <Button 
                variant="outlined" 
                onClick={resetFilters}
              >
                Reset
              </Button>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Showing pending pets awaiting media upload and approval
            </Typography>
          )}
          <IconButton 
            onClick={load} 
            title="Refresh"
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* Action Buttons */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        {showPending ? (
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<CheckCircleIcon />} 
            disabled={selected.size===0} 
            onClick={publishPendingPets}
            size="small"
          >
            Publish Selected ({selected.size})
          </Button>
        ) : (
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<DeleteIcon />} 
            disabled={selected.size===0} 
            onClick={bulkDelete}
            size="small"
          >
            Delete Selected ({selected.size})
          </Button>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <Button 
          variant={showPending ? "outlined" : "contained"}
          onClick={() => {
            setShowPending(false);
            setPage(1);
            setTimeout(load, 100);
          }}
        >
          Regular Pets
        </Button>
        <Button 
          variant={!showPending ? "outlined" : "contained"}
          onClick={() => {
            setShowPending(true);
            setPage(1);
            setTimeout(load, 100);
          }}
        >
          Pending Pets
        </Button>
        <Button 
          variant="contained" 
          onClick={()=>navigate('/manager/adoption/wizard/start')}
          startIcon={<AddIcon />}
        >
          Add Pet
        </Button>
        <Button 
          variant="contained" 
          color="success" 
          onClick={()=>navigate('../import')}
          startIcon={<FileUploadIcon />}
        >
          Import CSV
        </Button>
      </Box>
      {/* Results Summary */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {pets.length} of {total} pets
        </Typography>
        {draftOnly && (
          <Chip label="Draft Mode" color="warning" size="small" />
        )}
      </Box>
      
      {error && (
        <Box sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
          <Typography variant="body1">Error: {error}</Typography>
        </Box>
      )}

      <Grid container spacing={2}>
        {loading && (
          Array.from(new Array(limit)).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box 
                  sx={{ 
                    height: 180, 
                    bgcolor: 'grey.200', 
                    animation: 'pulse 1.5s ease-in-out infinite' 
                  }}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box>
                      <Box 
                        sx={{ 
                          height: 24, 
                          width: '60%', 
                          bgcolor: 'grey.300', 
                          mb: 1,
                          animation: 'pulse 1.5s ease-in-out infinite' 
                        }} 
                      />
                      <Box 
                        sx={{ 
                          height: 16, 
                          width: '40%', 
                          bgcolor: 'grey.200',
                          animation: 'pulse 1.5s ease-in-out infinite' 
                        }} 
                      />
                    </Box>
                    <Box 
                      sx={{ 
                        height: 24, 
                        width: 60, 
                        bgcolor: 'grey.300',
                        animation: 'pulse 1.5s ease-in-out infinite' 
                      }} 
                    />
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 0.5, mb: 2 }}>
                    {Array.from(new Array(4)).map((_, i) => (
                      <React.Fragment key={i}>
                        <Box 
                          sx={{ 
                            height: 12, 
                            width: 30, 
                            bgcolor: 'grey.200',
                            animation: 'pulse 1.5s ease-in-out infinite' 
                          }} 
                        />
                        <Box 
                          sx={{ 
                            height: 12, 
                            width: '100%', 
                            bgcolor: 'grey.200',
                            animation: 'pulse 1.5s ease-in-out infinite' 
                          }} 
                        />
                      </React.Fragment>
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Box 
                      sx={{ 
                        height: 36, 
                        width: '33%', 
                        bgcolor: 'grey.300',
                        animation: 'pulse 1.5s ease-in-out infinite' 
                      }} 
                    />
                    <Box 
                      sx={{ 
                        height: 36, 
                        width: '33%', 
                        bgcolor: 'grey.300',
                        animation: 'pulse 1.5s ease-in-out infinite' 
                      }} 
                    />
                    <Box 
                      sx={{ 
                        height: 36, 
                        width: '33%', 
                        bgcolor: 'grey.300',
                        animation: 'pulse 1.5s ease-in-out infinite' 
                      }} 
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
        {!loading && pets
          .filter(pet => (draftOnly ? isDraft(pet) : true))
          .map(pet => (
          <Grid item xs={12} sm={6} md={4} key={pet._id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
            >
              {/* Pet Image */}
              <Box 
                sx={{ 
                  position: 'relative', 
                  width: '100%', 
                  height: 180, 
                  bgcolor: 'grey.100', 
                  overflow: 'hidden', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}
              >
                {getFirstImageUrl(pet) ? (
                  <img 
                    loading="lazy" 
                    src={getFirstImageUrl(pet)} 
                    alt={pet.name || 'Pet'} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    onError={(e) => { 
                      console.log('Image load error for:', getFirstImageUrl(pet));
                      e.currentTarget.src = '/placeholder-pet.svg' 
                    }} 
                  />
                ) : (
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Box 
                      component="img" 
                      src="/placeholder-pet.svg" 
                      alt="No image" 
                      sx={{ width: 60, height: 60, opacity: 0.5, mb: 1 }} 
                    />
                    <Typography variant="caption" color="text.secondary">No image</Typography>
                  </Box>
                )}
                {/* Status badge on image */}
                <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                  <StatusChip value={pet.status} />
                </Box>
                
                {/* Pending badge */}
                {showPending && (
                  <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
                    <Chip 
                      label="PENDING" 
                      size="small" 
                      color="warning" 
                      variant="filled" 
                    />
                  </Box>
                )}
              </Box>
              
              {/* Pet Info */}
              <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', mb: 1 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={600} noWrap>
                      {isDraft(pet) ? 'No name' : (pet.name || 'No name')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {pet.breed} • {pet.species}
                    </Typography>
                  </Box>
                  {isDraft(pet) && (
                    <Chip size="small" label="DRAFT" color="warning" variant="filled" />
                  )}
                </Box>
                
                {/* Pet Details Grid */}
                <Box 
                  component="dl" 
                  sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: 'auto 1fr', sm: 'auto 1fr' }, 
                    gap: 0.5, 
                    mb: 2,
                    '& dt': {
                      fontWeight: 500,
                      color: 'text.secondary',
                      fontSize: '0.8rem'
                    },
                    '& dd': {
                      margin: 0,
                      fontSize: '0.85rem'
                    }
                  }}
                >
                  <dt>Age:</dt>
                  <dd>{pet.ageDisplay || computeAgeDisplay(pet.age, pet.ageUnit) || '-'}</dd>
                  
                  <dt>Gender:</dt>
                  <dd>{pet.gender || '-'}</dd>
                  
                  <dt>Color:</dt>
                  <dd>{pet.color || '-'}</dd>
                  
                  <dt>Weight:</dt>
                  <dd>{pet.weight ? `${pet.weight} kg` : '-'}</dd>
                  
                  {pet.petCode && (
                    <>
                      <dt>ID:</dt>
                      <dd>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                          {pet.petCode}
                        </Typography>
                      </dd>
                    </>
                  )}
                </Box>
                
                {/* Action Buttons */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 'auto' }}>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    sx={{ flex: 1, minWidth: 80 }}
                    onClick={()=>navigate(`/manager/adoption/pets/${pet._id}`)}
                  >
                    View
                  </Button>
                  <Button 
                    size="small" 
                    variant="contained" 
                    sx={{ flex: 1, minWidth: 80 }}
                    onClick={()=>navigate(`/manager/adoption/pets/${pet._id}/edit`)}
                  >
                    {showPending ? 'Add Media' : 'Edit'}
                  </Button>
                  {showPending ? (
                    <Button 
                      size="small" 
                      color="success" 
                      variant="contained"
                      sx={{ flex: 1, minWidth: 80 }}
                      onClick={()=>publishPets([pet._id])}
                    >
                      Publish
                    </Button>
                  ) : (
                    pet.status === 'available' ? (
                      <Button 
                        size="small" 
                        color="warning" 
                        variant="contained"
                        sx={{ flex: 1, minWidth: 80 }}
                        onClick={()=>unpublishPets([pet._id])}
                      >
                        Unpublish
                      </Button>
                    ) : (
                      <Button 
                        size="small" 
                        color="success" 
                        variant="contained"
                        sx={{ flex: 1, minWidth: 80 }}
                        onClick={()=>publishPets([pet._id])}
                      >
                        Publish
                      </Button>
                    )
                  )}
                  <Button 
                    size="small" 
                    color="error" 
                    variant="outlined"
                    sx={{ flex: 1, minWidth: 80 }}
                    onClick={()=>onDelete(pet._id)}
                  >
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {!loading && pets.length === 0 && !error && (
          <Grid item xs={12}>
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                py: 8,
                textAlign: 'center'
              }}
            >
              <Box 
                component="img" 
                src="/placeholder-pet.svg" 
                alt="No pets" 
                sx={{ width: 120, height: 120, opacity: 0.5, mb: 2 }} 
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No pets found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Get started by adding your first pet or importing from CSV
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button 
                  variant="contained" 
                  onClick={()=>navigate('/manager/adoption/wizard/start')}
                  startIcon={<AddIcon />}
                >
                  Add Pet
                </Button>
                <Button 
                  variant="outlined" 
                  color="success" 
                  onClick={()=>navigate('../import')}
                  startIcon={<FileUploadIcon />}
                >
                  Import CSV
                </Button>
              </Stack>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Pagination */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 1,
          boxShadow: 1
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total} pets
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <Select 
              value={limit} 
              onChange={(e)=>{ setLimit(Number(e.target.value)); setPage(1); }}
              displayEmpty
            >
              <MenuItem value={6}>6/page</MenuItem>
              <MenuItem value={9}>9/page</MenuItem>
              <MenuItem value={12}>12/page</MenuItem>
              <MenuItem value={24}>24/page</MenuItem>
            </Select>
          </FormControl>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={(_,p)=>setPage(p)} 
            color="primary" 
            showFirstButton 
            showLastButton 
          />
        </Box>
      </Box>

      {/* Quick View Dialog */}
      <Dialog 
        open={quickView.open} 
        onClose={closeQuickView} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 3
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'primary.contrastText',
            fontWeight: 600
          }}
        >
          Pet Quick View
        </DialogTitle>
        <DialogContent>
          {quickView.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Typography>Loading...</Typography>
            </Box>
          ) : !quickView.pet ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Typography color="text.secondary">No data available</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              {/* Pet Header */}
              <Box sx={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {quickView.pet.name || 'No name'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {quickView.pet.breed} • {quickView.pet.species}
                  </Typography>
                </Box>
                <Chip 
                  label={quickView.pet.status} 
                  size="small" 
                  color={
                    quickView.pet.status === 'available' ? 'success' :
                    quickView.pet.status === 'adopted' ? 'info' :
                    quickView.pet.status === 'reserved' ? 'warning' :
                    'default'
                  }
                />
              </Box>
              
              {/* Pet Details Grid */}
              <Box 
                component="dl" 
                sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'auto 1fr', 
                  gap: 1,
                  '& dt': {
                    fontWeight: 600,
                    color: 'text.secondary'
                  },
                  '& dd': {
                    margin: 0
                  }
                }}
              >
                <dt>ID:</dt>
                <dd>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                    {quickView.pet.petCode}
                  </Typography>
                </dd>
                
                <dt>Age:</dt>
                <dd>{quickView.pet.ageDisplay || '-'}</dd>
                
                <dt>Gender:</dt>
                <dd>{quickView.pet.gender || '-'}</dd>
                
                <dt>Color:</dt>
                <dd>{quickView.pet.color || '-'}</dd>
                
                <dt>Weight:</dt>
                <dd>{typeof quickView.pet.weight==='number' ? `${quickView.pet.weight} kg` : '-'}</dd>
              </Box>
              
              {/* Description */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>Description:</Typography>
                <Typography variant="body2" color="text.secondary">
                  {quickView.pet.description || 'No description provided.'}
                </Typography>
              </Box>
              
              {/* Action Buttons */}
              <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                <Button 
                  onClick={()=>navigate(`/manager/adoption/pets/${quickView.pet._id}`)} 
                  variant="contained" 
                  fullWidth
                >
                  Open Details
                </Button>
                <Button 
                  onClick={()=>navigate(`/manager/adoption/pets/${quickView.pet._id}/edit`)} 
                  variant="outlined" 
                  fullWidth
                >
                  Edit
                </Button>
              </Stack>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default PetsList