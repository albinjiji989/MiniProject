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
  Schedule as ScheduleIcon,
  LocalHospital as MedicalIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Analytics as AnalyticsIcon,
  TrendingUp,
  CalendarToday,
  Pets,
  Add as AddIcon
} from '@mui/icons-material'
import { veterinaryAPI } from '../../../services/api'
import StoreNameSetupDialog from '../../../components/Manager/StoreNameSetupDialog'
import { useAuth } from '../../../contexts/AuthContext'

const VeterinaryManagerDashboard = () => {
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
      const response = await veterinaryAPI.managerGetDashboardStats()
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
            Veterinary Manager Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage appointments, medical records, and clinic operations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/manager/veterinary/appointments/new')}
        >
          New Appointment
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
                    Today's Appointments
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats?.todayAppointments || 0}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'primary.light', p: 1.5, borderRadius: 2 }}>
                  <CalendarToday sx={{ color: 'primary.main' }} />
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
                    {stats?.pendingAppointments || 0}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'warning.light', p: 1.5, borderRadius: 2 }}>
                  <ScheduleIcon sx={{ color: 'warning.main' }} />
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
                    Total Patients
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats?.totalPatients || 0}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'success.light', p: 1.5, borderRadius: 2 }}>
                  <Pets sx={{ color: 'success.main' }} />
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
                    Staff Members
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats?.staffCount || 0}
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
            onClick={() => navigate('/manager/veterinary/appointments')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ScheduleIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Appointments
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
            onClick={() => navigate('/manager/veterinary/records')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <MedicalIcon color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Medical Records
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Patient history
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
            onClick={() => navigate('/manager/veterinary/staff')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <PeopleIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Staff
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage team
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
            onClick={() => navigate('/manager/veterinary/services')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <BusinessIcon color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Services
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage offerings
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Recent Appointments
      </Typography>
      <Card>
        <CardContent>
          {stats?.recentAppointments?.length > 0 ? (
            <Box>
              {/* Appointment list will go here */}
              <Typography color="text.secondary">Recent appointments will appear here</Typography>
            </Box>
          ) : (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No recent appointments
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Store Name Setup Dialog */}
      <StoreNameSetupDialog
        open={storeDialogOpen}
        onClose={() => setStoreDialogOpen(false)}
        user={user}
        moduleKey="veterinary"
      />
    </Container>
  )
}

export default VeterinaryManagerDashboard