import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Alert,
  Card,
  CardContent,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { 
  ArrowBack as BackIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { petShopStockAPI } from '../../../services/api';

export default function GeneratePetsFromStock() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stock, setStock] = useState(null);
  const [maleCount, setMaleCount] = useState(0);
  const [femaleCount, setFemaleCount] = useState(0);
  const [generatedPets, setGeneratedPets] = useState([]);

  useEffect(() => {
    loadStock();
  }, [id]);

  const loadStock = async () => {
    try {
      setLoading(true);
      const res = await petShopStockAPI.getStockById(id);
      setStock(res.data.data.stock);
      
      // Set default values to available counts
      setMaleCount(res.data.data.stock.maleCount || 0);
      setFemaleCount(res.data.data.stock.femaleCount || 0);
    } catch (err) {
      console.error('Error loading stock:', err);
      setError('Failed to load stock details');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (maleCount <= 0 && femaleCount <= 0) {
      setError('Please enter at least one pet to generate');
      return;
    }
    
    if (maleCount > (stock?.maleCount || 0)) {
      setError(`Cannot generate more male pets than available (${stock?.maleCount || 0})`);
      return;
    }
    
    if (femaleCount > (stock?.femaleCount || 0)) {
      setError(`Cannot generate more female pets than available (${stock?.femaleCount || 0})`);
      return;
    }

    try {
      setGenerating(true);
      setError('');
      setSuccess('');

      // Generate pets from stock
      const res = await petShopStockAPI.generatePetsFromStock(id, { maleCount, femaleCount });
      
      setGeneratedPets(res.data.data.generatedPets);
      setSuccess(`${res.data.data.generatedPets.length} pets generated successfully!`);
      
      // Refresh stock data to get updated counts
      await loadStock();
    } catch (err) {
      console.error('Error generating pets:', err);
      setError('Failed to generate pets: ' + (err.response?.data?.message || err.message));
    } finally {
      setGenerating(false);
    }
  };

  const steps = ['Select Counts', 'Generate Pets', 'Review'];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!stock) {
    return (
      <Box>
        <Typography variant="h6">Stock not found</Typography>
        <Button onClick={() => navigate('/manager/petshop/stocks')}>Back to Stocks</Button>
      </Box>
    );
  }

  return (
    <Box className="space-y-6">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<BackIcon />} 
          onClick={() => navigate('/manager/petshop/stocks')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h5">Generate Pets from Stock</Typography>
      </Box>
      
      <Stepper activeStep={generatedPets.length > 0 ? 2 : maleCount > 0 || femaleCount > 0 ? 1 : 0} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>
      )}
      
      {generatedPets.length > 0 ? (
        // Review step - show generated pets
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Generated Pets</Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Successfully generated {generatedPets.length} pets from stock "{stock.name}".
            </Typography>
            
            <Grid container spacing={2}>
              {generatedPets.map((pet) => (
                <Grid item xs={12} sm={6} md={4} key={pet._id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1">{pet.name || 'Unnamed Pet'}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Gender: {pet.gender}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Pet Code: {pet.petCode}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Status: {pet.status}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button 
                variant="outlined" 
                onClick={() => {
                  setGeneratedPets([]);
                  setSuccess('');
                }}
              >
                Generate More
              </Button>
              <Button 
                variant="contained" 
                onClick={() => navigate('/manager/petshop/manage-inventory')}
              >
                View in Inventory
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        // Selection step - choose how many pets to generate
        <>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Stock Details</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6">{stock.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {stock.breedId?.name} {stock.speciesId?.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Price: ₹{stock.price?.toFixed(2) || '0.00'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">
                    Available Male: {stock.maleCount}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Available Female: {stock.femaleCount}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Generate Pets</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Select how many male and female pets you want to generate from this stock. 
                These pets will be added to your inventory and made available for sale.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Male Pets"
                    type="number"
                    value={maleCount}
                    onChange={(e) => setMaleCount(Math.max(0, parseInt(e.target.value) || 0))}
                    InputProps={{ inputProps: { min: 0, max: stock.maleCount } }}
                    helperText={`Available: ${stock.maleCount}`}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Female Pets"
                    type="number"
                    value={femaleCount}
                    onChange={(e) => setFemaleCount(Math.max(0, parseInt(e.target.value) || 0))}
                    InputProps={{ inputProps: { min: 0, max: stock.femaleCount } }}
                    helperText={`Available: ${stock.femaleCount}`}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button 
                  variant="contained" 
                  onClick={handleGenerate}
                  disabled={generating || (maleCount === 0 && femaleCount === 0)}
                  startIcon={generating ? <CircularProgress size={20} /> : <CheckIcon />}
                >
                  {generating ? 'Generating...' : 'Generate Pets'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}