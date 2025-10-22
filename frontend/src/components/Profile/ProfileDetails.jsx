import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  Chip,
  Divider
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { api } from '../../services/api';

const ProfileDetails = ({ profileData, onUpdateSuccess, onUpdateError }) => {
  const [formData, setFormData] = useState({
    name: profileData?.name || '',
    phone: profileData?.phone || '',
    address: profileData?.address?.street || '',
    city: profileData?.address?.city || '',
    state: profileData?.address?.state || '',
    zipCode: profileData?.address?.zipCode || '',
    country: profileData?.address?.country || ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare address object
      const addressData = {
        street: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country
      };

      // Prepare submission data
      const submitData = {
        name: formData.name,
        phone: formData.phone,
        address: addressData
      };

      await api.put('/profile/details', submitData);
      onUpdateSuccess('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      onUpdateError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Personal Information
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Typography variant="body2" color="text.secondary">
              Email:
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="body1" fontWeight="medium">
              {profileData?.email || 'N/A'}
            </Typography>
          </Grid>
          <Grid item>
            <Chip 
              label={profileData?.authProvider || 'N/A'} 
              color={profileData?.authProvider === 'both' ? 'success' : 'primary'}
              size="small"
            />
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              variant="outlined"
              placeholder="+91 98765 43210"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Street Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              variant="outlined"
              placeholder="123 Main Street"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              variant="outlined"
              placeholder="New York"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="State/Province"
              name="state"
              value={formData.state}
              onChange={handleChange}
              variant="outlined"
              placeholder="NY"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="ZIP/Postal Code"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              variant="outlined"
              placeholder="10001"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              variant="outlined"
              placeholder="United States"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default ProfileDetails;
