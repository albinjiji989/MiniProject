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
      const url = up.data?.data?.url
      if (url) {
        await apiClient.put(`/adoption/manager/pets/${petId}`, { images: [{ url, isPrimary: true }] })
        setThumbById(prev => ({ ...prev, [petId]: resolveMediaUrl(url) }))
      }
    } catch (err) {
      alert(err?.response?.data?.error || 'Upload failed')
    }
  }

  const getFirstImageUrl = (pet) => {
    const images = pet?.images || []
    if (!images || images.length === 0) return ''
    // find first non-blob url
    const firstValid = images.find(it => {
      const raw = extractUrl(it)
      return raw && !String(raw).startsWith('blob:')
    })
    if (!firstValid) return ''
    const url = extractUrl(firstValid)
    if (String(url).startsWith('data:')) return url // render data URL directly
    return resolveMediaUrl(url)
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
    try {
      const res = await apiClient.get('/adoption/manager/pets', { params: { search: q, status, page, limit, fields: '_id,name,breed,species,status,ageDisplay,age,ageUnit,petCode,images', lean: true } })
      const raw = res.data?.data?.pets || []
      // Minimize each item to reduce memory/CPU: keep only fields we render and a single thumbnail url
      const minimal = raw.map((p) => {
        const firstUrl = extractUrl((p.images||[]).find(it => {
          const u = extractUrl(it)
          return u && !String(u).startsWith('blob:')
        }))
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
          images: firstUrl ? [firstUrl] : [],
        }
        // Backfill ageDisplay if missing
        if (!minimal.ageDisplay && (minimal.age !== undefined || minimal.ageUnit !== undefined)) {
          minimal.ageDisplay = computeAgeDisplay(minimal.age, minimal.ageUnit)
        }
        return minimal
      })
      setPets(minimal)
      // Always try to load/refresh thumbs from media endpoint to ensure a valid served URL
      minimal.forEach(p=>ensureThumbLoaded(p._id))
      setTotal(res.data?.data?.pagination?.total || 0)
      setSelected(new Set())
    } catch (e) {
      console.error('Load pets failed', e)
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

  useEffect(() => { load() }, [page, limit])
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

      <Grid container spacing={2}>
        {loading && (
          <Grid item xs={12}><Typography>Loading...</Typography></Grid>
        )}
        {!loading && pets
          .filter(pet => (draftOnly ? isDraft(pet) : true))
          .map(pet => (
          <Grid item xs={12} sm={6} md={4} key={pet._id}>
            <Card>
              <Box sx={{ position:'relative', width: '100%', height: 160, overflow: 'hidden', bgcolor: 'grey.100', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Checkbox checked={selected.has(pet._id)} onChange={()=>toggleSelect(pet._id)} sx={{ position:'absolute', top: 2, left: 2, bgcolor:'rgba(255,255,255,0.7)', borderRadius: 1 }} />
                <IconButton size="small" onClick={()=>openQuickView(pet._id)} sx={{ position:'absolute', top: 2, right: 2, bgcolor:'rgba(255,255,255,0.7)' }} title="Quick View">
                  <VisibilityIcon fontSize="inherit" />
                </IconButton>
                {thumbById[pet._id] || getFirstImageUrl(pet)
                  ? <img loading="lazy" src={thumbById[pet._id] || getFirstImageUrl(pet)} alt={pet.name || 'Pet image'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={(e)=>{ e.currentTarget.src='/placeholder-pet.svg' }} />
                  : (
                    <Box sx={{ textAlign:'center' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display:'block', mb: 1 }}>No image</Typography>
                      <input type="file" accept="image/*" style={{ display:'none' }} ref={el => (fileInputsRef.current[pet._id] = el)} onChange={(e)=>handleFileSelected(pet._id, e)} />
                      <Button size="small" variant="outlined" onClick={()=>triggerUpload(pet._id)}>Upload Image</Button>
                    </Box>
                  )
                }
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
        {!loading && pets.length === 0 && (
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
