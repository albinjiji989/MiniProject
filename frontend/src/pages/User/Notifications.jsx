import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Box, 
  Container, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  Divider, 
  Chip, 
  Button, 
  CircularProgress, 
  Alert,
  IconButton,
  Tooltip
} from '@mui/material'
import { 
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Event as EventIcon,
  Pets as PetsIcon,
  ShoppingCart as ShoppingCartIcon,
  Assignment as AssignmentIcon,
  MedicalServices as MedicalIcon,
  CalendarToday as CalendarIcon,
  Delete as DeleteIcon,
  MarkEmailRead as MarkReadIcon
} from '@mui/icons-material'
import { apiClient } from '../../services/api'

const NotificationsPage = () => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadNotifications = async () => {
    try {
      setLoading(true)
      setError('')
      // Using apiClient directly since there's no specific notificationsAPI
      const response = await apiClient.get('/notifications')
      setNotifications(response.data.data.notifications || [])
    } catch (err) {
      setError('Failed to load notifications')
      console.error('Error loading notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main' }} />
      case 'warning':
        return <WarningIcon sx={{ color: 'warning.main' }} />
      case 'info':
      default:
        return <InfoIcon sx={{ color: 'info.main' }} />
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'success'
      case 'error':
        return 'error'
      case 'warning':
        return 'warning'
      case 'info':
      default:
        return 'info'
    }
  }

  const handleNotificationClick = (notification) => {
    // Handle navigation based on notification type and data
    if (notification.link) {
      navigate(notification.link)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      // Using apiClient directly since there's no specific notificationsAPI
      await apiClient.put(`/notifications/${notificationId}/read`)
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      // Using apiClient directly since there's no specific notificationsAPI
      await apiClient.delete(`/notifications/${notificationId}`)
      setNotifications(notifications.filter(n => n._id !== notificationId))
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      // Using apiClient directly since there's no specific notificationsAPI
      await apiClient.put('/notifications/read-all')
      setNotifications(notifications.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Notifications
          </Typography>
          {notifications.length > 0 && (
            <Button 
              variant="outlined" 
              startIcon={<MarkReadIcon />}
              onClick={markAllAsRead}
            >
              Mark All as Read
            </Button>
          )}
        </Box>
        <Typography variant="subtitle1" color="text.secondary">
          Stay updated with the latest activities and alerts
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {notifications.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <NotificationsIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 1 }}>No notifications</Typography>
          <Typography variant="body1" color="text.secondary">
            You don't have any notifications at the moment.
          </Typography>
        </Box>
      ) : (
        <List sx={{ bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
          {notifications.map((notification) => (
            <React.Fragment key={notification._id}>
              <ListItem 
                alignItems="flex-start"
                sx={{ 
                  cursor: notification.link ? 'pointer' : 'default',
                  bgcolor: notification.read ? 'background.default' : 'action.hover',
                  '&:hover': {
                    bgcolor: notification.read ? 'action.hover' : 'action.selected'
                  }
                }}
                onClick={() => handleNotificationClick(notification)}
              >
                <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
                        {notification.title}
                      </Typography>
                      {!notification.read && (
                        <Chip 
                          label="New" 
                          size="small" 
                          color={getNotificationColor(notification.type)} 
                          sx={{ height: 20 }} 
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {notification.message}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EventIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(notification.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                        {notification.category && (
                          <Chip 
                            label={notification.category} 
                            size="small" 
                            variant="outlined" 
                            sx={{ height: 20 }} 
                          />
                        )}
                      </Box>
                    </React.Fragment>
                  }
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {!notification.read && (
                    <Tooltip title="Mark as read">
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(notification._id)
                        }}
                      >
                        <MarkReadIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Delete">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(notification._id)
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </ListItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          ))}
        </List>
      )}
    </Container>
  )
}

export default NotificationsPage