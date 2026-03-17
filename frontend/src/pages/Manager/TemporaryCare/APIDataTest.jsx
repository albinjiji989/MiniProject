import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert, Card, CardContent } from '@mui/material';
import api from '../../../services/api';

const APIDataTest = () => {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Fetching today\'s schedule...');
      const response = await api.get('/api/temporary-care/manager/schedule/today');
      
      console.log('✅ Schedule API Response:', response.data);
      setScheduleData(response.data.data);
      
      // Log specific booking data
      if (response.data.data.checkOuts && response.data.data.checkOuts.length > 0) {
        const firstCheckout = response.data.data.checkOuts[0];
        console.log('🔍 First checkout booking:', firstCheckout);
        console.log('🔍 Payment status:', firstCheckout.paymentStatus);
        console.log('🔍 Handover data:', firstCheckout.handover);
        console.log('🔍 Pickup OTP:', firstCheckout.handover?.pickup?.otp);
      }
      
    } catch (err) {
      console.error('❌ API Error:', err);
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleData();
  }, []);

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        API Data Test - Manager Dashboard
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={fetchScheduleData}
        disabled={loading}
        sx={{ mb: 3 }}
      >
        {loading ? 'Loading...' : 'Refresh Schedule Data'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {scheduleData && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Schedule Data Summary:
          </Typography>
          
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="body1">
                Check-ins: {scheduleData.checkIns?.length || 0}
              </Typography>
              <Typography variant="body1">
                Check-outs: {scheduleData.checkOuts?.length || 0}
              </Typography>
              <Typography variant="body1">
                Ongoing: {scheduleData.ongoing?.length || 0}
              </Typography>
            </CardContent>
          </Card>

          {scheduleData.checkOuts && scheduleData.checkOuts.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Check-out Bookings (Ready for Pickup):
              </Typography>
              
              {scheduleData.checkOuts.map((booking, index) => (
                <Card key={booking._id || index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6">
                      {booking.petId?.name || 'Unknown Pet'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Owner: {booking.userId?.name} ({booking.userId?.email})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Booking: {booking.bookingNumber}
                    </Typography>
                    
                    <Box mt={2}>
                      <Typography variant="body2">
                        <strong>Final Payment Status:</strong> {booking.paymentStatus?.final?.status || 'Unknown'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Has Pickup OTP:</strong> {booking.handover?.pickup?.otp?.code ? 'Yes' : 'No'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>OTP Verified:</strong> {booking.handover?.pickup?.otp?.verified ? 'Yes' : 'No'}
                      </Typography>
                      
                      {booking.handover?.pickup?.otp?.code && (
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 1 }}>
                          <strong>OTP Code:</strong> {booking.handover.pickup.otp.code}
                        </Typography>
                      )}
                    </Box>
                    
                    <Box mt={2}>
                      <Typography variant="caption" display="block">
                        Raw handover data: {JSON.stringify(booking.handover, null, 2)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default APIDataTest;