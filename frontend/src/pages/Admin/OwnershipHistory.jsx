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
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  Pets as PetIcon,
  Person as OwnerIcon,
  CalendarToday as DateIcon,
  Description as DescriptionIcon,
  TransferWithinAStation as TransferIcon,
} from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import { ownershipHistoryAPI, petsAPI } from '../../services/petSystemAPI'
import { usersAPI } from '../../services/api'

const OwnershipHistory = () => {
  const navigate = useNavigate()
  const params = useParams()
  
  const [loading, setLoading] = useState(true)
  const [histories, setHistories] = useState([])
  const [pets, setPets] = useState([])
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [petFilter, setPetFilter] = useState('')
  const [ownerFilter, setOwnerFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalHistories, setTotalHistories] = useState(0)
  
  // Menu and dialog state
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedHistory, setSelectedHistory] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [historyToDelete, setHistoryToDelete] = useState(null)
  const [editDialog, setEditDialog] = useState(false)
  const [editHistory, setEditHistory] = useState(null)
  const [addDialog, setAddDialog] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  
  // Form data for editing and adding
  const [formData, setFormData] = useState({
    pet: '',
    previousOwner: '',
    newOwner: '',
    transferType: 'adoption',
    transferDate: '',
    reason: '',
    notes: '',
    isActive: true
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (params?.petId) {
      setPetFilter(params.petId)
    }
  }, [params?.petId])

  useEffect(() => {
    loadHistories()
  }, [page, searchTerm, petFilter, ownerFilter, typeFilter, statusFilter, showInactive])

  const loadInitialData = async () => {
    try {
      const [petsRes, usersRes] = await Promise.all([
        petsAPI.list({ limit: 1000 }),
        usersAPI.getUsers({ limit: 1000 })
      ])
      
      setPets(petsRes.data?.data || [])
      setUsers(usersRes.data?.data || usersRes.data || [])
    } catch (err) {
      console.error('Error loading initial data:', err)
    }
  }

  const loadHistories = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        search: searchTerm,
        petId: petFilter,
        // owner filtering handled client-side via users list or add backend support later
        transferType: typeFilter,
        isActive: showInactive ? undefined : true
      }

      const response = await ownershipHistoryAPI.list(params)
      const data = response.data?.data || []
      const pagination = response.data?.pagination || {}

      setHistories(Array.isArray(data) ? data : (data.histories || []))
      setTotalPages(pagination.pages || 1)
      setTotalHistories(pagination.total || 0)
    } catch (err) {
      setError('Failed to load ownership history')
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
      case 'owner':
        setOwnerFilter(value)
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

  const handleMenuOpen = (event, history) => {
    setAnchorEl(event.currentTarget)
    setSelectedHistory(history)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedHistory(null)
  }

  const handleAddHistory = () => {
    setFormData({
      pet: '',
      previousOwner: '',
      newOwner: '',
      transferType: 'adoption',
      transferDate: '',
      reason: '',
      notes: '',
      isActive: true
    })
    setFormErrors({})
    setAddDialog(true)
  }

  const handleEditHistory = (history) => {
    setEditHistory(history)
    setFormData({
      pet: history.pet?._id || history.pet || '',
      previousOwner: history.previousOwner?._id || history.previousOwner || '',
      newOwner: history.newOwner?._id || history.newOwner || '',
      transferType: history.transferType || 'adoption',
      transferDate: history.transferDate ? new Date(history.transferDate).toISOString().split('T')[0] : '',
      reason: history.reason || '',
      notes: history.notes || '',
      isActive: history.isActive !== false
    })
    setFormErrors({})
    setEditDialog(true)
  }

  const handleSaveHistory = async () => {
    const errors = {}
    if (!formData.pet) errors.pet = 'Pet is required'
    if (!formData.transferType) errors.transferType = 'Transfer type is required'
    if (!formData.reason?.trim()) errors.reason = 'Reason is required'
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      if (editHistory) {
        await ownershipHistoryAPI.update(editHistory._id, formData)
        setSuccess('Ownership history updated successfully!')
        setEditDialog(false)
      } else {
        await ownershipHistoryAPI.create(formData)
        setSuccess('Ownership history created successfully!')
        setAddDialog(false)
      }
      loadHistories()
    } catch (err) {
      setError('Failed to save ownership history')
    }
  }

  const handleDeleteHistory = async () => {
    if (!historyToDelete) return
    
    try {
      await ownershipHistoryAPI.delete(historyToDelete._id)
      setSuccess('Ownership history deleted successfully!')
      setDeleteDialog(false)
      setHistoryToDelete(null)
      loadHistories()
    } catch (err) {
      setError('Failed to delete ownership history')
    }
  }

  const handleToggleStatus = async (history) => {
    try {
      await ownershipHistoryAPI.update(history._id, { isActive: !history.isActive })
      setSuccess(`Ownership history ${history.isActive ? 'deactivated' : 'activated'} successfully!`)
      loadHistories()
    } catch (err) {
      setError('Failed to update ownership history status')
    }
  }

  const getTransferTypeColor = (type) => {
    const colors = {
      'adoption': 'success',
      'surrender': 'warning',
      'transfer': 'info',
      'return': 'error',
      'foster': 'primary',
      'other': 'default'
    }
    return colors[type] || 'default'
  }

  const getTransferTypeDisplayName = (type) => {
    return type?.charAt(0).toUpperCase() + type?.slice(1) || 'Unknown'
  }

  if (loading && histories.length === 0) {
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
            Ownership History Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage all ownership transfers in the system ({totalHistories} total)
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddHistory}
        >
          Add Ownership Record
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search history..."
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
                <InputLabel>Owner</InputLabel>
                <Select
                  value={ownerFilter}
                  onChange={(e) => handleFilterChange('owner', e.target.value)}
                >
                  <MenuItem value="">All Owners</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.name}
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
                  <MenuItem value="adoption">Adoption</MenuItem>
                  <MenuItem value="surrender">Surrender</MenuItem>
                  <MenuItem value="transfer">Transfer</MenuItem>
                  <MenuItem value="return">Return</MenuItem>
                  <MenuItem value="foster">Foster</MenuItem>
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

      {/* History Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Transfer</TableCell>
                  <TableCell>Pet</TableCell>
                  <TableCell>Previous Owner</TableCell>
                  <TableCell>New Owner</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {histories.map((history) => (
                  <TableRow key={history._id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <TransferIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {getTransferTypeDisplayName(history.transferType)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {history.reason || 'No reason provided'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PetIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {history.pet?.name || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <OwnerIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {history.previousOwner?.name || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <OwnerIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {history.newOwner?.name || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getTransferTypeDisplayName(history.transferType)}
                        color={getTransferTypeColor(history.transferType)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <DateIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {history.transferDate ? new Date(history.transferDate).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={history.isActive ? 'Active' : 'Inactive'}
                        color={history.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/admin/ownership-history/${history._id}`)}
                            color="primary"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Record">
                          <IconButton
                            size="small"
                            onClick={() => handleEditHistory(history)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={history.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(history)}
                            color={history.isActive ? 'warning' : 'success'}
                          >
                            {history.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More Actions">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, history)}
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

          {histories.length === 0 && !loading && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No ownership history found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try adjusting your filters or add a new ownership record
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

      {/* Add History Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Ownership Record</DialogTitle>
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
              <FormControl fullWidth required error={!!formErrors.transferType}>
                <InputLabel>Transfer Type *</InputLabel>
                <Select
                  value={formData.transferType}
                  onChange={(e) => setFormData({ ...formData, transferType: e.target.value })}
                >
                  <MenuItem value="adoption">Adoption</MenuItem>
                  <MenuItem value="surrender">Surrender</MenuItem>
                  <MenuItem value="transfer">Transfer</MenuItem>
                  <MenuItem value="return">Return</MenuItem>
                  <MenuItem value="foster">Foster</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
                {formErrors.transferType && (
                  <Typography variant="caption" color="error">{formErrors.transferType}</Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Previous Owner</InputLabel>
                <Select
                  value={formData.previousOwner}
                  onChange={(e) => setFormData({ ...formData, previousOwner: e.target.value })}
                >
                  <MenuItem value="">No Previous Owner</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>New Owner</InputLabel>
                <Select
                  value={formData.newOwner}
                  onChange={(e) => setFormData({ ...formData, newOwner: e.target.value })}
                >
                  <MenuItem value="">No New Owner</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Transfer Date"
                type="date"
                value={formData.transferDate}
                onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
                error={!!formErrors.reason}
                helperText={formErrors.reason}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
          <Button onClick={handleSaveHistory} variant="contained">
            Add Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit History Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Ownership Record</DialogTitle>
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
                <InputLabel>Transfer Type *</InputLabel>
                <Select
                  value={formData.transferType}
                  onChange={(e) => setFormData({ ...formData, transferType: e.target.value })}
                >
                  <MenuItem value="adoption">Adoption</MenuItem>
                  <MenuItem value="surrender">Surrender</MenuItem>
                  <MenuItem value="transfer">Transfer</MenuItem>
                  <MenuItem value="return">Return</MenuItem>
                  <MenuItem value="foster">Foster</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Previous Owner</InputLabel>
                <Select
                  value={formData.previousOwner}
                  onChange={(e) => setFormData({ ...formData, previousOwner: e.target.value })}
                >
                  <MenuItem value="">No Previous Owner</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>New Owner</InputLabel>
                <Select
                  value={formData.newOwner}
                  onChange={(e) => setFormData({ ...formData, newOwner: e.target.value })}
                >
                  <MenuItem value="">No New Owner</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Transfer Date"
                type="date"
                value={formData.transferDate}
                onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
          <Button onClick={handleSaveHistory} variant="contained">
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
        <MenuItem onClick={() => { navigate(`/admin/ownership-history/${selectedHistory?._id}`); handleMenuClose(); }}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleEditHistory(selectedHistory); handleMenuClose(); }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Record</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleToggleStatus(selectedHistory); handleMenuClose(); }}>
          <ListItemIcon>
            {selectedHistory?.isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {selectedHistory?.isActive ? 'Deactivate' : 'Activate'}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setHistoryToDelete(selectedHistory); setDeleteDialog(true); handleMenuClose(); }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete Record</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Ownership Record</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this ownership record? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteHistory} color="error" variant="contained">
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

export default OwnershipHistory

