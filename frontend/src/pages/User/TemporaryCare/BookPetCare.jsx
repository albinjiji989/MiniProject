import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import apiClient from '../../../services/api';

const BookPetCare = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const facilityId = searchParams.get('facilityId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pets, setPets] = useState([]);
  const [facility, setFacility] = useState(null);

  const [formData, setFormData] = useState({
    petId: '',
    facilityId: facilityId || '',
    startDate: '',
    endDate: '',
    careType: 'temporary',
    notes: '',
    dailyRate: 0,
    totalAmount: 0,
    advanceAmount: 0
  });

  useEffect(() => {
    loadPets();
    if (facilityId) {
      loadFacilityDetails();
    }
  }, [facilityId]);

  const loadPets = async () => {
    try {
      const response = await apiClient.get('/api/pets');
      setPets(response.data.pets || []);
    } catch (err) {
      console.error('Failed to load pets:', err);
    }
  };

  const loadFacilityDetails = async () => {
    try {
      const response = await apiClient.get(`/api/temporary-care/facilities/${facilityId}`);
      setFacility(response.data.facility);
      setFormData(prev => ({
        ...prev,
        dailyRate: response.data.facility.dailyRate
      }));
    } catch (err) {
      setError('Failed to load facility details');
    }
  };

  const calculateTotalAmount = (startDate, endDate, dailyRate) => {
    if (!startDate || !endDate || !dailyRate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return days * dailyRate;
  };

  const handleDateChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };

    if (newFormData.startDate && newFormData.endDate) {
      const total = calculateTotalAmount(
        newFormData.startDate,
        newFormData.endDate,
        newFormData.dailyRate
      );
      newFormData.totalAmount = total;
      newFormData.advanceAmount = Math.ceil(total * 0.5); // 50% advance
    }

    setFormData(newFormData);
  };

  const handleSubmit = async () => {
    if (!formData.petId || !formData.startDate || !formData.endDate) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/api/temporary-care/bookings', {
        petId: formData.petId,
        facilityId: formData.facilityId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        careType: formData.careType,
        notes: formData.notes,
        totalAmount: formData.totalAmount,
        advanceAmount: formData.advanceAmount
      });

      setSuccess('Booking created successfully! Redirecting to payment...');
      setTimeout(() => {
        navigate(`/temporary-care/payment/${response.data.booking._id}`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Book Pet Care Service
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      {facility && (
        <Card sx={{ mb: 4, bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>{facility.name}</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2"><strong>Location:</strong> {facility.location?.city}</Typography>
                <Typography variant="body2"><strong>Daily Rate:</strong> ₹{facility.dailyRate}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2"><strong>Capacity:</strong> {facility.capacity} pets</Typography>
                <Typography variant="body2"><strong>Rating:</strong> {facility.rating || 'N/A'} ⭐</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl fullWidth required>
            <InputLabel>Select Pet</InputLabel>
            <Select
              value={formData.petId}
              onChange={(e) => setFormData({ ...formData, petId: e.target.value })}
              label="Select Pet"
            >
              <MenuItem value="">Choose a pet</MenuItem>
              {pets.map((pet) => (
                <MenuItem key={pet._id} value={pet._id}>
                  {pet.name} ({pet.species})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
            required
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="End Date"
            type="date"
            value={formData.endDate}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
            required
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <FormControl fullWidth>
            <InputLabel>Care Type</InputLabel>
            <Select
              value={formData.careType}
              onChange={(e) => setFormData({ ...formData, careType: e.target.value })}
              label="Care Type"
            >
              <MenuItem value="temporary">Temporary</MenuItem>
              <MenuItem value="vacation">Vacation</MenuItem>
              <MenuItem value="emergency">Emergency</MenuItem>
              <MenuItem value="medical">Medical</MenuItem>
              <MenuItem value="foster">Foster Care</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Special Notes or Requirements"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            fullWidth
            multiline
            rows={4}
          />

          <Divider sx={{ my: 2 }} />

          {/* Cost Breakdown */}
          <Box sx={{ bgcolor: '#f9f9f9', p: 2, borderRadius: 1 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Cost Breakdown</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Daily Rate:</Typography>
              <Typography>₹{formData.dailyRate}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, fontWeight: 'bold' }}>
              <Typography>Total Amount:</Typography>
              <Typography sx={{ fontSize: '1.2em', color: 'primary.main' }}>
                ₹{formData.totalAmount.toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Advance (50%):</Typography>
              <Typography sx={{ color: 'success.main', fontWeight: 'bold' }}>
                ₹{formData.advanceAmount.toFixed(2)}
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={loading || !formData.petId || !formData.startDate || !formData.endDate}
            sx={{ mt: 3 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Proceed to Payment'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default BookPetCare;
