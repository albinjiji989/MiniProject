import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Divider,
  Avatar,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  Receipt as InvoiceIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { apiClient, resolveMediaUrl } from '../../../services/api';
import { handleApiError } from '../../../utils/notifications';

const InvoiceManagement = () => {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDialog, setInvoiceDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    totalAmount: 0
  });

  useEffect(() => {
    loadInvoices();
  }, [filterStatus]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await apiClient.get('/petshop/manager/invoices', { params });
      const data = response.data.data;
      
      setInvoices(data.invoices || []);
      setStats(data.stats || {
        total: 0,
        paid: 0,
        pending: 0,
        overdue: 0,
        totalRevenue: 0
      });

    } catch (err) {
      handleApiError(err, 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceDialog(true);
  };

  const handlePrintInvoice = (invoice) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const invoiceHTML = generateInvoiceHTML(invoice);
    
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const generateInvoiceHTML = (invoice) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-info { text-align: center; margin-bottom: 20px; }
          .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .customer-info, .invoice-info { width: 45%; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .items-table th { background-color: #f5f5f5; }
          .total-section { text-align: right; margin-top: 20px; }
          .total-amount { font-size: 18px; font-weight: bold; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <h2>${invoice.invoiceNumber}</h2>
        </div>
        
        <div class="company-info">
          <h3>PetShop Manager</h3>
          <p>Pet Care & Sales</p>
          <p>Email: info@petshop.com | Phone: +91-XXXXXXXXXX</p>
        </div>
        
        <div class="invoice-details">
          <div class="customer-info">
            <h4>Bill To:</h4>
            <p><strong>${invoice.customerName}</strong></p>
            <p>Email: ${invoice.customerEmail}</p>
            <p>Phone: ${invoice.customerPhone}</p>
          </div>
          
          <div class="invoice-info">
            <h4>Invoice Details:</h4>
            <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${invoice.status.toUpperCase()}</p>
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Pet Code</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.description}</td>
                <td>${invoice.petCode || 'N/A'}</td>
                <td>${item.quantity}</td>
                <td>₹${item.unitPrice?.toLocaleString()}</td>
                <td>₹${item.total?.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="total-section">
          <p><strong>Subtotal: ₹${invoice.amount?.toLocaleString()}</strong></p>
          <p><strong>Tax (0%): ₹0</strong></p>
          <p class="total-amount">Total Amount: ₹${invoice.amount?.toLocaleString()}</p>
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>This is a computer-generated invoice.</p>
        </div>
      </body>
      </html>
    `;
  };

  const getStatusColor = (status) => {
    const colors = {
      paid: 'success',
      pending: 'warning',
      overdue: 'error',
      cancelled: 'default'
    };
    return colors[status] || 'default';
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'paid' && invoice.paymentStatus === 'completed') ||
      (filterStatus === 'pending' && invoice.paymentStatus !== 'completed') ||
      (filterStatus === 'overdue' && invoice.paymentStatus !== 'completed' && new Date(invoice.dueDate) < new Date());
    
    const matchesSearch = !searchTerm || 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.petName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Invoice Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and track all customer invoices and payments
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight={700} color="primary">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Invoices
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {stats.paid}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Paid Invoices
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                {stats.pending}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Payment
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight={700} color="success.main">
                ₹{stats.totalRevenue?.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Tabs
                value={filterStatus}
                onChange={(e, newValue) => setFilterStatus(newValue)}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label={`All (${stats.total})`} value="all" />
                <Tab label={`Paid (${stats.paid})`} value="paid" />
                <Tab label={`Pending (${stats.pending})`} value="pending" />
                {stats.overdue > 0 && (
                  <Tab 
                    label={
                      <Badge badgeContent={stats.overdue} color="error">
                        Overdue
                      </Badge>
                    } 
                    value="overdue" 
                  />
                )}
              </Tabs>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2}>
                <TextField
                  size="small"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadInvoices}
                >
                  Refresh
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Invoices Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Pet</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {invoice.invoiceNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {invoice.customerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {invoice.customerEmail}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {invoice.petName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {invoice.petCode}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        ₹{invoice.amount?.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.paymentStatus === 'completed' ? 'PAID' : 'PENDING'}
                        color={invoice.paymentStatus === 'completed' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleViewInvoice(invoice)}
                          title="View Invoice"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handlePrintInvoice(invoice)}
                          title="Print Invoice"
                        >
                          <PrintIcon />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredInvoices.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No invoices found
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Invoice Details Dialog */}
      <Dialog open={invoiceDialog} onClose={() => setInvoiceDialog(false)} maxWidth="md" fullWidth>
        {selectedInvoice && (
          <>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Invoice {selectedInvoice.invoiceNumber}
                  </Typography>
                  <Typography variant="caption">
                    Generated on {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Chip
                  label={selectedInvoice.status.toUpperCase()}
                  color={getStatusColor(selectedInvoice.status)}
                  sx={{ color: 'white', fontWeight: 600 }}
                />
              </Box>
            </DialogTitle>
            <DialogContent sx={{ mt: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                      Customer Information
                    </Typography>
                    <Typography variant="body2">{selectedInvoice.customerName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedInvoice.customerEmail}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedInvoice.customerPhone}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                      Invoice Details
                    </Typography>
                    <Typography variant="body2">Invoice #: {selectedInvoice.invoiceNumber}</Typography>
                    <Typography variant="body2">Date: {new Date(selectedInvoice.createdAt).toLocaleDateString()}</Typography>
                    <Typography variant="body2">Due Date: {new Date(selectedInvoice.dueDate).toLocaleDateString()}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Items
                  </Typography>
                  <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Description</TableCell>
                          <TableCell>Pet Code</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Unit Price</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedInvoice.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{selectedInvoice.petCode || 'N/A'}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">₹{item.unitPrice?.toLocaleString()}</TableCell>
                            <TableCell align="right">₹{item.total?.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" fontWeight={700}>
                      Total Amount: ₹{selectedInvoice.amount?.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setInvoiceDialog(false)}>Close</Button>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={() => handlePrintInvoice(selectedInvoice)}
              >
                Print Invoice
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default InvoiceManagement;