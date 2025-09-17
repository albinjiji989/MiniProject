import React, { useEffect, useState } from 'react'
import { Box, Container, Typography, Card, CardContent, Grid } from '@mui/material'
import { api } from '../../services/api'

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try { const res = await api.get('/ecommerce/my/orders'); setOrders(res.data.data.orders || []) } catch (e) { setError(e?.response?.data?.message || 'Failed to load orders') }
    }
    load()
  }, [])

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>My Orders</Typography>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      <Grid container spacing={2}>
        {orders.map(o => (
          <Grid item xs={12} key={o._id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Order #{o._id.slice(-6)}</Typography>
                  <Typography variant="body2">{new Date(o.createdAt).toLocaleString()}</Typography>
                </Box>
                {(o.items || []).map((it, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{it.product?.name}</Typography>
                    <Typography variant="body2">x{it.quantity} — ₹{Number(it.price).toFixed(2)}</Typography>
                  </Box>
                ))}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Typography variant="subtitle1">Total: ₹{Number(o.totalAmount).toFixed(2)}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}

export default Orders


