import React, { useState, useEffect, useCallback } from 'react';
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
  Snackbar,
  Avatar,
  Divider,
  IconButton,
  TableContainer,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Badge
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
  Error as ErrorIcon,
  Visibility as VisibilityIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as AddressIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon
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
  const [orderFilterStatus, setOrderFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);

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

  const loadShops = useCallback(async () => {
    try {
      const response = await apiClient.get('/petshop/user/public/shops', { params: { limit: 100 } });
      setShops(response.data.data?.petShops || response.data.data?.items || response.data.data || []);
    } catch (err) {
      console.error('Error loading shops:', err);
    }
  }, []);

  const loadBatches = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        limit
      };

      if (searchQuery) params.search = searchQuery;
      if (selectedShop) params.shopId = selectedShop;

      // Fetch combined stocks for user dashboard
      const response = await apiClient.get('/petshop/user/public/stocks', { params });

      const stockItems = response.data.data?.stocks || response.data.data?.batches || [];

      // Each stock from backend represents ONE BATCH
      // A batch contains pets of same category, species, breed, and age
      // Only gender differs within a batch (male/female counts)
      // Display each batch as ONE card showing both male and female counts
      
      const batches = stockItems.map(stock => ({
        ...stock,
        // Ensure batch-style counts exist
        counts: stock.counts || {
          total: (stock.maleCount || 0) + (stock.femaleCount || 0),
          male: stock.maleCount || 0,
          female: stock.femaleCount || 0,
          unknown: 0
        },
        availableCount: (stock.maleCount || 0) + (stock.femaleCount || 0),
        isBatch: true
      }));

      setBatches(batches);
      setTotal(response.data.pagination?.total || batches.length);
    } catch (err) {
      console.error('Error loading batches:', err);
      setError('Failed to load pet inventory');
      setBatches([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, selectedShop]);

  const loadWishlist = useCallback(async () => {
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
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const response = await apiClient.get('/petshop/user/purchase-applications');
      setOrders(response.data.data?.applications || []);
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  }, []);

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
  }, [tabValue, loadBatches, loadWishlist, loadOrders]);

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
    // Check if this is a batch/stock (has maleCount/femaleCount or counts) vs individual listing
    const isBatchOrStock = pet.maleCount !== undefined || pet.femaleCount !== undefined || pet.counts !== undefined;

    if (isBatchOrStock) {
      // For batches/stocks, navigate to stock detail page where user can select gender and purchase
      const stockUrl = `/User/petshop/stock/${pet._id}${pet.gender ? `?gender=${pet.gender.toLowerCase()}` : ''}`;
      navigate(stockUrl);
      return;
    }

    // For individual listings (PetInventoryItem), open purchase dialog
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

      const reservation = response.data?.data?.reservation || response.data?.reservation;
      if (reservation?.reservationCode) {
        setSnackbar({
          open: true,
          message: `Reservation created! Code: ${reservation.reservationCode}`,
          severity: 'success'
        });

        // Close dialog and refresh data
        setTimeout(() => {
          handlePurchaseDialogClose();
          loadBatches(); // Refresh to show updated status
        }, 2000);
      } else {
        // Fallback: still show success but with generic message
        setSnackbar({
          open: true,
          message: response.data?.message || 'Reservation created successfully!',
          severity: 'success'
        });

        setTimeout(() => {
          handlePurchaseDialogClose();
          loadBatches();
        }, 2000);
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            PetShop
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Browse batches, reserve your favorite pet, and complete your purchase
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => navigate('/user/petshop/ai-identifier')}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            px: 3,
            py: 1.5,
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
            }
          }}
          startIcon={<SearchIcon />}
        >
          AI Pet Identifier
        </Button>
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
                  <Grid item xs={12} sm={6} md={4} key={batch._cardId || batch._id}>
                    <BatchCard
                      batch={batch}
                      onSelect={() => navigate(`/user/petshop/batch/${batch._id}`, { state: { batch, gender: batch.gender } })}
                      onReserve={() => handleReserve(batch)}
                      isFavorite={favorites.has(batch._id) || favorites.has(batch._cardId)}
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

      {/* TAB 2: My Orders/Applications */}
      {tabValue === 2 && (
        <Box>
          {/* Status Filter Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={orderFilterStatus}
              onChange={(e, newValue) => setOrderFilterStatus(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label={`All (${orders.length})`} value="all" />
              <Tab label={`Pending (${orders.filter(o => o.status === 'pending' || o.status === 'under_review').length})`} value="pending" />
              <Tab label={`Approved (${orders.filter(o => o.status === 'approved' || o.status === 'payment_pending').length})`} value="approved" />
              <Tab label={`Paid (${orders.filter(o => o.status === 'paid' || o.status === 'scheduled').length})`} value="paid" />
              <Tab label={`Completed (${orders.filter(o => o.status === 'completed').length})`} value="completed" />
              <Tab label={`Rejected (${orders.filter(o => o.status === 'rejected' || o.status === 'cancelled').length})`} value="rejected" />
            </Tabs>
          </Paper>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : orders.filter(o => {
            if (orderFilterStatus === 'all') return true;
            if (orderFilterStatus === 'pending') return o.status === 'pending' || o.status === 'under_review';
            if (orderFilterStatus === 'approved') return o.status === 'approved' || o.status === 'payment_pending';
            if (orderFilterStatus === 'paid') return o.status === 'paid' || o.status === 'scheduled';
            if (orderFilterStatus === 'completed') return o.status === 'completed';
            if (orderFilterStatus === 'rejected') return o.status === 'rejected' || o.status === 'cancelled';
            return true;
          }).length === 0 ? (
            <Alert severity="info">
              You haven't placed any applications yet. <Button onClick={() => setTabValue(0)}>Start shopping</Button>
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {orders.filter(o => {
                if (orderFilterStatus === 'all') return true;
                if (orderFilterStatus === 'pending') return o.status === 'pending' || o.status === 'under_review';
                if (orderFilterStatus === 'approved') return o.status === 'approved' || o.status === 'payment_pending';
                if (orderFilterStatus === 'paid') return o.status === 'paid' || o.status === 'scheduled';
                if (orderFilterStatus === 'completed') return o.status === 'completed';
                if (orderFilterStatus === 'rejected') return o.status === 'rejected' || o.status === 'cancelled';
                return true;
              }).map((order) => (
                <Grid item xs={12} key={order._id}>
                  <Card sx={{ '&:hover': { boxShadow: 4 }, transition: 'box-shadow 0.3s' }}>
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        {/* Pet Image */}
                        <Grid item xs={12} sm={2}>
                          <Avatar
                            src={resolveMediaUrl(order.petInventoryItemId?.images?.[0]?.url)}
                            variant="rounded"
                            sx={{ width: 80, height: 80 }}
                          >
                            <PetsIcon sx={{ fontSize: 40 }} />
                          </Avatar>
                        </Grid>

                        {/* Application Info */}
                        <Grid item xs={12} sm={6}>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {order.petInventoryItemId?.name || 'Pet'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {order.petInventoryItemId?.speciesId?.displayName || order.petInventoryItemId?.speciesId?.name || 'N/A'} - {order.petInventoryItemId?.breedId?.name || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" display="block">
                            Gender: {order.selectedGender} • Age: {order.petInventoryItemId?.age || 'N/A'}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip
                              label={order.status === 'pending' ? 'Pending Review' : 
                                     order.status === 'approved' ? 'Approved' :
                                     order.status === 'payment_pending' ? 'Payment Pending' :
                                     order.status === 'paid' ? 'Paid' :
                                     order.status === 'scheduled' ? 'Handover Scheduled' :
                                     order.status === 'completed' ? 'Completed' :
                                     order.status === 'rejected' ? 'Rejected' :
                                     order.status}
                              color={order.status === 'completed' ? 'success' : 
                                     order.status === 'approved' || order.status === 'paid' || order.status === 'scheduled' ? 'success' :
                                     order.status === 'rejected' ? 'error' :
                                     'warning'}
                              size="small"
                            />
                            <Typography variant="caption" color="textSecondary">
                              Applied: {new Date(order.createdAt).toLocaleDateString()}
                            </Typography>
                          </Stack>
                        </Grid>

                        {/* Price & Actions */}
                        <Grid item xs={12} sm={4}>
                          <Stack spacing={1}>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                              ₹{order.paymentAmount?.toLocaleString() || '0'}
                            </Typography>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<VisibilityIcon />}
                              onClick={() => {
                                setSelectedOrder(order);
                                setOrderDetailsOpen(true);
                              }}
                              fullWidth
                            >
                              View Details
                            </Button>
                            {order.status === 'approved' || order.status === 'payment_pending' ? (
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                startIcon={<PaymentIcon />}
                                onClick={() => {
                                  navigate(`/User/petshop/my-applications`);
                                }}
                                fullWidth
                              >
                                Pay Now
                              </Button>
                            ) : null}
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

      {/* ORDER DETAILS DIALOG */}
      <Dialog
        open={orderDetailsOpen}
        onClose={() => setOrderDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        {selectedOrder && (
          <>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', pr: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Application #{selectedOrder._id?.slice(-8)}</Typography>
                  <Typography variant="caption">Submitted on {new Date(selectedOrder.createdAt).toLocaleString()}</Typography>
                </Box>
                <IconButton onClick={() => setOrderDetailsOpen(false)} sx={{ color: 'white' }}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>

            <DialogContent sx={{ mt: 3 }}>
              <Grid container spacing={3}>
                {/* Status */}
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderLeft: 4, borderColor: selectedOrder.status === 'completed' ? 'success.main' : selectedOrder.status === 'rejected' ? 'error.main' : 'warning.main' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Chip 
                        label={selectedOrder.status === 'pending' ? 'Pending Review' : 
                               selectedOrder.status === 'approved' ? 'Approved' :
                               selectedOrder.status === 'payment_pending' ? 'Payment Pending' :
                               selectedOrder.status === 'paid' ? 'Paid' :
                               selectedOrder.status === 'scheduled' ? 'Handover Scheduled' :
                               selectedOrder.status === 'completed' ? 'Completed' :
                               selectedOrder.status === 'rejected' ? 'Rejected' :
                               selectedOrder.status} 
                        color={selectedOrder.status === 'completed' ? 'success' : selectedOrder.status === 'rejected' ? 'error' : 'warning'} 
                        size="large" 
                        sx={{ fontWeight: 700 }} 
                      />
                      <Divider orientation="vertical" flexItem />
                      <Typography variant="body2" color="text.secondary">
                        Last Updated: {new Date(selectedOrder.updatedAt || selectedOrder.createdAt).toLocaleString()}
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Pet Information */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                      🐾 Pet Details
                    </Typography>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={resolveMediaUrl(selectedOrder.petInventoryItemId?.images?.[0]?.url)}
                          variant="rounded"
                          sx={{ width: 100, height: 100 }}
                        >
                          <ImageIcon sx={{ fontSize: 48 }} />
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="h6" fontWeight={600}>{selectedOrder.petInventoryItemId?.name || 'N/A'}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedOrder.petInventoryItemId?.speciesId?.displayName || selectedOrder.petInventoryItemId?.speciesId?.name || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider />
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Breed</Typography>
                          <Typography variant="body2" fontWeight={600}>{selectedOrder.petInventoryItemId?.breedId?.name || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Gender</Typography>
                          <Typography variant="body2" fontWeight={600}>{selectedOrder.selectedGender}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Age</Typography>
                          <Typography variant="body2" fontWeight={600}>{selectedOrder.petInventoryItemId?.age || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Pet Code</Typography>
                          <Typography variant="body2" fontWeight={600}>{selectedOrder.petInventoryItemId?.petCode || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="caption" color="text.secondary">Price</Typography>
                          <Typography variant="h5" fontWeight={700} color="success.main">₹{selectedOrder.paymentAmount?.toLocaleString() || '0'}</Typography>
                        </Grid>
                      </Grid>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Your Information */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                      👤 Your Information
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Full Name</Typography>
                        <Typography variant="body1" fontWeight={600}>{selectedOrder.personalDetails?.fullName || selectedOrder.userId?.name}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">Email</Typography>
                          <Typography variant="body2">{selectedOrder.personalDetails?.email || selectedOrder.userId?.email}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">Phone</Typography>
                          <Typography variant="body2">{selectedOrder.personalDetails?.phone || selectedOrder.userId?.phone}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <AddressIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
                        <Box flex={1}>
                          <Typography variant="caption" color="text.secondary">Address</Typography>
                          <Typography variant="body2">
                            {selectedOrder.personalDetails?.address?.street}<br />
                            {selectedOrder.personalDetails?.address?.city}, {selectedOrder.personalDetails?.address?.state}<br />
                            {selectedOrder.personalDetails?.address?.pincode}, {selectedOrder.personalDetails?.address?.country || 'India'}
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Your Photo */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                      📸 Your Photo
                    </Typography>
                    {selectedOrder.userPhoto?.url ? (
                      <Box sx={{ textAlign: 'center' }}>
                        <img 
                          src={resolveMediaUrl(selectedOrder.userPhoto.url)} 
                          alt="Your Photo" 
                          style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, objectFit: 'contain' }}
                        />
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                          {selectedOrder.userPhoto.name || 'Your Photo'}
                        </Typography>
                      </Box>
                    ) : (
                      <Alert severity="info">No photo uploaded</Alert>
                    )}
                  </Paper>
                </Grid>

                {/* Your Documents */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                      📄 Your Documents ({selectedOrder.documents?.length || 0})
                    </Typography>
                    {selectedOrder.documents && selectedOrder.documents.length > 0 ? (
                      <Stack spacing={1}>
                        {selectedOrder.documents.map((doc, idx) => (
                          <Paper key={idx} elevation={0} sx={{ p: 2, bgcolor: 'grey.50', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <DocumentIcon color="primary" />
                            <Box flex={1}>
                              <Typography variant="body2" fontWeight={600}>{doc.name || `Document ${idx + 1}`}</Typography>
                              <Typography variant="caption" color="text.secondary">{doc.type || 'Unknown type'}</Typography>
                            </Box>
                            <Button size="small" href={resolveMediaUrl(doc.url)} target="_blank" rel="noopener">View</Button>
                          </Paper>
                        ))}
                      </Stack>
                    ) : (
                      <Alert severity="info">No documents uploaded</Alert>
                    )}
                  </Paper>
                </Grid>

                {/* Payment Information */}
                {(selectedOrder.status === 'paid' || selectedOrder.status === 'scheduled' || selectedOrder.status === 'completed') && (
                  <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 3, bgcolor: 'success.lighter', borderLeft: 4, borderColor: 'success.main' }}>
                      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: 'success.dark', mb: 2 }}>
                        💳 Payment Confirmation
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">Payment Status</Typography>
                          <Typography variant="body2" fontWeight={600} color="success.dark">✓ {selectedOrder.paymentStatus || 'Paid'}</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">Payment ID</Typography>
                          <Typography variant="body2" fontWeight={600}>{selectedOrder.paymentId || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">Amount Paid</Typography>
                          <Typography variant="h6" fontWeight={700} color="success.dark">₹{selectedOrder.paymentAmount?.toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="text.secondary">Payment Date</Typography>
                          <Typography variant="body2" fontWeight={600}>{selectedOrder.paymentDate ? new Date(selectedOrder.paymentDate).toLocaleDateString() : 'N/A'}</Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}

                {/* Handover Status - Not Yet Scheduled */}
                {(selectedOrder.status === 'approved' || selectedOrder.status === 'payment_pending' || selectedOrder.status === 'paid') && 
                 selectedOrder.status !== 'scheduled' && selectedOrder.status !== 'completed' && (
                  <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 3, bgcolor: 'warning.lighter', borderLeft: 4, borderColor: 'warning.main' }}>
                      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: 'warning.dark', mb: 2 }}>
                        🗓️ Handover Status
                      </Typography>
                      <Stack spacing={2}>
                        <Alert severity="info" icon={<ScheduleIcon />}>
                          <Typography variant="body2" fontWeight={600}>Handover Not Yet Scheduled</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {selectedOrder.status === 'payment_pending' || selectedOrder.status === 'approved' 
                              ? 'Please complete the payment first. After payment, our team will schedule the handover.'
                              : 'Our team will schedule your handover appointment soon. You will receive an OTP via email when scheduled.'}
                          </Typography>
                        </Alert>
                        {selectedOrder.status === 'paid' && (
                          <Alert severity="success" icon={<CheckIcon />}>
                            <Typography variant="body2" fontWeight={600}>✓ Payment Completed</Typography>
                            <Typography variant="caption" color="text.secondary">
                              We will contact you within 24-48 hours to schedule the handover. You will receive the OTP via email.
                            </Typography>
                          </Alert>
                        )}
                      </Stack>
                    </Paper>
                  </Grid>
                )}

                {/* Handover Schedule */}
                {(selectedOrder.status === 'scheduled' || selectedOrder.status === 'completed') && (
                  <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 3, bgcolor: 'info.lighter', borderLeft: 4, borderColor: 'info.main' }}>
                      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: 'info.dark', mb: 2 }}>
                        🗓️ Handover Schedule
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ScheduleIcon color="info" />
                            <Box>
                              <Typography variant="caption" color="text.secondary">Scheduled Date</Typography>
                              <Typography variant="body1" fontWeight={600}>{selectedOrder.scheduledHandoverDate ? new Date(selectedOrder.scheduledHandoverDate).toLocaleDateString() : 'N/A'}</Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="caption" color="text.secondary">Scheduled Time</Typography>
                          <Typography variant="body1" fontWeight={600}>{selectedOrder.scheduledHandoverTime || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="caption" color="text.secondary">Location</Typography>
                          <Typography variant="body1" fontWeight={600}>{selectedOrder.handoverLocation || 'Pet Shop Store'}</Typography>
                        </Grid>
                        {selectedOrder.status === 'scheduled' && (
                          <Grid item xs={12}>
                            <Paper elevation={0} sx={{ p: 3, bgcolor: 'warning.lighter', textAlign: 'center', borderRadius: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Your Handover OTP</Typography>
                              {selectedOrder.otpCode ? (
                                <>
                                  <Typography variant="h3" fontWeight={700} color="warning.dark" letterSpacing={4} sx={{ my: 2 }}>
                                    {selectedOrder.otpCode}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                    📧 This OTP was sent to your email. Show it at the pet shop during handover.
                                  </Typography>
                                  <Button 
                                    size="small" 
                                    startIcon={<CopyIcon />} 
                                    onClick={() => {
                                      navigator.clipboard.writeText(selectedOrder.otpCode);
                                      alert('OTP copied to clipboard!');
                                    }}
                                    sx={{ mt: 1 }}
                                  >
                                    Copy OTP
                                  </Button>
                                </>
                              ) : (
                                <Alert severity="info" sx={{ mt: 2 }}>
                                  OTP will be sent to your email ({selectedOrder.personalDetails?.email || selectedOrder.userId?.email}) soon. 
                                  Please check your inbox and spam folder.
                                </Alert>
                              )}
                            </Paper>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </Grid>
                )}

                {/* Rejection Reason */}
                {selectedOrder.status === 'rejected' && selectedOrder.rejectionReason && (
                  <Grid item xs={12}>
                    <Alert severity="error">
                      <Typography variant="subtitle2" fontWeight={600}>Rejection Reason:</Typography>
                      <Typography variant="body2">{selectedOrder.rejectionReason}</Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button onClick={() => setOrderDetailsOpen(false)} variant="outlined">
                Close
              </Button>
              {(selectedOrder.status === 'approved' || selectedOrder.status === 'payment_pending') && (
                <Button 
                  variant="contained" 
                  color="success"
                  startIcon={<PaymentIcon />}
                  onClick={() => {
                    setOrderDetailsOpen(false);
                    navigate('/User/petshop/my-applications');
                  }}
                >
                  Proceed to Payment
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

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