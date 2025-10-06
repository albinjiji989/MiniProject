import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as OrdersIcon,
  Download as DownloadIcon,
  Print as PrintIcon
} from '@mui/icons-material'
import { petShopManagerAPI } from '../../services/api'

const PetShopSalesReport = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [salesData, setSalesData] = useState([])
  const [orders, setOrders] = useState([])
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    groupBy: 'day'
  })
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    growth: 0
  })

  const loadSalesData = async () => {
    try {
      setLoading(true)
      const [salesRes, ordersRes] = await Promise.all([
        petShopManagerAPI.getSalesReport(filters),
        petShopManagerAPI.getOrders({ status: 'paid' })
      ])
      
      setSalesData(salesRes.data.data.salesData || [])
      setOrders(ordersRes.data.data.orders || [])
      
      // Calculate stats
      const totalSales = salesRes.data.data.salesData.reduce((sum, item) => sum + item.totalSales, 0)
      const totalOrders = salesRes.data.data.salesData.reduce((sum, item) => sum + item.orderCount, 0)
      const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0
      
      setStats({
        totalSales,
        totalOrders,
        avgOrderValue,
        growth: 12.5 // Mock growth percentage
      })
      
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load sales data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSalesData()
  }, [filters])

  const handleFilterChange = (field) => (event) => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  const exportReport = (format) => {
    // Export functionality
    console.log(`Exporting report as ${format}`)
  }

  const renderStatsCards = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" color="primary">
                  ₹{stats.totalSales.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Sales
                </Typography>
              </Box>
              <MoneyIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
            <Box display="flex" alignItems="center" mt={1}>
              <TrendingUpIcon color="success" sx={{ fontSize: 16, mr: 0.5 }} />
              <Typography variant="body2" color="success.main">
                +{stats.growth}%
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" color="info.main">
                  {stats.totalOrders}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Orders
                </Typography>
              </Box>
              <OrdersIcon color="info" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" color="success.main">
                  ₹{Math.round(stats.avgOrderValue).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Order Value
                </Typography>
              </Box>
              <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4" color="warning.main">
                  {orders.filter(o => o.status === 'ready_pickup').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Deliveries
                </Typography>
              </Box>
              <TrendingDownIcon color="warning" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )

  const renderFilters = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Report Filters</Typography>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            value={filters.startDate}
            onChange={handleFilterChange('startDate')}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="End Date"
            type="date"
            value={filters.endDate}
            onChange={handleFilterChange('endDate')}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Group By</InputLabel>
            <Select
              value={filters.groupBy}
              onChange={handleFilterChange('groupBy')}
              label="Group By"
            >
              <MenuItem value="day">Daily</MenuItem>
              <MenuItem value="month">Monthly</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => exportReport('print')}
            >
              Print
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => exportReport('pdf')}
            >
              Export
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  )

  const renderSalesTable = () => (
    <Paper sx={{ mb: 3 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Sales Breakdown</Typography>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell align="right">Orders</TableCell>
            <TableCell align="right">Total Sales</TableCell>
            <TableCell align="right">Avg Order Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {salesData.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row._id}</TableCell>
              <TableCell align="right">{row.orderCount}</TableCell>
              <TableCell align="right">₹{row.totalSales.toLocaleString()}</TableCell>
              <TableCell align="right">₹{Math.round(row.avgOrderValue).toLocaleString()}</TableCell>
            </TableRow>
          ))}
          {salesData.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center">
                <Typography variant="body2" color="text.secondary">
                  No sales data available for the selected period
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  )

  const renderRecentOrders = () => (
    <Paper>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Recent Orders</Typography>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Order ID</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Pet</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.slice(0, 10).map((order) => (
            <TableRow key={order._id}>
              <TableCell>#{order.reservationCode || order._id.slice(-6)}</TableCell>
              <TableCell>{order.userId?.name}</TableCell>
              <TableCell>{order.itemId?.name}</TableCell>
              <TableCell align="right">₹{order.paymentDetails?.amount?.toLocaleString()}</TableCell>
              <TableCell>
                <Chip 
                  label={order.status} 
                  color={order.status === 'paid' ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Sales Report & Analytics
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {renderFilters()}
      {renderStatsCards()}
      
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          {renderSalesTable()}
        </Grid>
        <Grid item xs={12} lg={4}>
          {renderRecentOrders()}
        </Grid>
      </Grid>
    </Container>
  )
}

export default PetShopSalesReport
