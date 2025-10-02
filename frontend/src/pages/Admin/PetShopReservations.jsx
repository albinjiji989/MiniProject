import React, { useEffect, useState } from 'react'
import { Box, Typography, Grid, Card, CardContent, CircularProgress, Alert, Button, Chip, Select, MenuItem, FormControl, InputLabel, Snackbar } from '@mui/material'
import { petShopAdminAPI } from '../../services/api'
import { useNavigate } from 'react-router-dom'

const PetShopReservations = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reservations, setReservations] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const load = async () => {
    try {
      setLoading(true)
      const res = await petShopAdminAPI.listReservations({ status: statusFilter || undefined })
      setReservations(res?.data?.data?.reservations || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load reservations')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() // eslint-disable-next-line
  }, [statusFilter])

  const updateStatus = async (id, status) => {
    try {
      await petShopAdminAPI.updateReservationStatus(id, status)
      await load()
      setSuccess(`Reservation ${id.slice(-6)} ${status}`)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to update reservation')
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Pet Shop Reservations</Typography>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value=""><em>All</em></MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={240}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={2}>
          {reservations.map((r) => (
            <Grid key={r._id} item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Reservation #{r._id.slice(-6)}</Typography>
                      <Typography variant="body2" color="text.secondary">User: {r.userId}</Typography>
                      <Typography variant="body2" color="text.secondary">Item: {r.itemId}</Typography>
                      {r.notes && <Typography variant="body2">Notes: {r.notes}</Typography>}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={r.status} color={r.status==='pending'?'warning':(r.status==='approved'?'success':(r.status==='rejected'?'error':'default'))} />
                      <Button size="small" onClick={() => navigate(`/admin/users?search=${r.userId}`)}>View User</Button>
                      <Button size="small" onClick={() => navigate(`/User/petshop/pet/${r.itemId}`)}>View Pet</Button>
                      {r.status === 'pending' && (
                        <>
                          <Button size="small" color="success" onClick={() => updateStatus(r._id, 'approved')}>Approve</Button>
                          <Button size="small" color="error" onClick={() => updateStatus(r._id, 'rejected')}>Reject</Button>
                        </>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess('')}
        message={success}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Box>
  )
}

export default PetShopReservations
