import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
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
  TextField,
  Alert,
  Snackbar,
  CircularProgress,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  ListItemIcon,
  ListItemText,
  Avatar,
  Tooltip,
  InputAdornment,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Pets as SpeciesIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { speciesAPI as adminSpeciesAPI, breedsAPI as adminBreedsAPI, petCategoriesAPI } from '../../services/petSystemAPI'

const SpeciesManagement = () => {
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [species, setSpecies] = useState([])
  const [breeds, setBreeds] = useState([])
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalSpecies, setTotalSpecies] = useState(0)
  
  // Menu and dialog state
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedSpecies, setSelectedSpecies] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [speciesToDelete, setSpeciesToDelete] = useState(null)
  const [editDialog, setEditDialog] = useState(false)
  const [editSpecies, setEditSpecies] = useState(null)
  const [addDialog, setAddDialog] = useState(false)
  
  // Form data for editing and adding
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    category: '',
    isActive: true
  })

  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadSpecies()
    loadBreeds()
  }, [page, searchTerm, categoryFilter, showInactive])

  const loadCategories = async () => {
    try {
      const res = await petCategoriesAPI.getActive()
      const data = res.data?.data || []
      setCategories(Array.isArray(data) ? data : (data.categories || []))
    } catch (err) {
      console.error('Failed to load categories', err)
    }
  }

  const loadSpecies = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        search: searchTerm,
        isActive: showInactive ? undefined : true,
        category: categoryFilter || undefined
      }

      const response = await adminSpeciesAPI.list(params)
      const data = response.data?.data || []
      const pagination = response.data?.pagination || {}

      setSpecies(Array.isArray(data) ? data : (data.species || []))
      setTotalPages(pagination.pages || 1)
      setTotalSpecies(pagination.total || 0)
    } catch (err) {
      setError('Failed to load species')
    } finally {
      setLoading(false)
    }
  }

  const loadBreeds = async () => {
    try {
      const response = await adminBreedsAPI.list({ limit: 1000 })
      const data = response.data?.data || []
      setBreeds(Array.isArray(data) ? data : (data.breeds || []))
    } catch (err) {
      console.error('Error loading breeds:', err)
    }
  }

  const handleSearch = (value) => {
    setSearchTerm(value)
    setPage(1)
  }

  const handleMenuOpen = (event, species) => {
    setAnchorEl(event.currentTarget)
    setSelectedSpecies(species)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedSpecies(null)
  }

  const handleAddSpecies = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      category: categories[0]?.name || '',
      isActive: true
    })
    setFormErrors({})
    setAddDialog(true)
  }

  const handleEditSpecies = (species) => {
    setEditSpecies(species)
    setFormData({
      name: species.name || '',
      displayName: species.displayName || '',
      description: species.description || '',
      category: species.category || categories[0]?.name || '',
      isActive: species.isActive !== false
    })
    setFormErrors({})
    setEditDialog(true)
  }

  const toSlug = (text) => String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  const generateUniqueKey = (baseKey, currentId) => {
    const existing = new Set(
      (species || [])
        .filter((s) => !currentId || s._id !== currentId)
        .map((s) => String(s.name).toLowerCase())
    )
    let k = baseKey
    let i = 2
    while (existing.has(k)) {
      k = `${baseKey}-${i}`
      i += 1
    }
    return k
  }

  const handleSaveSpecies = async () => {
    const errors = {}
    if (!formData.displayName?.trim()) errors.displayName = 'Display name is required'
    if (!formData.category) errors.category = 'Category is required'

    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      if (editSpecies) {
        // Keep existing key on edit
        const payload = { ...formData, name: editSpecies.name }
        await adminSpeciesAPI.update(editSpecies._id, payload)
        setSuccess('Species updated successfully!')
        setEditDialog(false)
      } else {
        // Auto-generate unique key from display name on create
        let base = toSlug(formData.displayName)
        base = generateUniqueKey(base)
        const payload = { ...formData, name: base }
        await adminSpeciesAPI.create(payload)
        setSuccess('Species created successfully!')
        setAddDialog(false)
      }
      loadSpecies()
    } catch (err) {
      setError('Failed to save species')
    }
  }

  const handleDeleteSpecies = async () => {
    if (!speciesToDelete) return
    
    try {
      await adminSpeciesAPI.delete(speciesToDelete._id)
      setSuccess('Species deactivated successfully!')
      setDeleteDialog(false)
      setSpeciesToDelete(null)
      loadSpecies()
    } catch (err) {
      setError('Failed to deactivate species')
    }
  }

  const handleRestoreSpecies = async (species) => {
    try {
      await adminSpeciesAPI.restore(species._id)
      setSuccess('Species restored successfully!')
      loadSpecies()
    } catch (err) {
      setError('Failed to restore species')
    }
  }

  const handleToggleStatus = async (species) => {
    try {
      await adminSpeciesAPI.update(species._id, { isActive: !species.isActive })
      setSuccess(`Species ${species.isActive ? 'deactivated' : 'activated'} successfully!`)
      loadSpecies()
    } catch (err) {
      setError(`Failed to ${species.isActive ? 'deactivate' : 'activate'} species`)
    }
  }

  const getCategoryColor = (category) => {
    const colors = {
      'mammal': 'primary',
      'bird': 'success',
      'reptile': 'warning',
      'amphibian': 'info',
      'fish': 'secondary',
      'other': 'default'
    }
    return colors[category] || 'default'
  }

  const getBreedCount = (speciesId) => {
    return breeds.filter(breed => breed.speciesId?._id === speciesId || breed.species?._id === speciesId).length
  }

  if (loading && species.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Species Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage animal species in the system ({totalSpecies} total)
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddSpecies}
        >
          Add Species
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search species..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c._id} value={c.name}>{c.displayName || c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                  />
                }
                label="Show Inactive"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Species Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Species</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Breeds</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {species.map((spec) => (
                  <TableRow key={spec._id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <SpeciesIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {spec.displayName || spec.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {spec.name}
                          </Typography>
                          {spec.description && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {spec.description.length > 50 
                                ? `${spec.description.substring(0, 50)}...` 
                                : spec.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={spec.category ? (spec.category.charAt(0).toUpperCase() + spec.category.slice(1)) : 'Unknown'}
                        color={getCategoryColor(spec.category)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <AssignmentIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {getBreedCount(spec._id)} breeds
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={spec.isActive ? 'Active' : 'Inactive'}
                        color={spec.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(spec.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Breeds">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/admin/breeds?species=${spec._id}`)}
                            color="primary"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Species">
                          <IconButton
                            size="small"
                            onClick={() => handleEditSpecies(spec)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={spec.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(spec)}
                            color={spec.isActive ? 'warning' : 'success'}
                          >
                            {spec.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More Actions">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, spec)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {species.length === 0 && !loading && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No species found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try adjusting your filters or add a new species
              </Typography>
            </Box>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add Species Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Species</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Display Name *"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                required
                error={!!formErrors.displayName}
                helperText={formErrors.displayName}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Key (auto-generated)"
                value={toSlug(formData.displayName) || ''}
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.category}>
                <InputLabel>Category *</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map((c) => (
                    <MenuItem key={c._id} value={c.name}>{c.displayName || c.name}</MenuItem>
                  ))}
                </Select>
                {formErrors.category && (
                  <Typography variant="caption" color="error">{formErrors.category}</Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveSpecies} variant="contained">
            Add Species
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Species Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Species</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Display Name *"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Key"
                value={editSpecies?.name || ''}
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category *</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map((c) => (
                    <MenuItem key={c._id} value={c.name}>{c.displayName || c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveSpecies} variant="contained">
            Update Species
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { navigate(`/admin/breeds?species=${selectedSpecies?._id}`); handleMenuClose(); }}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Breeds</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleEditSpecies(selectedSpecies); handleMenuClose(); }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Species</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleToggleStatus(selectedSpecies); handleMenuClose(); }}>
          <ListItemIcon>
            {selectedSpecies?.isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {selectedSpecies?.isActive ? 'Deactivate' : 'Activate'}
          </ListItemText>
        </MenuItem>
        {selectedSpecies?.isActive ? (
          <MenuItem onClick={() => { setSpeciesToDelete(selectedSpecies); setDeleteDialog(true); handleMenuClose(); }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Deactivate Species</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => { handleRestoreSpecies(selectedSpecies); handleMenuClose(); }}>
            <ListItemIcon>
              <CheckCircleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Restore Species</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Deactivate Species</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to deactivate "{speciesToDelete?.displayName || speciesToDelete?.name}"? 
            This species will no longer be available for new entries, but existing data will remain intact.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteSpecies} color="error" variant="contained">
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error/Success Messages */}
      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      )}

      {success && (
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>
      )}
    </Container>
  )
}

export default SpeciesManagement