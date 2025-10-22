import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  TextField, 
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { Search as SearchIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import axios from 'axios';

const CentralizedRegistry = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/pets/centralized/stats/overview');
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`/api/pets/centralized/search/${encodeURIComponent(searchTerm)}`);
      setPets(response.data.data.pets);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search pets');
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/pets/centralized/recent/10');
      setPets(response.data.data.pets);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch recent pets');
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          Centralized Pet Registry
        </Typography>
        <Button 
          startIcon={<RefreshIcon />} 
          onClick={handleRefresh}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">By Source</Typography>
                {Object.entries(stats.bySource).map(([source, count]) => (
                  <Box key={source} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography>{source}</Typography>
                    <Chip label={count} size="small" />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">By Status</Typography>
                {Object.entries(stats.byStatus).map(([status, count]) => (
                  <Box key={status} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography>{status}</Typography>
                    <Chip label={count} size="small" color="primary" />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">By Location</Typography>
                {Object.entries(stats.byLocation).map(([location, count]) => (
                  <Box key={location} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography>{location}</Typography>
                    <Chip label={count} size="small" color="secondary" />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Box component="form" onSubmit={handleSearch} sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={10}>
            <TextField
              fullWidth
              label="Search Registry"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by pet name or code..."
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button 
              fullWidth 
              type="submit" 
              variant="contained" 
              startIcon={<SearchIcon />}
              disabled={loading}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Registry Results ({pets.length})
            </Typography>
            
            {pets.length === 0 ? (
              <Alert severity="info">
                No pets found in the registry. Try a different search term or refresh to see recent entries.
              </Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Pet Code</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Species</TableCell>
                      <TableCell>Breed</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Source</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pets.map((pet) => (
                      <TableRow key={pet._id}>
                        <TableCell>{pet.petCode}</TableCell>
                        <TableCell>{pet.name}</TableCell>
                        <TableCell>{pet.species?.name || 'Unknown'}</TableCell>
                        <TableCell>{pet.breed?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={pet.currentStatus} 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{pet.currentLocation || 'Unknown'}</TableCell>
                        <TableCell>{pet.source}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default CentralizedRegistry;