import React, { useEffect, useState } from 'react'
import {
  Container, Typography, Button, Card, Table, TableHead, TableRow, TableCell, TableBody,
  Box, CircularProgress, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Grid, Alert, Tabs, Tab
} from '@mui/material'
import { Add, Edit, Delete, Warning, TrendingDown, Inventory2 } from '@mui/icons-material'
import { veterinaryAPI } from '../../../services/api'

const Inventory = () => {
  const [items, setItems] = useState([])
  const [alerts, setAlerts] = useState({ lowStock: 0, expiringSoon: 0 })
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [tab, setTab] = useState(0)
  const [form, setForm] = useState({
    itemName: '', category: 'medicine', quantity: 0, unit: 'pieces',
    unitPrice: 0, sellingPrice: 0, minStockLevel: 10, reorderPoint: 20
  })
  const [adjustForm, setAdjustForm] = useState({
    quantity: 0, transactionType: 'purchase', reason: '', notes: ''
  })

  useEffect(() => {
    loadInventory()
  }, [tab])

  const loadInventory = async () => {
    try {
      setLoading(true)
      const params = {}
      if (tab === 1) params.status = 'low_stock'
      if (tab === 2) params.status = 'out_of_stock'
      
      const response = await veterinaryAPI.managerGetInventory(params)
      setItems(response.data?.data?.items || [])
      setAlerts(response.data?.data?.alerts || { lowStock: 0, expiringSoon: 0 })
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (selectedItem) {
        await veterinaryAPI.managerUpdateInventoryItem(selectedItem._id, form)
      } else {
        await veterinaryAPI.managerCreateInventoryItem(form)
      }
      setDialogOpen(false)
      setSelectedItem(null)
      setForm({ itemName: '', category: 'medicine', quantity: 0, unit: 'pieces', unitPrice: 0, sellingPrice: 0, minStockLevel: 10, reorderPoint: 20 })
      loadInventory()
    } catch (error) {
      console.error(error)
    }
  }

  const handleAdjustStock = async (e) => {
    e.preventDefault()
    try {
      await veterinaryAPI.managerAdjustInventoryStock(selectedItem._id, adjustForm)
      setAdjustDialogOpen(false)
      setSelectedItem(null)
      setAdjustForm({ quantity: 0, transactionType: 'purchase', reason: '', notes: '' })
      loadInventory()
    } catch (error) {
      console.error(error)
    }
  }

  const handleEdit = (item) => {
    setSelectedItem(item)
    setForm({
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      sellingPrice: item.sellingPrice || 0,
      minStockLevel: item.minStockLevel,
      reorderPoint: item.reorderPoint
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this item?')) {
      try {
        await veterinaryAPI.managerDeleteInventoryItem(id)
        loadInventory()
      } catch (error) {
        console.error(error)
      }
    }
  }

  const getStatusColor = (status) => {
    const colors = { in_stock: 'success', low_stock: 'warning', out_of_stock: 'error', expired: 'default' }
    return colors[status] || 'default'
  }

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4" fontWeight="bold">Inventory Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedItem(null); setDialogOpen(true) }}>
          Add Item
        </Button>
      </Box>

      {/* Alerts */}
      {(alerts.lowStock > 0 || alerts.expiringSoon > 0) && (
        <Grid container spacing={2} mb={3}>
          {alerts.lowStock > 0 && (
            <Grid item xs={12} md={6}>
              <Alert severity="warning" icon={<TrendingDown />}>
                {alerts.lowStock} items are low on stock
              </Alert>
            </Grid>
          )}
          {alerts.expiringSoon > 0 && (
            <Grid item xs={12} md={6}>
              <Alert severity="error" icon={<Warning />}>
                {alerts.expiringSoon} items expiring soon
              </Alert>
            </Grid>
          )}
        </Grid>
      )}

      {/* Tabs */}
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="All Items" />
        <Tab label="Low Stock" />
        <Tab label="Out of Stock" />
      </Tabs>

      {/* Table */}
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Unit Price</TableCell>
              <TableCell>Total Value</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center">No items found</TableCell></TableRow>
            ) : (
              items.map(item => (
                <TableRow key={item._id}>
                  <TableCell>{item.itemName}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.quantity} {item.unit}</TableCell>
                  <TableCell>₹{item.unitPrice}</TableCell>
                  <TableCell>₹{item.totalValue}</TableCell>
                  <TableCell><Chip label={item.status} color={getStatusColor(item.status)} size="small" /></TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => { setSelectedItem(item); setAdjustDialogOpen(true) }}>
                      <Inventory2 />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleEdit(item)}><Edit /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(item._id)}><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{selectedItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="Item Name" value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} required sx={{ mt: 2 }} />
            <TextField fullWidth select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} sx={{ mt: 2 }}>
              <MenuItem value="medicine">Medicine</MenuItem>
              <MenuItem value="vaccine">Vaccine</MenuItem>
              <MenuItem value="equipment">Equipment</MenuItem>
              <MenuItem value="supplies">Supplies</MenuItem>
              <MenuItem value="food">Food</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField fullWidth type="number" label="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth select label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                  <MenuItem value="pieces">Pieces</MenuItem>
                  <MenuItem value="bottles">Bottles</MenuItem>
                  <MenuItem value="boxes">Boxes</MenuItem>
                  <MenuItem value="ml">ML</MenuItem>
                  <MenuItem value="mg">MG</MenuItem>
                  <MenuItem value="kg">KG</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField fullWidth type="number" label="Unit Price" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} required />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth type="number" label="Selling Price" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
              </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField fullWidth type="number" label="Min Stock Level" value={form.minStockLevel} onChange={(e) => setForm({ ...form, minStockLevel: e.target.value })} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth type="number" label="Reorder Point" value={form.reorderPoint} onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustDialogOpen} onClose={() => setAdjustDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleAdjustStock}>
          <DialogTitle>Adjust Stock: {selectedItem?.itemName}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Current Stock: {selectedItem?.quantity} {selectedItem?.unit}
            </Typography>
            <TextField fullWidth select label="Transaction Type" value={adjustForm.transactionType} onChange={(e) => setAdjustForm({ ...adjustForm, transactionType: e.target.value })} required sx={{ mt: 2 }}>
              <MenuItem value="purchase">Purchase (Add)</MenuItem>
              <MenuItem value="sale">Sale (Remove)</MenuItem>
              <MenuItem value="adjustment">Adjustment</MenuItem>
              <MenuItem value="return">Return (Add)</MenuItem>
              <MenuItem value="expired">Expired (Remove)</MenuItem>
              <MenuItem value="damaged">Damaged (Remove)</MenuItem>
            </TextField>
            <TextField fullWidth type="number" label="Quantity" value={adjustForm.quantity} onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })} required sx={{ mt: 2 }} />
            <TextField fullWidth label="Reason" value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} sx={{ mt: 2 }} />
            <TextField fullWidth multiline rows={2} label="Notes" value={adjustForm.notes} onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })} sx={{ mt: 2 }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAdjustDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Adjust Stock</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  )
}

export default Inventory
