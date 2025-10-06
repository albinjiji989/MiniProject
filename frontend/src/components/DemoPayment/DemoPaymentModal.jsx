import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material'
import {
  CreditCard as CardIcon,
  AccountBalance as BankIcon,
  QrCode as QrIcon,
  Smartphone as UpiIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material'

const DemoPaymentModal = ({ open, onClose, orderDetails, onSuccess }) => {
  const [activeTab, setActiveTab] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [paymentData, setPaymentData] = useState({
    // Card details
    cardNumber: '4111 1111 1111 1111',
    expiryMonth: '12',
    expiryYear: '25',
    cvv: '123',
    cardName: 'Demo User',
    
    // UPI details
    upiId: 'demo@paytm',
    
    // Net banking
    selectedBank: 'hdfc'
  })

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  const handleInputChange = (field) => (event) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  const handlePayment = async () => {
    setProcessing(true)
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Always succeed in demo mode
    const mockResponse = {
      razorpay_order_id: orderDetails.orderId,
      razorpay_payment_id: `demo_payment_${Date.now()}`,
      razorpay_signature: 'demo_signature'
    }
    
    setProcessing(false)
    onSuccess(mockResponse)
  }

  const renderCardPayment = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CardIcon /> Card Payment
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Card Number"
            value={paymentData.cardNumber}
            onChange={handleInputChange('cardNumber')}
            placeholder="1234 5678 9012 3456"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Expiry Month"
            value={paymentData.expiryMonth}
            onChange={handleInputChange('expiryMonth')}
            placeholder="MM"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Expiry Year"
            value={paymentData.expiryYear}
            onChange={handleInputChange('expiryYear')}
            placeholder="YY"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="CVV"
            value={paymentData.cvv}
            onChange={handleInputChange('cvv')}
            placeholder="123"
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Cardholder Name"
            value={paymentData.cardName}
            onChange={handleInputChange('cardName')}
            placeholder="John Doe"
          />
        </Grid>
      </Grid>
      
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Demo Cards:</strong><br/>
          • Visa: 4111 1111 1111 1111<br/>
          • Mastercard: 5555 5555 5555 4444<br/>
          • Any CVV and future expiry date works
        </Typography>
      </Alert>
    </Box>
  )

  const renderUpiPayment = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <UpiIcon /> UPI Payment
      </Typography>
      
      {/* QR Code Section */}
      <Card sx={{ mb: 3, textAlign: 'center', p: 2 }}>
        <QrIcon sx={{ fontSize: 120, color: 'primary.main', mb: 1 }} />
        <Typography variant="body1" sx={{ mb: 1 }}>
          Scan QR Code with any UPI App
        </Typography>
        <Chip label="Demo QR Code" color="primary" size="small" />
      </Card>
      
      <Divider sx={{ my: 2 }}>
        <Typography variant="body2" color="text.secondary">OR</Typography>
      </Divider>
      
      {/* UPI ID Section */}
      <TextField
        fullWidth
        label="Enter UPI ID"
        value={paymentData.upiId}
        onChange={handleInputChange('upiId')}
        placeholder="yourname@paytm"
        sx={{ mb: 2 }}
      />
      
      <Alert severity="info">
        <Typography variant="body2">
          <strong>Demo UPI IDs:</strong><br/>
          • success@razorpay (Success)<br/>
          • demo@paytm (Success)<br/>
          • test@upi (Success)
        </Typography>
      </Alert>
    </Box>
  )

  const renderNetBanking = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <BankIcon /> Net Banking
      </Typography>
      
      <Grid container spacing={2}>
        {[
          { id: 'hdfc', name: 'HDFC Bank' },
          { id: 'icici', name: 'ICICI Bank' },
          { id: 'sbi', name: 'State Bank of India' },
          { id: 'axis', name: 'Axis Bank' },
          { id: 'kotak', name: 'Kotak Mahindra Bank' },
          { id: 'pnb', name: 'Punjab National Bank' }
        ].map((bank) => (
          <Grid item xs={12} sm={6} key={bank.id}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: paymentData.selectedBank === bank.id ? 2 : 1,
                borderColor: paymentData.selectedBank === bank.id ? 'primary.main' : 'grey.300'
              }}
              onClick={() => setPaymentData(prev => ({ ...prev, selectedBank: bank.id }))}
            >
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="body2">{bank.name}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          Select any bank above. All demo banks will process successfully.
        </Typography>
      </Alert>
    </Box>
  )

  const renderWallets = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Digital Wallets</Typography>
      
      <Grid container spacing={2}>
        {[
          { id: 'paytm', name: 'Paytm' },
          { id: 'phonepe', name: 'PhonePe' },
          { id: 'googlepay', name: 'Google Pay' },
          { id: 'amazonpay', name: 'Amazon Pay' }
        ].map((wallet) => (
          <Grid item xs={12} sm={6} key={wallet.id}>
            <Card sx={{ cursor: 'pointer' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body1">{wallet.name}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          All wallet payments are simulated and will succeed in demo mode.
        </Typography>
      </Alert>
    </Box>
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ textAlign: 'center' }}>
        <Typography variant="h5">Complete Payment</Typography>
        <Typography variant="h6" color="primary">
          ₹{(orderDetails?.amount / 100)?.toLocaleString()}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
            <Tab icon={<CardIcon />} label="Cards" />
            <Tab icon={<UpiIcon />} label="UPI" />
            <Tab icon={<BankIcon />} label="Net Banking" />
            <Tab icon={<QrIcon />} label="Wallets" />
          </Tabs>
        </Box>

        {activeTab === 0 && renderCardPayment()}
        {activeTab === 1 && renderUpiPayment()}
        {activeTab === 2 && renderNetBanking()}
        {activeTab === 3 && renderWallets()}

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handlePayment}
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : <SuccessIcon />}
            sx={{ minWidth: 200, py: 1.5 }}
          >
            {processing ? 'Processing...' : `Pay ₹${(orderDetails?.amount / 100)?.toLocaleString()}`}
          </Button>
        </Box>

        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="body2">
            🎉 <strong>Demo Mode:</strong> All payments will succeed automatically. 
            No real money will be charged.
          </Typography>
        </Alert>
      </DialogContent>
    </Dialog>
  )
}

export default DemoPaymentModal
