import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Snackbar,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material'
import {
  People as UsersIcon,
  Business as ModuleIcon,
  TrendingUp as StatsIcon,
  Storage as DatabaseIcon,
  CloudUpload as BackupIcon,
  Shield as SecurityShieldIcon,
  BusinessCenter as BusinessIcon,
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  Analytics as AnalyticsIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Pets as PetsIcon,
} from '@mui/icons-material'
import { modulesAPI, usersAPI, rolesAPI, managersAPI } from '../../services/api'

const StatCard = ({ title, value, icon, color = '#3b82f6', subtitle, trend }) => (
  <Card sx={{ 
    background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 3,
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease-in-out',
    '&:hover': { transform: 'translateY(-4px)' }
  }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: color, mb: 1 }}>
            {value}
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.primary', mb: 0.5 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Chip 
              label={trend} 
              size="small" 
              color={trend.includes('+') ? 'success' : 'error'}
              sx={{ mt: 1 }}
            />
          )}
        </Box>
        <Box sx={{ 
          p: 2, 
          borderRadius: '50%', 
          backgroundColor: `${color}20`,
          color: color 
        }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
)

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalModules: 0,
    activeModules: 0,
    moduleManagers: 0,
    totalRoles: 0,
    activeRoles: 0,
    totalPets: 0,
    totalAdoptions: 0,
    totalRescues: 0,
    totalShelters: 0,
    totalVeterinarians: 0,
    systemHealth: 'healthy'
  })
  const [analytics, setAnalytics] = useState({
    userGrowth: [],
    moduleUsage: [],
    recentActivities: [],
    systemHealth: 'healthy'
  })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all statistics in parallel
      const [userStatsResponse, modulesResponse, rolesResponse, managersResponse] = await Promise.all([
        usersAPI.getStats(),
        modulesAPI.list(),
        rolesAPI.list(),
        managersAPI.list()
      ])
      
      const userStats = userStatsResponse.data
      const modulesData = Array.isArray(modulesResponse.data) ? modulesResponse.data : []
      const rolesData = Array.isArray(rolesResponse.data) ? rolesResponse.data : []
      const managersData = Array.isArray(managersResponse.data) ? managersResponse.data : []
      
      setStats({
        totalUsers: userStats.publicUsers || 0,
        activeUsers: userStats.publicActiveUsers || 0,
        inactiveUsers: userStats.publicInactiveUsers || 0,
        totalModules: modulesData.length,
        activeModules: modulesData.filter(m => m.status === 'active').length,
        moduleManagers: managersData.length,
        totalRoles: rolesData.length,
        activeRoles: rolesData.filter(r => r.isActive !== false).length,
        totalPets: userStats.totalPets || 0,
        totalAdoptions: userStats.totalAdoptions || 0,
        totalRescues: userStats.totalRescues || 0,
        totalShelters: userStats.totalShelters || 0,
        totalVeterinarians: userStats.totalVeterinarians || 0,
        systemHealth: 'healthy'
      })

      // Mock analytics data - in real implementation, this would come from API
      setAnalytics({
        userGrowth: [
          { month: 'Jan', users: 120 },
          { month: 'Feb', users: 150 },
          { month: 'Mar', users: 180 },
          { month: 'Apr', users: 220 },
          { month: 'May', users: 280 },
          { month: 'Jun', users: 320 }
        ],
        moduleUsage: [
          { name: 'Adoption', usage: 85, status: 'active' },
          { name: 'Shelter', usage: 72, status: 'active' },
          { name: 'Rescue', usage: 68, status: 'active' },
          { name: 'Ecommerce', usage: 45, status: 'maintenance' },
          { name: 'Pharmacy', usage: 38, status: 'active' },
          { name: 'Veterinary', usage: 55, status: 'active' }
        ],
        recentActivities: [
          { id: 1, type: 'user_registration', message: 'New user registered: John Doe', time: '2 minutes ago', icon: <UsersIcon />, color: '#22c55e' },
          { id: 2, type: 'pet_adoption', message: 'Pet "Buddy" was adopted', time: '15 minutes ago', icon: <StatsIcon />, color: '#3b82f6' },
          { id: 3, type: 'module_update', message: 'Ecommerce module updated', time: '1 hour ago', icon: <ModuleIcon />, color: '#f59e0b' },
          { id: 4, type: 'manager_created', message: 'New manager added: Sarah Johnson', time: '2 hours ago', icon: <BusinessIcon />, color: '#8b5cf6' },
          { id: 5, type: 'system_alert', message: 'High server load detected', time: '3 hours ago', icon: <WarningIcon />, color: '#ef4444' }
        ],
        systemHealth: 'healthy'
      })
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setSnackbar({ 
        open: true, 
        message: 'Failed to load dashboard data', 
        severity: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 4 }}>
          <LinearProgress />
          <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
            Loading dashboard data...
          </Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
            System Overview
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Welcome to the Pet Welfare System Administration Panel. Monitor system health, manage users, and configure modules.
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            p: 2,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: 2,
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <CheckCircleIcon sx={{ color: '#22c55e' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              All systems are operational • Last updated: {new Date().toLocaleString()}
            </Typography>
          </Box>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={<UsersIcon sx={{ fontSize: 32 }} />}
              color="#3b82f6"
              subtitle={`${stats.activeUsers} active`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Active Modules"
              value={stats.activeModules}
              icon={<ModuleIcon sx={{ fontSize: 32 }} />}
              color="#22c55e"
              subtitle={`${stats.totalModules} total`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Managers"
              value={stats.moduleManagers}
              icon={<BusinessIcon sx={{ fontSize: 32 }} />}
              color="#f59e0b"
              subtitle="Module managers"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Roles"
              value={stats.totalRoles}
              icon={<SecurityShieldIcon sx={{ fontSize: 32 }} />}
              color="#8b5cf6"
              subtitle={`${stats.activeRoles} active`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="System Health"
              value="Healthy"
              icon={<CheckCircleIcon sx={{ fontSize: 32 }} />}
              color="#10b981"
              subtitle="All systems operational"
            />
          </Grid>
        </Grid>

        {/* Additional Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Total Pets"
              value={stats.totalPets}
              icon={<PetsIcon sx={{ fontSize: 32 }} />}
              color="#ef4444"
              subtitle="Registered pets"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Adoptions"
              value={stats.totalAdoptions}
              icon={<CheckCircleIcon sx={{ fontSize: 32 }} />}
              color="#10b981"
              subtitle="Successful adoptions"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Rescues"
              value={stats.totalRescues}
              icon={<WarningIcon sx={{ fontSize: 32 }} />}
              color="#f59e0b"
              subtitle="Rescue operations"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Shelters"
              value={stats.totalShelters}
              icon={<BusinessIcon sx={{ fontSize: 32 }} />}
              color="#6366f1"
              subtitle="Registered shelters"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Veterinarians"
              value={stats.totalVeterinarians}
              icon={<SecurityShieldIcon sx={{ fontSize: 32 }} />}
              color="#ec4899"
              subtitle="Medical professionals"
            />
          </Grid>
        </Grid>

        {/* Quick Navigation */}
        <Card sx={{ 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          mb: 4
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <DashboardIcon sx={{ mr: 1 }} />
              Quick Navigation
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={() => navigate('/admin/users')}
                  startIcon={<UsersIcon />}
                  sx={{ 
                    bgcolor: '#3b82f6',
                    '&:hover': { bgcolor: '#2563eb' },
                    py: 1.5,
                    borderRadius: 2
                  }}
                >
                  User Management
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={() => navigate('/admin/managers')}
                  startIcon={<BusinessIcon />}
                  sx={{ 
                    bgcolor: '#f59e0b',
                    '&:hover': { bgcolor: '#d97706' },
                    py: 1.5,
                    borderRadius: 2
                  }}
                >
                  Manager Management
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={() => navigate('/admin/modules')}
                  startIcon={<ModuleIcon />}
                  sx={{ 
                    bgcolor: '#22c55e',
                    '&:hover': { bgcolor: '#16a34a' },
                    py: 1.5,
                    borderRadius: 2
                  }}
                >
                  Module Management
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={() => navigate('/admin/roles')}
                  startIcon={<SecurityShieldIcon />}
                  sx={{ 
                    bgcolor: '#8b5cf6',
                    '&:hover': { bgcolor: '#7c3aed' },
                    py: 1.5,
                    borderRadius: 2
                  }}
                >
                  Role Management
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={() => navigate('/admin/tracking')}
                  startIcon={<HistoryIcon />}
                  sx={{ 
                    bgcolor: '#6366f1',
                    '&:hover': { bgcolor: '#4f46e5' },
                    py: 1.5,
                    borderRadius: 2
                  }}
                >
                  Data Tracking
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Analytics Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                  <TimelineIcon sx={{ mr: 1 }} />
                  Module Usage Analytics
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {analytics.moduleUsage.map((module, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ 
                          p: 1, 
                          borderRadius: '50%', 
                          backgroundColor: module.status === 'active' ? '#22c55e20' : '#f59e0b20',
                          color: module.status === 'active' ? '#22c55e' : '#f59e0b',
                          mr: 2
                        }}>
                          <ModuleIcon />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {module.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {module.status === 'active' ? 'Active' : 'Maintenance'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {module.usage}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Usage
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                  <NotificationsIcon sx={{ mr: 1 }} />
                  Recent Activities
                </Typography>
                
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {analytics.recentActivities.map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <Box sx={{ 
                            p: 0.5, 
                            borderRadius: '50%', 
                            backgroundColor: `${activity.color}20`,
                            color: activity.color
                          }}>
                            {activity.icon}
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                              {activity.message}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {activity.time}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < analytics.recentActivities.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* System Health Overview */}
        <Card sx={{ 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <SecurityShieldIcon sx={{ mr: 1 }} />
              System Health Overview
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <CheckCircleIcon sx={{ fontSize: 40, color: '#22c55e', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#22c55e' }}>
                    Database
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Operational
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <CheckCircleIcon sx={{ fontSize: 40, color: '#22c55e', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#22c55e' }}>
                    API Services
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Running
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <WarningIcon sx={{ fontSize: 40, color: '#f59e0b', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#f59e0b' }}>
                    Server Load
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Moderate
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <CheckCircleIcon sx={{ fontSize: 40, color: '#22c55e', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#22c55e' }}>
                    Security
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Secure
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  )
}

export default AdminDashboard
