import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Avatar,
  Collapse,
  Chip,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Pets as PetsIcon,
  Favorite as AdoptionIcon,
  Home as ShelterIcon,
  Report as RescueIcon,
  ShoppingCart as EcommerceIcon,
  LocalPharmacy as PharmacyIcon,
  Support as TemporaryCareIcon,
  LocalHospital as VeterinaryIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  People as UsersIcon,
  Person as ProfileIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  AdminPanelSettings as SuperAdminIcon,
  Business as ModuleIcon,
  TrendingUp as StatsIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  ExpandLess,
  ExpandMore,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'

const getMenuItems = (userRole, userDetails) => {
  const baseItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['all'] },
    { text: 'Profile', icon: <ProfileIcon />, path: '/profile', roles: ['all'] },
  ]

  // Admin gets access to everything
  if (userRole === 'admin') {
    return [
      ...baseItems,
      {
        text: 'System Management',
        icon: <SuperAdminIcon />,
        children: [
          { text: 'Admin Management', icon: <UsersIcon />, path: '/admin-management', roles: ['admin'] },
          { text: 'User Management', icon: <PeopleIcon />, path: '/user-management', roles: ['admin'] },
          { text: 'RBAC Management', icon: <SecurityIcon />, path: '/rbac', roles: ['admin'] },
          { text: 'Core System', icon: <SettingsIcon />, path: '/core', roles: ['admin'] },
        ]
      },
      {
        text: 'Module Management',
        icon: <ModuleIcon />,
        children: [
          { text: 'Adoption', icon: <AdoptionIcon />, path: '/adoption', roles: ['admin'] },
          { text: 'Shelter', icon: <ShelterIcon />, path: '/shelter', roles: ['admin'] },
          { text: 'Rescue', icon: <RescueIcon />, path: '/rescue', roles: ['admin'] },
          { text: 'E-Commerce', icon: <EcommerceIcon />, path: '/ecommerce', roles: ['admin'] },
          { text: 'Pharmacy', icon: <PharmacyIcon />, path: '/pharmacy', roles: ['admin'] },
          { text: 'Temporary Care', icon: <TemporaryCareIcon />, path: '/temporary-care', roles: ['admin'] },
          { text: 'Veterinary', icon: <VeterinaryIcon />, path: '/veterinary', roles: ['admin'] },
        ]
      },
      {
        text: 'Analytics & Reports',
        icon: <StatsIcon />,
        children: [
          { text: 'System Overview', icon: <DashboardIcon />, path: '/analytics/system', roles: ['admin'] },
          { text: 'User Analytics', icon: <PeopleIcon />, path: '/analytics/users', roles: ['admin'] },
          { text: 'Module Performance', icon: <ModuleIcon />, path: '/analytics/modules', roles: ['admin'] },
        ]
      }
    ]
  }

  // Module Managers get access to their specific module
  if (userRole.includes('_manager')) {
    const moduleName = userRole.replace('_manager', '')
    const moduleItems = []
    
    // Add module-specific access based on the manager's role
    if (userRole === 'adoption_manager') {
      moduleItems.push(
        { text: 'Adoption Management', icon: <AdoptionIcon />, path: '/adoption', roles: ['adoption_manager'] },
        { text: 'Applications', icon: <AssignmentIcon />, path: '/adoption/applications', roles: ['adoption_manager'] },
        { text: 'Pet Management', icon: <PetsIcon />, path: '/adoption/pets', roles: ['adoption_manager'] }
      )
    } else if (userRole === 'shelter_manager') {
      moduleItems.push(
        { text: 'Shelter Management', icon: <ShelterIcon />, path: '/shelter', roles: ['shelter_manager'] },
        { text: 'Capacity Management', icon: <HomeIcon />, path: '/shelter/capacity', roles: ['shelter_manager'] },
        { text: 'Staff Management', icon: <PeopleIcon />, path: '/shelter/staff', roles: ['shelter_manager'] }
      )
    } else if (userRole === 'rescue_manager') {
      moduleItems.push(
        { text: 'Rescue Management', icon: <RescueIcon />, path: '/rescue', roles: ['rescue_manager'] },
        { text: 'Emergency Cases', icon: <AssignmentIcon />, path: '/rescue/emergencies', roles: ['rescue_manager'] },
        { text: 'Team Management', icon: <PeopleIcon />, path: '/rescue/team', roles: ['rescue_manager'] }
      )
    } else if (userRole === 'ecommerce_manager') {
      moduleItems.push(
        { text: 'E-Commerce Management', icon: <EcommerceIcon />, path: '/ecommerce', roles: ['ecommerce_manager'] },
        { text: 'Product Management', icon: <ShoppingCartIcon />, path: '/ecommerce/products', roles: ['ecommerce_manager'] },
        { text: 'Order Management', icon: <AssignmentIcon />, path: '/ecommerce/orders', roles: ['ecommerce_manager'] }
      )
    } else if (userRole === 'pharmacy_manager') {
      moduleItems.push(
        { text: 'Pharmacy Management', icon: <PharmacyIcon />, path: '/pharmacy', roles: ['pharmacy_manager'] },
        { text: 'Inventory Management', icon: <AssignmentIcon />, path: '/pharmacy/inventory', roles: ['pharmacy_manager'] },
        { text: 'Prescription Management', icon: <AssignmentIcon />, path: '/pharmacy/prescriptions', roles: ['pharmacy_manager'] }
      )
    
    } else if (userRole === 'temporary-care_manager') {
      moduleItems.push(
        { text: 'Temporary Care Management', icon: <TemporaryCareIcon />, path: '/temporary-care', roles: ['temporary-care_manager'] },
        { text: 'Caregiver Management', icon: <PeopleIcon />, path: '/temporary-care/caregivers', roles: ['temporary-care_manager'] },
        { text: 'Request Management', icon: <AssignmentIcon />, path: '/temporary-care/requests', roles: ['temporary-care_manager'] }
      )
    } else if (userRole === 'veterinary_manager') {
      moduleItems.push(
        { text: 'Veterinary Management', icon: <VeterinaryIcon />, path: '/veterinary', roles: ['veterinary_manager'] },
        { text: 'Appointment Management', icon: <ScheduleIcon />, path: '/veterinary/appointments', roles: ['veterinary_manager'] },
        { text: 'Medical Records', icon: <AssignmentIcon />, path: '/veterinary/records', roles: ['veterinary_manager'] }
      )
    }

    return [
      ...baseItems,
      ...moduleItems,
      {
        text: 'Analytics',
        icon: <StatsIcon />,
        children: [
          { text: 'Module Overview', icon: <DashboardIcon />, path: '/analytics/module', roles: [userRole] },
          { text: 'Performance Metrics', icon: <TrendingUpIcon />, path: '/analytics/performance', roles: [userRole] },
        ]
      }
    ]
  }

  // Staff/Workers get limited access
  if (userRole.includes('_worker') || userRole.includes('_staff')) {
    return [
      ...baseItems,
      { text: 'My Tasks', icon: <AssignmentIcon />, path: '/tasks', roles: ['staff'] },
      { text: 'Schedule', icon: <ScheduleIcon />, path: '/schedule', roles: ['staff'] },
      { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications', roles: ['staff'] },
    ]
  }

  // Public Users get access to public services
  if (userRole === 'public_user') {
    return [
      ...baseItems,
      { text: 'My Pets', icon: <PetsIcon />, path: '/pets', roles: ['public_user'] },
      { text: 'Adoption', icon: <AdoptionIcon />, path: '/adoption', roles: ['public_user'] },
      { text: 'Veterinary', icon: <VeterinaryIcon />, path: '/veterinary', roles: ['public_user'] },
      { text: 'E-Commerce', icon: <EcommerceIcon />, path: '/ecommerce', roles: ['public_user'] },
      { text: 'Pharmacy', icon: <PharmacyIcon />, path: '/pharmacy', roles: ['public_user'] },
      { text: 'Temporary Care', icon: <TemporaryCareIcon />, path: '/temporary-care', roles: ['public_user'] },
    ]
  }

  return baseItems
}

