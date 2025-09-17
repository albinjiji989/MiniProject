import React from 'react'
import { Box, Typography, Card, CardContent } from '@mui/material'

const Rescue = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Street Animal Rescue Management
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Rescue Management System
          </Typography>
          <Typography variant="body1">
            This module handles street animal rescue operations including:
          </Typography>
          <ul>
            <li>Rescue case reporting</li>
            <li>Emergency response coordination</li>
            <li>Rescue team management</li>
            <li>Medical attention tracking</li>
            <li>Cost management and reporting</li>
          </ul>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Rescue
