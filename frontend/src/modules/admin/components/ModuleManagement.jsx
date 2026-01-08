import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  MoreVert,
  Edit,
  Delete,
  Block,
  CheckCircle,
  LockReset,
  Store,
  Settings
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ModuleManagement = () => {
  const [modules, setModules] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedManager, setSelectedManager] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState(null);

  const [editFormData, setEditFormData] = useState({
    assignedModules: [],
    storeName: '',
    storeAddress: '',
    storeCity: '',
    storeState: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [modulesRes, managersRes] = await Promise.all([
        axios.get(`${API_URL}/admin/modules`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/admin/managers`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setModules(Array.isArray(modulesRes.data.data) ? modulesRes.data.data : []);
      setManagers(Array.isArray(managersRes.data.data) ? managersRes.data.data : []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
      setManagers([]);
      setModules([]);
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, manager) => {
    setAnchorEl(event.currentTarget);
    setSelectedManager(manager);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    setEditFormData({
      assignedModules: selectedManager.assignedModules.map(m => m._id),
      storeName: selectedManager.storeInfo?.storeName || '',
      storeAddress: selectedManager.storeInfo?.storeAddress || '',
      storeCity: selectedManager.storeInfo?.storeCity || '',
      storeState: selectedManager.storeInfo?.storeState || ''
    });
    setEditDialog(true);
    handleMenuClose();
  };

  const handleUpdateManager = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Update modules
      await axios.put(
        `${API_URL}/admin/managers/${selectedManager._id}/modules`,
        { assignedModules: editFormData.assignedModules },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update store info
      await axios.put(
        `${API_URL}/admin/managers/${selectedManager._id}/store`,
        {
          storeName: editFormData.storeName,
          storeAddress: editFormData.storeAddress,
          storeCity: editFormData.storeCity,
          storeState: editFormData.storeState
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEditDialog(false);
      fetchData();
    } catch (err) {
      console.error('Error updating manager:', err);
      setError('Failed to update manager');
    }
  };

  const handleToggleStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/admin/managers/${selectedManager._id}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      handleMenuClose();
      fetchData();
    } catch (err) {
      console.error('Error toggling status:', err);
      setError('Failed to update status');
    }
  };

  const handleResetPassword = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/admin/managers/${selectedManager._id}/reset-password`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResetPasswordData(response.data.data);
      handleMenuClose();
    } catch (err) {
      console.error('Error resetting password:', err);
      setError('Failed to reset password');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this manager?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/admin/managers/${selectedManager._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      handleMenuClose();
      fetchData();
    } catch (err) {
      console.error('Error deleting manager:', err);
      setError('Failed to delete manager');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Module Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Modules Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {modules.map((module) => (
          <Grid item xs={12} sm={6} md={3} key={module._id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Store sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">{module.name}</Typography>
                </Box>
                <Chip
                  label={`${module.assignedManagers || 0} Managers`}
                  size="small"
                  color="primary"
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Managers Table */}
      <Paper>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">All Managers</Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Store</strong></TableCell>
                <TableCell><strong>Store ID</strong></TableCell>
                <TableCell><strong>Assigned Modules</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {managers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">
                      No managers found. Invite one to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                managers.map((manager) => (
                  <TableRow key={manager._id} hover>
                    <TableCell>{manager.name}</TableCell>
                    <TableCell>{manager.email}</TableCell>
                    <TableCell>{manager.storeInfo?.storeName || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={manager.storeInfo?.storeId || '-'}
                        size="small"
                        sx={{ fontFamily: 'monospace' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {manager.assignedModules?.map((module) => (
                          <Chip
                            key={module._id}
                            label={module.name}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={manager.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={manager.isActive ? 'success' : 'default'}
                        icon={manager.isActive ? <CheckCircle /> : <Block />}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={(e) => handleMenuOpen(e, manager)}>
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditClick}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          Edit Manager
        </MenuItem>
        <MenuItem onClick={handleToggleStatus}>
          {selectedManager?.isActive ? (
            <>
              <Block sx={{ mr: 1 }} fontSize="small" />
              Deactivate
            </>
          ) : (
            <>
              <CheckCircle sx={{ mr: 1 }} fontSize="small" />
              Activate
            </>
          )}
        </MenuItem>
        <MenuItem onClick={handleResetPassword}>
          <LockReset sx={{ mr: 1 }} fontSize="small" />
          Reset Password
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Delete Manager
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Manager</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Assigned Modules</InputLabel>
              <Select
                multiple
                value={editFormData.assignedModules}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    assignedModules: e.target.value
                  })
                }
                input={<OutlinedInput label="Assigned Modules" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const module = modules.find((m) => m._id === value);
                      return <Chip key={value} label={module?.name} size="small" />;
                    })}
                  </Box>
                )}
              >
                {modules.map((module) => (
                  <MenuItem key={module._id} value={module._id}>
                    <Checkbox checked={editFormData.assignedModules.includes(module._id)} />
                    <ListItemText primary={module.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Store Name"
              value={editFormData.storeName}
              onChange={(e) =>
                setEditFormData({ ...editFormData, storeName: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Store Address"
              value={editFormData.storeAddress}
              onChange={(e) =>
                setEditFormData({ ...editFormData, storeAddress: e.target.value })
              }
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={editFormData.storeCity}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, storeCity: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="State"
                  value={editFormData.storeState}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, storeState: e.target.value })
                  }
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateManager} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={!!resetPasswordData}
        onClose={() => setResetPasswordData(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'warning.main', color: 'white' }}>
          Password Reset Successful
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Important:</strong> Share this temporary password with the manager.
            It will not be shown again!
          </Alert>

          <Box sx={{ bgcolor: '#f5f5f5', p: 3, borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              New Temporary Password
            </Typography>
            <Typography
              variant="h4"
              fontWeight="bold"
              fontFamily="monospace"
              color="error.main"
              sx={{ mb: 2 }}
            >
              {resetPasswordData?.temporaryPassword}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Email: {resetPasswordData?.email}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPasswordData(null)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ModuleManagement;
