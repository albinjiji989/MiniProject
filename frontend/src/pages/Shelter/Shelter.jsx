import React from 'react'
import { Box, Typography, Card, CardContent } from '@mui/material'

const Shelter = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Shelter Management
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Shelter Management System
          </Typography>
          <Typography variant="body1">
            This module manages animal shelters including:
          </Typography>
          <ul>
            <li>Shelter information and capacity</li>
            <li>Pet assignments to shelters</li>
            <li>Staff management</li>
            <li>Facility management</li>
            <li>Operating hours and services</li>
          </ul>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Shelter
