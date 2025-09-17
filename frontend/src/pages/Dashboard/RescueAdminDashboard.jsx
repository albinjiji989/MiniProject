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
  LinearProgress,
  Rating
} from '@mui/material'
import MapIcon from '@mui/icons-material/Map'
import {
  Dashboard as DashboardIcon,
  AccountCircle as ProfileIcon,
  Logout as LogoutIcon,
  LocalShipping as RescueIcon,
  Pets as PetIcon,
  People as PeopleIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Notifications as NotificationIcon,
  Assessment as AnalyticsIcon,
  Assignment as TaskIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Star as StarIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  School as EducationIcon,
  LocalHospital as MedicalIcon,
  Speed as SpeedIcon,
  PriorityHigh as PriorityIcon
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { rescueAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'

const RescueAdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [stats, setStats] = useState({
    totalRescues: 0,
    activeRescues: 0,
    completedRescues: 0,
    emergencyRescues: 0
  })
  const [rescues, setRescues] = useState([])
  const [rescuers, setRescuers] = useState([])
  const [emergencyContacts, setEmergencyContacts] = useState([])
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
      const rescuesRes = await rescueAPI.getRescues()
      const rescues = rescuesRes.data.data?.rescues || rescuesRes.data.data || []
      setRescues(rescues)
      setRescuers([])
      setEmergencyContacts([])
      setStats({
        totalRescues: rescues.length,
        activeRescues: rescues.filter(r => r.status === 'in_progress').length,
        completedRescues: rescues.filter(r => r.status === 'completed').length,
        emergencyRescues: rescues.filter(r => r.priority === 'high').length
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
      'in_progress': 'info',
      'completed': 'success',
      'cancelled': 'error',
      'active': 'success',
      'inactive': 'error',
      'high': 'error',
      'medium': 'warning',
      'low': 'success'
    }
    return colors[status] || 'default'
  }

  const getStatusIcon = (status) => {
    const icons = {
      'pending': <WarningIcon />,
      'in_progress': <SpeedIcon />,
      'completed': <CheckIcon />,
      'cancelled': <ErrorIcon />,
      'active': <CheckIcon />,
      'inactive': <ErrorIcon />,
      'high': <PriorityIcon />,
      'medium': <WarningIcon />,
      'low': <InfoIcon />
    }
    return icons[status] || <InfoIcon />
  }

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rescue-tabpanel-${index}`}
      aria-labelledby={`rescue-tab-${index}`}
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
          <RescueIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600, color: 'primary.main' }}>
            Rescue Operations Management
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
              <RescueIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {stats.totalRescues}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Rescues
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <SpeedIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                {stats.activeRescues}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Rescues
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <CheckIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                {stats.completedRescues}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed Rescues
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <WarningIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'error.main' }}>
                {stats.emergencyRescues}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Emergency Cases
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="rescue management tabs">
            <Tab label="Rescue Operations" icon={<RescueIcon />} />
            <Tab label="Rescuers" icon={<PeopleIcon />} />
            <Tab label="Emergency Contacts" icon={<PhoneIcon />} />
            <Tab label="Operations Map" icon={<MapIcon />} />
          </Tabs>
        </Paper>

        {/* Rescue Operations Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Rescue Operations
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
                onClick={() => handleOpenDialog('addRescue')}
              >
                New Rescue
              </Button>
            </Box>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pet</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Rescuer</TableCell>
                  <TableCell>Report Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rescues.map((rescue) => (
                  <TableRow key={rescue.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PetIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {rescue.petName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {rescue.petSpecies}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationIcon sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="body2">
                          {rescue.location}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={rescue.priority}
                        color={getStatusColor(rescue.priority)}
                        size="small"
                        icon={getStatusIcon(rescue.priority)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={rescue.status}
                        color={getStatusColor(rescue.status)}
                        size="small"
                        icon={getStatusIcon(rescue.status)}
                      />
                    </TableCell>
                    <TableCell>{rescue.rescuerName}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(rescue.reportDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenDialog('viewRescue', rescue)}>
                        <ViewIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDialog('updateRescue', rescue)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDialog('assignRescuer', rescue)}>
                        <PeopleIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Rescuers Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Rescue Team
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('addRescuer')}
            >
              Add Rescuer
            </Button>
          </Box>

          <Grid container spacing={3}>
            {rescuers.map((rescuer) => (
              <Grid item xs={12} sm={6} md={4} key={rescuer.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        {rescuer.name.charAt(0)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {rescuer.name}
                        </Typography>
                        <Chip
                          label={rescuer.status}
                          color={getStatusColor(rescuer.status)}
                          size="small"
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PhoneIcon sx={{ fontSize: 16, mr: 1 }} />
                        {rescuer.phone}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <EmailIcon sx={{ fontSize: 16, mr: 1 }} />
                        {rescuer.email}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Rescues Completed: {rescuer.rescuesCompleted}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        Specializations:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {rescuer.specializations.map((spec, index) => (
                          <Chip key={index} label={spec} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        onClick={() => handleOpenDialog('viewRescuer', rescuer)}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenDialog('editRescuer', rescuer)}
                      >
                        Edit
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Emergency Contacts Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Emergency Contacts
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('addContact')}
            >
              Add Contact
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {emergencyContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {contact.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={contact.type}
                        color={contact.type === 'veterinary' ? 'success' : 'primary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PhoneIcon sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="body2">
                          {contact.phone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationIcon sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="body2">
                          {contact.location}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenDialog('callContact', contact)}>
                        <PhoneIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDialog('editContact', contact)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDialog('deleteContact', contact)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Operations Map Tab */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Rescue Operations Map
          </Typography>
          
          <Paper sx={{ p: 4, textAlign: 'center', minHeight: 400 }}>
            <MapIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Interactive Map
            </Typography>
            <Typography color="text.secondary">
              Rescue operations map will be implemented here with real-time tracking
            </Typography>
          </Paper>
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
          {dialogType === 'addRescue' && 'New Rescue Operation'}
          {dialogType === 'viewRescue' && 'Rescue Details'}
          {dialogType === 'updateRescue' && 'Update Rescue'}
          {dialogType === 'assignRescuer' && 'Assign Rescuer'}
          {dialogType === 'addRescuer' && 'Add New Rescuer'}
          {dialogType === 'viewRescuer' && 'Rescuer Profile'}
          {dialogType === 'editRescuer' && 'Edit Rescuer'}
          {dialogType === 'addContact' && 'Add Emergency Contact'}
          {dialogType === 'callContact' && 'Call Contact'}
          {dialogType === 'editContact' && 'Edit Contact'}
          {dialogType === 'quickAdd' && 'Quick Add'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {dialogType === 'addRescue' && 'Rescue operation form will be implemented here.'}
            {dialogType === 'viewRescue' && 'Rescue details will be displayed here.'}
            {dialogType === 'updateRescue' && 'Rescue update form will be implemented here.'}
            {dialogType === 'assignRescuer' && 'Rescuer assignment form will be implemented here.'}
            {dialogType === 'addRescuer' && 'Rescuer creation form will be implemented here.'}
            {dialogType === 'viewRescuer' && 'Rescuer profile will be displayed here.'}
            {dialogType === 'editRescuer' && 'Rescuer edit form will be implemented here.'}
            {dialogType === 'addContact' && 'Emergency contact form will be implemented here.'}
            {dialogType === 'callContact' && 'Calling contact...'}
            {dialogType === 'editContact' && 'Contact edit form will be implemented here.'}
            {dialogType === 'quickAdd' && 'Quick add options will be implemented here.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleCloseDialog}>
            {dialogType.includes('add') ? 'Add' : dialogType.includes('update') ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default RescueAdminDashboard
