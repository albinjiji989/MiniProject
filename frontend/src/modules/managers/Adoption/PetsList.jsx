import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient, resolveMediaUrl } from '../../../services/api'
import { Box, Grid, Card, CardContent, Typography, Stack, Button, TextField, Select, MenuItem, FormControl, InputLabel, Chip, Pagination, Checkbox, IconButton, Divider, Dialog, DialogTitle, DialogContent } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DeleteIcon from '@mui/icons-material/Delete'

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
          status, 
          page, 
          limit,
          fields: '_id,name,breed,species,status,ageDisplay,age,ageUnit,petCode,images,documents',
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

  useEffect(() => { load() }, [page, limit, q, status])
  // Debounce search/status changes to avoid spamming API and heavy re-renders
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1)
      load()
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={700}>Pets</Typography>
        <Stack direction="row" spacing={1}>
          <TextField size="small" placeholder="Search" value={q} onChange={(e)=>setQ(e.target.value)} />
          <FormControl size="small">
            <InputLabel id="status">Status</InputLabel>
            <Select labelId="status" label="Status" value={status} onChange={(e)=>setStatus(e.target.value)} sx={{ minWidth: 150 }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="adopted">Adopted</MenuItem>
              <MenuItem value="reserved">Reserved</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={()=>{ setPage(1); load() }}>Filter</Button>
          <IconButton onClick={load} title="Refresh"><RefreshIcon /></IconButton>
          <Button variant="outlined" color="error" startIcon={<DeleteIcon />} disabled={selected.size===0} onClick={bulkDelete}>Delete Selected ({selected.size})</Button>
          <Button variant="contained" onClick={()=>navigate('/manager/adoption/wizard/start')}>Add Pet</Button>
          <Button variant="contained" color="success" onClick={()=>navigate('../import')}>Import CSV</Button>
        </Stack>
      </Box>
      <Divider />
      
      {error && (
        <Box sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
          <Typography variant="body1">Error: {error}</Typography>
        </Box>
      )}

      <Grid container spacing={2}>
        {loading && (
          <Grid item xs={12}><Typography>Loading...</Typography></Grid>
        )}
        {!loading && pets
          .filter(pet => (draftOnly ? isDraft(pet) : true))
          .map(pet => (
          <Grid item xs={12} sm={6} md={4} key={pet._id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ position: 'relative', width: '100%', height: 160, bgcolor: 'grey.100', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  <Typography variant="caption" color="text.secondary">No image</Typography>
                )}
              </Box>
              <CardContent>
                <Box sx={{ display:'flex', alignItems:'start', justifyContent:'space-between', mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {isDraft(pet) ? 'No name' : (pet.name || 'No name')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{pet.breed} • {pet.species}</Typography>
                    {isDraft(pet) && (
                      <Typography variant="caption" sx={{ display:'inline-block', mt: 0.5, fontFamily:'monospace', px: 0.5, py: 0.25, border:'1px solid', borderColor:'divider', borderRadius: 0.5 }}>
                        {pet.petCode || pet._id}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {isDraft(pet) && <Chip size="small" label="DRAFT" color="warning" variant="outlined" />}
                    <StatusChip value={pet.status} />
                  </Stack>
                </Box>
                <Typography variant="caption" color="text.secondary">Age: {pet.ageDisplay || computeAgeDisplay(pet.age, pet.ageUnit) || '-'}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Button size="small" onClick={()=>navigate(`/manager/adoption/pets/${pet._id}`)}>View</Button>
                  <Button size="small" onClick={()=>navigate(`/manager/adoption/pets/${pet._id}/edit`)}>Edit</Button>
                  <Button size="small" color="error" onClick={()=>onDelete(pet._id)}>Delete</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {!loading && pets.length === 0 && !error && (
          <Grid item xs={12}><Typography>No pets found.</Typography></Grid>
        )}
      </Grid>

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">Total: {total}</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small">
            <Select value={limit} onChange={(e)=>{ setLimit(Number(e.target.value)); setPage(1); }}>
              <MenuItem value={6}>6</MenuItem>
              <MenuItem value={9}>9</MenuItem>
              <MenuItem value={12}>12</MenuItem>
            </Select>
          </FormControl>
          <Pagination count={totalPages} page={page} onChange={(_,p)=>setPage(p)} size="small" />
        </Stack>
      </Stack>

      {/* Quick View Dialog */}
      <Dialog open={quickView.open} onClose={closeQuickView} maxWidth="sm" fullWidth>
        <DialogTitle>Pet Quick View</DialogTitle>
        <DialogContent>
          {quickView.loading ? (
            <Typography>Loading...</Typography>
          ) : !quickView.pet ? (
            <Typography color="text.secondary">No data</Typography>
          ) : (
            <Box sx={{ display:'flex', flexDirection:'column', gap: 1 }}>
              <Typography variant="h6">{quickView.pet.name || 'No name'} <Typography component="span" variant="caption" sx={{ ml: 1, fontFamily:'monospace' }}>{quickView.pet.petCode}</Typography></Typography>
              <Typography variant="body2" color="text.secondary">{quickView.pet.breed} • {quickView.pet.species}</Typography>
              <Typography variant="body2">Status: {quickView.pet.status}</Typography>
              <Typography variant="body2">Age: {quickView.pet.ageDisplay || '-'}</Typography>
              <Typography variant="body2">Gender: {quickView.pet.gender || '-'}</Typography>
              <Typography variant="body2">Color: {quickView.pet.color || '-'}</Typography>
              <Typography variant="body2">Weight: {typeof quickView.pet.weight==='number' ? quickView.pet.weight : '-'} kg</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>{quickView.pet.description || '—'}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button onClick={()=>navigate(`/manager/adoption/pets/${quickView.pet._id}`)} variant="contained">Open Details</Button>
                <Button onClick={()=>navigate(`/manager/adoption/pets/${quickView.pet._id}/edit`)} variant="outlined">Edit</Button>
              </Stack>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default PetsList