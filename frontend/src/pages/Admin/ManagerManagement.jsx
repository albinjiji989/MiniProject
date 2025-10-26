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
  
  Avatar,
  Tooltip,
  InputAdornment,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  BusinessCenter as ManagerIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  PersonAdd as InviteIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Send as SendIcon,
  Cancel as CancelIcon,
  Assignment as ModuleIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { managersAPI, modulesAPI, usersAPI } from '../../services/api'

const ManagerManagement = () => {
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [managers, setManagers] = useState([])
  const [modules, setModules] = useState([])
  const [invites, setInvites] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalManagers, setTotalManagers] = useState(0)
  
  // Menu and dialog state
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedManager, setSelectedManager] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [managerToDelete, setManagerToDelete] = useState(null)
  const [editDialog, setEditDialog] = useState(false)
  const [editManager, setEditManager] = useState(null)
  const [inviteDialog, setInviteDialog] = useState(false)
  const [inviteStep, setInviteStep] = useState(1) // 1: details, 2: OTP
  
  // Form data for editing and inviting
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    module: '',
    address: '',
    isActive: true
  })

  const [inviteData, setInviteData] = useState({
    name: '',
    email: '',
    phone: '',
    module: ''
  })

  const [otpData, setOtpData] = useState({
    email: '',
    module: '',
    otp: ''
  })

  // Modules are loaded once on mount; admin can only select existing ones

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadManagers()
    loadInvites()
  }, [page, searchTerm, moduleFilter, statusFilter, showInactive])

  const loadInitialData = async () => {
    try {
      const modulesRes = await modulesAPI.list()
      setModules(modulesRes.data?.data || modulesRes.data || [])
    } catch (err) {
      console.error('Error loading modules:', err)
    }
  }

  const handleOpenInviteDialog = () => {
    setInviteDialog(true)
  }

  const loadManagers = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        search: searchTerm,
        module: moduleFilter,
        isActive: showInactive ? undefined : true
      }

      const response = await managersAPI.list()
      const data = response.data?.data || response.data
      
      const items = data.managers || data || []
      setManagers(items)
      setTotalPages(1)
      setTotalManagers(items.length || 0)
    } catch (err) {
      setError('Failed to load managers')
    } finally {
      setLoading(false)
    }
  }

  const loadInvites = async () => {
    try {
      setInvites([])
    } catch (err) {
      console.error('Error loading invites:', err)
    }
  }

  const handleSearch = (value) => {
    setSearchTerm(value)
    setPage(1)
  }

  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case 'module':
        setModuleFilter(value)
        break
      case 'status':
        setStatusFilter(value)
        break
      default:
        break
    }
    setPage(1)
  }

  const handleMenuOpen = (event, manager) => {
    setAnchorEl(event.currentTarget)
    setSelectedManager(manager)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedManager(null)
  }

  const handleEditManager = (manager) => {
    setEditManager(manager)
    setFormData({
      name: manager.name || '',
      email: manager.email || '',
      phone: manager.phone || '',
      module: deriveManagerModule(manager) || '',
      address: manager.address || '',
      isActive: manager.isActive !== false
    })
    setEditDialog(true)
  }

  const handleUpdateManager = async () => {
    try {
      await managersAPI.update(editManager._id, formData)
      setSuccess('Manager updated successfully!')
      setEditDialog(false)
      loadManagers()
    } catch (err) {
      setError('Failed to update manager')
    }
  }

  const handleDeleteManager = async () => {
    if (!managerToDelete) return
    
    try {
      await managersAPI.remove(managerToDelete._id)
      setSuccess('Manager deleted successfully!')
      setDeleteDialog(false)
      setManagerToDelete(null)
      loadManagers()
    } catch (err) {
      setError('Failed to delete manager')
    }
  }

  const handleToggleStatus = async (manager) => {
    try {
      await managersAPI.update(manager._id, { isActive: !manager.isActive })
      setSuccess(`Manager ${manager.isActive ? 'deactivated' : 'activated'} successfully!`)
      loadManagers()
    } catch (err) {
      setError('Failed to update manager status')
    }
  }

  // Get modules that already have active managers
  const getModulesWithManagers = () => {
    const modulesWithManagers = new Set();
    managers.forEach(manager => {
      if (manager.isActive !== false) {
        const module = deriveManagerModule(manager);
        if (module) {
          modulesWithManagers.add(module);
        }
      }
    });
    return modulesWithManagers;
  };

  // Check if a manager already exists for a module
  const checkExistingManager = (module) => {
    return managers.some(manager => {
      const managerModule = deriveManagerModule(manager);
      return managerModule === module && manager.isActive !== false;
    });
  };

  const handleSendInvite = async () => {
    try {
      // Validate required fields
      if (!inviteData.name || !inviteData.email || !inviteData.module) {
        setError('Name, email, and module are required');
        return;
      }

      // Check if a manager already exists for this module
      if (checkExistingManager(inviteData.module)) {
        setError(`A manager already exists for the ${getModuleDisplayName(inviteData.module)} module. The option to add more managers to the same module will be coming soon.`);
        return;
      }

      // Send OTP to candidate email
      await managersAPI.invite(inviteData);
      setSuccess('OTP sent to candidate email!');
      
      // Move to step 2 (OTP verification)
      setOtpData({
        email: inviteData.email,
        module: inviteData.module,
        otp: ''
      });
      setInviteStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    }
  }

  const handleVerifyOtp = async () => {
    try {
      if (!otpData.otp || otpData.otp.length !== 6) {
        setError('Please enter a valid 6-digit OTP')
        return
      }

      await managersAPI.verify(otpData)
      setSuccess('Manager created successfully! Credentials sent to email.')
      setInviteDialog(false)
      setInviteStep(1)
      setInviteData({ name: '', email: '', phone: '', module: '' })
      setOtpData({ email: '', module: '', otp: '' })
      loadManagers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify OTP')
    }
  }

  const handleCancelInvite = () => {
    setInviteDialog(false)
    setInviteStep(1)
    setInviteData({ name: '', email: '', phone: '', module: '' })
    setOtpData({ email: '', module: '', otp: '' })
  }


  const getModuleColor = (module) => {
    const colors = {
      'adoption': 'success',
      'shelter': 'info',
      'rescue': 'warning',
      'ecommerce': 'primary',
      'pharmacy': 'secondary',
      'temporary-care': 'error',
      'veterinary': 'default'
    }
    return colors[module] || 'default'
  }

  const getModuleDisplayName = (module) => {
    if (!module) return 'N/A'
    return module.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Normalize various shapes to a module key string
  const normalizeModuleValue = (m) => {
    if (!m) return ''
    if (typeof m === 'string') return m
    if (typeof m.name === 'string') return m.name
    if (typeof m.key === 'string') return m.key
    return ''
  }

  // Derive a manager's assigned module from multiple possible fields
  const deriveManagerModule = (manager) => {
    // 1) explicit fields
    const a = normalizeModuleValue(manager?.assignedModule)
    if (a) return a
    const b = normalizeModuleValue(manager?.module)
    if (b) return b
    // 2) array of modules (take first)
    if (Array.isArray(manager?.modules) && manager.modules.length > 0) {
      const first = manager.modules[0]
      const fm = normalizeModuleValue(first)
      if (fm) return fm
    }
    // 3) role like "adoption_manager"
    if (typeof manager?.role === 'string' && manager.role.endsWith('_manager')) {
      return manager.role.replace('_manager', '')
    }
    // 4) fallback custom key
    const c = normalizeModuleValue(manager?.moduleKey)
    if (c) return c
    return ''
  }

  if (loading && managers.length === 0) {
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
            Manager Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage module managers and invitations ({totalManagers} total)
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<InviteIcon />}
          onClick={handleOpenInviteDialog}
        >
          Invite Manager
        </Button>
      </Box>

      {/* Pending Invitations */}
      {invites.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Pending Invitations ({invites.length})
            </Typography>
            <List>
              {invites.map((invite) => (
                <ListItem key={invite._id} divider>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                      <EmailIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={invite.email}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Module: {getModuleDisplayName(invite.module)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Sent: {new Date(invite.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleCancelInvite(invite._id)}
                      color="error"
                    >
                      <CancelIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search managers..."
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
                <InputLabel>Module</InputLabel>
                <Select
                  value={moduleFilter}
                  onChange={(e) => handleFilterChange('module', e.target.value)}
                >
                  <MenuItem value="">All Modules</MenuItem>
                  {modules.map((m) => (
                    <MenuItem key={m._id} value={m.name}>
                      {getModuleDisplayName(m.name)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                    onChange={(e) => setShowInactive(e.target.checked)}
                  />
                }
                label="Show Inactive"
            />
          </Grid>
        </Grid>
        </CardContent>
      </Card>

        {/* Managers Table */}
      <Card>
          <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Manager</TableCell>
                  <TableCell>Module</TableCell>
                  <TableCell>Contact</TableCell>
                      <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Joined</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                {managers.map((manager) => (
                  <TableRow key={manager._id} hover>
                        <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <ManagerIcon />
                            </Avatar>
                            <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {manager.name}
                              </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {manager._id.slice(-8)}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const mod = deriveManagerModule(manager)
                            return (
                              <Chip 
                                icon={<ModuleIcon />}
                                label={getModuleDisplayName(mod)}
                                color={getModuleColor(mod)}
                                size="small" 
                              />
                            )
                          })()}
                        </TableCell>
                    <TableCell>
                      <Box>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <EmailIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {manager.email}
                          </Typography>
                        </Box>
                        {manager.phone && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {manager.phone}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                        label={manager.isActive ? 'Active' : 'Inactive'}
                        color={manager.isActive ? 'success' : 'error'}
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                      <Typography variant="body2">
                        {manager.lastLogin ? new Date(manager.lastLogin).toLocaleDateString() : 'Never'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(manager.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Edit Manager">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditManager(manager)}
                            color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={manager.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(manager)}
                            color={manager.isActive ? 'warning' : 'success'}
                          >
                            {manager.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More Actions">
                            <IconButton 
                              size="small" 
                            onClick={(e) => handleMenuOpen(e, manager)}
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

          {managers.length === 0 && !loading && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No managers found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try adjusting your filters or invite a new manager
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

      {/* Edit Manager Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Manager</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                <InputLabel>Module</InputLabel>
                <Select
                  value={formData.module}
                  onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                >
                  {modules.map((m) => (
                    <MenuItem key={m._id} value={m.name}>
                      {getModuleDisplayName(m.name)}
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateManager} variant="contained">
            Update Manager
              </Button>
        </DialogActions>
      </Dialog>

      {/* Invite Manager Dialog */}
      <Dialog open={inviteDialog} onClose={handleCancelInvite} maxWidth="md" fullWidth>
        <DialogTitle>
          {inviteStep === 1 ? 'Invite New Manager' : 'Verify OTP'}
        </DialogTitle>
        <DialogContent>
          {inviteStep === 1 ? (
            // Step 1: Enter manager details
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name *"
                  value={inviteData.name}
                  onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address *"
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={inviteData.phone}
                  onChange={(e) => setInviteData({ ...inviteData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Module *</InputLabel>
                  <Select
                    value={inviteData.module}
                    onChange={(e) => setInviteData({ ...inviteData, module: e.target.value })}
                  >
                    {modules.length === 0 ? (
                      <MenuItem disabled>No modules available</MenuItem>
                    ) : (
                      modules.map((m) => (
                        <MenuItem key={m._id} value={m.key || m.name}>
                          <Box display="flex" alignItems="center" width="100%">
                            <span>{getModuleDisplayName(m.name)}</span>
                            {checkExistingManager(m.key || m.name) && (
                              <Chip 
                                label="Has Manager" 
                                size="small" 
                                sx={{ ml: 1, backgroundColor: '#ff9800', color: 'white' }} 
                              />
                            )}
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          ) : (
            // Step 2: Enter OTP
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  OTP has been sent to <strong>{otpData.email}</strong>. Please check the email and enter the 6-digit code below.
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Enter 6-digit OTP *"
                  value={otpData.otp}
                  onChange={(e) => setOtpData({ ...otpData, otp: e.target.value })}
                  inputProps={{ maxLength: 6 }}
                  placeholder="123456"
                  required
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelInvite}>Cancel</Button>
          {inviteStep === 1 ? (
            <Button onClick={handleSendInvite} variant="contained" startIcon={<SendIcon />}>
              Send OTP
            </Button>
          ) : (
            <Button onClick={handleVerifyOtp} variant="contained" startIcon={<CheckCircleIcon />}>
              Verify & Create Manager
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleEditManager(selectedManager); handleMenuClose(); }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Manager</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleToggleStatus(selectedManager); handleMenuClose(); }}>
          <ListItemIcon>
            {selectedManager?.isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {selectedManager?.isActive ? 'Deactivate' : 'Activate'}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setManagerToDelete(selectedManager); setDeleteDialog(true); handleMenuClose(); }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete Manager</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Manager</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{managerToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteManager} color="error" variant="contained">
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

export default ManagerManagement

