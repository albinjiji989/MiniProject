import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Tabs,
  Tab,
  Paper,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Snackbar
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  StoreMallDirectory as StoreIcon,
  Pets as PetsIcon,
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  CalendarToday as AgeIcon,
  AttachMoney as PriceIcon,
  Check as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { apiClient, resolveMediaUrl } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import BatchList from './components/BatchList';
import BatchCard from './components/BatchCard';

const PetShopUserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Tab state
  const [tabValue, setTabValue] = useState(0); // 0: Batches, 1: Wishlist, 2: My Orders
  
  // Batch browsing
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(12);
  
  // Search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState('');
  const [shops, setShops] = useState([]);
  
  // Wishlist & orders
  const [wishlist, setWishlist] = useState([]);
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState(new Set());

  // Purchase/Reservation Modal State
  const [purchaseDialog, setPurchaseDialog] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [purchaseStep, setPurchaseStep] = useState(0);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  
  // Purchase form state
  const [purchaseData, setPurchaseData] = useState({
    contactInfo: {
      phone: '',
      email: '',
      preferredContactMethod: 'both'
    },
    visitDetails: {
      preferredDate: '',
      preferredTime: 'morning',
      visitPurpose: 'meet_pet'
    },
    deliveryAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      phone: ''
    },
    notes: ''
  });

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadShops();
    loadWishlist();
  }, []);

  useEffect(() => {
    if (tabValue === 0) {
      loadBatches();
    } else if (tabValue === 1) {
      loadWishlist();
    } else if (tabValue === 2) {
      loadOrders();
    }
  }, [tabValue, searchQuery, selectedShop, page]);

  const loadShops = async () => {
    try {
      const response = await apiClient.get('/petshop/user/public/shops', { params: { limit: 100 } });
      setShops(response.data.data?.petShops || response.data.data?.items || response.data.data || []);
    } catch (err) {
      console.error('Error loading shops:', err);
    }
  };

  const loadBatches = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        limit,
        status: 'published'
      };

      if (searchQuery) params.search = searchQuery;
      if (selectedShop) params.shopId = selectedShop;

      // For user dashboard, fetch both public batches and public listings and merge them
      // so users see all pets regardless of whether they came from batches or individual inventory.
      const fetches = [
        apiClient.get('/petshop/user/public/batches', { params }).catch(e => ({ error: e })),
        apiClient.get('/petshop/user/public/listings', { params }).catch(e => ({ error: e }))
      ];

      // If the current user is a manager, also include manager inventory (scoped to their store)
      if (user && (Array.isArray(user.role) ? user.role.some(r => typeof r === 'string' && r.toLowerCase().includes('manager')) : (typeof user.role === 'string' && user.role.toLowerCase().includes('manager')))) {
        fetches.push(apiClient.get('/petshop/manager/inventory', { params }).catch(e => ({ error: e })));
      }

      const [batchesRes, listingsRes, managerRes] = await Promise.all(fetches);

      const batchItems = Array.isArray(batchesRes?.data?.data) ? batchesRes.data.data : [];
      const listingItems = Array.isArray(listingsRes?.data?.data?.items) ? listingsRes.data.data.items : (Array.isArray(listingsRes?.data?.data) ? listingsRes.data.data : []);
      const managerItems = managerRes && Array.isArray(managerRes?.data?.data) ? managerRes.data.data : [];

      // Merge unique items. We'll keep the batch objects first, then listings, then manager items.
      const merged = [];
      const ids = new Set();

      const pushIfNew = (item, id) => {
        if (!id) {
          merged.push(item);
          return;
        }
        if (!ids.has(String(id))) {
          ids.add(String(id));
          merged.push(item);
        }
      };

      // Batches: they represent groups - use their _id
      for (const b of batchItems) pushIfNew(b, b._id);

      // Listings: individual inventory items - use their _id
      for (const l of listingItems) pushIfNew(l, l._id);

      // Manager items (if present) - de-duplicate as well
      for (const m of managerItems) pushIfNew(m, m._id);

      setBatches(merged);

      // Approximate total as sum of sources (UI shows pagination by client-side slicing)
      const totalCount = (batchItems.length || 0) + (listingItems.length || 0) + (managerItems.length || 0);
      setTotal(totalCount);
    } catch (err) {
      console.error('Error loading batches:', err);
      setError(err.response?.data?.message || 'Failed to load batches');
      setBatches([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const loadWishlist = async () => {
    try {
      // TODO: Load from backend wishlist endpoint
      // For now, using localStorage
      const saved = localStorage.getItem('petshop_favorites');
      if (saved) {
        setFavorites(new Set(JSON.parse(saved)));
      }
    } catch (err) {
      console.error('Error loading wishlist:', err);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await apiClient.get('/petshop/user/my-orders', { params: { limit: 100 } });
      setOrders(response.data.data || []);
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  };

  const handleFavoriteToggle = (batchId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(batchId)) {
      newFavorites.delete(batchId);
    } else {
      newFavorites.add(batchId);
    }
    setFavorites(newFavorites);
    localStorage.setItem('petshop_favorites', JSON.stringify([...newFavorites]));
  };

  const handleReserve = (pet) => {
    // Open purchase dialog with selected pet
    setSelectedPet(pet);
    setPurchaseData({
      contactInfo: {
        phone: user?.phone || '',
        email: user?.email || '',
        preferredContactMethod: 'both'
      },
      visitDetails: {
        preferredDate: '',
        preferredTime: 'morning',
        visitPurpose: 'meet_pet'
      },
      deliveryAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        phone: user?.phone || ''
      },
      notes: ''
    });
    setPurchaseStep(0);
    setPurchaseDialog(true);
  };

  const handlePurchaseDialogClose = () => {
    setPurchaseDialog(false);
    setPurchaseStep(0);
    setSelectedPet(null);
  };

  const handlePurchaseNextStep = () => {
    // Validate current step before moving to next
    if (purchaseStep === 0) {
      // Step 0: Contact info
      if (!purchaseData.contactInfo.phone) {
        setSnackbar({ open: true, message: 'Phone number is required', severity: 'error' });
        return;
      }
      if (!purchaseData.contactInfo.email) {
        setSnackbar({ open: true, message: 'Email is required', severity: 'error' });
        return;
      }
    } else if (purchaseStep === 1) {
      // Step 1: Visit/Delivery details
      if (!purchaseData.visitDetails.preferredDate) {
        setSnackbar({ open: true, message: 'Preferred date is required', severity: 'error' });
        return;
      }
    } else if (purchaseStep === 2) {
      // Step 2: Delivery address (if applicable)
      if (purchaseData.deliveryAddress.street && !purchaseData.deliveryAddress.city) {
        setSnackbar({ open: true, message: 'City is required', severity: 'error' });
        return;
      }
    }
    
    if (purchaseStep < 3) {
      setPurchaseStep(purchaseStep + 1);
    }
  };

  const handlePurchasePrevStep = () => {
    if (purchaseStep > 0) {
      setPurchaseStep(purchaseStep - 1);
    }
  };

  const handlePurchaseSubmit = async () => {
    if (!selectedPet) return;

    setPurchaseLoading(true);
    try {
      const itemId = selectedPet._id;
      const response = await apiClient.post('/petshop/user/public/reservations/purchase', {
        itemId,
        contactInfo: purchaseData.contactInfo,
        reservationType: 'purchase',
        visitDetails: purchaseData.visitDetails,
        deliveryAddress: purchaseData.deliveryAddress,
        notes: purchaseData.notes
      });

      if (response.data?.reservation?.reservationCode) {
        setSnackbar({
          open: true,
          message: `Reservation created! Code: ${response.data.reservation.reservationCode}`,
          severity: 'success'
        });
        
        // Close dialog and refresh data
        setTimeout(() => {
          handlePurchaseDialogClose();
          loadBatches(); // Refresh to show updated status
        }, 2000);
      } else {
        throw new Error('No reservation code in response');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to create reservation. Please try again.',
        severity: 'error'
      });
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleViewOrder = (orderId) => {
    navigate(`/user/petshop/order/${orderId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          PetShop
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Browse batches, reserve your favorite pet, and complete your purchase
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, value) => {
            setTabValue(value);
            setPage(1);
          }}
          sx={{ borderBottom: '1px solid #e0e0e0' }}
        >
          <Tab label="Browse Batches" icon={<PetsIcon />} iconPosition="start" />
          <Tab 
            label={`Wishlist${favorites.size > 0 ? ` (${favorites.size})` : ''}`} 
            icon={<FavoriteIcon />} 
            iconPosition="start" 
          />
          <Tab label="My Orders" icon={<CartIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* TAB 0: Browse Batches */}
      {tabValue === 0 && (
        <Box>
          {/* Search & Filter Bar */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Stack spacing={2}>
              <Grid container spacing={2}>
                {/* Search */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="Search batches (species, breed, category)..."
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                {/* Shop Filter */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>PetShop</InputLabel>
                    <Select
                      value={selectedShop}
                      onChange={(e) => {
                        setSelectedShop(e.target.value);
                        setPage(1);
                      }}
                      label="PetShop"
                    >
                      <MenuItem value="">All Shops</MenuItem>
                      {shops.map((shop) => (
                        <MenuItem key={shop._id} value={shop._id}>
                          {shop.name || shop.storeName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Stack>
          </Paper>

          {/* Loading State */}
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : batches.length === 0 ? (
            <Alert severity="info">No batches available. Try adjusting your filters.</Alert>
          ) : (
            <>
              {/* Batches Grid */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {batches.map((batch) => (
                  <Grid item xs={12} sm={6} md={4} key={batch._id}>
                    <BatchCard
                      batch={batch}
                      onSelect={() => navigate(`/user/petshop/batch/${batch._id}`, { state: { batch } })}
                      onReserve={() => handleReserve(batch)}
                      isFavorite={favorites.has(batch._id)}
                      onFavoriteToggle={handleFavoriteToggle}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {total > limit && (
                <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
                  <Pagination
                    count={Math.ceil(total / limit)}
                    page={page}
                    onChange={(e, value) => {
                      setPage(value);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      )}

      {/* TAB 1: Wishlist */}
      {tabValue === 1 && (
        <Box>
          {favorites.size === 0 ? (
            <Alert severity="info">
              Your wishlist is empty. <Button onClick={() => setTabValue(0)}>Browse batches</Button>
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {batches
                .filter((batch) => favorites.has(batch._id))
                .map((batch) => (
                  <Grid item xs={12} sm={6} md={4} key={batch._id}>
                    <BatchCard
                      batch={batch}
                      onSelect={() => navigate(`/user/petshop/batch/${batch._id}`, { state: { batch } })}
                      onReserve={() => handleReserve(batch)}
                      isFavorite={true}
                      onFavoriteToggle={handleFavoriteToggle}
                    />
                  </Grid>
                ))}
            </Grid>
          )}
        </Box>
      )}

      {/* TAB 2: My Orders */}
      {tabValue === 2 && (
        <Box>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : orders.length === 0 ? (
            <Alert severity="info">
              You haven't placed any orders yet. <Button onClick={() => setTabValue(0)}>Start shopping</Button>
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {orders.map((order) => (
                <Grid item xs={12} key={order._id}>
                  <Card>
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Order #{order._id.substring(0, 8)}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {order.petName} - {order.breedName}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip
                              label={order.status}
                              color={order.status === 'delivered' ? 'success' : 'primary'}
                              size="small"
                            />
                            <Typography variant="caption" color="textSecondary">
                              Ordered: {new Date(order.createdAt).toLocaleDateString()}
                            </Typography>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Stack direction="row" justifyContent="flex-end" spacing={1}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                              ₹{order.totalPrice?.toLocaleString()}
                            </Typography>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleViewOrder(order._id)}
                            >
                              View Details
                            </Button>
                          </Stack>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* PURCHASE/RESERVATION MODAL */}
      <Dialog
        open={purchaseDialog}
        onClose={handlePurchaseDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, py: 2 }}>
          Reserve & Purchase Pet
        </DialogTitle>

        <DialogContent dividers>
          {/* Stepper */}
          <Stepper activeStep={purchaseStep} sx={{ mb: 3 }}>
            <Step>
              <StepLabel>Contact Info</StepLabel>
            </Step>
            <Step>
              <StepLabel>Visit Details</StepLabel>
            </Step>
            <Step>
              <StepLabel>Delivery Info</StepLabel>
            </Step>
            <Step>
              <StepLabel>Review</StepLabel>
            </Step>
          </Stepper>

          {/* STEP 0: Contact Information */}
          {purchaseStep === 0 && (
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Contact Information
              </Typography>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={purchaseData.contactInfo.email}
                onChange={(e) =>
                  setPurchaseData({
                    ...purchaseData,
                    contactInfo: { ...purchaseData.contactInfo, email: e.target.value }
                  })
                }
                required
              />
              <TextField
                fullWidth
                label="Phone Number"
                type="tel"
                value={purchaseData.contactInfo.phone}
                onChange={(e) =>
                  setPurchaseData({
                    ...purchaseData,
                    contactInfo: { ...purchaseData.contactInfo, phone: e.target.value }
                  })
                }
                required
              />
              <FormControl fullWidth>
                <InputLabel>Preferred Contact Method</InputLabel>
                <Select
                  value={purchaseData.contactInfo.preferredContactMethod}
                  onChange={(e) =>
                    setPurchaseData({
                      ...purchaseData,
                      contactInfo: {
                        ...purchaseData.contactInfo,
                        preferredContactMethod: e.target.value
                      }
                    })
                  }
                  label="Preferred Contact Method"
                >
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="phone">Phone</MenuItem>
                  <MenuItem value="both">Both</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          )}

          {/* STEP 1: Visit/Pickup Details */}
          {purchaseStep === 1 && (
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Preferred Visit/Pickup Details
              </Typography>
              <TextField
                fullWidth
                label="Preferred Date"
                type="date"
                value={purchaseData.visitDetails.preferredDate}
                onChange={(e) =>
                  setPurchaseData({
                    ...purchaseData,
                    visitDetails: {
                      ...purchaseData.visitDetails,
                      preferredDate: e.target.value
                    }
                  })
                }
                InputLabelProps={{ shrink: true }}
                required
              />
              <FormControl fullWidth>
                <InputLabel>Preferred Time</InputLabel>
                <Select
                  value={purchaseData.visitDetails.preferredTime}
                  onChange={(e) =>
                    setPurchaseData({
                      ...purchaseData,
                      visitDetails: {
                        ...purchaseData.visitDetails,
                        preferredTime: e.target.value
                      }
                    })
                  }
                  label="Preferred Time"
                >
                  <MenuItem value="morning">Morning (9 AM - 12 PM)</MenuItem>
                  <MenuItem value="afternoon">Afternoon (12 PM - 4 PM)</MenuItem>
                  <MenuItem value="evening">Evening (4 PM - 7 PM)</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Visit Purpose</InputLabel>
                <Select
                  value={purchaseData.visitDetails.visitPurpose}
                  onChange={(e) =>
                    setPurchaseData({
                      ...purchaseData,
                      visitDetails: {
                        ...purchaseData.visitDetails,
                        visitPurpose: e.target.value
                      }
                    })
                  }
                  label="Visit Purpose"
                >
                  <MenuItem value="meet_pet">Meet the Pet First</MenuItem>
                  <MenuItem value="direct_purchase">Direct Purchase</MenuItem>
                  <MenuItem value="home_delivery">Home Delivery</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          )}

          {/* STEP 2: Delivery Address (if applicable) */}
          {purchaseStep === 2 && (
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Delivery Address (optional)
              </Typography>
              <Typography variant="body2" color="textSecondary">
                If you selected "Home Delivery" as the visit purpose, please provide your delivery address.
              </Typography>
              <TextField
                fullWidth
                label="Street Address"
                value={purchaseData.deliveryAddress.street}
                onChange={(e) =>
                  setPurchaseData({
                    ...purchaseData,
                    deliveryAddress: {
                      ...purchaseData.deliveryAddress,
                      street: e.target.value
                    }
                  })
                }
              />
              <TextField
                fullWidth
                label="City"
                value={purchaseData.deliveryAddress.city}
                onChange={(e) =>
                  setPurchaseData({
                    ...purchaseData,
                    deliveryAddress: {
                      ...purchaseData.deliveryAddress,
                      city: e.target.value
                    }
                  })
                }
              />
              <TextField
                fullWidth
                label="State"
                value={purchaseData.deliveryAddress.state}
                onChange={(e) =>
                  setPurchaseData({
                    ...purchaseData,
                    deliveryAddress: {
                      ...purchaseData.deliveryAddress,
                      state: e.target.value
                    }
                  })
                }
              />
              <TextField
                fullWidth
                label="ZIP Code"
                value={purchaseData.deliveryAddress.zipCode}
                onChange={(e) =>
                  setPurchaseData({
                    ...purchaseData,
                    deliveryAddress: {
                      ...purchaseData.deliveryAddress,
                      zipCode: e.target.value
                    }
                  })
                }
              />
              <TextField
                fullWidth
                label="Contact Phone (Delivery)"
                value={purchaseData.deliveryAddress.phone}
                onChange={(e) =>
                  setPurchaseData({
                    ...purchaseData,
                    deliveryAddress: {
                      ...purchaseData.deliveryAddress,
                      phone: e.target.value
                    }
                  })
                }
              />
            </Stack>
          )}

          {/* STEP 3: Review & Confirmation */}
          {purchaseStep === 3 && (
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Review Your Reservation
              </Typography>

              {selectedPet && (
                <Card sx={{ bg: '#f5f5f5' }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Pet Details
                    </Typography>
                    <Typography variant="body2">
                      <strong>Species:</strong> {selectedPet.species || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Breed:</strong> {selectedPet.breed || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Price:</strong> ₹{selectedPet.price?.toLocaleString() || 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              <Card sx={{ bg: '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Contact Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong> {purchaseData.contactInfo.email}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Phone:</strong> {purchaseData.contactInfo.phone}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Contact Method:</strong> {purchaseData.contactInfo.preferredContactMethod}
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ bg: '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Visit Details
                  </Typography>
                  <Typography variant="body2">
                    <strong>Date:</strong> {new Date(purchaseData.visitDetails.preferredDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Time:</strong> {purchaseData.visitDetails.preferredTime}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Purpose:</strong> {purchaseData.visitDetails.visitPurpose.replace(/_/g, ' ')}
                  </Typography>
                </CardContent>
              </Card>

              {purchaseData.deliveryAddress.street && (
                <Card sx={{ bg: '#f5f5f5' }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Delivery Address
                    </Typography>
                    <Typography variant="body2">
                      {purchaseData.deliveryAddress.street}
                    </Typography>
                    <Typography variant="body2">
                      {purchaseData.deliveryAddress.city}, {purchaseData.deliveryAddress.state}{' '}
                      {purchaseData.deliveryAddress.zipCode}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {purchaseData.notes && (
                <Card sx={{ bg: '#f5f5f5' }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Special Notes
                    </Typography>
                    <Typography variant="body2">{purchaseData.notes}</Typography>
                  </CardContent>
                </Card>
              )}

              <Alert severity="info">
                By confirming, you agree to our terms and the pet shop manager will contact you to confirm the
                reservation.
              </Alert>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handlePurchaseDialogClose} variant="outlined">
            Cancel
          </Button>

          {purchaseStep > 0 && (
            <Button onClick={handlePurchasePrevStep} variant="outlined">
              Previous
            </Button>
          )}

          {purchaseStep < 3 ? (
            <Button onClick={handlePurchaseNextStep} variant="contained" color="primary">
              Next
            </Button>
          ) : (
            <Button
              onClick={handlePurchaseSubmit}
              variant="contained"
              color="success"
              disabled={purchaseLoading}
              startIcon={purchaseLoading ? <CircularProgress size={20} /> : <CheckIcon />}
            >
              {purchaseLoading ? 'Creating...' : 'Confirm & Submit'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* SNACKBAR FOR NOTIFICATIONS */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        message={snackbar.message}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PetShopUserDashboard;
