import React from 'react';
import { Box, Grid, Card, CardContent, Typography, Avatar, alpha } from '@mui/material';
import {
  MedicalInformation as MedicalIcon,
  Hotel as HotelIcon,
  ShoppingCart as ShopIcon,
  VolunteerActivism as VolunteerIcon,
  SupportAgent as SupportIcon,
  Build as BuildIcon,
  LocalHospital as HospitalIcon,
  Vaccines as VaccineIcon,
  Store as StoreIcon,
  FavoriteOutlined as FavoriteIcon,
  ShoppingCartCheckout as CartIcon,
  Chat as ChatIcon,
  Pets as PetsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ServiceCategories = () => {
  const navigate = useNavigate();
  
  const serviceCategories = [
    {
      title: "Health & Medical",
      icon: <MedicalIcon />,
      color: "#FF6B6B",
      services: [
        { name: "Veterinary Appointments", icon: <HospitalIcon />, path: "/User/veterinary", description: "Book checkups and treatments" },
        { name: "Vaccination Records", icon: <VaccineIcon />, path: "/User/pets", description: "Track vaccination schedules" },
        { name: "Medical History", icon: <MedicalIcon />, path: "/User/pets", description: "View complete health records" },
        { name: "Pharmacy", icon: <VaccineIcon />, path: "/User/pharmacy", description: "Order pet medications" }
      ]
    },
    {
      title: "Care & Boarding",
      icon: <HotelIcon />,
      color: "#4ECDC4",
      services: [
        { name: "Temporary Care", icon: <HotelIcon />, path: "/User/temporary-care", description: "Short-term pet boarding" },
        { name: "Grooming Services", icon: <BuildIcon />, path: "/User/petshop", description: "Professional grooming" },
        { name: "Pet Walking", icon: <PetsIcon />, path: "/User/temporary-care", description: "Daily walks and exercise" }
      ]
    },
    {
      title: "Shopping & Adoption",
      icon: <ShopIcon />,
      color: "#45B7D1",
      services: [
        { name: "Pet Shop", icon: <StoreIcon />, path: "/User/petshop", description: "Buy pets and supplies" },
        { name: "Adoption Center", icon: <FavoriteIcon />, path: "/User/adoption", description: "Adopt loving pets" },
        { name: "E-commerce", icon: <CartIcon />, path: "/User/ecommerce", description: "Pet accessories and food" }
      ]
    },
    {
      title: "Community & Support",
      icon: <SupportIcon />,
      color: "#96CEB4",
      services: [
        { name: "Rescue Services", icon: <VolunteerIcon />, path: "/User/rescue", description: "Report and rescue animals" },
        { name: "Support Center", icon: <SupportIcon />, path: "/User/help", description: "Get help and support" },
        { name: "Community Forum", icon: <ChatIcon />, path: "/User/community", description: "Connect with other pet owners" }
      ]
    }
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <BuildIcon color="primary" />
        Pet Care Services
      </Typography>
      <Grid container spacing={3}>
        {serviceCategories.map((category, categoryIndex) => (
          <Grid item xs={12} md={6} key={categoryIndex}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ 
                    bgcolor: alpha(category.color, 0.1), 
                    color: category.color, 
                    width: 56, 
                    height: 56 
                  }}>
                    {category.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {category.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Everything you need for {category.title.toLowerCase()}
                    </Typography>
                  </Box>
                </Box>
                
                <Grid container spacing={2}>
                  {category.services.map((service, serviceIndex) => (
                    <Grid item xs={12} sm={6} key={serviceIndex}>
                      <Card 
                        sx={{ 
                          height: '100%', 
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': { 
                            transform: 'translateY(-2px)',
                            boxShadow: 2,
                            borderColor: category.color
                          },
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                        onClick={() => navigate(service.path)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                            <Avatar sx={{ 
                              bgcolor: alpha(category.color, 0.1), 
                              color: category.color, 
                              width: 36, 
                              height: 36 
                            }}>
                              {service.icon}
                            </Avatar>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {service.name}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {service.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ServiceCategories;