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
  Healing as VeterinaryIcon,
  LocalHospital as ClinicIcon,
  Assignment as AppointmentIcon,
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
  PriorityHigh as PriorityIcon,
  AttachMoney as MoneyIcon,
  Science as ScienceIcon,
  Medication as MedicationIcon
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { veterinaryAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'

const VeterinaryAdminDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [stats, setStats] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    totalVeterinarians: 0,
    totalRevenue: 0
  })
  const [appointments, setAppointments] = useState([])
  const [veterinarians, setVeterinarians] = useState([])
  const [medicalRecords, setMedicalRecords] = useState([])
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
      const [appointmentsRes, vetsRes, recordsRes] = await Promise.all([
        veterinaryAPI.getAppointments(),
        veterinaryAPI.getClinics(),
        veterinaryAPI.getMedicalRecords()
      ])
      const appointments = appointmentsRes.data.data?.appointments || appointmentsRes.data.data || []
      const veterinarians = vetsRes.data.data?.clinics || vetsRes.data.data || []
      const medicalRecords = recordsRes.data.data?.medicalRecords || recordsRes.data.data || []
      setAppointments(appointments)
      setVeterinarians(veterinarians)
      setMedicalRecords(medicalRecords)
      setStats({
        totalAppointments: appointments.length,
        todayAppointments: appointments.filter(a => new Date(a.date || a.appointmentDate).toDateString() === new Date().toDateString()).length,
        totalVeterinarians: veterinarians.length,
        totalRevenue: medicalRecords.reduce((sum, r) => sum + (r.fee || 0), 0)
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'scheduled': 'info',
      'completed': 'success',
      'cancelled': 'error',
      'in_progress': 'warning',
      'active': 'success',
      'inactive': 'error',
      'urgent': 'error',
      'routine': 'info'
    }
    return colors[status] || 'default'
  }

  const getStatusIcon = (status) => {
    const icons = {
      'scheduled': <ScheduleIcon />,
      'completed': <CheckIcon />,
      'cancelled': <ErrorIcon />,
      'in_progress': <WarningIcon />,
      'active': <CheckIcon />,
      'inactive': <ErrorIcon />,
      'urgent': <PriorityIcon />,
      'routine': <InfoIcon />
    }
    return icons[status] || <InfoIcon />
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`veterinary-tabpanel-${index}`}
      aria-labelledby={`veterinary-tab-${index}`}
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
          <VeterinaryIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600, color: 'primary.main' }}>
            Veterinary Management
          </Typography>
          <IconButton color="inherit" sx={{ mr: 2 }}>
            <Badge badgeContent={5} color="error">
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
              <AppointmentIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {stats.totalAppointments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Appointments
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <ScheduleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                {stats.todayAppointments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Today's Appointments
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <VeterinaryIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                {stats.totalVeterinarians}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Veterinarians
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <MoneyIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                {formatCurrency(stats.totalRevenue)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="veterinary management tabs">
            <Tab label="Appointments" icon={<AppointmentIcon />} />
            <Tab label="Veterinarians" icon={<VeterinaryIcon />} />
            <Tab label="Medical Records" icon={<MedicalIcon />} />
            <Tab label="Analytics" icon={<AnalyticsIcon />} />
          </Tabs>
        </Paper>

        {/* Appointments Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Appointment Management
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
                onClick={() => handleOpenDialog('addAppointment')}
              >
                New Appointment
              </Button>
            </Box>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pet</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Veterinarian</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PetIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {appointment.petName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {appointment.petSpecies}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {appointment.ownerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {appointment.ownerEmail}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {appointment.veterinarian}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {new Date(appointment.appointmentDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {appointment.appointmentTime}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={appointment.type} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={appointment.status}
                        color={getStatusColor(appointment.status)}
                        size="small"
                        icon={getStatusIcon(appointment.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenDialog('viewAppointment', appointment)}>
                        <ViewIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDialog('editAppointment', appointment)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDialog('completeAppointment', appointment)}>
                        <CheckIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Veterinarians Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Veterinarian Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('addVeterinarian')}
            >
              Add Veterinarian
            </Button>
          </Box>

          <Grid container spacing={3}>
            {veterinarians.map((vet) => (
              <Grid item xs={12} sm={6} md={4} key={vet.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        {vet.name.charAt(0)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {vet.name}
                        </Typography>
                        <Chip
                          label={vet.status}
                          color={getStatusColor(vet.status)}
                          size="small"
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Specialization:</strong> {vet.specialization}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Experience:</strong> {vet.experience}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Rating value={vet.rating} size="small" readOnly />
                        <Typography variant="caption" sx={{ ml: 1 }}>
                          ({vet.rating})
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PhoneIcon sx={{ fontSize: 16, mr: 1 }} />
                        {vet.phone}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                        <EmailIcon sx={{ fontSize: 16, mr: 1 }} />
                        {vet.email}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        onClick={() => handleOpenDialog('viewVeterinarian', vet)}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenDialog('editVeterinarian', vet)}
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

        {/* Medical Records Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Medical Records
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
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog('addMedicalRecord')}
              >
                New Record
              </Button>
            </Box>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pet</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Diagnosis</TableCell>
                  <TableCell>Treatment</TableCell>
                  <TableCell>Veterinarian</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Follow-up</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {medicalRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PetIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {record.petName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {record.ownerName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {record.diagnosis}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {record.treatment}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {record.veterinarian}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(record.date).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={record.followUpRequired ? 'Required' : 'Not Required'}
                        color={record.followUpRequired ? 'warning' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenDialog('viewMedicalRecord', record)}>
                        <ViewIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDialog('editMedicalRecord', record)}>
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Veterinary Analytics
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Appointment Trends
                  </Typography>
                  <Box sx={{ p: 2 }}>
                    <Typography color="text.secondary">Appointment trends chart will be implemented here</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Veterinarian Performance
                  </Typography>
                  <Box sx={{ p: 2 }}>
                    <Typography color="text.secondary">Veterinarian performance metrics will be implemented here</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Common Diagnoses
                  </Typography>
                  <Box sx={{ p: 2 }}>
                    <Typography color="text.secondary">Common diagnoses chart will be implemented here</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Revenue Analysis
                  </Typography>
                  <Box sx={{ p: 2 }}>
                    <Typography color="text.secondary">Revenue analysis will be implemented here</Typography>
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
          {dialogType === 'addAppointment' && 'New Appointment'}
          {dialogType === 'viewAppointment' && 'Appointment Details'}
          {dialogType === 'editAppointment' && 'Edit Appointment'}
          {dialogType === 'completeAppointment' && 'Complete Appointment'}
          {dialogType === 'addVeterinarian' && 'Add Veterinarian'}
          {dialogType === 'viewVeterinarian' && 'Veterinarian Profile'}
          {dialogType === 'editVeterinarian' && 'Edit Veterinarian'}
          {dialogType === 'addMedicalRecord' && 'New Medical Record'}
          {dialogType === 'viewMedicalRecord' && 'Medical Record Details'}
          {dialogType === 'editMedicalRecord' && 'Edit Medical Record'}
          {dialogType === 'quickAdd' && 'Quick Add'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {dialogType === 'addAppointment' && 'Appointment creation form will be implemented here.'}
            {dialogType === 'viewAppointment' && 'Appointment details will be displayed here.'}
            {dialogType === 'editAppointment' && 'Appointment edit form will be implemented here.'}
            {dialogType === 'completeAppointment' && 'Appointment completion form will be implemented here.'}
            {dialogType === 'addVeterinarian' && 'Veterinarian creation form will be implemented here.'}
            {dialogType === 'viewVeterinarian' && 'Veterinarian profile will be displayed here.'}
            {dialogType === 'editVeterinarian' && 'Veterinarian edit form will be implemented here.'}
            {dialogType === 'addMedicalRecord' && 'Medical record creation form will be implemented here.'}
            {dialogType === 'viewMedicalRecord' && 'Medical record details will be displayed here.'}
            {dialogType === 'editMedicalRecord' && 'Medical record edit form will be implemented here.'}
            {dialogType === 'quickAdd' && 'Quick add options will be implemented here.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleCloseDialog}>
            {dialogType.includes('add') ? 'Add' : dialogType.includes('complete') ? 'Complete' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default VeterinaryAdminDashboard
