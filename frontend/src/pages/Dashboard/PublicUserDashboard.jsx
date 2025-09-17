import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Drawer,
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
  CircularProgress
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  AccountCircle as ProfileIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Pets as PetIcon,
  Home as HomeIcon,
  LocalHospital as MedicalIcon,
  ShoppingCart as ShopIcon,
  
  School as EducationIcon,
  LocalShipping as RescueIcon,
  Medication as PharmacyIcon,
  
  Healing as VeterinaryIcon,
  Assignment as AdoptionIcon,
  Build as CareIcon,
  TrendingUp as TrendingIcon,
  Notifications as NotificationIcon,
  Search as SearchIcon,
  Add as AddIcon
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const PublicUserDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const drawerWidth = 240

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

  const handleDrawerToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const moduleCards = [
    {
      title: 'Pet Management',
      description: 'Manage your pets, view medical records, and track their history',
      icon: <PetIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: 'primary',
      path: '/pets',
      features: ['Add/Edit Pets', 'Medical Records', 'Vaccination History', 'Ownership History']
    },
    {
      title: 'Adoption Center',
      description: 'Browse and apply for pet adoptions',
      icon: <AdoptionIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      color: 'success',
      path: '/adoption',
      features: ['Browse Pets', 'Apply for Adoption', 'Track Applications', 'Adoption History']
    },
    {
      title: 'Shelter Services',
      description: 'Access shelter services and view available animals',
      icon: <HomeIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      color: 'info',
      path: '/shelter',
      features: ['View Shelters', 'Available Animals', 'Shelter Services', 'Contact Shelters']
    },
    {
      title: 'Rescue Operations',
      description: 'Report and track rescue operations',
      icon: <RescueIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      color: 'warning',
      path: '/rescue',
      features: ['Report Rescue', 'Track Operations', 'Emergency Contacts', 'Rescue History']
    },
    {
      title: 'E-commerce',
      description: 'Shop for pet supplies and accessories',
      icon: <ShopIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      color: 'secondary',
      path: '/ecommerce',
      features: ['Browse Products', 'Shopping Cart', 'Order History', 'Product Reviews']
    },
    
    {
      title: 'Temporary Care',
      description: 'Find temporary care for your pets',
      icon: <CareIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      color: 'info',
      path: '/temporary-care',
      features: ['Request Care', 'Find Caregivers', 'Track Care', 'Care History']
    },
    {
      title: 'Pharmacy',
      description: 'Order medications and manage prescriptions',
      icon: <PharmacyIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      color: 'success',
      path: '/pharmacy',
      features: ['Browse Medications', 'Order Prescriptions', 'Track Orders', 'Medication History']
    },
    
    {
      title: 'Veterinary',
      description: 'Schedule appointments and manage medical records',
      icon: <VeterinaryIcon sx={{ fontSize: 40, color: 'error.main' }} />,
      color: 'error',
      path: '/veterinary',
      features: ['Find Clinics', 'Book Appointments', 'Medical Records', 'Appointment History']
    }
  ]

  const quickActions = [
    { title: 'Add New Pet', icon: <AddIcon />, path: '/pets/add' },
    { title: 'Find Adoption', icon: <SearchIcon />, path: '/adoption' },
    { title: 'Shop Products', icon: <ShopIcon />, path: '/ecommerce' },
    
  ]

  const sidebarItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { label: 'My Pets', icon: <PetIcon />, path: '/pets' },
    { label: 'Adoption', icon: <AdoptionIcon />, path: '/adoption' },
    { label: 'Shelter', icon: <HomeIcon />, path: '/shelter' },
    { label: 'Rescue', icon: <RescueIcon />, path: '/rescue' },
    { label: 'Temporary Care', icon: <CareIcon />, path: '/temporary-care' },
    { label: 'Pharmacy', icon: <PharmacyIcon />, path: '/pharmacy' },
    { label: 'Veterinary', icon: <VeterinaryIcon />, path: '/veterinary' },
    { label: 'Shop', icon: <ShopIcon />, path: '/ecommerce' }
  ]

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: 'white',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
          zIndex: (theme) => theme.zIndex.drawer + 1
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, color: 'primary.main' }}>
            PetWelfare Central
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
            <Button color="inherit" onClick={() => navigate('/dashboard')} sx={{ textTransform: 'none' }}>Home</Button>
            <Button color="inherit" onClick={() => navigate('/about')} sx={{ textTransform: 'none' }}>About</Button>
            <Button color="inherit" onClick={() => navigate('/contact')} sx={{ textTransform: 'none' }}>Contact</Button>
          </Box>
          <IconButton color="inherit" sx={{ mr: 2 }}>
            <NotificationIcon />
          </IconButton>
          <IconButton
            onClick={handleProfileMenuOpen}
            color="inherit"
            sx={{ p: 0 }}
          >
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Sidebar (toggleable on all screens) */}
      <Drawer
        variant="temporary"
        open={sidebarOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {sidebarItems.map((item, idx) => (
              <ListItem button key={idx} onClick={() => { navigate(item.path); handleDrawerToggle(); }}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

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

      <Container maxWidth="xl" sx={{ py: 4, mt: 10 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
            Welcome back, {user?.name || 'User'}!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Access all pet welfare services from one central dashboard
          </Typography>
          
          {/* Quick Actions */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {quickActions.map((action, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Button
                    variant="outlined"
                    startIcon={action.icon}
                    fullWidth
                    onClick={() => navigate(action.path)}
                    sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                  >
                    {action.title}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>

        {/* Module Cards */}
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Available Services
        </Typography>
        <Grid container spacing={3}>
          {moduleCards.map((module, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {module.icon}
                    <Typography variant="h6" sx={{ ml: 2, fontWeight: 600 }}>
                      {module.title}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {module.description}
                  </Typography>

                  <List dense sx={{ mb: 2 }}>
                    {module.features.map((feature, featureIndex) => (
                      <ListItem key={featureIndex} sx={{ py: 0.5, px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: `${module.color}.main` }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature} 
                          primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                        />
                      </ListItem>
                    ))}
                  </List>

                  <Button
                    variant="contained"
                    color={module.color}
                    fullWidth
                    onClick={() => navigate(module.path)}
                    sx={{ mt: 'auto' }}
                  >
                    Access {module.title}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Recent Activity */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Recent Activity
          </Typography>
          <Paper sx={{ p: 3 }}>
            <Alert severity="info">
              Your recent activity will appear here as you use different services.
            </Alert>
          </Paper>
        </Box>
      </Container>
    </Box>
  )
}

export default PublicUserDashboard