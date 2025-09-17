import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  CardMedia,
} from '@mui/material'
import {
  Pets as PetsIcon,
  Favorite as AdoptionIcon,
  Home as HomeIcon,
  Home as ShelterIcon,
  Report as RescueIcon,
  ShoppingCart as EcommerceIcon,
  LocalPharmacy as PharmacyIcon,
  
  Support as TemporaryCareIcon,
  LocalHospital as VeterinaryIcon,
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  ContactMail as ContactIcon,
} from '@mui/icons-material'

const Landing = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }


  const features = [
    {
      icon: <AdoptionIcon sx={{ fontSize: 40, color: '#4caf50' }} />,
      title: 'Adoption Management',
      description: 'Streamline pet adoption processes with comprehensive application tracking and approval workflows.'
    },
    {
      icon: <ShelterIcon sx={{ fontSize: 40, color: '#2196f3' }} />,
      title: 'Shelter Management',
      description: 'Manage shelter capacity, staff, and facilities with real-time occupancy tracking.'
    },
    {
      icon: <RescueIcon sx={{ fontSize: 40, color: '#ff9800' }} />,
      title: 'Rescue Operations',
      description: 'Coordinate emergency rescue operations with team management and cost tracking.'
    },
    {
      icon: <EcommerceIcon sx={{ fontSize: 40, color: '#f44336' }} />,
      title: 'E-Commerce Store',
      description: 'Sell pet products and supplies with inventory management and order processing.'
    },
    {
      icon: <PharmacyIcon sx={{ fontSize: 40, color: '#00bcd4' }} />,
      title: 'Pharmacy Management',
      description: 'Manage veterinary medications, prescriptions, and inventory with automated alerts.'
    },
    
    {
      icon: <TemporaryCareIcon sx={{ fontSize: 40, color: '#607d8b' }} />,
      title: 'Temporary Care',
      description: 'Connect pet owners with trusted caregivers for temporary pet care services.'
    },
    {
      icon: <VeterinaryIcon sx={{ fontSize: 40, color: '#9c27b0' }} />,
      title: 'Veterinary Services',
      description: 'Manage veterinary clinics, appointments, and comprehensive medical records.'
    }
  ]

  const benefits = [
    'Complete pet history tracking from medical records to previous owners',
    'Role-based access control for different management levels',
    'Real-time notifications and activity tracking',
    'Geospatial support for location-based services',
    'Mobile-responsive design for on-the-go management',
    'Secure authentication with JWT tokens',
    'Firebase integration for file storage',
    'Comprehensive reporting and analytics'
  ]

  return (
    <Box>
      {/* Navigation Bar */}
      <AppBar 
        position="sticky" 
        elevation={0} 
        sx={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.1)',
          color: '#333'
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <PetsIcon sx={{ fontSize: 32, color: '#4caf50', mr: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#333' }}>
              PetWelfare
            </Typography>
          </Box>

          {isMobile ? (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleMobileMenuToggle}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Button
                color="inherit"
                startIcon={<InfoIcon />}
                onClick={() => navigate('/about')}
                sx={{ color: '#333', fontWeight: 600 }}
              >
                About
              </Button>
              
              <Button
                color="inherit"
                startIcon={<ContactIcon />}
                onClick={() => navigate('/contact')}
                sx={{ color: '#333', fontWeight: 600 }}
              >
                Contact
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate('/login')}
                sx={{ color: '#333', fontWeight: 600 }}
              >
                Login
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/register')}
                sx={{ 
                  background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
                  boxShadow: '0 8px 24px rgba(37, 117, 252, 0.35)',
                  '&:hover': { background: 'linear-gradient(135deg, #5c0fc0 0%, #1e6ae6 100%)' }
                }}
              >
                Register
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Menu */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleMobileMenuToggle}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            backgroundColor: '#f8f9fa'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Menu
            </Typography>
            <IconButton onClick={handleMobileMenuToggle}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={handleMobileMenuToggle}>
                <ListItemText primary="Home" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => { navigate('/about'); handleMobileMenuToggle() }}>
                <ListItemText primary="About" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => { navigate('/contact'); handleMobileMenuToggle() }}>
                <ListItemText primary="Contact" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding sx={{ mt: 2 }}>
              <ListItemButton onClick={() => { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); handleMobileMenuToggle() }}>
                <ListItemText primary="Explore Features" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Dedicated About/Contact pages now handle content */}

      {/* Hero Section */}
      <Box
        sx={{
          background: 'radial-gradient(1200px 600px at -10% -10%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%), linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
          color: 'white',
          py: { xs: 10, md: 14 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' }, mb: 3 }}>
                  <PetsIcon sx={{ fontSize: 48, mr: 2 }} />
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: 0.2 }}>
                      PetWelfare Central
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9 }}>
                      Compassion. Care. Community.
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="h2" sx={{ fontWeight: 800, mb: 3, fontSize: { xs: '2.6rem', md: '3.8rem' }, lineHeight: 1.1 }}>
                  One Platform for Every Pet's Journey
                </Typography>
                
                <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, lineHeight: 1.7 }}>
                  From adoption to veterinary care, rescues to pharmacy, shelters to temporary care —
                  manage it all with a modern, centralized system built for pet welfare organizations.
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' }, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/register')}
                    sx={{
                      background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
                      boxShadow: '0 12px 30px rgba(37, 117, 252, 0.4)',
                      '&:hover': { background: 'linear-gradient(135deg, #5c0fc0 0%, #1e6ae6 100%)' },
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem'
                    }}
                  >
                    Get Started
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    sx={{
                      borderColor: 'rgba(255,255,255,0.85)',
                      color: 'white',
                      '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.12)' },
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem'
                    }}
                  >
                    Explore Features
                  </Button>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Card
                  sx={{
                    width: '100%',
                    height: 400,
                    borderRadius: 4,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <CardMedia
                    component="img"
                    height="400"
                    image="https://images.unsplash.com/photo-1450778869180-41d0601e046e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                    alt="Pet welfare management system"
                    sx={{
                      objectFit: 'cover',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(45deg, rgba(76,175,80,0.3), rgba(33,150,243,0.3))',
                        zIndex: 1
                      }
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(45deg, rgba(76,175,80,0.3), rgba(33,150,243,0.3))',
                      display: 'none',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.2rem',
                      fontWeight: 600
                    }}
                  >
                    Pet Welfare System
                  </Box>
                </Card>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box id="features" sx={{ py: { xs: 8, md: 12 }, background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 3, color: 'white' }}>
              Everything You Need — Unified
            </Typography>
            <Typography variant="h6" sx={{ maxWidth: 600, mx: 'auto', color: 'rgba(255,255,255,0.85)' }}>
              Premium, modern tools for adoption, rescue, veterinary, pharmacy, shelters and more
            </Typography>
          </Box>
          
          <Grid container spacing={4}>
            {features.slice(0, 3).map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    textAlign: 'center',
                    p: 3,
                    background: 'rgba(255,255,255,0.06)',
                    backdropFilter: 'saturate(160%) blur(10px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'white',
                    transition: 'all 0.35s ease',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: '0 24px 48px rgba(0,0,0,0.35)'
                    }
                  }}
                >
                  <Box sx={{ mb: 3 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" sx={{ lineHeight: 1.75, opacity: 0.9 }}>
                    {feature.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Benefits Section */}
      <Box sx={{ backgroundColor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" sx={{ fontWeight: 600, mb: 4 }}>
                Why Choose Our Platform?
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, color: 'rgba(0,0,0,0.6)' }}>
                Our comprehensive pet welfare management system provides everything you need to manage
                all aspects of pet care, from adoption processes to veterinary services.
              </Typography>
              <Box>
                {benefits.map((benefit, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CheckIcon sx={{ color: '#4caf50', mr: 2 }} />
                    <Typography variant="body1">{benefit}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  width: '100%',
                  height: 400,
                  background: 'linear-gradient(135deg, #4caf50 0%, #2196f3 100%)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <Box sx={{ textAlign: 'center', zIndex: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
                    Dashboard Preview
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    Comprehensive Management Interface
                  </Typography>
                </Box>
                <Box
                  sx={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    zIndex: 1
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -30,
                    left: -30,
                    width: 150,
                    height: 150,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)',
                    zIndex: 1
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: '#2c3e50' }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', color: 'white' }}>
            <Typography variant="h3" sx={{ fontWeight: 600, mb: 3 }}>
              Ready to Make a Difference?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Join thousands of pet lovers worldwide and start your journey today
            </Typography>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/register')}
              sx={{
                backgroundColor: '#4caf50',
                '&:hover': { backgroundColor: '#388e3c' },
                px: 6,
                py: 2,
                fontSize: '1.2rem'
              }}
            >
              Join Now
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ backgroundColor: 'grey.900', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PetsIcon sx={{ fontSize: 32, color: '#4caf50', mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Pet Welfare Management
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Comprehensive platform for managing all aspects of pet welfare and care.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Quick Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Contact
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Email: support@petwelfare.com
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Phone: +91 98765 43210
              </Typography>
            </Grid>
          </Grid>
          <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.2)', mt: 4, pt: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              © 2024 Pet Welfare Management System. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

export default Landing
