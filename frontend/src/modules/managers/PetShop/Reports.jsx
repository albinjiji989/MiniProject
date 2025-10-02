import React, { useEffect, useState } from 'react'
import { 
  Box, Grid, Card, CardContent, Typography, CircularProgress, Alert, 
  Table, TableHead, TableRow, TableCell, TableBody, Button, Paper,
  Chip, Divider, LinearProgress
} from '@mui/material'
import { 
  TrendingUp as TrendingUpIcon, Inventory as InventoryIcon, AttachMoney as MoneyIcon, 
  ShoppingCart as OrdersIcon, BookOnline as ReservationsIcon, Refresh as RefreshIcon,
  Assessment as ReportsIcon, Timeline as TimelineIcon
} from '@mui/icons-material'
import { apiClient } from '../../../services/api'
import { useAuth } from '../../../contexts/AuthContext'

const Reports = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  
  // Core metrics
  const [metrics, setMetrics] = useState({
    inventory: { total: 0, available: 0, reserved: 0, sold: 0 },
    sales: { totalRevenue: 0, ordersCount: 0, avgOrderValue: 0 },
    operations: { reservations: 0, pendingOrders: 0, lowStock: 0 }
  })
  
  // Detailed data
  const [recentOrders, setRecentOrders] = useState([])
  const [topPerformers, setTopPerformers] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadReports = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError('')

      // Fetch core data using existing working endpoints
      const [statsRes, inventoryRes, availableRes, ordersRes] = await Promise.allSettled([
        apiClient.get('/petshop/stats'),
        apiClient.get('/petshop/inventory?limit=1'),
        apiClient.get('/petshop/inventory?status=available_for_sale&limit=1'),
        apiClient.get('/petshop/orders?limit=10')
      ])

      // Process manager stats
      const stats = statsRes.status === 'fulfilled' ? (statsRes.value?.data?.data || {}) : {}
      
      // Process inventory metrics
      const totalInventory = inventoryRes.status === 'fulfilled' 
        ? (inventoryRes.value?.data?.data?.pagination?.total || 0) 
        : (stats.totalAnimals || 0)
        
      const availableInventory = availableRes.status === 'fulfilled'
        ? (availableRes.value?.data?.data?.pagination?.total || 0)
        : (stats.availableForSale || 0)

      // Process orders
      const orders = ordersRes.status === 'fulfilled' 
        ? (ordersRes.value?.data?.data?.orders || [])
        : []

      // Calculate metrics
      const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0)
      const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0
      const pendingOrders = orders.filter(o => ['draft', 'submitted'].includes(o.status)).length

      // Update state
      setMetrics({
        inventory: {
          total: totalInventory,
          available: availableInventory,
          reserved: totalInventory - availableInventory,
          sold: stats.soldCount || 0
        },
        sales: {
          totalRevenue,
          ordersCount: orders.length,
          avgOrderValue
        },
        operations: {
          reservations: stats.totalReservations || 0,
          pendingOrders,
          lowStock: stats.lowStockItems || 0
        }
      })

      setRecentOrders(orders.slice(0, 5))
      setLastUpdated(new Date())

    } catch (err) {
      console.error('Reports load error:', err)
      setError('Failed to load reports data. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { loadReports() }, [])

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}><CircularProgress /></Box>
  if (error) return <Alert severity="error">{error}</Alert>

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReportsIcon color="primary" />
            PetShop Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manager: {user?.name} • Shop Performance Overview
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={() => loadReports(true)}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Inventory Metrics */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" color="primary">Inventory</Typography>
                <InventoryIcon color="primary" />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {metrics.inventory.total}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Total Animals
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label={`${metrics.inventory.available} Available`} size="small" color="success" />
                <Chip label={`${metrics.inventory.reserved} Reserved`} size="small" color="warning" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sales Metrics */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" color="success.main">Sales</Typography>
                <MoneyIcon color="success" />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                ₹{metrics.sales.totalRevenue.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Total Revenue
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label={`${metrics.sales.ordersCount} Orders`} size="small" color="info" />
                <Chip label={`₹${Math.round(metrics.sales.avgOrderValue)} Avg`} size="small" color="default" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Operations Metrics */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" color="info.main">Operations</Typography>
                <OrdersIcon color="info" />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {metrics.operations.pendingOrders}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Pending Orders
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label={`${metrics.operations.reservations} Reservations`} size="small" color="primary" />
                {metrics.operations.lowStock > 0 && (
                  <Chip label={`${metrics.operations.lowStock} Low Stock`} size="small" color="error" />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Summary */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" color="warning.main">Performance</Typography>
                <TrendingUpIcon color="warning" />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {metrics.inventory.total > 0 ? Math.round((metrics.inventory.available / metrics.inventory.total) * 100) : 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Availability Rate
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={metrics.inventory.total > 0 ? (metrics.inventory.available / metrics.inventory.total) * 100 : 0}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Orders Table */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimelineIcon />
            Recent Purchase Orders
          </Typography>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order Number</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Items</TableCell>
              <TableCell align="right">Subtotal</TableCell>
              <TableCell align="right">Tax</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentOrders.map((order) => (
              <TableRow key={order._id} hover>
                <TableCell sx={{ fontFamily: 'monospace' }}>{order.orderNumber}</TableCell>
                <TableCell>
                  <Chip 
                    label={order.status} 
                    size="small" 
                    color={order.status === 'completed' ? 'success' : order.status === 'draft' ? 'default' : 'primary'}
                  />
                </TableCell>
                <TableCell>{order.items?.length || 0}</TableCell>
                <TableCell align="right">₹{Number(order.subtotal || 0).toLocaleString()}</TableCell>
                <TableCell align="right">₹{Number(order.tax || 0).toLocaleString()}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  ₹{Number(order.total || 0).toLocaleString()}
                </TableCell>
                <TableCell>
                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
                </TableCell>
              </TableRow>
            ))}
            {recentOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No recent orders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}

export default Reports
