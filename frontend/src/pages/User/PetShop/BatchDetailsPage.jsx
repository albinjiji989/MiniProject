import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
  Skeleton
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ExpandMore as ExpandMoreIcon,
  ShoppingCart as CartIcon,
  Info as InfoIcon,
  LocalShipping as ShippingIcon,
  VerifiedUser as VerifiedIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  StarRate as StarIcon
} from '@mui/icons-material';
import { apiClient, resolveMediaUrl } from '../../../services/api';

const BatchDetailsPage = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [batch, setBatch] = useState(location.state?.batch || null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(!batch);
  const [error, setError] = useState('');
  const [selectedPet, setSelectedPet] = useState(null);
  const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!batch) {
      loadBatchDetails();
    } else {
      loadInventory();
    }
  }, []);

  const loadBatchDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/petshop/manager/batches/${batchId}`);
      setBatch(response.data.data);
      loadInventory(response.data.data._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load batch details');
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async (id = batchId) => {
    try {
      const response = await apiClient.get(`/petshop/manager/batches/${id}/inventory`);
      setInventory(response.data.data || []);
    } catch (err) {
      console.error('Error loading inventory:', err);
    }
  };

  const handleReservePet = (pet) => {
    setSelectedPet(pet);
    setReserveDialogOpen(true);
  };

  const confirmReservation = async () => {
    try {
      if (!selectedPet) return;

      const payload = {
        petId: selectedPet._id,
        quantity,
        notes,
        reservedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };

      const response = await apiClient.post(
        `/petshop/manager/batches/${batch._id}/reserve`,
        payload
      );

      // Success - redirect to checkout
      navigate('/user/petshop/checkout', {
        state: { reservation: response.data.data }
      });

      setReserveDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reserve pet');
    }
  };

  const handleFavoritToggle = () => {
    const favorites = JSON.parse(localStorage.getItem('petshop_favorites') || '[]');
    if (isFavorite) {
      const index = favorites.indexOf(batch._id);
      if (index > -1) favorites.splice(index, 1);
    } else {
      if (!favorites.includes(batch._id)) favorites.push(batch._id);
    }
    localStorage.setItem('petshop_favorites', JSON.stringify(favorites));
    setIsFavorite(!isFavorite);
  };

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={400} sx={{ mb: 2 }} />
        <Skeleton variant="text" sx={{ mb: 1 }} />
        <Skeleton variant="text" sx={{ mb: 4 }} />
      </Container>
    );
  }

  if (error || !batch) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Batch not found'}</Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/user/petshop/dashboard')}
          sx={{ mt: 2 }}
        >
          Back to PetShop
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/user/petshop/dashboard')}
        >
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700, flex: 1 }}>
          {batch.breedId?.name || 'Pet Batch'}
        </Typography>
        <Button
          startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          color={isFavorite ? 'error' : 'inherit'}
          onClick={handleFavoritToggle}
        >
          {isFavorite ? 'Saved' : 'Save'}
        </Button>
      </Stack>

      <Grid container spacing={4}>
        {/* Left: Images & Info */}
        <Grid item xs={12} md={6}>
          {/* Main Image */}
          <Card sx={{ mb: 3 }}>
            <CardMedia
              component="img"
              image={
                batch.images?.[0]
                  ? resolveMediaUrl(batch.images[0])
                  : batch.samplePets?.[0]?.imageIds?.[0]
                  ? resolveMediaUrl(batch.samplePets[0].imageIds[0])
                  : '/placeholder-pet.svg'
              }
              alt={batch.breedId?.name}
              sx={{ height: 400, objectFit: 'cover' }}
            />
          </Card>

          {/* Gallery Thumbnails */}
          {batch.images?.length > 1 && (
            <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
              {batch.images.map((image, idx) => (
                <Card
                  key={idx}
                  sx={{
                    width: 80,
                    height: 80,
                    cursor: 'pointer',
                    border: '2px solid #e0e0e0'
                  }}
                >
                  <CardMedia
                    component="img"
                    image={resolveMediaUrl(image)}
                    alt={`Gallery ${idx + 1}`}
                    sx={{ height: '100%', objectFit: 'cover' }}
                  />
                </Card>
              ))}
            </Stack>
          )}

          {/* Batch Info */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <InfoIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Batch Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Species
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {batch.speciesId?.displayName}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Category
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {batch.category}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Age Range
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {batch.ageRange?.min}-{batch.ageRange?.max} {batch.ageRange?.unit}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Gender Distribution
                  </Typography>
                  <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      👨 Male: {batch.counts?.male || 0}
                    </Typography>
                    <Typography variant="body2">
                      👩 Female: {batch.counts?.female || 0}
                    </Typography>
                    <Typography variant="body2">
                      ❓ Unknown: {batch.counts?.unknown || 0}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Right: Pricing & Details */}
        <Grid item xs={12} md={6}>
          {/* Price Card */}
          <Card sx={{ mb: 3, backgroundColor: '#f5f5f5' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary">
                Price Range
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                ₹{batch.price?.min?.toLocaleString()} - ₹
                {batch.price?.max?.toLocaleString()}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">
                    Available Pets
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {batch.availability?.available || 0} / {batch.counts?.total}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">
                    Sold Percentage
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {batch.soldPercentage || 0}%
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Status Chips */}
          <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
            <Chip
              icon={<VerifiedIcon />}
              label="Verified Batch"
              color="success"
              variant="outlined"
            />
            <Chip
              icon={<ShippingIcon />}
              label="Free Shipping"
              variant="outlined"
            />
          </Stack>

          {/* Features */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                What's Included
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">✓ Health Certificate</Typography>
                <Typography variant="body2">✓ Initial Vaccination</Typography>
                <Typography variant="body2">✓ 7-Day Money Back Guarantee</Typography>
                <Typography variant="body2">✓ 24/7 Customer Support</Typography>
              </Stack>
            </CardContent>
          </Card>

          {/* CTA Buttons */}
          {batch.status !== 'sold_out' && (
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<CartIcon />}
              onClick={() => setReserveDialogOpen(true)}
              sx={{ mb: 2 }}
            >
              Select Pet to Reserve
            </Button>
          )}
          {batch.status === 'sold_out' && (
            <Alert severity="warning">This batch is currently sold out</Alert>
          )}
        </Grid>
      </Grid>

      {/* Inventory Table */}
      {inventory.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Available Pets in This Batch
          </Typography>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell>Age</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventory
                  .filter((pet) => !pet.reservedBy)
                  .map((pet) => (
                    <TableRow key={pet._id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {pet.petName}
                        </Typography>
                      </TableCell>
                      <TableCell>{pet.gender || 'Unknown'}</TableCell>
                      <TableCell>{pet.ageMonths} months</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        ₹{pet.price?.toLocaleString()}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleReservePet(pet)}
                        >
                          Reserve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Reservation Dialog */}
      <Dialog
        open={reserveDialogOpen}
        onClose={() => {
          setReserveDialogOpen(false);
          setSelectedPet(null);
          setNotes('');
          setQuantity(1);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Reserve {selectedPet?.petName} for ₹{selectedPet?.price?.toLocaleString()}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            {selectedPet?.imageIds?.[0] && (
              <CardMedia
                component="img"
                image={resolveMediaUrl(selectedPet.imageIds[0])}
                alt={selectedPet.petName}
                sx={{ height: 200, objectFit: 'cover', borderRadius: 1 }}
              />
            )}
            <TextField
              fullWidth
              label="Additional Notes (Optional)"
              multiline
              rows={3}
              placeholder="Tell us about your preferences or requirements..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Alert severity="info">
              ℹ️ This pet will be reserved for 7 days. Complete your purchase to confirm.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReserveDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={confirmReservation}
            startIcon={<CartIcon />}
          >
            Proceed to Checkout
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BatchDetailsPage;
