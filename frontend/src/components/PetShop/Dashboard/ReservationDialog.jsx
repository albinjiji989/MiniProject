import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Card,
  CardContent
} from '@mui/material';
import {
  OnlinePrediction as OnlineIcon,
  OfflinePin as OfflineIcon
} from '@mui/icons-material';

const ReservationDialog = ({ 
  open, 
  onClose, 
  selectedPet, 
  reservationData, 
  setReservationData, 
  onSubmit 
}) => {
  const [activeStep, setActiveStep] = React.useState(0);

  const reservationSteps = [
    'Choose Reservation Type',
    'Contact Information',
    'Visit Details',
    'Review & Submit'
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const getReservationTypeDescription = (type) => {
    switch (type) {
      case 'online_booking':
        return {
          title: 'Online Booking',
          description: 'Complete your purchase online with secure payment processing.',
          steps: [
            '1. Confirm your reservation',
            '2. Complete secure online payment',
            '3. Receive confirmation via email/SMS',
            '4. Visit the store or get home delivery'
          ]
        };
      case 'offline_verification':
        return {
          title: 'Offline Purchase - Store Visit',
          description: 'You\'ll visit the store in person to complete your purchase.',
          steps: [
            '1. Confirm your reservation',
            '2. Receive your QR code via email/SMS',
            '3. Visit the store with the QR code',
            '4. Complete the purchase in person'
          ]
        };
      default:
        return {
          title: 'Online Booking',
          description: 'Complete your purchase online with secure payment processing.',
          steps: [
            '1. Confirm your reservation',
            '2. Complete secure online payment',
            '3. Receive confirmation via email/SMS',
            '4. Visit the store or get home delivery'
          ]
        };
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Reserve Pet: {selectedPet?.name || 'Unnamed Pet'}
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 2 }}>
          {reservationSteps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
              <StepContent>
                {index === 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Choose Reservation Type</Typography>
                    
                    <RadioGroup
                      value={reservationData.reservationType}
                      onChange={(e) => setReservationData(prev => ({
                        ...prev,
                        reservationType: e.target.value
                      }))}
                    >
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          mb: 2, 
                          borderColor: reservationData.reservationType === 'online_booking' ? 'primary.main' : 'divider',
                          borderWidth: reservationData.reservationType === 'online_booking' ? 2 : 1
                        }}
                      >
                        <CardContent>
                          <FormControlLabel 
                            value="online_booking" 
                            control={<Radio />} 
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <OnlineIcon />
                                <Typography>Online Booking</Typography>
                              </Box>
                            }
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                            Complete your purchase online with secure payment processing.
                          </Typography>
                          
                          {reservationData.reservationType === 'online_booking' && (
                            <Box sx={{ ml: 4 }}>
                              <Typography variant="subtitle2" color="primary.main">Next Steps:</Typography>
                              <Typography variant="body2" component="div">
                                <ol style={{ paddingLeft: 20, margin: '8px 0' }}>
                                  <li>Confirm your reservation</li>
                                  <li>Complete secure online payment</li>
                                  <li>Receive confirmation via email/SMS</li>
                                  <li>Visit the store or get home delivery</li>
                                </ol>
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                      
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          borderColor: reservationData.reservationType === 'offline_verification' ? 'primary.main' : 'divider',
                          borderWidth: reservationData.reservationType === 'offline_verification' ? 2 : 1
                        }}
                      >
                        <CardContent>
                          <FormControlLabel 
                            value="offline_verification" 
                            control={<Radio />} 
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <OfflineIcon />
                                <Typography>Offline Purchase - Store Visit</Typography>
                              </Box>
                            }
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                            You'll visit the store in person to complete your purchase.
                          </Typography>
                          
                          {reservationData.reservationType === 'offline_verification' && (
                            <Box sx={{ ml: 4 }}>
                              <Typography variant="subtitle2" color="primary.main">Next Steps:</Typography>
                              <Typography variant="body2" component="div">
                                <ol style={{ paddingLeft: 20, margin: '8px 0' }}>
                                  <li>Confirm your reservation</li>
                                  <li>Receive your QR code via email/SMS</li>
                                  <li>Visit the store with the QR code</li>
                                  <li>Complete the purchase in person</li>
                                </ol>
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </RadioGroup>
                  </Box>
                )}

                {index === 1 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Enter Contact Information</Typography>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={reservationData.contactInfo.phone}
                      onChange={(e) => setReservationData(prev => ({
                        ...prev,
                        contactInfo: {
                          ...prev.contactInfo,
                          phone: e.target.value
                        }
                      }))}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={reservationData.contactInfo.email}
                      onChange={(e) => setReservationData(prev => ({
                        ...prev,
                        contactInfo: {
                          ...prev.contactInfo,
                          email: e.target.value
                        }
                      }))}
                    />
                  </Box>
                )}

                {index === 2 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Choose Visit Details</Typography>
                    <TextField
                      fullWidth
                      label="Preferred Date"
                      type="date"
                      value={reservationData.visitDetails.preferredDate}
                      onChange={(e) => setReservationData(prev => ({
                        ...prev,
                        visitDetails: {
                          ...prev.visitDetails,
                          preferredDate: e.target.value
                        }
                      }))}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Preferred Time"
                      type="time"
                      value={reservationData.visitDetails.preferredTime}
                      onChange={(e) => setReservationData(prev => ({
                        ...prev,
                        visitDetails: {
                          ...prev.visitDetails,
                          preferredTime: e.target.value
                        }
                      }))}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      sx={{ mb: 2 }}
                    />
                    <FormControl fullWidth>
                      <InputLabel>Visit Purpose</InputLabel>
                      <Select
                        value={reservationData.visitDetails.visitPurpose}
                        onChange={(e) => setReservationData(prev => ({
                          ...prev,
                          visitDetails: {
                            ...prev.visitDetails,
                            visitPurpose: e.target.value
                          }
                        }))}
                      >
                        <MenuItem value="meet_pet">Meet the Pet</MenuItem>
                        <MenuItem value="final_purchase">Final Purchase</MenuItem>
                        <MenuItem value="health_check">Health Check</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                )}
                
                {index === 3 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Review Your Reservation</Typography>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography><strong>Pet:</strong> {selectedPet?.name}</Typography>
                        <Typography><strong>Price:</strong> ₹{selectedPet?.price?.toLocaleString()}</Typography>
                        <Typography><strong>Type:</strong> {getReservationTypeDescription(reservationData.reservationType).title}</Typography>
                        <Typography><strong>Contact:</strong> {reservationData.contactInfo.phone} / {reservationData.contactInfo.email}</Typography>
                        <Typography><strong>Visit Date:</strong> {reservationData.visitDetails.preferredDate || 'Not specified'}</Typography>
                        <Typography><strong>Visit Time:</strong> {reservationData.visitDetails.preferredTime}</Typography>
                        <Typography><strong>Purpose:</strong> {reservationData.visitDetails.visitPurpose.replace('_', ' ')}</Typography>
                      </CardContent>
                    </Card>
                    
                    {/* Show additional information based on reservation type */}
                    {reservationData.reservationType === 'offline_verification' && (
                      <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="info.main">Offline Purchase Information</Typography>
                        <Typography variant="body2">
                          After confirming your reservation, you'll receive a QR code via email/SMS. 
                          Please bring this QR code when visiting the store to complete your purchase in person.
                        </Typography>
                      </Box>
                    )}
                    
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Additional Notes"
                      value={reservationData.notes}
                      onChange={(e) => setReservationData(prev => ({
                        ...prev,
                        notes: e.target.value
                      }))}
                    />
                  </Box>
                )}

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={index === 3 ? onSubmit : handleNext}
                    sx={{ mr: 1 }}
                  >
                    {index === 3 ? 'Submit Reservation' : 'Continue'}
                  </Button>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReservationDialog;