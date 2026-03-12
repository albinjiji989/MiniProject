import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  LinearProgress,
  Breadcrumbs,
  Link,
  IconButton,
  Tooltip,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  NavigateNext as NavigateNextIcon,
  Dashboard as DashboardIcon,
  Pets as PetsIcon,
  Store as StoreIcon,
  Visibility as ViewIcon,
  FileDownload as DownloadIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Inventory as InventoryIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { petsAPI } from '../../../services/petSystemAPI'

const PetShopOverview = () => {
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [petshopData, setPetshopData] = useState({
    summary: {
      total: 0,
      sold: 0,
      available: 0,
      reserved: 0,
      inStock: 0,
      revenue: 0,
      avgSaleTime: 0,
      conversionRate: 0
    },
    recentSales: [],
    inventory: [],
    topSellingBreeds: [],
    monthlyStats: [],
    priceRanges: [],
    storePerformance: []
  })

  useEffect(() => {
    loadPetshopData()
  }, [])

  const loadPetshopData = async () => {
    setLoading(true)
    try {
      const response = await petsAPI.getPetshopOverview()
      if (response.data?.success) {
        setPetshopData(response.data.data)
      }
    } catch (err) {
      setError('Failed to load pet shop data')
      console.error('Pet shop data error:', err)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, onClick }) => (
    <Card 
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: 3 } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color, mb: 0.5 }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
            {trend !== undefined && (
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingUpIcon fontSize="small" color={trend > 0 ? 'success' : 'error'} />
                <Typography variant="caption" color={trend > 0 ? 'success.main' : 'error.main'}>
                  {trend > 0 ? '+' : ''}{trend}%
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            <Icon fontSize="large" />
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
          <Link color="inherit" href="/admin/dashboard" sx={{ display: 'flex', alignItems: 'center' }}>
            <DashboardIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Admin
          </Link>
          <Link color="inherit" href="/admin/pets" sx={{ display: 'flex', alignItems: 'center' }}>
            <PetsIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Pet Management
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <StoreIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Pet Shop Overview
          </Typography>
        </Breadcrumbs>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              🏪 Pet Shop Overview
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Comprehensive analytics and inventory management for pet shop operations
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/admin/pets')}
            >
              Back to Dashboard
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => navigate('/admin/pets/petshop/reports')}
            >
              Export Data
            </Button>
            <Button
              variant="contained"
              startIcon={<AnalyticsIcon />}
              onClick={() => navigate('/admin/pets/petshop/analytics')}
            >
              Advanced Analytics
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Inventory"
            value={petshopData.summary.total}
            subtitle="All pets in system"
            icon={StoreIcon}
            color="primary.main"
            trend={5}
            onClick={() => navigate('/admin/pets/petshop/inventory')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pets Sold"
            value={petshopData.summary.sold}
            subtitle={`${petshopData.summary.conversionRate.toFixed(1)}% conversion rate`}
            icon={CheckCircleIcon}
            color="success.main"
            trend={18}
            onClick={() => navigate('/admin/pets/petshop/sold')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Available Stock"
            value={petshopData.summary.available}
            subtitle="Ready for sale"
            icon={InventoryIcon}
            color="info.main"
            onClick={() => navigate('/admin/pets/petshop/available')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Sales Revenue"
            value={`$${petshopData.summary.revenue.toLocaleString()}`}
            subtitle="Total sales income"
            icon={MoneyIcon}
            color="success.main"
            trend={25}
            onClick={() => navigate('/admin/pets/petshop/revenue')}
          />
        </Grid>
      </Grid>

      {/* Performance Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Sales Performance
              </Typography>
              <Stack spacing={3}>
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">Average Sale Time</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {petshopData.summary.avgSaleTime} days
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min((14 - petshopData.summary.avgSaleTime) / 14 * 100, 100)} 
                    color="primary"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Target: Under 10 days
                  </Typography>
                </Box>
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">Conversion Rate</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {petshopData.summary.conversionRate.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={petshopData.summary.conversionRate} 
                    color="primary"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Industry average: 65%
                  </Typography>
                </Box>
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">Inventory Turnover</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {((petshopData.summary.sold / petshopData.summary.total) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(petshopData.summary.sold / petshopData.summary.total) * 100} 
                    color="success"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Target: Over 80%
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Quick Actions
              </Typography>
              <Stack spacing={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<InventoryIcon />}
                  onClick={() => navigate('/admin/pets/petshop/inventory')}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Manage Inventory ({petshopData.summary.total} items)
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ShoppingCartIcon />}
                  onClick={() => navigate('/admin/pets/petshop/sales')}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  View Sales History ({petshopData.summary.sold} sold)
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<StoreIcon />}
                  onClick={() => navigate('/admin/pets/petshop/available')}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Available for Sale ({petshopData.summary.available})
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AnalyticsIcon />}
                  onClick={() => navigate('/admin/pets/petshop/analytics')}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Advanced Analytics & Reports
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Sales */}
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Recent Sales
      </Typography>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pet</TableCell>
                  <TableCell>Buyer</TableCell>
                  <TableCell>Sale Date</TableCell>
                  <TableCell>Sale Price</TableCell>
                  <TableCell>Days in Stock</TableCell>
                  <TableCell>Store</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {petshopData.recentSales.slice(0, 10).map((sale) => (
                  <TableRow key={sale.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <PetsIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {sale.petName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {sale.petCode} • {sale.breed}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {sale.buyerName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CalendarIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {new Date(sale.saleDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        ${sale.salePrice.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {sale.daysInStock} days
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={sale.storeName} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small"
                          onClick={() => navigate(`/admin/pets/petshop/sale/${sale.id}`)}
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
          <Box display="flex" justifyContent="center" mt={2}>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/admin/pets/petshop/sales')}
            >
              View All Sales
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Current Inventory */}
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Current Inventory
      </Typography>
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pet</TableCell>
                  <TableCell>Age</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Days in Stock</TableCell>
                  <TableCell>Store</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {petshopData.inventory.slice(0, 10).map((pet) => (
                  <TableRow key={pet.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'info.main' }}>
                          <PetsIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {pet.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {pet.petCode} • {pet.breed}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {pet.age} {pet.ageUnit}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        ${pet.price.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {pet.daysInStock} days
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={pet.storeName} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={pet.status} 
                        size="small" 
                        color={pet.status === 'available_for_sale' ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small"
                          onClick={() => navigate(`/admin/pets/petshop/pet/${pet.id}`)}
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
          <Box display="flex" justifyContent="center" mt={2}>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/admin/pets/petshop/inventory')}
            >
              View Full Inventory
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Error/Success Messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default PetShopOverview