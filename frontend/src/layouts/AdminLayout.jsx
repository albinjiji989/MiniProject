import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Button,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  BusinessCenter as BusinessIcon,
  People as UsersIcon,
  Business as ModuleIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Notifications as NotificationIcon,
  AdminPanelSettings as SuperAdminIcon,
  History as HistoryIcon,
  Security as SecurityIcon,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

const drawerWidth = 280

const AdminLayout = ({ children }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navigationItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/admin/dashboard',
      color: '#3b82f6',
      description: 'System overview and statistics'
    },
    { 
      id: 'users', 
      label: 'User Management', 
      icon: <UsersIcon />, 
      path: '/admin/users',
      color: '#3b82f6',
      description: 'Manage public users and accounts'
    },
    { 
      id: 'managers', 
      label: 'Manager Management', 
      icon: <BusinessIcon />, 
      path: '/admin/managers',
      color: '#f59e0b',
      description: 'Manage module managers and permissions'
    },
    { 
      id: 'roles', 
      label: 'Role Management', 
      icon: <SecurityIcon />, 
      path: '/admin/roles',
      color: '#8b5cf6',
      description: 'Create and manage dynamic roles and permissions'
    },
    { 
      id: 'modules', 
      label: 'Module Management', 
      icon: <ModuleIcon />, 
      path: '/admin/modules',
      color: '#22c55e',
      description: 'Configure system modules and settings'
    },
    { 
      id: 'tracking', 
      label: 'Data Tracking', 
      icon: <HistoryIcon />, 
      path: '/admin/tracking',
      color: '#8b5cf6',
      description: 'Track data changes across all modules'
    },
  ]

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <SuperAdminIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
          <Box>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
              Admin Panel
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Pet Welfare System
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider />
      
      {/* Navigation */}
      <List sx={{ flexGrow: 1, px: 1 }}>
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                onClick={() => {
                  navigate(item.path)
                  if (isMobile) setMobileOpen(false)
                }}
                sx={{
                  mx: 0.5,
                  borderRadius: 2,
                  mb: 0.5,
                  backgroundColor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'white' : 'text.primary',
                  minHeight: 48,
                  '&:hover': {
                    backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                    transform: 'translateX(4px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ListItemIcon sx={{ 
                  color: isActive ? 'white' : item.color, 
                  minWidth: 40,
                  transition: 'color 0.2s ease-in-out'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  secondary={!isMobile && item.description}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 'bold' : 'normal',
                    fontSize: '0.9rem'
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.75rem',
                    color: isActive ? 'rgba(255,255,255,0.7)' : 'text.secondary'
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
      
      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', mr: 1 }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
              {user?.name || 'Admin User'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </Typography>
          </Box>
        </Box>
        <Button
          size="small"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ 
            color: 'error.main',
            fontSize: '0.75rem',
            textTransform: 'none',
            '&:hover': { backgroundColor: 'error.light', color: 'white' }
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {navigationItems.find(item => item.path === location.pathname)?.label || 'Admin Panel'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton color="inherit">
              <Badge badgeContent={0} color="error">
                <NotificationIcon />
              </Badge>
            </IconButton>
            
            <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider'
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'grey.50',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar />
        <Box sx={{ 
          flexGrow: 1, 
          p: 3,
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          minHeight: 'calc(100vh - 64px)'
        }}>
          {children}
        </Box>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default AdminLayout
