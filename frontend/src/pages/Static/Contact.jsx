import React from 'react'
import { Box, Container, Typography, Card, CardContent, Grid, Button } from '@mui/material'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'

const Contact = () => {
  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)', py: 8 }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
            Contact Us
          </Typography>
          <Typography variant="h6" color="text.secondary">
            We’re here to help
          </Typography>
        </Box>

        <Card sx={{ borderRadius: 3, boxShadow: '0 24px 60px rgba(0,0,0,0.08)' }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EmailIcon sx={{ mr: 1, color: 'primary.main' }} /> Email
                </Typography>
                <Typography variant="body1" color="text.secondary">support@petwelfare.com</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} /> Phone
                </Typography>
                <Typography variant="body1" color="text.secondary">+91 98765 43210</Typography>
              </Grid>
            </Grid>
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button variant="contained">Get Support</Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default Contact


