import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Typography, Divider, CircularProgress, Alert, Button, Grid, Paper } from '@mui/material'
import { petShopAPI } from '../../../services/api'

const Invoice = () => {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      const res = await petShopAPI.getInvoice(id)
      setOrder(res.data.data.order)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load invoice')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() // eslint-disable-next-line
  }, [id])

  const print = () => window.print()

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight={240}><CircularProgress /></Box>
  if (error) return <Alert severity="error">{error}</Alert>
  if (!order) return null

  return (
    <Box sx={{ p: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Purchase Order</Typography>
            <Typography variant="subtitle1" color="text.secondary">{order.orderNumber}</Typography>
          </Grid>
          <Grid item>
            <Button variant="contained" onClick={print}>Print</Button>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Store</Typography>
            <Typography variant="body1">{order.storeName || '-'}</Typography>
            <Typography variant="body2" color="text.secondary">Store ID: {order.storeId || '-'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Summary</Typography>
            <Typography variant="body2">Status: {order.status}</Typography>
            <Typography variant="body2">Subtotal: {order.subtotal}</Typography>
            <Typography variant="body2">Tax: {order.tax}</Typography>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>Total: {order.total}</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mb: 2 }}>Items</Typography>
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
          <Box component="thead">
            <Box component="tr" sx={{ borderBottom: '1px solid #eee' }}>
              <Box component="th" sx={{ textAlign: 'left', py: 1 }}>Species</Box>
              <Box component="th" sx={{ textAlign: 'left' }}>Breed</Box>
              <Box component="th" sx={{ textAlign: 'right' }}>Qty</Box>
              <Box component="th" sx={{ textAlign: 'right' }}>Unit Cost</Box>
              <Box component="th" sx={{ textAlign: 'right' }}>Total</Box>
            </Box>
          </Box>
          <Box component="tbody">
            {order.items?.map((it, idx) => (
              <Box key={idx} component="tr" sx={{ borderBottom: '1px solid #f5f5f5' }}>
                <Box component="td" sx={{ py: 1 }}>{it.speciesId || '-'}</Box>
                <Box component="td">{it.breedId || '-'}</Box>
                <Box component="td" sx={{ textAlign: 'right' }}>{it.quantity}</Box>
                <Box component="td" sx={{ textAlign: 'right' }}>{it.unitCost}</Box>
                <Box component="td" sx={{ textAlign: 'right' }}>{(Number(it.quantity||0)*Number(it.unitCost||0)).toFixed(2)}</Box>
              </Box>
            ))}
          </Box>
        </Box>

        {order.notes && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
            <Typography variant="body2">{order.notes}</Typography>
          </>
        )}
      </Paper>
    </Box>
  )
}

export default Invoice
