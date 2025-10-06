import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { apiClient } from '../../../services/api'

const SimpleReservations = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [reservations, setReservations] = useState([])
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    paid: 0
  })

  useEffect(() => {
    fetchReservations()
  }, [])

  const fetchReservations = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await apiClient.get('/petshop/manager/reservations')
      const data = response.data.data || {}
      
      setReservations(data.reservations || [])
      setStats(data.stats || { total: 0, pending: 0, approved: 0, paid: 0 })
    } catch (err) {
      console.error('Fetch reservations error:', err)
      setError(err.response?.data?.message || 'Failed to load reservations')
    } finally {
      setLoading(false)
    }
  }

  const updateReservationStatus = async (reservationId, newStatus) => {
    try {
      await apiClient.put(`/petshop/manager/reservations/${reservationId}/status`, {
        status: newStatus,
        notes: `Status updated to ${newStatus}`
      })
      
      // Refresh data
      fetchReservations()
    } catch (err) {
      console.error('Update status error:', err)
      setError(err.response?.data?.message || 'Failed to update status')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'approved': return 'success'
      case 'going_to_buy': return 'info'
      case 'payment_pending': return 'warning'
      case 'paid': return 'primary'
      case 'ready_pickup': return 'info'
      case 'delivered': return 'success'
      case 'at_owner': return 'success'
      case 'cancelled': return 'error'
      case 'rejected': return 'error'
      default: return 'default'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/manager/petshop/dashboard')}
          sx={{ mr: 2 }}
        >
          Back to Dashboard
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          Manage Reservations
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchReservations}
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

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Reservations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main">
                {stats.pending}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {stats.approved}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {stats.paid}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Paid
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Reservations Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Reservations ({reservations.length})
          </Typography>

          {reservations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No reservations found
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Reservation ID</TableCell>
                    <TableCell>Pet</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reservations.map((reservation) => (
                    <TableRow key={reservation._id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {reservation._id.slice(-8)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {reservation.itemId?.name || 'Unknown Pet'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {reservation.itemId?.petCode}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {reservation.userId?.name || 'Unknown User'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {reservation.userId?.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(reservation.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={reservation.status} 
                          color={getStatusColor(reservation.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {reservation.status === 'pending' && (
                            <>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => updateReservationStatus(reservation._id, 'approved')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => updateReservationStatus(reservation._id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {reservation.status === 'paid' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="info"
                              onClick={() => updateReservationStatus(reservation._id, 'ready_pickup')}
                            >
                              Ready for Pickup
                            </Button>
                          )}
                          {reservation.status === 'ready_pickup' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => updateReservationStatus(reservation._id, 'delivered')}
                            >
                              Mark Delivered
                            </Button>
                          )}
                          {reservation.status === 'delivered' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              onClick={() => updateReservationStatus(reservation._id, 'at_owner')}
                            >
                              Confirm with Owner
                            </Button>
                          )}
                          {['approved', 'going_to_buy', 'payment_pending'].includes(reservation.status) && (
                            <Chip 
                              label="Waiting for User" 
                              color="warning" 
                              size="small" 
                            />
                          )}
                        </Box>
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

export default SimpleReservations
