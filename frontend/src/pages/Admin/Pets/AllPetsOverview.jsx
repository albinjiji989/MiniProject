import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Breadcrumbs,
  Link,
  CircularProgress,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Avatar,
  Tabs,
  Tab,
  alpha,
  LinearProgress,
} from '@mui/material'
import {
  Pets as PetsIcon,
  Dashboard as DashboardIcon,
  NavigateNext as NavigateNextIcon,
  Favorite as AdoptionIcon,
  Store as StoreIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { petsAPI } from '../../../services/petSystemAPI'

const AllPetsOverview = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [petsData, setPetsData] = useState({
    adoption: {
      total: 0,
      available: 0,
      adopted: 0,
      reserved: 0,
      pending: 0,
      revenue: 0
    },
    petshop: {
      total: 0,
      available: 0,
      sold: 0,
      reserved: 0,
      pending: 0,
      revenue: 0
    },
    combined: {
      total: 0,
      available: 0,
      completed: 0,
      active: 0,
      revenue: 0
    }
  })

  useEffect(() => {
    loadPetsData()
  }, [])

  const loadPetsData = async () => {
    setLoading(true)
    try {
      const response = await petsAPI.getStats()
      if (response.data?.success) {
        const stats = response.data.data
        
        setPetsData({
          adoption: stats.adoption,
          petshop: stats.petshop,
          combined: {
            total: stats.adoption.total + stats.petshop.total,
            available: stats.adoption.available + stats.petshop.available,
            completed: stats.adoption.adopted + stats.petshop.sold,
            active: stats.adoption.reserved + stats.petshop.reserved,
            revenue: stats.adoption.revenue + stats.petshop.revenue
          }
        })
      }
    } catch (err) {
      console.error('Failed to load pets data:', err)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color, gradient, onClick }) => (
    <Card 
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s',
        background: gradient || `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.7)} 100%)`,
        color: 'white',
        '&:hover': onClick ? { 
          transform: 'translateY(-4px)', 
          boxShadow: `0 8px 16px ${alpha(color, 0.4)}`,
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
            <Icon />
          </Avatar>
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  )

  const ProgressCard = ({ title, current, total, color, icon: Icon }) => {
    const percentage = total > 0 ? (current / total * 100) : 0
    return (
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar sx={{ bgcolor: `${color}.main` }}>
            <Icon />
          </Avatar>
          <Box flex={1}>
            <Typography variant="h6" fontWeight="bold">
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {current} of {total} ({percentage.toFixed(1)}%)
            </Typography>
          </Box>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={percentage} 
          sx={{ 
            height: 8, 
            borderRadius: 4,
            bgcolor: alpha(color === 'success' ? '#4caf50' : '#2196f3', 0.1),
            '& .MuiLinearProgress-bar': {
              bgcolor: `${color}.main`
            }
          }} 
        />
      </Paper>
    )
  }

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
          <Link 
            color="inherit" 
            onClick={() => navigate('/admin/dashboard')} 
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <DashboardIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Admin
          </Link>
          <Link 
            color="inherit" 
            onClick={() => navigate('/admin/pets')} 
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <PetsIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Pets Dashboard
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
            <PetsIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            All Pets Overview
          </Typography>
        </Breadcrumbs>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              🐾 All Pets Overview
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Comprehensive view of all pets across adoption and pet shop systems
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<AdoptionIcon />}
              onClick={() => navigate('/admin/pets/adoption/overview')}
            >
              Adoption Details
            </Button>
            <Button
              variant="outlined"
              startIcon={<StoreIcon />}
              onClick={() => navigate('/admin/pets/petshop/overview')}
            >
              Pet Shop Details
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Combined Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Total Pets"
            value={petsData.combined.total}
            subtitle="All systems"
            icon={PetsIcon}
            color="#667eea"
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Available"
            value={petsData.combined.available}
            subtitle="Ready for adoption/sale"
            icon={CheckCircleIcon}
            color="#43e97b"
            gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Completed"
            value={petsData.combined.completed}
            subtitle="Adopted + Sold"
            icon={TrendingUpIcon}
            color="#f093fb"
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Active"
            value={petsData.combined.active}
            subtitle="Reserved/Pending"
            icon={ScheduleIcon}
            color="#fa709a"
            gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Revenue"
            value={`$${petsData.combined.revenue.toLocaleString()}`}
            subtitle="Total earnings"
            icon={TrendingUpIcon}
            color="#4facfe"
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            onClick={() => navigate('/admin/pets/revenue')}
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" />
          <Tab label="Adoption System" icon={<AdoptionIcon />} iconPosition="start" />
          <Tab label="Pet Shop System" icon={<StoreIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Progress Cards */}
          <Grid item xs={12} md={6}>
            <ProgressCard
              title="Adoption Success Rate"
              current={petsData.adoption.adopted}
              total={petsData.adoption.total}
              color="success"
              icon={AdoptionIcon}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <ProgressCard
              title="Pet Shop Conversion Rate"
              current={petsData.petshop.sold}
              total={petsData.petshop.total}
              color="primary"
              icon={StoreIcon}
            />
          </Grid>

          {/* Comparison Table */}
          <Grid item xs={12}>
            <Paper>
              <Box p={3}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                  System Comparison
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>System</TableCell>
                      <TableCell align="center">Total Pets</TableCell>
                      <TableCell align="center">Available</TableCell>
                      <TableCell align="center">Completed</TableCell>
                      <TableCell align="center">Reserved</TableCell>
                      <TableCell align="center">Revenue</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                            <AdoptionIcon fontSize="small" />
                          </Avatar>
                          <Typography fontWeight="bold">Adoption Center</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6" fontWeight="bold">{petsData.adoption.total}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={petsData.adoption.available} color="success" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Typography fontWeight="bold" color="success.main">{petsData.adoption.adopted}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={petsData.adoption.reserved} color="warning" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Typography fontWeight="bold">${petsData.adoption.revenue.toLocaleString()}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => navigate('/admin/pets/adoption/overview')}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                            <StoreIcon fontSize="small" />
                          </Avatar>
                          <Typography fontWeight="bold">Pet Shop</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6" fontWeight="bold">{petsData.petshop.total}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={petsData.petshop.available} color="primary" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Typography fontWeight="bold" color="primary.main">{petsData.petshop.sold}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={petsData.petshop.reserved} color="warning" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Typography fontWeight="bold">${petsData.petshop.revenue.toLocaleString()}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => navigate('/admin/pets/petshop/overview')}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: alpha('#667eea', 0.05) }}>
                      <TableCell>
                        <Typography fontWeight="bold" variant="h6">Total</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          {petsData.combined.total}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6" fontWeight="bold">
                          {petsData.combined.available}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6" fontWeight="bold">
                          {petsData.combined.completed}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6" fontWeight="bold">
                          {petsData.combined.active}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6" fontWeight="bold">
                          ${petsData.combined.revenue.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">-</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                  <AdoptionIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">Adoption Center</Typography>
                  <Typography variant="body1" color="text.secondary">
                    Pet adoption and rehoming operations
                  </Typography>
                </Box>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, bgcolor: alpha('#4caf50', 0.1), borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {petsData.adoption.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Total Pets</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, bgcolor: alpha('#4caf50', 0.1), borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight="bold" color="success.dark">
                      {petsData.adoption.available}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Available</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, bgcolor: alpha('#4caf50', 0.1), borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {petsData.adoption.adopted}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Adopted</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, bgcolor: alpha('#4caf50', 0.1), borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      ${petsData.adoption.revenue.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Revenue</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box mt={3}>
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  startIcon={<VisibilityIcon />}
                  onClick={() => navigate('/admin/pets/adoption/overview')}
                >
                  View Full Adoption Details
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <StoreIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">Pet Shop</Typography>
                  <Typography variant="body1" color="text.secondary">
                    Retail pet sales and inventory management
                  </Typography>
                </Box>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, bgcolor: alpha('#2196f3', 0.1), borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      {petsData.petshop.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Total Inventory</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, bgcolor: alpha('#2196f3', 0.1), borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight="bold" color="primary.dark">
                      {petsData.petshop.available}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Available</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, bgcolor: alpha('#2196f3', 0.1), borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      {petsData.petshop.sold}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Sold</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, bgcolor: alpha('#2196f3', 0.1), borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      ${petsData.petshop.revenue.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Revenue</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box mt={3}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<VisibilityIcon />}
                  onClick={() => navigate('/admin/pets/petshop/overview')}
                >
                  View Full Pet Shop Details
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  )
}

export default AllPetsOverview
