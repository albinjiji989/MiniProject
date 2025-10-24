import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Stack,
  CircularProgress
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon, 
  Visibility as ViewIcon,
  Receipt as InvoiceIcon
} from '@mui/icons-material';
import { apiClient } from '../../../services/api';

const PurchasedPets = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [speciesOptions, setSpeciesOptions] = useState([]);
  const [breedOptions, setBreedOptions] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [limit, setLimit] = useState(10);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [speciesId, setSpeciesId] = useState('');
  const [breedId, setBreedId] = useState('');
  const [gender, setGender] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');

  useEffect(() => {
    fetchSpecies();
  }, []);

  useEffect(() => {
    if (!speciesId) { setBreedOptions([]); setBreedId(''); return; }
    (async () => {
      try {
        const res = await apiClient.get('/admin/breeds/active', { params: { speciesId } });
        setBreedOptions(res?.data?.data || []);
      } catch (_) { setBreedOptions([]); }
    })();
  }, [speciesId]);

  useEffect(() => {
    fetchItems(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, speciesId, breedId, gender, priceMin, priceMax, ageMin, ageMax, limit]);

  const fetchSpecies = async () => {
    try {
      const res = await apiClient.get('/admin/species/active');
      setSpeciesOptions(res?.data?.data || []);
    } catch (_) { setSpeciesOptions([]); }
  };

  const fetchItems = async (page = 1) => {
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      qs.set('page', String(page));
      qs.set('limit', String(limit));
      qs.set('status', 'paid,delivered,at_owner,completed'); // Statuses for purchased pets
      if (speciesId) qs.set('speciesId', speciesId);
      if (breedId) qs.set('breedId', breedId);
      if (gender) qs.set('gender', gender);
      if (priceMin) qs.set('priceMin', priceMin);
      if (priceMax) qs.set('priceMax', priceMax);
      if (ageMin) qs.set('ageMin', ageMin);
      if (ageMax) qs.set('ageMax', ageMax);
      if (searchText) qs.set('q', searchText.trim());

      const resp = await apiClient.get(`/petshop/manager/reservations/enhanced?${qs.toString()}`);
      const body = resp?.data || {};
      const dataNode = body.data ?? body;
      const list = Array.isArray(dataNode?.reservations) ? dataNode.reservations : [];
      setItems(list);
      const p = dataNode?.pagination || { current: page, pages: 1, total: list.length };
      setPagination({ current: p.current || page, pages: p.pages || 1, total: p.total || list.length });
    } catch (e) {
      console.error('Load purchased pets error:', e);
    } finally {
      setLoading(false);
    }
  };

  const viewInvoice = async (reservationId) => {
    try {
      // Generate and view invoice
      const resp = await apiClient.get(`/petshop/manager/dashboard/invoice/${reservationId}`);
      const invoiceData = resp?.data?.data?.invoice;
      
      // In a real implementation, you might want to open a PDF or show a modal
      // For now, we'll just show an alert with some invoice details
      alert(`Invoice Details:\nInvoice Number: ${invoiceData?.invoiceNumber}\nDate: ${new Date(invoiceData?.date).toLocaleDateString()}\nAmount: ₹${invoiceData?.payment?.amount}`);
    } catch (e) {
      console.error('View invoice error:', e);
      alert('Failed to load invoice');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/manager/petshop/manage-inventory')} sx={{ mr: 2 }}>
          Back to Manage Inventory
        </Button>
        <Typography variant="h4">Purchased Pets & Invoices</Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField size="small" label="Search (code/name/species/breed)" value={searchText} onChange={(e) => setSearchText(e.target.value)} sx={{ minWidth: 260 }} />

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Species</InputLabel>
              <Select label="Species" value={speciesId} onChange={(e) => setSpeciesId(e.target.value)}>
                <MenuItem value="">All Species</MenuItem>
                {speciesOptions.map(s => (
                  <MenuItem key={s._id} value={s._id}>{s.displayName || s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }} disabled={!speciesId}>
              <InputLabel>Breed</InputLabel>
              <Select label="Breed" value={breedId} onChange={(e) => setBreedId(e.target.value)}>
                <MenuItem value="">All Breeds</MenuItem>
                {breedOptions.map(b => (
                  <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Gender</InputLabel>
              <Select label="Gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Unknown">Unknown</MenuItem>
              </Select>
            </FormControl>

            <TextField size="small" type="number" label="Min Price" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} sx={{ width: 120 }} />
            <TextField size="small" type="number" label="Max Price" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} sx={{ width: 120 }} />
            <TextField size="small" type="number" label="Min Age" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} sx={{ width: 120 }} />
            <TextField size="small" type="number" label="Max Age" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} sx={{ width: 120 }} />

            <Button variant="outlined" onClick={() => { setSearchText(''); setSpeciesId(''); setBreedId(''); setGender(''); setPriceMin(''); setPriceMax(''); setAgeMin(''); setAgeMax(''); fetchItems(1) }}>Reset</Button>
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Purchased Pets ({items.length} items)</Typography>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Reservation Code</TableCell>
                  <TableCell>Pet Name</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Species/Breed</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item._id}>
                    <TableCell>
                      <Chip label={item.reservationCode || `RES-${item._id.slice(-6)}`} size="small" color="primary" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.itemId?.name || 'Unnamed Pet'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.userId?.name || 'Unknown Customer'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{item.itemId?.speciesId?.displayName || item.itemId?.speciesId?.name || 'Unknown Species'}</Typography>
                        <Typography variant="caption" color="textSecondary">{item.itemId?.breedId?.name || 'Unknown Breed'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">₹{Number(item.paymentDetails?.amount || 0).toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={item.status.replace('_', ' ')} 
                        color={
                          item.status === 'paid' ? 'primary' :
                          item.status === 'delivered' ? 'success' :
                          item.status === 'at_owner' ? 'success' :
                          item.status === 'completed' ? 'success' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small"
                          onClick={() => navigate(`/manager/petshop/reservation/${item._id}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Invoice">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => viewInvoice(item._id)}
                        >
                          <InvoiceIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {items.length === 0 && !loading && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No purchased pets found. Adjust filters or check back later.
            </Alert>
          )}

          <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
            <Pagination
              count={Math.max(1, Number(pagination.pages || 1))}
              page={Number(pagination.current || 1)}
              onChange={(_, p) => fetchItems(p)}
              color="primary"
            />
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PurchasedPets;