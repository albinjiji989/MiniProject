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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
} from '@mui/material'
import {
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FileDownload as DownloadIcon,
  FileUpload as UploadIcon,
  LocalHospital as MedicalIcon,
  History as HistoryIcon,
  Pets as PetIcon,
  Person as OwnerIcon,
  LocationOn as LocationIcon,
  CalendarToday as DateIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { petsAPI as adminPetsAPI, speciesAPI as adminSpeciesAPI, breedsAPI as adminBreedsAPI, petCategoriesAPI } from '../../../services/petSystemAPI'
import { usersAPI } from '../../../services/api'

const PetManagement = () => {
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [pets, setPets] = useState([])
  const [categories, setCategories] = useState([])
  const [species, setSpecies] = useState([])
  const [breeds, setBreeds] = useState([])
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [speciesFilter, setSpeciesFilter] = useState('')
  const [breedFilter, setBreedFilter] = useState('')
  const [healthFilter, setHealthFilter] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPets, setTotalPets] = useState(0)
  
  // Menu and dialog state
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedPet, setSelectedPet] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [petToDelete, setPetToDelete] = useState(null)
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadPets()
  }, [page, searchTerm, statusFilter, speciesFilter, breedFilter, healthFilter, showInactive])

  // when category changes, reload species for that category and reset species/breed
  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        const res = await adminSpeciesAPI.list({ limit: 1000, category: categoryFilter || undefined })
        setSpecies(res.data?.data || [])
        setSpeciesFilter('')
        setBreedFilter('')
        setBreeds([])
      } catch (err) {
        console.error('Error loading species by category:', err)
      }
    }
    fetchSpecies()
  }, [categoryFilter])

  // when species changes, load breeds for that species and reset breed
  useEffect(() => {
    const fetchBreeds = async () => {
      if (!speciesFilter) {
        setBreeds([])
        setBreedFilter('')
        return
      }
      try {
        const res = await adminBreedsAPI.getBySpecies(speciesFilter)
        const data = res.data?.data || []
        setBreeds(Array.isArray(data) ? data : (data.breeds || []))
        setBreedFilter('')
      } catch (err) {
        console.error('Error loading breeds by species:', err)
      }
    }
    fetchBreeds()
  }, [speciesFilter])

  const loadInitialData = async () => {
    try {
      const [catsRes, speciesRes, usersRes] = await Promise.all([
        petCategoriesAPI.getActive(),
        adminSpeciesAPI.list({ limit: 1000 }),
        usersAPI.getUsers({ limit: 1000 })
      ])

      setCategories(catsRes.data?.data || [])
      setSpecies(speciesRes.data?.data || [])
      setBreeds([])
      setUsers(usersRes.data?.data || [])
    } catch (err) {
      console.error('Error loading initial data:', err)
    }
  }

  const loadPets = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
        species: speciesFilter,
        breed: breedFilter,
        healthStatus: healthFilter,
        isActive: showInactive ? undefined : true
      }

      const response = await adminPetsAPI.list(params)
      const data = response.data?.data || []
      const pagination = response.data?.pagination || {}

      setPets(Array.isArray(data) ? data : (data.pets || []))
      setTotalPages(pagination.pages || 1)
      setTotalPets(pagination.total || 0)
    } catch (err) {
      setError('Failed to load pets')
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
      case 'status':
        setStatusFilter(value)
        break
      case 'species':
        setSpeciesFilter(value)
        setBreedFilter('') // Reset breed filter when species changes
        break
      case 'breed':
        setBreedFilter(value)
        break
      case 'health':
        setHealthFilter(value)
        break
      default:
        break
    }
    setPage(1)
  }

  const handleMenuOpen = (event, pet) => {
    setAnchorEl(event.currentTarget)
    setSelectedPet(pet)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedPet(null)
  }

  const handleDeletePet = async () => {
    if (!petToDelete) return
    
    try {
      await petsAPI.delete(petToDelete._id)
      setSuccess('Pet deleted successfully!')
      setDeleteDialog(false)
      setPetToDelete(null)
      loadPets()
    } catch (err) {
      setError('Failed to delete pet')
    }
  }

  const handleToggleStatus = async (pet) => {
    try {
      await petsAPI.update(pet._id, { isActive: !pet.isActive })
      setSuccess(`Pet ${pet.isActive ? 'deactivated' : 'activated'} successfully!`)
      loadPets()
    } catch (err) {
      setError('Failed to update pet status')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'success'
      case 'Adopted': return 'info'
      case 'Reserved': return 'warning'
      case 'Medical': return 'error'
      case 'Fostered': return 'secondary'
      default: return 'default'
    }
  }

  const getHealthColor = (health) => {
    switch (health) {
      case 'Excellent': return 'success'
      case 'Good': return 'info'
      case 'Fair': return 'warning'
      case 'Poor': return 'error'
      default: return 'default'
    }
  }

  const exportPets = () => {
    // Create CSV data
    const csvData = pets.map(pet => ({
      Name: pet.name,
      'Pet Code': pet.petCode || '',
      Species: pet.species?.displayName || pet.species?.name || 'N/A',
      Breed: pet.breed?.name || 'N/A',
      Owner: pet.owner?.name || 'N/A',
      Status: pet.currentStatus,
      Health: pet.healthStatus,
      Age: pet.age ? `${pet.age} ${pet.ageUnit}` : 'N/A',
      Color: pet.color,
      Weight: pet.weight ? `${pet.weight} kg` : 'N/A',
      Location: pet.location || 'N/A',
      'Microchip ID': pet.microchipId || 'N/A',
      'Adoption Fee': pet.adoptionFee || 0,
      'Date Added': new Date(pet.createdAt).toLocaleDateString()
    }))

    // Convert to CSV
    const headers = Object.keys(csvData[0] || {})
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pets-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading && pets.length === 0) {
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
            Pet Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage all pets in the system ({totalPets} total)
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportPets}
            disabled={pets.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => navigate('/admin/pets/import')}
          >
            Import CSV
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search pets by name, species, code..."
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
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c._id} value={c.name}>
                      {c.displayName || c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="Available">Available</MenuItem>
                  <MenuItem value="Adopted">Adopted</MenuItem>
                  <MenuItem value="Reserved">Reserved</MenuItem>
                  <MenuItem value="Medical">Medical</MenuItem>
                  <MenuItem value="Fostered">Fostered</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Species</InputLabel>
                <Select
                  value={speciesFilter}
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
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Breed</InputLabel>
                <Select
                  value={breedFilter}
                  onChange={(e) => handleFilterChange('breed', e.target.value)}
                  disabled={!speciesFilter}
                >
                  <MenuItem value="">All Breeds</MenuItem>
                  {breeds.map((b) => (
                    <MenuItem key={b._id} value={b._id}>
                      {b.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Health</InputLabel>
                <Select
                  value={healthFilter}
                  onChange={(e) => handleFilterChange('health', e.target.value)}
                >
                  <MenuItem value="">All Health</MenuItem>
                  <MenuItem value="Excellent">Excellent</MenuItem>
                  <MenuItem value="Good">Good</MenuItem>
                  <MenuItem value="Fair">Fair</MenuItem>
                  <MenuItem value="Poor">Poor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                  />
                }
                label="Inactive"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Pets Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pet</TableCell>
                  <TableCell>Species & Breed</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Health</TableCell>
                  <TableCell>Age</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Added</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pets.map((pet) => (
                  <TableRow key={pet._id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <PetIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {pet.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {pet.color}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {pet.species?.displayName || pet.species?.name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {pet.breed?.name || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <OwnerIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {pet.owner?.name || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={pet.currentStatus}
                        color={getStatusColor(pet.currentStatus)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={pet.healthStatus}
                        color={getHealthColor(pet.healthStatus)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {pet.age ? `${pet.age} ${pet.ageUnit}` : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocationIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {pet.location || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <DateIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {new Date(pet.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/admin/pets/${pet._id}`)}
                            color="primary"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Medical Records">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/admin/pets/${pet._id}/medical-records`)}
                            color="info"
                          >
                            <MedicalIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More Actions">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, pet)}
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

          {pets.length === 0 && !loading && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No pets found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try adjusting your filters or add a new pet
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

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { navigate(`/admin/pets/${selectedPet?._id}`); handleMenuClose(); }}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { navigate(`/admin/pets/${selectedPet?._id}/medical-records`); handleMenuClose(); }}>
          <ListItemIcon>
            <MedicalIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Medical Records</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { navigate(`/admin/pets/${selectedPet?._id}/ownership-history`); handleMenuClose(); }}>
          <ListItemIcon>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ownership History</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Pet</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{petToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeletePet} color="error" variant="contained">
            Delete
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

export default PetManagement