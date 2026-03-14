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
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Pets as PetsIcon,
  Favorite as AdoptionIcon,
  Home as ShelterIcon,
  Store as StoreIcon,
  Report as RescueIcon,
  ShoppingCart as EcommerceIcon,
  LocalPharmacy as PharmacyIcon,
  Support as TemporaryCareIcon,
  LocalHospital as VeterinaryIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  People as UsersIcon,
  People as PeopleIcon,
  Person as ProfileIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  AdminPanelSettings as SuperAdminIcon,
  Business as ModuleIcon,
  BusinessCenter as BusinessIcon,
  TrendingUp as StatsIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  ExpandLess,
  ExpandMore,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  // Additional icons for comprehensive admin functions
  Assessment as AssessmentIcon,
  FileUpload as FileUploadIcon,
  FileDownload as FileDownloadIcon,
  PersonAdd as PersonAddIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Storage as StorageIcon,
  Backup as BackupIcon,
  HealthAndSafety as HealthIcon,
  AttachMoney as AttachMoneyIcon,
  Analytics as AnalyticsIcon,
  LocalHospital as LocalHospitalIcon,
  Home as HomeIcon,
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { authAPI, modulesAPI } from '../../services/api'
import firebaseAuth from '../../services/firebaseAuth'
const getMenuItems = (userRole, userDetails, activeModules = []) => {
  // Role-aware default dashboard path
  const dashboardPath = (
    userRole === 'admin' || userRole === 'super_admin'
      ? '/admin/dashboard'
      : (typeof userRole === 'string' && userRole.endsWith('_manager')
        ? '/manager/dashboard'
        : '/User/dashboard')
  )

  // Role-aware profile path
  const profilePath = (
    userRole === 'admin' || userRole === 'super_admin'
      ? '/admin/profile'
      : (typeof userRole === 'string' && userRole.endsWith('_manager')
        ? '/manager/profile'
        : '/User/profile')
  )

  const baseItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: dashboardPath, roles: ['all'] },
  ]

  // Admin simplified navigation
  if (userRole === 'admin') {
    const baseWithoutDashboard = baseItems.filter(i => i.text !== 'Dashboard')
    return [
      ...baseWithoutDashboard,
      { text: 'Admin Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard', roles: ['admin'] },
      { text: 'Public User Management', icon: <PeopleIcon />, path: '/admin/users', roles: ['admin'] },
      { text: 'Module Management', icon: <ModuleIcon />, path: '/admin/modules', roles: ['admin'] },
      { text: 'Manager Management', icon: <BusinessIcon />, path: '/admin/managers', roles: ['admin'] },
      {
        text: 'Pet Management',
        icon: <PetsIcon />,
        children: [
          { text: 'All Pets', icon: <PetsIcon />, path: '/admin/pets', roles: ['admin'] },
          { text: 'Category', icon: <PetsIcon />, path: '/admin/pet-categories', roles: ['admin'] },
          { text: 'Species', icon: <PetsIcon />, path: '/admin/species', roles: ['admin'] },
          { text: 'Breed', icon: <PetsIcon />, path: '/admin/breeds', roles: ['admin'] },
          { text: 'Breed Request', icon: <AssignmentIcon />, path: '/admin/custom-breed-requests', roles: ['admin'] },
          { text: 'Name Change Requests', icon: <EditIcon />, path: '/admin/name-change-requests', roles: ['admin'] },
        ]
      },
    ]
  }

  // Module Managers get access to their specific module
  if (userRole.includes('_manager')) {
    const moduleItems = []
    // VETERINARY MANAGER - Only veterinary-specific functions
    if (userRole === 'veterinary_manager') {
      return [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/manager/dashboard', roles: ['veterinary_manager'] },
        { text: 'Appointments', icon: <ScheduleIcon />, path: '/manager/veterinary/appointments', roles: ['veterinary_manager'] },
        { text: 'Medical Records', icon: <LocalHospitalIcon />, path: '/manager/veterinary/records', roles: ['veterinary_manager'] },
        { text: 'Patients', icon: <PetsIcon />, path: '/manager/veterinary/patients', roles: ['veterinary_manager'] },
        { text: 'Staff Management', icon: <PeopleIcon />, path: '/manager/veterinary/staff', roles: ['veterinary_manager'] },
        { text: 'Services', icon: <BusinessIcon />, path: '/manager/veterinary/services', roles: ['veterinary_manager'] },
        { text: 'Reports', icon: <AnalyticsIcon />, path: '/manager/veterinary/reports', roles: ['veterinary_manager'] },
      ]
    }

    // TEMPORARY CARE MANAGER - Only temporary care-specific functions
    if (userRole === 'temporary-care_manager' || userRole === 'temporary_care_manager') {
      return [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/manager/dashboard', roles: ['temporary-care_manager', 'temporary_care_manager'] },
        { text: 'Bookings', icon: <AssignmentIcon />, path: '/manager/temporary-care/bookings', roles: ['temporary-care_manager', 'temporary_care_manager'] },
        { text: 'Facilities', icon: <HomeIcon />, path: '/manager/temporary-care/facilities', roles: ['temporary-care_manager', 'temporary_care_manager'] },
        { text: 'Caregivers', icon: <PeopleIcon />, path: '/manager/temporary-care/caregivers', roles: ['temporary-care_manager', 'temporary_care_manager'] },
        { text: 'Pets in Care', icon: <PetsIcon />, path: '/manager/temporary-care/pets', roles: ['temporary-care_manager', 'temporary_care_manager'] },
        { text: 'Reports', icon: <AnalyticsIcon />, path: '/manager/temporary-care/reports', roles: ['temporary-care_manager', 'temporary_care_manager'] },
      ]
    }

    // ADOPTION MANAGER
    if (userRole === 'adoption_manager') {
      return [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/manager/dashboard', roles: ['adoption_manager'] },
        { text: 'Pets', icon: <PetsIcon />, path: '/manager/adoption/pets', roles: ['adoption_manager'] },
        { text: 'Applications', icon: <AssignmentIcon />, path: '/manager/adoption/applications', roles: ['adoption_manager'] },
        { text: 'Import (CSV)', icon: <FileUploadIcon />, path: '/manager/adoption/import', roles: ['adoption_manager'] },
        { text: 'Reports', icon: <AnalyticsIcon />, path: '/manager/adoption/reports', roles: ['adoption_manager'] },
      ]
    }

    // PETSHOP MANAGER
    if (userRole === 'petshop_manager') {
      return [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/manager/dashboard', roles: ['petshop_manager'] },
        { text: 'Inventory', icon: <StoreIcon />, path: '/manager/petshop/inventory', roles: ['petshop_manager'] },
        { text: 'Orders', icon: <ShoppingCartIcon />, path: '/manager/petshop/orders', roles: ['petshop_manager'] },
        { text: 'Reservations', icon: <AssignmentIcon />, path: '/manager/petshop/reservations', roles: ['petshop_manager'] },
        { text: 'Reports', icon: <AnalyticsIcon />, path: '/manager/petshop/reports', roles: ['petshop_manager'] },
      ]
    }

    // Fallback for other managers
    return [
      ...baseItems,
      ...moduleItems,
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

  // Public Users get access to public services - filter by active modules
  if (userRole === 'public_user') {
    const moduleMap = {
      'adoption': { text: 'Adoption', icon: <AdoptionIcon />, path: '/User/adoption' },
      'petshop': { text: 'Pet Shop', icon: <StoreIcon />, path: '/User/petshop' },
      'veterinary': { text: 'Veterinary', icon: <VeterinaryIcon />, path: '/User/veterinary' },
      'ecommerce': { text: 'E-Commerce', icon: <EcommerceIcon />, path: '/User/ecommerce' },
      'pharmacy': { text: 'Pharmacy', icon: <PharmacyIcon />, path: '/User/pharmacy' },
      'temporary-care': { text: 'Temporary Care', icon: <TemporaryCareIcon />, path: '/User/temporary-care' },
    }

    const userItems = [...baseItems]
    
    // Add only active modules
    activeModules.forEach(module => {
      if (moduleMap[module.key]) {
        userItems.push({
          ...moduleMap[module.key],
          roles: ['public_user']
        })
      }
    })

    return userItems
  }

  return baseItems
}

const RoleBasedSidebar = ({ onClose }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [expandedItems, setExpandedItems] = React.useState({})
  const [activeModules, setActiveModules] = React.useState([])
  const [modulesLoading, setModulesLoading] = React.useState(true)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Fetch active modules for public users
  React.useEffect(() => {
    const fetchModules = async () => {
      if (user?.role === 'public_user') {
        try {
          setModulesLoading(true)
          const res = await modulesAPI.list()
          const modules = res.data?.data || []
          // Filter only active modules
          const activeOnly = modules.filter(module => module.status === 'active')
          setActiveModules(activeOnly)
        } catch (error) {
          console.error('Failed to load modules:', error)
          setActiveModules([])
        } finally {
          setModulesLoading(false)
        }
      } else {
        setModulesLoading(false)
      }
    }

    fetchModules()
  }, [user?.role])

  const handleNavigation = (path) => {
    navigate(path)
    // Only close sidebar on mobile devices
    if (isMobile) {
      onClose?.()
    }
  }

  const handleExpandClick = (itemText) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemText]: !prev[itemText]
    }))
  }

  const handleLogout = async (event) => {
    console.log('Sidebar logout clicked')
    event?.preventDefault()
    event?.stopPropagation()
    
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

  // Get portal title based on role
  const getPortalTitle = () => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      return 'Admin Portal';
    } else if (typeof user?.role === 'string' && user.role.endsWith('_manager')) {
      return 'Manager Portal';
    } else {
      return 'User Portal';
    }
  };

  // Get menu items based on user role and active modules
  const menuItems = getMenuItems(user?.role || 'public_user', user?.details, activeModules);

  const renderMenuItem = (item, level = 0) => {
    const isExpanded = expandedItems[item.text]
    const hasChildren = item.children && item.children.length > 0
    // Consider a route active if it matches exactly or is a child path
    const isActive = item.path && (
      location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    )

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
            px: 1.25,
            '&.Mui-selected': {
              backgroundColor: 'rgba(59,130,246,0.10)', // soft blue
              border: '1px solid',
              borderColor: 'primary.main',
              boxShadow: '0 0 0 1px rgba(59,130,246,0.20) inset',
              '&:hover': {
                backgroundColor: 'rgba(59,130,246,0.14)',
              },
              '& .MuiListItemIcon-root': {
                color: 'primary.main',
              },
              '& .MuiListItemText-primary': {
                color: 'primary.main',
                fontWeight: 700,
              },
            },
            '&:hover': {
              backgroundColor: 'rgba(59,130,246,0.06)',
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
              fontWeight: isActive ? 700 : 500,
            }}
          />
        </ListItemButton>
      </ListItem>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with Portal Title and Close Button */}
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid', 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'background.paper'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {getPortalTitle()}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1 }}>
              {user?.name || user?.email}
            </Typography>
          </Box>
        </Box>
        {onClose && (
          <IconButton 
            onClick={onClose}
            size="small"
            sx={{ 
              display: { md: 'none' },
              '&:hover': { backgroundColor: 'grey.100' }
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ px: 2, py: 1.5 }}>
          {modulesLoading && user?.role === 'public_user' ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary">Loading modules...</Typography>
            </Box>
          ) : (
            menuItems.map((item) => renderMenuItem(item))
          )}
        </List>
      </Box>

      {/* Logout Button */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            color: 'error.main',
            '&:hover': {
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
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
              fontWeight: 600,
            }}
          />
        </ListItemButton>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          © 2024 Pet Welfare System
        </Typography>
      </Box>
    </Box>
  )
}

export default RoleBasedSidebar
