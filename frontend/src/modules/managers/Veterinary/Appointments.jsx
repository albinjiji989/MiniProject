import React, { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon
} from '@mui/icons-material'
import { veterinaryAPI } from '../../../services/api'
import { format } from 'date-fns'

const Appointments = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadAppointments()
  }, [filter])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const response = await veterinaryAPI.managerGetAppointments({ status: filter !== 'all' ? filter : undefined })
      setAppointments(response.data?.data?.appointments || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'info',
      completed: 'success',
      cancelled: 'error',
      'no-show': 'default'
    }
    return colors[status] || 'default'
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Appointments
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          New Appointment
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box mb={3}>
        <Button
          onClick={() => setFilter('all')}
          variant={filter === 'all' ? 'contained' : 'outlined'}
          sx={{ mr: 1 }}
        >
          All
        </Button>
        <Button
          onClick={() => setFilter('pending')}
          variant={filter === 'pending' ? 'contained' : 'outlined'}
          sx={{ mr: 1 }}
        >
          Pending
        </Button>
        <Button
          onClick={() => setFilter('confirmed')}
          variant={filter === 'confirmed' ? 'contained' : 'outlined'}
          sx={{ mr: 1 }}
        >
          Confirmed
        </Button>
        <Button
          onClick={() => setFilter('completed')}
          variant={filter === 'completed' ? 'contained' : 'outlined'}
        >
          Completed
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Pet</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No appointments found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((appointment) => (
                  <TableRow key={appointment._id}>
                    <TableCell>{appointment.appointmentNumber}</TableCell>
                    <TableCell>{appointment.petId?.name || 'N/A'}</TableCell>
                    <TableCell>{appointment.ownerId?.name || 'N/A'}</TableCell>
                    <TableCell>{appointment.serviceName}</TableCell>
                    <TableCell>
                      {format(new Date(appointment.appointmentDate), 'MMM dd, yyyy')}
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        {appointment.timeSlot}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={appointment.status}
                        color={getStatusColor(appointment.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary">
                        <ViewIcon />
                      </IconButton>
                      {appointment.status === 'confirmed' && (
                        <IconButton size="small" color="success">
                          <CompleteIcon />
                        </IconButton>
                      )}
                      {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                        <IconButton size="small" color="error">
                          <CancelIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Container>
  )
}

export default Appointments
