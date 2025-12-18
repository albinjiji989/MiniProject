import React from 'react';
import { Box, Typography } from '@mui/material';

const TestPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Test Page</Typography>
      <Typography variant="body1">This is a test page to verify routing is working.</Typography>
    </Box>
  );
};

export default TestPage;