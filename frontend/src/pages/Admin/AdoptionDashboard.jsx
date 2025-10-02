import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  LinearProgress
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Pets as PetsIcon,
  People as PeopleIcon,
  AccountCircle as ManagerIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AnalyticsIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../services/api'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

const AdoptionDashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState({
    overview: {},
    monthlyStats: [],
    managerStats: [],
    recentApplications: [],
    topBreeds: [],
    quickStats: {}
  })

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError('')

      const [
        overviewRes,
        managerRes,
        adoptionsRes,
        analyticsRes
      ] = await Promise.all([
        apiClient.get('/adoption/admin/stats'),
        apiClient.get('/adoption/admin/manager-analytics'),
        apiClient.get('/adoption/admin/adoptions', { params: { limit: 5 } }),
        apiClient.get('/adoption/admin/analytics')
      ])

      setData({
        overview: overviewRes.data.data.overview || {},
        monthlyStats: overviewRes.data.data.monthlyStats || [],
        managerStats: managerRes.data.data.managerStats?.slice(0, 5) || [],
        recentApplications: adoptionsRes.data.data.adoptions || [],
        topBreeds: analyticsRes.data.data.breedStats?.slice(0, 5) || [],
        quickStats: {
          totalManagers: managerRes.data.data.managerStats?.length || 0,
          avgAdoptionRate: managerRes.data.data.managerStats?.length > 0 
            ? (managerRes.data.data.managerStats.reduce((sum, m) => sum + parseFloat(m.adoptionRate), 0) / managerRes.data.data.managerStats.length).toFixed(1)
            : 0
        }
      })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const formatMonthlyData = (monthlyStats) => {
    return monthlyStats.map(stat => ({
      month: `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}`,
      adoptions: stat.count,
      revenue: stat.revenue || 0
    }))
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'warning'
      case 'approved': return 'success'
      case 'rejected': return 'error'
      case 'completed': return 'primary'
      default: return 'default'
    }
  }

  const QuickStatsCards = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' }
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {data.overview.totalPets || 0}
                </Typography>
                <Typography variant="body2">Total Pets</Typography>
              </Box>
              <PetsIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ 
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
          color: 'white',
          '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' }
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {data.overview.adoptedPets || 0}
                </Typography>
                <Typography variant="body2">Adopted Pets</Typography>
              </Box>
              <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ 
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
          color: 'white',
          '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' }
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {data.quickStats.totalManagers}
                </Typography>
                <Typography variant="body2">Active Managers</Typography>
              </Box>
              <ManagerIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ 
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', 
          color: 'white',
          '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' }
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {formatCurrency(data.overview.totalRevenue || 0)}
                </Typography>
                <Typography variant="body2">Total Revenue</Typography>
              </Box>
              <MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )

  const QuickActionsCard = () => (
    <Card sx={{ mb: 4 }}>
      <CardHeader 
        title="Quick Actions" 
        subheader="Manage adoption system components"
        action={
          <Tooltip title="Refresh Data">
            <IconButton onClick={loadDashboardData}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AnalyticsIcon />}
              onClick={() => navigate('/admin/adoption-analytics')}
              sx={{ py: 1.5 }}
            >
              View Full Analytics
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => navigate('/admin/adoption-management')}
              sx={{ py: 1.5 }}
            >
              Manage Adoptions
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<PeopleIcon />}
              onClick={() => navigate('/admin/managers')}
              sx={{ py: 1.5 }}
            >
              Manage Managers
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<PetsIcon />}
              onClick={() => navigate('/admin/pets')}
              sx={{ py: 1.5 }}
            >
              Manage Pets
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )

  const MonthlyTrendsChart = () => (
    <Card sx={{ mb: 4 }}>
      <CardHeader 
        title="Monthly Adoption Trends" 
        subheader="Adoptions and revenue over the last 6 months"
      />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={formatMonthlyData(data.monthlyStats)}>
            <defs>
              <linearGradient id="colorAdoptions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <RechartsTooltip />
            <Legend />
            <Area yAxisId="left" type="monotone" dataKey="adoptions" stroke="#8884d8" fillOpacity={1} fill="url(#colorAdoptions)" name="Adoptions" />
            <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (₹)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )

  const ManagerPerformanceCard = () => (
    <Card>
      <CardHeader 
        title="Top Performing Managers" 
        subheader="Manager performance overview"
        action={
          <Button 
            size="small" 
            onClick={() => navigate('/admin/adoption-analytics')}
            endIcon={<ViewIcon />}
          >
            View All
          </Button>
        }
      />
      <CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Manager</TableCell>
                <TableCell align="right">Pets Added</TableCell>
                <TableCell align="right">Adopted</TableCell>
                <TableCell align="right">Success Rate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.managerStats.map((manager) => (
                <TableRow key={manager.managerId}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        {manager.managerName.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {manager.managerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {manager.managerEmail}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">{manager.petsAdded}</TableCell>
                  <TableCell align="right">{manager.petsAdopted}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={parseFloat(manager.adoptionRate)} 
                        sx={{ width: 50, height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption">
                        {manager.adoptionRate}%
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )

  const RecentApplicationsCard = () => (
    <Card>
      <CardHeader 
        title="Recent Applications" 
        subheader="Latest adoption applications"
        action={
          <Button 
            size="small" 
            onClick={() => navigate('/admin/adoption-management')}
            endIcon={<ViewIcon />}
          >
            View All
          </Button>
        }
      />
      <CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Applicant</TableCell>
                <TableCell>Pet</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.recentApplications.map((application) => (
                <TableRow key={application._id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {application.userId?.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {application.userId?.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {application.petId?.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {application.petId?.breed}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={application.status} 
                      color={getStatusColor(application.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )

  const PopularBreedsCard = () => (
    <Card>
      <CardHeader 
        title="Popular Breeds" 
        subheader="Most adopted pet breeds"
      />
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.topBreeds}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" />
            <YAxis />
            <RechartsTooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" action={
          <IconButton color="inherit" size="small" onClick={loadDashboardData}>
            <RefreshIcon />
          </IconButton>
        }>
          {error}
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Adoption Management Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Monitor adoption system performance and manage operations
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Dashboard">
            <IconButton onClick={loadDashboardData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AnalyticsIcon />}
            onClick={() => navigate('/admin/adoption-analytics')}
          >
            Full Analytics
          </Button>
        </Box>
      </Box>

      <QuickStatsCards />
      <QuickActionsCard />
      <MonthlyTrendsChart />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <ManagerPerformanceCard />
        </Grid>
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <RecentApplicationsCard />
            <PopularBreedsCard />
          </Box>
        </Grid>
      </Grid>
    </Container>
  )
}

export default AdoptionDashboard
