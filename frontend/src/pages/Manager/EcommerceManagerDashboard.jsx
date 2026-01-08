import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  Tooltip,
  Avatar,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ShoppingCart,
  Category,
  Inventory,
  LocalShipping,
  TrendingUp,
  Menu as MenuIcon,
  Store,
  BarChart,
  Settings,
  ExitToApp
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const EcommerceManagerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [statsRes, productsRes, ordersRes] = await Promise.all([
        axios.get(`${API_URL}/manager/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/ecommerce/manager/products`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/ecommerce/manager/orders?status=pending`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsRes.data.data);
      setProducts(productsRes.data.data || []);
      setOrders(ordersRes.data.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/manager/ecommerce/dashboard' },
    { text: 'Products', icon: <ShoppingCart />, path: '/manager/ecommerce/products' },
    { text: 'Categories', icon: <Category />, path: '/manager/ecommerce/categories' },
    { text: 'Orders', icon: <LocalShipping />, path: '/manager/ecommerce/orders' },
    { text: 'Inventory', icon: <Inventory />, path: '/manager/ecommerce/inventory' },
    { text: 'Analytics', icon: <BarChart />, path: '/manager/ecommerce/analytics' }
  ];

  const ecommerceStats = stats.moduleStats?.find(m => m.key === 'ecommerce') || {};

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            bgcolor: '#1e3a8a',
            color: 'white'
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Store sx={{ fontSize: 32, color: '#fbbf24' }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
            E-Commerce
          </Typography>
        </Box>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
        
        <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Store Name
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white' }}>
            {user?.storeInfo?.storeName || 'My Store'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>
            {user?.storeInfo?.storeId || 'STORE-XXX'}
          </Typography>
        </Box>

        <List sx={{ mt: 2 }}>
          {menuItems.map((item, index) => (
            <ListItem
              button
              key={index}
              onClick={() => navigate(item.path)}
              sx={{
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <ListItemIcon sx={{ color: '#fbbf24' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>

        <Box sx={{ mt: 'auto', p: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ExitToApp />}
            onClick={handleLogout}
            sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: '#fbbf24', color: '#fbbf24' } }}
          >
            Logout
          </Button>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <AppBar position="static" sx={{ bgcolor: 'white', color: '#1e3a8a', boxShadow: 1, mb: 3 }}>
          <Toolbar>
            <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              E-Commerce Manager Dashboard
            </Typography>
            <Chip
              icon={<Store />}
              label={user?.storeInfo?.storeName || 'My Store'}
              sx={{ bgcolor: '#1e3a8a', color: 'white', fontWeight: 'bold' }}
            />
          </Toolbar>
        </AppBar>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <Card sx={{ bgcolor: '#3b82f6', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6">Total Products</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                      {ecommerceStats.totalProducts || 0}
                    </Typography>
                    <Typography variant="body2">Active: {ecommerceStats.activeProducts || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ bgcolor: '#10b981', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6">Total Orders</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                      {ecommerceStats.totalOrders || 0}
                    </Typography>
                    <Typography variant="body2">Pending: {ecommerceStats.pendingOrders || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ bgcolor: '#f59e0b', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6">Revenue</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                      ₹{(ecommerceStats.revenue || 0).toLocaleString()}
                    </Typography>
                    <Typography variant="body2">This month</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ bgcolor: '#8b5cf6', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6">Low Stock Items</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                      {products.filter(p => p.stock < 10).length}
                    </Typography>
                    <Typography variant="body2">Needs attention</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
              <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                <Tab label="Recent Products" />
                <Tab label="Pending Orders" />
                <Tab label="Low Stock Alerts" />
              </Tabs>
            </Paper>

            {/* Tab Content */}
            {activeTab === 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Recent Products</Typography>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product Name</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Stock</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {products.slice(0, 5).map((product) => (
                        <TableRow key={product._id}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{product.category?.name || 'N/A'}</TableCell>
                          <TableCell>₹{product.basePrice?.toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip
                              label={product.stock}
                              color={product.stock < 10 ? 'error' : 'success'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={product.status}
                              color={product.status === 'active' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Button size="small" onClick={() => navigate(`/manager/ecommerce/products`)}>
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {activeTab === 1 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Pending Orders</Typography>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Order #</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Items</TableCell>
                        <TableCell>Total</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.slice(0, 5).map((order) => (
                        <TableRow key={order._id}>
                          <TableCell>{order.orderNumber}</TableCell>
                          <TableCell>{order.user?.name || 'Unknown'}</TableCell>
                          <TableCell>{order.items?.length || 0} items</TableCell>
                          <TableCell>₹{order.pricing?.total?.toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip label={order.status} color="warning" size="small" />
                          </TableCell>
                          <TableCell>
                            <Button size="small" onClick={() => navigate('/manager/ecommerce/orders')}>
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {activeTab === 2 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Low Stock Alerts</Typography>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product Name</TableCell>
                        <TableCell>Current Stock</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {products.filter(p => p.stock < 10).map((product) => (
                        <TableRow key={product._id}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>
                            <Chip label={product.stock} color="error" size="small" />
                          </TableCell>
                          <TableCell>{product.category?.name || 'N/A'}</TableCell>
                          <TableCell>
                            <Button size="small" onClick={() => navigate('/manager/ecommerce/products')}>
                              Restock
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default EcommerceManagerDashboard;
