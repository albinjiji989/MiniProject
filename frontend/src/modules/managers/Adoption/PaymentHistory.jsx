import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../services/api';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
  TextField,
  IconButton,
  Pagination,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const fetchPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/adoption/manager/payments/history', {
        params: { page, limit, ...dateRange }
      });
      
      const data = res.data?.data || {};
      setPayments(data.payments || []);
      setTotal(data.pagination?.total || 0);
      setTotalRevenue(data.totalRevenue || 0);
      setTotalTransactions(data.totalTransactions || 0);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to fetch payment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, dateRange]);

  const handleDateFilter = () => {
    setPage(1);
    fetchPayments();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/manager/adoption')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={700}>
          Payment History
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total Revenue
            </Typography>
            <Typography variant="h4" fontWeight={700} color="success.main">
              {formatCurrency(totalRevenue)}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total Transactions
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {totalTransactions}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 200 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Average Transaction
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {totalTransactions > 0 ? formatCurrency(totalRevenue / totalTransactions) : formatCurrency(0)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              type="date"
              label="Start Date"
              InputLabelProps={{ shrink: true }}
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              size="small"
            />
            <TextField
              type="date"
              label="End Date"
              InputLabelProps={{ shrink: true }}
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              size="small"
            />
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleDateFilter}
              disabled={loading}
            >
              Filter
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                setDateRange({ startDate: '', endDate: '' });
                setPage(1);
              }}
              disabled={loading}
            >
              Reset
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Payment History Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Transaction History
          </Typography>
          
          {loading ? (
            <Typography>Loading payment history...</Typography>
          ) : payments.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              No payment transactions found.
            </Typography>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Transaction ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Pet</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {payment.transactionId?.substring(0, 10) || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {payment.id?.substring(0, 8)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {payment.userName || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {payment.userEmail}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {payment.petName || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {payment.petBreed} ({payment.petSpecies})
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {formatCurrency(payment.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(payment.paymentDate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={payment.status.replace('_', ' ').toUpperCase()}
                            size="small"
                            color={
                              payment.status === 'completed' ? 'success' :
                              payment.status === 'pending' ? 'warning' :
                              payment.status === 'rejected' ? 'error' : 'default'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <Stack spacing={2} alignItems="center" sx={{ mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                  <Typography variant="body2" color="text.secondary">
                    Showing {Math.min((page - 1) * limit + 1, total)} - {Math.min(page * limit, total)} of {total} transactions
                  </Typography>
                </Stack>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PaymentHistory;