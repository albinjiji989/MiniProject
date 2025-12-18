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
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  AddAPhoto as AddPhotoIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import { petShopStockAPI } from '../../../services/api';

export default function ManageStockImages() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stock, setStock] = useState(null);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selectedGender, setSelectedGender] = useState('');

  useEffect(() => {
    loadStock();
  }, [id]);

  const loadStock = async () => {
    try {
      setLoading(true);
      const res = await petShopStockAPI.getStockById(id);
      setStock(res.data.data.stock);
    } catch (err) {
      console.error('Error loading stock:', err);
      setError('Failed to load stock details');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload image to stock
      await petShopStockAPI.uploadStockImage(id, formData, selectedGender);
      
      // Refresh stock data to get updated images
      await loadStock();
      setSuccess(`${selectedGender} image uploaded successfully`);
      setOpenUploadDialog(false);
    } catch (err) {
      console.error('Error uploading images:', err);
      setError('Failed to upload images: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const removeImage = async (imageId) => {
    try {
      setSaving(true);
      // Remove image from stock
      await petShopStockAPI.removeStockImage(id, imageId);
      
      // Refresh stock data to get updated images
      await loadStock();
      setSuccess('Image removed successfully');
    } catch (err) {
      console.error('Error removing image:', err);
      setError('Failed to remove image: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

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

  // Get all images (both male and female)
  const allImages = [
    ...(stock.maleImageIds || []).map(img => ({ ...img, gender: 'male' })),
    ...(stock.femaleImageIds || []).map(img => ({ ...img, gender: 'female' }))
  ];

  return (
    <Box className="space-y-6">
      <Typography variant="h6" sx={{ mb: 2 }}>Manage Stock Images</Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>
      )}
      
      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6">{stock.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                {stock.breedId?.name} {stock.speciesId?.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Male Count: {stock.maleCount} | Female Count: {stock.femaleCount}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">
                Price: ₹{stock.price?.toFixed(2) || '0.00'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Images ({allImages.length})</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddPhotoIcon />}
          onClick={() => setOpenUploadDialog(true)}
          disabled={saving}
        >
          Add Image
        </Button>
      </Box>
      
      {allImages.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <AddPhotoIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>No images uploaded</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Upload images to showcase this stock
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<UploadIcon />}
            onClick={() => setOpenUploadDialog(true)}
          >
            Upload Image
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {allImages.map((image) => (
            <Grid item xs={12} sm={6} md={4} key={image._id}>
              <Card>
                <Box sx={{ position: 'relative', pt: '75%' }}>
                  <img
                    src={image.url}
                    alt={`${image.gender} pet`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.src = '/placeholder-pet.svg';
                    }}
                  />
                  <IconButton
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(255, 255, 255, 0.8)',
                      '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' }
                    }}
                    onClick={() => removeImage(image._id)}
                    disabled={saving}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                  <Box sx={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    bgcolor: image.gender === 'male' ? 'primary.main' : 'secondary.main',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem'
                  }}>
                    {image.gender}
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/manager/petshop/stocks')}
        >
          Back to Stocks
        </Button>
        {(stock.maleCount > 0 || stock.femaleCount > 0) && (
          <Button 
            variant="contained" 
            onClick={() => navigate(`/manager/petshop/generate-pets/${stock._id}`)}
          >
            Generate Pets from Stock
          </Button>
        )}
      </Box>
      
      <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)}>
        <DialogTitle>Select Gender for Image</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Is this image for male or female pets in this stock?
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant={selectedGender === 'male' ? 'contained' : 'outlined'}
              color="primary"
              onClick={() => setSelectedGender('male')}
              disabled={saving}
            >
              Male
            </Button>
            <Button 
              variant={selectedGender === 'female' ? 'contained' : 'outlined'}
              color="secondary"
              onClick={() => setSelectedGender('female')}
              disabled={saving}
            >
              Female
            </Button>
          </Box>
          
          {selectedGender && (
            <Box sx={{ mt: 2 }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={saving}
                style={{ display: 'none' }}
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button 
                  variant="outlined" 
                  component="span"
                  disabled={saving}
                  fullWidth
                >
                  {saving ? <CircularProgress size={24} /> : 'Select Image'}
                </Button>
              </label>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Supported formats: JPG, PNG, GIF, WEBP
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenUploadDialog(false);
            setSelectedGender('');
          }}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}