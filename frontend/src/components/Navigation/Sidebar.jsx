import React, { useState } from 'react'
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Avatar,
  Chip,
  IconButton,
  Collapse,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Pets as PetsIcon,
  Store as StoreIcon,
  Favorite as FavoriteIcon,
  BookOnline as BookOnlineIcon,
  LocalShipping as LocalShippingIcon,
  Home as HomeIcon,
  LocalHospital as LocalHospitalIcon,
  LocalPharmacy as LocalPharmacyIcon,
  ShoppingCart as ShoppingCartIcon,
  Person as ProfileIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Logout as LogoutIcon,
  ExpandLess,
  ExpandMore,
  ChevronLeft as ChevronLeftIcon,
  Menu as MenuIcon
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'

const DRAWER_WIDTH = 280

const Sidebar = ({ open, onClose, user }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [expandedItems, setExpandedItems] = useState({
    pets: false
  })

  const handleExpand = (item) => {
    setExpandedItems(prev => ({
      ...prev,
      [item]: !prev[item]
    }))
  }

  const navigationItems = [
    { title: 'Dashboard', icon: <DashboardIcon />, path: '/User/dashboard', active: location.pathname === '/User/dashboard' },
    { title: 'Adoption', icon: <FavoriteIcon />, path: '/User/adoption', active: location.pathname.startsWith('/User/adoption') },
    { title: 'Pet Shop', icon: <StoreIcon />, path: '/User/petshop', active: location.pathname.startsWith('/User/petshop'), badge: 'Popular' },
    { title: 'Rescue', icon: <LocalShippingIcon />, path: '/User/rescue', active: location.pathname.startsWith('/User/rescue') },
    { title: 'Veterinary', icon: <LocalHospitalIcon />, path: '/User/veterinary', active: location.pathname.startsWith('/User/veterinary') },
    { title: 'Pharmacy', icon: <LocalPharmacyIcon />, path: '/User/pharmacy', active: location.pathname.startsWith('/User/pharmacy') },
    { title: 'Temporary Care', icon: <HomeIcon />, path: '/User/temporary-care', active: location.pathname.startsWith('/User/temporary-care') },
    { title: 'Ecommerce', icon: <ShoppingCartIcon />, path: '/User/ecommerce', active: location.pathname.startsWith('/User/ecommerce') },
    // Small My Pets group retained
    {
      title: 'My Pets',
      icon: <PetsIcon />,
      expandable: true,
      expanded: expandedItems.pets,
      children: [
        { title: 'All Pets', icon: <PetsIcon />, path: '/User/pets', active: location.pathname === '/User/pets' },
        { title: 'Add Pet', icon: <HomeIcon />, path: '/User/pets/add', active: location.pathname === '/User/pets/add' },
        { title: 'Request Breed', icon: <BookOnlineIcon />, path: '/User/pets/request-breed', active: location.pathname.includes('/request-breed') },
        { title: 'Owned Pets', icon: <FavoriteIcon />, path: '/User/owned-pets', active: location.pathname === '/User/owned-pets' }
      ]
    }
  ]

  const bottomItems = [
    {
      title: 'Profile',
      icon: <ProfileIcon />,
      path: '/User/profile'
    },
    {
      title: 'Settings',
      icon: <SettingsIcon />,
      path: '/User/settings'
    },
    {
      title: 'Help & Support',
      icon: <HelpIcon />,
      path: '/User/help'
    }
  ]

  const handleNavigation = (path) => {
    navigate(path)
    if (isMobile) {
      onClose()
    }
  }

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            PetCare Hub
          </Typography>
          {isMobile && (
            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <ChevronLeftIcon />
            </IconButton>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            sx={{ 
              width: 48, 
              height: 48,
              bgcolor: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.3)'
            }}
          >
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {user?.name || 'User'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {user?.email || 'user@example.com'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation Items */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        <List>
          {navigationItems.map((item, index) => (
            <React.Fragment key={index}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => item.expandable ? handleExpand(item.title.toLowerCase().replace(' ', '')) : handleNavigation(item.path)}
                  sx={{
                    mx: 1,
                    borderRadius: 2,
                    mb: 0.5,
                    bgcolor: item.active ? 'primary.main' : 'transparent',
                    color: item.active ? 'white' : 'inherit',
                    '&:hover': {
                      bgcolor: item.active ? 'primary.dark' : 'action.hover'
                    }
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: item.active ? 'white' : 'primary.main',
                    minWidth: 40
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.title}
                    primaryTypographyProps={{
                      fontWeight: item.active ? 'bold' : 'normal'
                    }}
                  />
                  {item.badge && (
                    <Chip 
                      label={item.badge} 
                      size="small" 
                      color="secondary"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                  {item.expandable && (
                    item.expanded ? <ExpandLess /> : <ExpandMore />
                  )}
                </ListItemButton>
              </ListItem>
              
              {item.expandable && (
                <Collapse in={item.expanded} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children?.map((child, childIndex) => (
                      <ListItem key={childIndex} disablePadding>
                        <ListItemButton
                          onClick={() => handleNavigation(child.path)}
                          sx={{
                            pl: 4,
                            mx: 1,
                            borderRadius: 2,
                            mb: 0.5,
                            bgcolor: child.active ? 'primary.main' : 'transparent',
                            color: child.active ? 'white' : 'inherit',
                            '&:hover': {
                              bgcolor: child.active ? 'primary.dark' : 'action.hover'
                            }
                          }}
                        >
                          <ListItemIcon sx={{ 
                            color: child.active ? 'white' : 'text.secondary',
                            minWidth: 32
                          }}>
                            {child.icon}
                          </ListItemIcon>
                          <ListItemText 
                            primary={child.title}
                            primaryTypographyProps={{
                              fontSize: '0.9rem',
                              fontWeight: child.active ? 'bold' : 'normal'
                            }}
                          />
                          {child.badge && (
                            <Chip 
                              label={child.badge} 
                              size="small" 
                              color="secondary"
                              sx={{ height: 18, fontSize: '0.6rem' }}
                            />
                          )}
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Bottom Items */}
        <List>
          {bottomItems.map((item, index) => (
            <ListItem key={index} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  mb: 0.5,
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'text.secondary', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.title} />
              </ListItemButton>
            </ListItem>
          ))}
          
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                // Handle logout
                localStorage.removeItem('token')
                navigate('/login')
              }}
              sx={{
                mx: 1,
                borderRadius: 2,
                color: 'error.main',
                '&:hover': {
                  bgcolor: 'error.lighter'
                }
              }}
            >
              <ListItemIcon sx={{ color: 'error.main', minWidth: 40 }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="textSecondary" align="center" display="block">
          © 2024 PetCare Hub
        </Typography>
        <Typography variant="caption" color="textSecondary" align="center" display="block">
          Version 2.0.1
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Drawer
      variant="temporary" // Always use temporary to avoid layout shifts
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        width: 0, // Don't take up space when closed
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          top: '64px', // Account for top navbar
          height: 'calc(100vh - 64px)',
          zIndex: 1300 // High z-index to overlay content
        },
      }}
      ModalProps={{
        keepMounted: true, // Better performance
      }}
    >
      {drawerContent}
    </Drawer>
  )
}

export default Sidebar
