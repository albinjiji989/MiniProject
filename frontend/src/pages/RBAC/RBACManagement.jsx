import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
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
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'

const RBACManagement = () => {
  const { user } = useAuth()
  const [tabValue, setTabValue] = useState(0)
  const [roles, setRoles] = useState([])
  const [users, setUsers] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' })
  const [openRoleDialog, setOpenRoleDialog] = useState(false)
  const [openUserDialog, setOpenUserDialog] = useState(false)
  const [openModuleAdminDialog, setOpenModuleAdminDialog] = useState(false)
  const [openModuleStaffDialog, setOpenModuleStaffDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [roleForm, setRoleForm] = useState({
    name: '',
    displayName: '',
    description: '',
    level: 1,
    permissions: []
  })
  const [userForm, setUserForm] = useState({
    userId: '',
    role: '',
    assignedModule: '',
    supervisor: ''
  })
  const [moduleAdminForm, setModuleAdminForm] = useState({
    module: '',
    name: '',
    email: '',
    password: '',
    unitId: '',
    unitName: '',
    unitLocation: {
      addressLine1: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  })
  const [moduleStaffForm, setModuleStaffForm] = useState({
    module: '',
    name: '',
    email: '',
    password: '',
    unitId: '',
    unitName: '',
    unitLocation: {
      addressLine1: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  })

  useEffect(() => {
    fetchData()
  }, [])

  const managementModules = useMemo(() => (
    ['adoption', 'shelter', 'rescue', 'veterinary', 'ecommerce', 'pharmacy']
  ), [])

  const moduleOptions = useMemo(() => {
    if (!permissions?.length) return managementModules
    const fromPerms = Array.from(new Set(permissions.map((p) => p.module))).filter((m) => managementModules.includes(m))
    return fromPerms.length ? fromPerms : managementModules
  }, [permissions, managementModules])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [rolesRes, usersRes, permissionsRes] = await Promise.all([
        api.get('/rbac/roles'),
        api.get('/rbac/users'),
        api.get('/rbac/permissions')
      ])
      setRoles(rolesRes.data)
      setUsers(usersRes.data)
      setPermissions(permissionsRes.data)
    } catch (err) {
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRole = async () => {
    try {
      await api.post('/rbac/roles', roleForm)
      setOpenRoleDialog(false)
      setRoleForm({
        name: '',
        displayName: '',
        description: '',
        level: 1,
        permissions: []
      })
      fetchData()
      setToast({ open: true, message: 'Role created', severity: 'success' })
    } catch (err) {
      setError('Failed to create role')
      setToast({ open: true, message: 'Failed to create role', severity: 'error' })
    }
  }

  const handleUpdateRole = async () => {
    try {
      await api.put(`/rbac/roles/${selectedRole._id}`, roleForm)
      setOpenRoleDialog(false)
      setSelectedRole(null)
      fetchData()
      setToast({ open: true, message: 'Role updated', severity: 'success' })
    } catch (err) {
      setError('Failed to update role')
      setToast({ open: true, message: 'Failed to update role', severity: 'error' })
    }
  }

  const handleAssignRole = async () => {
    try {
      if (!userForm.userId || !userForm.role) {
        setToast({ open: true, message: 'User and role are required', severity: 'warning' })
        return
      }
      await api.put(`/rbac/users/${userForm.userId}/role`, userForm)
      setOpenUserDialog(false)
      setUserForm({
        userId: '',
        role: '',
        assignedModule: '',
        supervisor: ''
      })
      fetchData()
      setToast({ open: true, message: 'Role assigned', severity: 'success' })
    } catch (err) {
      setError('Failed to assign role')
      setToast({ open: true, message: 'Failed to assign role', severity: 'error' })
    }
  }

  const handleCreateModuleAdmin = async () => {
    try {
      if (!moduleAdminForm.module || !moduleAdminForm.name || !moduleAdminForm.email || !moduleAdminForm.password) {
        setToast({ open: true, message: 'Module, name, email, password are required', severity: 'warning' })
        return
      }
      const payload = {
        module: moduleAdminForm.module,
        name: moduleAdminForm.name,
        email: moduleAdminForm.email,
        password: moduleAdminForm.password,
        unitId: moduleAdminForm.unitId || undefined,
        unitName: moduleAdminForm.unitName || undefined,
        unitLocation: moduleAdminForm.unitLocation
      }
      await api.post('/rbac/users/module-admin', payload)
      setOpenModuleAdminDialog(false)
      setModuleAdminForm({
        module: '', name: '', email: '', password: '', unitId: '', unitName: '',
        unitLocation: { addressLine1: '', city: '', state: '', zipCode: '', country: '' }
      })
      fetchData()
      setToast({ open: true, message: 'Module admin created', severity: 'success' })
    } catch (err) {
      setError('Failed to create module admin')
      setToast({ open: true, message: 'Failed to create module admin', severity: 'error' })
    }
  }

  const handleCreateModuleStaff = async () => {
    try {
      if (!moduleStaffForm.module || !moduleStaffForm.name || !moduleStaffForm.email || !moduleStaffForm.password) {
        setToast({ open: true, message: 'Module, name, email, password are required', severity: 'warning' })
        return
      }
      const payload = {
        module: moduleStaffForm.module,
        name: moduleStaffForm.name,
        email: moduleStaffForm.email,
        password: moduleStaffForm.password,
        unitId: moduleStaffForm.unitId || undefined,
        unitName: moduleStaffForm.unitName || undefined,
        unitLocation: moduleStaffForm.unitLocation
      }
      await api.post('/rbac/users/module-staff', payload)
      setOpenModuleStaffDialog(false)
      setModuleStaffForm({
        module: '', name: '', email: '', password: '', unitId: '', unitName: '',
        unitLocation: { addressLine1: '', city: '', state: '', zipCode: '', country: '' }
      })
      fetchData()
      setToast({ open: true, message: 'Module staff created', severity: 'success' })
    } catch (err) {
      setError('Failed to create module staff')
      setToast({ open: true, message: 'Failed to create module staff', severity: 'error' })
    }
  }

  const getRoleColor = (role) => {
    const colors = {
      admin: 'error',
      adoption_manager: 'primary',
      shelter_manager: 'secondary',
      rescue_manager: 'warning',
      veterinary_manager: 'info',
      ecommerce_manager: 'success',
      pharmacy_manager: 'default',
      
      
    }
    return colors[role] || 'default'
  }

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rbac-tabpanel-${index}`}
      aria-labelledby={`rbac-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          RBAC Management
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Roles" icon={<SecurityIcon />} />
          <Tab label="Users" icon={<PersonIcon />} />
          <Tab label="Permissions" icon={<SettingsIcon />} />
        </Tabs>
      </Box>

      {/* Roles Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">System Roles</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenRoleDialog(true)}
          >
            Create Role
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Display Name</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Users</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role._id}>
                  <TableCell>
                    <Chip
                      label={role.name}
                      color={getRoleColor(role.name)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{role.displayName}</TableCell>
                  <TableCell>{role.level}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {role.permissions?.slice(0, 3).map((perm, index) => (
                        <Chip
                          key={index}
                          label={`${perm.module}:${perm.actions.join(',')}`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {role.permissions?.length > 3 && (
                        <Chip
                          label={`+${role.permissions.length - 3} more`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{role.assignedUsers?.length || 0}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedRole(role)
                        setRoleForm({
                          name: role.name,
                          displayName: role.displayName,
                          description: role.description,
                          level: role.level,
                          permissions: role.permissions || []
                        })
                        setOpenRoleDialog(true)
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Users Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">User Management</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenUserDialog(true)}
          >
            Assign Role
          </Button>
        </Box>

        <Box display="flex" gap={2} mb={2}>
          <Button variant="outlined" onClick={() => setOpenModuleAdminDialog(true)}>Create Module Admin</Button>
          <Button variant="outlined" onClick={() => setOpenModuleStaffDialog(true)}>Create Module Staff</Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Module</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      color={getRoleColor(user.role)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{user.assignedModule || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Active' : 'Inactive'}
                      color={user.isActive ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedUser(user)
                        setUserForm({
                          userId: user._id,
                          role: user.role,
                          assignedModule: user.assignedModule || '',
                          supervisor: user.supervisor || ''
                        })
                        setOpenUserDialog(true)
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Permissions Tab */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          System Permissions
        </Typography>
        <Grid container spacing={2}>
          {permissions.map((permission) => (
            <Grid item xs={12} sm={6} md={4} key={permission._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {permission.displayName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {permission.description}
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Chip label={permission.module} size="small" />
                    <Chip label={permission.action} size="small" color="primary" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Create/Edit Role Dialog */}
      <Dialog open={openRoleDialog} onClose={() => setOpenRoleDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRole ? 'Edit Role' : 'Create New Role'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Role Name"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Display Name"
                value={roleForm.displayName}
                onChange={(e) => setRoleForm({ ...roleForm, displayName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Level"
                type="number"
                value={roleForm.level}
                onChange={(e) => setRoleForm({ ...roleForm, level: parseInt(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRoleDialog(false)}>Cancel</Button>
          <Button
            onClick={selectedRole ? handleUpdateRole : handleCreateRole}
            variant="contained"
          >
            {selectedRole ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Role Dialog */}
      <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Role to User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>User</InputLabel>
                <Select
                  value={userForm.userId}
                  onChange={(e) => setUserForm({ ...userForm, userId: e.target.value })}
                >
                  {users.map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                >
                  {roles.map((role) => (
                    <MenuItem key={role._id} value={role.name}>
                      {role.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Assigned Module</InputLabel>
                <Select
                  value={userForm.assignedModule}
                  onChange={(e) => setUserForm({ ...userForm, assignedModule: e.target.value })}
                >
                  <MenuItem value="adoption">Adoption</MenuItem>
                  <MenuItem value="shelter">Shelter</MenuItem>
                  <MenuItem value="rescue">Rescue</MenuItem>
                  <MenuItem value="veterinary">Veterinary</MenuItem>
                  <MenuItem value="ecommerce">E-Commerce</MenuItem>
                  <MenuItem value="pharmacy">Pharmacy</MenuItem>
                  
                  
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUserDialog(false)}>Cancel</Button>
          <Button onClick={handleAssignRole} variant="contained">
            Assign Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Module Admin Dialog */}
      <Dialog open={openModuleAdminDialog} onClose={() => setOpenModuleAdminDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Module Admin</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Module</InputLabel>
                <Select
                  value={moduleAdminForm.module}
                  onChange={(e) => setModuleAdminForm({ ...moduleAdminForm, module: e.target.value })}
                >
                  <MenuItem value="adoption">Adoption</MenuItem>
                  <MenuItem value="shelter">Shelter</MenuItem>
                  <MenuItem value="rescue">Rescue</MenuItem>
                  <MenuItem value="veterinary">Veterinary</MenuItem>
                  <MenuItem value="ecommerce">E-Commerce</MenuItem>
                  <MenuItem value="pharmacy">Pharmacy</MenuItem>
                  
                  
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Name" value={moduleAdminForm.name} onChange={(e) => setModuleAdminForm({ ...moduleAdminForm, name: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Email" value={moduleAdminForm.email} onChange={(e) => setModuleAdminForm({ ...moduleAdminForm, email: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Password" type="password" value={moduleAdminForm.password} onChange={(e) => setModuleAdminForm({ ...moduleAdminForm, password: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Unit ID" value={moduleAdminForm.unitId} onChange={(e) => setModuleAdminForm({ ...moduleAdminForm, unitId: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Unit Name" value={moduleAdminForm.unitName} onChange={(e) => setModuleAdminForm({ ...moduleAdminForm, unitName: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Address Line 1" value={moduleAdminForm.unitLocation.addressLine1} onChange={(e) => setModuleAdminForm({ ...moduleAdminForm, unitLocation: { ...moduleAdminForm.unitLocation, addressLine1: e.target.value } })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="City" value={moduleAdminForm.unitLocation.city} onChange={(e) => setModuleAdminForm({ ...moduleAdminForm, unitLocation: { ...moduleAdminForm.unitLocation, city: e.target.value } })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="State" value={moduleAdminForm.unitLocation.state} onChange={(e) => setModuleAdminForm({ ...moduleAdminForm, unitLocation: { ...moduleAdminForm.unitLocation, state: e.target.value } })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Zip Code" value={moduleAdminForm.unitLocation.zipCode} onChange={(e) => setModuleAdminForm({ ...moduleAdminForm, unitLocation: { ...moduleAdminForm.unitLocation, zipCode: e.target.value } })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Country" value={moduleAdminForm.unitLocation.country} onChange={(e) => setModuleAdminForm({ ...moduleAdminForm, unitLocation: { ...moduleAdminForm.unitLocation, country: e.target.value } })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModuleAdminDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateModuleAdmin} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Create Module Staff Dialog */}
      <Dialog open={openModuleStaffDialog} onClose={() => setOpenModuleStaffDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Module Staff</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Module</InputLabel>
                <Select
                  value={moduleStaffForm.module}
                  onChange={(e) => setModuleStaffForm({ ...moduleStaffForm, module: e.target.value })}
                >
                  <MenuItem value="adoption">Adoption</MenuItem>
                  <MenuItem value="shelter">Shelter</MenuItem>
                  <MenuItem value="rescue">Rescue</MenuItem>
                  <MenuItem value="veterinary">Veterinary</MenuItem>
                  <MenuItem value="ecommerce">E-Commerce</MenuItem>
                  <MenuItem value="pharmacy">Pharmacy</MenuItem>
                  <MenuItem value="donation">Donation</MenuItem>
                  <MenuItem value="boarding">Boarding</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Name" value={moduleStaffForm.name} onChange={(e) => setModuleStaffForm({ ...moduleStaffForm, name: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Email" value={moduleStaffForm.email} onChange={(e) => setModuleStaffForm({ ...moduleStaffForm, email: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Password" type="password" value={moduleStaffForm.password} onChange={(e) => setModuleStaffForm({ ...moduleStaffForm, password: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Unit ID" value={moduleStaffForm.unitId} onChange={(e) => setModuleStaffForm({ ...moduleStaffForm, unitId: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Unit Name" value={moduleStaffForm.unitName} onChange={(e) => setModuleStaffForm({ ...moduleStaffForm, unitName: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Address Line 1" value={moduleStaffForm.unitLocation.addressLine1} onChange={(e) => setModuleStaffForm({ ...moduleStaffForm, unitLocation: { ...moduleStaffForm.unitLocation, addressLine1: e.target.value } })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="City" value={moduleStaffForm.unitLocation.city} onChange={(e) => setModuleStaffForm({ ...moduleStaffForm, unitLocation: { ...moduleStaffForm.unitLocation, city: e.target.value } })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="State" value={moduleStaffForm.unitLocation.state} onChange={(e) => setModuleStaffForm({ ...moduleStaffForm, unitLocation: { ...moduleStaffForm.unitLocation, state: e.target.value } })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Zip Code" value={moduleStaffForm.unitLocation.zipCode} onChange={(e) => setModuleStaffForm({ ...moduleStaffForm, unitLocation: { ...moduleStaffForm.unitLocation, zipCode: e.target.value } })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Country" value={moduleStaffForm.unitLocation.country} onChange={(e) => setModuleStaffForm({ ...moduleStaffForm, unitLocation: { ...moduleStaffForm.unitLocation, country: e.target.value } })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModuleStaffDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateModuleStaff} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToast((t) => ({ ...t, open: false }))} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default RBACManagement
