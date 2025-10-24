import React from 'react';
import { 
  Box, 
  Typography, 
  Button 
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon, 
  PriceChange as PriceChangeIcon, 
  FileUpload as FileUploadIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const HeaderSection = ({ setBulkPriceOpen, setCsvOpen }) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      mb: 3,
      p: 2,
      bgcolor: 'white',
      borderRadius: 2,
      boxShadow: 1
    }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/manager/petshop/inventory')}
        sx={{ 
          mr: 2,
          bgcolor: '#1976d2',
          color: 'white',
          '&:hover': {
            bgcolor: '#1565c0'
          }
        }}
      >
        Back
      </Button>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
          Inventory Management
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Manage your pet inventory and prepare pets for public viewing
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          startIcon={<PriceChangeIcon />}
          onClick={() => setBulkPriceOpen(true)}
          sx={{
            bgcolor: '#4caf50',
            '&:hover': {
              bgcolor: '#43a047'
            }
          }}
        >
          Bulk Price Update
        </Button>
        <Button
          variant="contained"
          startIcon={<FileUploadIcon />}
          onClick={() => setCsvOpen(true)}
          sx={{
            bgcolor: '#2196f3',
            '&:hover': {
              bgcolor: '#1e88e5'
            }
          }}
        >
          Import CSV
        </Button>
      </Box>
    </Box>
  );
};

export default HeaderSection;