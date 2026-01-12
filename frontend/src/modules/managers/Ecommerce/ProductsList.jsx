import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Stack,
  Pagination,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { apiClient, resolveMediaUrl } from '../../../services/api';

const ProductsList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [petType, setPetType] = useState('');
  const [categories, setCategories] = useState([]);

  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [page, search, category, petType]);

  const loadCategories = async () => {
    try {
      const res = await apiClient.get('/ecommerce/manager/categories');
      setCategories(res.data.data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        limit,
        search: search || undefined,
        category: category || undefined,
        petType: petType || undefined
      };
      const res = await apiClient.get('/ecommerce/manager/products', { params });
      setProducts(res.data.data?.products || []);
      setTotal(res.data.data?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await apiClient.delete(`/ecommerce/manager/products/${id}`);
      loadProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      return resolveMediaUrl(product.images[0]);
    }
    return '/placeholder-product.png';
  };

  const getPrice = (product) => {
    const salePrice = product.pricing?.salePrice;
    const basePrice = product.pricing?.basePrice;
    return salePrice || basePrice || 0;
  };

  const getStock = (product) => {
    return product.inventory?.stock || 0;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Products
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({total} total)
          </Typography>
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/manager/ecommerce/products/add')}
        >
          Add Product
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Pet Type</InputLabel>
              <Select
                value={petType}
                label="Pet Type"
                onChange={(e) => setPetType(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="dog">Dog</MenuItem>
                <MenuItem value="cat">Cat</MenuItem>
                <MenuItem value="bird">Bird</MenuItem>
                <MenuItem value="fish">Fish</MenuItem>
                <MenuItem value="rabbit">Rabbit</MenuItem>
                <MenuItem value="all">All Pets</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button fullWidth variant="outlined" onClick={() => { setSearch(''); setCategory(''); setPetType(''); }}>
              Reset
            </Button>
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
          {error}
        </Box>
      )}

      {/* Products Grid */}
      <Grid container spacing={2}>
        {loading ? (
          <Grid item xs={12}>
            <Typography align="center">Loading products...</Typography>
          </Grid>
        ) : products.length === 0 ? (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">No products found</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/manager/ecommerce/products/add')}
                sx={{ mt: 2 }}
              >
                Add Your First Product
              </Button>
            </Box>
          </Grid>
        ) : (
          products.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ position: 'relative', height: 200, bgcolor: 'grey.100' }}>
                  {product.images && product.images.length > 0 ? (
                    <CardMedia
                      component="img"
                      height="200"
                      image={getProductImage(product)}
                      alt={product.name}
                      sx={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <ImageIcon sx={{ fontSize: 60, color: 'grey.400' }} />
                    </Box>
                  )}
                  <Chip
                    label={product.status || 'Draft'}
                    size="small"
                    color={product.status === 'active' ? 'success' : 'default'}
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  />
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" noWrap fontWeight={600}>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {product.category?.name || 'Uncategorized'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" color="primary.main">
                      ₹{getPrice(product).toFixed(2)}
                    </Typography>
                    <Chip 
                      label={`Stock: ${getStock(product)}`} 
                      size="small" 
                      color={getStock(product) > 10 ? 'success' : 'warning'}
                    />
                  </Box>
                  {product.petType && product.petType.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                      {product.petType.map((type) => (
                        <Chip key={type} label={type} size="small" variant="outlined" />
                      ))}
                    </Box>
                  )}
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => navigate(`/manager/ecommerce/products/edit/${product._id}`)}
                      fullWidth
                    >
                      Edit
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(product._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default ProductsList;
