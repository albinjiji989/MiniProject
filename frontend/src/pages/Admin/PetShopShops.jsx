import React, { useEffect, useState } from 'react'
import { Box, Container, Typography, TextField, Button, Chip, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, CircularProgress, Alert } from '@mui/material'
import { petShopAdminAPI } from '../../services/api'

const PetShopShops = () => {
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const res = await petShopAdminAPI.listShops({ q, status })
      setRows(res.data?.data?.shops || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load shops')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() // eslint-disable-next-line
  }, [])

  const updateStatus = async (id, newStatus) => {
    await petShopAdminAPI.updateShopStatus(id, { status: newStatus })
    await load()
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Pet Shop Approval</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField size="small" label="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select size="small" value={status} onChange={(e) => setStatus(e.target.value)} displayEmpty>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="suspended">Suspended</MenuItem>
          <MenuItem value="banned">Banned</MenuItem>
        </Select>
        <Button variant="contained" onClick={load}>Filter</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? <CircularProgress /> : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>License</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r._id}>
                <TableCell>{r.name}</TableCell>
                <TableCell><Chip size="small" label={r.status} /></TableCell>
                <TableCell>{r.license?.number || '-'}</TableCell>
                <TableCell>{r.contact?.email || ''}{r.contact?.phone ? ` / ${r.contact.phone}` : ''}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => updateStatus(r._id, 'approved')}>Approve</Button>
                  <Button size="small" color="warning" onClick={() => updateStatus(r._id, 'suspended')}>Suspend</Button>
                  <Button size="small" color="error" onClick={() => updateStatus(r._id, 'banned')}>Ban</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Container>
  )
}

export default PetShopShops
