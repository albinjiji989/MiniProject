import React, { useEffect, useState } from 'react'
import { Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Button, Pagination, Stack, Chip, CircularProgress, Alert, Toolbar, TextField, InputAdornment } from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../services/api'

const PetShopInventory = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')

  const load = async (p = page) => {
    try {
      setLoading(true)
      setError('')
      const qs = new URLSearchParams({ page: String(p), limit: String(limit) })
      const res = await apiClient.get(`/petshop/inventory?${qs}`)
      setItems(res.data?.data?.items || [])
      setTotal(res.data?.data?.pagination?.total || 0)
      setPage(res.data?.data?.pagination?.page || p)
      setLimit(res.data?.data?.pagination?.limit || limit)
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1) }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return
    try {
      await apiClient.delete(`/petshop/inventory/${id}`)
      load(page)
    } catch (e) {
      alert(e.response?.data?.message || e.message)
    }
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Inventory</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => load(page)}>Refresh</Button>
          <Button variant="contained" onClick={() => navigate('/manager/petshop/add-stock')}>Add Stock</Button>
        </Stack>
      </Stack>

      <Paper>
        <Toolbar>
          <TextField
            size="small"
            placeholder="Search by name or code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            sx={{ width: 320 }}
          />
        </Toolbar>
        {error && <Alert severity="error">{error}</Alert>}
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pet</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.filter(it => !search || (it.name||'').toLowerCase().includes(search.toLowerCase()) || (it.petCode||'').toLowerCase().includes(search.toLowerCase())).map((it) => (
                  <TableRow key={it._id} hover>
                    <TableCell>{it.name || 'Pet'}</TableCell>
                    <TableCell>{it.petCode || '-'}</TableCell>
                    <TableCell>₹{Number(it.price||0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip size="small" label={(it.status||'').replaceAll('_',' ') || 'in_stock'} color={it.status === 'available_for_sale' ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => navigate(`/manager/petshop/manage-inventory?id=${it._id}`)}><EditIcon /></IconButton>
                      <IconButton color="error" onClick={() => handleDelete(it._id)}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Box p={2} display="flex" justifyContent="center">
              <Pagination page={page} count={Math.max(1, Math.ceil(total / limit))} onChange={(_, p) => load(p)} />
            </Box>
          </>
        )}
      </Paper>
    </Box>
  )
}

export default PetShopInventory
