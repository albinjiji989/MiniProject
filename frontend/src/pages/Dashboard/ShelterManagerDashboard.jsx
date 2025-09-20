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
  Badge
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  AccountCircle as ProfileIcon,
  Logout as LogoutIcon,
  Pets as PetIcon,
  Home as HomeIcon,
  People as StaffIcon,
  AttachMoney as MoneyIcon,
  LocalHospital as MedicalIcon,
  Restaurant as FoodIcon,
  CleaningServices as CleaningIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Settings as SettingsIcon,
  Notifications as NotificationIcon,
  Assessment as AnalyticsIcon,
  Assignment as TaskIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { shelterAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'

const ShelterManagerDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [stats, setStats] = useState({
    totalAnimals: 0,
    availableForAdoption: 0,
    staffMembers: 0,
    monthlyExpenses: 0
  })
  const [animals, setAnimals] = useState([])
  const [staff, setStaff] = useState([])
  const [tasks, setTasks] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
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
      const [statsRes, animalsRes] = await Promise.all([
        shelterAPI.getStats(),
        shelterAPI.listAnimals()
      ])
      setStats(statsRes.data.data)
      setAnimals(animalsRes.data.data.animals || [])
      setStaff([])
      setTasks([])
      setRecentActivities([])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'Available': 'success',
      'Adopted': 'info',
      'Medical Care': 'warning',
      'Pending': 'default',
      'active': 'success',
      'inactive': 'error',
      'pending': 'warning',
      'in_progress': 'info',
      'completed': 'success',
      'high': 'error',
      'medium': 'warning',
      'low': 'success'
    }
    return colors[status] || 'default'
  }

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`shelter-tabpanel-${index}`}
      aria-labelledby={`shelter-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', color: 'text.primary', borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <HomeIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600, color: 'primary.main' }}>
            Shelter Management
          </Typography>
          <IconButton color="inherit" sx={{ mr: 2 }}>
            <Badge badgeContent={3} color="error">
              <NotificationIcon />
            </Badge>
          </IconButton>
          <IconButton onClick={handleProfileMenuOpen} color="inherit" sx={{ p: 0 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

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
        <MenuItem onClick={() => { navigate('/settings'); handleProfileMenuClose(); }}>
          <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} disabled={loading}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          {loading ? <CircularProgress size={20} /> : 'Logout'}
        </MenuItem>
      </Menu>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <PetIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {stats.totalAnimals}
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Animals</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <HomeIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                {stats.availableForAdoption}
              </Typography>
              <Typography variant="body2" color="text.secondary">Available for Adoption</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <StaffIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                {stats.staffMembers}
              </Typography>
              <Typography variant="body2" color="text.secondary">Staff Members</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <MoneyIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
                ${stats.monthlyExpenses}
              </Typography>
              <Typography variant="body2" color="text.secondary">Monthly Expenses</Typography>
            </Card>
          </Grid>
        </Grid>

        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="shelter management tabs">
            <Tab label="Animals" icon={<PetIcon />} />
            <Tab label="Staff" icon={<StaffIcon />} />
            <Tab label="Tasks" icon={<TaskIcon />} />
            <Tab label="Activities" icon={<AnalyticsIcon />} />
          </Tabs>
        </Paper>

        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>Animal Management</Typography>
            <Box>
              <Button variant="outlined" startIcon={<SearchIcon />} sx={{ mr: 1 }}>Search</Button>
              <Button variant="outlined" startIcon={<FilterIcon />} sx={{ mr: 1 }}>Filter</Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog('addAnimal')}>Add Animal</Button>
            </Box>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Species</TableCell>
                  <TableCell>Breed</TableCell>
                  <TableCell>Age</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {animals.length > 0 ? animals.map((animal) => (
                  <TableRow key={animal._id}>
                    <TableCell>{animal.name}</TableCell>
                    <TableCell>{animal.species}</TableCell>
                    <TableCell>{animal.breed}</TableCell>
                    <TableCell>{animal.ageYears} years</TableCell>
                    <TableCell>
                      <Chip label={animal.currentStatus} color={getStatusColor(animal.currentStatus)} size="small" />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenDialog('viewAnimal', animal)}><ViewIcon /></IconButton>
                      <IconButton size="small" onClick={() => handleOpenDialog('editAnimal', animal)}><EditIcon /></IconButton>
                      <IconButton size="small" onClick={() => handleOpenDialog('deleteAnimal', animal)}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">No animals found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>Staff Management</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog('addStaff')}>Add Staff</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell>{member.phone}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell><Chip label={member.status} color={getStatusColor(member.status)} size="small" /></TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenDialog('editStaff', member)}><EditIcon /></IconButton>
                      <IconButton size="small" onClick={() => handleOpenDialog('deleteStaff', member)}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>Task Management</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog('addTask')}>Add Task</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>{task.title}</TableCell>
                    <TableCell><Chip label={task.priority} color={getStatusColor(task.priority)} size="small" /></TableCell>
                    <TableCell><Chip label={task.status} color={getStatusColor(task.status)} size="small" /></TableCell>
                    <TableCell>{task.assignedTo}</TableCell>
                    <TableCell>{task.dueDate}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenDialog('editTask', task)}><EditIcon /></IconButton>
                      <IconButton size="small" onClick={() => handleOpenDialog('deleteTask', task)}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>Recent Activities</Typography>
          <List>
            {recentActivities.map((activity) => (
              <ListItem key={activity.id} divider>
                <ListItemIcon>
                  {activity.type === 'animal' && <PetIcon color="primary" />}
                  {activity.type === 'adoption' && <HomeIcon color="success" />}
                  {activity.type === 'medical' && <MedicalIcon color="info" />}
                </ListItemIcon>
                <ListItemText primary={activity.action} secondary={`${activity.details} • ${activity.timestamp}`} />
              </ListItem>
            ))}
          </List>
        </TabPanel>

        <Fab color="primary" aria-label="add" sx={{ position: 'fixed', bottom: 16, right: 16 }} onClick={() => handleOpenDialog('quickAdd')}>
          <AddIcon />
        </Fab>
      </Container>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'addAnimal' && 'Add New Animal'}
          {dialogType === 'editAnimal' && 'Edit Animal'}
          {dialogType === 'addStaff' && 'Add New Staff Member'}
          {dialogType === 'editStaff' && 'Edit Staff Member'}
          {dialogType === 'addTask' && 'Add New Task'}
          {dialogType === 'editTask' && 'Edit Task'}
          {dialogType === 'quickAdd' && 'Quick Add'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {dialogType === 'addAnimal' && 'Add animal form will be implemented here.'}
            {dialogType === 'editAnimal' && 'Edit animal form will be implemented here.'}
            {dialogType === 'addStaff' && 'Add staff form will be implemented here.'}
            {dialogType === 'editStaff' && 'Edit staff form will be implemented here.'}
            {dialogType === 'addTask' && 'Add task form will be implemented here.'}
            {dialogType === 'editTask' && 'Edit task form will be implemented here.'}
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

export default ShelterManagerDashboard

// Standalone Shelter Manager dashboard implemented here (no re-export)
