import React, { useEffect, useState } from 'react'
import { Box, Typography, Button, Card, CardContent, Grid, CircularProgress, Alert, Table, TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { Add as AddIcon, ReceiptLong as InvoiceIcon, Inventory as ReceiveIcon, Send as SubmitIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../../services/api'

const Orders = () => {
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [orders, setOrders] = useState([])
  const [creating, setCreating] = useState(false)
  const [newOrderItems, setNewOrderItems] = useState([
    { categoryId: '', speciesId: '', breedId: '', quantity: 1, unitCost: 0, gender: 'Unknown', age: 0, ageUnit: 'months' }
  ])
  const [categories, setCategories] = useState([])
  const [species, setSpecies] = useState([])
  const [breedsBySpecies, setBreedsBySpecies] = useState({})

  const load = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/petshop/manager/orders')
      setOrders(res.data?.data?.orders || [])
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load orders')
    } finally { setLoading(false) }
  }

  useEffect(() => { load(); seedLookups() }, [])

  const seedLookups = async () => {
    try {
      const [catRes, spRes] = await Promise.all([
        apiClient.get('/admin/pet-categories/active'),
        apiClient.get('/admin/species/active')
      ])
      setCategories(catRes?.data?.data || [])
      setSpecies(spRes?.data?.data || [])
    } catch (e) {
      // ignore silently; form still usable with raw ids
    }
  }

  const addItemRow = () => setNewOrderItems((prev) => [...prev, { categoryId: '', speciesId: '', breedId: '', quantity: 1, unitCost: 0, gender: 'Unknown', age: 0, ageUnit: 'months' }])
  const updateItem = (idx, field, value) => {
    const next = [...newOrderItems]
    next[idx] = { ...next[idx], [field]: value }
    setNewOrderItems(next)
    if (field === 'speciesId') {
      // reset breed when species changes and load breeds
      loadBreedsForSpecies(value)
      const n = [...next]
      n[idx].breedId = ''
      setNewOrderItems(n)
    }
  }
  const removeItem = (idx) => setNewOrderItems((prev) => prev.filter((_, i) => i !== idx))

  const loadBreedsForSpecies = async (speciesId) => {
    if (!speciesId || breedsBySpecies[speciesId]) return
    try {
      const res = await apiClient.get('/admin/breeds/active', { params: { speciesId } })
      setBreedsBySpecies((prev) => ({ ...prev, [speciesId]: res?.data?.data || [] }))
    } catch (e) {
      setBreedsBySpecies((prev) => ({ ...prev, [speciesId]: [] }))
    }
  }

  const create = async () => {
    try {
      setLoading(true)
      await apiClient.post('/petshop/orders', { items: newOrderItems })
      setCreating(false)
      setNewOrderItems([{ categoryId: '', speciesId: '', breedId: '', quantity: 1, unitCost: 0, gender: 'Unknown', age: 0, ageUnit: 'months' }])
      await load()
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to create order')
    } finally { setLoading(false) }
  }

  const submit = async (id) => {
    await apiClient.post(`/petshop/orders/${id}/submit`)
    await load()
  }

  const receive = async (id) => {
    await apiClient.post(`/petshop/orders/${id}/receive`)
    await load()
  }

  const openInvoice = (id) => {
    navigate(`/manager/petshop/orders/${id}/invoice`)
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Purchase Orders</Typography>
          <Typography variant="body2" color="text.secondary">
            Orders from suppliers - not for adding stock directly
          </Typography>
        </Box>
        <Box>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/manager/petshop/add-stock')}
            sx={{ mr: 1 }}
          >
            Add Stock Directly
          </Button>
          <Button startIcon={<RefreshIcon />} onClick={load} sx={{ mr: 1 }}>Refresh</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)}>New Purchase Order</Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}><CircularProgress /></Box>
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell align="right">Subtotal</TableCell>
                  <TableCell align="right">Tax</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o._id} hover>
                    <TableCell>{o.orderNumber}</TableCell>
                    <TableCell>{o.status}</TableCell>
                    <TableCell>{o.items?.length || 0}</TableCell>
                    <TableCell align="right">{o.subtotal?.toFixed?.(2) || o.subtotal}</TableCell>
                    <TableCell align="right">{o.tax?.toFixed?.(2) || o.tax}</TableCell>
                    <TableCell align="right">{o.total?.toFixed?.(2) || o.total}</TableCell>
                    <TableCell align="right">
                      <Button size="small" startIcon={<InvoiceIcon />} onClick={() => openInvoice(o._id)}>Invoice</Button>
                      {o.status === 'draft' && (
                        <Button size="small" startIcon={<SubmitIcon />} onClick={() => submit(o._id)}>Submit</Button>
                      )}
                      {['submitted','draft'].includes(o.status) && (
                        <Button size="small" startIcon={<ReceiveIcon />} onClick={() => receive(o._id)}>Receive</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={creating} onClose={() => setCreating(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Purchase Order</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {newOrderItems.map((it, idx) => (
              <React.Fragment key={idx}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel id={`cat-${idx}`}>Category</InputLabel>
                    <Select labelId={`cat-${idx}`} label="Category" value={it.categoryId} onChange={(e) => updateItem(idx, 'categoryId', e.target.value)}>
                      <MenuItem value=""><em>None</em></MenuItem>
                      {categories.map((c) => (
                        <MenuItem key={c._id || c.id} value={c._id || c.id}>{c.name || c.displayName || c.key}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel id={`sp-${idx}`}>Species</InputLabel>
                    <Select labelId={`sp-${idx}`} label="Species" value={it.speciesId} onChange={(e) => updateItem(idx, 'speciesId', e.target.value)}>
                      <MenuItem value=""><em>None</em></MenuItem>
                      {species.map((s) => (
                        <MenuItem key={s._id || s.id} value={s._id || s.id}>{s.displayName || s.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel id={`br-${idx}`}>Breed</InputLabel>
                    <Select labelId={`br-${idx}`} label="Breed" value={it.breedId} onChange={(e) => updateItem(idx, 'breedId', e.target.value)}>
                      <MenuItem value=""><em>None</em></MenuItem>
                      {(breedsBySpecies[it.speciesId] || []).map((b) => (
                        <MenuItem key={b._id || b.id} value={b._id || b.id}>{b.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={1.5}>
                  <TextField type="number" label="Qty" value={it.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} fullWidth />
                </Grid>
                <Grid item xs={6} md={1.5}>
                  <TextField type="number" label="Unit Cost" value={it.unitCost} onChange={(e) => updateItem(idx, 'unitCost', Number(e.target.value))} fullWidth />
                </Grid>
              </React.Fragment>
            ))}
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Button onClick={addItemRow} startIcon={<AddIcon />}>Add Item</Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreating(false)}>Cancel</Button>
          <Button variant="contained" onClick={create}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Orders
