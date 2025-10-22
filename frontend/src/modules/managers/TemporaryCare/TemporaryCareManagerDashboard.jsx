import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material'
import {
  Assignment as BookingIcon,
  Business as FacilityIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
  Home as HomeIcon,
  Pets,
  CheckCircle,
  Pending,
  Add as AddIcon
} from '@mui/icons-material'
import { temporaryCareAPI } from '../../../services/api'
import StoreNameSetupDialog from '../../../components/Manager/StoreNameSetupDialog'
import { useAuth } from '../../../contexts/AuthContext'

const TemporaryCareManagerDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [storeDialogOpen, setStoreDialogOpen] = useState(false)

  useEffect(() => {
    // If manager has storeId but no storeName, prompt to set it
    if (user?.role?.includes('manager') && user?.storeId && !user?.storeName) {
      setStoreDialogOpen(true)
    }
    
    loadStats()
  }, [user])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await temporaryCareAPI.managerGetDashboardStats()
      setStats(response.data?.data || {})
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Temporary Care Manager Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage pet boarding, bookings, and facility operations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/manager/temporary-care/bookings/new')}
        >
          New Booking
        </Button>
      </Box>

      {/* Store Identity Badge */}
      {user?.role?.includes('manager') && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Chip color="primary" label={`Store ID: ${user?.storeId || 'Pending assignment'}`} />
          <Chip color={user?.storeName ? 'success' : 'warning'} label={`Store Name: ${user?.storeName || 'Not set'}`} />
          {!user?.storeName && (
            <Button size="small" variant="contained" onClick={() => setStoreDialogOpen(true)}>
              Set Store Name
            </Button>
          )}
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Active Bookings
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats?.activeBookings || 0}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'success.light', p: 1.5, borderRadius: 2 }}>
                  <CheckCircle sx={{ color: 'success.main' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Pending
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {stats?.pendingBookings || 0}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'warning.light', p: 1.5, borderRadius: 2 }}>
                  <Pending sx={{ color: 'warning.main' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Occupancy Rate
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats?.occupancyRate || 0}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stats?.activeBookings || 0} / {stats?.totalCapacity || 0} capacity
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'primary.light', p: 1.5, borderRadius: 2 }}>
                  <HomeIcon sx={{ color: 'primary.main' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    Caregivers
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats?.caregiversCount || 0}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'info.light', p: 1.5, borderRadius: 2 }}>
                  <PeopleIcon sx={{ color: 'info.main' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Quick Actions
      </Typography>
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
            onClick={() => navigate('/manager/temporary-care/bookings')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <BookingIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Bookings
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View & manage
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
            onClick={() => navigate('/manager/temporary-care/facilities')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <FacilityIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Facilities
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage rooms
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
            onClick={() => navigate('/manager/temporary-care/caregivers')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <PeopleIcon color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Caregivers
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage staff
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
            onClick={() => navigate('/manager/temporary-care/reports')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AnalyticsIcon color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Reports
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View analytics
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Recent Bookings
      </Typography>
      <Card>
        <CardContent>
          {stats?.recentBookings?.length > 0 ? (
            <Box>
              {/* Booking list will go here */}
              <Typography color="text.secondary">Recent bookings will appear here</Typography>
            </Box>
          ) : (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No recent bookings
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Store Name Setup Dialog */}
      <StoreNameSetupDialog
        open={storeDialogOpen}
        onClose={() => setStoreDialogOpen(false)}
        user={user}
        moduleKey="temporary-care"
      />
    </Container>
  )
}

export default TemporaryCareManagerDashboard