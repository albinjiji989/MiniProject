import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Breadcrumbs,
  Link,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  alpha,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Pets as PetsIcon,
  Favorite as AdoptionIcon,
  Store as StoreIcon,
  Security as BlockchainIcon,
  AttachMoney as MoneyIcon,
  NavigateNext as NavigateNextIcon,
  Dashboard as DashboardIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { petsAPI } from '../../../services/petSystemAPI'

const PetsDashboard = () => {
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalPets: 0,
      totalRevenue: 0,
      activeTransactions: 0,
      blockchainBlocks: 0
    },
    adoption: {
      total: 0,
      adopted: 0,
      available: 0,
      revenue: 0,
      successRate: 0
    },
    petshop: {
      total: 0,
      sold: 0,
      available: 0,
      revenue: 0,
      conversionRate: 0
    },
    blockchain: {
      totalBlocks: 0,
      isValid: true,
      recentTransactions: []
    }
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [statsResponse, blockchainResponse] = await Promise.all([
        petsAPI.getStats(),
        petsAPI.getBlockchainData()
      ])

      if (statsResponse.data?.success) {
        const stats = statsResponse.data.data
        setDashboardData(prev => ({
          ...prev,
          overview: {
            totalPets: stats.adoption.total + stats.petshop.total,
            totalRevenue: stats.adoption.revenue + stats.petshop.revenue,
            activeTransactions: stats.adoption.reserved + stats.petshop.reserved,
            blockchainBlocks: blockchainResponse.data?.data?.totalBlocks || 0
          },
          adoption: {
            ...stats.adoption,
            successRate: stats.adoption.total > 0 ? (stats.adoption.adopted / stats.adoption.total * 100) : 0
          },
          petshop: {
            ...stats.petshop,
            conversionRate: stats.petshop.total > 0 ? (stats.petshop.sold / stats.petshop.total * 100) : 0
          }
        }))
      }

      if (blockchainResponse.data?.success) {
        setDashboardData(prev => ({
          ...prev,
          blockchain: blockchainResponse.data.data
        }))
      }

    } catch (err) {
      setError('Failed to load dashboard data')
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const MetricCard = ({ title, value, subtitle, icon: Icon, color, gradient, trend, onClick, badge }) => (
    <Card 
      sx={{ 
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: gradient || `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.7)} 100%)`,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': { 
          transform: 'translateY(-8px)', 
          boxShadow: `0 12px 24px ${alpha(color, 0.4)}`,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '200px',
          background: `radial-gradient(circle, ${alpha('#fff', 0.1)} 0%, transparent 70%)`,
          borderRadius: '50%',
          transform: 'translate(50%, -50%)',
        }
      }}
      onClick={onClick}
    >
      {badge && (
        <Chip 
          label={badge} 
          size="small" 
          sx={{ 
            position: 'absolute', 
            top: 12, 
            right: 12, 
            zIndex: 1,
            bgcolor: 'rgba(255,255,255,0.2)',
            color: 'white',
            fontWeight: 'bold',
            backdropFilter: 'blur(10px)'
          }} 
        />
      )}
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
          <Avatar 
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              width: 56, 
              height: 56,
              backdropFilter: 'blur(10px)'
            }}
          >
            <Icon fontSize="large" sx={{ color: 'white' }} />
          </Avatar>
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, opacity: 0.95 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
          {subtitle}
        </Typography>
        {trend !== undefined && (
          <Box display="flex" alignItems="center" gap={0.5}>
            {trend > 0 ? (
              <TrendingUpIcon fontSize="small" />
            ) : trend < 0 ? (
              <TrendingDownIcon fontSize="small" />
            ) : null}
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {trend > 0 ? '+' : ''}{trend}% vs last month
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
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
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
            <PetsIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Pet Management System
          </Typography>
        </Breadcrumbs>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
              🐾 Pet Management Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Real-time analytics with blockchain-verified transactions
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<BlockchainIcon />}
            onClick={() => navigate('/admin/pets/blockchain/explorer')}
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}
          >
            Blockchain Explorer
          </Button>
        </Box>
      </Box>

      {/* Overview Metrics */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Pets"
            value={dashboardData.overview.totalPets}
            subtitle="Across all systems"
            icon={PetsIcon}
            color="#667eea"
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            onClick={() => navigate('/admin/pets/overview')}
            badge="Live"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Revenue"
            value={`$${dashboardData.overview.totalRevenue.toLocaleString()}`}
            subtitle="All-time earnings"
            icon={MoneyIcon}
            color="#f093fb"
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            trend={12}
            onClick={() => navigate('/admin/pets/revenue')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Blockchain Blocks"
            value={dashboardData.overview.blockchainBlocks}
            subtitle="Immutable records"
            icon={BlockchainIcon}
            color="#4facfe"
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            onClick={() => navigate('/admin/pets/blockchain/explorer')}
            badge="Secure"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Transactions"
            value={dashboardData.overview.activeTransactions}
            subtitle="Pending operations"
            icon={ScheduleIcon}
            color="#fa709a"
            gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
            onClick={() => navigate('/admin/pets/transactions')}
            badge="Real-time"
          />
        </Grid>
      </Grid>

      {/* Adoption & Pet Shop Stats */}
      <Grid container spacing={4} sx={{ mb: 5 }}>
        {/* Adoption Section */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(76, 175, 80, 0.02) 100%)'
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>
                  <AdoptionIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    Adoption Center
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pet adoption operations
                  </Typography>
                </Box>
              </Box>
              <Button 
                variant="outlined" 
                color="success"
                onClick={() => navigate('/admin/pets/adoption/overview')}
              >
                View Details
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {dashboardData.adoption.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Pets
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.dark' }}>
                    {dashboardData.adoption.adopted}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Adopted
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                    {dashboardData.adoption.available}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    ${dashboardData.adoption.revenue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Revenue
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Pet Shop Section */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(33, 150, 243, 0.02) 100%)'
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                  <StoreIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    Pet Shop
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Retail sales operations
                  </Typography>
                </Box>
              </Box>
              <Button 
                variant="outlined" 
                color="primary"
                onClick={() => navigate('/admin/pets/petshop/overview')}
              >
                View Details
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {dashboardData.petshop.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Inventory
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                    {dashboardData.petshop.sold}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sold
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                    {dashboardData.petshop.available}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    ${dashboardData.petshop.revenue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Revenue
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

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

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess('')}
      >
        <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default PetsDashboard
