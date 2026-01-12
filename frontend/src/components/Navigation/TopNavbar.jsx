import React, { useState, useEffect } from 'react'
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
  alpha,
  CircularProgress
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
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Payment as PaymentIcon,
  ShoppingCart as ShoppingCartIcon,
  Assignment as AdoptionIcon,
  MedicalInformation as MedicalIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { dashboardAPI } from '../../services/api'

const TopNavbar = ({ onMenuClick, user, onThemeToggle, isDarkMode }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  
  const [anchorEl, setAnchorEl] = useState(null)
  const [notificationAnchor, setNotificationAnchor] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }
  
  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }
  
  const handleNotificationOpen = async (event) => {
    setNotificationAnchor(event.currentTarget)
    await loadNotifications()
  }
  
  const handleNotificationClose = () => {
    setNotificationAnchor(null)
  }
  
  const loadNotifications = async () => {
    if (loadingNotifications) return
    
    setLoadingNotifications(true)
    try {
      const response = await dashboardAPI.getNotifications()
      const notificationData = response.data?.data?.notifications || []
      setNotifications(notificationData)
      setUnreadCount(notificationData.filter(n => n.unread).length)
    } catch (error) {
      console.error('Failed to load notifications:', error)
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoadingNotifications(false)
    }
  }
  
  const handleLogout = () => {
    localStorage.removeItem('token')
    setTimeout(() => {
      navigate('/')
    }, 100)
    handleProfileMenuClose()
  }
  
  const handleNotificationClick = (notification) => {
    if (notification.path) {
      navigate(notification.path)
      handleNotificationClose()
    }
  }

  // Load notifications when component mounts
  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  return (
    <>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: 1400, // Higher than drawer
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
            
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              PetCare Hub
            </Typography>
            
            <Chip 
              label="User Portal" 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ ml: 2, display: { xs: 'none', sm: 'inline-flex' } }}
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
                <Badge badgeContent={0} color="secondary" showZero={false}>
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
                <Badge badgeContent={unreadCount} color="error" showZero={false}>
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Profile */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, mr: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {user?.name || 'User'}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {user?.role || 'Pet Lover'}
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
                    {user?.name?.charAt(0) || 'U'}
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
            {user?.name || 'User'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {user?.email || 'user@example.com'}
          </Typography>
        </Box>
        
        <MenuItem onClick={() => navigate('/user/profile')}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>My Profile</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => navigate('/user/settings')}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => navigate('/user/help')}>
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
        
        {loadingNotifications ? (
          <Box sx={{ px: 2, py: 2, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ px: 2, py: 2 }}>
            <Typography variant="body2" color="textSecondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          notifications.map((notification) => (
            <MenuItem 
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              sx={{ 
                py: 1.5,
                borderLeft: notification.unread ? 3 : 0,
                borderColor: 'primary.main',
                bgcolor: notification.unread ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', flex: 1 }}>
                    {notification.title}
                  </Typography>
                  {notification.type === 'adoption' && (
                    <AdoptionIcon sx={{ color: 'primary.main', fontSize: 16 }} />
                  )}
                  {notification.type === 'reservation' && (
                    <ShoppingCartIcon sx={{ color: 'secondary.main', fontSize: 16 }} />
                  )}
                  {notification.type === 'payment' && (
                    <PaymentIcon sx={{ color: 'success.main', fontSize: 16 }} />
                  )}
                  {notification.type === 'vet' && (
                    <MedicalIcon sx={{ color: 'error.main', fontSize: 16 }} />
                  )}
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                  {notification.message}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(notification.time).toLocaleString()}
                  </Typography>
                  {notification.action && (
                    <Chip 
                      label={notification.action} 
                      size="small" 
                      variant="outlined" 
                      sx={{ height: 20 }}
                    />
                  )}
                </Box>
              </Box>
            </MenuItem>
          ))
        )}
        
        <Divider />
        
        <MenuItem 
          onClick={() => {
            navigate('/user/notifications')
            handleNotificationClose()
          }} 
          sx={{ justifyContent: 'center', py: 1 }}
        >
          <Typography variant="body2" color="primary" sx={{ fontWeight: 'medium' }}>
            View All Notifications
          </Typography>
        </MenuItem>
      </Menu>
    </>
  )
}

export default TopNavbar