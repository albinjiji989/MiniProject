import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Container, Typography, Grid, Card, CardMedia, Button } from '@mui/material'
import { shopAPI } from '../../../services/api'

const ProductDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await shopAPI.getProduct(id)
        setProduct(res.data.data.product)
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load product')
      }
    }
    load()
  }, [id])

  const addToCart = async () => { try { await shopAPI.addToCart(product._id, 1); navigate('/cart') } catch (e) { setError(e?.response?.data?.message || 'Failed to add to cart') } }

  if (!product) return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h6">Loading...</Typography>
    </Container>
  )

  return (
    <Container sx={{ py: 4 }}>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardMedia component="img" height="400" image={product.images?.[0] || 'https://via.placeholder.com/800x600'} alt={product.name} />
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>{product.name}</Typography>
          <Typography variant="h6" sx={{ color: 'success.main', mb: 2 }}>₹{Number(product.price).toFixed(2)}</Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>{product.description}</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate(-1)}>Back</Button>
            <Button variant="contained" onClick={addToCart}>Add to Cart</Button>
          </Box>
        </Grid>
      </Grid>
    </Container>
  )
}

export default ProductDetails


