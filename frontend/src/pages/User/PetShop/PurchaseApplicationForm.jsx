import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Box,
  Typography,
  Grid,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
  Avatar,
  Chip,
  Stack
} from '@mui/material';
import {
  PhotoCamera,
  AttachFile,
  Delete as DeleteIcon,
  CheckCircle,
  ArrowBack,
  ArrowForward
} from '@mui/icons-material';
import { apiClient } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const steps = ['Personal Details', 'Upload Documents', 'Review & Submit'];

const PurchaseApplicationForm = ({ open, onClose, stock, selectedGender, quantity, onSuccess }) => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    alternatePhone: '',
    purpose: ''
  });
  
  const [userPhoto, setUserPhoto] = useState(null);
  const [userPhotoPreview, setUserPhotoPreview] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentPreviews, setDocumentPreviews] = useState([]);

  // Pre-fill user data on mount
  useEffect(() => {
    if (user && open) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    }
  }, [user, open]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setActiveStep(0);
      setError('');
      setUserPhoto(null);
      setUserPhotoPreview(null);
      setDocuments([]);
      setDocumentPreviews([]);
    }
  }, [open]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUserPhoto(file);
      setUserPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleDocumentChange = (e) => {
    const files = Array.from(e.target.files);
    setDocuments(prev => [...prev, ...files]);
    
    files.forEach(file => {
      setDocumentPreviews(prev => [...prev, {
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB',
        type: file.type
      }]);
    });
  };

  const handleRemoveDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
    setDocumentPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep = () => {
    if (activeStep === 0) {
      if (!formData.fullName || !formData.email || !formData.phone ||
          !formData.address.street || !formData.address.city || 
          !formData.address.state || !formData.address.pincode) {
        setError('Please fill in all required fields');
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return false;
      }
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(formData.phone.replace(/[^0-9]/g, ''))) {
        setError('Please enter a valid 10-digit phone number');
        return false;
      }
    }
    
    if (activeStep === 1) {
      if (!userPhoto) {
        setError('Please upload your photo');
        return false;
      }
      if (documents.length === 0) {
        setError('Please upload at least one document (ID proof/Address proof)');
        return false;
      }
    }
    
    setError('');
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError('');
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      const submitData = new FormData();
      // Send stockId instead of petInventoryItemId (stock._id is actually PetStock ID)
      submitData.append('stockId', stock._id || stock.stockId);
      submitData.append('selectedGender', selectedGender);
      submitData.append('personalDetails', JSON.stringify(formData));
      submitData.append('purpose', formData.purpose);
      
      if (userPhoto) {
        submitData.append('userPhoto', userPhoto);
      }
      
      documents.forEach(doc => {
        submitData.append('documents', doc);
      });

      const response = await apiClient.post('/petshop/user/purchase-applications', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        onSuccess(response.data.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please provide your contact details. We've pre-filled some information from your profile, but you can edit it.
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Street Address"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="City"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="State"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Pin Code"
                  name="address.pincode"
                  value={formData.address.pincode}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Alternate Phone (Optional)"
                  name="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Why do you want to purchase this pet? (Optional)"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  placeholder="Tell us why you'd like to bring this pet home..."
                />
              </Grid>
            </Grid>
          </Box>
        );
      
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please upload your photo and supporting documents (ID proof, address proof, etc.)
            </Typography>
            
            {/* User Photo Upload */}
            <Paper sx={{ p: 3, mb: 3, border: '2px dashed', borderColor: 'divider' }}>
              <Typography variant="subtitle2" gutterBottom>
                Your Photo *
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                {userPhotoPreview && (
                  <Avatar
                    src={userPhotoPreview}
                    sx={{ width: 80, height: 80 }}
                  />
                )}
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PhotoCamera />}
                >
                  {userPhoto ? 'Change Photo' : 'Upload Photo'}
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={handlePhotoChange}
                  />
                </Button>
              </Stack>
            </Paper>

            {/* Documents Upload */}
            <Paper sx={{ p: 3, border: '2px dashed', borderColor: 'divider' }}>
              <Typography variant="subtitle2" gutterBottom>
                Supporting Documents * (ID Proof, Address Proof, etc.)
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<AttachFile />}
                sx={{ mb: 2 }}
              >
                Add Document
                <input
                  hidden
                  accept="image/*,.pdf"
                  multiple
                  type="file"
                  onChange={handleDocumentChange}
                />
              </Button>

              {documentPreviews.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  {documentPreviews.map((doc, index) => (
                    <Chip
                      key={index}
                      label={`${doc.name} (${doc.size})`}
                      onDelete={() => handleRemoveDocument(index)}
                      deleteIcon={<DeleteIcon />}
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>
              )}
            </Paper>
          </Box>
        );
      
      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Please review your application before submitting
            </Alert>

            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom>Personal Details</Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Name:</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2">{formData.fullName}</Typography></Grid>
                
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Email:</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2">{formData.email}</Typography></Grid>
                
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Phone:</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2">{formData.phone}</Typography></Grid>
                
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Address:</Typography></Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {formData.address.street}, {formData.address.city}, {formData.address.state} - {formData.address.pincode}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom>Purchase Details</Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Pet:</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2">{stock?.name}</Typography></Grid>
                
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Gender:</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2">{selectedGender}</Typography></Grid>
                
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Quantity:</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2">{quantity}</Typography></Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Documents</Typography>
              <Typography variant="body2" color="text.secondary">
                Photo: {userPhoto ? '✓ Uploaded' : '✗ Not uploaded'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Documents: {documents.length} file(s) uploaded
              </Typography>
            </Paper>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box>
          <Typography variant="h5" component="div">Purchase Application</Typography>
          <Typography variant="body2" color="text.secondary">
            Complete this form to apply for purchasing
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {renderStepContent(activeStep)}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading} startIcon={<ArrowBack />}>
            Back
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button onClick={handleNext} variant="contained" endIcon={<ArrowForward />}>
            Next
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PurchaseApplicationForm;
