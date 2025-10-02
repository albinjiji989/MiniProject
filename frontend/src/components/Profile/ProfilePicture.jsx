import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  Grid,
  Alert
} from '@mui/material';
import { PhotoCamera as PhotoCameraIcon, Save as SaveIcon } from '@mui/icons-material';
import { api } from '../../services/api';

const ProfilePicture = ({ profileData, onUpdateSuccess, onUpdateError }) => {
  const [profilePicture, setProfilePicture] = useState(profileData.profilePicture || '');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setProfilePicture(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put('/profile/picture', { profilePicture });
      onUpdateSuccess('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error updating profile picture:', error);
      onUpdateError(error.response?.data?.message || 'Failed to update profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, you would upload the file to a cloud storage service
      // For now, we'll just show an alert
      onUpdateError('File upload not implemented yet. Please use a URL instead.');
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Profile Picture
      </Typography>
      
      <Grid container spacing={4} alignItems="center">
        <Grid item xs={12} sm={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar
              src={profilePicture}
              sx={{ 
                width: 120, 
                height: 120, 
                mb: 2,
                border: 2,
                borderColor: 'divider'
              }}
            >
              {profileData.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            
            <Button
              variant="outlined"
              component="label"
              startIcon={<PhotoCameraIcon />}
              size="small"
            >
              Upload Image
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileUpload}
              />
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} sm={8}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Currently, you can only update your profile picture using an image URL. 
            File upload functionality will be added in a future update.
          </Alert>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Profile Picture URL"
              value={profilePicture}
              onChange={handleChange}
              variant="outlined"
              placeholder="https://example.com/your-image.jpg"
              helperText="Enter a valid image URL"
              sx={{ mb: 2 }}
            />

            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              {loading ? 'Saving...' : 'Save Picture'}
            </Button>
          </form>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Profile Picture Guidelines:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Use a clear, well-lit photo of yourself
          • Square images work best (1:1 aspect ratio)
          • Recommended size: 400x400 pixels or larger
          • Supported formats: JPG, PNG, GIF
          • Make sure the image URL is publicly accessible
        </Typography>
      </Box>
    </Box>
  );
};

export default ProfilePicture;
