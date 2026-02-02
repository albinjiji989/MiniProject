import React, { useState, useEffect } from 'react'
import { Box, Drawer, AppBar, Toolbar, Typography, IconButton, Avatar, Badge, Menu, MenuItem, ListItemIcon, useMediaQuery, useTheme } from '@mui/material'
import { Menu as MenuIcon, Logout as LogoutIcon, Notifications as NotificationIcon } from '@mui/icons-material'
import ManagerSidebar from '../components/Navigation/ManagerSidebar'
import { useAuth } from '../contexts/AuthContext'
import { Navigate, useNavigate } from 'react-router-dom'
const drawerWidth = 280

const ManagerLayout = ({ children }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()

  // If user data is still loading, show loading state
  if (!user && token) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }
  
  // If no user at all (should be caught by ProtectedRoute), redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If we have user data, proceed (managers only should reach this point)

  // Check if user needs to set up store name
  // Note: This redirect is now handled by ProtectedRoute, so we don't need to do it here
  // useEffect(() => {
  //   const isModuleManager = user?.role?.endsWith('_manager');
  //   const needsStoreSetup = isModuleManager && (!user?.storeName || user?.storeName?.trim() === '');
  //   if (user?.needsStoreNameSetup || needsStoreSetup) {
  //     // Redirect to store setup page instead of showing dialog
  //     navigate('/manager/store-name-setup');
  //   }
  // }, [user, navigate])

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen)
  const handleProfileMenuOpen = (e) => setAnchorEl(e.currentTarget)
  const handleProfileMenuClose = () => setAnchorEl(null)
  const handleLogout = () => { logout() }

  const moduleType = (user?.role || '').replace('_manager','').replace('_', '-') || 'petshop'
  const drawer = (
    <ManagerSidebar open={!isMobile || mobileOpen} onClose={() => setMobileOpen(false)} user={user} moduleType={moduleType} />
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
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
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
            Manager Panel
          </Typography>

          <IconButton color="inherit">
            <Badge badgeContent={0} color="error">
              <NotificationIcon />
            </Badge>
          </IconButton>

          <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0, ml: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'M'}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {/* ManagerSidebar handles its own Drawer responsiveness */}
        {drawer}
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: { md: `calc(100% - ${drawerWidth}px)` }, minHeight: '100vh', backgroundColor: 'grey.50', display: 'flex', flexDirection: 'column' }}>
        <Toolbar />
        <Box sx={{ flexGrow: 1, p: 3, background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', minHeight: 'calc(100vh - 64px)' }}>
          {children}
        </Box>
      </Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleProfileMenuClose} onClick={handleProfileMenuClose}
        PaperProps={{ elevation: 0, sx: { overflow: 'visible', filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))', mt: 1.5 } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => navigate('/manager/profile')}>
          Profile
        </MenuItem>
        <MenuItem onClick={() => navigate('/force-password')}>
          Change Password
        </MenuItem>
        <MenuItem onClick={() => navigate('/manager/store-name-change')}>
          Request Store Name Change
        </MenuItem>
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

export default ManagerLayout