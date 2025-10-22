import React from 'react'
import { Container, Typography, Card, CardContent, Grid, Box } from '@mui/material'
import { Assessment, TrendingUp, Pets, EventAvailable } from '@mui/icons-material'

const Reports = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>Reports & Analytics</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Assessment color="primary" />
                <Typography variant="h6">Monthly Report</Typography>
              </Box>
              <Typography color="text.secondary">Detailed monthly performance metrics</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <TrendingUp color="success" />
                <Typography variant="h6">Revenue Analysis</Typography>
              </Box>
              <Typography color="text.secondary">Financial performance tracking</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default Reports
