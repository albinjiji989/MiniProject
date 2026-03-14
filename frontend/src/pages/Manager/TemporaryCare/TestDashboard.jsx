import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';

const TestDashboard = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          🎉 Temporary Care Manager Dashboard
        </Typography>
        <Typography variant="h6" color="primary" gutterBottom>
          ✅ Dashboard is Working!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          The manager dashboard is now successfully loaded and functional.
        </Typography>
        <Box sx={{ mt: 3, p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
          <Typography variant="body2" color="success.contrastText">
            🚀 Ready for full functionality implementation
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TestDashboard;