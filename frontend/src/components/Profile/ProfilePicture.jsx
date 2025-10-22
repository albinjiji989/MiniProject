import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  Grid,
  Alert,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import { 
  PhotoCamera as PhotoCameraIcon, 
  Save as SaveIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  CloudUpload as CloudUploadIcon,
  Google as GoogleIcon
} from '@mui/icons-material';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const ProfilePicture = ({ profileData, onUpdateSuccess, onUpdateError }) => {
  const { refreshUser } = useAuth();
  const [profilePicture, setProfilePicture] = useState(profileData.profilePicture || '');
  const [urlInput, setUrlInput] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchingImages, setFetchingImages] = useState(true);
  const [googlePicture, setGooglePicture] = useState(profileData.googleProfilePicture || null);
  const [useCustomPicture, setUseCustomPicture] = useState(profileData.useCustomProfilePicture || false);

  useEffect(() => {
    fetchUploadedImages();
  }, []);

  const fetchUploadedImages = async () => {
    try {
      setFetchingImages(true);
      const response = await api.get('/profile/pictures');
      setUploadedImages(response.data.data.images || []);
    } catch (error) {
      console.error('Error fetching uploaded images:', error);
    } finally {
      setFetchingImages(false);
    }
  };

  const handleUrlChange = (e) => {
    setUrlInput(e.target.value);
  };

  const handleSetFromUrl = async () => {
    if (!urlInput) return;
    
    setLoading(true);
    try {
      await api.put('/profile/picture', { profilePicture: urlInput });
      setProfilePicture(urlInput);
      setUrlInput('');
      onUpdateSuccess('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error updating profile picture:', error);
      onUpdateError(error.response?.data?.message || 'Failed to update profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      onUpdateError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onUpdateError('Please upload an image file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await api.post('/profile/upload-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      onUpdateSuccess('Image uploaded successfully!');
      await fetchUploadedImages();
    } catch (error) {
      console.error('Error uploading image:', error);
      onUpdateError(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectImage = async (imageUrl) => {
    setLoading(true);
    try {
      await api.put('/profile/picture', { profilePicture: imageUrl });
      setProfilePicture(imageUrl);
      setUseCustomPicture(true);
      
      // Refresh auth context to update user data everywhere
      await refreshUser();
      
      onUpdateSuccess('Profile picture updated successfully! Refreshing...');
      
      // Small delay to show success message, then reload
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error updating profile picture:', error);
      onUpdateError(error.response?.data?.message || 'Failed to update profile picture');
      setLoading(false);
    }
  };

  const handleUseGooglePicture = async () => {
    if (!googlePicture) {
      onUpdateError('No Google profile picture available');
      return;
    }
    
    setLoading(true);
    try {
      await api.put('/profile/picture', { useGoogle: true });
      setProfilePicture(googlePicture);
      setUseCustomPicture(false);
      
      // Refresh auth context to update user data everywhere
      await refreshUser();
      
      onUpdateSuccess('Reverted to Google profile picture! Refreshing...');
      
      // Small delay to show success message, then reload
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error reverting to Google picture:', error);
      onUpdateError(error.response?.data?.message || 'Failed to revert to Google picture');
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageUrl) => {
    try {
      await api.delete('/profile/picture', { data: { imageUrl } });
      onUpdateSuccess('Image deleted successfully!');
      await fetchUploadedImages();
      
      // If deleted image was the current profile picture, clear it
      if (profilePicture === imageUrl) {
        setProfilePicture('');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      onUpdateError(error.response?.data?.message || 'Failed to delete image');
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Profile Picture
      </Typography>
      
      <Grid container spacing={4}>
        {/* Current Profile Picture */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Current Picture
            </Typography>
            <Avatar
              src={profilePicture}
              sx={{ 
                width: 150, 
                height: 150, 
                mb: 2,
                border: 3,
                borderColor: 'primary.main',
                boxShadow: 3
              }}
            >
              {profileData.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            
            <Button
              variant="contained"
              component="label"
              startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
              disabled={uploading}
              fullWidth
            >
              {uploading ? 'Uploading...' : 'Upload New Image'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </Button>

            {googlePicture && (
              <>
                <Divider sx={{ width: '100%', my: 1 }} />
                <Button
                  variant="outlined"
                  startIcon={<GoogleIcon />}
                  onClick={handleUseGooglePicture}
                  disabled={loading || !useCustomPicture}
                  fullWidth
                  sx={{
                    borderColor: !useCustomPicture ? 'success.main' : undefined,
                    color: !useCustomPicture ? 'success.main' : undefined
                  }}
                >
                  {!useCustomPicture ? 'Using Google Picture' : 'Use Google Picture'}
                </Button>
                {!useCustomPicture && (
                  <Typography variant="caption" color="success.main">
                    ✓ Currently using Google profile picture
                  </Typography>
                )}
              </>
            )}
          </Box>
        </Grid>

        {/* Add from URL */}
        <Grid item xs={12} md={8}>
          <Typography variant="subtitle2" gutterBottom>
            Add Picture from URL
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="Image URL"
              value={urlInput}
              onChange={handleUrlChange}
              placeholder="https://example.com/image.jpg"
              variant="outlined"
            />
            <Button
              variant="outlined"
              onClick={handleSetFromUrl}
              disabled={!urlInput || loading}
              sx={{ minWidth: 100 }}
            >
              {loading ? 'Setting...' : 'Set'}
            </Button>
          </Box>

          {/* Uploaded Images Gallery */}
          <Typography variant="subtitle2" gutterBottom>
            Your Uploaded Images ({uploadedImages.length})
          </Typography>
          
          {fetchingImages ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : uploadedImages.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No uploaded images yet. Upload your first image above!
            </Alert>
          ) : (
            <ImageList sx={{ maxHeight: 400 }} cols={3} gap={8}>
              {uploadedImages.map((imageUrl, index) => (
                <ImageListItem key={index} sx={{ cursor: 'pointer', position: 'relative' }}>
                  <img
                    src={imageUrl}
                    alt={`Uploaded ${index + 1}`}
                    loading="lazy"
                    style={{ 
                      borderRadius: 8, 
                      border: profilePicture === imageUrl ? '3px solid #1976d2' : 'none',
                      aspectRatio: '1/1',
                      objectFit: 'cover'
                    }}
                    onClick={() => handleSelectImage(imageUrl)}
                  />
                  {profilePicture === imageUrl && (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Active"
                      color="primary"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        fontWeight: 700
                      }}
                    />
                  )}
                  <ImageListItemBar
                    sx={{ borderRadius: '0 0 8px 8px' }}
                    actionIcon={
                      <IconButton
                        sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(imageUrl);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  />
                </ImageListItem>
              ))}
            </ImageList>
          )}
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Profile Picture Guidelines:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Upload images (max 5MB) or add from URL<br />
          • Click on any uploaded image to set it as your profile picture<br />
          • Delete unwanted images using the delete icon<br />
          • Recommended size: 400x400 pixels or larger<br />
          • Supported formats: JPG, PNG, GIF
        </Typography>
      </Box>
    </Box>
  );
};

export default ProfilePicture;
