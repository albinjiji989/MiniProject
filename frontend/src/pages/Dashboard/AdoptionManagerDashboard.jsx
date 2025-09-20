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
  Rating,
  
} from '@mui/material'
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab'
import {
  Dashboard as DashboardIcon,
  AccountCircle as ProfileIcon,
  Logout as LogoutIcon,
  Assignment as AdoptionIcon,
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
  School as EducationIcon
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { adoptionAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'

const AdoptionManagerDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    completedAdoptions: 0
  })
  const [applications, setApplications] = useState([])
  const [pets, setPets] = useState([])
  const [adopters, setAdopters] = useState([])
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
      const [statsRes, appsRes] = await Promise.all([
        adoptionAPI.getStats(),
        adoptionAPI.getAdoptions()
      ])
      setStats(statsRes.data.data)
      const applications = appsRes.data.data?.adoptions || appsRes.data.data || []
      setApplications(applications)
      setPets([])
      setAdopters([])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
      'approved': 'success',
      'rejected': 'error',
      'completed': 'info',
      'available_for_adoption': 'success',
      'adopted': 'info',
      'not_available': 'error'
    }
    return colors[status] || 'default'
  }

  const getStatusIcon = (status) => {
    const icons = {
      'pending': <WarningIcon />,
      'approved': <CheckIcon />,
      'rejected': <ErrorIcon />,
      'completed': <CheckIcon />,
      'available_for_adoption': <CheckIcon />,
      'adopted': <HomeIcon />,
      'not_available': <ErrorIcon />
    }
    return icons[status] || <InfoIcon />
  }

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`adoption-tabpanel-${index}`}
      aria-labelledby={`adoption-tab-${index}`}
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
          <AdoptionIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600, color: 'primary.main' }}>
            Adoption Management
          </Typography>
          <IconButton color="inherit" sx={{ mr: 2 }}>
            <Badge badgeContent={4} color="error">
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
              <TaskIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {stats.totalApplications}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Applications
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <WarningIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                {stats.pendingApplications}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Applications
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <CheckIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                {stats.approvedApplications}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved Applications
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <HomeIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                {stats.completedAdoptions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed Adoptions
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="adoption management tabs">
            <Tab label="Applications" icon={<TaskIcon />} />
            <Tab label="Available Pets" icon={<PetIcon />} />
            <Tab label="Adopters" icon={<PeopleIcon />} />
            <Tab label="Process Timeline" icon={<ScheduleIcon />} />
          </Tabs>
        </Paper>

        {/* Applications Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Adoption Applications
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
                variant="outlined"
                startIcon={<DownloadIcon />}
              >
                Export
              </Button>
            </Box>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pet</TableCell>
                  <TableCell>Adopter</TableCell>
                  <TableCell>Application Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Home Visit</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PetIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {application.petName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {application.petSpecies}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {application.adopterName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {application.adopterEmail}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(application.applicationDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={application.status}
                        color={getStatusColor(application.status)}
                        size="small"
                        icon={getStatusIcon(application.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={application.homeVisitScheduled ? 'Scheduled' : 'Pending'}
                        color={application.homeVisitScheduled ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenDialog('viewApplication', application)}>
                        <ViewIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDialog('reviewApplication', application)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDialog('scheduleHomeVisit', application)}>
                        <ScheduleIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Available Pets Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Available Pets for Adoption
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('addPet')}
            >
              Add Pet
            </Button>
          </Box>

          <Grid container spacing={3}>
            {pets.map((pet) => (
              <Grid item xs={12} sm={6} md={4} key={pet.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {pet.name}
                      </Typography>
                      <Chip
                        label={pet.status}
                        color={getStatusColor(pet.status)}
                        size="small"
                        icon={getStatusIcon(pet.status)}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {pet.breed} • {pet.age} years old
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Adoption Fee: ${pet.adoptionFee}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        onClick={() => handleOpenDialog('viewPet', pet)}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenDialog('editPet', pet)}
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

        {/* Adopters Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Adopter Profiles
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
            >
              Export Report
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Adopter</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Applications</TableCell>
                  <TableCell>Adoptions</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {adopters.map((adopter) => (
                  <TableRow key={adopter.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 32, height: 32 }}>
                          {adopter.name.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {adopter.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{adopter.email}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {adopter.phone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{adopter.applications}</TableCell>
                    <TableCell>{adopter.adoptions}</TableCell>
                    <TableCell>
                      <Chip
                        label={adopter.status}
                        color={getStatusColor(adopter.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenDialog('viewAdopter', adopter)}>
                        <ViewIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDialog('contactAdopter', adopter)}>
                        <EmailIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Process Timeline Tab */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Adoption Process Timeline
          </Typography>
          
          <Timeline>
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot color="primary">
                  <TaskIcon />
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="h6" component="span">
                  Application Submitted
                </Typography>
                <Typography>Adopter submits adoption application</Typography>
              </TimelineContent>
            </TimelineItem>
            
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot color="warning">
                  <SearchIcon />
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="h6" component="span">
                  Application Review
                </Typography>
                <Typography>Staff reviews application and references</Typography>
              </TimelineContent>
            </TimelineItem>
            
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot color="info">
                  <HomeIcon />
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="h6" component="span">
                  Home Visit
                </Typography>
                <Typography>Schedule and conduct home visit</Typography>
              </TimelineContent>
            </TimelineItem>
            
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot color="success">
                  <CheckIcon />
                </TimelineDot>
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="h6" component="span">
                  Adoption Approved
                </Typography>
                <Typography>Final approval and adoption completion</Typography>
              </TimelineContent>
            </TimelineItem>
          </Timeline>
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
          {dialogType === 'viewApplication' && 'Application Details'}
          {dialogType === 'reviewApplication' && 'Review Application'}
          {dialogType === 'scheduleHomeVisit' && 'Schedule Home Visit'}
          {dialogType === 'addPet' && 'Add New Pet'}
          {dialogType === 'viewPet' && 'Pet Details'}
          {dialogType === 'editPet' && 'Edit Pet'}
          {dialogType === 'viewAdopter' && 'Adopter Profile'}
          {dialogType === 'contactAdopter' && 'Contact Adopter'}
          {dialogType === 'quickAdd' && 'Quick Add'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {dialogType === 'viewApplication' && 'Application details will be displayed here.'}
            {dialogType === 'reviewApplication' && 'Application review form will be implemented here.'}
            {dialogType === 'scheduleHomeVisit' && 'Home visit scheduling form will be implemented here.'}
            {dialogType === 'addPet' && 'Pet creation form will be implemented here.'}
            {dialogType === 'viewPet' && 'Pet details will be displayed here.'}
            {dialogType === 'editPet' && 'Pet edit form will be implemented here.'}
            {dialogType === 'viewAdopter' && 'Adopter profile will be displayed here.'}
            {dialogType === 'contactAdopter' && 'Contact form will be implemented here.'}
            {dialogType === 'quickAdd' && 'Quick add options will be implemented here.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleCloseDialog}>
            {dialogType.includes('add') ? 'Add' : dialogType.includes('review') ? 'Review' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AdoptionManagerDashboard


