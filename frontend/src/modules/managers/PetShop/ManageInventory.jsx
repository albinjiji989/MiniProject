import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
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
  Checkbox,
  Tabs,
  Tab,
  Badge,
  CircularProgress,
  Avatar,
  Divider,
  Fab,
  Menu,
  ListItemIcon,
  ListItemText,
  Pagination,
  Stack,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Publish as PublishIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Image as ImageIcon,
  AddPhotoAlternate as AddPhotoAlternateIcon,
  CloudUpload as CloudUploadIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Pets as PetsIcon,
  PriceChange as PriceChangeIcon,
  FileUpload as FileUploadIcon,
  MoreVert as MoreVertIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material'
import { apiClient } from '../../../services/api'

// Component
const ManageInventory = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [inventory, setInventory] = useState([])
  const [readyForRelease, setReadyForRelease] = useState([])
  const [releasedPets, setReleasedPets] = useState([])
  const [purchasedPets, setPurchasedPets] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedReadyIds, setSelectedReadyIds] = useState([])
  const [selectedReleasedIds, setSelectedReleasedIds] = useState([])
  const [selectedPurchasedIds, setSelectedPurchasedIds] = useState([])
  const [activeTab, setActiveTab] = useState(0) // 0: Pending Images, 1: Ready for Release, 2: Released, 3: Purchased
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
  const [searchText, setSearchText] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [ageMin, setAgeMin] = useState('')
  const [ageMax, setAgeMax] = useState('')
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
  
  // Image upload state
  const [imageDialog, setImageDialog] = useState({ open: false, item: null })
  const [imageFile, setImageFile] = useState(null)
  
  // Filter menu
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  const filterOpen = Boolean(filterAnchorEl)
  
  // View mode
  const [viewMode, setViewMode] = useState('table') // table or grid

  // initial load and when filters change
  useEffect(() => {
    fetchInventory(1)
    if (location?.state?.message) {
      setSnackbar({ open: true, message: location.state.message, severity: 'success' })
      navigate('.', { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, speciesFilter, breedFilter, priceMin, priceMax, genderFilter, ageMin, ageMax, searchText, limit])

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
      if (genderFilter) qs.set('gender', genderFilter)
      if (ageMin) qs.set('ageMin', ageMin)
      if (ageMax) qs.set('ageMax', ageMax)
      if (searchText) qs.set('q', searchText.trim())
      
      const response = await apiClient.get(`/petshop/manager/inventory?${qs.toString()}`)
      
      const body = response?.data || {}
      const dataNode = body.data ?? body
      
      let items = Array.isArray(dataNode?.items) ? dataNode.items
        : (Array.isArray(dataNode) ? dataNode : [])
      
      // Separate items based on their status
      const itemsWithoutImages = items.filter(item => !item.images || item.images.length === 0)
      const itemsWithImages = items.filter(item => item.images && item.images.length > 0)
      const releasedItems = items.filter(item => item.status === 'available_for_sale')
      const purchasedItems = items.filter(item => item.status === 'sold')
      const readyItems = itemsWithImages.filter(item => item.status !== 'available_for_sale' && item.status !== 'sold')
      
      const paginationData = dataNode?.pagination || body.pagination || { current: page, pages: 1, total: items.length }
      
      setInventory(itemsWithoutImages)
      setReadyForRelease(readyItems)
      setReleasedPets(releasedItems)
      setPurchasedPets(purchasedItems)
      
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
      const resp = await apiClient.post('/petshop/inventory/publish-bulk', { itemIds: petIds })
      const data = resp?.data?.data || {}
      const published = Array.isArray(data.published) ? data.published.length : 0
      const skipped = Array.isArray(data.skipped) ? data.skipped : []

      if (published > 0) {
        showSnackbar(`Released ${published} item(s) to public`)
      }
      if (skipped.length > 0) {
        const reasonCounts = skipped.reduce((acc, s) => { acc[s.reason] = (acc[s.reason]||0)+1; return acc }, {})
        const details = Object.entries(reasonCounts).map(([r,c]) => `${c} ${r.replaceAll('_',' ')}`).join(', ')
        showSnackbar(`Skipped ${skipped.length}: ${details}. Set price > 0 and add at least 1 image.`, 'warning')
      }
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

  const handleOpenImageDialog = (item) => {
    setImageDialog({ open: true, item })
    setImageFile(null)
  }

  const handleUploadImage = async () => {
    if (!imageFile || !imageDialog.item) {
      showSnackbar('Please select an image file', 'warning')
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('file', imageFile) // Backend expects 'file', not 'image'
      formData.append('caption', `Image for ${imageDialog.item.name || imageDialog.item.petCode}`)
      formData.append('isPrimary', 'true') // Set as primary image
      
      // Use the correct endpoint with item ID in URL path
      const response = await apiClient.post(`/petshop/inventory/${imageDialog.item._id}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      showSnackbar('Image uploaded successfully! Pet moved to Ready for Release.')
      setImageDialog({ open: false, item: null })
      setImageFile(null)
      
      // Update the local state immediately for better UX
      if (response?.data?.data?.item) {
        // Find the item in the current inventory and update it
        setInventory(prev => prev.map(item => 
          item._id === response.data.data.item._id ? response.data.data.item : item
        ))
        
        // Also update the readyForRelease if the item is now ready
        if (response.data.data.item.images && response.data.data.item.images.length > 0) {
          setReadyForRelease(prev => {
            // Remove from pending if it was there
            const updatedPending = prev.filter(item => item._id !== response.data.data.item._id)
            // Add to ready if not already there
            const exists = updatedPending.some(item => item._id === response.data.data.item._id)
            return exists ? updatedPending : [...updatedPending, response.data.data.item]
          })
        }
      } else {
        // Fallback to fetching all data if response doesn't contain updated item
        fetchInventory(pagination.current)
      }
    } catch (err) {
      console.error('Upload image error:', err)
      showSnackbar(err.response?.data?.message || 'Failed to upload image', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAllPending = () => {
    if (selectedIds.length === inventory.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(inventory.map(item => item._id))
    }
  }

  const handleSelectAllReady = () => {
    if (selectedReadyIds.length === readyForRelease.length) {
      setSelectedReadyIds([])
    } else {
      setSelectedReadyIds(readyForRelease.map(item => item._id))
    }
  }

  const handleSelectAllReleased = () => {
    if (selectedReleasedIds.length === releasedPets.length) {
      setSelectedReleasedIds([])
    } else {
      setSelectedReleasedIds(releasedPets.map(item => item._id))
    }
  }

  const handleSelectAllPurchased = () => {
    if (selectedPurchasedIds.length === purchasedPets.length) {
      setSelectedPurchasedIds([])
    } else {
      setSelectedPurchasedIds(purchasedPets.map(item => item._id))
    }
  }

  const handlePageChange = (event, value) => {
    fetchInventory(value)
  }

  const openFilterMenu = (event) => {
    setFilterAnchorEl(event.currentTarget)
  }

  const closeFilterMenu = () => {
    setFilterAnchorEl(null)
  }

  const resetFilters = () => {
    setStatusFilter('')
    setSpeciesFilter('')
    setBreedFilter('')
    setPriceMin('')
    setPriceMax('')
    setGenderFilter('')
    setAgeMin('')
    setAgeMax('')
    setSearchText('')
    closeFilterMenu()
  }

  // Pet Card Component for Grid View
  const PetCard = ({ item, isSelected, onSelect, onAction, isPending = false }) => (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
        boxShadow: isSelected ? 3 : 1,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)'
        }
      }}
    >
      <Box sx={{ position: 'relative', pt: '75%' }}>
        {item.images && item.images.length > 0 ? (
          <img 
            src={item.images[0]?.url || '/placeholder-image.png'} 
            alt={item.name || item.petCode}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              e.target.src = '/placeholder-image.png'
            }}
          />
        ) : (
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#f5f5f5'
            }}
          >
            <AddPhotoAlternateIcon sx={{ fontSize: 48, color: '#9e9e9e' }} />
          </Box>
        )}
        {isPending && (
          <Chip 
            icon={<PendingIcon />}
            label="Needs Images"
            color="warning"
            size="small"
            sx={{ 
              position: 'absolute', 
              top: 8, 
              left: 8,
              fontWeight: 'bold'
            }}
          />
        )}
        <Checkbox
          checked={isSelected}
          onChange={() => onSelect(item._id)}
          sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8,
            bgcolor: 'white',
            borderRadius: '50%',
            '& .MuiSvgIcon-root': { fontSize: 20 }
          }}
        />
        {item.images && item.images.length > 0 && (
          <Chip 
            label={`${item.images.length} image${item.images.length > 1 ? 's' : ''}`}
            size="small"
            sx={{ 
              position: 'absolute', 
              bottom: 8, 
              right: 8,
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        )}
      </Box>
      
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold" noWrap>
            {item.name || 'Unnamed Pet'}
          </Typography>
          <Chip 
            label={item.petCode || `PET-${item._id?.slice(-6)}`} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
        </Box>
        
        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" color="textSecondary" noWrap>
            {item.speciesId?.displayName || item.speciesId?.name || 'Unknown Species'} • {item.breedId?.name || 'Unknown Breed'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {item.age} {item.ageUnit} • {item.gender}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" color="primary" fontWeight="bold">
            ₹{Number(item.price || 0).toLocaleString()}
          </Typography>
          <Chip 
            label={item.status?.replace('_', ' ') || 'in stock'} 
            size="small" 
            color={item.status === 'available_for_sale' ? 'success' : 'default'}
          />
        </Box>
      </CardContent>
      
      <CardActions sx={{ pt: 0, px: 1, pb: 1 }}>
        <Tooltip title="Edit Pet Details">
          <IconButton size="small" onClick={() => onAction('edit', item)}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        
        {isPending ? (
          <Tooltip title="Add Image">
            <IconButton 
              size="small" 
              color="secondary" 
              onClick={() => onAction('upload', item)}
            >
              <ImageIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => onAction('view', item)}>
              <ViewIcon />
            </IconButton>
          </Tooltip>
        )}
        
        <Tooltip title="View Pet History">
          <IconButton 
            size="small" 
            color="info"
            onClick={() => onAction('history', item)}
          >
            <HistoryIcon />
          </IconButton>
        </Tooltip>
        
        {!isPending && item.status !== 'available_for_sale' && (
          <Tooltip title="Release to Public">
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => onAction('release', [item._id])}
            >
              <PublishIcon />
            </IconButton>
          </Tooltip>
        )}
        
        <Tooltip title="More Actions">
          <IconButton 
            size="small" 
            color="error"
            onClick={() => onAction('delete', item._id)}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  )

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/manager/petshop/inventory')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Inventory Management
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Manage your pet inventory and prepare pets for public viewing
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PriceChangeIcon />}
            onClick={() => setBulkPriceOpen(true)}
          >
            Bulk Price Update
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            onClick={() => setCsvOpen(true)}
          >
            Import CSV
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e3f2fd', borderLeft: '4px solid #1976d2' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {inventory.length + readyForRelease.length + releasedPets.length + purchasedPets.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Pets
                  </Typography>
                </Box>
                <PetsIcon sx={{ fontSize: 40, color: '#1976d2' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fff3e0', borderLeft: '4px solid #f57c00' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {inventory.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Need Images
                  </Typography>
                </Box>
                <PendingIcon sx={{ fontSize: 40, color: '#f57c00' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e8f5e9', borderLeft: '4px solid #4caf50' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {readyForRelease.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Ready for Release
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, color: '#4caf50' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fce4ec', borderLeft: '4px solid #e91e63' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {selectedIds.length + selectedReadyIds.length + selectedReleasedIds.length + selectedPurchasedIds.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Selected
                  </Typography>
                </Box>
                <CheckIcon sx={{ fontSize: 40, color: '#e91e63' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, maxWidth: 400 }}>
              <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              <TextField
                fullWidth
                placeholder="Search by code, name, species, breed..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                size="small"
              />
            </Box>
            
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={openFilterMenu}
              sx={{ minWidth: 120 }}
            >
              Filters
            </Button>
            
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newValue) => newValue && setViewMode(newValue)}
              size="small"
            >
              <ToggleButton value="table">Table</ToggleButton>
              <ToggleButton value="grid">Grid</ToggleButton>
            </ToggleButtonGroup>
            
            <Button 
              variant="outlined" 
              color="info" 
              onClick={resetFilters}
              startIcon={<CloseIcon />}
            >
              Reset
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={filterOpen}
        onClose={closeFilterMenu}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: '300px',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="in_petshop">In PetShop</MenuItem>
                  <MenuItem value="available_for_sale">Available for Sale</MenuItem>
                  <MenuItem value="reserved">Reserved</MenuItem>
                  <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                  <MenuItem value="sold">Sold</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Species</InputLabel>
                <Select label="Species" value={speciesFilter} onChange={(e) => setSpeciesFilter(e.target.value)}>
                  <MenuItem value="">All Species</MenuItem>
                  {speciesOptions.map(s => (
                    <MenuItem key={s._id} value={s._id}>{s.displayName || s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth size="small" disabled={!speciesFilter}>
                <InputLabel>Breed</InputLabel>
                <Select label="Breed" value={breedFilter} onChange={(e) => setBreedFilter(e.target.value)}>
                  <MenuItem value="">All Breeds</MenuItem>
                  {breedOptions.map(b => (
                    <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                size="small" 
                type="number" 
                label="Min Price" 
                value={priceMin} 
                onChange={(e) => setPriceMin(e.target.value)} 
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                size="small" 
                type="number" 
                label="Max Price" 
                value={priceMax} 
                onChange={(e) => setPriceMax(e.target.value)} 
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                size="small" 
                type="number" 
                label="Min Age" 
                value={ageMin} 
                onChange={(e) => setAgeMin(e.target.value)} 
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                size="small" 
                type="number" 
                label="Max Age" 
                value={ageMax} 
                onChange={(e) => setAgeMax(e.target.value)} 
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Gender</InputLabel>
                <Select label="Gender" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Unknown">Unknown</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
            <Button onClick={closeFilterMenu}>Cancel</Button>
            <Button variant="contained" onClick={closeFilterMenu}>Apply</Button>
          </Box>
        </Box>
      </Menu>

      {/* Tabs for different sections */}
      <Card sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PendingIcon style={{ fontSize: 18 }} />
                <span>Pending Images</span>
                <Badge badgeContent={inventory.length} color="warning" showZero>
                </Badge>
              </Box>
            } 
            sx={{ 
              minHeight: 48,
              color: activeTab === 0 ? 'primary.main' : 'text.secondary',
              fontWeight: activeTab === 0 ? 'bold' : 'normal'
            }}
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon style={{ fontSize: 18 }} />
                <span>Ready for Release</span>
                <Badge badgeContent={readyForRelease.length} color="success" showZero>
                </Badge>
              </Box>
            } 
            sx={{ 
              minHeight: 48,
              color: activeTab === 1 ? 'primary.main' : 'text.secondary',
              fontWeight: activeTab === 1 ? 'bold' : 'normal'
            }}
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PublishIcon style={{ fontSize: 18 }} />
                <span>Released Pets</span>
                <Badge badgeContent={releasedPets.length} color="info" showZero>
                </Badge>
              </Box>
            } 
            sx={{ 
              minHeight: 48,
              color: activeTab === 2 ? 'primary.main' : 'text.secondary',
              fontWeight: activeTab === 2 ? 'bold' : 'normal'
            }}
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingCartIcon style={{ fontSize: 18 }} />
                <span>Purchased Pets</span>
                <Badge badgeContent={purchasedPets.length} color="secondary" showZero>
                </Badge>
              </Box>
            } 
            sx={{ 
              minHeight: 48,
              color: activeTab === 3 ? 'primary.main' : 'text.secondary',
              fontWeight: activeTab === 3 ? 'bold' : 'normal'
            }}
          />
        </Tabs>
      </Card>

      {/* Main Content Area */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {activeTab === 0 && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Pets Pending Images
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        These pets need images before they can be released to users
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        onClick={handleSelectAllPending}
                        startIcon={selectedIds.length === inventory.length && inventory.length > 0 ? <CloseIcon /> : <CheckIcon />}
                      >
                        {selectedIds.length === inventory.length && inventory.length > 0 ? 'Deselect All' : 'Select All'}
                      </Button>
                      <Button
                        variant="contained"
                        disabled={selectedIds.length === 0}
                        onClick={() => {
                          // Find the first selected item to open the image dialog
                          const firstSelected = inventory.find(item => selectedIds.includes(item._id));
                          if (firstSelected) {
                            handleOpenImageDialog(firstSelected);
                          }
                        }}
                        startIcon={<CloudUploadIcon />}
                      >
                        Upload Images ({selectedIds.length})
                      </Button>
                    </Box>
                  </Box>
                  
                  {inventory.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Box sx={{ 
                        width: 120, 
                        height: 120, 
                        borderRadius: '50%', 
                        bgcolor: '#e3f2fd', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        margin: '0 auto 24px'
                      }}>
                        <AddPhotoAlternateIcon sx={{ fontSize: 60, color: '#1976d2' }} />
                      </Box>
                      <Typography variant="h5" gutterBottom>
                        No pets pending images
                      </Typography>
                      <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                        All pets have images and are ready for release, or there are no pets in inventory.
                      </Typography>
                      <Button 
                        variant="outlined" 
                        onClick={() => setActiveTab(1)}
                        startIcon={<CheckCircleIcon />}
                      >
                        View Ready Pets
                      </Button>
                    </Box>
                  ) : (
                    <>
                      {viewMode === 'grid' ? (
                        <Grid container spacing={2}>
                          {inventory.map(item => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                              <PetCard 
                                item={item}
                                isSelected={selectedIds.includes(item._id)}
                                onSelect={(id) => {
                                  setSelectedIds(prev => 
                                    prev.includes(id) 
                                      ? prev.filter(i => i !== id) 
                                      : [...prev, id]
                                  )
                                }}
                                onAction={(action, data) => {
                                  switch(action) {
                                    case 'edit': handleEditPet(data); break;
                                    case 'upload': handleOpenImageDialog(data); break;
                                    case 'history': navigate(`/manager/petshop/pets/${data._id}/history`); break;
                                    case 'delete': handleDeletePet(data); break;
                                    default: break;
                                  }
                                }}
                                isPending={true}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <>
                          <TableContainer component={Paper}>
                            <Table>
                              <TableHead>
                                <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                                  <TableCell padding="checkbox">
                                    <Checkbox
                                      indeterminate={selectedIds.length > 0 && selectedIds.length < inventory.length}
                                      checked={inventory.length > 0 && selectedIds.length === inventory.length}
                                      onChange={handleSelectAllPending}
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
                                  <TableRow 
                                    key={item._id}
                                    selected={selectedIds.includes(item._id)}
                                    sx={{ 
                                      '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                      backgroundColor: selectedIds.includes(item._id) ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                                    }}
                                  >
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
                                      <Box>
                                        <Chip 
                                          label={item.status?.replace('_', ' ') || 'in stock'} 
                                          size="small" 
                                          color={item.status === 'available_for_sale' ? 'success' : 'default'}
                                        />
                                        {item.images && item.images.length > 0 && (
                                          <Chip 
                                            label={`${item.images.length} image${item.images.length > 1 ? 's' : ''}`}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                            sx={{ ml: 1 }}
                                          />
                                        )}
                                      </Box>
                                    </TableCell>
                                    <TableCell>
                                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <Tooltip title="Edit Pet Details">
                                          <IconButton size="small" onClick={() => handleEditPet(item)}>
                                            <EditIcon />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Add Image">
                                          <IconButton size="small" color="secondary" onClick={() => handleOpenImageDialog(item)}>
                                            <ImageIcon />
                                          </IconButton>
                                        </Tooltip>
                                        
                                        <Tooltip title="View Details">
                                          <IconButton size="small">
                                            <ViewIcon />
                                          </IconButton>
                                        </Tooltip>

                                        <Tooltip title="View Pet History">
                                          <IconButton 
                                            size="small" 
                                            color="info"
                                            onClick={() => navigate(`/manager/petshop/pets/${item._id}/history`)}
                                          >
                                            <HistoryIcon />
                                          </IconButton>
                                        </Tooltip>
                                        
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
                          
                          {pagination.pages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                              <Pagination 
                                count={pagination.pages} 
                                page={pagination.current} 
                                onChange={handlePageChange}
                                color="primary"
                              />
                            </Box>
                          )}
                        </>
                      )}
                    </>
                  )}
                </>
              )}
              
              {activeTab === 1 && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Ready for Release
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        These pets have images and are ready to be released to users
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        onClick={handleSelectAllReady}
                        startIcon={selectedReadyIds.length === readyForRelease.length && readyForRelease.length > 0 ? <CloseIcon /> : <CheckIcon />}
                      >
                        {selectedReadyIds.length === readyForRelease.length && readyForRelease.length > 0 ? 'Deselect All' : 'Select All'}
                      </Button>
                      <Button
                        variant="contained"
                        disabled={selectedReadyIds.length === 0}
                        onClick={() => handleReleaseToPublic(selectedReadyIds)}
                        startIcon={<PublishIcon />}
                      >
                        Release Selected ({selectedReadyIds.length})
                      </Button>
                    </Box>
                  </Box>
                  
                  {readyForRelease.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Box sx={{ 
                        width: 120, 
                        height: 120, 
                        borderRadius: '50%', 
                        bgcolor: '#e8f5e9', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        margin: '0 auto 24px'
                      }}>
                        <CheckCircleIcon sx={{ fontSize: 60, color: '#4caf50' }} />
                      </Box>
                      <Typography variant="h5" gutterBottom>
                        No pets ready for release
                      </Typography>
                      <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                        Upload images for pets in the "Pending Images" tab to make them available for release.
                      </Typography>
                      <Button 
                        variant="outlined" 
                        onClick={() => setActiveTab(0)}
                        startIcon={<PendingIcon />}
                      >
                        Add Pet Images
                      </Button>
                    </Box>
                  ) : (
                    <>
                      {viewMode === 'grid' ? (
                        <Grid container spacing={2}>
                          {readyForRelease.map(item => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                              <PetCard 
                                item={item}
                                isSelected={selectedReadyIds.includes(item._id)}
                                onSelect={(id) => {
                                  setSelectedReadyIds(prev => 
                                    prev.includes(id) 
                                      ? prev.filter(i => i !== id) 
                                      : [...prev, id]
                                  )
                                }}
                                onAction={(action, data) => {
                                  switch(action) {
                                    case 'edit': handleEditPet(data); break;
                                    case 'view': console.log('View details'); break;
                                    case 'history': navigate(`/manager/petshop/pets/${data._id}/history`); break;
                                    case 'release': handleReleaseToPublic(data); break;
                                    case 'delete': handleDeletePet(data); break;
                                    default: break;
                                  }
                                }}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <>
                          <TableContainer component={Paper}>
                            <Table>
                              <TableHead>
                                <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                                  <TableCell padding="checkbox">
                                    <Checkbox
                                      indeterminate={selectedReadyIds.length > 0 && selectedReadyIds.length < readyForRelease.length}
                                      checked={readyForRelease.length > 0 && selectedReadyIds.length === readyForRelease.length}
                                      onChange={handleSelectAllReady}
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
                                {readyForRelease.map(item => (
                                  <TableRow 
                                    key={item._id}
                                    selected={selectedReadyIds.includes(item._id)}
                                    sx={{ 
                                      '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                      backgroundColor: selectedReadyIds.includes(item._id) ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                                    }}
                                  >
                                    <TableCell padding="checkbox">
                                      <Checkbox
                                        checked={selectedReadyIds.includes(item._id)}
                                        onChange={(e) => {
                                          setSelectedReadyIds(prev => 
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
                                      <Box>
                                        <Chip 
                                          label={item.status?.replace('_', ' ') || 'in stock'} 
                                          size="small" 
                                          color={item.status === 'available_for_sale' ? 'success' : 'default'}
                                        />
                                        {item.images && item.images.length > 0 && (
                                          <Chip 
                                            label={`${item.images.length} image${item.images.length > 1 ? 's' : ''}`}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                            sx={{ ml: 1 }}
                                          />
                                        )}
                                      </Box>
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

                                        <Tooltip title="View Pet History">
                                          <IconButton 
                                            size="small" 
                                            color="info"
                                            onClick={() => navigate(`/manager/petshop/pets/${item._id}/history`)}
                                          >
                                            <HistoryIcon />
                                          </IconButton>
                                        </Tooltip>
                                        
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
                          
                          {pagination.pages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                              <Pagination 
                                count={pagination.pages} 
                                page={pagination.current} 
                                onChange={handlePageChange}
                                color="primary"
                              />
                            </Box>
                          )}
                        </>
                      )}
                    </>
                  )}
                </>
              )}
              
              {activeTab === 2 && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Released Pets
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        These pets are currently available for public viewing and purchase
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        onClick={handleSelectAllReleased}
                        startIcon={selectedReleasedIds.length === releasedPets.length && releasedPets.length > 0 ? <CloseIcon /> : <CheckIcon />}
                      >
                        {selectedReleasedIds.length === releasedPets.length && releasedPets.length > 0 ? 'Deselect All' : 'Select All'}
                      </Button>
                    </Box>
                  </Box>
                  
                  {releasedPets.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Box sx={{ 
                        width: 120, 
                        height: 120, 
                        borderRadius: '50%', 
                        bgcolor: '#e1f5fe', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        margin: '0 auto 24px'
                      }}>
                        <PublishIcon sx={{ fontSize: 60, color: '#0288d1' }} />
                      </Box>
                      <Typography variant="h5" gutterBottom>
                        No pets released yet
                      </Typography>
                      <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                        Release pets from the "Ready for Release" section to make them available to the public.
                      </Typography>
                      <Button 
                        variant="outlined" 
                        onClick={() => setActiveTab(1)}
                        startIcon={<CheckCircleIcon />}
                      >
                        Prepare Pets for Release
                      </Button>
                    </Box>
                  ) : (
                    <>
                      {viewMode === 'grid' ? (
                        <Grid container spacing={2}>
                          {releasedPets.map(item => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                              <PetCard 
                                item={item}
                                isSelected={selectedReleasedIds.includes(item._id)}
                                onSelect={(id) => {
                                  setSelectedReleasedIds(prev => 
                                    prev.includes(id) 
                                      ? prev.filter(i => i !== id) 
                                      : [...prev, id]
                                  )
                                }}
                                onAction={(action, data) => {
                                  switch(action) {
                                    case 'edit': handleEditPet(data); break;
                                    case 'view': console.log('View details'); break;
                                    case 'history': navigate(`/manager/petshop/pets/${data._id}/history`); break;
                                    case 'delete': handleDeletePet(data); break;
                                    default: break;
                                  }
                                }}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <>
                          <TableContainer component={Paper}>
                            <Table>
                              <TableHead>
                                <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                                  <TableCell padding="checkbox">
                                    <Checkbox
                                      indeterminate={selectedReleasedIds.length > 0 && selectedReleasedIds.length < releasedPets.length}
                                      checked={releasedPets.length > 0 && selectedReleasedIds.length === releasedPets.length}
                                      onChange={handleSelectAllReleased}
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
                                {releasedPets.map(item => (
                                  <TableRow 
                                    key={item._id}
                                    selected={selectedReleasedIds.includes(item._id)}
                                    sx={{ 
                                      '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                      backgroundColor: selectedReleasedIds.includes(item._id) ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                                    }}
                                  >
                                    <TableCell padding="checkbox">
                                      <Checkbox
                                        checked={selectedReleasedIds.includes(item._id)}
                                        onChange={(e) => {
                                          setSelectedReleasedIds(prev => 
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
                                      <Box>
                                        <Chip 
                                          label={item.status?.replace('_', ' ') || 'in stock'} 
                                          size="small" 
                                          color={item.status === 'available_for_sale' ? 'success' : 'default'}
                                        />
                                        {item.images && item.images.length > 0 && (
                                          <Chip 
                                            label={`${item.images.length} image${item.images.length > 1 ? 's' : ''}`}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                            sx={{ ml: 1 }}
                                          />
                                        )}
                                      </Box>
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

                                        <Tooltip title="View Pet History">
                                          <IconButton 
                                            size="small" 
                                            color="info"
                                            onClick={() => navigate(`/manager/petshop/pets/${item._id}/history`)}
                                          >
                                            <HistoryIcon />
                                          </IconButton>
                                        </Tooltip>
                                        
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
                          
                          {pagination.pages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                              <Pagination 
                                count={pagination.pages} 
                                page={pagination.current} 
                                onChange={handlePageChange}
                                color="primary"
                              />
                            </Box>
                          )}
                        </>
                      )}
                    </>
                  )}
                </>
              )}
              
              {activeTab === 3 && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Purchased Pets
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        These pets have been purchased by customers
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        onClick={handleSelectAllPurchased}
                        startIcon={selectedPurchasedIds.length === purchasedPets.length && purchasedPets.length > 0 ? <CloseIcon /> : <CheckIcon />}
                      >
                        {selectedPurchasedIds.length === purchasedPets.length && purchasedPets.length > 0 ? 'Deselect All' : 'Select All'}
                      </Button>
                    </Box>
                  </Box>
                  
                  {purchasedPets.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Box sx={{ 
                        width: 120, 
                        height: 120, 
                        borderRadius: '50%', 
                        bgcolor: '#f3e5f5', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        margin: '0 auto 24px'
                      }}>
                        <ShoppingCartIcon sx={{ fontSize: 60, color: '#7b1fa2' }} />
                      </Box>
                      <Typography variant="h5" gutterBottom>
                        No pets purchased yet
                      </Typography>
                      <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                        Pets will appear here after customers complete their purchases.
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      {viewMode === 'grid' ? (
                        <Grid container spacing={2}>
                          {purchasedPets.map(item => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                              <PetCard 
                                item={item}
                                isSelected={selectedPurchasedIds.includes(item._id)}
                                onSelect={(id) => {
                                  setSelectedPurchasedIds(prev => 
                                    prev.includes(id) 
                                      ? prev.filter(i => i !== id) 
                                      : [...prev, id]
                                  )
                                }}
                                onAction={(action, data) => {
                                  switch(action) {
                                    case 'edit': handleEditPet(data); break;
                                    case 'view': console.log('View details'); break;
                                    case 'history': navigate(`/manager/petshop/pets/${data._id}/history`); break;
                                    case 'delete': handleDeletePet(data); break;
                                    default: break;
                                  }
                                }}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <>
                          <TableContainer component={Paper}>
                            <Table>
                              <TableHead>
                                <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                                  <TableCell padding="checkbox">
                                    <Checkbox
                                      indeterminate={selectedPurchasedIds.length > 0 && selectedPurchasedIds.length < purchasedPets.length}
                                      checked={purchasedPets.length > 0 && selectedPurchasedIds.length === purchasedPets.length}
                                      onChange={handleSelectAllPurchased}
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
                                {purchasedPets.map(item => (
                                  <TableRow 
                                    key={item._id}
                                    selected={selectedPurchasedIds.includes(item._id)}
                                    sx={{ 
                                      '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                                      backgroundColor: selectedPurchasedIds.includes(item._id) ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                                    }}
                                  >
                                    <TableCell padding="checkbox">
                                      <Checkbox
                                        checked={selectedPurchasedIds.includes(item._id)}
                                        onChange={(e) => {
                                          setSelectedPurchasedIds(prev => 
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
                                      <Box>
                                        <Chip 
                                          label={item.status?.replace('_', ' ') || 'in stock'} 
                                          size="small" 
                                          color={item.status === 'sold' ? 'secondary' : 'default'}
                                        />
                                        {item.images && item.images.length > 0 && (
                                          <Chip 
                                            label={`${item.images.length} image${item.images.length > 1 ? 's' : ''}`}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                            sx={{ ml: 1 }}
                                          />
                                        )}
                                      </Box>
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

                                        <Tooltip title="View Pet History">
                                          <IconButton 
                                            size="small" 
                                            color="info"
                                            onClick={() => navigate(`/manager/petshop/pets/${item._id}/history`)}
                                          >
                                            <HistoryIcon />
                                          </IconButton>
                                        </Tooltip>
                                        
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
                          
                          {pagination.pages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                              <Pagination 
                                count={pagination.pages} 
                                page={pagination.current} 
                                onChange={handlePageChange}
                                color="primary"
                              />
                            </Box>
                          )}
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Floating Action Button for Quick Actions */}
      <Fab 
        color="primary" 
        aria-label="add" 
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          right: 16,
          boxShadow: 6
        }}
        onClick={() => navigate('/manager/petshop/add-stock')}
      >
        <AddPhotoAlternateIcon />
      </Fab>

      {/* Edit Pet Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon />
            Edit Pet Details
          </Box>
        </DialogTitle>
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

      {/* Image Upload Dialog */}
      <Dialog open={imageDialog.open} onClose={() => setImageDialog({ open: false, item: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ImageIcon />
            Upload Image
          </Box>
        </DialogTitle>
        <DialogContent>
          {imageDialog.item && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Pet Information
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box sx={{ width: 60, height: 60, borderRadius: '50%', bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PetsIcon style={{ color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    {imageDialog.item.name || 'Unnamed Pet'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Code: {imageDialog.item.petCode || `PET-${imageDialog.item._id?.slice(-6)}`}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {imageDialog.item.speciesId?.displayName || imageDialog.item.speciesId?.name || 'Unknown Species'} • {imageDialog.item.breedId?.name || 'Unknown Breed'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Select an image file to upload
            </Typography>
            <Button 
              variant="outlined" 
              component="label" 
              fullWidth
              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudUploadIcon />
                {imageFile ? (
                  <Typography variant="body2">{imageFile.name}</Typography>
                ) : (
                  <Typography variant="body2">Choose image file (JPG, PNG, WEBP, GIF)</Typography>
                )}
              </Box>
              <input 
                hidden 
                type="file" 
                accept="image/*" 
                onChange={(e) => setImageFile(e.target.files?.[0] || null)} 
              />
            </Button>
            
            {imageFile && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Image Preview
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <img 
                    src={URL.createObjectURL(imageFile)} 
                    alt="Preview" 
                    style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4 }}
                    onError={(e) => {
                      e.target.src = '/placeholder-pet.svg'; // Fallback image
                    }}
                  />
                </Box>
              </Box>
            )}
            
            <TextField
              fullWidth
              label="Caption (optional)"
              value={imageDialog.item?.name ? `Image for ${imageDialog.item.name}` : ''}
              disabled
              sx={{ mt: 2 }}
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Checkbox 
                checked 
                disabled 
                size="small"
              />
              <Typography variant="caption">
                Set as primary image
              </Typography>
            </Box>
          </Box>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Tip:</strong> Upload high-quality images (minimum 800x600px) for best results. 
              Pets with images can be released to the public for viewing and booking.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageDialog({ open: false, item: null })}>Cancel</Button>
          <Button 
            onClick={handleUploadImage} 
            variant="contained" 
            disabled={!imageFile}
            startIcon={<CloudUploadIcon />}
          >
            Upload Image
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Price Update Dialog */}
      <Dialog open={bulkPriceOpen} onClose={() => setBulkPriceOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PriceChangeIcon />
            Bulk Price Update
          </Box>
        </DialogTitle>
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
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileUploadIcon />
            Import Inventory from CSV
          </Box>
        </DialogTitle>
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