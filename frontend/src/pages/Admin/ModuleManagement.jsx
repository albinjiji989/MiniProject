import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel,
  Menu,
  ListItemIcon,
  ListItemText,
  Avatar,
  Tooltip,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Business as ModuleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  Build as BuildIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
} from '@mui/icons-material'
import { modulesAPI } from '../../services/api'

const ModuleManagement = () => {
  const [loading, setLoading] = useState(true)
  const [modules, setModules] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingModule, setEditingModule] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedModule, setSelectedModule] = useState(null)
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    icon: 'Business',
    color: '#64748b',
    status: 'coming_soon',
    hasManagerDashboard: false,
    maintenanceMessage: '',
    blockReason: '',
    displayOrder: 0
  })

  useEffect(() => {
    loadModules()
  }, [])

  const loadModules = async () => {
    try {
      setLoading(true)
      const response = await modulesAPI.listAdmin()
      const data = response.data?.data || response.data || []
      // Debug: inspect what backend returned
      // eslint-disable-next-line no-console
      console.log('Admin modules response:', response.data)
      setModules(Array.isArray(data) ? data : [])
    } catch (err) {
      // Show backend error message if available
      setError(err?.response?.data?.message || 'Failed to load modules')
    } finally {
      setLoading(false)
    }
  }
  
  const handleAddModule = () => {
    setEditingModule(null)
    setFormData({
      key: '',
      name: '',
      description: '',
      icon: 'Business',
      color: '#64748b',
      status: 'coming_soon',
      hasManagerDashboard: false,
      maintenanceMessage: '',
      blockReason: '',
      displayOrder: 0
    })
    setDialogOpen(true)
  }

  const handleEditModule = (module) => {
    setEditingModule(module)
    setFormData({
      key: module.key,
      name: module.name,
      description: module.description || '',
      icon: module.icon || 'Business',
      color: module.color || '#64748b',
      status: module.status || 'coming_soon',
      hasManagerDashboard: module.hasManagerDashboard || false,
      maintenanceMessage: module.maintenanceMessage || '',
      blockReason: module.blockReason || '',
      displayOrder: module.displayOrder || 0
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      if (editingModule) {
        await modulesAPI.update(editingModule._id, formData)
        setSuccess('Module updated successfully!')
      } else {
        // Creation is disabled per backend
        setError('Creating new modules is disabled')
        return
      }
      setDialogOpen(false)
      loadModules()
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.response?.data?.errors?.join(', ') || 'Failed to save module'
      setError(errorMessage)
    }
  }

  const handleHideModule = async (moduleId) => {
    if (window.confirm('Hide this module from user dashboard? This can be restored later.')) {
      try {
        await modulesAPI.hide(moduleId)
        setSuccess('Module hidden successfully!')
        loadModules()
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to hide module')
      }
    }
  }

  const handleRestoreModule = async (moduleId) => {
    try {
      await modulesAPI.restore(moduleId)
      setSuccess('Module restored successfully!')
      loadModules()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to restore module')
    }
  }

  const handleStatusChange = async (moduleId, newStatus, message = '') => {
    try {
      await modulesAPI.updateStatus(moduleId, { status: newStatus, message })
      setSuccess(`Module status updated to ${newStatus}`)
      handleMenuClose() // Close menu after action
      loadModules()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update module status')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success'
      case 'maintenance': return 'warning'
      case 'blocked': return 'error'
      case 'coming_soon': return 'info'
      default: return 'default'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircleIcon />
      case 'maintenance': return <BuildIcon />
      case 'blocked': return <BlockIcon />
      case 'coming_soon': return <WarningIcon />
      default: return <ModuleIcon />
    }
  }

  const handleMenuOpen = (event, module) => {
    setAnchorEl(event.currentTarget)
    setSelectedModule(module)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedModule(null)
  }

  const moduleIcons = [
    'Business', 'Pets', 'Home', 'LocalHospital', 'ShoppingCart', 
    'LocalPharmacy', 'Support', 'Favorite', 'Report', 'Settings'
  ]

  const moduleColors = [
    '#64748b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899'
  ]

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>Loading modules...</Typography>
        </Box>
      </Container>
    )
  }

  if (!loading && modules.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" flexDirection="column" gap={2}>
          <Typography variant="h6">No modules found</Typography>
          <Typography variant="body2" color="text.secondary">If modules exist in DB, ensure the admin endpoint /api/modules/admin returns them.</Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Module Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Configure and manage system modules
          </Typography>
        </Box>
        {/* Add Module disabled by requirement */}
      </Box>

      {/* Module Cards Grid */}
      <Grid container spacing={3} mb={4}>
        {modules.map((module) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={module._id}>
            <Card 
              sx={{ 
                height: '100%',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': { transform: 'translateY(-4px)' }
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Avatar 
                    sx={{ 
                      bgcolor: module.color,
                      width: 48,
                      height: 48
                    }}
                  >
                    <ModuleIcon />
                  </Avatar>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, module)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
                
                <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {module.name}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {module.description || 'No description available'}
                </Typography>
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Chip 
                    icon={getStatusIcon(module.status)}
                    label={module.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(module.status)}
                    size="small" 
                  />
                  <Typography variant="caption" color="text.secondary">
                    Order: {module.displayOrder}
                  </Typography>
                </Box>
                {module.hidden && (
                  <Chip label="Hidden" size="small" color="default" variant="outlined" sx={{ mt: 1 }} />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Module Form Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingModule ? 'Edit Module' : 'Add Module'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Module Key"
                value={formData.key}
                disabled
                helperText="Unique identifier"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                label="Module Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth
                label="Description" 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline 
                rows={3} 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Icon</InputLabel>
                <Select 
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                >
                  {moduleIcons.map((icon) => (
                    <MenuItem key={icon} value={icon}>
                      {icon}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Color</InputLabel>
                <Select
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                >
                  {moduleColors.map((color) => (
                    <MenuItem key={color} value={color}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            backgroundColor: color,
                            borderRadius: '50%'
                          }}
                        />
                        {color}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select 
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="coming_soon">Coming Soon</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="blocked">Blocked</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Display Order"
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={formData.hasManagerDashboard}
                    onChange={(e) => setFormData({ ...formData, hasManagerDashboard: e.target.checked })}
                  />
                }
                label="Has Manager Dashboard"
              />
            </Grid>
            {formData.status === 'maintenance' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Maintenance Message"
                  value={formData.maintenanceMessage}
                  onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
            )}
            {formData.status === 'blocked' && (
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Block Reason"
                  value={formData.blockReason}
                  onChange={(e) => setFormData({ ...formData, blockReason: e.target.value })}
                  multiline 
                  rows={2}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Module Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleEditModule(selectedModule); handleMenuClose(); }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Module</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleStatusChange(selectedModule?._id, 'active'); }}>
          <ListItemIcon>
            <PlayIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Activate</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleStatusChange(selectedModule?._id, 'maintenance', 'Under maintenance'); }}>
          <ListItemIcon>
            <PauseIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Set Maintenance</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleStatusChange(selectedModule?._id, 'blocked', 'Module blocked'); }}>
          <ListItemIcon>
            <BlockIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Block Module</ListItemText>
        </MenuItem>
        {!selectedModule?.hidden ? (
          <MenuItem onClick={() => { handleHideModule(selectedModule?._id); handleMenuClose(); }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Hide (Soft Delete)</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => { handleRestoreModule(selectedModule?._id); handleMenuClose(); }}>
            <ListItemIcon>
              <PlayIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Restore</ListItemText>
          </MenuItem>
        )}
      </Menu>

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

export default ModuleManagement