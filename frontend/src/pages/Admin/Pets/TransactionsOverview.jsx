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
} from '@mui/material'
import {
  Schedule as ScheduleIcon,
  Dashboard as DashboardIcon,
  Pets as PetsIcon,
  NavigateNext as NavigateNextIcon,
  Pending as PendingIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { petsAPI } from '../../../services/petSystemAPI'

const TransactionsOverview = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState({
    adoption: { reserved: 0, pending: 0 },
    petshop: { reserved: 0, pending: 0 },
    total: 0
  })

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const response = await petsAPI.getStats()
      if (response.data?.success) {
        const stats = response.data.data
        setTransactions({
          adoption: {
            reserved: stats.adoption.reserved || 0,
            pending: stats.adoption.pending || 0
          },
          petshop: {
            reserved: stats.petshop.reserved || 0,
            pending: stats.petshop.pending || 0
          },
          total: (stats.adoption.reserved || 0) + (stats.petshop.reserved || 0)
        })
      }
    } catch (err) {
      console.error('Failed to load transactions:', err)
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
            <ScheduleIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Active Transactions
          </Typography>
        </Breadcrumbs>
        
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          ⏱️ Active Transactions
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Monitor pending and reserved pet transactions
        </Typography>
      </Box>

      {/* Total Active Card */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
        <CardContent sx={{ p: 4 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <ScheduleIcon sx={{ fontSize: 48 }} />
            <Box>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Active Transactions
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 'bold' }}>
                {transactions.total}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <PendingIcon />
            <Typography variant="body1">
              Pending operations across all systems
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>System</TableCell>
                <TableCell align="center">Reserved</TableCell>
                <TableCell align="center">Pending Applications</TableCell>
                <TableCell align="center">Total Active</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip label="Adoption" color="success" size="small" />
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="h6" fontWeight="bold">
                    {transactions.adoption.reserved}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="h6" fontWeight="bold">
                    {transactions.adoption.pending}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {transactions.adoption.reserved + transactions.adoption.pending}
                  </Typography>
                </TableCell>
              </TableRow>
              <TableRow hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip label="Pet Shop" color="primary" size="small" />
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="h6" fontWeight="bold">
                    {transactions.petshop.reserved}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="h6" fontWeight="bold">
                    {transactions.petshop.pending}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="h6" fontWeight="bold" color="primary.main">
                    {transactions.petshop.reserved + transactions.petshop.pending}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  )
}

export default TransactionsOverview
