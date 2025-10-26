import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import { Lock as LockIcon, Security as SecurityIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const PasswordUpdate = ({ profileData, onUpdateSuccess, onUpdateError }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      onUpdateError('New password and confirmation do not match');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      onUpdateError('New password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      };

      // Only include current password if user has a password set
      if (profileData.hasPassword) {
        payload.currentPassword = formData.currentPassword;
      }

      await api.put('/profile/password', payload);
      
      // Show success message briefly
      onUpdateSuccess('Password updated successfully! Redirecting...');
      
      // Wait 2 seconds to show the message, then logout and redirect
      setTimeout(() => {
        logout();
        setTimeout(() => {
          navigate('/', { 
            state: { 
              message: 'Your password has been updated. Please login with your new password.' 
            }
          });
        }, 100)
      }, 2000);

    } catch (error) {
      console.error('Error updating password:', error);
      onUpdateError(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Password & Security
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Typography variant="body2" color="text.secondary">
              Authentication Method:
            </Typography>
          </Grid>
          <Grid item>
            <Chip 
              icon={<SecurityIcon />}
              label={profileData.authProvider === 'both' ? 'Email + Google' : 
                     profileData.authProvider === 'google' ? 'Google Only' : 'Email Only'} 
              color={profileData.authProvider === 'both' ? 'success' : 'primary'}
              size="small"
            />
          </Grid>
        </Grid>
      </Box>

      {!profileData.hasPassword && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You don't have a password set yet. You can set one now to enable email/password login.
        </Alert>
      )}

      <Divider sx={{ mb: 3 }} />

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {profileData.hasPassword && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Password"
                name="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={handleChange}
                required
                variant="outlined"
                InputProps={{
                  endAdornment: (
                    <Button
                      size="small"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? 'Hide' : 'Show'}
                    </Button>
                  )
                }}
              />
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="New Password"
              name="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={handleChange}
              required
              variant="outlined"
              helperText="Password must be at least 6 characters"
              InputProps={{
                endAdornment: (
                  <Button
                    size="small"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? 'Hide' : 'Show'}
                  </Button>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Confirm New Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <Button
                    size="small"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </Button>
                )
              }}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<LockIcon />}
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </Box>
      </form>

      <Box sx={{ mt: 4, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Security Tips:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Use a strong password with at least 8 characters
          • Include uppercase, lowercase, numbers, and symbols
          • Don't reuse passwords from other accounts
          • Consider using a password manager
        </Typography>
      </Box>
    </Box>
  );
};

export default PasswordUpdate;
