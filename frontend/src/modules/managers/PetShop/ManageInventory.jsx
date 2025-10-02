import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom'
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Publish as PublishIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import { apiClient } from '../../../services/api'
// Component
const ManageInventory = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [inventory, setInventory] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [editDialog, setEditDialog] = useState(false)
  const [editingPet, setEditingPet] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    price: 0,
    status: 'in_petshop',
    notes: ''
  })
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 })
  const [limit, setLimit] = useState(10)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [statusFilter, setStatusFilter] = useState('')
  const [speciesFilter, setSpeciesFilter] = useState('')
  const [breedFilter, setBreedFilter] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [speciesOptions, setSpeciesOptions] = useState([])
  const [breedOptions, setBreedOptions] = useState([])
  // Bulk price update
  const [bulkPriceOpen, setBulkPriceOpen] = useState(false)
  const [bulkPriceForm, setBulkPriceForm] = useState({ mode: 'percent', op: 'increase', value: 10 })
  // CSV import
  const [csvOpen, setCsvOpen] = useState(false)
  const [csvParsing, setCsvParsing] = useState(false)
  const [csvFileName, setCsvFileName] = useState('')
  const [csvPreview, setCsvPreview] = useState({ headers: [], rows: [], items: [] })

  // initial load and when filters change
  useEffect(() => {
    fetchInventory(1)
    if (location?.state?.message) {
      setSnackbar({ open: true, message: location.state.message, severity: 'success' })
      navigate('.', { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, speciesFilter, breedFilter, priceMin, priceMax, limit])

  // Load species/breeds for filters
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/admin/species/active')
        setSpeciesOptions(res?.data?.data || [])
      } catch (_) { setSpeciesOptions([]) }
    })()
  }, [])

  useEffect(() => {
    if (!speciesFilter) { setBreedOptions([]); setBreedFilter(''); return }
    (async () => {
      try {
        const res = await apiClient.get('/admin/breeds/active', { params: { speciesId: speciesFilter } })
        setBreedOptions(res?.data?.data || [])
      } catch (_) { setBreedOptions([]) }
    })()
  }, [speciesFilter])

  const fetchInventory = async (page = 1) => {
    try {
      setLoading(true)
      const qs = new URLSearchParams()
      qs.set('page', String(page))
      qs.set('limit', String(limit))
      if (statusFilter) qs.set('status', statusFilter)
      if (speciesFilter) qs.set('speciesId', speciesFilter)
      if (breedFilter) qs.set('breedId', breedFilter)
      if (priceMin) qs.set('priceMin', priceMin)
      if (priceMax) qs.set('priceMax', priceMax)
      
      console.log('🔍 Fetching inventory with URL:', `/petshop/inventory?${qs.toString()}`)
      console.log('👤 Current user from localStorage:', JSON.parse(localStorage.getItem('user') || '{}'))
      const response = await apiClient.get(`/petshop/inventory?${qs.toString()}`)
      console.log('📦 Raw API Response:', response)
      console.log('📊 Response Data:', response?.data)
      
      const body = response?.data || {}
      console.log('🎯 Body structure:', body)
      const dataNode = body.data ?? body
      console.log('🎯 DataNode structure:', dataNode)
      console.log('🎯 DataNode.items:', dataNode?.items)
      console.log('🎯 DataNode keys:', Object.keys(dataNode || {}))
      
      let items = Array.isArray(dataNode?.items) ? dataNode.items
        : (Array.isArray(dataNode) ? dataNode : [])
      
      console.log('🐾 Found items before filtering:', items.length, items)
      
      // Client-side filtering safety net
      items = items.filter(it => {
        const withinMin = priceMin === '' || Number(it.price || 0) >= Number(priceMin)
        const withinMax = priceMax === '' || Number(it.price || 0) <= Number(priceMax)
        const speciesOk = !speciesFilter || (it.speciesId && (it.speciesId._id === speciesFilter || it.speciesId === speciesFilter))
        const breedOk = !breedFilter || (it.breedId && (it.breedId._id === breedFilter || it.breedId === breedFilter))
        return withinMin && withinMax && speciesOk && breedOk
      })
      
      console.log('✅ Items after filtering:', items.length, items)
      
      const paginationData = dataNode?.pagination || body.pagination || { current: page, pages: 1, total: items.length }
      setInventory(items)
      setPagination({
        current: paginationData.current || paginationData.page || page,
        pages: paginationData.pages || paginationData.totalPages || 1,
        total: paginationData.total || paginationData.count || items.length
      })
      
      if (items.length === 0) {
        showSnackbar('No inventory items found. Try adding stock first or check your filters.', 'info')
      }
    } catch (err) {
      console.error('❌ Fetch inventory error:', err)
      showSnackbar(`Failed to load inventory: ${err.response?.data?.message || err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const applyBulkPrice = async () => {
    if (selectedIds.length === 0) {
      showSnackbar('Select at least one item', 'warning')
      return
    }  

    try {
      setLoading(true)
      // compute new prices per selected item and update
      const mapById = new Map(inventory.map(it => [it._id, it]))
      const jobs = selectedIds.map(id => {
        const it = mapById.get(id)
        if (!it) return Promise.resolve()
        const curr = Number(it.price || 0)
        let next = curr
        if (bulkPriceForm.mode === 'percent') {
          const delta = (curr * (Number(bulkPriceForm.value) || 0)) / 100
          next = bulkPriceForm.op === 'increase' ? curr + delta : curr - delta
        } else {
          const delta = Number(bulkPriceForm.value) || 0
          next = bulkPriceForm.op === 'increase' ? curr + delta : Math.max(0, curr - delta)
        }
        next = Math.max(0, Math.round(next))
        return apiClient.put(`/petshop/inventory/${id}`, { price: next })
      })
      await Promise.all(jobs)
      showSnackbar('Prices updated successfully')
      setBulkPriceOpen(false)
      await fetchInventory(pagination.current)
    } catch (err) {
      console.error('Bulk price update error:', err)
      showSnackbar(err.response?.data?.message || 'Failed to update prices', 'error')
    } finally {
      setLoading(false)
    }
  }

  const parseCsvText = (text) => {
    // simple CSV parser: split lines, handle commas, no quotes escaping advanced
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
    if (lines.length === 0) return { headers: [], rows: [], items: [] }
    const headers = lines[0].split(',').map(h => h.trim())
    const rows = lines.slice(1).map(l => l.split(',').map(v => v.trim()))
    // map to items accepted by backend
    const items = rows.map(cols => {
      const o = {}
      headers.forEach((h, i) => { o[h] = cols[i] })
      // normalize fields
      return {
        categoryId: o.categoryId || '',
        speciesId: o.speciesId || '',
        breedId: o.breedId || '',
        gender: o.gender || 'Unknown',
        age: Number(o.age || 0),
        ageUnit: o.ageUnit || 'months',
        ageGroup: o.ageGroup || undefined,
        status: o.status || 'in_petshop',
        source: o.source || 'Other',
        price: Number(o.price || o.basePrice || 0),
        unitCost: Number(o.unitCost || 0),
        quantity: 1,
        arrivalDate: o.arrivalDate || undefined,
        notes: o.notes || ''
      }
    })
    return { headers, rows, items }
  }

  const handleCsvFile = (file) => {
    if (!file) return
    setCsvParsing(true)
    setCsvFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = reader.result?.toString() || ''
        const parsed = parseCsvText(text)
        setCsvPreview(parsed)
      } catch (e) {
        console.error('CSV parse error:', e)
        showSnackbar('Failed to parse CSV', 'error')
      } finally {
        setCsvParsing(false)
      }
    }
    reader.readAsText(file)
  }

  const importCsvItems = async () => {
    const items = csvPreview.items || []
    if (items.length === 0) { showSnackbar('No items to import', 'warning'); return }
    // basic validation: required ids
    const invalid = items.find(it => !(it.categoryId && it.speciesId && it.breedId))
    if (invalid) { showSnackbar('Each row must include categoryId,speciesId,breedId', 'error'); return }
    try {
      setLoading(true)
      await apiClient.post('/petshop/inventory/bulk', { items })
      showSnackbar(`Imported ${items.length} items`) 
      setCsvOpen(false)
      setCsvPreview({ headers: [], rows: [], items: [] })
      await fetchInventory(1)
    } catch (err) {
      console.error('CSV import error:', err)
      showSnackbar(err.response?.data?.message || 'Failed to import CSV', 'error')
    } finally { setLoading(false) }
  }

  const handleEditPet = (pet) => {
    setEditingPet(pet)
    setEditForm({
      name: pet.name || '',
      price: pet.price || 0,
      status: pet.status || 'in_petshop',
      notes: pet.notes || ''
    })
    setEditDialog(true)
  }

  const handleUpdatePet = async () => {
    try {
      await apiClient.put(`/petshop/inventory/${editingPet._id}`, editForm)
      showSnackbar('Pet updated successfully!')
      setEditDialog(false)
      setEditingPet(null)
      fetchInventory(pagination.current)
    } catch (err) {
      console.error('Update pet error:', err)
      showSnackbar(err.response?.data?.message || 'Failed to update pet', 'error')
    }
  }

  const handleReleaseToPublic = async (petIds) => {
    try {
      await apiClient.post('/petshop/inventory/publish-bulk', { itemIds: petIds })
      showSnackbar(`Released ${petIds.length} pets to public!`)
      setSelectedIds([])
      fetchInventory(pagination.current)
    } catch (err) {
      console.error('Release pets error:', err)
      showSnackbar(err.response?.data?.message || 'Failed to release pets', 'error')
    }
  }

  const handleDeletePet = async (petId) => {
    if (!window.confirm('Are you sure you want to delete this pet?')) return
    
    try {
      await apiClient.delete(`/petshop/inventory/${petId}`)
      showSnackbar('Pet deleted successfully!')
      fetchInventory(pagination.current)
    } catch (err) {
      console.error('Delete pet error:', err)
      showSnackbar(err.response?.data?.message || 'Failed to delete pet', 'error')
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/manager/petshop/inventory')}
          sx={{ mr: 2 }}
        >
          Back to Overview
        </Button>
        <Typography variant="h4" component="h1">
          Manage Inventory
        </Typography>
      </Box>

      {/* Actions Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Status Filter</InputLabel>
              <Select label="Status Filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="in_petshop">In PetShop</MenuItem>
                <MenuItem value="available_for_sale">Available for Sale</MenuItem>
                <MenuItem value="reserved">Reserved</MenuItem>
                <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                <MenuItem value="sold">Sold</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Species</InputLabel>
              <Select label="Species" value={speciesFilter} onChange={(e) => setSpeciesFilter(e.target.value)}>
                <MenuItem value="">All Species</MenuItem>
                {speciesOptions.map(s => (
                  <MenuItem key={s._id} value={s._id}>{s.displayName || s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }} disabled={!speciesFilter}>
              <InputLabel>Breed</InputLabel>
              <Select label="Breed" value={breedFilter} onChange={(e) => setBreedFilter(e.target.value)}>
                <MenuItem value="">All Breeds</MenuItem>
                {breedOptions.map(b => (
                  <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField size="small" type="number" label="Min Price" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} sx={{ width: 120 }} />
            <TextField size="small" type="number" label="Max Price" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} sx={{ width: 120 }} />
            
            <Button 
              variant="outlined" 
              color="info" 
              onClick={() => {
                console.log('🔄 Manual refresh triggered')
                setStatusFilter('')
                setSpeciesFilter('')
                setBreedFilter('')
                setPriceMin('')
                setPriceMax('')
                fetchInventory(1)
              }}
            >
              🔄 Debug Refresh
            </Button>

            <Button
              variant="contained"
              disabled={selectedIds.length === 0}
              onClick={() => handleReleaseToPublic(selectedIds)}
              startIcon={<PublishIcon />}
            >
              Release Selected to Public ({selectedIds.length})
            </Button>
            <Button
              variant="outlined"
              disabled={selectedIds.length === 0}
              onClick={() => setBulkPriceOpen(true)}
            >
              Bulk Price Update
            </Button>
            <Button
              variant="outlined"
              onClick={() => setCsvOpen(true)}
            >
              Import CSV
            </Button>
            
            <Typography variant="body2" color="textSecondary">
              Select pets to release for public viewing and booking
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Inventory ({inventory.length} pets)
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedIds.length > 0 && selectedIds.length < inventory.length}
                      checked={inventory.length > 0 && selectedIds.length === inventory.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(inventory.map(x => x._id))
                        else setSelectedIds([])
                      }}
                    />
                  </TableCell>
                  <TableCell>Pet Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Species/Breed</TableCell>
                  <TableCell>Age/Gender</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventory.map(item => (
                  <TableRow key={item._id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(item._id)}
                        onChange={(e) => {
                          setSelectedIds(prev => 
                            e.target.checked 
                              ? [...new Set([...prev, item._id])] 
                              : prev.filter(id => id !== item._id)
                          )
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={item.petCode || `PET-${item._id.slice(-6)}`} 
                        size="small" 
                        color="primary" 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.name || 'Unnamed Pet'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {item.speciesId?.displayName || item.speciesId?.name || 'Unknown Species'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {item.breedId?.name || 'Unknown Breed'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {item.age} {item.ageUnit} • {item.gender}
                        </Typography>
                        {item.ageGroup && (
                          <Typography variant="caption" color="textSecondary">
                            {item.ageGroup}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={item.price > 0 ? 'text.primary' : 'text.secondary'}
                      >
                        ₹{Number(item.price || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={item.status?.replace('_', ' ') || 'in stock'} 
                        size="small" 
                        color={item.status === 'available_for_sale' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit Pet Details">
                          <IconButton size="small" onClick={() => handleEditPet(item)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>

                        {item.status === 'available_for_sale' && (
                          <Button 
                            size="small" 
                            variant="text" 
                            component={RouterLink} 
                            to={`/User/petshop/pet/${item._id}`} 
                            target="_blank"
                          >
                            View Public
                          </Button>
                        )}
                        
                        {item.status !== 'available_for_sale' && (
                          <Tooltip title="Release to Public">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleReleaseToPublic([item._id])}
                            >
                              <PublishIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Delete Pet">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeletePet(item._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit Pet Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Pet Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Pet Name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter pet name (optional)"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Selling Price"
                type="number"
                value={editForm.price}
                onChange={(e) => setEditForm(prev => ({ 
                  ...prev, 
                  price: parseFloat(e.target.value) || 0 
                }))}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="in_petshop">In PetShop</MenuItem>
                  <MenuItem value="available_for_sale">Available for Sale</MenuItem>
                  <MenuItem value="reserved">Reserved</MenuItem>
                  <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                  <MenuItem value="sold">Sold</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any special notes about this pet..."
              />
            </Grid>
            
            {editingPet && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Pet Information
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Code:</strong> {editingPet.petCode || `PET-${editingPet._id?.slice(-6)}`}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Species:</strong> {editingPet.speciesId?.displayName || editingPet.speciesId?.name || 'Unknown'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Breed:</strong> {editingPet.breedId?.name || 'Unknown'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Age:</strong> {editingPet.age} {editingPet.ageUnit} • <strong>Gender:</strong> {editingPet.gender}
                  </Typography>
                  {editingPet.ageGroup && (
                    <Typography variant="body2" color="textSecondary">
                      <strong>Age Group:</strong> {editingPet.ageGroup}
                    </Typography>
                  )}
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdatePet} variant="contained">
            Update Pet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Price Update Dialog */}
      <Dialog open={bulkPriceOpen} onClose={() => setBulkPriceOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Price Update</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Updating {selectedIds.length} item(s). Choose mode and amount.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Mode</InputLabel>
                <Select value={bulkPriceForm.mode} onChange={(e) => setBulkPriceForm(prev => ({ ...prev, mode: e.target.value }))}>
                  <MenuItem value="percent">Percent</MenuItem>
                  <MenuItem value="fixed">Fixed Amount</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Operation</InputLabel>
                <Select value={bulkPriceForm.op} onChange={(e) => setBulkPriceForm(prev => ({ ...prev, op: e.target.value }))}>
                  <MenuItem value="increase">Increase</MenuItem>
                  <MenuItem value="decrease">Decrease</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth type="number" label={bulkPriceForm.mode === 'percent' ? 'Percent (%)' : 'Amount (₹)'} value={bulkPriceForm.value} onChange={(e) => setBulkPriceForm(prev => ({ ...prev, value: Number(e.target.value) }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkPriceOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={applyBulkPrice} disabled={loading}>Apply</Button>
        </DialogActions>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={csvOpen} onClose={() => setCsvOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import Inventory from CSV</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Required headers: categoryId,speciesId,breedId,gender,age,ageUnit,price,status,source,notes,arrivalDate
          </Typography>
          <Button variant="outlined" component="label" disabled={csvParsing}>
            {csvParsing ? 'Parsing...' : 'Choose CSV File'}
            <input hidden type="file" accept=".csv,text/csv" onChange={(e) => handleCsvFile(e.target.files?.[0])} />
          </Button>
          {csvFileName && (
            <Typography variant="caption" sx={{ ml: 2 }}>
              {csvFileName}
            </Typography>
          )}
          {csvPreview.items?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info">Parsed {csvPreview.items.length} item(s).</Alert>
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">Sample row preview:</Typography>
                <pre style={{ background: '#f7f7f7', padding: 12, borderRadius: 6, maxHeight: 200, overflow: 'auto' }}>{JSON.stringify(csvPreview.items[0], null, 2)}</pre>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCsvOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={importCsvItems} disabled={csvParsing || (csvPreview.items?.length || 0) === 0}>Import</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      {snackbar.open && (
        <Alert 
          severity={snackbar.severity}
          sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      )}
    </Box>
  )
}

export default ManageInventory
