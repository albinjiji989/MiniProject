import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Tabs,
  Tab,
  Badge,
  CircularProgress,
  Avatar,
  Divider,
  Fab,
  Menu,
  ListItemIcon,
  ListItemText,
  Pagination,
  Stack,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Publish as PublishIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  AddPhotoAlternate as AddPhotoAlternateIcon,
  CloudUpload as CloudUploadIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Pets as PetsIcon,
  PriceChange as PriceChangeIcon,
  FileUpload as FileUploadIcon,
  MoreVert as MoreVertIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';
import { apiClient } from '../../../services/api';

// Import the refactored components
import HeaderSection from './components/HeaderSection';
import EnhancedStatsSection from './components/EnhancedStatsSection';
import FilterSection from './components/FilterSection';
import FilterMenu from './components/FilterMenu';
import InventoryTabs from './components/InventoryTabs';
import EnhancedTabContent from './components/EnhancedTabContent';

const RefactoredManageInventory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [readyForRelease, setReadyForRelease] = useState([]);
  const [releasedPets, setReleasedPets] = useState([]);
  const [purchasedPets, setPurchasedPets] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedReadyIds, setSelectedReadyIds] = useState([]);
  const [selectedReleasedIds, setSelectedReleasedIds] = useState([]);
  const [selectedPurchasedIds, setSelectedPurchasedIds] = useState([]);
  const [activeTab, setActiveTab] = useState(0); // 0: Pending Images, 1: Ready for Release, 2: Released, 3: Purchased
  const [editDialog, setEditDialog] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    price: 0,
    status: 'in_petshop',
    notes: ''
  });
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [limit, setLimit] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [statusFilter, setStatusFilter] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [breedFilter, setBreedFilter] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [searchText, setSearchText] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [speciesOptions, setSpeciesOptions] = useState([]);
  const [breedOptions, setBreedOptions] = useState([]);
  
  // Bulk price update
  const [bulkPriceOpen, setBulkPriceOpen] = useState(false);
  const [bulkPriceForm, setBulkPriceForm] = useState({ mode: 'percent', op: 'increase', value: 10 });
  
  // CSV import
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvParsing, setCsvParsing] = useState(false);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvPreview, setCsvPreview] = useState({ headers: [], rows: [], items: [] });
  
  // Image upload state
  const [imageDialog, setImageDialog] = useState({ open: false, item: null });
  const [imageFile, setImageFile] = useState(null);
  
  // Filter menu
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const filterOpen = Boolean(filterAnchorEl);
  
  // View mode
  const [viewMode, setViewMode] = useState('table'); // table or grid

  // initial load and when filters change
  useEffect(() => {
    fetchInventory(1);
    if (location?.state?.message) {
      setSnackbar({ open: true, message: location.state.message, severity: 'success' });
      navigate('.', { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, speciesFilter, breedFilter, priceMin, priceMax, genderFilter, ageMin, ageMax, searchText, limit]);

  // Load species/breeds for filters
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/admin/species/active');
        setSpeciesOptions(res?.data?.data || []);
      } catch (_) { setSpeciesOptions([]); }
    })();
  }, []);

  useEffect(() => {
    if (!speciesFilter) { setBreedOptions([]); setBreedFilter(''); return; }
    (async () => {
      try {
        const res = await apiClient.get('/admin/breeds/active', { params: { speciesId: speciesFilter } });
        setBreedOptions(res?.data?.data || []);
      } catch (_) { setBreedOptions([]); }
    })();
  }, [speciesFilter]);

  const fetchInventory = async (page = 1) => {
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      qs.set('page', String(page));
      qs.set('limit', String(limit));
      if (statusFilter) qs.set('status', statusFilter);
      if (speciesFilter) qs.set('speciesId', speciesFilter);
      if (breedFilter) qs.set('breedId', breedFilter);
      if (priceMin) qs.set('priceMin', priceMin);
      if (priceMax) qs.set('priceMax', priceMax);
      if (genderFilter) qs.set('gender', genderFilter);
      if (ageMin) qs.set('ageMin', ageMin);
      if (ageMax) qs.set('ageMax', ageMax);
      if (searchText) qs.set('q', searchText.trim());
      
      const response = await apiClient.get(`/petshop/manager/inventory?${qs.toString()}`);
      
      const body = response?.data || {};
      const dataNode = body.data ?? body;
      
      let items = Array.isArray(dataNode?.items) ? dataNode.items
        : (Array.isArray(dataNode) ? dataNode : []);
      
      // Separate items based on their status
      const itemsWithoutImages = items.filter(item => !item.images || item.images.length === 0);
      const itemsWithImages = items.filter(item => item.images && item.images.length > 0);
      const releasedItems = items.filter(item => item.status === 'available_for_sale');
      const purchasedItems = items.filter(item => item.status === 'sold');
      const readyItems = itemsWithImages.filter(item => item.status !== 'available_for_sale' && item.status !== 'sold');
      
      const paginationData = dataNode?.pagination || body.pagination || { current: page, pages: 1, total: items.length };
      
      setInventory(itemsWithoutImages);
      setReadyForRelease(readyItems);
      setReleasedPets(releasedItems);
      setPurchasedPets(purchasedItems);
      
      setPagination({
        current: paginationData.current || paginationData.page || page,
        pages: paginationData.pages || paginationData.totalPages || 1,
        total: paginationData.total || paginationData.count || items.length
      });
      
      if (items.length === 0) {
        showSnackbar('No inventory items found. Try adding stock first or check your filters.', 'info');
      }
    } catch (err) {
      console.error('❌ Fetch inventory error:', err);
      showSnackbar(`Failed to load inventory: ${err.response?.data?.message || err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const applyBulkPrice = async () => {
    if (selectedIds.length === 0) {
      showSnackbar('Select at least one item', 'warning');
      return;
    }  

    try {
      setLoading(true);
      // compute new prices per selected item and update
      const mapById = new Map(inventory.map(it => [it._id, it]));
      const jobs = selectedIds.map(id => {
        const it = mapById.get(id);
        if (!it) return Promise.resolve();
        const curr = Number(it.price || 0);
        let next = curr;
        if (bulkPriceForm.mode === 'percent') {
          const delta = (curr * (Number(bulkPriceForm.value) || 0)) / 100;
          next = bulkPriceForm.op === 'increase' ? curr + delta : curr - delta;
        } else {
          const delta = Number(bulkPriceForm.value) || 0;
          next = bulkPriceForm.op === 'increase' ? curr + delta : Math.max(0, curr - delta);
        }
        next = Math.max(0, Math.round(next));
        return apiClient.put(`/petshop/inventory/${id}`, { price: next });
      });
      await Promise.all(jobs);
      showSnackbar('Prices updated successfully');
      setBulkPriceOpen(false);
      await fetchInventory(pagination.current);
    } catch (err) {
      console.error('Bulk price update error:', err);
      showSnackbar(err.response?.data?.message || 'Failed to update prices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const parseCsvText = (text) => {
    // simple CSV parser: split lines, handle commas, no quotes escaping advanced
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [], items: [] };
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(l => l.split(',').map(v => v.trim()));
    // map to items accepted by backend
    const items = rows.map(cols => {
      const o = {};
      headers.forEach((h, i) => { o[h] = cols[i]; });
      // normalize fields
      return {
        categoryId: o.categoryId || '',
        speciesId: o.speciesId || '',
        breedId: o.breedId || '',
        gender: o.gender || 'Unknown',
        age: Number(o.age || 0),
        ageUnit: o.ageUnit || 'months',
        ageGroup: o.ageGroup || undefined,
        status: o.status || 'in_petshop',
        source: o.source || 'Other',
        price: Number(o.price || o.basePrice || 0),
        unitCost: Number(o.unitCost || 0),
        quantity: 1,
        arrivalDate: o.arrivalDate || undefined,
        notes: o.notes || ''
      };
    });
    return { headers, rows, items };
  };

  const handleCsvFile = (file) => {
    if (!file) return;
    setCsvParsing(true);
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result?.toString() || '';
        const parsed = parseCsvText(text);
        setCsvPreview(parsed);
      } catch (e) {
        console.error('CSV parse error:', e);
        showSnackbar('Failed to parse CSV', 'error');
      } finally {
        setCsvParsing(false);
      }
    };
    reader.readAsText(file);
  };

  const importCsvItems = async () => {
    const items = csvPreview.items || [];
    if (items.length === 0) { showSnackbar('No items to import', 'warning'); return; }
    // basic validation: required ids
    const invalid = items.find(it => !(it.categoryId && it.speciesId && it.breedId));
    if (invalid) { showSnackbar('Each row must include categoryId,speciesId,breedId', 'error'); return; }
    try {
      setLoading(true);
      await apiClient.post('/petshop/manager/inventory/bulk', { items });
      showSnackbar(`Imported ${items.length} items`); 
      setCsvOpen(false);
      setCsvPreview({ headers: [], rows: [], items: [] });
      await fetchInventory(1);
    } catch (err) {
      console.error('CSV import error:', err);
      showSnackbar(err.response?.data?.message || 'Failed to import CSV', 'error');
    } finally { setLoading(false); }
  };

  const handleEditPet = (pet) => {
    setEditingPet(pet);
    setEditForm({
      name: pet.name || '',
      price: pet.price || 0,
      status: pet.status || 'in_petshop',
      notes: pet.notes || ''
    });
    setEditDialog(true);
  };

  const handleUpdatePet = async () => {
    try {
      await apiClient.put(`/petshop/manager/inventory/${editingPet._id}`, editForm);
      showSnackbar('Pet updated successfully!');
      setEditDialog(false);
      setEditingPet(null);
      fetchInventory(pagination.current);
    } catch (err) {
      console.error('Update pet error:', err);
      showSnackbar(err.response?.data?.message || 'Failed to update pet', 'error');
    }
  };

  const handleReleaseToPublic = async (petIds) => {
    try {
      const resp = await apiClient.post('/petshop/manager/inventory/publish-bulk', { itemIds: petIds });
      const data = resp?.data?.data || {};
      const published = Array.isArray(data.published) ? data.published.length : 0;
      const skipped = Array.isArray(data.skipped) ? data.skipped : [];

      if (published > 0) {
        showSnackbar(`Released ${published} item(s) to public`);
      }
      if (skipped.length > 0) {
        const reasonCounts = skipped.reduce((acc, s) => { acc[s.reason] = (acc[s.reason]||0)+1; return acc; }, {});
        const details = Object.entries(reasonCounts).map(([r,c]) => `${c} ${r.replaceAll('_',' ')}`).join(', ');
        showSnackbar(`Skipped ${skipped.length}: ${details}. Set price > 0 and add at least 1 image.`, 'warning');
      }
      setSelectedIds([]);
      fetchInventory(pagination.current);
    } catch (err) {
      console.error('Release pets error:', err);
      showSnackbar(err.response?.data?.message || 'Failed to release pets', 'error');
    }
  };

  const handleDeletePet = async (petId) => {
    if (!window.confirm('Are you sure you want to remove this pet from sale? This will mark the pet as removed from sale rather than permanently deleting it. The pet record will still be available for historical purposes.')) return;
    
    try {
      await apiClient.delete(`/petshop/inventory/${petId}`);
      showSnackbar('Pet removed from sale successfully!');
      fetchInventory(pagination.current);
    } catch (err) {
      console.error('Remove pet from sale error:', err);
      showSnackbar(err.response?.data?.message || 'Failed to remove pet from sale', 'error');
    }
  };

  const handleOpenImageDialog = (item) => {
    // Navigate to the new dedicated stock image management page
    navigate(`/manager/petshop/manage-stock-images/${item._id}`);
  };

  const handleUploadImage = async () => {
    if (!imageFile || !imageDialog.item) {
      showSnackbar('Please select an image file', 'warning');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', imageFile); // Backend expects 'file', not 'image'
      formData.append('caption', `Image for ${imageDialog.item.name || imageDialog.item.petCode}`);
      formData.append('isPrimary', 'true'); // Set as primary image
      
      // Use the correct endpoint with item ID in URL path
      const response = await apiClient.post(`/petshop/manager/inventory/${imageDialog.item._id}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      showSnackbar('Image uploaded successfully! Pet moved to Ready for Release.');
      setImageDialog({ open: false, item: null });
      setImageFile(null);
      
      // Update the local state immediately for better UX
      if (response?.data?.data?.item) {
        // Find the item in the current inventory and update it
        setInventory(prev => prev.map(item => 
          item._id === response.data.data.item._id ? response.data.data.item : item
        ));
        
        // Also update the readyForRelease if the item is now ready
        if (response.data.data.item.images && response.data.data.item.images.length > 0) {
          setReadyForRelease(prev => {
            // Remove from pending if it was there
            const updatedPending = prev.filter(item => item._id !== response.data.data.item._id);
            // Add to ready if not already there
            const exists = updatedPending.some(item => item._id === response.data.data.item._id);
            return exists ? updatedPending : [...updatedPending, response.data.data.item];
          });
        }
      } else {
        // Fallback to fetching all data if response doesn't contain updated item
        fetchInventory(pagination.current);
      }
    } catch (err) {
      console.error('Upload image error:', err);
      showSnackbar(err.response?.data?.message || 'Failed to upload image', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAllPending = () => {
    if (selectedIds.length === inventory.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(inventory.map(item => item._id));
    }
  };

  const handleSelectAllReady = () => {
    if (selectedReadyIds.length === readyForRelease.length) {
      setSelectedReadyIds([]);
    } else {
      setSelectedReadyIds(readyForRelease.map(item => item._id));
    }
  };

  const handleSelectAllReleased = () => {
    if (selectedReleasedIds.length === releasedPets.length) {
      setSelectedReleasedIds([]);
    } else {
      setSelectedReleasedIds(releasedPets.map(item => item._id));
    }
  };

  const handleSelectAllPurchased = () => {
    if (selectedPurchasedIds.length === purchasedPets.length) {
      setSelectedPurchasedIds([]);
    } else {
      setSelectedPurchasedIds(purchasedPets.map(item => item._id));
    }
  };

  const handlePageChange = (event, value) => {
    fetchInventory(value);
  };

  const openFilterMenu = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const closeFilterMenu = () => {
    setFilterAnchorEl(null);
  };

  const resetFilters = () => {
    setStatusFilter('');
    setSpeciesFilter('');
    setBreedFilter('');
    setPriceMin('');
    setPriceMax('');
    setGenderFilter('');
    setAgeMin('');
    setAgeMax('');
    setSearchText('');
    closeFilterMenu();
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh', maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Header */}
      <HeaderSection setBulkPriceOpen={setBulkPriceOpen} setCsvOpen={setCsvOpen} />

      {/* Stats Cards */}
      <EnhancedStatsSection 
        inventory={inventory}
        readyForRelease={readyForRelease}
        releasedPets={releasedPets}
        purchasedPets={purchasedPets}
        selectedIds={selectedIds}
        selectedReadyIds={selectedReadyIds}
        selectedReleasedIds={selectedReleasedIds}
        selectedPurchasedIds={selectedPurchasedIds}
      />

      {/* Search and Filters */}
      <FilterSection 
        searchText={searchText}
        setSearchText={setSearchText}
        openFilterMenu={openFilterMenu}
        filterOpen={filterOpen}
        filterAnchorEl={filterAnchorEl}
        closeFilterMenu={closeFilterMenu}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        speciesFilter={speciesFilter}
        setSpeciesFilter={setSpeciesFilter}
        breedFilter={breedFilter}
        setBreedFilter={setBreedFilter}
        priceMin={priceMin}
        setPriceMin={setPriceMin}
        priceMax={priceMax}
        setPriceMax={setPriceMax}
        genderFilter={genderFilter}
        setGenderFilter={setGenderFilter}
        ageMin={ageMin}
        setAgeMin={setAgeMin}
        ageMax={ageMax}
        setAgeMax={setAgeMax}
        speciesOptions={speciesOptions}
        breedOptions={breedOptions}
        resetFilters={resetFilters}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
      
      {/* Filter Menu */}
      <FilterMenu
        filterOpen={filterOpen}
        filterAnchorEl={filterAnchorEl}
        closeFilterMenu={closeFilterMenu}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        speciesFilter={speciesFilter}
        setSpeciesFilter={setSpeciesFilter}
        breedFilter={breedFilter}
        setBreedFilter={setBreedFilter}
        priceMin={priceMin}
        setPriceMin={setPriceMin}
        priceMax={priceMax}
        setPriceMax={setPriceMax}
        genderFilter={genderFilter}
        setGenderFilter={setGenderFilter}
        ageMin={ageMin}
        setAgeMin={setAgeMin}
        ageMax={ageMax}
        setAgeMax={setAgeMax}
        speciesOptions={speciesOptions}
        breedOptions={breedOptions}
      />

      {/* Tabs for different sections */}
      <InventoryTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        inventory={inventory}
        readyForRelease={readyForRelease}
        releasedPets={releasedPets}
        purchasedPets={purchasedPets}
      />

      {/* Main Content Area */}
      <Card sx={{ boxShadow: 4, borderRadius: 2 }}>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <EnhancedTabContent
              activeTab={activeTab}
              inventory={inventory}
              readyForRelease={readyForRelease}
              releasedPets={releasedPets}
              purchasedPets={purchasedPets}
              selectedIds={selectedIds}
              selectedReadyIds={selectedReadyIds}
              selectedReleasedIds={selectedReleasedIds}
              selectedPurchasedIds={selectedPurchasedIds}
              viewMode={viewMode}
              pagination={pagination}
              handleSelectAllPending={handleSelectAllPending}
              handleSelectAllReady={handleSelectAllReady}
              handleSelectAllReleased={handleSelectAllReleased}
              handleSelectAllPurchased={handleSelectAllPurchased}
              handlePageChange={handlePageChange}
              handleEditPet={handleEditPet}
              handleOpenImageDialog={handleOpenImageDialog}
              handleDeletePet={handleDeletePet}
              handleReleaseToPublic={handleReleaseToPublic}
              setActiveTab={setActiveTab}
              setSelectedIds={setSelectedIds}
            />
          )}
        </CardContent>
      </Card>

      {/* Floating Action Button for Quick Actions */}
      <Fab 
        color="primary" 
        aria-label="add" 
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          right: 16,
          boxShadow: 6
        }}
        onClick={() => navigate('/manager/petshop/wizard/basic')}
      >
        <AddPhotoAlternateIcon />
      </Fab>

      {/* Edit Pet Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon />
            Edit Pet Details
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Pet Name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter pet name (optional)"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Selling Price"
                type="number"
                value={editForm.price}
                onChange={(e) => setEditForm(prev => ({ 
                  ...prev, 
                  price: parseFloat(e.target.value) || 0 
                }))}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="in_petshop">In PetShop</MenuItem>
                  <MenuItem value="available_for_sale">Available for Sale</MenuItem>
                  <MenuItem value="reserved">Reserved</MenuItem>
                  <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                  <MenuItem value="sold">Sold</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any special notes about this pet..."
              />
            </Grid>
            
            {editingPet && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Pet Information
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Code:</strong> {editingPet.petCode || `PET-${editingPet._id?.slice(-6)}`}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Species:</strong> {editingPet.speciesId?.displayName || editingPet.speciesId?.name || 'Unknown'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Breed:</strong> {editingPet.breedId?.name || 'Unknown'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Age:</strong> {editingPet.age} {editingPet.ageUnit} • <strong>Gender:</strong> {editingPet.gender}
                  </Typography>
                  {editingPet.ageGroup && (
                    <Typography variant="body2" color="textSecondary">
                      <strong>Age Group:</strong> {editingPet.ageGroup}
                    </Typography>
                  )}
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdatePet} variant="contained">
            Update Pet
          </Button>
        </DialogActions>
      </Dialog>
      {/* Image Upload Dialog */}
      <Dialog open={imageDialog.open} onClose={() => setImageDialog({ open: false, item: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddPhotoAlternateIcon />
            Upload Image
          </Box>
        </DialogTitle>
        <DialogContent>
          {imageDialog.item && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Pet Information
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box sx={{ width: 60, height: 60, borderRadius: '50%', bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PetsIcon style={{ color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    {imageDialog.item.name || 'Unnamed Pet'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Code: {imageDialog.item.petCode || `PET-${imageDialog.item._id?.slice(-6)}`}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {imageDialog.item.speciesId?.displayName || imageDialog.item.speciesId?.name || 'Unknown Species'} • {imageDialog.item.breedId?.name || 'Unknown Breed'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Select an image file to upload
            </Typography>
            <Button 
              variant="outlined" 
              component="label" 
              fullWidth
              sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudUploadIcon />
                {imageFile ? (
                  <Typography variant="body2">{imageFile.name}</Typography>
                ) : (
                  <Typography variant="body2">Choose image file (JPG, PNG, WEBP, GIF)</Typography>
                )}
              </Box>
              <input 
                hidden 
                type="file" 
                accept="image/*" 
                onChange={(e) => setImageFile(e.target.files?.[0] || null)} 
              />
            </Button>
            
            {imageFile && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Image Preview
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <img 
                    src={URL.createObjectURL(imageFile)} 
                    alt="Preview" 
                    style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4 }}
                    onError={(e) => {
                      e.target.src = '/placeholder-pet.svg'; // Fallback image
                    }}
                  />
                </Box>
              </Box>
            )}
            
            <TextField
              fullWidth
              label="Caption (optional)"
              value={imageDialog.item?.name ? `Image for ${imageDialog.item.name}` : ''}
              disabled
              sx={{ mt: 2 }}
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Checkbox 
                checked 
                disabled 
                size="small"
              />
              <Typography variant="caption">
                Set as primary image
              </Typography>
            </Box>
          </Box>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Tip:</strong> Upload high-quality images (minimum 800x600px) for best results. 
              Pets with images can be released to the public for viewing and booking.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageDialog({ open: false, item: null })}>Cancel</Button>
          <Button 
            onClick={handleUploadImage} 
            variant="contained" 
            disabled={!imageFile}
            startIcon={<CloudUploadIcon />}
          >
            Upload Image
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Price Update Dialog */}
      <Dialog open={bulkPriceOpen} onClose={() => setBulkPriceOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PriceChangeIcon />
            Bulk Price Update
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Updating {selectedIds.length} item(s). Choose mode and amount.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Mode</InputLabel>
                <Select value={bulkPriceForm.mode} onChange={(e) => setBulkPriceForm(prev => ({ ...prev, mode: e.target.value }))}>
                  <MenuItem value="percent">Percent</MenuItem>
                  <MenuItem value="fixed">Fixed Amount</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Operation</InputLabel>
                <Select value={bulkPriceForm.op} onChange={(e) => setBulkPriceForm(prev => ({ ...prev, op: e.target.value }))}>
                  <MenuItem value="increase">Increase</MenuItem>
                  <MenuItem value="decrease">Decrease</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth type="number" label={bulkPriceForm.mode === 'percent' ? 'Percent (%)' : 'Amount (₹)'} value={bulkPriceForm.value} onChange={(e) => setBulkPriceForm(prev => ({ ...prev, value: Number(e.target.value) }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkPriceOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={applyBulkPrice} disabled={loading}>Apply</Button>
        </DialogActions>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={csvOpen} onClose={() => setCsvOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileUploadIcon />
            Import Inventory from CSV
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Required headers: categoryId,speciesId,breedId,gender,age,ageUnit,price,status,source,notes,arrivalDate
          </Typography>
          <Button variant="outlined" component="label" disabled={csvParsing}>
            {csvParsing ? 'Parsing...' : 'Choose CSV File'}
            <input hidden type="file" accept=".csv,text/csv" onChange={(e) => handleCsvFile(e.target.files?.[0])} />
          </Button>
          {csvFileName && (
            <Typography variant="caption" sx={{ ml: 2 }}>
              {csvFileName}
            </Typography>
          )}
          {csvPreview.items?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info">Parsed {csvPreview.items.length} item(s).</Alert>
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">Sample row preview:</Typography>
                <pre style={{ background: '#f7f7f7', padding: 12, borderRadius: 6, maxHeight: 200, overflow: 'auto' }}>{JSON.stringify(csvPreview.items[0], null, 2)}</pre>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCsvOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={importCsvItems} disabled={csvParsing || (csvPreview.items?.length || 0) === 0}>Import</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      {snackbar.open && (
        <Alert 
          severity={snackbar.severity}
          sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      )}
    </Box>
  );
};

export default RefactoredManageInventory;