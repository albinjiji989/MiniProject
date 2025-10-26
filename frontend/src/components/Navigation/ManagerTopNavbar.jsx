import React, { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Box,
  InputBase,
  Chip,
  Tooltip,
  Divider,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha
} from '@mui/material'
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Mail as MailIcon,
  AccountCircle as AccountIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Person as PersonIcon,
  Help as HelpIcon,
  Dashboard as DashboardIcon,
  Store as StoreIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

const ManagerTopNavbar = ({ onMenuClick, user, onThemeToggle, isDarkMode, moduleType = 'petshop' }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  
  const [anchorEl, setAnchorEl] = useState(null)
  const [notificationAnchor, setNotificationAnchor] = useState(null)
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }
  
  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }
  
  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget)
  }
  
  const handleNotificationClose = () => {
    setNotificationAnchor(null)
  }
  
  const handleLogout = () => {
    localStorage.removeItem('token')
    setTimeout(() => {
      navigate('/')
    }, 100)
    handleProfileMenuClose()
  }

  const getModuleTitle = (type) => {
    const titles = {
      petshop: 'PetShop Manager',
      adoption: 'Adoption Manager',
      ecommerce: 'Ecommerce Manager',
      pharmacy: 'Pharmacy Manager',
      rescue: 'Rescue Manager',
      veterinary: 'Veterinary Manager',
      'temporary-care': 'Temporary Care Manager'
    }
    return titles[type] || 'Manager Portal'
  }

  const getModuleIcon = (type) => {
    const icons = {
      petshop: <StoreIcon />,
      adoption: <DashboardIcon />,
      ecommerce: <StoreIcon />,
      pharmacy: <StoreIcon />,
      rescue: <DashboardIcon />,
      veterinary: <StoreIcon />,
      'temporary-care': <DashboardIcon />
    }
    return icons[type] || <StoreIcon />
  }

  const notifications = [
    {
      id: 1,
      title: 'New Order Received',
      message: 'Order #12345 for Golden Retriever puppy',
      time: '5 minutes ago',
      unread: true
    },
    {
      id: 2,
      title: 'Low Stock Alert',
      message: 'Premium dog food running low',
      time: '1 hour ago',
      unread: true
    },
    {
      id: 3,
      title: 'Staff Schedule Update',
      message: 'John updated his availability',
      time: '2 hours ago',
      unread: false
    },
    {
      id: 4,
      title: 'Customer Review',
      message: 'New 5-star review received',
      time: '3 hours ago',
      unread: false
    }
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: 1400,
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          height: '64px'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Left Section */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              edge="start"
              onClick={onMenuClick}
              sx={{ mr: 2, color: 'text.primary' }}
            >
              <MenuIcon />
            </IconButton>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getModuleIcon(moduleType)}
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {getModuleTitle(moduleType)}
              </Typography>
            </Box>
            
            <Chip 
              label="Manager Portal" 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ ml: 2, display: { xs: 'none', sm: 'inline-flex' } }}
            />
          </Box>

          {/* Center Section - Search */}
          <Box sx={{ 
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderRadius: 3,
            px: 2,
            py: 0.5,
            minWidth: 300,
            maxWidth: 400,
            flex: 1,
            mx: 3
          }}>
            <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            <InputBase
              placeholder="Search orders, pets, customers..."
              sx={{ 
                flex: 1,
                '& input': {
                  padding: '8px 0'
                }
              }}
            />
          </Box>

          {/* Right Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Theme Toggle */}
            <Tooltip title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton onClick={onThemeToggle} sx={{ color: 'text.primary' }}>
                {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            {/* Messages */}
            <Tooltip title="Messages">
              <IconButton sx={{ color: 'text.primary' }}>
                <Badge badgeContent={3} color="secondary">
                  <MailIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton 
                onClick={handleNotificationOpen}
                sx={{ color: 'text.primary' }}
              >
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Profile */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, mr: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {user?.name || 'Manager'}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {user?.role?.replace('_', ' ') || 'Manager'}
                </Typography>
              </Box>
              <Tooltip title="Account">
                <IconButton onClick={handleProfileMenuOpen}>
                  <Avatar 
                    sx={{ 
                      width: 36, 
                      height: 36,
                      bgcolor: 'primary.main'
                    }}
                  >
                    {user?.name?.charAt(0) || 'M'}
                  </Avatar>
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 200,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1
            }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {user?.name || 'Manager'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {user?.email || 'manager@example.com'}
          </Typography>
        </Box>
        
        <MenuItem onClick={() => navigate(`/manager/${moduleType}/profile`)}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>My Profile</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => navigate(`/manager/${moduleType}/settings`)}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => navigate(`/manager/${moduleType}/help`)}>
          <ListItemIcon>
            <HelpIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Help & Support</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            maxWidth: 360,
            minWidth: 320
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Typography variant="body2" color="primary">
              {unreadCount} unread
            </Typography>
          )}
        </Box>
        
        {notifications.map((notification) => (
          <MenuItem 
            key={notification.id}
            onClick={handleNotificationClose}
            sx={{ 
              py: 1.5,
              borderLeft: notification.unread ? 3 : 0,
              borderColor: 'primary.main',
              bgcolor: notification.unread ? alpha(theme.palette.primary.main, 0.05) : 'transparent'
            }}
          >
            <Box sx={{ width: '100%' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {notification.title}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                {notification.message}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {notification.time}
              </Typography>
            </Box>
          </MenuItem>
        ))}
        
        <Divider />
        
        <MenuItem onClick={handleNotificationClose} sx={{ justifyContent: 'center', py: 1 }}>
          <Typography variant="body2" color="primary" sx={{ fontWeight: 'medium' }}>
            View All Notifications
          </Typography>
        </MenuItem>
      </Menu>
    </>
  )
}

export default ManagerTopNavbar
