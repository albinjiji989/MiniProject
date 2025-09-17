import React from 'react'
import { Box, Typography, Card, CardContent } from '@mui/material'

const Pharmacy = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Pharmacy Management
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Pharmacy Management System
          </Typography>
          <Typography variant="body1">
            This module manages veterinary pharmacy operations including:
          </Typography>
          <ul>
            <li>Medication inventory</li>
            <li>Prescription management</li>
            <li>Stock tracking and alerts</li>
            <li>Veterinarian prescriptions</li>
            <li>Medication dispensing</li>
            <li>Expiry date monitoring</li>
          </ul>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Pharmacy
