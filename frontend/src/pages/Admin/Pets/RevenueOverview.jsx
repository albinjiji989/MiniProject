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
  Divider,
} from '@mui/material'
import {
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Dashboard as DashboardIcon,
  Pets as PetsIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { petsAPI } from '../../../services/petSystemAPI'

const RevenueOverview = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [revenueData, setRevenueData] = useState({
    adoption: { revenue: 0, count: 0 },
    petshop: { revenue: 0, count: 0 },
    total: 0
  })

  useEffect(() => {
    loadRevenueData()
  }, [])

  const loadRevenueData = async () => {
    setLoading(true)
    try {
      const response = await petsAPI.getStats()
      if (response.data?.success) {
        const stats = response.data.data
        setRevenueData({
          adoption: {
            revenue: stats.adoption.revenue || 0,
            count: stats.adoption.adopted || 0
          },
          petshop: {
            revenue: stats.petshop.revenue || 0,
            count: stats.petshop.sold || 0
          },
          total: (stats.adoption.revenue || 0) + (stats.petshop.revenue || 0)
        })
      }
    } catch (err) {
      console.error('Failed to load revenue data:', err)
    } finally {
      setLoading(false)
    }
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
            Pets
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
            <MoneyIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Revenue Overview
          </Typography>
        </Breadcrumbs>
        
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          💰 Revenue Overview
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Track revenue across adoption and pet shop operations
        </Typography>
      </Box>

      {/* Total Revenue Card */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
        <CardContent sx={{ p: 4 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <MoneyIcon sx={{ fontSize: 48 }} />
            <Box>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Total Revenue
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 'bold' }}>
                ${revenueData.total.toLocaleString()}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <TrendingUpIcon />
            <Typography variant="body1">
              All-time earnings from pet operations
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'success.main' }}>
              Adoption Revenue
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                ${revenueData.adoption.revenue.toLocaleString()}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                From {revenueData.adoption.count} successful adoptions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Average per adoption: ${revenueData.adoption.count > 0 
                  ? (revenueData.adoption.revenue / revenueData.adoption.count).toFixed(2)
                  : '0.00'}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Pet Shop Revenue
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                ${revenueData.petshop.revenue.toLocaleString()}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                From {revenueData.petshop.count} pet sales
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Average per sale: ${revenueData.petshop.count > 0 
                  ? (revenueData.petshop.revenue / revenueData.petshop.count).toFixed(2)
                  : '0.00'}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default RevenueOverview
