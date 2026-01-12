import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  ShoppingCart as ProductIcon,
  Receipt as OrderIcon,
  TrendingUp as SalesIcon,
  Inventory as StockIcon,
  Add as AddIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiClient, resolveMediaUrl } from '../../../services/api';

const EcommerceManagerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    lowStockProducts: 0
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch products
      const productsRes = await apiClient.get('/ecommerce/manager/products');
      const products = productsRes.data.data || [];
      
      // Fetch orders
      let orders = [];
      try {
        const ordersRes = await apiClient.get('/ecommerce/manager/orders');
        orders = ordersRes.data.data || [];
      } catch (err) {
        console.log('Orders endpoint not yet available:', err.message);
      }

      // Calculate stats
      const lowStock = products.filter(p => p.stock?.current <= p.stock?.reorderLevel);
      const pending = orders.filter(o => o.status === 'pending' || o.shippingStatus === 'pending');
      const revenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        pendingOrders: pending.length,
        totalRevenue: revenue,
        lowStockProducts: lowStock.length
      });

      // Set recent data
      setRecentProducts(products.slice(0, 4));
      setRecentOrders(orders.slice(0, 5));

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}.main`,
              color: 'white',
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Icon fontSize="large" />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
      return resolveMediaUrl(primaryImage.url);
    }
    return '/images/placeholder-product.jpg';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Ecommerce Dashboard
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage your products, orders, and inventory
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={ProductIcon}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={OrderIcon}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Orders"
            value={stats.pendingOrders}
            icon={SalesIcon}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock Items"
            value={stats.lowStockProducts}
            icon={StockIcon}
            color="error"
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/manager/ecommerce/products/add')}
            >
              Add Product
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<ProductIcon />}
              onClick={() => navigate('/manager/ecommerce/products')}
            >
              View All Products
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<OrderIcon />}
              onClick={() => navigate('/manager/ecommerce/orders')}
            >
              View All Orders
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Recent Products */}
      {recentProducts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">Recent Products</Typography>
            <Button
              size="small"
              endIcon={<ViewIcon />}
              onClick={() => navigate('/manager/ecommerce/products')}
            >
              View All
            </Button>
          </Box>
          <Grid container spacing={2}>
            {recentProducts.map((product) => (
              <Grid item xs={12} sm={6} md={3} key={product._id}>
                <Card>
                  <Box
                    component="img"
                    src={getProductImage(product)}
                    alt={product.name}
                    sx={{
                      width: '100%',
                      height: 160,
                      objectFit: 'cover'
                    }}
                  />
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      ₹{product.price}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Stock: {product.stock?.current || 0}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => navigate(`/manager/ecommerce/products/edit/${product._id}`)}
                    >
                      Edit
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">Recent Orders</Typography>
            <Button
              size="small"
              endIcon={<ViewIcon />}
              onClick={() => navigate('/manager/ecommerce/orders')}
            >
              View All
            </Button>
          </Box>
          <Paper>
            {recentOrders.map((order, index) => (
              <Box
                key={order._id}
                sx={{
                  p: 2,
                  borderBottom: index < recentOrders.length - 1 ? '1px solid #eee' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Order #{order.orderNumber || order._id.slice(-8)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {order.user?.name || 'Unknown Customer'}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    ₹{order.totalAmount}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {order.shippingStatus || order.status}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default EcommerceManagerDashboard;
