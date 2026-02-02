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
  useMediaQuery,
  Button
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as OrdersIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Store as StoreIcon,
  Pets as PetsIcon,
  Receipt as InvoiceIcon,
  BookOnline as ReservationsIcon,
  Person as ProfileIcon,
  Logout as LogoutIcon,
  ExpandLess,
  ExpandMore,
  ChevronLeft as ChevronLeftIcon,
  ShoppingCart,
  People as StaffIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'

const DRAWER_WIDTH = 280

const ManagerSidebar = ({ open, onClose, user, moduleType = 'petshop' }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [expandedItems, setExpandedItems] = useState({
    inventory: false,
    orders: false,
    reports: false,
    adoption: false,
  })

  const handleExpand = (item) => {
    setExpandedItems(prev => ({
      ...prev,
      [item]: !prev[item]
    }))
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

  const getModuleColor = (type) => {
    const colors = {
      petshop: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      adoption: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      ecommerce: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      pharmacy: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      rescue: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      veterinary: 'linear-gradient(135deg, #00b4db 0%, #0083b0 100%)', // Professional medical blue
      'temporary-care': 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)' // Warm caring pink-red
    }
    return colors[type] || colors.petshop
  }

  const getNavigationItems = (type) => {
    // ADOPTION MANAGER
    if (type === 'adoption') {
      return [
        {
          title: 'Dashboard',
          icon: <DashboardIcon />,
          path: `/manager/${type}/dashboard`,
          active: location.pathname === `/manager/${type}/dashboard`
        },
        {
          title: 'All Pets',
          icon: <PetsIcon />,
          path: `/manager/${type}/pets`,
          active: location.pathname === `/manager/${type}/pets` || (location.pathname.startsWith(`/manager/${type}/pets/`) && !location.pathname.includes('/edit'))
        },
        {
          title: 'Add Pet (Wizard)',
          icon: <InventoryIcon />,
          path: `/manager/${type}/wizard/start`,
          active: location.pathname.includes('/wizard')
        },
        {
          title: 'Applications',
          icon: <ReservationsIcon />,
          path: `/manager/${type}/applications`,
          active: location.pathname.includes('/applications')
        },
        {
          title: 'Import Pets (CSV)',
          icon: <InventoryIcon />,
          path: `/manager/${type}/import`,
          active: location.pathname.includes('/import')
        },
        {
          title: 'Reports',
          icon: <ReportsIcon />,
          path: `/manager/${type}/reports`,
          active: location.pathname.includes('/reports')
        }
      ]
    }
    
    // VETERINARY MANAGER
    if (type === 'veterinary') {
      return [
        {
          title: 'Dashboard',
          icon: <DashboardIcon />,
          path: '/manager/veterinary/dashboard',
          active: location.pathname === '/manager/veterinary/dashboard'
        },
        {
          title: 'Appointments',
          icon: <ReservationsIcon />,
          path: '/manager/veterinary/appointments',
          active: location.pathname.includes('/appointments')
        },
        {
          title: 'Medical Records',
          icon: <ReportsIcon />,
          path: '/manager/veterinary/records',
          active: location.pathname.includes('/records')
        },
        {
          title: 'Patients',
          icon: <PetsIcon />,
          path: '/manager/veterinary/patients',
          active: location.pathname.includes('/patients')
        },
        {
          title: 'Staff Management',
          icon: <StaffIcon />,
          path: '/manager/veterinary/staff',
          active: location.pathname.includes('/staff')
        },
        {
          title: 'Services',
          icon: <SettingsIcon />,
          path: '/manager/veterinary/services',
          active: location.pathname.includes('/services')
        },
        {
          title: 'Reports',
          icon: <AnalyticsIcon />,
          path: '/manager/veterinary/reports',
          active: location.pathname.includes('/reports')
        }
      ]
    }
    
    // TEMPORARY CARE MANAGER
    if (type === 'temporary-care') {
      return [
        {
          title: 'Dashboard',
          icon: <DashboardIcon />,
          path: '/manager/temporary-care/dashboard',
          active: location.pathname === '/manager/temporary-care/dashboard'
        },
        {
          title: 'Bookings',
          icon: <ReservationsIcon />,
          path: '/manager/temporary-care/bookings',
          active: location.pathname.includes('/bookings')
        },
        {
          title: 'Facilities',
          icon: <StoreIcon />,
          path: '/manager/temporary-care/facilities',
          active: location.pathname.includes('/facilities')
        },
        {
          title: 'Pets in Care',
          icon: <PetsIcon />,
          path: '/manager/temporary-care/pets',
          active: location.pathname.includes('/pets')
        },
        {
          title: 'Reports',
          icon: <AnalyticsIcon />,
          path: '/manager/temporary-care/reports',
          active: location.pathname.includes('/reports')
        }
      ]
    }
    
    // ECOMMERCE MANAGER
    if (type === 'ecommerce') {
      return [
        {
          title: 'Dashboard',
          icon: <DashboardIcon />,
          path: '/manager/ecommerce/dashboard',
          active: location.pathname === '/manager/ecommerce/dashboard'
        },
        {
          title: 'Products',
          icon: <InventoryIcon />,
          path: '/manager/ecommerce/products',
          active: location.pathname.includes('/products')
        },
        {
          title: 'Orders',
          icon: <OrdersIcon />,
          path: '/manager/ecommerce/orders',
          active: location.pathname.includes('/orders')
        },
        {
          title: 'Reports',
          icon: <ReportsIcon />,
          path: '/manager/ecommerce/reports',
          active: location.pathname.includes('/reports')
        }
      ]
    }
    
    // PETSHOP MANAGER (Default)
    return [
      {
        title: 'Dashboard',
        icon: <DashboardIcon />,
        path: `/manager/${type}/dashboard`,
        active: location.pathname === `/manager/${type}/dashboard`
      },
      {
        title: 'Inventory Management',
        icon: <InventoryIcon />,
        key: 'inventory',
        expandable: true,
        expanded: expandedItems.inventory,
        children: [
          {
            title: 'Pet Inventory',
            icon: <PetsIcon />,
            path: `/manager/${type}/inventory`,
            active: location.pathname.includes('/inventory')
          },
          {
            title: 'Add New Stock',
            icon: <InventoryIcon />,
            path: `/manager/${type}/wizard/basic`,
            active: location.pathname.includes('/wizard/basic')
          },
          {
            title: 'Manage Inventory',
            icon: <SettingsIcon />,
            path: `/manager/${type}/manage-inventory`,
            active: location.pathname.includes('/manage-inventory')
          },
          {
            title: 'Available For Sale',
            icon: <PetsIcon />,
            path: `/manager/${type}/for-sale`,
            active: location.pathname.includes('/for-sale')
          },
          // {
          //   title: 'Pricing Rules',
          //   icon: <SettingsIcon />,
          //   path: `/manager/${type}/pricing-rules`,
          //   active: location.pathname.includes('/pricing-rules')
          // }
        ]
      },
      {
        title: 'Orders & Sales',
        icon: <OrdersIcon />,
        key: 'orders',
        expandable: true,
        expanded: expandedItems.orders,
        children: [
          {
            title: 'All Orders',
            icon: <OrdersIcon />,
            path: `/manager/${type}/orders`,
            active: location.pathname.includes('/orders')
          },
          {
            title: 'Reservations',
            icon: <ReservationsIcon />,
            path: `/manager/${type}/reservations`,
            active: location.pathname.includes('/reservations')
          },
          {
            title: 'Invoices',
            icon: <InvoiceIcon />,
            path: `/manager/${type}/invoices`,
            active: location.pathname.includes('/invoices')
          },
          {
            title: 'Purchase Applications',
            icon: <ShoppingCart />,
            path: `/manager/${type}/purchase-applications`,
            active: location.pathname.includes('/purchase-applications')
          }
        ]
      },
      {
        title: 'Reports',
        icon: <ReportsIcon />,
        path: `/manager/${type}/reports`,
        active: location.pathname.includes('/reports')
      },
      {
        title: 'Store Settings',
        icon: <StoreIcon />,
        path: `/manager/${type}/settings`,
        active: location.pathname.includes('/settings')
      }
    ]
  }

  const navigationItems = getNavigationItems(moduleType)

  const bottomItems = [
    {
      title: 'Profile',
      icon: <ProfileIcon />,
      path: `/manager/profile`
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
        background: getModuleColor(moduleType),
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {getModuleTitle(moduleType)}
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
            {user?.name?.charAt(0) || 'M'}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {user?.name || 'Manager'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {user?.email || 'manager@example.com'}
            </Typography>
          </Box>
        </Box>

        {/* Primary Action Button */}
        <Box sx={{ mt: 2 }}>
          <Button
            fullWidth
            variant="contained"
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 700,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' }
            }}
            onClick={() => {
              let path = `/manager/${moduleType}/dashboard`
              if (moduleType === 'petshop') path = `/manager/${moduleType}/wizard/basic`
              if (moduleType === 'adoption') path = `/manager/${moduleType}/wizard/start`
              if (moduleType === 'veterinary') path = `/manager/veterinary/appointments/new`
              if (moduleType === 'temporary-care') path = `/manager/temporary-care/bookings`
              handleNavigation(path)
            }}
          >
            {moduleType === 'petshop' && 'Add New Stock'}
            {moduleType === 'adoption' && 'Start Add Pet Wizard'}
            {moduleType === 'veterinary' && 'New Appointment'}
            {moduleType === 'temporary-care' && 'New Booking'}
            {!['petshop', 'adoption', 'veterinary', 'temporary-care'].includes(moduleType) && 'Open Dashboard'}
          </Button>
        </Box>
      </Box>

      {/* Navigation Items */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        <List>
          {navigationItems.map((item, index) => (
            <React.Fragment key={index}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => item.expandable ? handleExpand(item.key) : handleNavigation(item.path)}
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
                      fontWeight: item.active ? 'bold' : 'normal',
                      fontSize: '0.9rem'
                    }}
                  />
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
                              fontSize: '0.85rem',
                              fontWeight: child.active ? 'bold' : 'normal'
                            }}
                          />
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
                <ListItemText 
                  primary={item.title}
                  primaryTypographyProps={{ fontSize: '0.9rem' }}
                />
                {item.badge && (
                  <Chip 
                    label={item.badge} 
                    size="small" 
                    color="error"
                    sx={{ height: 20, minWidth: 20 }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
          
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                localStorage.removeItem('token')
                setTimeout(() => {
                  navigate('/')
                }, 100)
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
              <ListItemText 
                primary="Logout"
                primaryTypographyProps={{ fontSize: '0.9rem' }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="textSecondary" align="center" display="block">
          © 2024 PetCare Manager
        </Typography>
        <Typography variant="caption" color="textSecondary" align="center" display="block">
          Version 2.0.1
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        width: open ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          top: isMobile ? 0 : '64px',
          height: isMobile ? '100vh' : 'calc(100vh - 64px)',
          zIndex: isMobile ? 1300 : 1200
        },
      }}
      ModalProps={{
        keepMounted: true,
      }}
    >
      {drawerContent}
    </Drawer>
  )
}

export default ManagerSidebar
