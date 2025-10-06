import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button
} from '@mui/material'
import { Print as PrintIcon, Download as DownloadIcon } from '@mui/icons-material'

const InvoiceTemplate = ({ invoiceData, onPrint, onDownload }) => {
  if (!invoiceData) return null

  const {
    invoiceNumber,
    date,
    customer,
    pet,
    payment,
    delivery
  } = invoiceData

  const handlePrint = () => {
    window.print()
    if (onPrint) onPrint()
  }

  const handleDownload = () => {
    // Create downloadable PDF logic here
    if (onDownload) onDownload()
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Pet Welfare System
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Pet Shop Invoice
        </Typography>
      </Box>

      {/* Invoice Info */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Typography variant="h6" gutterBottom>Invoice Details</Typography>
          <Typography variant="body2">
            <strong>Invoice Number:</strong> {invoiceNumber}
          </Typography>
          <Typography variant="body2">
            <strong>Date:</strong> {new Date(date).toLocaleDateString()}
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Typography variant="h6" gutterBottom>Customer Information</Typography>
          <Typography variant="body2">
            <strong>Name:</strong> {customer.name}
          </Typography>
          <Typography variant="body2">
            <strong>Email:</strong> {customer.email}
          </Typography>
          <Typography variant="body2">
            <strong>Phone:</strong> {customer.phone}
          </Typography>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Pet Details */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Pet Details</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Pet Name</strong></TableCell>
              <TableCell><strong>Pet Code</strong></TableCell>
              <TableCell><strong>Species</strong></TableCell>
              <TableCell><strong>Breed</strong></TableCell>
              <TableCell align="right"><strong>Price</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{pet.name}</TableCell>
              <TableCell>{pet.code}</TableCell>
              <TableCell>{pet.species}</TableCell>
              <TableCell>{pet.breed}</TableCell>
              <TableCell align="right">₹{payment.amount?.toLocaleString()}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Payment Details */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Typography variant="h6" gutterBottom>Payment Information</Typography>
          <Typography variant="body2">
            <strong>Amount:</strong> ₹{payment.amount?.toLocaleString()}
          </Typography>
          <Typography variant="body2">
            <strong>Payment Method:</strong> {payment.method}
          </Typography>
          <Typography variant="body2">
            <strong>Transaction ID:</strong> {payment.transactionId}
          </Typography>
          <Typography variant="body2">
            <strong>Payment Date:</strong> {new Date(payment.paidAt).toLocaleDateString()}
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Typography variant="h6" gutterBottom>Delivery Information</Typography>
          <Typography variant="body2">
            <strong>Method:</strong> {delivery.method === 'delivery' ? 'Home Delivery' : 'Store Pickup'}
          </Typography>
          {delivery.address && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">
                <strong>Delivery Address:</strong>
              </Typography>
              <Typography variant="body2">
                {delivery.address.street}<br/>
                {delivery.address.city}, {delivery.address.state}<br/>
                {delivery.address.zipCode}
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Total */}
      <Box sx={{ textAlign: 'right', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Total Amount: ₹{payment.amount?.toLocaleString()}
        </Typography>
      </Box>

      {/* Footer */}
      <Box sx={{ textAlign: 'center', mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary">
          Thank you for choosing Pet Welfare System!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          For any queries, please contact our support team.
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3, '@media print': { display: 'none' } }}>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Print Invoice
        </Button>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
        >
          Download PDF
        </Button>
      </Box>
    </Paper>
  )
}

export default InvoiceTemplate
