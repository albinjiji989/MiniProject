import React, { useEffect, useState } from 'react'
import { Box, Container, Typography, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Alert } from '@mui/material'
import { petShopAdminAPI } from '../../services/api'

const PetShopSalesReport = () => {
  const [rows, setRows] = useState([])
  const [since, setSince] = useState('')
  const [until, setUntil] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const res = await petShopAdminAPI.getSalesReport({ since, until })
      setRows(res.data?.data?.report || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load report')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() // eslint-disable-next-line
  }, [])

  return (
    <Container maxWidth="md" sx={{ mt: 3, mb: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Sales Report</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField size="small" type="date" label="Since" InputLabelProps={{ shrink: true }} value={since} onChange={(e) => setSince(e.target.value)} />
        <TextField size="small" type="date" label="Until" InputLabelProps={{ shrink: true }} value={until} onChange={(e) => setUntil(e.target.value)} />
        <Button variant="contained" onClick={load}>Generate</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? <CircularProgress /> : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Store ID</TableCell>
              <TableCell>Sold</TableCell>
              <TableCell>Revenue</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, idx) => (
              <TableRow key={idx}>
                <TableCell>{r.storeId}</TableCell>
                <TableCell>{r.soldCount}</TableCell>
                <TableCell>{r.revenue}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Container>
  )
}

export default PetShopSalesReport
