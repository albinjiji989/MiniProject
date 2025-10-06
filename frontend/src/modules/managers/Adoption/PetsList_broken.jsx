import React, { useEffect, useState, useMemo } from 'react'
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

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit])

  const extractUrl = (item) => {
    if (!item) return ''
    if (typeof item === 'string') return item
    if (typeof item.url === 'string') return item.url
    if (item.url && typeof item.url.url === 'string') return item.url.url
    return ''
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/adoption/manager/pets', { params: { search: q, status, page, limit, fields: '_id,name,breed,species,status,ageDisplay,petCode,images', lean: true } })
      const raw = res.data?.data?.pets || []
      // Minimize each item to reduce memory/CPU: keep only fields we render and a single thumbnail url
      const minimal = raw.map((p) => {
        const firstUrl = extractUrl((p.images||[]).find(it => {
          const u = extractUrl(it)
          return u && !String(u).startsWith('blob:')
        }))
        return {
          _id: p._id,
          name: p.name,
          breed: p.breed,
          species: p.species,
          ageDisplay: p.ageDisplay,
          status: p.status,
          petCode: p.petCode,
          images: firstUrl ? [firstUrl] : [],
        }
      })
      setPets(minimal)
      setTotal(res.data?.data?.pagination?.total || 0)
      setSelected(new Set())
    } catch (e) {
      console.error('Load pets failed', e)
    } finally {
      setLoading(false)
    }
  }

  const bulkDelete = async () => {
    if (selected.size === 0) return
    if (!window.confirm(`Delete ${selected.size} selected pet(s)?`)) return
    try {
      for (const id of selected) {
        await apiClient.delete(`/adoption/manager/pets/${id}`)
      }
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
    return resolveMediaUrl(url)
  }

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

  const extractUrl = (item) => {
    if (!item) return ''
    if (typeof item === 'string') return item
    if (typeof item.url === 'string') return item.url
    if (item.url && typeof item.url.url === 'string') return item.url.url
    return ''
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
    return resolveMediaUrl(url)
  }

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
                {getFirstImageUrl(pet)
                  ? <img loading="lazy" src={getFirstImageUrl(pet)} alt={pet.name || 'Pet image'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <Typography variant="caption" color="text.secondary">No image</Typography>
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
                <Typography variant="caption" color="text.secondary">Age: {pet.ageDisplay || '-'}</Typography>
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
    </Box>
  )
}

export default PetsList
