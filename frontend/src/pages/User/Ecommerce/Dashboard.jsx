import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper
} from '@mui/material';
import {
  ShoppingCart,
  LocalShipping,
  CheckCircle,
  Cancel,
  Favorite,
  TrendingUp,
  Receipt
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { apiClient } from '../../../services/api';

const EcommerceDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    cartItems: 0,
    pendingOrders: 0,
    completedOrders: 0,
    wishlistItems: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load cart
      const cartResponse = await apiClient.get('/ecommerce/cart');
      const cartCount = cartResponse.data.cart?.items?.length || 0;

      // Load orders
      const ordersResponse = await apiClient.get('/ecommerce/orders');
      const orders = ordersResponse.data.orders || [];
      const pendingCount = orders.filter(o => ['pending', 'processing'].includes(o.status)).length;
      const completedCount = orders.filter(o => o.status === 'delivered').length;

      // Load recent products (instead of featured)
      const productsResponse = await apiClient.get('/ecommerce/products?limit=4');
      setFeaturedProducts(productsResponse.data.data?.products || []);

      setStats({
        cartItems: cartCount,
        pendingOrders: pendingCount,
        completedOrders: completedCount,
        wishlistItems: 0
      });

      setRecentOrders(orders.slice(0, 5));
      setError('');
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data');
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
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Welcome back, {user?.name || 'User'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your orders and shopping
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <ShoppingCart />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.cartItems}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Items in Cart
                  </Typography>
                </Box>
              </Box>
              <Button 
                variant="outlined" 
                size="small" 
                fullWidth
                onClick={() => navigate('/user/ecommerce/cart')}
              >
                View Cart
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <LocalShipping />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.pendingOrders}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Orders
                  </Typography>
                </Box>
              </Box>
              <Button 
                variant="outlined" 
                size="small" 
                fullWidth
                onClick={() => navigate('/user/ecommerce/orders')}
              >
                Track Orders
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.completedOrders}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed Orders
                  </Typography>
                </Box>
              </Box>
              <Button 
                variant="outlined" 
                size="small" 
                fullWidth
                onClick={() => navigate('/user/ecommerce/orders')}
              >
                View History
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                  <Favorite />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.wishlistItems}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Wishlist Items
                  </Typography>
                </Box>
              </Box>
              <Button 
                variant="outlined" 
                size="small" 
                fullWidth
                onClick={() => navigate('/user/ecommerce/wishlist')}
              >
                View Wishlist
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Orders */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Recent Orders
              </Typography>
              <Button 
                size="small" 
                onClick={() => navigate('/user/ecommerce/orders')}
              >
                View All
              </Button>
            </Box>

            {recentOrders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Receipt sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No orders yet
                </Typography>
                <Button 
                  variant="contained" 
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/user/ecommerce/products')}
                >
                  Start Shopping
                </Button>
              </Box>
            ) : (
              <List>
                {recentOrders.map((order, index) => (
                  <React.Fragment key={order._id}>
                    <ListItem 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={() => navigate(`/user/ecommerce/orders/${order._id}`)}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                              Order #{order.orderNumber || order._id.slice(-6)}
                            </Typography>
                            <Chip 
                              label={order.status} 
                              color={getStatusColor(order.status)} 
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {order.items?.length || 0} items • ₹{order.totalAmount?.toFixed(2)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentOrders.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Featured Products */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Featured Products
              </Typography>
              <Button 
                size="small"
                onClick={() => navigate('/user/ecommerce/products')}
              >
                Browse All
              </Button>
            </Box>

            {featuredProducts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <TrendingUp sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No featured products available
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {featuredProducts.map((product) => (
                  <Grid item xs={12} key={product._id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 3 }
                      }}
                      onClick={() => navigate(`/user/ecommerce/products/${product._id}`)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Avatar
                            variant="rounded"
                            src={product.images?.[0] || '/placeholder-product.png'}
                            sx={{ width: 60, height: 60 }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 0.5 }}>
                              {product.name}
                            </Typography>
                            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                              ₹{product.price?.toFixed(2)}
                            </Typography>
                            {product.stock > 0 ? (
                              <Chip label="In Stock" color="success" size="small" />
                            ) : (
                              <Chip label="Out of Stock" color="error" size="small" />
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="contained" 
                fullWidth
                onClick={() => navigate('/user/ecommerce/products')}
              >
                Browse Products
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="outlined" 
                fullWidth
                onClick={() => navigate('/user/ecommerce/orders')}
              >
                My Orders
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="outlined" 
                fullWidth
                onClick={() => navigate('/user/ecommerce/wishlist')}
              >
                My Wishlist
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                variant="outlined" 
                fullWidth
                onClick={() => navigate('/user/ecommerce/profile')}
              >
                My Profile
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default EcommerceDashboard;
