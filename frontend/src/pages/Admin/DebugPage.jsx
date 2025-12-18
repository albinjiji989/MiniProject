import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const DebugPage = () => {
  const navigate = useNavigate();
  
  console.log('DebugPage component rendering...');
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Admin Debug Page</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        This page is for debugging the admin routing issue.
      </Typography>
      <Typography variant="body2" sx={{ mt: 2 }}>
        If you can see this, the routing is working correctly for this specific route.
      </Typography>
      
      <Box sx={{ mt: 3 }}>
        <Button 
          variant="contained" 
          onClick={() => navigate('/admin/dashboard')}
          sx={{ mr: 2 }}
        >
          Go to Dashboard
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/admin/test-debug')}
        >
          Go to Test Debug
        </Button>
      </Box>
    </Box>
  );
};

export default DebugPage;