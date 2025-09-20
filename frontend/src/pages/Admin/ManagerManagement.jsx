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
  Avatar,
  LinearProgress,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  BusinessCenter as BusinessIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material'
import AdminPageHeader from '../../components/Admin/AdminPageHeader'
import AdminActionBar from '../../components/Admin/AdminActionBar'
import AdminStatCard from '../../components/Admin/AdminStatCard'
import { managersAPI, modulesAPI } from '../../services/api'

const ManagerManagement = () => {
  const [loading, setLoading] = useState(true)
  const [managers, setManagers] = useState([])
  const [modules, setModules] = useState([])
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedManager, setSelectedManager] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })
  
  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    assignedModule: '',
    phone: ''
  })
  
  // Verify form state
  const [verifyForm, setVerifyForm] = useState({
    email: '',
    otp: ''
  })
  
  // Dialog state for integrated flow
  const [inviteStep, setInviteStep] = useState('invite') // 'invite' or 'verify'
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    assignedModule: '',
    isActive: true
  })


  const fetchData = async () => {
    try {
      setLoading(true)
      const [managersResponse, modulesResponse] = await Promise.all([
        managersAPI.list(),
        modulesAPI.list()
      ])
      
      // Ensure data is always an array - handle different response structures
      const managersData = Array.isArray(managersResponse.data?.data?.managers) 
        ? managersResponse.data.data.managers 
        : Array.isArray(managersResponse.data?.managers) 
          ? managersResponse.data.managers 
          : Array.isArray(managersResponse.data) 
            ? managersResponse.data 
            : []
      const modulesData = Array.isArray(modulesResponse.data?.data) 
        ? modulesResponse.data.data 
        : Array.isArray(modulesResponse.data) 
          ? modulesResponse.data 
          : []
      
      setManagers(managersData)
      setModules(modulesData)
      
      setSnackbar({ 
        open: true, 
        message: `Loaded ${managersData.length} managers and ${modulesData.length} modules from database`, 
        severity: 'success' 
      })
    } catch (error) {
      console.error('Error fetching data:', error)
      setSnackbar({ 
        open: true, 
        message: 'Failed to fetch data from database', 
        severity: 'error' 
      })
      // Don't use fallback data, show empty state
      setManagers([])
      setModules([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSendInvite = async () => {
    try {
      setLoading(true)
      // This would call the invite API endpoint
      setSnackbar({ 
        open: true, 
        message: 'Invitation sent successfully', 
        severity: 'success' 
      })
      setInviteDialogOpen(false)
      setInviteForm({ email: '', name: '', assignedModule: '', phone: '' })
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Failed to send invitation', 
        severity: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    try {
      setLoading(true)
      
      // Find the selected module to get its key
      const selectedModule = modules.find(m => m._id === inviteForm.assignedModule)
      if (!selectedModule) {
        setSnackbar({ 
          open: true, 
          message: 'Please select a valid module', 
          severity: 'error' 
        })
        return
      }
      
      // Transform the data to match backend expectations
      const inviteData = {
        name: inviteForm.name,
        email: inviteForm.email,
        phone: inviteForm.phone,
        module: selectedModule.key || selectedModule.name.toLowerCase().replace(' ', '-') // Use key or generate from name
      }
      
      console.log('Sending invite data:', inviteData) // Debug log
      
      // Call the invite API endpoint
      const response = await managersAPI.invite(inviteData)
      setSnackbar({ 
        open: true, 
        message: 'OTP sent to candidate email', 
        severity: 'success' 
      })
      // Transition to OTP verification step within the same dialog
      setVerifyForm({ email: inviteForm.email, otp: '' })
      setInviteStep('verify')
    } catch (error) {
      console.error('Invite error:', error) // Debug log
      setSnackbar({ 
        open: true, 
        message: error?.response?.data?.message || 'Failed to send invite', 
        severity: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyInvite = async () => {
    try {
      setLoading(true)
      
      // Find the selected module to get its key
      const selectedModule = modules.find(m => m._id === inviteForm.assignedModule)
      if (!selectedModule) {
        setSnackbar({ 
          open: true, 
          message: 'Module information not found', 
          severity: 'error' 
        })
        return
      }
      
      // Transform the data to match backend expectations
      const verifyData = {
        email: verifyForm.email,
        module: selectedModule.key || selectedModule.name.toLowerCase().replace(' ', '-'), // Use key or generate from name
        otp: verifyForm.otp
      }
      
      console.log('Sending verify data:', verifyData) // Debug log
      
      // Call the verify API endpoint
      const response = await managersAPI.verify(verifyData)
      setSnackbar({ 
        open: true, 
        message: 'Manager verified and created successfully', 
        severity: 'success' 
      })
      // Close dialog and reset to invite step
      setInviteDialogOpen(false)
      setInviteStep('invite')
      setInviteForm({ email: '', name: '', assignedModule: '', phone: '' })
      setVerifyForm({ email: '', otp: '' })
      fetchData()
    } catch (error) {
      console.error('Verify error:', error) // Debug log
      setSnackbar({ 
        open: true, 
        message: error?.response?.data?.message || 'Failed to verify invitation', 
        severity: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditManager = (manager) => {
    setSelectedManager(manager)
    setEditForm({
      name: manager.name || '',
      email: manager.email || '',
      phone: manager.phone || '',
      assignedModule: manager.assignedModule || '',
      isActive: manager.isActive !== false
    })
    setEditDialogOpen(true)
  }

  const handleBackToInvite = () => {
    setInviteStep('invite')
    setVerifyForm({ email: '', otp: '' })
  }

  const handleCloseInviteDialog = () => {
    setInviteDialogOpen(false)
    setInviteStep('invite')
    setInviteForm({ email: '', name: '', assignedModule: '', phone: '' })
    setVerifyForm({ email: '', otp: '' })
  }

  const handleUpdateManager = async () => {
    try {
      setLoading(true)
      await managersAPI.update(selectedManager._id, editForm)
      setSnackbar({ 
        open: true, 
        message: 'Manager updated successfully', 
        severity: 'success' 
      })
      setEditDialogOpen(false)
      setSelectedManager(null)
      fetchData()
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Failed to update manager', 
        severity: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteManager = async (managerId) => {
    if (window.confirm('Are you sure you want to delete this manager?')) {
      try {
        setLoading(true)
        await managersAPI.remove(managerId)
        setSnackbar({ 
          open: true, 
          message: 'Manager deleted successfully', 
          severity: 'success' 
        })
        fetchData()
      } catch (error) {
        setSnackbar({ 
          open: true, 
          message: 'Failed to delete manager', 
          severity: 'error' 
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const getModuleName = (moduleId) => {
    const module = Array.isArray(modules) ? modules.find(m => m._id === moduleId) : null
    return module ? module.name : 'Unknown Module'
  }

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 4 }}>
          <LinearProgress />
          <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
            Loading manager data...
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
          title="Manager Management"
          description="Manage module managers, their permissions, and assigned modules across the system"
          icon={BusinessIcon}
          color="#f59e0b"
          stats={`Total Managers: ${Array.isArray(managers) ? managers.length : 0} • Active: ${Array.isArray(managers) ? managers.filter(m => m.isActive !== false).length : 0} • Available Modules: ${Array.isArray(modules) ? modules.length : 0}`}
        />

        {/* Action Bar */}
        <AdminActionBar
          actions={[
            {
              label: 'Invite Manager',
              icon: <PersonAddIcon />,
              variant: 'outlined',
              onClick: () => setInviteDialogOpen(true),
              sx: { borderColor: 'primary.main', color: 'primary.main' }
            },
            {
              label: 'Verify Invitation',
              icon: <CheckCircleIcon />,
              variant: 'contained',
              onClick: () => setVerifyDialogOpen(true),
              sx: { bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }
            }
          ]}
        />

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <AdminStatCard
              title="Total Managers"
              value={Array.isArray(managers) ? managers.length : 0}
              icon={BusinessIcon}
              color="#f59e0b"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AdminStatCard
              title="Active Managers"
              value={Array.isArray(managers) ? managers.filter(m => m.isActive !== false).length : 0}
              icon={CheckCircleIcon}
              color="#22c55e"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AdminStatCard
              title="Inactive Managers"
              value={Array.isArray(managers) ? managers.filter(m => m.isActive === false).length : 0}
              icon={CancelIcon}
              color="#ef4444"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AdminStatCard
              title="Available Modules"
              value={Array.isArray(modules) ? modules.length : 0}
              icon={BusinessIcon}
              color="#8b5cf6"
            />
          </Grid>
        </Grid>

        {/* Managers Table */}
        <Card sx={{ 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <BusinessIcon sx={{ mr: 1 }} />
              Module Managers
            </Typography>
            
            {!Array.isArray(managers) || managers.length === 0 ? (
              <Alert severity="info">No managers found. Invite your first manager to get started.</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Manager</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Assigned Module</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(managers) ? managers.map((manager) => (
                      <TableRow key={manager._id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                              {manager.name?.charAt(0)?.toUpperCase() || 'M'}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {manager.name || 'Unknown'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                ID: {manager._id?.slice(-8)}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{manager.email || 'N/A'}</TableCell>
                        <TableCell>{manager.phone || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={getModuleName(manager.assignedModule)} 
                            size="small" 
                            color="primary"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={manager.isActive !== false ? 'Active' : 'Inactive'} 
                            size="small" 
                            color={manager.isActive !== false ? 'success' : 'error'}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditManager(manager)}
                              sx={{ color: 'primary.main' }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteManager(manager._id)}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )) : null}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Invite Manager Dialog - Integrated Flow */}
      <Dialog open={inviteDialogOpen} onClose={handleCloseInviteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {inviteStep === 'invite' ? 'Invite Module Manager' : 'Verify OTP'}
        </DialogTitle>
        <DialogContent>
          {inviteStep === 'invite' ? (
            <Box sx={{ mt: 2, display: 'grid', gap: 2 }}>
              <TextField
                label="Manager Name"
                value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Email Address"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Phone Number"
                value={inviteForm.phone}
                onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                fullWidth
              />
              <FormControl fullWidth required>
                <InputLabel>Assigned Module</InputLabel>
                <Select
                  label="Assigned Module"
                  value={inviteForm.assignedModule}
                  onChange={(e) => setInviteForm({ ...inviteForm, assignedModule: e.target.value })}
                >
                  {(Array.isArray(modules) && modules.length > 0) ? modules.map((module) => (
                    <MenuItem key={module._id} value={module._id}>
                      {module.name}
                    </MenuItem>
                  )) : (
                    <MenuItem disabled>No modules available</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Box>
          ) : (
            <Box sx={{ mt: 2, display: 'grid', gap: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                OTP has been sent to <strong>{inviteForm.email}</strong>. Please check your email and enter the OTP below.
              </Alert>
              <TextField
                label="Email Address"
                type="email"
                value={verifyForm.email}
                onChange={(e) => setVerifyForm({ ...verifyForm, email: e.target.value })}
                fullWidth
                required
                disabled
              />
              <TextField
                label="OTP Code"
                value={verifyForm.otp}
                onChange={(e) => setVerifyForm({ ...verifyForm, otp: e.target.value })}
                fullWidth
                required
                placeholder="Enter 6-digit OTP"
                inputProps={{ maxLength: 6 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {inviteStep === 'invite' ? (
            <>
              <Button onClick={handleCloseInviteDialog}>Cancel</Button>
              <Button 
                variant="contained" 
                onClick={handleInvite}
                disabled={!inviteForm.name || !inviteForm.email || !inviteForm.assignedModule}
              >
                Send Invitation
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleBackToInvite}>Back</Button>
              <Button onClick={handleCloseInviteDialog}>Cancel</Button>
              <Button 
                variant="contained" 
                onClick={handleVerifyInvite}
                disabled={!verifyForm.email || !verifyForm.otp}
              >
                Verify & Create Manager
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>


      {/* Edit Manager Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Manager</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'grid', gap: 2 }}>
            <TextField
              label="Manager Name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Email Address"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Phone Number"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth required>
              <InputLabel>Assigned Module</InputLabel>
              <Select
                label="Assigned Module"
                value={editForm.assignedModule}
                onChange={(e) => setEditForm({ ...editForm, assignedModule: e.target.value })}
              >
                {(Array.isArray(modules) && modules.length > 0) ? modules.map((module) => (
                  <MenuItem key={module._id} value={module._id}>
                    {module.name}
                  </MenuItem>
                )) : (
                  <MenuItem disabled>No modules available</MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateManager}
            disabled={!editForm.name || !editForm.email || !editForm.assignedModule}
          >
            Update Manager
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

export default ManagerManagement
