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
  Tabs,
  Tab,
  Checkbox,
  FormGroup,
  FormHelperText,
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Person as UserIcon,
  AdminPanelSettings as AdminIcon,
  BusinessCenter as ManagerIcon,
  PersonAdd as PersonAddIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material'
import { usersAPI, rolesAPI } from '../../services/api'

const ALL_MODULES = [
  'adoption',
  'shelter',
  'rescue',
  'ecommerce',
  'pharmacy',
  'temporary-care',
  'veterinary',
  'donation',
]

const UserManagement = () => {
  
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('public_user') // Default to public users only
  const [statusFilter, setStatusFilter] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  
  // Menu and dialog state
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [editDialog, setEditDialog] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  
  // Form data for editing
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    address: '',
    isActive: true,
  })

  // Module access: default allow; admin can block per-module (boolean)
  const [moduleAccess, setModuleAccess] = useState({})

  const syncAccessFromLists = (_allowed, blocked) => {
    const initial = {}
    ALL_MODULES.forEach((m) => {
      initial[m] = Array.isArray(blocked) && blocked.includes(m)
    })
    setModuleAccess(initial)
  }

  const deriveListsFromAccess = () => {
    const blocked = []
    Object.entries(moduleAccess).forEach(([m, isBlocked]) => {
      if (isBlocked) blocked.push(m)
    })
    return { blockedModules: blocked }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadUsers()
  }, [page, searchTerm, roleFilter, statusFilter, showInactive])

  const loadInitialData = async () => {
    try {
      const rolesRes = await rolesAPI.list()
      setRoles(rolesRes.data?.data || rolesRes.data || [])
    } catch (err) {
      console.error('Error loading roles:', err)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      // Map filters to public users endpoint
      const params = {
        page,
        limit: 10,
        search: searchTerm,
        status: statusFilter || (showInactive ? '' : 'active') // '', 'active', or 'inactive'
      }

      const response = await usersAPI.getPublicUsers(params)
      const payload = response.data?.data || {}
      const data = Array.isArray(payload) ? payload : (payload.users || [])
      const pagination = payload.pagination || {}

      setUsers(data)
      setTotalPages(pagination.pages || 1)
      setTotalUsers(pagination.total || data.length || 0)
    } catch (err) {
      setError('Failed to load users')
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
      default:
        break
    }
    setPage(1)
  }


  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget)
    setSelectedUser(user)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedUser(null)
  }

  const handleEditUser = async (user) => {
    setEditUser(user)
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || '',
      address: user.address || '',
      isActive: user.isActive !== false
    })
    setFormErrors({})
    setEditDialog(true)
    // Fetch fresh details to ensure latest module access
    try {
      const res = await usersAPI.getUser(user._id)
      const fresh = res?.data?.data?.user || user
      syncAccessFromLists([], fresh.blockedModules || [])
    } catch (e) {
      syncAccessFromLists([], user.blockedModules || [])
    }
  }

  const handleUpdateUser = async () => {
    const errors = {}
    if (!formData.name?.trim()) errors.name = 'Name is required'
    if (!formData.email?.trim()) errors.email = 'Email is required'
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      // Build payload excluding empty strings/undefined to avoid 400 validation errors
      const payload = {}
      if (formData.name && formData.name.trim()) payload.name = formData.name.trim()
      if (formData.email && formData.email.trim()) payload.email = formData.email.trim()
      if (formData.phone && String(formData.phone).trim()) payload.phone = String(formData.phone).trim()
      if (formData.address && String(formData.address).trim()) payload.address = String(formData.address).trim()
      if (typeof formData.isActive === 'boolean') payload.isActive = formData.isActive
      if (formData.role && formData.role.trim()) payload.role = formData.role.trim()

      if (Object.keys(payload).length > 0) {
        await usersAPI.updateUser(editUser._id, payload)
      }

      // Update module access regardless of user payload
      const { blockedModules } = deriveListsFromAccess()
      await usersAPI.setModuleAccess(editUser._id, { blockedModules })

      setSuccess('User updated successfully!')
      setEditDialog(false)
      loadUsers()
    } catch (err) {
      setError('Failed to update user')
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    
    try {
      await usersAPI.deleteUser(userToDelete._id)
      setSuccess('User deleted successfully!')
      setDeleteDialog(false)
      setUserToDelete(null)
      loadUsers()
    } catch (err) {
      setError('Failed to delete user')
    }
  }

  const handleToggleStatus = async (user) => {
    try {
      await usersAPI.updateUser(user._id, { isActive: !user.isActive })
      setSuccess(`User ${user.isActive ? 'deactivated' : 'activated'} successfully!`)
      loadUsers()
    } catch (err) {
      setError('Failed to update user status')
    }
  }

  const getRoleColor = (role) => {
    if (role === 'admin') return 'error'
    if (role.includes('manager')) return 'warning'
    if (role === 'public_user') return 'info'
    return 'default'
  }

  const getRoleIcon = (role) => {
    if (role === 'admin') return <AdminIcon />
    if (role.includes('manager')) return <ManagerIcon />
    return <UserIcon />
  }

  const getRoleDisplayName = (role) => {
    if (role === 'admin') return 'Admin'
    if (role === 'public_user') return 'Public User'
    if (role.includes('manager')) {
      return role.replace('_manager', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' Manager'
    }
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const setAccess = (moduleKey, isBlocked) => {
    setModuleAccess(prev => ({ ...prev, [moduleKey]: isBlocked }))
  }

  const bulkSetAccess = (isBlocked) => {
    const next = {}
    ALL_MODULES.forEach((m) => { next[m] = isBlocked })
    setModuleAccess(next)
  }

  if (loading && users.length === 0) {
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
            Public User Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage public users and their accounts ({totalUsers} total)
          </Typography>
        </Box>
      </Box>


      {/* Filters */}
      <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search users..."
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
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControlLabel
                control={
                <Switch
                  checked={showInactive}
                  onChange={(e) => {
                    setShowInactive(e.target.checked)
                  }}
                />
                }
                label="Show Inactive"
              />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Users Table */}
      <Card>
          <CardContent>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Contact</TableCell>
                        <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Joined</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id} hover>
                          <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getRoleIcon(user.role)}
                              </Avatar>
                              <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {user.name}
                                </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {user._id.slice(-8)}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                        icon={getRoleIcon(user.role)}
                        label={getRoleDisplayName(user.role)}
                        color={getRoleColor(user.role)}
                              size="small" 
                            />
                          </TableCell>
                    <TableCell>
                      <Box>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <EmailIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {user.email}
                          </Typography>
                        </Box>
                        {user.phone && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {user.phone}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                        label={user.isActive ? 'Active' : 'Inactive'}
                        color={user.isActive ? 'success' : 'error'}
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                      <Typography variant="body2">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                              <Tooltip title="Edit User">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleEditUser(user)}
                            color="primary"
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                        <Tooltip title={user.isActive ? 'Deactivate' : 'Activate'}>
                                <IconButton 
                                  size="small" 
                            onClick={() => handleToggleStatus(user)}
                            color={user.isActive ? 'warning' : 'success'}
                                >
                            {user.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                                </IconButton>
                              </Tooltip>
                        <Tooltip title="More Actions">
                                <IconButton 
                                  size="small" 
                            onClick={(e) => handleMenuOpen(e, user)}
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
                
          {users.length === 0 && !loading && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No users found
                  </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try adjusting your filters
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

      {/* Edit User Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="public_user">Public User</MenuItem>
                  {roles.filter(r => r.name.includes('manager')).map((role) => (
                        <MenuItem key={role._id} value={role.name}>
                      {getRoleDisplayName(role.name)}
                        </MenuItem>
                  ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                fullWidth
                  label="Address"
                  multiline
                  rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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

            {/* Module Access */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 1 }}>
                Module Access Controls
              </Typography>
              <Box display="flex" gap={1} sx={{ mb: 1 }}>
                <Button size="small" variant="contained" color="success" onClick={() => bulkSetAccess(false)}>Allow All</Button>
                <Button size="small" variant="contained" color="error" onClick={() => bulkSetAccess(true)}>Block All</Button>
              </Box>
              <Grid container spacing={1}>
                {ALL_MODULES.map((m) => (
                  <Grid key={`row-${m}`} item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent sx={{ py: 1.5 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                          <Typography sx={{ minWidth: 140 }}>
                            {m.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Button
                              size="small"
                              variant="contained"
                              color={moduleAccess[m] ? 'error' : 'success'}
                              onClick={() => setAccess(m, !moduleAccess[m])}
                            >
                              {moduleAccess[m] ? 'Blocked' : 'Allowed'}
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <FormHelperText sx={{ mt: 1 }}>
                Default is allowed. Check “Block” to deny access to a module.
              </FormHelperText>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateUser} variant="contained">
            Update User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleEditUser(selectedUser); handleMenuClose(); }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit User</ListItemText>
                        </MenuItem>
        <MenuItem onClick={() => { handleToggleStatus(selectedUser); handleMenuClose(); }}>
          <ListItemIcon>
            {selectedUser?.isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {selectedUser?.isActive ? 'Deactivate' : 'Activate'}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setUserToDelete(selectedUser); setDeleteDialog(true); handleMenuClose(); }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete User</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{userToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
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

export default UserManagement
