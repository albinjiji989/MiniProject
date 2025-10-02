import React, { useEffect, useState } from 'react'
import { Box, Container, Typography, Select, MenuItem, Button, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Alert, Chip } from '@mui/material'
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

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Reservations</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? <CircularProgress /> : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r._id}>
                <TableCell><Chip size="small" label={r.itemId} /></TableCell>
                <TableCell><Chip size="small" label={r.userId} /></TableCell>
                <TableCell>
                  <Select size="small" value={statusById[r._id] || r.status} onChange={(e) => setStatusById(prev => ({ ...prev, [r._id]: e.target.value }))}>
                    <MenuItem value="pending">pending</MenuItem>
                    <MenuItem value="approved">approved</MenuItem>
                    <MenuItem value="rejected">rejected</MenuItem>
                    <MenuItem value="cancelled">cancelled</MenuItem>
                    <MenuItem value="completed">completed</MenuItem>
                  </Select>
                </TableCell>
                <TableCell align="right">
                  <Button size="small" variant="contained" onClick={() => updateStatus(r._id)}>Update</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Container>
  )
}

export default PetShopReservations
