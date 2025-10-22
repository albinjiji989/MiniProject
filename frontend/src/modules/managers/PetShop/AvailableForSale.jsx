import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Stack,
  CircularProgress
} from '@mui/material'
import { ArrowBack as ArrowBackIcon, Visibility as ViewIcon } from '@mui/icons-material'
import { apiClient } from '../../../services/api'

const AvailableForSale = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [speciesOptions, setSpeciesOptions] = useState([])
  const [breedOptions, setBreedOptions] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 })
  const [limit, setLimit] = useState(10)

  // Filters
  const [searchText, setSearchText] = useState('')
  const [speciesId, setSpeciesId] = useState('')
  const [breedId, setBreedId] = useState('')
  const [gender, setGender] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [ageMin, setAgeMin] = useState('')
  const [ageMax, setAgeMax] = useState('')

  useEffect(() => {
    fetchSpecies()
  }, [])

  useEffect(() => {
    if (!speciesId) { setBreedOptions([]); setBreedId(''); return }
    (async () => {
      try {
        const res = await apiClient.get('/admin/breeds/active', { params: { speciesId } })
        setBreedOptions(res?.data?.data || [])
      } catch (_) { setBreedOptions([]) }
    })()
  }, [speciesId])

  useEffect(() => {
    fetchItems(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, speciesId, breedId, gender, priceMin, priceMax, ageMin, ageMax, limit])

  const fetchSpecies = async () => {
    try {
      const res = await apiClient.get('/admin/species/active')
      setSpeciesOptions(res?.data?.data || [])
    } catch (_) { setSpeciesOptions([]) }
  }

  const fetchItems = async (page = 1) => {
    try {
      setLoading(true)
      const qs = new URLSearchParams()
      qs.set('page', String(page))
      qs.set('limit', String(limit))
      qs.set('status', 'available_for_sale')
      if (speciesId) qs.set('speciesId', speciesId)
      if (breedId) qs.set('breedId', breedId)
      if (gender) qs.set('gender', gender)
      if (priceMin) qs.set('priceMin', priceMin)
      if (priceMax) qs.set('priceMax', priceMax)
      if (ageMin) qs.set('ageMin', ageMin)
      if (ageMax) qs.set('ageMax', ageMax)
      if (searchText) qs.set('q', searchText.trim())

      const resp = await apiClient.get(`/petshop/manager/inventory?${qs.toString()}`)
      const body = resp?.data || {}
      const dataNode = body.data ?? body
      const list = Array.isArray(dataNode?.items) ? dataNode.items : []
      setItems(list)
      const p = dataNode?.pagination || { current: page, pages: 1, total: list.length }
      setPagination({ current: p.current || page, pages: p.pages || 1, total: p.total || list.length })
    } catch (e) {
      console.error('Load available for sale error:', e)
    } finally { setLoading(false) }
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/manager/petshop/inventory')} sx={{ mr: 2 }}>
          Back to Overview
        </Button>
        <Typography variant="h4">Available For Sale</Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField size="small" label="Search (code/name/species/breed)" value={searchText} onChange={(e) => setSearchText(e.target.value)} sx={{ minWidth: 260 }} />

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Species</InputLabel>
              <Select label="Species" value={speciesId} onChange={(e) => setSpeciesId(e.target.value)}>
                <MenuItem value="">All Species</MenuItem>
                {speciesOptions.map(s => (
                  <MenuItem key={s._id} value={s._id}>{s.displayName || s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }} disabled={!speciesId}>
              <InputLabel>Breed</InputLabel>
              <Select label="Breed" value={breedId} onChange={(e) => setBreedId(e.target.value)}>
                <MenuItem value="">All Breeds</MenuItem>
                {breedOptions.map(b => (
                  <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Gender</InputLabel>
              <Select label="Gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Unknown">Unknown</MenuItem>
              </Select>
            </FormControl>

            <TextField size="small" type="number" label="Min Price" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} sx={{ width: 120 }} />
            <TextField size="small" type="number" label="Max Price" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} sx={{ width: 120 }} />
            <TextField size="small" type="number" label="Min Age" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} sx={{ width: 120 }} />
            <TextField size="small" type="number" label="Max Age" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} sx={{ width: 120 }} />

            <Button variant="outlined" onClick={() => { setSearchText(''); setSpeciesId(''); setBreedId(''); setGender(''); setPriceMin(''); setPriceMax(''); setAgeMin(''); setAgeMax(''); fetchItems(1) }}>Reset</Button>
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>For Sale ({items.length} items)</Typography>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pet Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Species/Breed</TableCell>
                  <TableCell>Age/Gender</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item._id}>
                    <TableCell>
                      <Chip label={item.petCode || `PET-${item._id.slice(-6)}`} size="small" color="primary" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.name || 'Unnamed Pet'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{item.speciesId?.displayName || item.speciesId?.name || 'Unknown Species'}</Typography>
                        <Typography variant="caption" color="textSecondary">{item.breedId?.name || 'Unknown Breed'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.age} {item.ageUnit} • {item.gender}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">₹{Number(item.price || 0).toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Public">
                        <IconButton component="a" href={`/User/petshop/pet/${item._id}`} target="_blank" size="small">
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {items.length === 0 && !loading && (
            <Alert severity="info" sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>No items found. Adjust filters or release pets from Manage Inventory.</span>
              <Button variant="outlined" size="small" onClick={() => navigate('/manager/petshop/manage-inventory')}>
                Go to Manage Inventory
              </Button>
            </Alert>
          )}

          <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
            <Pagination
              count={Math.max(1, Number(pagination.pages || 1))}
              page={Number(pagination.current || 1)}
              onChange={(_, p) => fetchItems(p)}
              color="primary"
            />
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

export default AvailableForSale
