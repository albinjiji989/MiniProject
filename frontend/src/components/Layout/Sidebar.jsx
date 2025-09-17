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
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'

const getMenuItems = (userRole) => {
  const baseItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['all'] },
    { text: 'Profile', icon: <ProfileIcon />, path: '/profile', roles: ['all'] },
  ]

  // Super Admin gets access to everything
  if (userRole === 'super_admin') {
    return [
      ...baseItems,
      { text: 'RBAC Management', icon: <SecurityIcon />, path: '/rbac', roles: ['super_admin'] },
      { text: 'Core System', icon: <SettingsIcon />, path: '/core', roles: ['super_admin'] },
      { text: 'Users', icon: <UsersIcon />, path: '/users', roles: ['super_admin'] },
      { text: 'Adoption', icon: <AdoptionIcon />, path: '/adoption', roles: ['adoption_admin', 'super_admin'] },
      { text: 'Shelter', icon: <ShelterIcon />, path: '/shelter', roles: ['shelter_admin', 'super_admin'] },
      { text: 'Rescue', icon: <RescueIcon />, path: '/rescue', roles: ['rescue_admin', 'super_admin'] },
      { text: 'E-Commerce', icon: <EcommerceIcon />, path: '/ecommerce', roles: ['ecommerce_admin', 'super_admin'] },
      { text: 'Pharmacy', icon: <PharmacyIcon />, path: '/pharmacy', roles: ['pharmacy_admin', 'super_admin'] },
      
      
      { text: 'Temporary Care', icon: <TemporaryCareIcon />, path: '/temporary-care', roles: ['temporary_care_admin', 'super_admin'] },
      { text: 'Veterinary', icon: <VeterinaryIcon />, path: '/veterinary', roles: ['veterinary_admin', 'super_admin'] },
    ]
  }

  // Module Admins get access to their specific module and general access
  if (userRole.includes('_admin')) {
    const moduleItems = []
    
    // Add module-specific access
    if (userRole === 'adoption_admin') {
      moduleItems.push({ text: 'Adoption Management', icon: <AdoptionIcon />, path: '/adoption', roles: ['adoption_admin'] })
    }
    if (userRole === 'veterinary_admin') {
      moduleItems.push({ text: 'Veterinary Management', icon: <VeterinaryIcon />, path: '/veterinary', roles: ['veterinary_admin'] })
    }
    if (userRole === 'shelter_admin') {
      moduleItems.push({ text: 'Shelter Management', icon: <ShelterIcon />, path: '/shelter', roles: ['shelter_admin'] })
    }
    if (userRole === 'rescue_admin') {
      moduleItems.push({ text: 'Rescue Management', icon: <RescueIcon />, path: '/rescue', roles: ['rescue_admin'] })
    }
    if (userRole === 'ecommerce_admin') {
      moduleItems.push({ text: 'E-Commerce Management', icon: <EcommerceIcon />, path: '/ecommerce', roles: ['ecommerce_admin'] })
    }
    if (userRole === 'pharmacy_admin') {
      moduleItems.push({ text: 'Pharmacy Management', icon: <PharmacyIcon />, path: '/pharmacy', roles: ['pharmacy_admin'] })
    }
    

    return [...baseItems, ...moduleItems]
  }

  // Staff/Workers get limited access
  if (userRole.includes('_worker') || userRole.includes('_staff')) {
    return [
      ...baseItems,
      { text: 'My Tasks', icon: <AssignmentIcon />, path: '/tasks', roles: ['staff'] },
      { text: 'Schedule', icon: <ScheduleIcon />, path: '/schedule', roles: ['staff'] },
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
      
      
    ]
  }

  return baseItems
}

const Sidebar = ({ onClose }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const handleNavigation = (path) => {
    navigate(path)
    onClose?.()
  }

  // Get menu items based on user role
  const menuItems = getMenuItems(user?.role || 'public_user')

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
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user?.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
              {user?.role?.replace('_', ' ')}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ px: 2, py: 1 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={location.pathname === item.path}
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
                    fontWeight: location.pathname === item.path ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 3, borderTop: '1px solid #e5e7eb' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          © 2024 Pet Welfare System
        </Typography>
      </Box>
    </Box>
  )
}

export default Sidebar
