import React, { useState } from 'react'
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Badge,
  Tooltip,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../../services/api'
import firebaseAuth from '../../services/firebaseAuth'

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState(null)

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async (event) => {
    console.log('Header logout clicked')
    event?.preventDefault()
    event?.stopPropagation()
    
    // Close the menu first
    handleMenuClose()
    
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

  const handleProfile = () => {
    navigate('/profile')
    handleMenuClose()
  }

  const handleSettings = () => {
    // Navigate to settings or open settings modal
    handleMenuClose()
  }

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        color: 'text.primary',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }}
        >
          Welcome back, {user?.name}!
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton color="inherit">
              <Badge badgeContent={0} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Profile Menu */}
          <Tooltip title="Account settings">
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="primary-search-account-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            sx={{
              '& .MuiPaper-root': {
                mt: 1,
                minWidth: 200,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              },
            }}
          >
            <MenuItem onClick={handleProfile}>
              <AccountCircleIcon sx={{ mr: 2 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={handleSettings}>
              <SettingsIcon sx={{ mr: 2 }} />
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 2 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header
