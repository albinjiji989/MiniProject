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
  LocalHospital as MedicalIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  Pets as PetIcon,
  Person as VetIcon,
  CalendarToday as DateIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { medicalRecordsAPI, petsAPI } from '../../services/petSystemAPI'
import { usersAPI } from '../../services/api'

const MedicalRecords = () => {
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState([])
  const [pets, setPets] = useState([])
  const [vets, setVets] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [petFilter, setPetFilter] = useState('')
  const [vetFilter, setVetFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  
  // Menu and dialog state
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState(null)
  const [editDialog, setEditDialog] = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [addDialog, setAddDialog] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  
  // Form data for editing and adding
  const [formData, setFormData] = useState({
    pet: '',
    veterinarian: '',
    recordType: 'checkup',
    title: '',
    description: '',
    diagnosis: '',
    treatment: '',
    medications: '',
    followUpDate: '',
    cost: '',
    isActive: true
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadRecords()
  }, [page, searchTerm, petFilter, vetFilter, typeFilter, statusFilter, showInactive])

  const loadInitialData = async () => {
    try {
      const [petsRes, vetsRes] = await Promise.all([
        petsAPI.list({ limit: 1000 }),
        usersAPI.getUsers({ role: 'veterinary_manager', limit: 1000 })
      ])
      
      setPets(petsRes.data?.data || [])
      setVets(vetsRes.data?.data || vetsRes.data || [])
    } catch (err) {
      console.error('Error loading initial data:', err)
    }
  }

  const loadRecords = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        search: searchTerm,
        petId: petFilter,
        // veterinarian filter is client-side only for now
        recordType: typeFilter,
        isActive: showInactive ? undefined : true
      }

      const response = await medicalRecordsAPI.list(params)
      const data = response.data?.data || []
      const pagination = response.data?.pagination || {}

      setRecords(Array.isArray(data) ? data : (data.records || []))
      setTotalPages(pagination.pages || 1)
      setTotalRecords(pagination.total || 0)
    } catch (err) {
      setError('Failed to load medical records')
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
      case 'pet':
        setPetFilter(value)
        break
      case 'vet':
        setVetFilter(value)
        break
      case 'type':
        setTypeFilter(value)
        break
      case 'status':
        setStatusFilter(value)
        break
      default:
        break
    }
    setPage(1)
  }

  const handleMenuOpen = (event, record) => {
    setAnchorEl(event.currentTarget)
    setSelectedRecord(record)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedRecord(null)
  }

  const handleAddRecord = () => {
    setFormData({
      pet: '',
      veterinarian: '',
      recordType: 'checkup',
      title: '',
      description: '',
      diagnosis: '',
      treatment: '',
      medications: '',
      followUpDate: '',
      cost: '',
      isActive: true
    })
    setFormErrors({})
    setAddDialog(true)
  }

  const handleEditRecord = (record) => {
    setEditRecord(record)
    setFormData({
      pet: record.pet?._id || record.pet || '',
      veterinarian: record.veterinarian?._id || record.veterinarian || '',
      recordType: record.recordType || 'checkup',
      title: record.title || '',
      description: record.description || '',
      diagnosis: record.diagnosis || '',
      treatment: record.treatment || '',
      medications: record.medications || '',
      followUpDate: record.followUpDate ? new Date(record.followUpDate).toISOString().split('T')[0] : '',
      cost: record.cost || '',
      isActive: record.isActive !== false
    })
    setFormErrors({})
    setEditDialog(true)
  }

  const handleSaveRecord = async () => {
    const errors = {}
    if (!formData.pet) errors.pet = 'Pet is required'
    if (!formData.recordType) errors.recordType = 'Record type is required'
    if (!formData.title?.trim()) errors.title = 'Title is required'
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      const submitData = {
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : 0
      }

      if (editRecord) {
        await medicalRecordsAPI.update(editRecord._id, submitData)
        setSuccess('Medical record updated successfully!')
        setEditDialog(false)
      } else {
        await medicalRecordsAPI.create(submitData)
        setSuccess('Medical record created successfully!')
        setAddDialog(false)
      }
      loadRecords()
    } catch (err) {
      setError('Failed to save medical record')
    }
  }

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return
    
    try {
      await medicalRecordsAPI.delete(recordToDelete._id)
      setSuccess('Medical record deleted successfully!')
      setDeleteDialog(false)
      setRecordToDelete(null)
      loadRecords()
    } catch (err) {
      setError('Failed to delete medical record')
    }
  }

  const handleToggleStatus = async (record) => {
    try {
      await medicalRecordsAPI.update(record._id, { isActive: !record.isActive })
      setSuccess(`Medical record ${record.isActive ? 'deactivated' : 'activated'} successfully!`)
      loadRecords()
    } catch (err) {
      setError('Failed to update medical record status')
    }
  }

  const getRecordTypeColor = (type) => {
    const colors = {
      'checkup': 'info',
      'vaccination': 'success',
      'surgery': 'error',
      'emergency': 'warning',
      'treatment': 'primary',
      'other': 'default'
    }
    return colors[type] || 'default'
  }

  const getRecordTypeDisplayName = (type) => {
    return type?.charAt(0).toUpperCase() + type?.slice(1) || 'Unknown'
  }

  if (loading && records.length === 0) {
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
            Medical Records Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage all medical records in the system ({totalRecords} total)
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddRecord}
        >
          Add Medical Record
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search records..."
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
                <InputLabel>Pet</InputLabel>
                <Select
                  value={petFilter}
                  onChange={(e) => handleFilterChange('pet', e.target.value)}
                >
                  <MenuItem value="">All Pets</MenuItem>
                  {pets.map((pet) => (
                    <MenuItem key={pet._id} value={pet._id}>
                      {pet.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Veterinarian</InputLabel>
                <Select
                  value={vetFilter}
                  onChange={(e) => handleFilterChange('vet', e.target.value)}
                >
                  <MenuItem value="">All Vets</MenuItem>
                  {vets.map((vet) => (
                    <MenuItem key={vet._id} value={vet._id}>
                      {vet.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="checkup">Checkup</MenuItem>
                  <MenuItem value="vaccination">Vaccination</MenuItem>
                  <MenuItem value="surgery">Surgery</MenuItem>
                  <MenuItem value="emergency">Emergency</MenuItem>
                  <MenuItem value="treatment">Treatment</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
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

      {/* Records Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Record</TableCell>
                  <TableCell>Pet</TableCell>
                  <TableCell>Veterinarian</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Cost</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record._id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <MedicalIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {record.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {record.description?.length > 50 
                              ? `${record.description.substring(0, 50)}...` 
                              : record.description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PetIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {record.pet?.name || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <VetIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {record.veterinarian?.name || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getRecordTypeDisplayName(record.recordType)}
                        color={getRecordTypeColor(record.recordType)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <DateIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        ${record.cost || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={record.isActive ? 'Active' : 'Inactive'}
                        color={record.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/admin/medical-records/${record._id}`)}
                            color="primary"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Record">
                          <IconButton
                            size="small"
                            onClick={() => handleEditRecord(record)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={record.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(record)}
                            color={record.isActive ? 'warning' : 'success'}
                          >
                            {record.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More Actions">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, record)}
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

          {records.length === 0 && !loading && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No medical records found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try adjusting your filters or add a new medical record
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

      {/* Add Record Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Medical Record</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={!!formErrors.pet}>
                <InputLabel>Pet *</InputLabel>
                <Select
                  value={formData.pet}
                  onChange={(e) => setFormData({ ...formData, pet: e.target.value })}
                >
                  {pets.map((pet) => (
                    <MenuItem key={pet._id} value={pet._id}>
                      {pet.name}
                    </MenuItem>
                  ))}
                </Select>
              {formErrors.pet && (
                <Typography variant="caption" color="error">{formErrors.pet}</Typography>
              )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Veterinarian *</InputLabel>
                <Select
                  value={formData.veterinarian}
                  onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
                >
                  {vets.map((vet) => (
                    <MenuItem key={vet._id} value={vet._id}>
                      {vet.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!formErrors.recordType}>
                <InputLabel>Record Type *</InputLabel>
                <Select
                  value={formData.recordType}
                  onChange={(e) => setFormData({ ...formData, recordType: e.target.value })}
                >
                  <MenuItem value="checkup">Checkup</MenuItem>
                  <MenuItem value="vaccination">Vaccination</MenuItem>
                  <MenuItem value="surgery">Surgery</MenuItem>
                  <MenuItem value="emergency">Emergency</MenuItem>
                  <MenuItem value="treatment">Treatment</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
                {formErrors.recordType && (
                  <Typography variant="caption" color="error">{formErrors.recordType}</Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cost"
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                error={!!formErrors.title}
                helperText={formErrors.title}
              />
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
              <TextField
                fullWidth
                label="Diagnosis"
                multiline
                rows={2}
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Treatment"
                multiline
                rows={2}
                value={formData.treatment}
                onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Medications"
                multiline
                rows={2}
                value={formData.medications}
                onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Follow-up Date"
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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
          <Button onClick={handleSaveRecord} variant="contained">
            Add Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Record Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Medical Record</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Pet *</InputLabel>
                <Select
                  value={formData.pet}
                  onChange={(e) => setFormData({ ...formData, pet: e.target.value })}
                >
                  {pets.map((pet) => (
                    <MenuItem key={pet._id} value={pet._id}>
                      {pet.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Veterinarian *</InputLabel>
                <Select
                  value={formData.veterinarian}
                  onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
                >
                  {vets.map((vet) => (
                    <MenuItem key={vet._id} value={vet._id}>
                      {vet.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Record Type *</InputLabel>
                <Select
                  value={formData.recordType}
                  onChange={(e) => setFormData({ ...formData, recordType: e.target.value })}
                >
                  <MenuItem value="checkup">Checkup</MenuItem>
                  <MenuItem value="vaccination">Vaccination</MenuItem>
                  <MenuItem value="surgery">Surgery</MenuItem>
                  <MenuItem value="emergency">Emergency</MenuItem>
                  <MenuItem value="treatment">Treatment</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cost"
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
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
              <TextField
                fullWidth
                label="Diagnosis"
                multiline
                rows={2}
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Treatment"
                multiline
                rows={2}
                value={formData.treatment}
                onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Medications"
                multiline
                rows={2}
                value={formData.medications}
                onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Follow-up Date"
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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
          <Button onClick={handleSaveRecord} variant="contained">
            Update Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { navigate(`/admin/medical-records/${selectedRecord?._id}`); handleMenuClose(); }}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleEditRecord(selectedRecord); handleMenuClose(); }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Record</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleToggleStatus(selectedRecord); handleMenuClose(); }}>
          <ListItemIcon>
            {selectedRecord?.isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {selectedRecord?.isActive ? 'Deactivate' : 'Activate'}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setRecordToDelete(selectedRecord); setDeleteDialog(true); handleMenuClose(); }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete Record</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Medical Record</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{recordToDelete?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteRecord} color="error" variant="contained">
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

export default MedicalRecords

