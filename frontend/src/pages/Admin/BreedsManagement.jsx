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
  Pets as BreedIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { breedsAPI as adminBreedsAPI, speciesAPI as adminSpeciesAPI } from '../../services/petSystemAPI'

const BreedsManagement = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const speciesFilter = searchParams.get('species')
  
  const [loading, setLoading] = useState(true)
  const [breeds, setBreeds] = useState([])
  const [species, setSpecies] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [speciesFilterState, setSpeciesFilterState] = useState(speciesFilter || '')
  const [showInactive, setShowInactive] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalBreeds, setTotalBreeds] = useState(0)
  
  // Menu and dialog state
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedBreed, setSelectedBreed] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [breedToDelete, setBreedToDelete] = useState(null)
  const [editDialog, setEditDialog] = useState(false)
  const [editBreed, setEditBreed] = useState(null)
  const [addDialog, setAddDialog] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  
  // Form data for editing and adding
  const [formData, setFormData] = useState({
    name: '',
    speciesId: '',
    description: '',
    isActive: true
  })
  const [speciesCategory, setSpeciesCategory] = useState('')

  useEffect(() => {
    loadSpecies()
  }, [])

  useEffect(() => {
    loadBreeds()
  }, [page, searchTerm, statusFilter, speciesFilterState, showInactive])

  const loadSpecies = async () => {
    try {
      const response = await adminSpeciesAPI.getActive()
      const data = response.data?.data || []
      const list = Array.isArray(data) ? data : (data.species || [])
      setSpecies(list)
    } catch (err) {
      console.error('Error loading species:', err)
    }
  }

  const loadBreeds = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        search: searchTerm,
        speciesId: speciesFilterState,
        isActive: showInactive ? undefined : true
      }

      const response = await adminBreedsAPI.list(params)
      const data = response.data?.data || []
      const pagination = response.data?.pagination || {}

      setBreeds(Array.isArray(data) ? data : (data.breeds || []))
      setTotalPages(pagination.pages || 1)
      setTotalBreeds(pagination.total || 0)
    } catch (err) {
      setError('Failed to load breeds')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value) => {
    setSearchTerm(value)
    setPage(1)
  }

  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case 'species':
        setSpeciesFilterState(value)
        break
      case 'status':
        setStatusFilter(value)
        break
      default:
        break
    }
    setPage(1)
  }

  const handleMenuOpen = (event, breed) => {
    setAnchorEl(event.currentTarget)
    setSelectedBreed(breed)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedBreed(null)
  }

  const handleAddBreed = () => {
    setFormData({
      name: '',
      speciesId: speciesFilterState || '',
      description: '',
      isActive: true
    })
    const spec = species.find(s => s._id === (speciesFilterState || ''))
    setSpeciesCategory(spec ? (spec.category || '') : '')
    setFormErrors({})
    setAddDialog(true)
  }

  const handleEditBreed = (breed) => {
    setEditBreed(breed)
    setFormData({
      name: breed.name || '',
      speciesId: breed.species?._id || breed.speciesId || '',
      description: breed.description || '',
      isActive: breed.isActive !== false
    })
    const spec = species.find(s => s._id === (breed.species?._id || breed.speciesId))
    setSpeciesCategory(spec ? (spec.category || '') : (breed.species?.category || ''))
    setFormErrors({})
    setEditDialog(true)
  }

  const handleSaveBreed = async () => {
    // validate
    const errors = {}
    if (!formData.name?.trim()) errors.name = 'Breed name is required'
    if (!formData.speciesId) errors.speciesId = 'Species is required'
    
    // Check for duplicate breed names (case-insensitive)
    if (!editBreed) {
      // When creating, check against all existing breeds
      const isDuplicate = breeds.some(breed => 
        breed.name.toLowerCase() === formData.name.trim().toLowerCase() && 
        breed.species?._id === formData.speciesId
      );
      
      if (isDuplicate) {
        errors.name = 'A breed with this name already exists for the selected species';
      }
    } else {
      // When editing, check against all other breeds (exclude the current one)
      const isDuplicate = breeds.some(breed => 
        breed._id !== editBreed._id &&
        breed.name.toLowerCase() === formData.name.trim().toLowerCase() && 
        breed.species?._id === formData.speciesId
      );
      
      if (isDuplicate) {
        errors.name = 'A breed with this name already exists for the selected species';
      }
    }
    
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      if (editBreed) {
        await adminBreedsAPI.update(editBreed._id, {
          name: formData.name,
          speciesId: formData.speciesId,
          description: formData.description,
          isActive: formData.isActive
        })
        setSuccess('Breed updated successfully!')
        setEditDialog(false)
      } else {
        await adminBreedsAPI.create({
          name: formData.name,
          speciesId: formData.speciesId,
          description: formData.description,
          isActive: formData.isActive
        })
        setSuccess('Breed created successfully!')
        setAddDialog(false)
      }
      loadBreeds()
    } catch (err) {
      setError('Failed to save breed')
    }
  }

  const handleDeleteBreed = async () => {
    if (!breedToDelete) return
    
    try {
      await adminBreedsAPI.delete(breedToDelete._id)
      setSuccess('Breed deactivated successfully!')
      setDeleteDialog(false)
      setBreedToDelete(null)
      loadBreeds()
    } catch (err) {
      setError('Failed to deactivate breed')
    }
  }

  const handleToggleStatus = async (breed) => {
    try {
      await adminBreedsAPI.update(breed._id, { isActive: !breed.isActive })
      setSuccess(`Breed ${breed.isActive ? 'deactivated' : 'activated'} successfully!`)
      loadBreeds()
    } catch (err) {
      setError(`Failed to ${breed.isActive ? 'deactivate' : 'activate'} breed`)
    }
  }

  const handleRestoreBreed = async (breed) => {
    try {
      await adminBreedsAPI.restore(breed._id)
      setSuccess('Breed restored successfully!')
      loadBreeds()
    } catch (err) {
      setError('Failed to restore breed')
    }
  }

  // size removed

  const getSpeciesName = (speciesId) => {
    const spec = species.find(s => s._id === speciesId)
    return spec ? (spec.displayName || spec.name) : 'Unknown'
  }

  if (loading && breeds.length === 0) {
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
            Breeds Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage animal breeds in the system ({totalBreeds} total)
            {speciesFilterState && (
              <Chip 
                label={`Filtered by: ${getSpeciesName(speciesFilterState)}`} 
                size="small" 
                sx={{ ml: 2 }} 
                onDelete={() => setSpeciesFilterState('')}
              />
            )}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddBreed}
        >
          Add Breed
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search breeds..."
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
                <InputLabel>Species</InputLabel>
                <Select
                  value={speciesFilterState}
                  onChange={(e) => handleFilterChange('species', e.target.value)}
                >
                  <MenuItem value="">All Species</MenuItem>
                  {species.map((s) => (
                    <MenuItem key={s._id} value={s._id}>
                      {s.displayName || s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Size filter removed as per requirements */}
            <Grid item xs={12} md={2}>
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

      {/* Breeds Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Breed</TableCell>
                  <TableCell>Species</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {breeds.map((breed) => (
                  <TableRow key={breed._id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <BreedIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {breed.name}
                          </Typography>
                          {breed.description && (
                            <Typography variant="caption" color="text.secondary">
                              {breed.description.length > 50 
                                ? `${breed.description.substring(0, 50)}...` 
                                : breed.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={(breed.species?.displayName || breed.species?.name || 'N/A').toString()} 
                        size="small" 
                        color="primary" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={(breed.species?.category || '').toString() || 'Unknown'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={breed.isActive ? 'Active' : 'Inactive'}
                        color={breed.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(breed.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Edit Breed">
                          <IconButton
                            size="small"
                            onClick={() => handleEditBreed(breed)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={breed.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(breed)}
                            color={breed.isActive ? 'warning' : 'success'}
                          >
                            {breed.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More Actions">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, breed)}
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

          {breeds.length === 0 && !loading && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No breeds found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try adjusting your filters or add a new breed
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

      {/* Add Breed Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Breed</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Breed Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!formErrors.speciesId}>
                <InputLabel>Species *</InputLabel>
                <Select
                  value={formData.speciesId}
                  onChange={(e) => {
                    const value = e.target.value
                    setFormData({ ...formData, speciesId: value })
                    const spec = species.find(s => s._id === value)
                    setSpeciesCategory(spec ? (spec.category || '') : '')
                  }}
                >
                  {species.map((s) => (
                    <MenuItem key={s._id} value={s._id}>
                      {s.displayName || s.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.speciesId && (
                  <Typography variant="caption" color="error">{formErrors.speciesId}</Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                value={speciesCategory}
                disabled
              />
            </Grid>
            {/* Size, Origin, Temperament fields removed as per requirements */}
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
          <Button onClick={handleSaveBreed} variant="contained">
            Add Breed
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Breed Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Breed</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Breed Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Species *</InputLabel>
                <Select
                  value={formData.speciesId}
                  onChange={(e) => setFormData({ ...formData, speciesId: e.target.value })}
                >
                  {species.map((s) => (
                    <MenuItem key={s._id} value={s._id}>
                      {s.displayName || s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Size, Origin, Temperament fields removed as per requirements */}
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
          <Button onClick={handleSaveBreed} variant="contained">
            Update Breed
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleEditBreed(selectedBreed); handleMenuClose(); }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Breed</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleToggleStatus(selectedBreed); handleMenuClose(); }}>
          <ListItemIcon>
            {selectedBreed?.isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {selectedBreed?.isActive ? 'Deactivate' : 'Activate'}
          </ListItemText>
        </MenuItem>
        {selectedBreed?.isActive ? (
          <MenuItem onClick={() => { setBreedToDelete(selectedBreed); setDeleteDialog(true); handleMenuClose(); }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Deactivate Breed</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => { handleRestoreBreed(selectedBreed); handleMenuClose(); }}>
            <ListItemIcon>
              <CheckCircleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Restore Breed</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Deactivate Breed</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to deactivate "{breedToDelete?.name}"? 
            This breed will no longer be available for new entries, but existing data will remain intact.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteBreed} color="error" variant="contained">
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

export default BreedsManagement