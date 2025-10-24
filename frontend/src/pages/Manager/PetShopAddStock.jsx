import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Paper, Typography, Button, Alert } from '@mui/material'

const PetShopAddStock = () => {
  const navigate = useNavigate()

  // Redirect to the new wizard
  React.useEffect(() => {
    navigate('/manager/petshop/wizard/basic')
  }, [navigate])

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Redirecting...</Typography>
      <Paper sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Redirecting to the new pet stock wizard...
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/manager/petshop/wizard/basic')}
        >
          Go to Wizard Now
        </Button>
      </Paper>
    </Box>
  )
}

export default PetShopAddStock
