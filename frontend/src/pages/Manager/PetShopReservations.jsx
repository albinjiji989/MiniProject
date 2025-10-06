import React, { useEffect, useState } from 'react'
import { 
  Box, 
  Container, 
  Typography, 
  Select, 
  MenuItem, 
  Button, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  CircularProgress, 
  Alert, 
  Chip,
  Card,
  CardContent,
  Grid,
  Avatar,
  Stack,
  Tooltip,
  IconButton
} from '@mui/material'
import { 
  Visibility as ViewIcon,
  Edit as EditIcon,
  LocalShipping as DeliveryIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material'
import { petShopManagerAPI } from '../../services/api'

const PetShopReservations = () => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusById, setStatusById] = useState({})
  const load = async () => {
    try {
      setLoading(true)
      const res = await petShopManagerAPI.listReservations()
      const list = res?.data?.data?.reservations || []
      setRows(list)
      const map = {}
      list.forEach(r => { map[r._id] = r.status })
      setStatusById(map)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load reservations')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() // eslint-disable-next-line
  }, [])

  const updateStatus = async (id) => {
    const status = statusById[id]
    await petShopManagerAPI.updateReservationStatus(id, status)
    await load()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'approved': return 'success'
      case 'rejected': return 'error'
      case 'going_to_buy': return 'info'
      case 'payment_pending': return 'warning'
      case 'paid': return 'success'
      case 'delivered': return 'success'
      default: return 'default'
    }
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Pet Shop Reservations</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {rows.map((reservation) => (
            <Grid item xs={12} key={reservation._id}>
              <Card>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={2}>
                      <Avatar
                        sx={{ width: 80, height: 80, mx: 'auto' }}
                        src={reservation.itemId?.images?.[0]?.url}
                      >
                        {reservation.itemId?.name?.charAt(0)}
                      </Avatar>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Typography variant="h6" fontWeight="bold">
                        {reservation.itemId?.name || 'Pet Name'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Code: {reservation.itemId?.petCode || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Reservation: #{reservation.reservationCode || reservation._id.slice(-6)}
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        ₹{reservation.itemId?.price?.toLocaleString() || 0}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" fontWeight="medium">
                        {reservation.userId?.name || 'Customer'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {reservation.userId?.email}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(reservation.createdAt).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={2}>
                      <Chip 
                        label={reservation.status}
                        color={getStatusColor(reservation.status)}
                        sx={{ mb: 1 }}
                      />
                      <Select 
                        size="small" 
                        fullWidth
                        value={statusById[reservation._id] || reservation.status} 
                        onChange={(e) => setStatusById(prev => ({ ...prev, [reservation._id]: e.target.value }))}
                      >
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                        <MenuItem value="going_to_buy">Going to Buy</MenuItem>
                        <MenuItem value="payment_pending">Payment Pending</MenuItem>
                        <MenuItem value="paid">Paid</MenuItem>
                        <MenuItem value="ready_pickup">Ready for Pickup</MenuItem>
                        <MenuItem value="delivered">Delivered</MenuItem>
                        <MenuItem value="at_owner">At Owner</MenuItem>
                      </Select>
                    </Grid>
                    
                    <Grid item xs={12} sm={1}>
                      <Stack direction="column" spacing={1}>
                        <Tooltip title="Update Status">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => updateStatus(reservation._id)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {reservation.status === 'paid' && (
                          <Tooltip title="Mark Ready for Delivery">
                            <IconButton size="small" color="success">
                              <DeliveryIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {['paid', 'delivered'].includes(reservation.status) && (
                          <Tooltip title="Generate Invoice">
                            <IconButton size="small" color="info">
                              <ReceiptIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                  
                  {reservation.notes && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2">
                        <strong>Notes:</strong> {reservation.notes}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
          
          {rows.length === 0 && (
            <Grid item xs={12}>
              <Box textAlign="center" py={8}>
                <Typography variant="h6" color="text.secondary">
                  No reservations found
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  )
}

export default PetShopReservations
