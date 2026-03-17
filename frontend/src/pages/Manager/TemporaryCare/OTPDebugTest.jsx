import React, { useState } from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';
import PickupOTPManager from './PickupOTPManager';

const OTPDebugTest = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  // Mock booking ID for testing
  const testBookingId = '507f1f77bcf86cd799439011'; // Replace with actual booking ID

  const openDialog = () => {
    console.log('🔍 Opening OTP dialog with booking ID:', testBookingId);
    setSelectedBookingId(testBookingId);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    console.log('🔍 Closing OTP dialog');
    setDialogOpen(false);
    setSelectedBookingId(null);
  };

  const handleSuccess = (booking) => {
    console.log('✅ OTP verification successful:', booking);
    alert('OTP verification successful!');
    closeDialog();
  };

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        OTP Debug Test Page
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This is a debug page to test the Pickup OTP Manager dialog.
        Make sure you have a valid booking ID with final payment completed.
      </Alert>

      <Box mb={2}>
        <Typography variant="body1" gutterBottom>
          Test Booking ID: {testBookingId}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Update the testBookingId variable above with a real booking ID from your database.
        </Typography>
      </Box>

      <Button 
        variant="contained" 
        color="primary" 
        onClick={openDialog}
        size="large"
      >
        🔐 Test Pickup OTP Dialog
      </Button>

      <Box mt={3}>
        <Typography variant="h6" gutterBottom>Debug Info:</Typography>
        <Typography variant="body2">Dialog Open: {dialogOpen ? 'Yes' : 'No'}</Typography>
        <Typography variant="body2">Selected Booking ID: {selectedBookingId || 'None'}</Typography>
      </Box>

      {/* The actual OTP Manager Dialog */}
      <PickupOTPManager
        bookingId={selectedBookingId}
        open={dialogOpen}
        onClose={closeDialog}
        onSuccess={handleSuccess}
      />
    </Box>
  );
};

export default OTPDebugTest;