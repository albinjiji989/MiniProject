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
  Checkbox,
  Tabs,
  Tab,
  TablePagination,
  InputAdornment,
  Tooltip,
} from '@mui/material'
import AdminPageHeader from '../../components/Admin/AdminPageHeader'
import AdminActionBar from '../../components/Admin/AdminActionBar'
import AdminStatCard from '../../components/Admin/AdminStatCard'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  People as UsersIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Pets as PetsIcon,
} from '@mui/icons-material'
import { usersAPI, rolesAPI } from '../../services/api'

const UserManagement = () => {
  const [loading, setLoading] = useState(true)
  const [publicUsers, setPublicUsers] = useState([])
  const [userStats, setUserStats] = useState({})
  const [selectedUsers, setSelectedUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [userDetailsTab, setUserDetailsTab] = useState(0)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })
  
  // Pagination and filtering
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  // Dialog states
  const [userDetailsOpen, setUserDetailsOpen] = useState(false)
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false)
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userPets, setUserPets] = useState([])
  const [userActivities, setUserActivities] = useState([])
  
  // Create user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'public_user',
    address: '',
    assignedModules: [],
    isActive: true
  })
  
  // Edit user form state
  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    address: '',
    assignedModules: [],
    isActive: true
  })

  const fetchPublicUsers = async () => {
    try {
      setLoading(true)
      const response = await usersAPI.getPublicUsers({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        status: statusFilter
      })
      
      // Handle different response structures
      let users = []
      if (response.data) {
        if (response.data.data && response.data.data.users) {
          users = response.data.data.users
        } else if (response.data.users) {
          users = response.data.users
        } else if (Array.isArray(response.data)) {
          users = response.data
        }
      }
      
      // If no users found, try to get from response.data directly
      if (users.length === 0 && response.data && Array.isArray(response.data)) {
        users = response.data
      }
      
      setPublicUsers(users)
      
    } catch (error) {
      console.error('Error fetching public users:', error)
      setSnackbar({ 
        open: true, 
        message: error?.response?.data?.message || 'Failed to load users', 
        severity: 'error' 
      })
      setPublicUsers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStats = async () => {
    try {
      const response = await usersAPI.getUserStats()
      
      // Handle different response structures
      let stats = {}
      if (response.data) {
        if (response.data.data) {
          stats = response.data.data
        } else {
          stats = response.data
        }
      }
      
      // If no stats found, create default stats
      if (!stats || Object.keys(stats).length === 0) {
        stats = {
          publicUsers: 0,
          publicActiveUsers: 0,
          publicInactiveUsers: 0
        }
      }
      
      setUserStats(stats)
    } catch (error) {
      console.error('Error fetching user stats:', error)
      setUserStats({})
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await rolesAPI.list()
      setRoles(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error fetching roles:', error)
      setRoles([])
    }
  }

  const fetchUserDetails = async (userId) => {
    try {
      const [petsResponse, activitiesResponse] = await Promise.all([
        usersAPI.getUserPets(userId),
        usersAPI.getUserActivities(userId)
      ])
      
      // Handle pets response
      let pets = []
      if (petsResponse.data) {
        if (Array.isArray(petsResponse.data)) {
          pets = petsResponse.data
        } else if (petsResponse.data.pets) {
          pets = petsResponse.data.pets
        } else if (petsResponse.data.data) {
          pets = petsResponse.data.data
        }
      }
      
      // Handle activities response
      let activities = []
      if (activitiesResponse.data) {
        if (Array.isArray(activitiesResponse.data)) {
          activities = activitiesResponse.data
        } else if (activitiesResponse.data.activities) {
          activities = activitiesResponse.data.activities
        } else if (activitiesResponse.data.data) {
          activities = activitiesResponse.data.data
        }
      }
      
      
      setUserPets(pets)
      setUserActivities(activities)
    } catch (error) {
      console.error('Error fetching user details:', error)
      setUserPets([])
      setUserActivities([])
    }
  }

  useEffect(() => {
    fetchPublicUsers()
  }, [page, rowsPerPage, searchTerm, statusFilter])

  useEffect(() => {
    fetchUserStats()
    fetchRoles()
  }, [])

  const handleViewUserDetails = async (user) => {
    setSelectedUser(user)
    setUserDetailsOpen(true)
    setUserDetailsTab(0)
    await fetchUserDetails(user._id)
  }

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      setLoading(true)
      await usersAPI.toggleUserStatus(userId, !currentStatus)
      setSnackbar({ 
        open: true, 
        message: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 
        severity: 'success' 
      })
      fetchPublicUsers()
      fetchUserStats()
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Failed to update user status', 
        severity: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUserPermanent = async (userId) => {
    if (window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      try {
        setLoading(true)
        await usersAPI.deleteUserPermanent(userId)
        setSnackbar({ 
          open: true, 
          message: 'User deleted permanently', 
          severity: 'success' 
        })
        fetchPublicUsers()
        fetchUserStats()
      } catch (error) {
        setSnackbar({ 
          open: true, 
          message: 'Failed to delete user', 
          severity: 'error' 
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === (Array.isArray(publicUsers) ? publicUsers.length : 0)) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(Array.isArray(publicUsers) ? publicUsers.map(user => user._id) : [])
    }
  }

  const handleBulkUpdateStatus = async (status) => {
    if (selectedUsers.length === 0) return
    
    try {
      setLoading(true)
      await usersAPI.bulkUpdateStatus(selectedUsers, status)
      setSnackbar({ 
        open: true, 
        message: `Bulk ${status ? 'activation' : 'deactivation'} completed`, 
        severity: 'success' 
      })
      setSelectedUsers([])
      fetchPublicUsers()
      fetchUserStats()
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Failed to update user statuses', 
        severity: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return
    
    if (window.confirm(`Are you sure you want to permanently delete ${selectedUsers.length} users? This action cannot be undone.`)) {
      try {
        setLoading(true)
        await usersAPI.bulkDelete(selectedUsers)
        setSnackbar({ 
          open: true, 
          message: 'Bulk deletion completed', 
          severity: 'success' 
        })
        setSelectedUsers([])
        fetchPublicUsers()
        fetchUserStats()
      } catch (error) {
        setSnackbar({ 
          open: true, 
          message: 'Failed to delete users', 
          severity: 'error' 
      })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleCreateUser = async () => {
    try {
      if (!newUser.name || !newUser.email || !newUser.password) {
        setSnackbar({ 
          open: true, 
          message: 'Please fill in all required fields', 
          severity: 'error' 
        })
        return
      }

      setLoading(true)
      const userData = {
        ...newUser,
        role: newUser.role || 'public_user',
        isActive: newUser.isActive !== false
      }
      
      await usersAPI.createUser(userData)
      setSnackbar({ 
        open: true, 
        message: 'User created successfully', 
        severity: 'success' 
      })
      setCreateUserDialogOpen(false)
      setNewUser({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'public_user',
        address: '',
        assignedModules: [],
        isActive: true
      })
      fetchPublicUsers()
      fetchUserStats()
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error?.response?.data?.message || 'Failed to create user', 
        severity: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user) => {
    setSelectedUser(user)
    setEditUser({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || '',
      address: user.address || '',
      assignedModules: user.assignedModules || [],
      isActive: user.isActive
    })
    setEditUserDialogOpen(true)
  }

  const handleUpdateUser = async () => {
    try {
      if (!editUser.name || !editUser.email) {
        setSnackbar({ 
          open: true, 
          message: 'Please fill in all required fields', 
          severity: 'error' 
        })
        return
      }

      setLoading(true)
      const userData = {
        ...editUser,
        isActive: editUser.isActive !== false
      }
      
      await usersAPI.updateUser(selectedUser._id, userData)
      setSnackbar({ 
        open: true, 
        message: 'User updated successfully', 
        severity: 'success' 
      })
      setEditUserDialogOpen(false)
      setSelectedUser(null)
      fetchPublicUsers()
      fetchUserStats()
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error?.response?.data?.message || 'Failed to update user', 
        severity: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleRefresh = () => {
    fetchPublicUsers()
    fetchUserStats()
  }

  const handleExportUsers = () => {
    try {
      // Create CSV content
      const headers = ['Name', 'Email', 'Phone', 'Status', 'Role', 'Joined Date', 'Last Active']
      const csvContent = [
        headers.join(','),
        ...publicUsers.map(user => [
          `"${user.name || ''}"`,
          `"${user.email || ''}"`,
          `"${user.phone || ''}"`,
          `"${user.isActive !== false ? 'Active' : 'Inactive'}"`,
          `"${user.role || 'public_user'}"`,
          `"${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}"`,
          `"${user.lastActive ? new Date(user.lastActive).toLocaleDateString() : ''}"`
        ].join(','))
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setSnackbar({
        open: true,
        message: `Exported ${publicUsers.length} users successfully`,
        severity: 'success'
      })
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to export users',
        severity: 'error'
      })
    }
  }

  const getUserPetCount = async (userId) => {
    try {
      const response = await usersAPI.getUserPets(userId)
      let pets = []
      if (response.data) {
        if (Array.isArray(response.data)) {
          pets = response.data
        } else if (response.data.pets) {
          pets = response.data.pets
        } else if (response.data.data) {
          pets = response.data.data
        }
      }
      return pets.length
    } catch (error) {
      console.error('Error fetching user pets count:', error)
      return 0
    }
  }

  if (loading && (!Array.isArray(publicUsers) || publicUsers.length === 0)) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 4 }}>
          <LinearProgress />
          <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
            Loading user data...
          </Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4 }}>
        {/* Header */}
        <AdminPageHeader
          title="User Management"
          description="Manage public users, their accounts, and permissions across the Pet Welfare System"
          icon={UsersIcon}
          color="#3b82f6"
          stats={`Total Users: ${userStats.publicUsers || 0} • Active: ${userStats.publicActiveUsers || 0} • Inactive: ${userStats.publicInactiveUsers || 0}`}
        />

        {/* Action Bar */}
        <AdminActionBar
          actions={[
            {
              label: 'Refresh',
              icon: <RefreshIcon />,
              variant: 'outlined',
              onClick: handleRefresh,
              sx: { borderColor: 'success.main', color: 'success.main' }
            },
            {
              label: 'Export Users',
              icon: <DownloadIcon />,
              variant: 'outlined',
              onClick: handleExportUsers,
              sx: { borderColor: 'primary.main', color: 'primary.main' }
            },
            {
              label: 'Add New User',
              icon: <PersonAddIcon />,
              variant: 'contained',
              onClick: () => setCreateUserDialogOpen(true),
              sx: { bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }
            }
          ]}
        />

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <AdminStatCard
              title="Total Users"
              value={userStats.publicUsers || 0}
              icon={UsersIcon}
              color="#3b82f6"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AdminStatCard
              title="Active Users"
              value={userStats.publicActiveUsers || 0}
              icon={CheckCircleIcon}
              color="#22c55e"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AdminStatCard
              title="Inactive Users"
              value={userStats.publicInactiveUsers || 0}
              icon={CancelIcon}
              color="#ef4444"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AdminStatCard
              title="Total Pets"
              value={userStats.totalPets || 0}
              icon={UsersIcon}
              color="#8b5cf6"
            />
          </Grid>
        </Grid>

        {/* Search and Filter */}
        <Card sx={{ 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          mb: 3
        }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status Filter</InputLabel>
                  <Select
                    label="Status Filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="">All Users</MenuItem>
                    <MenuItem value="active">Active Only</MenuItem>
                    <MenuItem value="inactive">Inactive Only</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} md={5}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedUsers.length > 0 && (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleBulkUpdateStatus(true)}
                        sx={{ borderColor: 'success.main', color: 'success.main' }}
                      >
                        Activate ({selectedUsers.length})
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleBulkUpdateStatus(false)}
                        sx={{ borderColor: 'warning.main', color: 'warning.main' }}
                      >
                        Deactivate ({selectedUsers.length})
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={handleBulkDelete}
                      >
                        Delete ({selectedUsers.length})
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => setSelectedUsers([])}
                        sx={{ color: 'text.secondary' }}
                      >
                        Clear Selection
                      </Button>
                    </>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card sx={{ 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <UsersIcon sx={{ mr: 1 }} />
              Public Users
            </Typography>
            
            {!Array.isArray(publicUsers) || publicUsers.length === 0 ? (
              <Alert severity="info">No users found matching your criteria.</Alert>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedUsers.length === (Array.isArray(publicUsers) ? publicUsers.length : 0) && (Array.isArray(publicUsers) ? publicUsers.length : 0) > 0}
                            indeterminate={selectedUsers.length > 0 && selectedUsers.length < (Array.isArray(publicUsers) ? publicUsers.length : 0)}
                            onChange={handleSelectAllUsers}
                          />
                        </TableCell>
                        <TableCell>User</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Pets</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Array.isArray(publicUsers) ? publicUsers.map((user) => (
                        <TableRow key={user._id}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedUsers.includes(user._id)}
                              onChange={() => handleSelectUser(user._id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                  {user.name || 'Unknown'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  ID: {user._id?.slice(-8)}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{user.email || 'N/A'}</TableCell>
                          <TableCell>{user.phone || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={user.petCount || 0} 
                              size="small" 
                              color="primary"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={user.isActive !== false ? 'Active' : 'Inactive'} 
                              size="small" 
                              color={user.isActive !== false ? 'success' : 'error'}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="View Details">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleViewUserDetails(user)}
                                  sx={{ color: 'primary.main' }}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit User">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleEditUser(user)}
                                  sx={{ color: 'info.main' }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={user.isActive !== false ? 'Deactivate' : 'Activate'}>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                                  sx={{ color: user.isActive !== false ? 'warning.main' : 'success.main' }}
                                >
                                  {user.isActive !== false ? <CancelIcon /> : <CheckCircleIcon />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Permanently">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDeleteUserPermanent(user._id)}
                                  sx={{ color: 'error.main' }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )) : null}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={userStats.publicUsers || 0}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* User Details Dialog */}
      <Dialog open={userDetailsOpen} onClose={() => setUserDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>User Details - {selectedUser?.name}</DialogTitle>
        <DialogContent>
          <Tabs value={userDetailsTab} onChange={(e, v) => setUserDetailsTab(v)} sx={{ mb: 2 }}>
            <Tab label="Profile" />
            <Tab label="Pets" />
            <Tab label="Activities" />
          </Tabs>

          {userDetailsTab === 0 && selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                  <Typography variant="body1">{selectedUser.name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{selectedUser.email || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                  <Typography variant="body1">{selectedUser.phone || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={selectedUser.isActive !== false ? 'Active' : 'Inactive'} 
                    color={selectedUser.isActive !== false ? 'success' : 'error'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Joined</Typography>
                  <Typography variant="body1">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Last Active</Typography>
                  <Typography variant="body1">
                    {selectedUser.lastActive ? new Date(selectedUser.lastActive).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">User ID</Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {selectedUser._id || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Role</Typography>
                  <Chip 
                    label={selectedUser.role || 'public_user'} 
                    color="primary"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                  <Typography variant="body1">{selectedUser.address || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                    borderRadius: 2, 
                    border: '1px solid rgba(59, 130, 246, 0.2)' 
                  }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      User Statistics
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Total Pets</Typography>
                        <Typography variant="h6" color="primary.main">
                          {userPets.length}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Total Activities</Typography>
                        <Typography variant="h6" color="primary.main">
                          {userActivities.length}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {userDetailsTab === 1 && (
            <Box sx={{ mt: 2 }}>
              {userPets.length === 0 ? (
                <Alert severity="info">No pets found for this user.</Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Pet Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Breed</TableCell>
                        <TableCell>Age</TableCell>
                        <TableCell>Gender</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Added</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {userPets.map((pet) => (
                        <TableRow key={pet._id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                {pet.name?.charAt(0)?.toUpperCase() || 'P'}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {pet.name || 'Unknown'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={pet.type || 'Unknown'} size="small" color="secondary" />
                          </TableCell>
                          <TableCell>{pet.breed || 'Mixed'}</TableCell>
                          <TableCell>{pet.age ? `${pet.age} years` : 'Unknown'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={pet.gender || 'Unknown'} 
                              size="small" 
                              color={pet.gender === 'Male' ? 'info' : pet.gender === 'Female' ? 'warning' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={pet.status || 'Active'} 
                              size="small" 
                              color={pet.status === 'Active' ? 'success' : pet.status === 'Adopted' ? 'primary' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            {pet.createdAt ? new Date(pet.createdAt).toLocaleDateString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {userDetailsTab === 2 && (
            <Box sx={{ mt: 2 }}>
              {userActivities.length === 0 ? (
                <Alert severity="info">No activities found for this user.</Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Activity</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Date & Time</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {userActivities.map((activity) => (
                        <TableRow key={activity._id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {activity.description || activity.action || 'Unknown Activity'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={activity.type || 'General'} 
                              size="small" 
                              color={
                                activity.type === 'Login' ? 'success' :
                                activity.type === 'Logout' ? 'warning' :
                                activity.type === 'Profile Update' ? 'info' :
                                activity.type === 'Pet Added' ? 'primary' :
                                'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString() : 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {activity.createdAt ? new Date(activity.createdAt).toLocaleTimeString() : ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={activity.status || 'Completed'} 
                              size="small" 
                              color={activity.status === 'Success' ? 'success' : activity.status === 'Failed' ? 'error' : 'primary'}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {activity.details || activity.metadata || 'No additional details'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createUserDialogOpen} onClose={() => setCreateUserDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'grid', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Full Name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email Address"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    label="Role"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    {Array.isArray(roles) ? roles
                      .filter(role => role.isActive !== false)
                      .map((role) => (
                        <MenuItem key={role._id} value={role.name}>
                          {role.displayName || role.name}
                        </MenuItem>
                      )) : (
                        <MenuItem value="public_user">Public User</MenuItem>
                      )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    value={newUser.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setNewUser({ ...newUser, isActive: e.target.value === 'active' })}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Address"
                  multiline
                  rows={2}
                  value={newUser.address}
                  onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateUserDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateUser}
            disabled={!newUser.name || !newUser.email || !newUser.password || loading}
          >
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialogOpen} onClose={() => setEditUserDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'grid', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Full Name"
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email Address"
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number"
                  value={editUser.phone}
                  onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    label="Role"
                    value={editUser.role}
                    onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                  >
                    {Array.isArray(roles) ? roles
                      .filter(role => role.isActive !== false)
                      .map((role) => (
                        <MenuItem key={role._id} value={role.name}>
                          {role.displayName || role.name}
                        </MenuItem>
                      )) : (
                        <MenuItem value="public_user">Public User</MenuItem>
                      )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    value={editUser.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditUser({ ...editUser, isActive: e.target.value === 'active' })}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Address"
                  multiline
                  rows={2}
                  value={editUser.address}
                  onChange={(e) => setEditUser({ ...editUser, address: e.target.value })}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUserDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateUser}
            disabled={!editUser.name || !editUser.email || loading}
          >
            {loading ? 'Updating...' : 'Update User'}
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

export default UserManagement
