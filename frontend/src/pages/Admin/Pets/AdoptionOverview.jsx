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
  Favorite as AdoptionIcon,
  Visibility as ViewIcon,
  FileDownload as DownloadIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { petsAPI } from '../../../services/petSystemAPI'

const AdoptionOverview = () => {
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adoptionData, setAdoptionData] = useState({
    summary: {
      total: 0,
      adopted: 0,
      available: 0,
      reserved: 0,
      pending: 0,
      revenue: 0,
      avgAdoptionTime: 0,
      successRate: 0
    },
    recentAdoptions: [],
    availablePets: [],
    pendingApplications: [],
    monthlyStats: [],
    topBreeds: [],
    ageDistribution: []
  })

  useEffect(() => {
    loadAdoptionData()
  }, [])

  const loadAdoptionData = async () => {
    setLoading(true)
    try {
      const response = await petsAPI.getAdoptionOverview()
      if (response.data?.success) {
        setAdoptionData(response.data.data)
      }
    } catch (err) {
      setError('Failed to load adoption data')
      console.error('Adoption data error:', err)
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
            <AdoptionIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Adoption Overview
          </Typography>
        </Breadcrumbs>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              🏠 Adoption Center Overview
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Comprehensive analytics and management for pet adoption operations
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
              onClick={() => navigate('/admin/pets/adoption/reports')}
            >
              Export Data
            </Button>
            <Button
              variant="contained"
              startIcon={<AnalyticsIcon />}
              onClick={() => navigate('/admin/pets/adoption/analytics')}
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
            title="Total Pets"
            value={adoptionData.summary.total}
            subtitle="In adoption system"
            icon={AdoptionIcon}
            color="success.main"
            trend={8}
            onClick={() => navigate('/admin/pets/adoption/all')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Successfully Adopted"
            value={adoptionData.summary.adopted}
            subtitle={`${adoptionData.summary.successRate.toFixed(1)}% success rate`}
            icon={CheckCircleIcon}
            color="success.dark"
            trend={15}
            onClick={() => navigate('/admin/pets/adoption/adopted')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Available Now"
            value={adoptionData.summary.available}
            subtitle="Ready for adoption"
            icon={PetsIcon}
            color="info.main"
            onClick={() => navigate('/admin/pets/adoption/available')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`$${adoptionData.summary.revenue.toLocaleString()}`}
            subtitle="Adoption fees collected"
            icon={MoneyIcon}
            color="success.main"
            trend={22}
            onClick={() => navigate('/admin/pets/adoption/revenue')}
          />
        </Grid>
      </Grid>

      {/* Performance Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Performance Metrics
              </Typography>
              <Stack spacing={3}>
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">Average Adoption Time</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {adoptionData.summary.avgAdoptionTime} days
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min((30 - adoptionData.summary.avgAdoptionTime) / 30 * 100, 100)} 
                    color="success"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Target: Under 21 days
                  </Typography>
                </Box>
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">Success Rate</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {adoptionData.summary.successRate.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={adoptionData.summary.successRate} 
                    color="success"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Industry average: 75%
                  </Typography>
                </Box>
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">Pending Applications</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {adoptionData.summary.pending}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(adoptionData.summary.pending / 20 * 100, 100)} 
                    color="warning"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Requires attention if over 20
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
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate('/admin/pets')}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Back to Pet Management Dashboard
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PetsIcon />}
                  onClick={() => navigate('/admin/pets/overview')}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  View All Pets (Adoption + Pet Shop)
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => navigate('/admin/pets/petshop/overview')}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  View Pet Shop Overview
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AnalyticsIcon />}
                  onClick={() => navigate('/admin/pets/blockchain/explorer')}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Blockchain Explorer
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Adoptions */}
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Recent Successful Adoptions
      </Typography>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pet</TableCell>
                  <TableCell>Adopter</TableCell>
                  <TableCell>Adoption Date</TableCell>
                  <TableCell>Fee</TableCell>
                  <TableCell>Days in System</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {adoptionData.recentAdoptions.slice(0, 10).map((adoption) => (
                  <TableRow key={adoption.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <PetsIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {adoption.petName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {adoption.petCode} • {adoption.breed}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {adoption.adopterName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CalendarIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {new Date(adoption.adoptionDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        ${adoption.adoptionFee}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {adoption.daysInSystem} days
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label="Completed" 
                        size="small" 
                        color="success"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small"
                          onClick={() => navigate(`/admin/pets/adoption/details/${adoption.id}`)}
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
              onClick={() => navigate('/admin/pets/adoption/adopted')}
            >
              View All Adoptions
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Available Pets */}
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Currently Available for Adoption
      </Typography>
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pet</TableCell>
                  <TableCell>Age</TableCell>
                  <TableCell>Days Available</TableCell>
                  <TableCell>Adoption Fee</TableCell>
                  <TableCell>Interest Level</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {adoptionData.availablePets.slice(0, 10).map((pet) => (
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
                      <Typography variant="body2">
                        {pet.daysAvailable} days
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        ${pet.adoptionFee}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress 
                          variant="determinate" 
                          value={pet.interestLevel} 
                          sx={{ width: 60, height: 6 }}
                        />
                        <Typography variant="caption">
                          {pet.interestLevel}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label="Available" 
                        size="small" 
                        color="success"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small"
                          onClick={() => navigate(`/admin/pets/adoption/pet/${pet.id}`)}
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
              onClick={() => navigate('/admin/pets/adoption/available')}
            >
              View All Available Pets
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

export default AdoptionOverview