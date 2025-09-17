import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem,
  Tabs,
  Tab,
  Fab,
  Badge,
  
} from '@mui/material'
import { Timeline } from '@mui/lab'
import {
  Dashboard as DashboardIcon,
  AccountCircle as ProfileIcon,
  Logout as LogoutIcon,
  Build as CareIcon,
  People as CaregiverIcon,
  CalendarToday as CalendarIcon,
  LocalHospital as MedicalIcon,
  Pets as PetIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Notifications as NotificationIcon,
  Assessment as AnalyticsIcon,
  Assignment as TaskIcon,
  Schedule as ScheduleIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { temporaryCareAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'

const TemporaryCareAdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [stats, setStats] = useState({
    totalRequests: 0,
    activeCare: 0,
    availableCaregivers: 0,
    completedCare: 0
  })
  const [careRequests, setCareRequests] = useState([])
  const [caregivers, setCaregivers] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogType, setDialogType] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    setLoading(true)
    await logout()
    navigate('/login')
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  const handleOpenDialog = (type, item = null) => {
    setDialogType(type)
    setSelectedItem(item)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setDialogType('')
    setSelectedItem(null)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, careRequestsRes, caregiversRes] = await Promise.all([
        temporaryCareAPI.getStats(),
        temporaryCareAPI.listCareRequests(),
        temporaryCareAPI.listCaregivers()
      ])
      setStats(statsRes.data.data)
      setCareRequests(careRequestsRes.data.data.temporaryCares || [])
      setCaregivers(caregiversRes.data.data.caregivers || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'success',
      'Pending': 'warning',
      'Completed': 'info',
      'Cancelled': 'error',
      'available': 'success',
      'busy': 'warning',
      'inactive': 'error',
      'emergency': 'error',
      'vacation': 'info',
      'medical': 'warning',
      'temporary': 'default',
      'foster': 'success'
    }
    return colors[status] || 'default'
  }

  const getStatusIcon = (status) => {
    const icons = {
      'Active': <CheckIcon />,
      'Pending': <WarningIcon />,
      'Completed': <CheckIcon />,
      'Cancelled': <ErrorIcon />,
      'emergency': <ErrorIcon />,
      'vacation': <InfoIcon />,
      'medical': <MedicalIcon />,
      'temporary': <InfoIcon />,
      'foster': <CheckIcon />
    }
    return icons[status] || <InfoIcon />
  }

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tempcare-tabpanel-${index}`}
      aria-labelledby={`tempcare-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', color: 'text.primary', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <CareIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600, color: 'primary.main' }}>
            Temporary Care Management
          </Typography>
          <IconButton color="inherit" sx={{ mr: 2 }}>
            <Badge badgeContent={2} color="error">
              <NotificationIcon />
            </Badge>
          </IconButton>
          <IconButton
            onClick={handleProfileMenuOpen}
            color="inherit"
            sx={{ p: 0 }}
          >
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => { navigate('/profile'); handleProfileMenuClose(); }}>
          <ListItemIcon><ProfileIcon fontSize="small" /></ListItemIcon>
          Profile
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} disabled={loading}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          {loading ? <CircularProgress size={20} /> : 'Logout'}
        </MenuItem>
      </Menu>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Assignment sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {stats.totalRequests}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Requests
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <CareIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                {stats.activeCare}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Care
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <CaregiverIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                {stats.availableCaregivers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available Caregivers
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <CheckIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                {stats.completedCare}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed This Month
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="temporary care management tabs">
            <Tab label="Care Requests" icon={<Assignment />} />
            <Tab label="Caregivers" icon={<CaregiverIcon />} />
            <Tab label="Timeline" icon={<ScheduleIcon />} />
            <Tab label="Analytics" icon={<AnalyticsIcon />} />
          </Tabs>
        </Paper>

        {/* Care Requests Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Care Requests
            </Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<SearchIcon />}
                sx={{ mr: 1 }}
              >
                Search
              </Button>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                sx={{ mr: 1 }}
              >
                Filter
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog('addRequest')}
              >
                New Request
              </Button>
            </Box>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pet</TableCell>
                  <TableCell>Care Type</TableCell>
                  <TableCell>Caregiver</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {careRequests.length > 0 ? careRequests.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PetIcon sx={{ mr: 1, color: 'primary.main' }} />
                        {request.pet?.name || 'Unknown Pet'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.careType}
                        color={getStatusColor(request.careType)}
                        size="small"
                        icon={getStatusIcon(request.careType)}
                      />
                    </TableCell>
                    <TableCell>{request.caregiver?.name || 'Unassigned'}</TableCell>
                    <TableCell>{new Date(request.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(request.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={request.status}
                        color={getStatusColor(request.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenDialog('viewRequest', request)}>
                        <ViewIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDialog('editRequest', request)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDialog('deleteRequest', request)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary">No care requests found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Caregivers Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Caregivers
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('addCaregiver')}
            >
              Add Caregiver
            </Button>
          </Box>

          <Grid container spacing={3}>
            {caregivers.length > 0 ? caregivers.map((caregiver) => (
              <Grid item xs={12} sm={6} md={4} key={caregiver._id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        {caregiver.name?.charAt(0)?.toUpperCase() || 'C'}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {caregiver.name}
                        </Typography>
                        <Chip
                          label={caregiver.status}
                          color={getStatusColor(caregiver.status)}
                          size="small"
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PhoneIcon sx={{ fontSize: 16, mr: 1 }} />
                        {caregiver.phone}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <EmailIcon sx={{ fontSize: 16, mr: 1 }} />
                        {caregiver.email}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationIcon sx={{ fontSize: 16, mr: 1 }} />
                        {caregiver.location}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        onClick={() => handleOpenDialog('viewCaregiver', caregiver)}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenDialog('editCaregiver', caregiver)}
                      >
                        Edit
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )) : (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No caregivers found</Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Timeline Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Care Timeline
          </Typography>
          
      <Timeline>
        {/* No timeline data yet. Show empty state. */}
        <Typography color="text.secondary" sx={{ px: 3, py: 1 }}>
          No timeline events yet
        </Typography>
      </Timeline>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Analytics & Reports
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Care Types Distribution
                  </Typography>
                  <Box sx={{ p: 2 }}>
                    <Typography color="text.secondary">Analytics chart will be implemented here</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Monthly Trends
                  </Typography>
                  <Box sx={{ p: 2 }}>
                    <Typography color="text.secondary">Trend chart will be implemented here</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => handleOpenDialog('quickAdd')}
        >
          <AddIcon />
        </Fab>
      </Container>

      {/* Dialog for various actions */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'addRequest' && 'New Care Request'}
          {dialogType === 'editRequest' && 'Edit Care Request'}
          {dialogType === 'addCaregiver' && 'Add New Caregiver'}
          {dialogType === 'editCaregiver' && 'Edit Caregiver'}
          {dialogType === 'quickAdd' && 'Quick Add'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {dialogType === 'addRequest' && 'Care request form will be implemented here.'}
            {dialogType === 'editRequest' && 'Edit care request form will be implemented here.'}
            {dialogType === 'addCaregiver' && 'Add caregiver form will be implemented here.'}
            {dialogType === 'editCaregiver' && 'Edit caregiver form will be implemented here.'}
            {dialogType === 'quickAdd' && 'Quick add options will be implemented here.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleCloseDialog}>
            {dialogType.includes('add') ? 'Add' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TemporaryCareAdminDashboard
