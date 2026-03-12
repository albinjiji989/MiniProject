import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Badge as BadgeIcon,
  Send as SendIcon,
  ArrowBack as BackIcon,
  Pets as PetsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { apiClient } from '../../../services/api';

const RequestNameChange = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillPetCode = searchParams.get('petCode') || '';

  const [petCode, setPetCode] = useState(prefillPetCode);
  const [newName, setNewName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // My requests
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    loadMyRequests();
  }, []);

  const loadMyRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await apiClient.get('/pet-name-change/my-requests');
      if (response.data.success) {
        setMyRequests(response.data.data.requests || []);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!petCode.trim()) {
      setError('Pet code is required');
      return;
    }
    if (!/^[A-Z]{3}\d{5}$/.test(petCode.trim().toUpperCase())) {
      setError('Pet code must be 3 letters followed by 5 digits (e.g., HAK39168)');
      return;
    }
    if (!newName.trim()) {
      setError('New name is required');
      return;
    }
    if (newName.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    if (newName.trim().length > 50) {
      setError('Name must be less than 50 characters');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiClient.post('/pet-name-change/request', {
        petCode: petCode.trim().toUpperCase(),
        newName: newName.trim(),
        description: description.trim()
      });

      if (response.data.success) {
        setSuccess('Name change request submitted successfully! You will be notified when an admin reviews it.');
        setPetCode('');
        setNewName('');
        setDescription('');
        loadMyRequests(); // Refresh list
      } else {
        setError(response.data.message || 'Failed to submit request');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip icon={<PendingIcon />} label="Pending" color="warning" size="small" sx={{ fontWeight: 600 }} />;
      case 'approved':
        return <Chip icon={<CheckCircleIcon />} label="Approved" color="success" size="small" sx={{ fontWeight: 600 }} />;
      case 'rejected':
        return <Chip icon={<CancelIcon />} label="Rejected" color="error" size="small" sx={{ fontWeight: 600 }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate('/User/pets')}
        sx={{ mb: 3 }}
      >
        Back to My Pets
      </Button>

      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <BadgeIcon color="primary" sx={{ fontSize: 36 }} />
        Request Pet Name Change
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Submit a request to change your pet's name. An admin will review and approve your request.
      </Typography>

      {/* Request Form */}
      <Card sx={{ mb: 4, boxShadow: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>How it works:</strong> Submit your request with the pet code and desired new name. 
                An admin will review and approve or reject your request. Once approved, the new name will 
                be updated across all systems.
              </Typography>
            </Alert>

            <TextField
              fullWidth
              label="Pet Code"
              value={petCode}
              onChange={(e) => setPetCode(e.target.value.toUpperCase())}
              placeholder="e.g., HAK39168"
              disabled={loading}
              required
              inputProps={{ maxLength: 8, style: { textTransform: 'uppercase', fontFamily: 'monospace' } }}
              helperText="Enter the 8-character pet code (3 letters + 5 digits)"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="New Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Buddy, Luna, Max..."
              disabled={loading}
              required
              inputProps={{ maxLength: 50 }}
              helperText={`${newName.length}/50 characters`}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Reason for Change (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why do you want to change the name? (optional)"
              disabled={loading}
              multiline
              rows={3}
              inputProps={{ maxLength: 500 }}
              helperText={`${description.length}/500 characters`}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              disabled={loading || !petCode.trim() || !newName.trim()}
              sx={{ minWidth: 200 }}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* My Requests History */}
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PetsIcon /> My Requests
      </Typography>

      {loadingRequests ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : myRequests.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f9fafb' }}>
          <InfoIcon sx={{ fontSize: 48, color: '#9ca3af', mb: 1 }} />
          <Typography color="text.secondary">
            You haven't submitted any name change requests yet.
          </Typography>
        </Paper>
      ) : (
        <Card sx={{ boxShadow: 2 }}>
          <List disablePadding>
            {myRequests.map((request, index) => (
              <React.Fragment key={request._id}>
                {index > 0 && <Divider />}
                <ListItem sx={{ py: 2 }}>
                  <ListItemIcon>
                    <Box sx={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: 2, 
                      bgcolor: '#e0e7ff', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <PetsIcon sx={{ color: '#4338ca' }} />
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="body1" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                          {request.petCode}
                        </Typography>
                        {getStatusChip(request.status)}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          <strong>{request.currentName}</strong> → <strong style={{ color: '#059669' }}>{request.requestedName}</strong>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Submitted: {new Date(request.createdAt).toLocaleDateString()}
                          {request.reviewedAt && ` • Reviewed: ${new Date(request.reviewedAt).toLocaleDateString()}`}
                        </Typography>
                        {request.adminNotes && request.status !== 'pending' && (
                          <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', color: request.status === 'rejected' ? '#dc2626' : '#059669' }}>
                            Admin note: {request.adminNotes}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Card>
      )}
    </Container>
  );
};

export default RequestNameChange;
