import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { useAuth } from '../../../contexts/AuthContext';
import apiClient from '../../../services/api';

const BrowseEcommerce = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [categories, setCategories] = useState([]);
  const [cartAdded, setCartAdded] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [searchTerm, selectedCategory]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);

      const response = await apiClient.get(`/api/ecommerce/products?${params.toString()}`);
      const productsData = response.data.products || [];
      setProducts(productsData);

      // Extract unique categories
      const uniqueCategories = [...new Set(productsData.map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setDetailsDialog(true);
  };

  const handleAddToCart = async (product = null) => {
    const targetProduct = product || selectedProduct;
    if (!targetProduct) return;

    try {
      await apiClient.post('/api/ecommerce/cart/add', {
        productId: targetProduct._id,
        quantity: quantity
      });
      setCartAdded(true);
      setTimeout(() => setCartAdded(false), 2000);
      if (detailsDialog) setDetailsDialog(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const getStockStatus = (product) => {
    const available = (product.stock?.current || 0) - (product.stock?.reserved || 0);
    if (available <= 0) return { text: 'Out of Stock', color: 'error' };
    if (available < 5) return { text: 'Low Stock', color: 'warning' };
    return { text: 'In Stock', color: 'success' };
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Shop Pet Supplies & Pharmacy
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {cartAdded && <Alert severity="success" sx={{ mb: 3 }}>Added to cart!</Alert>}

      {/* Search and Filter */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2, mb: 4 }}>
        <TextField
          label="Search products"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
          }}
        />
        <FormControl fullWidth>
          <InputLabel>Category</InputLabel>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            label="Category"
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Products Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : products.length === 0 ? (
        <Alert severity="info">No products found</Alert>
      ) : (
        <Grid container spacing={3}>
          {products.map((product) => {
            const stockStatus = getStockStatus(product);
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    sx={{
                      height: 200,
                      bgcolor: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ccc'
                    }}
                  >
                    {product.image ? (
                      <img src={product.image} alt={product.name} style={{ maxHeight: '100%', maxWidth: '100%' }} />
                    ) : (
                      <Typography variant="body2">No Image</Typography>
                    )}
                  </CardMedia>

                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" sx={{ fontSize: '1rem' }}>
                      {product.name}
                    </Typography>

                    <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={product.rating || 0} readOnly size="small" />
                      <Typography variant="body2" color="textSecondary">
                        ({product.reviews?.length || 0})
                      </Typography>
                    </Box>

                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2, minHeight: '40px' }}>
                      {product.description?.substring(0, 60)}...
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ color: 'primary.main' }}>
                        ₹{product.price}
                      </Typography>
                      <Chip
                        label={stockStatus.text}
                        color={stockStatus.color}
                        size="small"
                      />
                    </Box>

                    {product.pharmacy && (
                      <Chip label="💊 Pharmacy" size="small" variant="outlined" sx={{ mb: 1 }} />
                    )}
                  </CardContent>

                  <CardActions>
                    <Button size="small" onClick={() => handleViewDetails(product)}>
                      View Details
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<AddShoppingCartIcon />}
                      onClick={() => handleAddToCart(product)}
                      disabled={getStockStatus(product).text === 'Out of Stock'}
                    >
                      Add
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Product Details Dialog */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedProduct?.name}</DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Box sx={{ height: 200, bgcolor: '#f0f0f0', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selectedProduct.image ? (
                  <img src={selectedProduct.image} alt={selectedProduct.name} style={{ maxHeight: '100%', maxWidth: '100%' }} />
                ) : (
                  <Typography color="textSecondary">No Image</Typography>
                )}
              </Box>

              <Typography><strong>Price:</strong> ₹{selectedProduct.price}</Typography>
              <Typography><strong>Category:</strong> {selectedProduct.category}</Typography>
              <Typography><strong>Description:</strong> {selectedProduct.description}</Typography>

              {selectedProduct.pharmacy && (
                <Box sx={{ p: 1.5, bgcolor: '#fff3e0', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>💊 Prescription Medicine</strong>
                  </Typography>
                  <Typography variant="body2">Requires prescription verification during checkout</Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography><strong>Stock:</strong> {(selectedProduct.stock?.current || 0) - (selectedProduct.stock?.reserved || 0)} available</Typography>
                <FormControl sx={{ width: 120 }}>
                  <InputLabel>Qty</InputLabel>
                  <Select
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    label="Qty"
                  >
                    {[1, 2, 3, 4, 5, 10, 20].map((q) => (
                      <MenuItem key={q} value={q}>{q}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Typography variant="body2">
                <strong>Rating:</strong> {selectedProduct.rating || 'N/A'} ⭐
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
          <Button variant="contained" onClick={() => handleAddToCart()} startIcon={<AddShoppingCartIcon />}>
            Add to Cart
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BrowseEcommerce;



