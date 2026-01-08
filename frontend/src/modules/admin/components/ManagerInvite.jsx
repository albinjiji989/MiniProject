import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Card,
  CardContent,
  IconButton,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText
} from '@mui/material';
import {
  Add,
  Store,
  Email,
  ContentCopy,
  CheckCircle
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ManagerInvite = () => {
  const [modules, setModules] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const [copiedPassword, setCopiedPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    assignedModules: [],
    storeName: '',
    storeAddress: '',
    storeCity: '',
    storeState: ''
  });

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/modules`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModules(response.data.data || []);
    } catch (err) {
      console.error('Error fetching modules:', err);
      setError('Failed to load modules');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleModuleChange = (event) => {
    const value = event.target.value;
    setFormData({
      ...formData,
      assignedModules: typeof value === 'string' ? value.split(',') : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/admin/managers/invite`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSuccess(response.data.data);
        setFormData({
          name: '',
          email: '',
          phone: '',
          assignedModules: [],
          storeName: '',
          storeAddress: '',
          storeCity: '',
          storeState: ''
        });
      }
    } catch (err) {
      console.error('Error inviting manager:', err);
      setError(err.response?.data?.message || 'Failed to invite manager');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const copyAllCredentials = () => {
    const credentials = `
Manager Account Created

Name: ${success.manager.name}
Email: ${success.loginInstructions.email}
Temporary Password: ${success.temporaryPassword}
Store Name: ${success.manager.storeInfo.storeName}
Store ID: ${success.manager.storeInfo.storeId}

Login URL: ${success.loginInstructions.url}

⚠️ ${success.loginInstructions.message}
    `.trim();
    
    copyToClipboard(credentials);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Invite Manager
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Invite Form */}
      <Paper sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Personal Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="email"
                label="Email Address"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            {/* Module Assignment */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Module Assignment
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Assign Modules</InputLabel>
                <Select
                  multiple
                  value={formData.assignedModules}
                  onChange={handleModuleChange}
                  input={<OutlinedInput label="Assign Modules" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const module = modules.find((m) => m._id === value);
                        return (
                          <Chip key={value} label={module?.name || value} size="small" />
                        );
                      })}
                    </Box>
                  )}
                  disabled={loading}
                >
                  {modules.map((module) => (
                    <MenuItem key={module._id} value={module._id}>
                      <Checkbox checked={formData.assignedModules.indexOf(module._id) > -1} />
                      <ListItemText
                        primary={module.name}
                        secondary={module.description}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Store Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Store Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Store Name"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                disabled={loading}
                placeholder="e.g., John's Pet Store"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Store Address"
                name="storeAddress"
                value={formData.storeAddress}
                onChange={handleChange}
                disabled={loading}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="City"
                name="storeCity"
                value={formData.storeCity}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="State"
                name="storeState"
                value={formData.storeState}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || formData.assignedModules.length === 0}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6741a0 100%)'
                  }
                }}
                startIcon={loading ? <CircularProgress size={20} /> : <Add />}
              >
                {loading ? 'Creating Account...' : 'Invite Manager'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Success Dialog */}
      <Dialog
        open={!!success}
        onClose={() => setSuccess(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'success.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircle sx={{ mr: 1 }} />
            Manager Invited Successfully!
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <strong>Important:</strong> Copy these credentials and share them with the manager. 
            The temporary password will not be shown again!
          </Alert>

          <Card variant="outlined" sx={{ mb: 2, bgcolor: '#f5f5f5' }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Manager Name
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {success?.manager.name}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Email
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" fontWeight="bold" sx={{ flex: 1 }}>
                      {success?.loginInstructions.email}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(success?.loginInstructions.email)}
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Temporary Password
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      fontFamily="monospace"
                      color="error.main"
                      sx={{ flex: 1 }}
                    >
                      {success?.temporaryPassword}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(success?.temporaryPassword)}
                      color={copiedPassword ? 'success' : 'default'}
                    >
                      {copiedPassword ? <CheckCircle /> : <ContentCopy />}
                    </IconButton>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Store ID
                  </Typography>
                  <Chip
                    label={success?.manager.storeInfo.storeId}
                    sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Store Name
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {success?.manager.storeInfo.storeName}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Login URL
                  </Typography>
                  <Typography variant="body2" color="primary">
                    {success?.loginInstructions.url}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Assigned Modules
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {success?.manager.assignedModules.map((module) => (
                      <Chip
                        key={module._id}
                        label={module.name}
                        color="primary"
                        size="small"
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<ContentCopy />}
            onClick={copyAllCredentials}
            sx={{ mt: 2 }}
          >
            Copy All Credentials
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuccess(null)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManagerInvite;
