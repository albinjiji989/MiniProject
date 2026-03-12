import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Chip,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  AdminPanelSettings as SuperAdminIcon,
  Business as ModuleIcon,
  Person as UserIcon,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { authAPI } from '../../services/api'
import firebaseAuth from '../../services/firebaseAuth'

const RoleBasedHeader = ({ onMenuClick }) => {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { user, logout } = useAuth()
  const [anchorEl, setAnchorEl] = useState(null)
  const [notificationAnchor, setNotificationAnchor] = useState(null)

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }

  const handleNotificationMenuOpen = (event) => {
    setNotificationAnchor(event.currentTarget)
  }

  const handleNotificationMenuClose = () => {
    setNotificationAnchor(null)
  }

  const handleLogout = async (event) => {
    console.log('RoleBasedHeader logout clicked')
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

  const handleProfileClick = () => {
    navigate('/profile')
    handleProfileMenuClose()
  }

  const handleSettingsClick = () => {
    navigate('/settings')
    handleProfileMenuClose()
  }

  const getRoleInfo = (role) => {
    switch (role) {
      case 'admin':
        return {
          title: 'Admin Dashboard',
          icon: <SuperAdminIcon />,
          color: 'error.main',
          description: 'System Administration'
        }
      case 'module_manager':
        return {
          title: 'Module Admin Dashboard',
          icon: <ModuleIcon />,
          color: 'primary.main',
          description: user?.details?.assignedModule || 'Module Management'
        }
      case 'staff':
        return {
          title: 'Staff Dashboard',
          icon: <UserIcon />,
          color: 'info.main',
          description: 'Staff Management'
        }
      case 'public_user':
        return {
          title: 'User Dashboard',
          icon: <DashboardIcon />,
          color: 'success.main',
          description: 'Pet Welfare Services'
        }
      default:
        return {
          title: 'Dashboard',
          icon: <DashboardIcon />,
          color: 'primary.main',
          description: 'Pet Welfare System'
        }
    }
  }

  const roleInfo = getRoleInfo(user?.role)

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{ 
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        color: 'text.primary'
      }}
    >
      <Toolbar>
        {/* Mobile Menu Button */}
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Page Title */}
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ color: roleInfo.color }}>
            {roleInfo.icon}
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {roleInfo.title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {roleInfo.description}
            </Typography>
          </Box>
        </Box>

        {/* Right Side Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notifications */}
          <IconButton
            color="inherit"
            onClick={handleNotificationMenuOpen}
            sx={{ color: 'text.secondary' }}
          >
            <Badge badgeContent={0} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* User Profile */}
          <IconButton
            color="inherit"
            onClick={handleProfileMenuOpen}
            sx={{ color: 'text.secondary' }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </Avatar>
          </IconButton>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={handleProfileClick}>
            <AccountIcon sx={{ mr: 1 }} />
            Profile
          </MenuItem>
          <MenuItem onClick={handleSettingsClick}>
            <SettingsIcon sx={{ mr: 1 }} />
            Settings
          </MenuItem>
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <LogoutIcon sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={handleNotificationMenuClose}>
            <Typography variant="body2" color="text.secondary">
              No new notifications
            </Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}

export default RoleBasedHeader
