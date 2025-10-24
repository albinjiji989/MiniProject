import React, { useEffect, useState } from 'react'
import { Box, Container, Typography, Card, CardContent, Chip, Button, CircularProgress, Alert, Grid, CardMedia, Stack } from '@mui/material'
import { Payment as PaymentIcon, Cancel as CancelIcon, QrCode as QrCodeIcon } from '@mui/icons-material'
import { petShopAPI, resolveMediaUrl } from '../../../services/api'
import { useNavigate } from 'react-router-dom'

const MyReservations = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reservations, setReservations] = useState([])
  const navigate = useNavigate()

  const load = async () => {
    try {
      setLoading(true)
      const res = await petShopAPI.listReservations()
      setReservations(res?.data?.data?.reservations || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load reservations')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const cancel = async (id) => {
    try {
      await petShopAPI.cancelReservation(id)
      await load()
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to cancel reservation')
    }
  }

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}><CircularProgress /></Box>

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>My Reservations</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        {reservations.map((r) => (
          <Grid key={r._id} item xs={12}>
            <Card>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={2}>
                    <CardMedia
                      component="img"
                      height="90"
                      image={resolveMediaUrl(r?.itemId?.images?.find?.(i => i.isPrimary)?.url || r?.itemId?.images?.[0]?.url)}
                      alt={r?.itemId?.name || 'Pet'}
                      sx={{ borderRadius: 1, objectFit: 'cover' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={10}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {r?.itemId?.name || 'Pet Name Not Available'} {r?.itemId?.petCode ? `• ${r.itemId.petCode}` : ''}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Reservation #{r.reservationCode || r._id?.slice(-6) || 'N/A'} • {r.createdAt ? new Date(r.createdAt).toLocaleString() : 'Date not available'}
                        </Typography>
                        {r?.itemId?.price ? (
                          <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>₹{Number(r.itemId.price).toLocaleString()}</Typography>
                        ) : (
                          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>Price not set</Typography>
                        )}
                        {r.notes && <Typography variant="body2" sx={{ mt: 0.5 }}>Notes: {r.notes}</Typography>}
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Chip 
                          label={
                            r.status === 'pending' ? 'Pending Approval' :
                            r.status === 'approved' ? 'Approved' :
                            r.status === 'rejected' ? 'Rejected' :
                            r.status === 'going_to_buy' ? 'Going to Buy' :
                            r.status === 'payment_pending' ? 'Payment Pending' :
                            r.status === 'paid' ? 'Paid' :
                            r.status === 'ready_pickup' ? 'Ready for Pickup' :
                            r.status === 'delivered' ? 'Delivered' :
                            r.status === 'at_owner' ? 'Purchased' :
                            r.status === 'cancelled' ? 'Cancelled' :
                            r.status
                          }
                          color={
                            r.status==='pending' ? 'warning' :
                            r.status==='approved' ? 'success' :
                            r.status==='rejected' ? 'error' :
                            r.status==='going_to_buy' ? 'info' :
                            r.status==='payment_pending' ? 'info' :
                            r.status==='paid' ? 'info' :
                            r.status==='ready_pickup' ? 'primary' :
                            (r.status==='delivered' || r.status==='at_owner') ? 'success' :
                            r.status==='cancelled' ? 'error' : 'default'
                          }
                          size="small"
                          variant={r.status === 'at_owner' ? 'filled' : 'outlined'}
                        />
                        <Button size="small" onClick={() => navigate(`/User/petshop/reservation/${r._id}`)}>View Details</Button>
                        <Button size="small" onClick={() => navigate(`/User/petshop/pet/${r?.itemId?._id || r.itemId}`)}>View Pet</Button>
                        
                        {r.status === 'approved' && (
                          <Button 
                            size="small" 
                            variant="contained" 
                            color="success"
                            onClick={() => navigate(`/User/petshop/purchase-decision/${r._id}`)}
                          >
                            Make Decision
                          </Button>
                        )}
                        
                        {(r.status === 'going_to_buy' || r.status === 'payment_pending') && (
                          <Button 
                            size="small" 
                            variant="contained" 
                            color="primary"
                            startIcon={<PaymentIcon />}
                            onClick={() => navigate(`/User/petshop/payment/${r._id}`)}
                          >
                            Pay Now
                          </Button>
                        )}
                        
                        {r.status === 'ready_pickup' && (
                          <Button 
                            size="small" 
                            variant="contained" 
                            color="primary"
                            startIcon={<QrCodeIcon />}
                            onClick={() => navigate(`/User/petshop/handover/${r._id}`)}
                          >
                            Handover
                          </Button>
                        )}
                        
                        {r.status === 'paid' && (
                          <Chip label="Awaiting Delivery" color="info" size="small" />
                        )}
                        
                        {r.status === 'delivered' && (
                          <Chip label="Pet Delivered" color="success" size="small" />
                        )}
                        
                        {r.status === 'at_owner' && (
                          <Chip label="Pet with Owner" color="success" size="small" />
                        )}
                        
                        {['pending', 'approved', 'going_to_buy', 'payment_pending'].includes(r.status) && (
                          <Button 
                            size="small" 
                            color="error" 
                            startIcon={<CancelIcon />}
                            onClick={() => cancel(r._id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {reservations.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography variant="h6" color="text.secondary">No reservations yet</Typography>
        </Box>
      )}
    </Container>
  )
}

export default MyReservations
