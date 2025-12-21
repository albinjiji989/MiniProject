import React from 'react';
import { Container, Typography, Grid, Card, CardContent, Button, Chip, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';

const PetManagerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Pet Management Dashboard
      </Typography>
      
      {/* Store Identity Badge */}
      {user?.role?.includes('manager') && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Chip color="primary" label={`Store ID: ${user?.storeId || 'Pending assignment'}`} />
          <Chip color={user?.storeName ? 'success' : 'warning'} label={`Store Name: ${user?.storeName || 'Not set'}`} />
        </Box>
      )}
      
      <Grid container spacing={3}>
        {/* Pet Management Card */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pet Management
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Manage pets in the system, including adding new pets, updating information, and tracking ownership.
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => handleNavigation('/manager/pets')}
                fullWidth
              >
                Manage Pets
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Centralized Registry Card */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Centralized Registry
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Access the centralized pet registry to view and manage pet records across all modules.
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => handleNavigation('/manager/centralized-pets')}
                fullWidth
              >
                View Registry
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Reports Card */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Reports & Analytics
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Generate reports on pet statistics, ownership transfers, and system usage.
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => handleNavigation('/manager/pet-reports')}
                fullWidth
              >
                View Reports
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PetManagerDashboard;