import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
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
  Avatar,
  LinearProgress,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  AppBar,
  Toolbar,
  Drawer,
  ListItemButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  TablePagination,
  InputAdornment,
  Tooltip,
  Fab,
} from '@mui/material'
import {
  AdminPanelSettings as SuperAdminIcon,
  People as UsersIcon,
  Business as ModuleIcon,
  TrendingUp as StatsIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PersonAdd as PersonAddIcon,
  BusinessCenter as BusinessIcon,
  Assessment as ReportIcon,
  Notifications as NotificationIcon,
  Storage as DatabaseIcon,
  CloudUpload as BackupIcon,
  Shield as SecurityShieldIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  Home as HomeIcon,
  Favorite as AdoptionIcon,
  LocalHospital as VeterinaryIcon,
  ShoppingCart as EcommerceIcon,
  LocalPharmacy as PharmacyIcon,
  Report as RescueIcon,
  Pets as ShelterIcon,
  Favorite as CareIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    moduleAdmins: 0,
    activeModules: 0,
    systemHealth: 100
  })
  const [recentUsers, setRecentUsers] = useState([])
  const [systemLogs, setSystemLogs] = useState([])
  const [modules, setModules] = useState([])
  const [tabValue, setTabValue] = useState(0)
  const [showAdminManagement, setShowAdminManagement] = useState(false)
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [openAdminDialog, setOpenAdminDialog] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [invite, setInvite] = useState({ name: '', email: '', phone: '', module: '' })
  const [otpPayload, setOtpPayload] = useState({ email: '', module: '', otp: '' })
  const [newAdmin, setNewAdmin] = useState({})
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch real data from backend
      const [usersRes, rolesRes, logsRes] = await Promise.all([
        api.get('/rbac/users'),
        api.get('/rbac/roles'),
        api.get('/core/logs').catch(() => ({ data: [] })) // Handle if logs endpoint doesn't exist
      ])
      
      const users = usersRes.data.data?.users || []
      const roles = rolesRes.data || []
      
      // Calculate real statistics
      const totalUsers = users.length
      const moduleAdmins = users.filter(u => u.role && u.role.includes('_admin')).length
      const activeModules = roles.filter(r => r.isActive).length
      
      setStats({
        totalUsers,
        moduleAdmins,
        activeModules,
        systemHealth: 100 // This could be calculated based on system metrics
      })
      
      // Get recent users (last 5)
      const recentUsersData = users
        .sort((a, b) => new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt))
        .slice(0, 5)
        .map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          assignedModule: user.assignedModule,
          isActive: user.isActive
        }))
      
      setRecentUsers(recentUsersData)
      
      // Get system logs (if available)
      const logsArray = logsRes.data.logs || logsRes.data || []
      const logsData = logsArray.slice(0, 10).map(log => ({
        id: log._id,
        message: log.message || log.action || log.description || 'System event',
        timestamp: log.timestamp || log.createdAt
      }))
      
      setSystemLogs(logsData)
      
      // Calculate module statistics from real user data
      const moduleStats = calculateModuleStats(users)
      setModules(moduleStats)
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Set default values on error
      setStats({
        totalUsers: 0,
        moduleAdmins: 0,
        activeModules: 0,
        systemHealth: 0
      })
      setRecentUsers([])
      setSystemLogs([])
      setModules([])
    } finally {
      setLoading(false)
    }
  }

  const calculateModuleStats = (users) => {
    const moduleDefinitions = [
      { name: 'Adoption', key: 'adoption', icon: <AdoptionIcon />, color: '#4caf50' },
      { name: 'Shelter', key: 'shelter', icon: <ShelterIcon />, color: '#2196f3' },
      { name: 'Rescue', key: 'rescue', icon: <RescueIcon />, color: '#ff9800' },
      { name: 'Veterinary', key: 'veterinary', icon: <VeterinaryIcon />, color: '#9c27b0' },
      { name: 'E-commerce', key: 'ecommerce', icon: <EcommerceIcon />, color: '#f44336' },
      { name: 'Pharmacy', key: 'pharmacy', icon: <PharmacyIcon />, color: '#00bcd4' },
      
      
      { name: 'Temporary Care', key: 'temporary-care', icon: <CareIcon />, color: '#e91e63' }
    ]

    return moduleDefinitions.map(module => {
      const adminCount = users.filter(user => 
        user.role === `${module.key}_admin` && user.isActive
      ).length
      
      return {
        ...module,
        adminCount,
        status: adminCount > 0 ? 'Active' : 'Inactive'
      }
    })
  }

  const handleCreateAdmin = async () => {
    try {
      const response = await api.post('/admin/create-module-admin', newAdmin)
      setSnackbar({ open: true, message: 'Module admin created successfully!', severity: 'success' })
      setOpenAdminDialog(false)
      setNewAdmin({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: '',
        assignedModule: '',
        storeName: '',
        storeLocation: {
          addressLine1: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'India'
        },
        storeDetails: {
          phone: '',
          email: '',
          capacity: 0,
          services: []
        }
      })
      fetchDashboardData() // Refresh data
    } catch (error) {
      setSnackbar({ open: true, message: 'Error creating module admin', severity: 'error' })
      console.error('Error creating admin:', error)
    }
  }

  const sendInvite = async () => {
    try {
      await api.post('/admin/invite-module-admin', invite)
      setSnackbar({ open: true, message: 'OTP sent to candidate email', severity: 'success' })
      setInviteDialogOpen(false)
      setOtpPayload({ email: invite.email, module: invite.module, otp: '' })
      setVerifyDialogOpen(true)
    } catch (e) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Failed to send invite', severity: 'error' })
    }
  }

  const verifyInvite = async () => {
    try {
      await api.post('/admin/verify-module-admin', otpPayload)
      setSnackbar({ open: true, message: 'Module admin created and credentials emailed', severity: 'success' })
      setVerifyDialogOpen(false)
      setInvite({ name: '', email: '', phone: '', module: '' })
      fetchDashboardData()
    } catch (e) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Verification failed', severity: 'error' })
    }
  }

  const handleLogout = () => {
    logout()
  }


  const sidebarItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, action: () => setTabValue(0) },
    { text: 'Admin Management', icon: <SuperAdminIcon />, action: () => setTabValue(1) },
    { text: 'User Management', icon: <UsersIcon />, action: () => setTabValue(2) },
    { text: 'Module Management', icon: <ModuleIcon />, action: () => setTabValue(3) },
    { text: 'System Logs', icon: <HistoryIcon />, action: () => setTabValue(4) },
    { text: 'Invite Module Admin (OTP)', icon: <PersonAddIcon />, action: () => setInviteDialogOpen(true) },
    { text: 'System Settings', icon: <SettingsIcon />, action: () => {} },
    { text: 'Reports', icon: <ReportIcon />, action: () => {} }
  ]

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${color}15, ${color}05)` }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: color, mr: 2 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: color }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Navigation Bar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={() => setDrawerOpen(true)}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Pet Welfare Management System - Super Admin
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">
              Welcome, {user?.name || 'Super Admin'}
            </Typography>
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            mt: 8
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <SuperAdminIcon sx={{ mr: 1, color: 'primary.main' }} />
            Super Admin Panel
          </Typography>
          <List>
            {sidebarItems.map((item, index) => (
              <ListItem key={index} disablePadding>
                <ListItemButton onClick={item.action}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Container maxWidth="xl">
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center' }}>
              <SuperAdminIcon sx={{ mr: 2, color: 'primary.main' }} />
              Super Admin Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              System overview and management controls
            </Typography>
          </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<UsersIcon />}
            color="#4caf50"
            subtitle="Across all modules"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Module Admins"
            value={stats.moduleAdmins}
            icon={<ModuleIcon />}
            color="#2196f3"
            subtitle="Active administrators"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Modules"
            value={stats.activeModules}
            icon={<StatsIcon />}
            color="#ff9800"
            subtitle="Management systems"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="System Health"
            value={`${stats.systemHealth}%`}
            icon={<SecurityIcon />}
            color="#4caf50"
            subtitle="All systems operational"
          />
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Card sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="System Overview" />
          <Tab label="Admin Management" />
          <Tab label="User Management" />
          <Tab label="Module Management" />
          <Tab label="System Logs" />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Module Status */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                  <ModuleIcon sx={{ mr: 1 }} />
                  Module Status Overview
                </Typography>
                <Grid container spacing={2}>
                  {modules.map((module, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card variant="outlined" sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: module.color, mr: 2, width: 40, height: 40 }}>
                            {module.icon}
                          </Avatar>
                          <Box>
                            <Typography variant="h6">{module.name}</Typography>
                            <Chip 
                              label={module.status} 
                              size="small" 
                              color="success" 
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {module.adminCount} Admin{module.adminCount !== 1 ? 's' : ''}
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                  <SettingsIcon sx={{ mr: 1 }} />
                  Quick Actions
                </Typography>
                <List>
                  <ListItem button onClick={() => setInviteDialogOpen(true)}>
                    <ListItemIcon>
                      <PersonAddIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Invite Module Admin (OTP)" />
                  </ListItem>
                  <ListItem button>
                    <ListItemIcon>
                      <SecurityIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Manage Permissions" />
                  </ListItem>
                  <ListItem button>
                    <ListItemIcon>
                      <ReportIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Generate Reports" />
                  </ListItem>
                  <ListItem button>
                    <ListItemIcon>
                      <BackupIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="System Backup" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <SuperAdminIcon sx={{ mr: 1 }} />
              Admin Management
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<SuperAdminIcon />}
                onClick={() => setOpenAdminDialog(true)}
                sx={{ mb: 2 }}
              >
                Create Module Admin
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Module</TableCell>
                    <TableCell>Store/Location</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentUsers.filter(user => user.role.includes('admin')).map((user, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            {user.name.charAt(0)}
                          </Avatar>
                          {user.name}
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.role.replace('_', ' ')} 
                          color="primary" 
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{user.assignedModule || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.isActive ? 'Active' : 'Inactive'} 
                          color={user.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" color="primary">
                          <SettingsIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Invite Module Admin Dialog */}
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Module Admin (OTP)</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField label="Full Name" fullWidth value={invite.name} onChange={(e)=>setInvite({...invite, name: e.target.value})} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Email" type="email" fullWidth value={invite.email} onChange={(e)=>setInvite({...invite, email: e.target.value})} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Phone (+91)" fullWidth value={invite.phone} onChange={(e)=>setInvite({...invite, phone: e.target.value})} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Module</InputLabel>
                <Select label="Module" value={invite.module} onChange={(e)=>setInvite({...invite, module: e.target.value})}>
                  {['adoption','shelter','rescue','ecommerce','pharmacy','boarding','temporary-care','veterinary','donation'].map(m=> (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setInviteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={sendInvite} disabled={!invite.name || !invite.email || !invite.module}>Send OTP</Button>
        </DialogActions>
      </Dialog>

      {/* Verify OTP Dialog */}
      <Dialog open={verifyDialogOpen} onClose={() => setVerifyDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Verify Invitation</DialogTitle>
        <DialogContent>
          <TextField label="Email" type="email" fullWidth sx={{ mt:1 }} value={otpPayload.email} onChange={(e)=>setOtpPayload({...otpPayload, email: e.target.value})} />
          <FormControl fullWidth sx={{ mt:2 }}>
            <InputLabel>Module</InputLabel>
            <Select label="Module" value={otpPayload.module} onChange={(e)=>setOtpPayload({...otpPayload, module: e.target.value})}>
              {['adoption','shelter','rescue','ecommerce','pharmacy','boarding','temporary-care','veterinary','donation'].map(m=> (
                <MenuItem key={m} value={m}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="OTP" fullWidth sx={{ mt:2 }} value={otpPayload.otp} onChange={(e)=>setOtpPayload({...otpPayload, otp: e.target.value})} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setVerifyDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={verifyInvite} disabled={!otpPayload.email || !otpPayload.module || !otpPayload.otp}>Verify</Button>
        </DialogActions>
      </Dialog>

      {tabValue === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <UsersIcon sx={{ mr: 1 }} />
              User Management
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Module</TableCell>
                    <TableCell>Store/Location</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentUsers.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.role.replace('_', ' ')} 
                          size="small" 
                          color="primary" 
                        />
                      </TableCell>
                      <TableCell>{user.assignedModule || 'N/A'}</TableCell>
                      <TableCell>
                        {user.storeName ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {user.storeName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.storeLocation?.city}, {user.storeLocation?.state}
                            </Typography>
                          </Box>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.isActive ? 'Active' : 'Inactive'} 
                          size="small" 
                          color={user.isActive ? 'success' : 'default'} 
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small">
                          <ViewIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {tabValue === 3 && (
        <Grid container spacing={3}>
          {modules.map((module, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: module.color, mr: 2 }}>
                      {module.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{module.name} Management</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {module.adminCount} Admin{module.adminCount !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Manage {module.name.toLowerCase()} operations, staff, and settings.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" startIcon={<ViewIcon />}>
                    View Details
                  </Button>
                  <Button size="small" startIcon={<SettingsIcon />}>
                    Configure
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {tabValue === 4 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <NotificationIcon sx={{ mr: 1 }} />
              System Logs
            </Typography>
            <List>
              {systemLogs.map((log, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      <NotificationIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={log.message || 'System event'}
                      secondary={new Date(log.timestamp || Date.now()).toLocaleString()}
                    />
                  </ListItem>
                  {index < systemLogs.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

          {/* Module Admin Creation Dialog */}
          <Dialog open={openAdminDialog} onClose={() => setOpenAdminDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>Create New Module Admin</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    autoFocus
                    margin="dense"
                    label="Full Name"
                    fullWidth
                    variant="outlined"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="dense"
                    label="Email"
                    type="email"
                    fullWidth
                    variant="outlined"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="dense"
                    label="Phone"
                    fullWidth
                    variant="outlined"
                    value={newAdmin.phone}
                    onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="dense"
                    label="Password"
                    type="password"
                    fullWidth
                    variant="outlined"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="dense">
                    <InputLabel>Module</InputLabel>
                    <Select
                      value={newAdmin.assignedModule}
                      label="Module"
                      onChange={(e) => {
                        const module = modules.find(m => m.key === e.target.value)
                        setNewAdmin({ 
                          ...newAdmin, 
                          assignedModule: e.target.value,
                          role: module?.key ? `${module.key}_admin` : ''
                        })
                      }}
                    >
                      {modules.map((module) => (
                        <MenuItem key={module.key} value={module.key}>
                          {module.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {newAdmin.assignedModule && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                        Store/Location Information
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="dense"
                        label="Store Name"
                        fullWidth
                        variant="outlined"
                        value={newAdmin.storeName}
                        onChange={(e) => setNewAdmin({ ...newAdmin, storeName: e.target.value })}
                        placeholder="e.g., Pet Adoption Center - Downtown"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="dense"
                        label="Store Phone"
                        fullWidth
                        variant="outlined"
                        value={newAdmin.storeDetails.phone}
                        onChange={(e) => setNewAdmin({ 
                          ...newAdmin, 
                          storeDetails: { ...newAdmin.storeDetails, phone: e.target.value }
                        })}
                        placeholder="+91 98765 43210"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        margin="dense"
                        label="Store Address"
                        fullWidth
                        variant="outlined"
                        value={newAdmin.storeLocation.addressLine1}
                        onChange={(e) => setNewAdmin({ 
                          ...newAdmin, 
                          storeLocation: { ...newAdmin.storeLocation, addressLine1: e.target.value }
                        })}
                        placeholder="123 Main Street"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        margin="dense"
                        label="City"
                        fullWidth
                        variant="outlined"
                        value={newAdmin.storeLocation.city}
                        onChange={(e) => setNewAdmin({ 
                          ...newAdmin, 
                          storeLocation: { ...newAdmin.storeLocation, city: e.target.value }
                        })}
                        placeholder="New York"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        margin="dense"
                        label="State"
                        fullWidth
                        variant="outlined"
                        value={newAdmin.storeLocation.state}
                        onChange={(e) => setNewAdmin({ 
                          ...newAdmin, 
                          storeLocation: { ...newAdmin.storeLocation, state: e.target.value }
                        })}
                        placeholder="NY"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        margin="dense"
                        label="ZIP Code"
                        fullWidth
                        variant="outlined"
                        value={newAdmin.storeLocation.zipCode}
                        onChange={(e) => setNewAdmin({ 
                          ...newAdmin, 
                          storeLocation: { ...newAdmin.storeLocation, zipCode: e.target.value }
                        })}
                        placeholder="10001"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="dense"
                        label="Store Email"
                        fullWidth
                        variant="outlined"
                        value={newAdmin.storeDetails.email}
                        onChange={(e) => setNewAdmin({ 
                          ...newAdmin, 
                          storeDetails: { ...newAdmin.storeDetails, email: e.target.value }
                        })}
                        placeholder="store@example.com"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="dense"
                        label="Capacity"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={newAdmin.storeDetails.capacity}
                        onChange={(e) => setNewAdmin({ 
                          ...newAdmin, 
                          storeDetails: { ...newAdmin.storeDetails, capacity: parseInt(e.target.value) || 0 }
                        })}
                        placeholder="50"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mt: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Auto-generated Store ID:
                        </Typography>
                        <Typography variant="body2">
                          <strong>Store ID:</strong> {newAdmin.assignedModule.toUpperCase()}_{String((modules.find(m => m.key === newAdmin.assignedModule)?.count || 0) + 1).padStart(3, '0')}
                        </Typography>
                      </Box>
                    </Grid>
                  </>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenAdminDialog(false)}>Cancel</Button>
              <Button 
                variant="contained" 
                onClick={handleCreateAdmin}
                disabled={!newAdmin.name || !newAdmin.email || !newAdmin.phone || !newAdmin.password || !newAdmin.assignedModule || !newAdmin.storeName || !newAdmin.storeLocation.addressLine1 || !newAdmin.storeLocation.city}
              >
                Create Admin
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar for notifications */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            <Alert 
              onClose={() => setSnackbar({ ...snackbar, open: false })} 
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </Box>
  )
}

export default SuperAdminDashboard