const RoleBasedSidebar = ({ onClose }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [expandedItems, setExpandedItems] = React.useState({})

  const handleNavigation = (path) => {
    navigate(path)
    onClose?.()
  }

  const handleExpandClick = (itemText) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemText]: !prev[itemText]
    }))
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Get menu items based on user role
  const menuItems = getMenuItems(user?.role || 'public_user', user?.details)

  const renderMenuItem = (item, level = 0) => {
    const isExpanded = expandedItems[item.text]
    const hasChildren = item.children && item.children.length > 0
    const isActive = location.pathname === item.path

    if (hasChildren) {
      return (
        <React.Fragment key={item.text}>
          <ListItem disablePadding sx={{ pl: level * 2 }}>
            <ListItemButton
              onClick={() => handleExpandClick(item.text)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&:hover': {
                  backgroundColor: 'grey.50',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              />
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map((child) => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        </React.Fragment>
      )
    }

    return (
      <ListItem key={item.text} disablePadding sx={{ pl: level * 2, mb: 0.5 }}>
        <ListItemButton
          onClick={() => handleNavigation(item.path)}
          selected={isActive}
          sx={{
            borderRadius: 2,
            '&.Mui-selected': {
              backgroundColor: 'primary.50',
              '&:hover': {
                backgroundColor: 'primary.100',
              },
              '& .MuiListItemIcon-root': {
                color: 'primary.main',
              },
              '& .MuiListItemText-primary': {
                color: 'primary.main',
                fontWeight: 600,
              },
            },
            '&:hover': {
              backgroundColor: 'grey.50',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText 
            primary={item.text}
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
            }}
          />
        </ListItemButton>
      </ListItem>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Header */}
      <Box sx={{ p: 3, borderBottom: '1px solid #e5e7eb' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            <PetsIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Pet Welfare
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Management System
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* User Info */}
      <Box sx={{ p: 3, borderBottom: '1px solid #e5e7eb' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'secondary.main' }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user?.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={user?.role?.replace('_', ' ')} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
              {user?.details?.assignedModule && (
                <Chip 
                  label={user.details.assignedModule} 
                  size="small" 
                  color="secondary" 
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ px: 2, py: 1 }}>
          {menuItems.map((item) => renderMenuItem(item))}
        </List>
      </Box>

      {/* Logout Button */}
      <Box sx={{ p: 2, borderTop: '1px solid #e5e7eb' }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            color: 'error.main',
            '&:hover': {
              backgroundColor: 'error.50',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Logout"
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          />
        </ListItemButton>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid #e5e7eb' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          © 2024 Pet Welfare System
        </Typography>
      </Box>
    </Box>
  )
}

export default RoleBasedSidebar
