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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField,
  Box
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  QrCode as QrCodeIcon
} from '@mui/icons-material';

const HandoverDialog = ({ 
  open, 
  onClose, 
  selectedReservation, 
  handoverData, 
  setHandoverData, 
  onVerifyOtp, 
  onShowQrCode 
}) => {
  // Define steps for the handover process
  const handoverSteps = [
    { 
      label: 'Reservation Confirmed', 
      status: ['paid', 'ready_pickup', 'completed'],
      description: 'Your reservation has been confirmed and payment processed.'
    },
    { 
      label: 'Preparation', 
      status: ['ready_pickup', 'completed'],
      description: 'The pet shop is preparing your pet for pickup.'
    },
    { 
      label: 'Ready for Pickup', 
      status: ['ready_pickup', 'completed'],
      description: 'Your pet is ready for pickup. Please visit the store with the required documents.'
    },
    { 
      label: 'Verification', 
      status: ['completed'],
      description: 'Verify your identity at the store using the OTP or QR code.'
    },
    { 
      label: 'Handover Complete', 
      status: ['completed'],
      description: 'Pet handover completed successfully. Enjoy your new companion!'
    }
  ];

  // Determine current step based on reservation status
  const getCurrentStep = () => {
    if (!selectedReservation) return 0;
    
    const status = selectedReservation.status;
    if (status === 'paid') return 0;
    if (status === 'ready_pickup') return 2;
    if (status === 'completed') return 4;
    return 0;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Handover Details for {selectedReservation?.itemId?.name || 'Pet'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>Handover Progress</Typography>
            
            <Stepper activeStep={getCurrentStep()} orientation="vertical">
              {handoverSteps.map((step, index) => (
                <Step key={step.label} completed={step.status.includes(selectedReservation?.status)}>
                  <StepLabel>
                    <Typography variant="subtitle1">{step.label}</Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2">{step.description}</Typography>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
            
            {selectedReservation?.status === 'ready_pickup' && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>OTP Verification</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Enter the OTP sent to your phone to verify your identity at pickup.
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                      label="Enter OTP"
                      value={handoverData.otp}
                      onChange={(e) => setHandoverData(prev => ({ ...prev, otp: e.target.value }))}
                      inputProps={{ maxLength: 6 }}
                    />
                    <Button 
                      variant="contained" 
                      onClick={onVerifyOtp}
                      disabled={handoverData.otp.length !== 6}
                    >
                      Verify
                    </Button>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button 
                      startIcon={<QrCodeIcon />}
                      onClick={onShowQrCode}
                    >
                      Show QR Code
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Store Information</Typography>
                
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  {selectedReservation?.store?.name || 'Pet Shop'}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationIcon sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    {selectedReservation?.store?.address?.street}, {selectedReservation?.store?.address?.city}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PhoneIcon sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    {selectedReservation?.store?.phone || 'Not provided'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmailIcon sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    {selectedReservation?.store?.email || 'Not provided'}
                  </Typography>
                </Box>
                
                <Button 
                  variant="outlined" 
                  fullWidth
                  startIcon={<LocationIcon />}
                >
                  Get Directions
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default HandoverDialog;