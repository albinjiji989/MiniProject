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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  Pets as PetsIcon,
  People as PeopleIcon,
  AccountCircle as ManagerIcon,
  AttachMoney as MoneyIcon,
  Assessment as AnalyticsIcon,
  Refresh as RefreshIcon
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
import { apiClient } from '../../services/api'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

const AdoptionAnalytics = () => {
  const [tabValue, setTabValue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState({
    overview: {},
    monthlyStats: [],
    managerStats: [],
    userAnalytics: {},
    petAnalytics: {},
    generalAnalytics: {}
  })

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError('')

      const [
        overviewRes,
        managerRes,
        userRes,
        petRes,
        generalRes
      ] = await Promise.all([
        apiClient.get('/adoption/admin/stats'),
        apiClient.get('/adoption/admin/manager-analytics'),
        apiClient.get('/adoption/admin/user-analytics'),
        apiClient.get('/adoption/admin/pet-analytics'),
        apiClient.get('/adoption/admin/analytics')
      ])

      setData({
        overview: overviewRes.data.data.overview || {},
        monthlyStats: overviewRes.data.data.monthlyStats || [],
        managerStats: managerRes.data.data.managerStats || [],
        userAnalytics: userRes.data.data || {},
        petAnalytics: petRes.data.data || {},
        generalAnalytics: generalRes.data.data || {}
      })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

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

  const OverviewCards = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
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
        <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
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
        <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {data.overview.totalApplications || 0}
                </Typography>
                <Typography variant="body2">Applications</Typography>
              </Box>
              <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
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

  const MonthlyTrendsChart = () => (
    <Card sx={{ mb: 4 }}>
      <CardHeader 
        title="Monthly Adoption Trends" 
        subheader="Adoptions and revenue over time"
      />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formatMonthlyData(data.monthlyStats)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <RechartsTooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="adoptions" fill="#8884d8" name="Adoptions" />
            <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue (₹)" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )

  const ManagerPerformanceTable = () => (
    <Card>
      <CardHeader 
        title="Manager Performance" 
        subheader="Adoption manager statistics and performance metrics"
      />
      <CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Manager</TableCell>
                <TableCell align="right">Pets Added</TableCell>
                <TableCell align="right">Pets Adopted</TableCell>
                <TableCell align="right">Applications Reviewed</TableCell>
                <TableCell align="right">Revenue Generated</TableCell>
                <TableCell align="right">Adoption Rate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.managerStats.map((manager) => (
                <TableRow key={manager.managerId}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {manager.managerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {manager.managerEmail}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">{manager.petsAdded}</TableCell>
                  <TableCell align="right">{manager.petsAdopted}</TableCell>
                  <TableCell align="right">{manager.applicationsReviewed}</TableCell>
                  <TableCell align="right">{formatCurrency(manager.revenueGenerated)}</TableCell>
                  <TableCell align="right">
                    <Chip 
                      label={`${manager.adoptionRate}%`}
                      color={manager.adoptionRate > 50 ? 'success' : manager.adoptionRate > 25 ? 'warning' : 'error'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )

  const UserAnalyticsCharts = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Top Adopters" subheader="Users with most adoptions" />
          <CardContent>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell align="right">Adoptions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.userAnalytics.topAdopters?.slice(0, 5).map((adopter) => (
                    <TableRow key={adopter.userId}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{adopter.userName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {adopter.userEmail}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={adopter.adoptionCount} color="primary" size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Application Status" subheader="Distribution of application statuses" />
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.userAnalytics.applicationStatusStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="_id"
                >
                  {data.userAnalytics.applicationStatusStats?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )

  const PetAnalyticsCharts = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Species Distribution" subheader="Pet species breakdown" />
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.petAnalytics.speciesStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Health Status" subheader="Pet health status distribution" />
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.petAnalytics.healthStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="_id"
                >
                  {data.petAnalytics.healthStats?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title="Adoption Time Statistics" subheader="Average time to adoption metrics" />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {Math.round(data.petAnalytics.adoptionTimeStats?.avgDaysToAdoption || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Days to Adoption
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {Math.round(data.petAnalytics.adoptionTimeStats?.minDaysToAdoption || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fastest Adoption (Days)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Typography variant="h4" color="warning.main">
                    {Math.round(data.petAnalytics.adoptionTimeStats?.maxDaysToAdoption || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Longest Adoption (Days)
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )

  const GeneralAnalyticsCharts = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Popular Breeds" subheader="Most adopted pet breeds" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.generalAnalytics.breedStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title="Age Group Distribution" subheader="Adopted pets by age group" />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.generalAnalytics.ageStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="_id"
                >
                  {data.generalAnalytics.ageStats?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
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
          <IconButton color="inherit" size="small" onClick={loadAnalytics}>
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
            Adoption Analytics
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Comprehensive insights into adoption performance and trends
          </Typography>
        </Box>
        <Tooltip title="Refresh Data">
          <IconButton onClick={loadAnalytics} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <OverviewCards />

      <Paper sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Overview" icon={<AnalyticsIcon />} />
          <Tab label="Managers" icon={<ManagerIcon />} />
          <Tab label="Users" icon={<PeopleIcon />} />
          <Tab label="Pets" icon={<PetsIcon />} />
          <Tab label="Trends" icon={<TrendingUpIcon />} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <Box>
              <MonthlyTrendsChart />
              <GeneralAnalyticsCharts />
            </Box>
          )}
          {tabValue === 1 && <ManagerPerformanceTable />}
          {tabValue === 2 && <UserAnalyticsCharts />}
          {tabValue === 3 && <PetAnalyticsCharts />}
          {tabValue === 4 && <MonthlyTrendsChart />}
        </Box>
      </Paper>
    </Container>
  )
}

export default AdoptionAnalytics
