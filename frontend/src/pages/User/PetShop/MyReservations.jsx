import React, { useEffect, useState } from 'react'
import { Box, Container, Typography, Card, CardContent, Chip, Button, CircularProgress, Alert, Grid } from '@mui/material'
import { petShopAPI } from '../../../services/api'
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Reservation #{r._id.slice(-6)}</Typography>
                    <Typography variant="body2" color="text.secondary">Item: {r.itemId}</Typography>
                    {r.notes && <Typography variant="body2">Notes: {r.notes}</Typography>}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={r.status} color={r.status==='pending'?'warning':(r.status==='approved'?'success':(r.status==='rejected'?'error':'default'))} />
                    <Button size="small" onClick={() => navigate(`/User/petshop/pet/${r.itemId}`)}>View Pet</Button>
                    {r.status === 'pending' && (
                      <Button size="small" color="error" onClick={() => cancel(r._id)}>Cancel</Button>
                    )}
                  </Box>
                </Box>
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
