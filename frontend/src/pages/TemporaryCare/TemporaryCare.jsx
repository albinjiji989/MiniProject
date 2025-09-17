import React from 'react'
import { Box, Typography, Card, CardContent } from '@mui/material'

const TemporaryCare = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Temporary Pet Care Management
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Temporary Care Management System
          </Typography>
          <Typography variant="body1">
            This module manages temporary pet care services including:
          </Typography>
          <ul>
            <li>Caregiver management</li>
            <li>Temporary care requests</li>
            <li>Pet care tracking</li>
            <li>Health monitoring</li>
            <li>Daily reports</li>
            <li>Expense tracking</li>
          </ul>
        </CardContent>
      </Card>
    </Box>
  )
}

export default TemporaryCare
