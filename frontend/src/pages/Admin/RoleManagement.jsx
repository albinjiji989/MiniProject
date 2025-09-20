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
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Group as GroupIcon,
  AdminPanelSettings as AdminIcon,
  BusinessCenter as BusinessIcon,
  People as PeopleIcon,
  Public as PublicIcon,
} from '@mui/icons-material'
import AdminPageHeader from '../../components/Admin/AdminPageHeader'
import AdminActionBar from '../../components/Admin/AdminActionBar'
import AdminStatCard from '../../components/Admin/AdminStatCard'
import { rolesAPI, permissionsAPI, modulesAPI, usersAPI } from '../../services/api'

const RoleManagement = () => {
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [modules, setModules] = useState([])
  const [users, setUsers] = useState([])
  
  // Dialog states
  const [createRoleDialogOpen, setCreateRoleDialogOpen] = useState(false)
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false)
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })
  
  // Form states
  const [newRole, setNewRole] = useState({
    name: '',
    displayName: '',
    description: '',
    level: 1,
    isActive: true,
    permissions: []
  })
  
  const [editRole, setEditRole] = useState({
    name: '',
    displayName: '',
    description: '',
    level: 1,
    isActive: true,
    permissions: []
  })


  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [rolesResponse, permissionsResponse, modulesResponse, usersResponse] = await Promise.all([
        rolesAPI.list(),
        permissionsAPI.list(),
        modulesAPI.list(),
        usersAPI.getUsers()
      ])
      
      const existingRoles = Array.isArray(rolesResponse.data?.data) 
        ? rolesResponse.data.data 
        : Array.isArray(rolesResponse.data) 
          ? rolesResponse.data 
          : []
      
      // Always use roles from database
      setRoles(existingRoles)
      setSnackbar({
        open: true,
        message: `Loaded ${existingRoles.length} roles from database`,
        severity: 'success'
      })
      
      setPermissions(Array.isArray(permissionsResponse.data?.data) 
        ? permissionsResponse.data.data 
        : Array.isArray(permissionsResponse.data) 
          ? permissionsResponse.data 
          : [])
      setModules(Array.isArray(modulesResponse.data?.data) 
        ? modulesResponse.data.data 
        : Array.isArray(modulesResponse.data) 
          ? modulesResponse.data 
          : [])
      setUsers(Array.isArray(usersResponse.data?.data?.users) 
        ? usersResponse.data.data.users 
        : Array.isArray(usersResponse.data?.data) 
          ? usersResponse.data.data 
          : Array.isArray(usersResponse.data) 
            ? usersResponse.data 
            : [])
    } catch (error) {
      console.error('Error fetching roles data:', error)
      setSnackbar({
        open: true,
        message: `Failed to fetch data from database: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      })
      // Don't use fallback data, show empty state
      setRoles([])
      setPermissions([])
      setModules([])
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Role management functions
  const handleCreateRole = async () => {
    try {
      setLoading(true)
      
      // Check if backend is available
      try {
        await rolesAPI.create(newRole)
        setSnackbar({
          open: true,
          message: 'Role created successfully',
          severity: 'success'
        })
        fetchData()
      } catch (apiError) {
        // Backend not available, add to local state
        const newRoleWithId = {
          ...newRole,
          _id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
        setRoles(prevRoles => [...prevRoles, newRoleWithId])
        setSnackbar({
          open: true,
          message: 'Role created locally (Backend not connected)',
          severity: 'warning'
        })
      }
      
      setCreateRoleDialogOpen(false)
      setNewRole({ name: '', displayName: '', description: '', level: 1, isActive: true, permissions: [] })
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to create role',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditRole = async () => {
    try {
      setLoading(true)
      
      // Check if backend is available
      try {
        await rolesAPI.update(selectedRole._id, editRole)
        setSnackbar({
          open: true,
          message: 'Role updated successfully',
          severity: 'success'
        })
        fetchData()
      } catch (apiError) {
        // Backend not available, update local state
        setRoles(prevRoles => 
          prevRoles.map(role => 
            role._id === selectedRole._id 
              ? { ...editRole, _id: selectedRole._id, updatedAt: new Date() }
              : role
          )
        )
        setSnackbar({
          open: true,
          message: 'Role updated locally (Backend not connected)',
          severity: 'warning'
        })
      }
      
      setEditRoleDialogOpen(false)
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update role',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRole = async (roleId) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        setLoading(true)
        
        // Check if backend is available
        try {
          await rolesAPI.delete(roleId)
          setSnackbar({
            open: true,
            message: 'Role deleted successfully',
            severity: 'success'
          })
          fetchData()
        } catch (apiError) {
          // Backend not available, update local state
          setRoles(prevRoles => prevRoles.filter(role => role._id !== roleId))
          setSnackbar({
            open: true,
            message: 'Role deleted locally (Backend not connected)',
            severity: 'warning'
          })
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Failed to delete role',
          severity: 'error'
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleTogglePermission = (permissionId) => {
    if (editRole.permissions.includes(permissionId)) {
      setEditRole({
        ...editRole,
        permissions: editRole.permissions.filter(id => id !== permissionId)
      })
    } else {
      setEditRole({
        ...editRole,
        permissions: [...editRole.permissions, permissionId]
      })
    }
  }

  const openEditDialog = (role) => {
    setSelectedRole(role)
    setEditRole({
      name: role.name || '',
      displayName: role.displayName || '',
      description: role.description || '',
      module: role.module || '',
      isActive: role.isActive !== false,
      permissions: role.permissions || []
    })
    setEditRoleDialogOpen(true)
  }

  const openPermissionsDialog = (role) => {
    setSelectedRole(role)
    setEditRole({
      ...role,
      permissions: role.permissions || []
    })
    setPermissionsDialogOpen(true)
  }

  // Statistics
  const getRoleStats = () => {
    const totalRoles = roles.length
    const activeRoles = roles.filter(role => role.isActive !== false).length
    const inactiveRoles = roles.filter(role => role.isActive === false).length
    const systemRoles = roles.filter(role => role.isSystemRole === true).length
    const customRoles = roles.filter(role => role.isSystemRole !== true).length
    
    return { totalRoles, activeRoles, inactiveRoles, systemRoles, customRoles }
  }

  const getUserCountByRole = (roleName) => {
    return users.filter(user => user.role === roleName).length
  }

  const getRolePermissions = (role) => {
    if (!role.permissions || !Array.isArray(role.permissions)) return 0
    return role.permissions.reduce((total, perm) => total + (perm.actions ? perm.actions.length : 0), 0)
  }

  const getRoleIcon = (roleName) => {
    switch (roleName) {
      case 'admin': return <AdminIcon />
      case 'public_user': return <PublicIcon />
      default: return <BusinessIcon />
    }
  }

  const getRoleColor = (roleName) => {
    switch (roleName) {
      case 'admin': return 'error'
      case 'public_user': return 'primary'
      case 'adoption_manager': return 'success'
      case 'shelter_manager': return 'info'
      case 'rescue_manager': return 'warning'
      case 'ecommerce_manager': return 'secondary'
      case 'pharmacy_manager': return 'success'
      case 'temporary_care_manager': return 'info'
      case 'veterinary_manager': return 'warning'
      default: return 'default'
    }
  }

  const stats = getRoleStats()

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <AdminPageHeader
        title="Role Management"
        subtitle="Manage system roles and permissions dynamically"
        icon={<SecurityIcon />}
      />

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <AdminStatCard
            title="Total Roles"
            value={stats.totalRoles}
            icon={SecurityIcon}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <AdminStatCard
            title="Active Roles"
            value={stats.activeRoles}
            icon={CheckCircleIcon}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <AdminStatCard
            title="Inactive Roles"
            value={stats.inactiveRoles}
            icon={CancelIcon}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <AdminStatCard
            title="System Roles"
            value={stats.systemRoles}
            icon={AdminIcon}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <AdminStatCard
            title="Custom Roles"
            value={stats.customRoles}
            icon={BusinessIcon}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Action Bar */}
      <AdminActionBar
        onRefresh={fetchData}
        onExport={() => setSnackbar({ open: true, message: 'Export functionality coming soon', severity: 'info' })}
        primaryAction={{
          label: 'Create New Role',
          icon: <AddIcon />,
          onClick: () => setCreateRoleDialogOpen(true)
        }}
      />

      {/* Roles Table */}
      <Card sx={{ 
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Role</TableCell>
                  <TableCell>Display Name</TableCell>
                  <TableCell>Level</TableCell>
                  <TableCell>Users</TableCell>
                  <TableCell>Permissions</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: `${getRoleColor(role.name)}.main` }}>
                          {getRoleIcon(role.name)}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {role.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{role.displayName || role.name}</TableCell>
                    <TableCell>
                      <Chip label={`Level ${role.level}`} size="small" color="info" />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getUserCountByRole(role.name)} 
                        size="small" 
                        color="primary" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${getRolePermissions(role)} permissions`} 
                        size="small" 
                        color="secondary" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={role.isActive !== false ? 'Active' : 'Inactive'} 
                        color={role.isActive !== false ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => openPermissionsDialog(role)}
                          color="primary"
                        >
                          <SecurityIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => openEditDialog(role)}
                          color="info"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteRole(role._id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create Role Dialog */}
      <Dialog open={createRoleDialogOpen} onClose={() => setCreateRoleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'grid', gap: 2 }}>
            <TextField
              label="Role Name"
              value={newRole.name}
              onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
              fullWidth
              required
              placeholder="e.g., veterinarian, adoption_officer"
            />
            <TextField
              label="Display Name"
              value={newRole.displayName}
              onChange={(e) => setNewRole({ ...newRole, displayName: e.target.value })}
              fullWidth
              required
              placeholder="e.g., Veterinarian, Adoption Officer"
            />
            <TextField
              label="Description"
              value={newRole.description}
              onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="Describe the role's responsibilities"
            />
            <FormControl fullWidth>
              <InputLabel>Role Level</InputLabel>
              <Select
                label="Role Level"
                value={newRole.level}
                onChange={(e) => setNewRole({ ...newRole, level: e.target.value })}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                  <MenuItem key={level} value={level}>
                    Level {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={newRole.isActive}
                  onChange={(e) => setNewRole({ ...newRole, isActive: e.target.checked })}
                />
              }
              label="Active Role"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateRoleDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateRole}
            disabled={!newRole.name || !newRole.displayName}
          >
            Create Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleDialogOpen} onClose={() => setEditRoleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Role</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'grid', gap: 2 }}>
            <TextField
              label="Role Name"
              value={editRole.name}
              onChange={(e) => setEditRole({ ...editRole, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Display Name"
              value={editRole.displayName}
              onChange={(e) => setEditRole({ ...editRole, displayName: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={editRole.description}
              onChange={(e) => setEditRole({ ...editRole, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <FormControl fullWidth>
              <InputLabel>Role Level</InputLabel>
              <Select
                label="Role Level"
                value={editRole.level}
                onChange={(e) => setEditRole({ ...editRole, level: e.target.value })}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                  <MenuItem key={level} value={level}>
                    Level {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={editRole.isActive}
                  onChange={(e) => setEditRole({ ...editRole, isActive: e.target.checked })}
                />
              }
              label="Active Role"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRoleDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleEditRole}
            disabled={!editRole.name || !editRole.displayName}
          >
            Update Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onClose={() => setPermissionsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Manage Permissions for {selectedRole?.displayName}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Available Permissions
            </Typography>
            <List>
              {permissions.map((permission) => (
                <ListItem key={permission._id}>
                  <ListItemIcon>
                    <CheckCircleIcon 
                      color={editRole.permissions?.includes(permission._id) ? 'success' : 'disabled'} 
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={permission.name}
                    secondary={permission.description}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={editRole.permissions?.includes(permission._id) || false}
                      onChange={() => handleTogglePermission(permission._id)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionsDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleEditRole}
          >
            Save Permissions
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default RoleManagement
