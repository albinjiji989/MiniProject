import React, { useState } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  ListItemIcon,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import firebaseAuth from '../services/firebaseAuth'
import RoleBasedSidebar from '../components/Layout/RoleBasedSidebar'

const drawerWidth = 280

const AdminLayout = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopOpen, setDesktopOpen] = useState(true)
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
    if (isMobile) {
      setMobileOpen(!mobileOpen)
    } else {
      setDesktopOpen(!desktopOpen)
    }
  }

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async (event) => {
    console.log('Admin navbar logout clicked')
    event?.preventDefault()
    event?.stopPropagation()
    
    // Close the menu first
    handleProfileMenuClose()
    
    try {
      console.log('Starting logout process...')
      
      // Set logout guard to prevent Firebase re-auth
      sessionStorage.setItem('auth_logout', '1')
      
      // Call backend logout
      const token = localStorage.getItem('token')
      if (token) {
        try {
          await authAPI.logout()
        } catch (error) {
          console.error('Backend logout error:', error)
        }
      }
      
      // Clear all auth data
      const TOKEN_KEYS = ['token', 'authToken', 'accessToken', 'jwt', 'jwtToken', 'access_token']
      for (const k of TOKEN_KEYS) {
        localStorage.removeItem(k)
        sessionStorage.removeItem(k)
      }
      localStorage.removeItem('user')
      sessionStorage.removeItem('user')
      
      // Sign out from Firebase
      try {
        await firebaseAuth.signOut()
      } catch (error) {
        console.error('Firebase logout error:', error)
      }
      
      console.log('Logout completed, redirecting...')
      
      // Simple redirect to home
      window.location.href = '/'
      
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback: Clear storage and force navigation
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/'
    }
  }


  const drawer = (
    <RoleBasedSidebar onClose={handleDrawerToggle} />
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: desktopOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
          ml: { md: desktopOpen ? `${drawerWidth}px` : 0 },
          backgroundColor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Admin Panel
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton color="inherit">
              <Badge badgeContent={0} color="error">
                <NotificationIcon />
              </Badge>
            </IconButton>
            
            <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0 }}>
              <Avatar 
                src={user?.profilePicture}
                sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: desktopOpen ? drawerWidth : 0 }, flexShrink: { md: 0 } }}
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
          variant="persistent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
          open={desktopOpen}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: desktopOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
          minHeight: '100vh',
          backgroundColor: 'grey.50',
          display: 'flex',
          flexDirection: 'column',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar />
        <Box sx={{ 
          flexGrow: 1, 
          p: 3,
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          minHeight: 'calc(100vh - 64px)'
        }}>
          {/* Use Outlet to render nested routes */}
          <Outlet />
        </Box>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
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
        <MenuItem 
          onClick={handleLogout}
          sx={{
            '&:hover': {
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
            },
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <Typography sx={{ color: 'error.main' }}>Logout</Typography>
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default AdminLayout
