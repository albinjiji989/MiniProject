import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Avatar,
  LinearProgress,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge,
  Checkbox
} from '@mui/material'
import {
  Work as WorkIcon,
  Assignment as TaskIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompletedIcon,
  Pending as PendingIcon,
  Warning as WarningIcon,
  Notifications as NotificationIcon,
  Person as PersonIcon,
  TrendingUp as StatsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'

const StaffDashboard = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    assignedTasks: 0,
    completedToday: 0,
    pendingTasks: 0,
    productivity: 85
  })
  const [tasks, setTasks] = useState([])
  const [schedule, setSchedule] = useState([])
  const [notifications, setNotifications] = useState([])
  const [tabValue, setTabValue] = useState(0)

  // Helper functions
  const getModuleColor = (module) => {
    const colors = {
      adoption: '#4caf50',
      shelter: '#2196f3',
      rescue: '#ff9800',
      veterinary: '#9c27b0',
      ecommerce: '#f44336',
      pharmacy: '#00bcd4',
      
      
    }
    return colors[module?.toLowerCase()] || '#666'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'High': 'error',
      'Medium': 'warning',
      'Low': 'default'
    }
    return colors[priority] || 'default'
  }

  const getStatusColor = (status) => {
    const colors = {
      'Completed': 'success',
      'In Progress': 'primary',
      'Pending': 'warning',
      'Overdue': 'error'
    }
    return colors[status] || 'default'
  }

  const moduleName = user?.assignedModule || 'Unknown'
  const moduleColor = getModuleColor(moduleName)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Replace mock with real API calls when backend endpoints are available
      setStats({ assignedTasks: 0, completedToday: 0, pendingTasks: 0, productivity: 0 })
      setTasks([])
      setSchedule([])
      setNotifications([])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${color}15, ${color}05)` }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: color, mr: 2 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: color }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  )

  const handleTaskAction = (taskId, action) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: action === 'start' ? 'In Progress' : action === 'complete' ? 'Completed' : task.status }
        : task
    ))
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: moduleColor, mr: 2 }}>
            <WorkIcon />
          </Avatar>
          {moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} Staff Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back, {user?.name}! Manage your tasks and daily activities
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Assigned Tasks"
            value={stats.assignedTasks}
            icon={<TaskIcon />}
            color={moduleColor}
            subtitle="Total pending work"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Today"
            value={stats.completedToday}
            icon={<CompletedIcon />}
            color="#4caf50"
            subtitle="Great progress!"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Tasks"
            value={stats.pendingTasks}
            icon={<PendingIcon />}
            color="#ff9800"
            subtitle="Need attention"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Productivity"
            value={`${stats.productivity}%`}
            icon={<StatsIcon />}
            color="#4caf50"
            subtitle="This week"
          />
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Card sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="My Tasks" />
          <Tab label="Today's Schedule" />
          <Tab label="Notifications" />
          <Tab label="Performance" />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Task List */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                  <TaskIcon sx={{ mr: 1 }} />
                  My Tasks
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Task</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell>Progress</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body1" fontWeight="medium">
                                {task.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Est. {task.estimatedTime}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={task.priority} 
                              size="small" 
                              color={getPriorityColor(task.priority)}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={task.status} 
                              size="small" 
                              color={getStatusColor(task.status)}
                            />
                          </TableCell>
                          <TableCell>{task.dueDate}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={task.progress} 
                                sx={{ width: 60, mr: 1 }}
                              />
                              <Typography variant="body2">{task.progress}%</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {task.status === 'Pending' && (
                              <IconButton 
                                size="small" 
                                onClick={() => handleTaskAction(task.id, 'start')}
                                color="primary"
                              >
                                <StartIcon />
                              </IconButton>
                            )}
                            {task.status === 'In Progress' && (
                              <IconButton 
                                size="small" 
                                onClick={() => handleTaskAction(task.id, 'complete')}
                                color="success"
                              >
                                <CompletedIcon />
                              </IconButton>
                            )}
                            <IconButton size="small">
                              <ViewIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                  <WorkIcon sx={{ mr: 1 }} />
                  Quick Actions
                </Typography>
                <List>
                  <ListItem button>
                    <ListItemIcon>
                      <AddIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Log New Activity" />
                  </ListItem>
                  <ListItem button>
                    <ListItemIcon>
                      <ScheduleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Update Schedule" />
                  </ListItem>
                  <ListItem button>
                    <ListItemIcon>
                      <ViewIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="View Reports" />
                  </ListItem>
                  <ListItem button>
                    <ListItemIcon>
                      <PersonIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Update Profile" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <ScheduleIcon sx={{ mr: 1 }} />
              Today's Schedule
            </Typography>
            <List>
              {schedule.map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      <ScheduleIcon 
                        color={item.type === 'Meeting' ? 'primary' : item.type === 'Work' ? 'success' : 'default'} 
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.task}
                      secondary={item.time}
                    />
                    <Chip 
                      label={item.type} 
                      size="small" 
                      color={item.type === 'Meeting' ? 'primary' : item.type === 'Work' ? 'success' : 'default'}
                    />
                  </ListItem>
                  {index < schedule.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {tabValue === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <NotificationIcon sx={{ mr: 1 }} />
              Notifications
            </Typography>
            <List>
              {notifications.map((notification) => (
                <React.Fragment key={notification.id}>
                  <ListItem>
                    <ListItemIcon>
                      <NotificationIcon 
                        color={notification.type === 'task' ? 'primary' : notification.type === 'reminder' ? 'warning' : 'success'} 
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.message}
                      secondary={notification.time}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {tabValue === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Task Completion Rate
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    This Week
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={85} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" sx={{ mt: 1 }}>85%</Typography>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    This Month
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={78} 
                    color="success"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" sx={{ mt: 1 }}>78%</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Performance Summary
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">Tasks Completed</Typography>
                  <Typography variant="body2" fontWeight="bold">45</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">On-Time Rate</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">92%</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">Average Task Time</Typography>
                  <Typography variant="body2" fontWeight="bold">1.2 hours</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">Quality Score</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">4.8/5</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  )
}

export default StaffDashboard
