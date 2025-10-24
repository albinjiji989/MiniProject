import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Box
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  PhoneAndroid as UpiIcon,
  AccountBalance as BankIcon,
  OfflinePin as OfflineIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';

const PaymentDialog = ({ 
  open, 
  onClose, 
  selectedReservation, 
  paymentMethod, 
  setPaymentMethod, 
  onPayment, 
  processingPayment 
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Payment for {selectedReservation?.itemId?.name || 'Pet'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>Payment Method</Typography>
            
            <FormControl component="fieldset" fullWidth>
              <RadioGroup
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <Card 
                  variant="outlined" 
                  sx={{ 
                    mb: 2, 
                    borderColor: paymentMethod === 'razorpay' ? 'primary.main' : 'divider',
                    borderWidth: paymentMethod === 'razorpay' ? 2 : 1
                  }}
                >
                  <CardContent>
                    <FormControlLabel 
                      value="razorpay" 
                      control={<Radio />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CreditCardIcon />
                          <Typography>Credit/Debit Card</Typography>
                        </Box>
                      }
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                      Pay securely using your credit or debit card through Razorpay
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card 
                  variant="outlined" 
                  sx={{ 
                    mb: 2, 
                    borderColor: paymentMethod === 'upi' ? 'primary.main' : 'divider',
                    borderWidth: paymentMethod === 'upi' ? 2 : 1
                  }}
                >
                  <CardContent>
                    <FormControlLabel 
                      value="upi" 
                      control={<Radio />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <UpiIcon />
                          <Typography>UPI</Typography>
                        </Box>
                      }
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                      Pay instantly using any UPI app
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card 
                  variant="outlined" 
                  sx={{ 
                    mb: 2, 
                    borderColor: paymentMethod === 'netbanking' ? 'primary.main' : 'divider',
                    borderWidth: paymentMethod === 'netbanking' ? 2 : 1
                  }}
                >
                  <CardContent>
                    <FormControlLabel 
                      value="netbanking" 
                      control={<Radio />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BankIcon />
                          <Typography>Net Banking</Typography>
                        </Box>
                      }
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                      Pay directly from your bank account
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card 
                  variant="outlined" 
                  sx={{ 
                    borderColor: paymentMethod === 'offline' ? 'primary.main' : 'divider',
                    borderWidth: paymentMethod === 'offline' ? 2 : 1
                  }}
                >
                  <CardContent>
                    <FormControlLabel 
                      value="offline" 
                      control={<Radio />} 
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <OfflineIcon />
                          <Typography>Offline Payment</Typography>
                        </Box>
                      }
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                      Visit the store to make payment in person
                    </Typography>
                  </CardContent>
                </Card>
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Order Summary</Typography>
            <Card variant="outlined">
              <CardContent>
                <Typography><strong>Pet:</strong> {selectedReservation?.itemId?.name}</Typography>
                <Typography><strong>Price:</strong> ₹{selectedReservation?.itemId?.price?.toLocaleString()}</Typography>
                <Typography><strong>Quantity:</strong> {selectedReservation?.quantity || 1}</Typography>
                <Typography><strong>Total:</strong> ₹{selectedReservation?.totalPrice?.toLocaleString() || selectedReservation?.itemId?.price?.toLocaleString()}</Typography>
              </CardContent>
            </Card>
            
            <Button 
              variant="contained" 
              size="large"
              startIcon={processingPayment ? <CircularProgress size={20} /> : <PaymentIcon />}
              onClick={onPayment}
              disabled={processingPayment}
              fullWidth
              sx={{ mt: 3 }}
            >
              {processingPayment ? 'Processing...' : 'Pay Now'}
            </Button>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDialog;