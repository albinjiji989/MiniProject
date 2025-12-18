import React from 'react';
import { Box, Typography } from '@mui/material';

const TestDebug = () => {
  console.log('TestDebug component rendering...');
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Test Debug Page</Typography>
      <Typography variant="body1">This is a test page to verify routing is working.</Typography>
      <Typography variant="body2" sx={{ mt: 2 }}>
        If you can see this, the routing is working correctly.
      </Typography>
    </Box>
  );
};

export default TestDebug;