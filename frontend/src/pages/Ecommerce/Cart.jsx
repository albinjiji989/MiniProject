import React, { useEffect, useMemo, useState } from 'react'
import { Box, Container, Typography, Card, CardContent, IconButton, Button, Grid, TextField } from '@mui/material'
import { Add as AddIcon, Remove as RemoveIcon, Delete as DeleteIcon, ShoppingCart as CartIcon } from '@mui/icons-material'
import { shopAPI } from '../../services/api'

const Cart = () => {
  const [cart, setCart] = useState(null)
  const [error, setError] = useState('')

  const load = async () => {
    try { const res = await shopAPI.getCart(); setCart(res.data.data.cart) } catch (e) { setError(e?.response?.data?.message || 'Failed to load cart') }
  }
  useEffect(() => { load() }, [])

  const total = useMemo(() => (cart?.items || []).reduce((n, it) => n + it.quantity * (it.product?.price ?? it.priceAtAdd ?? 0), 0), [cart])

  const updateQty = async (itemId, qty) => { try { const res = await shopAPI.updateCartItem(itemId, qty); setCart(res.data.data.cart) } catch (e) { setError(e?.response?.data?.message || 'Failed to update item') } }
  const remove = async (itemId) => { try { const res = await shopAPI.removeCartItem(itemId); setCart(res.data.data.cart) } catch (e) { setError(e?.response?.data?.message || 'Failed to remove item') } }
  const checkout = async () => { try { await shopAPI.checkout(); await load() } catch (e) { setError(e?.response?.data?.message || 'Checkout failed') } }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}><CartIcon sx={{ mr: 1 }} /> Your Cart</Typography>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      <Grid container spacing={2}>
        {(cart?.items || []).map((it) => (
          <Grid item xs={12} key={it._id}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <img src={it.product?.images?.[0] || 'https://via.placeholder.com/80'} alt={it.product?.name} width={80} height={80} style={{ objectFit: 'cover', borderRadius: 8 }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{it.product?.name}</Typography>
                    <Typography variant="body2">₹{(it.product?.price ?? it.priceAtAdd).toFixed(2)}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton onClick={() => updateQty(it._id, Math.max(1, it.quantity - 1))}><RemoveIcon /></IconButton>
                  <TextField size="small" value={it.quantity} onChange={(e)=>updateQty(it._id, Math.max(1, Number(e.target.value)||1))} sx={{ width: 64 }} />
                  <IconButton onClick={() => updateQty(it._id, it.quantity + 1)}><AddIcon /></IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="subtitle1">₹{(it.quantity * (it.product?.price ?? it.priceAtAdd)).toFixed(2)}</Typography>
                  <IconButton color="error" onClick={() => remove(it._id)}><DeleteIcon /></IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Typography variant="h6">Total: ₹{total.toFixed(2)}</Typography>
        <Button variant="contained" onClick={checkout} disabled={!cart || (cart.items||[]).length===0}>Checkout</Button>
      </Box>
    </Container>
  )
}

export default Cart


