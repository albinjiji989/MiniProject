import React, { useEffect, useState } from 'react'
import { Box, Container, Typography, TextField, Button, Select, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, Chip, CircularProgress, Alert, IconButton } from '@mui/material'
import { Delete as DeleteIcon } from '@mui/icons-material'
import { petShopAdminAPI } from '../../services/api'

const PetShopListings = () => {
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const res = await petShopAdminAPI.listAllListings({ q, status })
      setRows(res.data?.data?.items || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load listings')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() // eslint-disable-next-line
  }, [])

  const remove = async (id) => {
    await petShopAdminAPI.removeListing(id)
    await load()
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>All Pet Listings</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField size="small" label="Search by name" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select size="small" value={status} onChange={(e) => setStatus(e.target.value)} displayEmpty>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="available_for_sale">Available</MenuItem>
          <MenuItem value="in_petshop">In Shop</MenuItem>
          <MenuItem value="sold">Sold</MenuItem>
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
              <TableCell>Price</TableCell>
              <TableCell>Store</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r._id}>
                <TableCell>{r.name || '-'}</TableCell>
                <TableCell><Chip size="small" label={r.status} /></TableCell>
                <TableCell>{r.price || 0}</TableCell>
                <TableCell>{r.storeName || r.storeId || '-'}</TableCell>
                <TableCell align="right">
                  <IconButton color="error" onClick={() => remove(r._id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Container>
  )
}

export default PetShopListings
