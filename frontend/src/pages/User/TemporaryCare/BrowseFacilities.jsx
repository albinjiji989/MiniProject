import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../../../contexts/AuthContext';
import apiClient from '../../../services/api';

const BrowseFacilities = () => {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);

  const [filterCity, setFilterCity] = useState('');
  const [cities, setCities] = useState([]);

  useEffect(() => {
    loadFacilities();
  }, [searchTerm, filterCity]);

  const loadFacilities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterCity) params.append('city', filterCity);

      const response = await apiClient.get(`/api/temporary-care/facilities?${params.toString()}`);
      const facilitiesData = response.data.facilities || [];
      setFacilities(facilitiesData);

      // Extract unique cities
      const uniqueCities = [...new Set(facilitiesData.map(f => f.location?.city).filter(Boolean))];
      setCities(uniqueCities);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load facilities');
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (facility) => {
    setSelectedFacility(facility);
    setDetailsDialog(true);
  };

  const handleBooking = (facility) => {
    // Navigate to booking form with facility pre-selected
    window.location.href = `/temporary-care/book?facilityId=${facility._id}`;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Find Pet Care Services
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Search and Filter */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
        <TextField
          label="Search by name or location"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
          }}
        />
        <FormControl fullWidth>
          <InputLabel>Filter by City</InputLabel>
          <Select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            label="Filter by City"
          >
            <MenuItem value="">All Cities</MenuItem>
            {cities.map((city) => (
              <MenuItem key={city} value={city}>{city}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Results */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : facilities.length === 0 ? (
        <Alert severity="info">No facilities found matching your criteria</Alert>
      ) : (
        <Grid container spacing={3}>
          {facilities.map((facility) => (
            <Grid item xs={12} md={6} lg={4} key={facility._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {facility.name}
                  </Typography>

                  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Rating value={facility.rating || 0} readOnly size="small" />
                    <Typography variant="body2" color="textSecondary">
                      {facility.reviews?.length || 0} reviews
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    📍 {facility.location?.city}, {facility.location?.state}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {facility.description?.substring(0, 100)}...
                  </Typography>

                  <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {facility.services?.slice(0, 3).map((service, idx) => (
                      <Chip key={idx} label={service} size="small" color="primary" variant="outlined" />
                    ))}
                  </Box>

                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Daily Rate:</strong> ₹{facility.dailyRate}/day
                  </Typography>

                  <Typography variant="body2">
                    <strong>Capacity:</strong> {facility.capacity} pets
                  </Typography>
                </CardContent>

                <CardActions>
                  <Button size="small" onClick={() => handleViewDetails(facility)}>
                    View Details
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleBooking(facility)}
                  >
                    Book Now
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedFacility?.name}</DialogTitle>
        <DialogContent>
          {selectedFacility && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Typography><strong>Address:</strong> {selectedFacility.location?.addressLine1}, {selectedFacility.location?.city}</Typography>
              <Typography><strong>Phone:</strong> {selectedFacility.phone}</Typography>
              <Typography><strong>Email:</strong> {selectedFacility.email}</Typography>
              <Typography><strong>Daily Rate:</strong> ₹{selectedFacility.dailyRate}</Typography>
              <Typography><strong>Capacity:</strong> {selectedFacility.capacity} pets</Typography>
              <Typography><strong>Description:</strong> {selectedFacility.description}</Typography>
              <Typography><strong>Services:</strong> {selectedFacility.services?.join(', ')}</Typography>
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2"><strong>Operating Hours:</strong></Typography>
                <Typography variant="body2">Opens: {selectedFacility.operatingHours?.openTime || 'N/A'}</Typography>
                <Typography variant="body2">Closes: {selectedFacility.operatingHours?.closeTime || 'N/A'}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              setDetailsDialog(false);
              handleBooking(selectedFacility);
            }}
          >
            Book Now
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BrowseFacilities;
