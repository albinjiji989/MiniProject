import React from 'react'
import { Box, Container, Typography, Card, CardContent, Grid } from '@mui/material'
import PetsIcon from '@mui/icons-material/Pets'

const About = () => {
  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)', py: 8 }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
            About PetWelfare
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Compassion. Care. Community.
          </Typography>
        </Box>

        <Card sx={{ borderRadius: 3, boxShadow: '0 24px 60px rgba(0,0,0,0.08)' }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={2} sx={{ textAlign: 'center' }}>
                <PetsIcon sx={{ fontSize: 56, color: 'primary.main' }} />
              </Grid>
              <Grid item xs={12} md={10}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  Our Mission
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  PetWelfare is a modern, unified platform built to empower organizations and communities
                  working for animals. We streamline adoption, rescue, veterinary care, pharmacy,
                  shelters and temporary care — helping teams focus more on impact and less on admin.
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default About


