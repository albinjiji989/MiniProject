import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  ListItemIcon,
  ListItemText,
  Avatar,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Pets as PetIcon,
  Person as OwnerIcon,
  LocationOn as LocationIcon,
  CalendarToday as DateIcon,
  Source as SourceIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';

const PetRegistry = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPets, setTotalPets] = useState(0);
  
  // Menu and dialog state
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);

  useEffect(() => {
    loadPets();
  }, [page, searchTerm, sourceFilter, locationFilter, statusFilter, showInactive]);

  const loadPets = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: searchTerm,
        source: sourceFilter,
        location: locationFilter,
        status: statusFilter,
        isDeleted: showInactive ? true : undefined
      };

      const response = await api.get('/admin/pet-registry', { params });
      const data = response.data?.data || [];
      const pagination = response.data?.pagination || {};

      setPets(Array.isArray(data) ? data : (data.pets || []));
      setTotalPages(pagination.pages || 1);
      setTotalPets(pagination.total || 0);
    } catch (err) {
      setError('Failed to load pets from registry');
      console.error('Error loading pets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case 'source':
        setSourceFilter(value);
        break;
      case 'location':
        setLocationFilter(value);
        break;
      case 'status':
        setStatusFilter(value);
        break;
      default:
        break;
    }
    setPage(1);
  };

  const handleMenuOpen = (event, pet) => {
    setAnchorEl(event.currentTarget);
    setSelectedPet(pet);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPet(null);
  };

  const getSourceColor = (source) => {
    switch (source) {
      case 'petshop': return 'primary';
      case 'adoption': return 'secondary';
      case 'user': return 'success';
      default: return 'default';
    }
  };

  const getLocationColor = (location) => {
    switch (location) {
      case 'at_petshop': return 'primary';
      case 'at_adoption_center': return 'secondary';
      case 'at_owner': return 'success';
      case 'in_hospital': return 'error';
      case 'in_temporary_care': return 'warning';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'adopted': return 'info';
      case 'sold': return 'primary';
      case 'reserved': return 'warning';
      case 'in_hospital': return 'error';
      case 'in_temporary_care': return 'secondary';
      default: return 'default';
    }
  };

  if (loading && pets.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Pet Registry
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Central registry of all pets in the system ({totalPets} total)
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadPets}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search by pet name, code..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Source</InputLabel>
                <Select
                  value={sourceFilter}
                  onChange={(e) => handleFilterChange('source', e.target.value)}
                >
                  <MenuItem value="">All Sources</MenuItem>
                  <MenuItem value="petshop">Pet Shop</MenuItem>
                  <MenuItem value="adoption">Adoption Center</MenuItem>
                  <MenuItem value="user">User Added</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Location</InputLabel>
                <Select
                  value={locationFilter}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                >
                  <MenuItem value="">All Locations</MenuItem>
                  <MenuItem value="at_petshop">At Pet Shop</MenuItem>
                  <MenuItem value="at_adoption_center">At Adoption Center</MenuItem>
                  <MenuItem value="at_owner">With Owner</MenuItem>
                  <MenuItem value="in_hospital">In Hospital</MenuItem>
                  <MenuItem value="in_temporary_care">In Temporary Care</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="adopted">Adopted</MenuItem>
                  <MenuItem value="sold">Sold</MenuItem>
                  <MenuItem value="reserved">Reserved</MenuItem>
                  <MenuItem value="in_hospital">In Hospital</MenuItem>
                  <MenuItem value="in_temporary_care">In Temporary Care</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                  />
                }
                label="Deleted"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Pets Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pet</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Added</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pets.map((pet) => (
                  <TableRow key={pet.petCode} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <PetIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {pet.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {pet.petCode}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={pet.sourceLabel || pet.source}
                        color={getSourceColor(pet.source)}
                        size="small"
                        icon={<SourceIcon />}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={pet.currentLocation.replace(/_/g, ' ')}
                        color={getLocationColor(pet.currentLocation)}
                        size="small"
                        icon={<LocationIcon />}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={pet.currentStatus}
                        color={getStatusColor(pet.currentStatus)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <OwnerIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {pet.currentOwnerId?.name || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <DateIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {new Date(pet.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/admin/pet-registry/${pet.petCode}`)}
                            color="primary"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More Actions">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, pet)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {pets.length === 0 && !loading && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No pets found in registry
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try adjusting your filters
              </Typography>
            </Box>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { navigate(`/admin/pet-registry/${selectedPet?.petCode}`); handleMenuClose(); }}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
      </Menu>

      {/* Error/Success Messages */}
      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      )}

      {success && (
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>
      )}
    </Container>
  );
};

export default PetRegistry;
