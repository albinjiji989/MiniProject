import React, { useEffect } from 'react'
import { Box, Typography, Card, CardContent, Button, Chip, Grid, Alert, CircularProgress } from '@mui/material'
import { 
  CheckCircle as CheckIcon, 
  Pets as PetsIcon,
  Home as HomeIcon,
  ListAlt as ListIcon,
  Add as AddIcon,
  MedicalServices as MedicalIcon,
  History as HistoryIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material'
import { useLocation, useNavigate } from 'react-router-dom'

const AddPetSuccess = () => {
  const { state } = useLocation()
  const navigate = useNavigate()
  const petId = state?.petId
  const petCode = state?.petCode
  const name = state?.name

  // Auto-redirect to pet details after 10 seconds
  useEffect(() => {
    if (petId) {
      const timer = setTimeout(() => {
        navigate(`/User/pets/${petId}`)
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [petId, navigate])

  const actionButtons = [
    {
      title: "View Pet Profile",
      description: "See your pet's details and manage information",
      icon: <PetsIcon />,
      action: () => petId && navigate(`/User/pets/${petId}`),
      variant: "contained",
      color: "primary",
      required: petId
    },
    {
      title: "Add Medical Records",
      description: "Record vaccinations, treatments, and health info",
      icon: <MedicalIcon />,
      action: () => petId && navigate(`/User/pets/${petId}/medical-history`),
      variant: "outlined",
      color: "primary",
      required: petId
    },
    {
      title: "View All My Pets",
      description: "See all pets you own in one place",
      icon: <ListIcon />,
      action: () => navigate('/User/pets'),
      variant: "outlined",
      color: "secondary",
      required: true
    },
    {
      title: "Add Another Pet",
      description: "Register another pet in the system",
      icon: <AddIcon />,
      action: () => navigate('/User/pets/add'),
      variant: "outlined",
      color: "success",
      required: true
    }
  ]

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
            <CheckIcon color="success" sx={{ fontSize: 48 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Success!</Typography>
          </Box>

          <Typography variant="h5" sx={{ mb: 1 }}>
            {name ? `"${name}"` : 'Your pet'} has been added successfully
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Your pet is now registered in our system and ready for care services
          </Typography>

          {petCode && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Pet Code</Typography>
              <Chip 
                label={petCode} 
                color="primary" 
                variant="filled" 
                sx={{ 
                  fontFamily: 'monospace', 
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  py: 1,
                  px: 2
                }} 
              />
            </Box>
          )}

          <Alert severity="info" sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimeIcon />
              <Typography variant="body2">
                You will be automatically redirected to your pet's profile in 10 seconds
              </Typography>
            </Box>
          </Alert>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <HomeIcon color="primary" />
        Next Steps
      </Typography>

      <Grid container spacing={2}>
        {actionButtons.map((button, index) => (
          button.required && (
            <Grid item xs={12} sm={6} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    transform: 'translateY(-3px)',
                    boxShadow: 3
                  }
                }}
                onClick={button.action}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Box sx={{ 
                      p: 1, 
                      borderRadius: 2, 
                      bgcolor: 'primary.main', 
                      color: 'white',
                      display: 'flex'
                    }}>
                      {button.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {button.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {button.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )
        ))}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/User/dashboard')}
          startIcon={<HomeIcon />}
        >
          Go to Dashboard
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/User/pets')}
          startIcon={<ListIcon />}
        >
          View All Pets
        </Button>
      </Box>
    </Box>
  )
}

export default AddPetSuccess