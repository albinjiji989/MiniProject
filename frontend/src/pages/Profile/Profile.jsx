import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import ProfileDetails from '../../components/Profile/ProfileDetails';
import PasswordUpdate from '../../components/Profile/PasswordUpdate';
import ProfilePicture from '../../components/Profile/ProfilePicture';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `profile-tab-${index}`,
    'aria-controls': `profile-tabpanel-${index}`,
  };
}

const Profile = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/profile');
      setProfileData(response.data.data.user);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleUpdateSuccess = (message) => {
    setSuccess(message);
    setError(null);
    fetchProfile(); // Refresh profile data
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleUpdateError = (message) => {
    setError(message);
    setSuccess(null);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!profileData) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Failed to load profile data</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Profile Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Manage your account settings and preferences
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile tabs">
            <Tab label="Profile Details" {...a11yProps(0)} />
            <Tab label="Password & Security" {...a11yProps(1)} />
            <Tab label="Profile Picture" {...a11yProps(2)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <ProfileDetails
            profileData={profileData}
            onUpdateSuccess={handleUpdateSuccess}
            onUpdateError={handleUpdateError}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <PasswordUpdate
            profileData={profileData}
            onUpdateSuccess={handleUpdateSuccess}
            onUpdateError={handleUpdateError}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <ProfilePicture
            profileData={profileData}
            onUpdateSuccess={handleUpdateSuccess}
            onUpdateError={handleUpdateError}
          />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Profile;