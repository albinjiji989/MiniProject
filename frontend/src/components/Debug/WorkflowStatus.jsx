import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material'
import { apiClient } from '../../services/api'

const WorkflowStatus = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    reservations: [],
    stats: {},
    systemHealth: {}
  })
  const [error, setError] = useState('')

  useEffect(() => {
    checkWorkflowStatus()
  }, [])

  const checkWorkflowStatus = async () => {
    try {
      setLoading(true)
      setError('')

      // Check system health
      const healthResponse = await fetch('http://localhost:5000/api/health')
      const healthData = await healthResponse.json()

      // Get reservations data
      const reservationsResponse = await apiClient.get('/petshop/public/reservations')
      const reservationsData = reservationsResponse.data.data || []

      // Get user stats
      const statsResponse = await apiClient.get('/petshop/user/stats')
      const statsData = statsResponse.data.data || {}

      setData({
        reservations: reservationsData,
        stats: statsData,
        systemHealth: healthData
      })

    } catch (err) {
      setError(err.message || 'Failed to check workflow status')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      going_to_buy: 'info',
      payment_pending: 'warning',
      paid: 'primary',
      ready_pickup: 'info',
      delivered: 'success',
      at_owner: 'success',
      rejected: 'error',
      cancelled: 'error'
    }
    return colors[status] || 'default'
  }

  const statusFlow = [
    'pending', 'approved', 'going_to_buy', 'payment_pending', 
    'paid', 'ready_pickup', 'delivered', 'at_owner'
  ]

  const getNextStatus = (currentStatus) => {
    const currentIndex = statusFlow.indexOf(currentStatus)
    return currentIndex >= 0 && currentIndex < statusFlow.length - 1 
      ? statusFlow[currentIndex + 1] 
      : null
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Workflow Status Checker
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={checkWorkflowStatus}
          disabled={loading}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* System Health */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {data.systemHealth.status === 'ok' ? (
                  <CheckIcon color="success" />
                ) : (
                  <ErrorIcon color="error" />
                )}
                <Typography variant="h6">
                  Backend Status
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {data.systemHealth.status === 'ok' ? 'Connected' : 'Disconnected'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {data.stats.totalReservations || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Reservations
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {data.stats.availableForSale || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available Pets
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status Flow Visualization */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Workflow Status Flow
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            {statusFlow.map((status, index) => (
              <React.Fragment key={status}>
                <Chip 
                  label={status.replace('_', ' ')} 
                  color={getStatusColor(status)}
                  variant="outlined"
                />
                {index < statusFlow.length - 1 && (
                  <Typography variant="body2" color="text.secondary">
                    →
                  </Typography>
                )}
              </React.Fragment>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Reservations Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Current Reservations ({data.reservations.length})
          </Typography>

          {data.reservations.length === 0 ? (
            <Alert severity="info">
              No reservations found. Create a test reservation to see the workflow in action.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Pet</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Next Step</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.reservations.map((reservation) => (
                    <TableRow key={reservation._id}>
                      <TableCell sx={{ fontFamily: 'monospace' }}>
                        {reservation._id.slice(-8)}
                      </TableCell>
                      <TableCell>
                        {reservation.itemId?.name || 'Unknown Pet'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={reservation.status} 
                          color={getStatusColor(reservation.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {getNextStatus(reservation.status) ? (
                          <Chip 
                            label={getNextStatus(reservation.status)} 
                            variant="outlined"
                            size="small"
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Complete
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(reservation.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default WorkflowStatus
