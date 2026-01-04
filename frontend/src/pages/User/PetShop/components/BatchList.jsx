import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Pagination,
  Paper,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { apiClient } from '../../../../services/api';
import BatchCard from './BatchCard';
import BatchDetails from './BatchDetails';

/**
 * BatchList Component
 * Displays list of batches with filtering and pagination
 */
const BatchList = ({ shopId, onReserve }) => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(12);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [breedFilter, setBreedFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // UI State
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  
  // Metadata
  const [species, setSpecies] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [categories, setCategories] = useState([]);

  // Load batches on mount and filter change
  useEffect(() => {
    loadBatches();
  }, [page, searchQuery, speciesFilter, breedFilter, categoryFilter, shopId]);

  // Load species for filter
  useEffect(() => {
    loadSpecies();
  }, []);

  const loadBatches = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        limit,
        status: 'published'
      };

      if (shopId) params.shopId = shopId;
      if (speciesFilter) params.speciesId = speciesFilter;
      if (breedFilter) params.breedId = breedFilter;
      if (categoryFilter) params.category = categoryFilter;

      const response = await apiClient.get('/petshop/manager/batches', { params });

      setBatches(response.data.data || []);
      setTotal(response.data.pagination?.total || 0);

      // Extract categories from batches for filter
      const uniqueCategories = [...new Set(response.data.data?.map(b => b.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error loading batches:', err);
      setError(err.response?.data?.message || 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const loadSpecies = async () => {
    try {
      const response = await apiClient.get('/core/species', { params: { limit: 100 } });
      setSpecies(response.data.data?.items || []);
    } catch (err) {
      console.error('Error loading species:', err);
    }
  };

  const handleLoadBreeds = async (speciesId) => {
    if (!speciesId) {
      setBreeds([]);
      return;
    }

    try {
      const response = await apiClient.get('/core/breeds', { 
        params: { speciesId, limit: 100 } 
      });
      setBreeds(response.data.data?.items || []);
    } catch (err) {
      console.error('Error loading breeds:', err);
    }
  };

  const handleSpeciesChange = (e) => {
    const newSpecies = e.target.value;
    setSpeciesFilter(newSpecies);
    setBreedFilter(''); // Reset breed when species changes
    handleLoadBreeds(newSpecies);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSpeciesFilter('');
    setBreedFilter('');
    setCategoryFilter('');
    setPage(1);
  };

  const handleBatchSelect = (batch) => {
    setSelectedBatch(batch);
    setDetailsOpen(true);
  };

  const handleFavoriteToggle = (batchId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(batchId)) {
      newFavorites.delete(batchId);
    } else {
      newFavorites.add(batchId);
    }
    setFavorites(newFavorites);
    // TODO: Save to localStorage or backend
  };

  const hasActiveFilters = searchQuery || speciesFilter || breedFilter || categoryFilter;

  return (
    <Box>
      {/* Filters Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder="Search batches..."
            variant="outlined"
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
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    onClick={() => {
                      setSearchQuery('');
                      setPage(1);
                    }}
                  >
                    <ClearIcon />
                  </Button>
                </InputAdornment>
              )
            }}
          />

          {/* Filter Grid */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Species</InputLabel>
                <Select
                  value={speciesFilter}
                  onChange={handleSpeciesChange}
                  label="Species"
                >
                  <MenuItem value="">All Species</MenuItem>
                  {species.map((sp) => (
                    <MenuItem key={sp._id} value={sp._id}>
                      {sp.displayName || sp.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth disabled={!speciesFilter}>
                <InputLabel>Breed</InputLabel>
                <Select
                  value={breedFilter}
                  onChange={(e) => {
                    setBreedFilter(e.target.value);
                    setPage(1);
                  }}
                  label="Breed"
                >
                  <MenuItem value="">All Breeds</MenuItem>
                  {breeds.map((breed) => (
                    <MenuItem key={breed._id} value={breed._id}>
                      {breed.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                disabled={!hasActiveFilters}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {searchQuery && (
                <Chip
                  label={`Search: ${searchQuery}`}
                  onDelete={() => setSearchQuery('')}
                  size="small"
                />
              )}
              {categoryFilter && (
                <Chip
                  label={`Category: ${categoryFilter}`}
                  onDelete={() => setCategoryFilter('')}
                  size="small"
                />
              )}
              {speciesFilter && (
                <Chip
                  label={`Species: ${species.find(s => s._id === speciesFilter)?.displayName}`}
                  onDelete={() => {
                    setSpeciesFilter('');
                    setBreedFilter('');
                  }}
                  size="small"
                />
              )}
              {breedFilter && (
                <Chip
                  label={`Breed: ${breeds.find(b => b._id === breedFilter)?.name}`}
                  onDelete={() => setBreedFilter('')}
                  size="small"
                />
              )}
            </Stack>
          )}
        </Stack>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : batches.length === 0 ? (
        <Alert severity="info">
          No batches found. Try adjusting your filters or check back later.
        </Alert>
      ) : (
        <>
          {/* Batches Grid */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {batches.map((batch) => (
              <Grid item xs={12} sm={6} md={4} key={batch._id}>
                <BatchCard
                  batch={batch}
                  onSelect={handleBatchSelect}
                  onReserve={() => {
                    setSelectedBatch(batch);
                    setDetailsOpen(true);
                    onReserve?.(batch);
                  }}
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

      {/* Batch Details Modal */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedBatch && (
          <BatchDetails
            batch={selectedBatch}
            onClose={() => setDetailsOpen(false)}
            onReserve={onReserve}
          />
        )}
      </Dialog>
    </Box>
  );
};

export default BatchList;
