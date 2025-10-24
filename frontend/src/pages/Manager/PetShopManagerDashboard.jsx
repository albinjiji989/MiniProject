import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  Tooltip,
  Avatar
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  ShoppingCart as OrdersIcon,
  BookOnline as ReservationsIcon,
  Receipt as InvoiceIcon,
  LocalShipping as DeliveryIcon,
  TrendingUp as SalesIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material'
import { petShopManagerAPI, apiClient } from '../../services/api'
import InvoiceTemplate from '../../components/PetShop/InvoiceTemplate'
import { resolveMediaUrl } from '../../services/api'

const PetShopManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({})
  const [reservations, setReservations] = useState([])
  const [orders, setOrders] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [statusUpdate, setStatusUpdate] = useState('')
  const [invoiceData, setInvoiceData] = useState(null)
  const [showInvoice, setShowInvoice] = useState(false)

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, reservationsRes] = await Promise.all([
        petShopManagerAPI.getStats(),
        petShopManagerAPI.listReservations()
      ])
      
      setStats(statsRes.data.data || {})
      setReservations(reservationsRes.data.data.reservations || [])
      
      // Filter orders and deliveries from reservations
      const paidReservations = reservationsRes.data.data.reservations.filter(r => 
        ['paid', 'ready_pickup', 'delivered', 'at_owner'].includes(r.status)
      )
      setOrders(paidReservations)
      
      const deliveryItems = reservationsRes.data.data.reservations.filter(r => 
        ['paid', 'ready_pickup', 'delivered'].includes(r.status)
      )
      setDeliveries(deliveryItems)
      
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const handleStatusUpdate = async (reservationId, newStatus, notes = '') => {
    try {
      await apiClient.put(`/petshop/manager/reservations/${reservationId}`, {
        status: newStatus,
        notes
      })
      await loadDashboardData()
      setDialogOpen(false)
      setSelectedItem(null)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to update status')
    }
  }

  const handleDeliveryUpdate = async (reservationId, deliveryStatus, deliveryNotes = '') => {
    try {
      await petShopManagerAPI.updateDeliveryStatus(reservationId, deliveryStatus, deliveryNotes)
      await loadDashboardData()
      setDialogOpen(false)
      setSelectedItem(null)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to update delivery')
    }
  }

  const generateInvoice = async (reservationId) => {
    try {
      const response = await petShopManagerAPI.generateInvoice(reservationId)
      setInvoiceData(response.data.data.invoice)
      setShowInvoice(true)
    } catch (e) {
      setError('Failed to generate invoice')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'approved': return 'info'
      case 'rejected': return 'error'
      case 'going_to_buy': return 'primary'
      case 'payment_pending': return 'warning'
      case 'paid': return 'success'
      case 'ready_pickup': return 'info'
      case 'delivered': return 'success'
      case 'at_owner': return 'success'
      default: return 'default'
    }
  }

  const buildImageUrl = (url) => {
    if (!url) return '/placeholder-pet.svg'
    // Support base64 data URLs
    if (/^data:image\//i.test(url)) return url
    // If absolute URL, return directly
    if (/^https?:\/\//i.test(url)) return url
    // If relative (like /modules/petshop/uploads/...), prefix backend origin
    return resolveMediaUrl(url)
  }

  const renderDashboardOverview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <ReservationsIcon color="primary" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h4">{stats.totalReservations || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Total Reservations</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <OrdersIcon color="success" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h4">{orders.length}</Typography>
                <Typography variant="body2" color="text.secondary">Paid Orders</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <SalesIcon color="info" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h4">₹{stats.totalRevenue || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <DeliveryIcon color="warning" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h4">{deliveries.filter(d => d.status === 'ready_pickup').length}</Typography>
                <Typography variant="body2" color="text.secondary">Pending Deliveries</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Gender Statistics */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Inventory by Gender</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography>Male</Typography>
                  <Typography variant="h5" color="primary">{stats.genderStats?.Male || 0}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography>Female</Typography>
                  <Typography variant="h5" color="secondary">{stats.genderStats?.Female || 0}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography>Unknown</Typography>
                  <Typography variant="h5" color="text.secondary">{stats.genderStats?.Unknown || 0}</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )

  const renderReservationsTab = () => (
    <Paper sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Reservation ID</TableCell>
            <TableCell>Pet</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reservations.map((reservation) => (
            <TableRow key={reservation._id}>
              <TableCell>#{reservation.reservationCode || reservation._id.slice(-6)}</TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {reservation.itemId?.name || 'Pet Name'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {reservation.itemId?.petCode}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {reservation.userId?.name || 'Customer'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {reservation.userId?.email}
                </Typography>
              </TableCell>
              <TableCell>₹{reservation.itemId?.price?.toLocaleString() || 0}</TableCell>
              <TableCell>
                <Chip 
                  label={reservation.status} 
                  color={getStatusColor(reservation.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>{new Date(reservation.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <Tooltip title="View Details">
                  <IconButton 
                    size="small"
                    onClick={() => {
                      setSelectedItem(reservation)
                      setDialogOpen(true)
                    }}
                  >
                    <ViewIcon />
                  </IconButton>
                </Tooltip>
                {reservation.status === 'pending' && (
                  <Tooltip title="Approve/Reject">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => {
                        setSelectedItem(reservation)
                        setStatusUpdate('approved')
                        setDialogOpen(true)
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )

  const renderOrdersTab = () => (
    <Paper sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Order ID</TableCell>
            <TableCell>Pet</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Payment Status</TableCell>
            <TableCell>Order Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order._id}>
              <TableCell>#{order.reservationCode || order._id.slice(-6)}</TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {order.itemId?.name || 'Pet Name'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {order.itemId?.petCode}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {order.userId?.name || 'Customer'}
                </Typography>
              </TableCell>
              <TableCell>₹{order.paymentDetails?.amount?.toLocaleString() || 0}</TableCell>
              <TableCell>
                <Chip 
                  label={order.paymentDetails?.status || 'Pending'} 
                  color="success"
                  size="small"
                />
              </TableCell>
              <TableCell>{new Date(order.paymentDetails?.paidAt || order.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <Tooltip title="Generate Invoice">
                  <IconButton 
                    size="small"
                    onClick={() => generateInvoice(order._id)}
                  >
                    <PrintIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download Receipt">
                  <IconButton size="small">
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )

  const renderDeliveryTab = () => (
    <Paper sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Order ID</TableCell>
            <TableCell>Pet</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Delivery Method</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {deliveries.map((delivery) => (
            <TableRow key={delivery._id}>
              <TableCell>#{delivery.reservationCode || delivery._id.slice(-6)}</TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight="bold">
                  {delivery.itemId?.name || 'Pet Name'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {delivery.userId?.name || 'Customer'}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip 
                  label={delivery.paymentDetails?.deliveryMethod || 'visit'} 
                  variant="outlined"
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Chip 
                  label={delivery.status} 
                  color={getStatusColor(delivery.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {delivery.status === 'paid' && (
                  <Button 
                    size="small" 
                    variant="contained"
                    onClick={() => handleDeliveryUpdate(delivery._id, 'ready_pickup')}
                  >
                    Mark Ready
                  </Button>
                )}
                {delivery.status === 'ready_pickup' && (
                  <Button 
                    size="small" 
                    variant="contained" 
                    color="success"
                    onClick={() => handleDeliveryUpdate(delivery._id, 'completed')}
                  >
                    Mark Completed
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )

  const renderRecentDeliveries = () => {
    const recentDeliveries = deliveries.filter(d => d.status === 'completed').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Recent Deliveries
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Pet</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentDeliveries.slice(0, 5).map((delivery) => (
              <TableRow key={delivery._id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar 
                      src={buildImageUrl(delivery.itemId?.images?.[0]?.url)} 
                      sx={{ width: 40, height: 40, mr: 1 }}
                    />
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {delivery.itemId?.name || 'Pet'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {delivery.itemId?.petCode}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{delivery.userId?.name || 'Customer'}</Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={delivery.status} 
                    color={getStatusColor(delivery.status)}
                    size="small"
                  />
                  {delivery.handover?.status && (
                    <Chip 
                      label={delivery.handover.status}
                      color={getStatusColor(delivery.handover.status)}
                      size="small"
                      variant="outlined"
                      sx={{ ml: 1 }}
                    />
                  )}
                </TableCell>
                <TableCell>
                  {delivery.status === 'paid' && (
                    <Button 
                      size="small" 
                      variant="contained"
                      onClick={() => handleDeliveryUpdate(delivery._id, 'ready_pickup')}
                    >
                      Mark Ready
                    </Button>
                  )}
                  {delivery.status === 'ready_pickup' && (
                    <>
                      <Button 
                        size="small" 
                        variant="contained"
                        color="info"
                        onClick={() => navigate(`/manager/petshop/handover/${delivery._id}`)}
                        startIcon={<AssignmentIcon />}
                        sx={{ mr: 1 }}
                      >
                        Manage Handover
                      </Button>
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="success"
                        onClick={() => handleDeliveryUpdate(delivery._id, 'completed')}
                      >
                        Mark Completed
                      </Button>
                    </>
                  )}
                  {delivery.status === 'completed' && (
                    <Button 
                      size="small" 
                      variant="contained"
                      color="primary"
                      onClick={() => navigate(`/manager/petshop/handover/${delivery._id}`)}
                      startIcon={<AssignmentIcon />}
                    >
                      View Handover
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    )
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center' }}>
        <DashboardIcon sx={{ mr: 2 }} />
        PetShop Manager Dashboard
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Dashboard Overview */}
      {renderDashboardOverview()}

      {/* Tabs for different sections */}
      <Box sx={{ mt: 4 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab icon={<ReservationsIcon />} label="Reservations" />
          <Tab icon={<OrdersIcon />} label="Orders & Sales" />
          <Tab icon={<DeliveryIcon />} label="Delivery Management" />
          <Tab icon={<InvoiceIcon />} label="Invoices & Reports" />
        </Tabs>

        {activeTab === 0 && renderReservationsTab()}
        {activeTab === 1 && renderOrdersTab()}
        {activeTab === 2 && renderDeliveryTab()}
        {activeTab === 3 && (
          <Paper sx={{ mt: 2, p: 3 }}>
            <Typography variant="h6" gutterBottom>Invoices & Reports</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Recent Invoices</Typography>
                    {orders.slice(0, 5).map((order) => (
                      <Box key={order._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                        <Box>
                          <Typography variant="body2">#{order.reservationCode || order._id.slice(-6)}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {order.itemId?.name} - ₹{order.paymentDetails?.amount?.toLocaleString()}
                          </Typography>
                        </Box>
                        <Button size="small" onClick={() => generateInvoice(order._id)}>View</Button>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Sales Summary</Typography>
                    <Typography variant="body2">Total Sales: ₹{stats.totalRevenue?.toLocaleString() || 0}</Typography>
                    <Typography variant="body2">Total Orders: {orders.length}</Typography>
                    <Typography variant="body2">Average Order Value: ₹{orders.length ? Math.round(stats.totalRevenue / orders.length).toLocaleString() : 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Box>

      {/* Status Update Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Reservation Status</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Pet: {selectedItem.itemId?.name} ({selectedItem.itemId?.petCode})
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Customer: {selectedItem.userId?.name}
              </Typography>
              
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>New Status</InputLabel>
                <Select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                  label="New Status"
                >
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="ready_pickup">Ready for Pickup</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="at_owner">At Owner</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => handleStatusUpdate(selectedItem?._id, statusUpdate)}
            disabled={!statusUpdate}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={showInvoice} onClose={() => setShowInvoice(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Invoice</DialogTitle>
        <DialogContent>
          <InvoiceTemplate 
            invoiceData={invoiceData}
            onPrint={() => setShowInvoice(false)}
            onDownload={() => setShowInvoice(false)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInvoice(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default PetShopManagerDashboard
