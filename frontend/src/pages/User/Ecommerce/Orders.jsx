import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import apiClient from '../../../services/api';

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/ecommerce/orders');
      setOrders(response.data.orders || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setDetailsDialog(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'default',
      confirmed: 'info',
      processing: 'warning',
      shipped: 'primary',
      delivered: 'success',
      cancelled: 'error',
      returned: 'error'
    };
    return colors[status] || 'default';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      completed: 'success',
      failed: 'error',
      refunded: 'info'
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        My Orders
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {orders.length === 0 ? (
        <Alert severity="info">
          No orders yet.{' '}
          <Button onClick={() => navigate('/ecommerce')} sx={{ ml: 2 }}>
            Start Shopping
          </Button>
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell>Order ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Items</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      #{order.orderNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                  </TableCell>
                  <TableCell align="right">
                    ₹{order.totalAmount?.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.paymentStatus}
                      color={getPaymentStatusColor(order.paymentStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleViewDetails(order)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Order Details Dialog */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2 }}>
              {/* Order Info */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Order #{selectedOrder.orderNumber}</Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Order Date</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {new Date(selectedOrder.createdAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Status</Typography>
                    <Chip
                      label={selectedOrder.status}
                      color={getStatusColor(selectedOrder.status)}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Payment Status</Typography>
                    <Chip
                      label={selectedOrder.paymentStatus}
                      color={getPaymentStatusColor(selectedOrder.paymentStatus)}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Total Amount</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      ₹{selectedOrder.totalAmount?.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Items */}
              <Typography variant="h6" sx={{ mb: 2 }}>Items Ordered</Typography>
              {selectedOrder.items?.map((item) => (
                <Box key={item.product._id} sx={{ mb: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {item.product.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Quantity: {item.quantity}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      ₹{(item.product.price * item.quantity).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />

              {/* Cost Breakdown */}
              <Typography variant="h6" sx={{ mb: 2 }}>Cost Summary</Typography>
              <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Subtotal:</Typography>
                <Typography variant="body2">
                  ₹{(selectedOrder.totalAmount - selectedOrder.taxAmount - selectedOrder.shippingAmount).toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Tax (18%):</Typography>
                <Typography variant="body2">₹{selectedOrder.taxAmount?.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Shipping:</Typography>
                <Typography variant="body2">₹{selectedOrder.shippingAmount?.toFixed(2)}</Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Shipping Address */}
              <Typography variant="h6" sx={{ mb: 2 }}>Shipping Address</Typography>
              <Typography variant="body2">
                {selectedOrder.shippingAddress?.addressLine1}
                {selectedOrder.shippingAddress?.addressLine2 && `, ${selectedOrder.shippingAddress.addressLine2}`}
              </Typography>
              <Typography variant="body2">
                {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zipCode}
              </Typography>

              <Divider sx={{ my: 2 }} />

              {/* Payment Timeline */}
              {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mb: 2 }}>Order Timeline</Typography>
                  {selectedOrder.timeline.map((event, idx) => (
                    <Box key={idx} sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {event.status} - {new Date(event.timestamp).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {event.notes}
                      </Typography>
                    </Box>
                  ))}
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              setDetailsDialog(false);
              navigate('/ecommerce');
            }}
          >
            Continue Shopping
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Orders;


