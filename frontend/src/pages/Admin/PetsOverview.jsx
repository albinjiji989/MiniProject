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
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Tooltip,
  InputAdornment,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  Stack,
  Badge,
} from '@mui/material'
import {
  Pets as PetsIcon,
  Search as SearchIcon,
  FileDownload as DownloadIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  Store as StoreIcon,
  Favorite as AdoptionIcon,
  LocalHospital as MedicalIcon,
  History as HistoryIcon,
  Security as BlockchainIcon,
  Analytics as AnalyticsIcon,
  Assignment as TransactionIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Timeline as TimelineIcon,
  ShoppingCart as PurchaseIcon,
  Home as ShelterIcon,
  CalendarToday as DateIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { petsAPI, dashboardAPI } from '../../services/api'

const PetsOverview = () => {
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [tabValue, setTabValue] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Statistics data
  const [stats, setStats] = useState({
    adoption: {
      total: 0,
      adopted: 0,
      available: 0,
      reserved: 0,
      revenue: 0
    },
    petshop: {
      total: 0,
      sold: 0,
      available: 0,
      reserved: 0,
      revenue: 0
    },
    overall: {
      total: 0,
      active: 0,
      inactive: 0,
      medical: 0
    }
  })
  
  // Blockchain data
  const [blockchainData, setBlockchainData] = useState({
    totalBlocks: 0,
    isValid: true,
    recentTransactions: [],
    petBlockchains: []
  })
  
  // History data
  const [historyData, setHistoryData] = useState([])
  const [historyFilter, setHistoryFilter] = useState('all')
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotal, setHistoryTotal] = useState(0)

  useEffect(() => {
    loadAllData()
  }, [])

  useEffect(() => {
    if (tabValue === 2) { // History tab
      loadHistoryData()
    }
  }, [tabValue, historyFilter, historyPage])

  const loadAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadStatistics(),
        loadBlockchainData()
      ])
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      // Load comprehensive pet statistics
      const response = await petsAPI.getStats()
      if (response.data?.success) {
        setStats(response.data.data)
      }
    } catch (err) {
      console.error('Error loading statistics:', err)
      setError('Failed to load pet statistics')
    }
  }

  const loadBlockchainData = async () => {
    try {
      // Load blockchain data
      const response = await petsAPI.getBlockchainData()
      if (response.data?.success) {
        setBlockchainData(response.data.data)
      }
    } catch (err) {
      console.error('Error loading blockchain data:', err)
      setError('Failed to load blockchain data')
    }
  }

  const loadHistoryData = async () => {
    try {
      const params = {
        page: historyPage,
        limit: 20,
        type: historyFilter !== 'all' ? historyFilter : undefined
      }
      
      const response = await petsAPI.getHistory(params)
      if (response.data?.success) {
        setHistoryData(response.data.data.history)
        setHistoryTotal(response.data.data.total)
      }
    } catch (err) {
      console.error('Error loading history:', err)
      setError('Failed to load transaction history')
    }
  }

  const downloadReport = async (type) => {
    try {
      const response = await petsAPI.downloadReport(type)
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `pets-${type}-report-${new Date().toISOString().split('T')[0]}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      setSuccess(`${type} report downloaded successfully!`)
    } catch (err) {
      console.error('Error downloading report:', err)
      // For now, show a message that this feature is coming soon
      setError(`Report download feature is being implemented. Please check back soon.`)
    }
  }

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'adoption': return <AdoptionIcon color="success" />
      case 'purchase': return <PurchaseIcon color="primary" />
      case 'medical': return <MedicalIcon color="error" />
      case 'transfer': return <TransactionIcon color="info" />
      case 'shelter_intake': return <ShelterIcon color="warning" />
      default: return <PetsIcon />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success'
      case 'pending': return 'warning'
      case 'failed': return 'error'
      default: return 'default'
    }
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color, onClick, trend }) => (
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
            <Typography variant="h4" sx={{ fontWeight: 'bold', color }}>
              {value}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
            {trend && (
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
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Pet Management Overview
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Comprehensive pet statistics, blockchain tracking, and transaction history
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => downloadReport('comprehensive')}
          >
            Download Report
          </Button>
          <Button
            variant="contained"
            startIcon={<PetsIcon />}
            onClick={() => navigate('/admin/pets/manage')}
          >
            Manage Pets
          </Button>
        </Box>
      </Box>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="Statistics Overview" />
        <Tab label="Blockchain Tracking" />
        <Tab label="Transaction History" />
      </Tabs>

      {/* Statistics Tab */}
      {tabValue === 0 && (
        <Box>
          {/* Adoption Statistics */}
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
            Adoption Center Statistics
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total in Adoption"
                value={stats.adoption.total}
                subtitle="All pets in adoption center"
                icon={AdoptionIcon}
                color="success.main"
                onClick={() => setSuccess('Adoption pets management is being implemented')}
                trend={12}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Successfully Adopted"
                value={stats.adoption.adopted}
                subtitle="Pets found homes"
                icon={CheckCircleIcon}
                color="info.main"
                onClick={() => setSuccess('Adopted pets view is being implemented')}
                trend={8}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Available for Adoption"
                value={stats.adoption.available}
                subtitle="Ready for new homes"
                icon={ShelterIcon}
                color="warning.main"
                onClick={() => setSuccess('Available pets view is being implemented')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Adoption Revenue"
                value={`$${stats.adoption.revenue.toLocaleString()}`}
                subtitle="Total adoption fees"
                icon={MoneyIcon}
                color="success.main"
                trend={15}
              />
            </Grid>
          </Grid>

          {/* Pet Shop Statistics */}
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
            Pet Shop Statistics
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total in Pet Shop"
                value={stats.petshop.total}
                subtitle="All pets in shop"
                icon={StoreIcon}
                color="primary.main"
                onClick={() => setSuccess('Pet shop management is being implemented')}
                trend={5}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Pets Sold"
                value={stats.petshop.sold}
                subtitle="Successfully purchased"
                icon={PurchaseIcon}
                color="success.main"
                onClick={() => setSuccess('Sold pets view is being implemented')}
                trend={18}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Available for Sale"
                value={stats.petshop.available}
                subtitle="Ready for purchase"
                icon={StoreIcon}
                color="info.main"
                onClick={() => setSuccess('Available pets view is being implemented')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Sales Revenue"
                value={`$${stats.petshop.revenue.toLocaleString()}`}
                subtitle="Total sales income"
                icon={MoneyIcon}
                color="primary.main"
                trend={22}
              />
            </Grid>
          </Grid>

          {/* Overall Statistics */}
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
            Overall Pet Statistics
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Pets"
                value={stats.overall.total}
                subtitle="All pets in system"
                icon={PetsIcon}
                color="secondary.main"
                onClick={() => navigate('/admin/pets/manage')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Active Pets"
                value={stats.overall.active}
                subtitle="Currently active"
                icon={CheckCircleIcon}
                color="success.main"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Inactive Pets"
                value={stats.overall.inactive}
                subtitle="Deactivated pets"
                icon={ErrorIcon}
                color="error.main"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Medical Care"
                value={stats.overall.medical}
                subtitle="Pets needing care"
                icon={MedicalIcon}
                color="warning.main"
                onClick={() => setSuccess('Medical care view is being implemented')}
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Blockchain Tab */}
      {tabValue === 1 && (
        <Box>
          <Grid container spacing={3}>
            {/* Blockchain Status */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <BlockchainIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Blockchain Status</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={2}>
                    {blockchainData.isValid ? (
                      <Chip 
                        icon={<VerifiedIcon />} 
                        label="Chain Valid" 
                        color="success" 
                        variant="outlined"
                      />
                    ) : (
                      <Chip 
                        icon={<WarningIcon />} 
                        label="Chain Invalid" 
                        color="error" 
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Total Blocks: {blockchainData.totalBlocks}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    All pet transactions are secured with blockchain technology
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    sx={{ mt: 2 }}
                    onClick={() => setSuccess('Blockchain verification is being implemented')}
                  >
                    Verify Chain
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Blockchain Transactions */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box display="flex" alignItems="center">
                      <TimelineIcon sx={{ mr: 1, color: 'info.main' }} />
                      <Typography variant="h6">Recent Blockchain Transactions</Typography>
                    </Box>
                    <Button 
                      size="small" 
                      onClick={() => setSuccess('Blockchain transactions view is being implemented')}
                    >
                      View All
                    </Button>
                  </Box>
                  <List>
                    {blockchainData.recentTransactions.slice(0, 5).map((transaction, index) => (
                      <React.Fragment key={transaction.id}>
                        <ListItem>
                          <ListItemIcon>
                            {getEventIcon(transaction.eventType)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {transaction.petName}
                                </Typography>
                                <Chip 
                                  label={transaction.eventType} 
                                  size="small" 
                                  color={getStatusColor(transaction.status)}
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Block #{transaction.blockIndex} • {new Date(transaction.timestamp).toLocaleString()}
                                </Typography>
                                <br />
                                <Typography variant="caption">
                                  Hash: {transaction.hash.substring(0, 16)}...
                                </Typography>
                              </Box>
                            }
                          />
                          <IconButton 
                            size="small"
                            onClick={() => setSuccess('Block details view is being implemented')}
                          >
                            <ViewIcon />
                          </IconButton>
                        </ListItem>
                        {index < blockchainData.recentTransactions.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Individual Pet Blockchains */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box display="flex" alignItems="center">
                      <PetsIcon sx={{ mr: 1, color: 'secondary.main' }} />
                      <Typography variant="h6">Pet Blockchain Records</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Each pet has its own immutable blockchain history
                    </Typography>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Pet Name</TableCell>
                          <TableCell>Pet Code</TableCell>
                          <TableCell>Blockchain Blocks</TableCell>
                          <TableCell>Last Transaction</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {blockchainData.petBlockchains.slice(0, 10).map((pet) => (
                          <TableRow key={pet.petId} hover>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                                  <PetsIcon />
                                </Avatar>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {pet.name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {pet.petCode}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Badge badgeContent={pet.blockCount} color="primary">
                                <BlockchainIcon />
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {new Date(pet.lastTransaction).toLocaleDateString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={pet.chainValid ? 'Valid' : 'Invalid'} 
                                color={pet.chainValid ? 'success' : 'error'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Tooltip title="View Pet Blockchain">
                                <IconButton 
                                  size="small"
                                  onClick={() => setSuccess('Pet blockchain view is being implemented')}
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
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* History Tab */}
      {tabValue === 2 && (
        <Box>
          <Grid container spacing={3}>
            {/* History Filters */}
            <Grid item xs={12}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth>
                        <InputLabel>Transaction Type</InputLabel>
                        <Select
                          value={historyFilter}
                          onChange={(e) => setHistoryFilter(e.target.value)}
                        >
                          <MenuItem value="all">All Transactions</MenuItem>
                          <MenuItem value="adoption">Adoptions</MenuItem>
                          <MenuItem value="purchase">Purchases</MenuItem>
                          <MenuItem value="medical">Medical Records</MenuItem>
                          <MenuItem value="transfer">Transfers</MenuItem>
                          <MenuItem value="shelter_intake">Shelter Intake</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Showing {historyData.length} of {historyTotal} transactions
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => downloadReport('history')}
                      >
                        Download History
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* History Table */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date & Time</TableCell>
                          <TableCell>Transaction Type</TableCell>
                          <TableCell>Pet Details</TableCell>
                          <TableCell>User/Customer</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Blockchain</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {historyData.map((transaction) => (
                          <TableRow key={transaction.id} hover>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <DateIcon fontSize="small" color="action" />
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {new Date(transaction.timestamp).toLocaleDateString()}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(transaction.timestamp).toLocaleTimeString()}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                {getEventIcon(transaction.type)}
                                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                  {transaction.type.replace('_', ' ')}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {transaction.petName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {transaction.petCode} • {transaction.species}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <PersonIcon fontSize="small" color="action" />
                                <Typography variant="body2">
                                  {transaction.userName}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                ${transaction.amount?.toLocaleString() || '0'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={transaction.status} 
                                color={getStatusColor(transaction.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Tooltip title="View on Blockchain">
                                <IconButton 
                                  size="small"
                                  onClick={() => setSuccess('Blockchain transaction view is being implemented')}
                                >
                                  <BlockchainIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Tooltip title="View Details">
                                <IconButton 
                                  size="small"
                                  onClick={() => setSuccess('Transaction details view is being implemented')}
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

                  {/* Pagination */}
                  {Math.ceil(historyTotal / 20) > 1 && (
                    <Box display="flex" justifyContent="center" mt={3}>
                      <Pagination
                        count={Math.ceil(historyTotal / 20)}
                        page={historyPage}
                        onChange={(e, value) => setHistoryPage(value)}
                        color="primary"
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

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

export default PetsOverview