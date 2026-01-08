import React, { useState, useEffect } from 'react';
import {
  Box,
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
  Alert,
  CircularProgress,
  Paper,
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
  Medication,
  Inventory,
  ShoppingCart,
  LocalShipping,
  BarChart,
  Store,
  ExitToApp,
  LocalPharmacy
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const PharmacyManagerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/manager/pharmacy/dashboard' },
    { text: 'Medicines', icon: <Medication />, path: '/manager/pharmacy/medicines' },
    { text: 'Inventory', icon: <Inventory />, path: '/manager/pharmacy/inventory' },
    { text: 'Orders', icon: <ShoppingCart />, path: '/manager/pharmacy/orders' },
    { text: 'Analytics', icon: <BarChart />, path: '/manager/pharmacy/analytics' }
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          '& .MuiDrawer-paper': {
            width: 240,
            bgcolor: '#dc2626',
            color: 'white'
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalPharmacy sx={{ fontSize: 32, color: '#fbbf24' }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Pharmacy
          </Typography>
        </Box>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
        
        <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Store Name
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {user?.storeInfo?.storeName || 'My Pharmacy'}
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)' }}>
            {user?.storeInfo?.storeId || 'STORE-XXX'}
          </Typography>
        </Box>

        <List sx={{ mt: 2 }}>
          {menuItems.map((item, index) => (
            <ListItem
              button
              key={index}
              onClick={() => navigate(item.path)}
              sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
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
            sx={{ color: 'white', borderColor: 'white' }}
          >
            Logout
          </Button>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <AppBar position="static" sx={{ bgcolor: 'white', color: '#dc2626', boxShadow: 1, mb: 3 }}>
          <Toolbar>
            <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              Pharmacy Manager Dashboard
            </Typography>
            <Chip
              icon={<Store />}
              label={user?.storeInfo?.storeName || 'My Pharmacy'}
              sx={{ bgcolor: '#dc2626', color: 'white', fontWeight: 'bold' }}
            />
          </Toolbar>
        </AppBar>

        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: '#3b82f6', color: 'white' }}>
              <CardContent>
                <Typography variant="h6">Total Medicines</Typography>
                <Typography variant="h3">0</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: '#10b981', color: 'white' }}>
              <CardContent>
                <Typography variant="h6">Orders</Typography>
                <Typography variant="h3">0</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: '#f59e0b', color: 'white' }}>
              <CardContent>
                <Typography variant="h6">Revenue</Typography>
                <Typography variant="h3">₹0</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ bgcolor: '#8b5cf6', color: 'white' }}>
              <CardContent>
                <Typography variant="h6">Low Stock</Typography>
                <Typography variant="h3">0</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mt: 3 }}>
          Pharmacy module is under development. Features coming soon!
        </Alert>
      </Box>
    </Box>
  );
};

export default PharmacyManagerDashboard;
