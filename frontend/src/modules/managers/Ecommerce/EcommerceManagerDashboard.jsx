import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Tab,
  Tabs,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
  ShoppingCart as OrderIcon
} from '@mui/icons-material';
import { apiClient } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const EcommerceManagerDashboard = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0); // 0: Products, 1: Orders, 2: Pharmacy
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pharmacyItems, setPharmacyItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dialog states
  const [productDialog, setProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'pet_food',
    price: '',
    costPrice: '',
    stock: { current: '', reorderLevel: 5 },
    petTypes: [],
    images: [],
    isPharmacy: false
  });

  const [orderDialog, setOrderDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Load products
  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/ecommerce/manager/products');
      setProducts(res.data.data?.products || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load orders
  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/ecommerce/manager/orders');
      setOrders(res.data.data?.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load pharmacy items
  const loadPharmacyItems = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/ecommerce/manager/pharmacy');
      setPharmacyItems(res.data.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pharmacy items');
      console.error('Error loading pharmacy items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tabValue === 0) {
      loadProducts();
    } else if (tabValue === 1) {
      loadOrders();
    } else if (tabValue === 2) {
      loadPharmacyItems();
    }
  }, [tabValue]);

  // Handle product form submission
  const handleProductFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('stock.')) {
      const key = name.split('.')[1];
      setFormData({
        ...formData,
        stock: { ...formData.stock, [key]: value }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleSaveProduct = async () => {
    try {
      setLoading(true);
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        costPrice: parseFloat(formData.costPrice),
        stock: {
          current: parseInt(formData.stock.current),
          reorderLevel: parseInt(formData.stock.reorderLevel)
        }
      };

      if (editingProduct) {
        await apiClient.put(`/ecommerce/manager/products/${editingProduct._id}`, payload);
      } else {
        await apiClient.post('/ecommerce/manager/products', payload);
      }

      setProductDialog(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        category: 'pet_food',
        price: '',
        costPrice: '',
        stock: { current: '', reorderLevel: 5 },
        petTypes: [],
        images: [],
        isPharmacy: false
      });
      await loadProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
      console.error('Error saving product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        setLoading(true);
        await apiClient.delete(`/ecommerce/manager/products/${productId}`);
        await loadProducts();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete product');
        console.error('Error deleting product:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      costPrice: product.costPrice,
      stock: product.stock,
      petTypes: product.petTypes,
      images: product.images,
      isPharmacy: product.isPharmacy
    });
    setProductDialog(true);
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setLoading(true);
      await apiClient.put(`/ecommerce/manager/orders/${orderId}/status`, {
        shippingStatus: newStatus
      });
      await loadOrders();
      setOrderDialog(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order');
      console.error('Error updating order:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      processing: 'info',
      shipped: 'primary',
      delivered: 'success',
      cancelled: 'error',
      approved: 'success',
      ongoing: 'info',
      completed: 'success'
    };
    return colors[status] || 'default';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Ecommerce & Pharmacy Manager
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage products, orders, and pharmacy inventory
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Tab Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, value) => setTabValue(value)}>
          <Tab label="Products" icon={<OrderIcon />} iconPosition="start" />
          <Tab label="Orders" icon={<OrderIcon />} iconPosition="start" />
          <Tab label="Pharmacy" icon={<OrderIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* PRODUCTS TAB */}
      {tabValue === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Product Inventory</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingProduct(null);
                setFormData({
                  name: '',
                  description: '',
                  category: 'pet_food',
                  price: '',
                  costPrice: '',
                  stock: { current: '', reorderLevel: 5 },
                  petTypes: [],
                  images: [],
                  isPharmacy: false
                });
                setProductDialog(true);
              }}
            >
              Add Product
            </Button>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" sx={{ py: 4 }}>
              <CircularProgress />
            </Box>
          ) : products.length === 0 ? (
            <Alert severity="info">No products found. Add your first product!</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Cost</TableCell>
                    <TableCell align="center">Stock</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product._id} hover>
                      <TableCell>
                        <Stack>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {product.name}
                          </Typography>
                          {product.isPharmacy && <Chip label="Pharmacy" size="small" color="primary" />}
                        </Stack>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell align="right">₹{product.price}</TableCell>
                      <TableCell align="right">₹{product.costPrice}</TableCell>
                      <TableCell align="center">{product.stock?.current || 0}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditProduct(product)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteProduct(product._id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* ORDERS TAB */}
      {tabValue === 1 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Customer Orders
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" sx={{ py: 4 }}>
              <CircularProgress />
            </Box>
          ) : orders.length === 0 ? (
            <Alert severity="info">No orders yet.</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Order #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center">Items</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order._id} hover>
                      <TableCell>{order.orderNumber}</TableCell>
                      <TableCell>{order.userId?.name || 'Unknown'}</TableCell>
                      <TableCell align="right">₹{order.totalAmount}</TableCell>
                      <TableCell align="center">{order.items?.length || 0}</TableCell>
                      <TableCell>
                        <Chip
                          label={order.shippingStatus}
                          color={getStatusColor(order.shippingStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedOrder(order);
                              setOrderDialog(true);
                            }}
                            color="primary"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* PHARMACY TAB */}
      {tabValue === 2 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Pharmacy Items
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" sx={{ py: 4 }}>
              <CircularProgress />
            </Box>
          ) : pharmacyItems.length === 0 ? (
            <Alert severity="info">No pharmacy items found.</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Medicine Name</TableCell>
                    <TableCell>Active Ingredient</TableCell>
                    <TableCell>Dosage</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="center">Stock</TableCell>
                    <TableCell>Expiry Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pharmacyItems.map((item) => (
                    <TableRow key={item._id} hover>
                      <TableCell>{item.medicineName}</TableCell>
                      <TableCell>{item.activeIngredient}</TableCell>
                      <TableCell>{item.dosage}</TableCell>
                      <TableCell align="right">₹{item.price}</TableCell>
                      <TableCell align="center">{item.stock?.current || 0}</TableCell>
                      <TableCell>
                        {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* PRODUCT DIALOG */}
      <Dialog open={productDialog} onClose={() => setProductDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Product Name"
              name="name"
              value={formData.name}
              onChange={handleProductFormChange}
              required
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleProductFormChange}
              multiline
              rows={2}
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={formData.category}
                onChange={handleProductFormChange}
                label="Category"
              >
                <MenuItem value="pet_food">Pet Food</MenuItem>
                <MenuItem value="toys">Toys</MenuItem>
                <MenuItem value="accessories">Accessories</MenuItem>
                <MenuItem value="pharmacy">Pharmacy</MenuItem>
                <MenuItem value="grooming">Grooming</MenuItem>
                <MenuItem value="health">Health</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Selling Price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleProductFormChange}
                required
              />
              <TextField
                fullWidth
                label="Cost Price"
                name="costPrice"
                type="number"
                value={formData.costPrice}
                onChange={handleProductFormChange}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Current Stock"
                name="stock.current"
                type="number"
                value={formData.stock.current}
                onChange={handleProductFormChange}
                required
              />
              <TextField
                fullWidth
                label="Reorder Level"
                name="stock.reorderLevel"
                type="number"
                value={formData.stock.reorderLevel}
                onChange={handleProductFormChange}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveProduct} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ORDER DETAILS DIALOG */}
      <Dialog open={orderDialog} onClose={() => setOrderDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Order Details</DialogTitle>
        {selectedOrder && (
          <DialogContent dividers>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Order #{selectedOrder.orderNumber}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Customer: {selectedOrder.userId?.name}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Items ({selectedOrder.items?.length || 0})
                </Typography>
                {selectedOrder.items?.map((item, idx) => (
                  <Typography key={idx} variant="body2">
                    {item.productId?.name} x {item.quantity} = ₹{item.totalPrice}
                  </Typography>
                ))}
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Shipping Address
                </Typography>
                <Typography variant="body2">
                  {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Current Status
                </Typography>
                <Chip
                  label={selectedOrder.shippingStatus}
                  color={getStatusColor(selectedOrder.shippingStatus)}
                  sx={{ mt: 1 }}
                />
              </Box>
              <FormControl fullWidth>
                <InputLabel>Update Status</InputLabel>
                <Select
                  defaultValue=""
                  label="Update Status"
                  onChange={(e) => handleUpdateOrderStatus(selectedOrder._id, e.target.value)}
                >
                  <MenuItem value="">Select Status</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="shipped">Shipped</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setOrderDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EcommerceManagerDashboard;