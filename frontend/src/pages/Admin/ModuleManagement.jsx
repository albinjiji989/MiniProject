import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
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
  LinearProgress,
  Chip,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Business as ModuleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material'
import AdminPageHeader from '../../components/Admin/AdminPageHeader'
import AdminActionBar from '../../components/Admin/AdminActionBar'
import AdminStatCard from '../../components/Admin/AdminStatCard'
import { modulesAPI } from '../../services/api'

const ModuleManagement = () => {
  const [loading, setLoading] = useState(true)
  const [modules, setModules] = useState([])
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })
  
  // Dialog states
  const [manageModulesOpen, setManageModulesOpen] = useState(false)
  const [moduleDialogTab, setModuleDialogTab] = useState(0)
  const [editModuleDialog, setEditModuleDialog] = useState({ open: false, module: null })
  const [moduleStatusDialog, setModuleStatusDialog] = useState({ open: false, module: null, status: '', message: '' })
  
  // Form states
  const [newModule, setNewModule] = useState({
    key: '',
    name: '',
    description: '',
    icon: 'Business',
    color: '#64748b',
    status: 'coming_soon',
    hasManagerDashboard: false,
    isCoreModule: false
  })
  
  const [editModule, setEditModule] = useState({
    name: '',
    description: '',
    icon: 'Business',
    color: '#64748b',
    status: 'coming_soon',
    hasManagerDashboard: false,
    isCoreModule: false
  })

  const fetchModules = async () => {
    try {
      setLoading(true)
      const response = await modulesAPI.list()
      // Ensure modules is always an array - handle different response structures
      const modulesData = Array.isArray(response.data?.data) 
        ? response.data.data 
        : Array.isArray(response.data) 
          ? response.data 
          : []
      setModules(modulesData)
    } catch (error) {
      console.error('Error fetching modules:', error)
      setSnackbar({ 
        open: true, 
        message: 'Failed to load modules', 
        severity: 'error' 
      })
      // Set empty array on error to prevent filter errors
      setModules([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModules()
  }, [])

  const createNewModule = async () => {
    try {
      setLoading(true)
      await modulesAPI.create(newModule)
      setSnackbar({ open: true, message: 'New module created successfully', severity: 'success' })
      setNewModule({
        key: '',
        name: '',
        description: '',
        icon: 'Business',
        color: '#64748b',
        status: 'coming_soon',
        hasManagerDashboard: false,
        isCoreModule: false
      })
      setModuleDialogTab(0)
      fetchModules()
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error?.response?.data?.message || 'Failed to create module', 
        severity: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const updateModule = async () => {
    try {
      setLoading(true)
      await modulesAPI.update(editModuleDialog.module._id, editModule)
      setSnackbar({ open: true, message: 'Module updated successfully', severity: 'success' })
      setEditModuleDialog({ open: false, module: null })
      setEditModule({
        name: '',
        description: '',
        icon: 'Business',
        color: '#64748b',
        status: 'coming_soon',
        hasManagerDashboard: false,
        isCoreModule: false
      })
      fetchModules()
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error?.response?.data?.message || 'Failed to update module', 
        severity: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const updateModuleStatus = async (moduleId, status, message = '') => {
    try {
      setLoading(true)
      await modulesAPI.updateStatus(moduleId, status, message)
      setSnackbar({ open: true, message: 'Module status updated successfully', severity: 'success' })
      setModuleStatusDialog({ open: false, module: null, status: '', message: '' })
      fetchModules()
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error?.response?.data?.message || 'Failed to update module status', 
        severity: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteModule = async (moduleId) => {
    if (window.confirm('Are you sure you want to delete this module?')) {
      try {
        setLoading(true)
        await modulesAPI.delete(moduleId)
        setSnackbar({ open: true, message: 'Module deleted successfully', severity: 'success' })
        fetchModules()
      } catch (error) {
        setSnackbar({ 
          open: true, 
          message: error?.response?.data?.message || 'Failed to delete module', 
          severity: 'error' 
      })
      } finally {
        setLoading(false)
      }
    }
  }

  const editModuleHandler = (module) => {
    setEditModule({
      name: module.name,
      description: module.description || '',
      icon: module.icon || 'Business',
      color: module.color || '#64748b',
      status: module.status || 'coming_soon',
      hasManagerDashboard: module.hasManagerDashboard || false,
      isCoreModule: module.isCoreModule || false
    })
    setEditModuleDialog({ open: true, module })
  }

  const getModuleStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success'
      case 'blocked': return 'error'
      case 'maintenance': return 'warning'
      case 'coming_soon': return 'default'
      default: return 'default'
    }
  }

  const getModuleStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active'
      case 'blocked': return 'Blocked'
      case 'maintenance': return 'Maintenance'
      case 'coming_soon': return 'Coming Soon'
      default: return 'Unknown'
    }
  }

  const getModuleStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircleIcon />
      case 'blocked': return <CancelIcon />
      case 'maintenance': return <WarningIcon />
      case 'coming_soon': return <ScheduleIcon />
      default: return <ModuleIcon />
    }
  }

  if (loading && (!modules || modules.length === 0)) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 4 }}>
          <LinearProgress />
          <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
            Loading module data...
          </Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4 }}>
        {/* Page Header */}
        <AdminPageHeader
          title="Module Management"
          description="Configure system modules, manage their status, and control module availability across the platform"
          icon={ModuleIcon}
          color="#22c55e"
          stats={`Total Modules: ${modules?.length || 0} • Active: ${modules?.filter(m => m.status === 'active')?.length || 0} • In Maintenance: ${modules?.filter(m => m.status === 'maintenance')?.length || 0}`}
        />

        {/* Action Bar */}
        <AdminActionBar
          actions={[
            {
              label: 'Add New Module',
              icon: <AddIcon />,
              variant: 'outlined',
              onClick: () => { setModuleDialogTab(1); setManageModulesOpen(true) },
              sx: { borderColor: 'primary.main', color: 'primary.main' }
            },
            {
              label: 'Manage Existing',
              icon: <SettingsIcon />,
              variant: 'contained',
              onClick: () => { setModuleDialogTab(0); setManageModulesOpen(true) },
              sx: { bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }
            }
          ]}
        />

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <AdminStatCard
              title="Total Modules"
              value={modules?.length || 0}
              icon={ModuleIcon}
              color="#8b5cf6"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AdminStatCard
              title="Active Modules"
              value={modules?.filter(m => m.status === 'active')?.length || 0}
              icon={CheckCircleIcon}
              color="#22c55e"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AdminStatCard
              title="In Maintenance"
              value={modules?.filter(m => m.status === 'maintenance')?.length || 0}
              icon={WarningIcon}
              color="#f59e0b"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AdminStatCard
              title="Coming Soon"
              value={modules?.filter(m => m.status === 'coming_soon')?.length || 0}
              icon={ScheduleIcon}
              color="#06b6d4"
            />
          </Grid>
        </Grid>

        {/* Modules Grid */}
        <Card sx={{ 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <ModuleIcon sx={{ mr: 1 }} />
              System Modules
            </Typography>
            
            {(!modules || modules.length === 0) ? (
              <Alert severity="info">No modules found. Create your first module to get started.</Alert>
            ) : (
              <Grid container spacing={3}>
                {modules?.map((module) => (
                  <Grid item xs={12} sm={6} md={4} key={module._id || module.key}>
                    <Card sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 2,
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': { transform: 'translateY(-4px)' }
                    }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ 
                              p: 1, 
                              borderRadius: '50%', 
                              backgroundColor: `${module.color}20`,
                              color: module.color,
                              mr: 2
                            }}>
                              {getModuleStatusIcon(module.status)}
                            </Box>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                {module.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {module.key}
                              </Typography>
                            </Box>
                          </Box>
                          <Chip 
                            size="small" 
                            label={getModuleStatusText(module.status)} 
                            color={getModuleStatusColor(module.status)}
                          />
                        </Box>
                        
                        {module.description && (
                          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                            {module.description}
                          </Typography>
                        )}
                        
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          {module.hasManagerDashboard && (
                            <Chip label="Manager Dashboard" size="small" color="info" />
                          )}
                          {module.isCoreModule && (
                            <Chip label="Core Module" size="small" color="warning" />
                          )}
                        </Box>
                        
                        {module.status === 'maintenance' && module.maintenanceMessage && (
                          <Alert severity="warning" sx={{ mb: 2, fontSize: '0.75rem' }}>
                            {module.maintenanceMessage}
                          </Alert>
                        )}
                        
                        {module.status === 'blocked' && module.blockReason && (
                          <Alert severity="error" sx={{ mb: 2, fontSize: '0.75rem' }}>
                            {module.blockReason}
                          </Alert>
                        )}
                        
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button 
                            size="small" 
                            startIcon={<EditIcon />}
                            onClick={() => editModuleHandler(module)}
                            variant="outlined"
                          >
                            Edit
                          </Button>
                          <Button 
                            size="small" 
                            startIcon={<SettingsIcon />}
                            onClick={() => {
                              setModuleStatusDialog({ 
                                open: true, 
                                module, 
                                status: module.status || 'coming_soon',
                                message: module.maintenanceMessage || module.blockReason || ''
                              });
                            }}
                            variant="outlined"
                          >
                            Status
                          </Button>
                          {!module.isCoreModule && (
                            <Button 
                              size="small" 
                              startIcon={<DeleteIcon />}
                              color="error"
                              onClick={() => deleteModule(module._id)}
                              variant="outlined"
                            >
                              Delete
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Module Management Dialog */}
      <Dialog open={manageModulesOpen} onClose={() => setManageModulesOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Module Management</DialogTitle>
        <DialogContent>
          <Tabs value={moduleDialogTab} onChange={(e, v) => setModuleDialogTab(v)} sx={{ mb: 2 }}>
            <Tab label="Manage Existing" />
            <Tab label="Add New Module" />
          </Tabs>

          {moduleDialogTab === 0 && (
            <Box>
              {(!modules || modules.length === 0) ? (
                <Typography variant="body2" color="text.secondary">No modules found.</Typography>
              ) : (
                <Grid container spacing={2}>
                  {modules?.map((m) => (
                    <Grid item xs={12} sm={6} key={m._id || m.key}>
                      <Card sx={{ 
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 2
                      }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="subtitle1">{m.name}</Typography>
                              <Typography variant="body2" color="text.secondary">{m.key}</Typography>
                            </Box>
                            <Chip size="small" label={m.status || 'coming_soon'} color={m.status === 'active' ? 'success' : (m.status === 'blocked' ? 'error' : (m.status === 'maintenance' ? 'warning' : 'default'))} />
                          </Box>
                          {m.description && (
                            <Typography variant="body2" sx={{ mt: 1 }}>{m.description}</Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {moduleDialogTab === 1 && (
            <Box component="form" sx={{ mt: 1, display: 'grid', gap: 2 }} onSubmit={(e)=>{ e.preventDefault(); createNewModule(); }}>
              <TextField label="Key" value={newModule.key} onChange={(e)=>setNewModule({ ...newModule, key: e.target.value })} fullWidth required />
              <TextField label="Name" value={newModule.name} onChange={(e)=>setNewModule({ ...newModule, name: e.target.value })} fullWidth required />
              <TextField label="Description" value={newModule.description} onChange={(e)=>setNewModule({ ...newModule, description: e.target.value })} fullWidth multiline rows={3} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Icon</InputLabel>
                    <Select label="Icon" value={newModule.icon} onChange={(e)=>setNewModule({ ...newModule, icon: e.target.value })}>
                      <MenuItem value="Business">Business</MenuItem>
                      <MenuItem value="Pets">Pets</MenuItem>
                      <MenuItem value="Store">Store</MenuItem>
                      <MenuItem value="LocalHospital">Hospital</MenuItem>
                      <MenuItem value="Home">Home</MenuItem>
                      <MenuItem value="VolunteerActivism">Volunteer</MenuItem>
                      <MenuItem value="ShoppingCart">Shopping</MenuItem>
                      <MenuItem value="Medication">Medication</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Color" type="color" value={newModule.color} onChange={(e)=>setNewModule({ ...newModule, color: e.target.value })} fullWidth />
                </Grid>
              </Grid>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={newModule.status} onChange={(e)=>setNewModule({ ...newModule, status: e.target.value })}>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="coming_soon">Coming Soon</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="blocked">Blocked</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel control={<Switch checked={!!newModule.hasManagerDashboard} onChange={(e)=>setNewModule({ ...newModule, hasManagerDashboard: e.target.checked })} />} label="Has Manager Dashboard" />
              <FormControlLabel control={<Switch checked={!!newModule.isCoreModule} onChange={(e)=>setNewModule({ ...newModule, isCoreModule: e.target.checked })} />} label="Core Module" />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManageModulesOpen(false)}>Close</Button>
          {moduleDialogTab === 1 && (
            <Button variant="contained" onClick={createNewModule}>Create</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit Module Dialog */}
      <Dialog open={editModuleDialog.open} onClose={() => setEditModuleDialog({ open: false, module: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Module</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1, display: 'grid', gap: 2 }}>
            <TextField 
              label="Name" 
              value={editModule.name} 
              onChange={(e) => setEditModule({ ...editModule, name: e.target.value })} 
              fullWidth 
              required 
            />
            <TextField 
              label="Description" 
              value={editModule.description} 
              onChange={(e) => setEditModule({ ...editModule, description: e.target.value })} 
              fullWidth 
              multiline 
              rows={3} 
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Icon</InputLabel>
                  <Select 
                    label="Icon" 
                    value={editModule.icon} 
                    onChange={(e) => setEditModule({ ...editModule, icon: e.target.value })}
                  >
                    <MenuItem value="Business">Business</MenuItem>
                    <MenuItem value="Pets">Pets</MenuItem>
                    <MenuItem value="Store">Store</MenuItem>
                    <MenuItem value="LocalHospital">Hospital</MenuItem>
                    <MenuItem value="Home">Home</MenuItem>
                    <MenuItem value="VolunteerActivism">Volunteer</MenuItem>
                    <MenuItem value="ShoppingCart">Shopping</MenuItem>
                    <MenuItem value="Medication">Medication</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="Color" 
                  type="color" 
                  value={editModule.color} 
                  onChange={(e) => setEditModule({ ...editModule, color: e.target.value })} 
                  fullWidth 
                />
              </Grid>
            </Grid>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select 
                label="Status" 
                value={editModule.status} 
                onChange={(e) => setEditModule({ ...editModule, status: e.target.value })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="blocked">Blocked</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="coming_soon">Coming Soon</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch 
                  checked={editModule.hasManagerDashboard} 
                  onChange={(e) => setEditModule({ ...editModule, hasManagerDashboard: e.target.checked })}
                />
              }
              label="Has Manager Dashboard"
            />
            <FormControlLabel
              control={
                <Switch 
                  checked={editModule.isCoreModule} 
                  onChange={(e) => setEditModule({ ...editModule, isCoreModule: e.target.checked })}
                />
              }
              label="Core Module"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModuleDialog({ open: false, module: null })}>Cancel</Button>
          <Button variant="contained" onClick={updateModule}>Update</Button>
        </DialogActions>
      </Dialog>

      {/* Module Status Management Dialog */}
      <Dialog open={moduleStatusDialog.open} onClose={() => setModuleStatusDialog({ open: false, module: null, status: '', message: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Change Module Status</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'grid', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Module: <strong>{moduleStatusDialog.module?.name}</strong>
            </Typography>
            <FormControl fullWidth>
              <InputLabel>New Status</InputLabel>
              <Select 
                label="New Status" 
                value={moduleStatusDialog.status} 
                onChange={(e) => setModuleStatusDialog({ ...moduleStatusDialog, status: e.target.value })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="blocked">Blocked</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="coming_soon">Coming Soon</MenuItem>
              </Select>
            </FormControl>
            {(moduleStatusDialog.status === 'maintenance' || moduleStatusDialog.status === 'blocked') && (
              <TextField 
                label={moduleStatusDialog.status === 'maintenance' ? 'Maintenance Message' : 'Block Reason'} 
                value={moduleStatusDialog.message} 
                onChange={(e) => setModuleStatusDialog({ ...moduleStatusDialog, message: e.target.value })} 
                fullWidth 
                multiline 
                rows={3} 
                required 
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModuleStatusDialog({ open: false, module: null, status: '', message: '' })}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => updateModuleStatus(moduleStatusDialog.module._id, moduleStatusDialog.status, moduleStatusDialog.message)}
            disabled={!moduleStatusDialog.status || ((moduleStatusDialog.status === 'maintenance' || moduleStatusDialog.status === 'blocked') && !moduleStatusDialog.message)}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  )
}

export default ModuleManagement
