import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Chip,
  IconButton,
  Stack,
  Divider,
  Alert,
  InputAdornment,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Paper,
  ImageList,
  ImageListItem,
  ImageListItemBar
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { apiClient, resolveMediaUrl } from '../../../services/api';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const PET_TYPES = ['dog', 'cat', 'bird', 'fish', 'rabbit', 'hamster', 'all'];
const AGE_GROUPS = ['puppy', 'adult', 'senior', 'all'];

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [categories, setCategories] = useState([]);
  const [speciesList, setSpeciesList] = useState([]);
  const [breedsList, setBreedsList] = useState([]);
  const [filteredBreeds, setFilteredBreeds] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    category: '',
    subcategory: '',
    tags: [],
    petType: [],
    species: [],
    breeds: [],
    ageGroup: [],
    basePrice: '',
    salePrice: '',
    costPrice: '',
    sku: '',
    stock: '',
    lowStockThreshold: 10,
    brand: '',
    manufacturer: '',
    weight: '',
    status: 'draft'
  });

  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    loadData();
    if (isEditMode) {
      loadProduct();
    }
  }, [id]);

  useEffect(() => {
    // Filter breeds based on selected species
    if (formData.species.length > 0) {
      const filtered = breedsList.filter(breed => 
        formData.species.includes(breed.species?._id || breed.species)
      );
      setFilteredBreeds(filtered);
    } else {
      setFilteredBreeds(breedsList);
    }
  }, [formData.species, breedsList]);

  const loadData = async () => {
    try {
      const [categoriesRes, speciesRes, breedsRes] = await Promise.all([
        apiClient.get('/ecommerce/manager/categories'),
        apiClient.get('/adoption/manager/species'),
        apiClient.get('/adoption/manager/breeds')
      ]);
      setCategories(categoriesRes.data.data || []);
      setSpeciesList(speciesRes.data.data || []);
      setBreedsList(breedsRes.data.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const loadProduct = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/ecommerce/manager/products/${id}`);
      const product = res.data.data;
      
      setFormData({
        name: product.name || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        category: product.category?._id || product.category || '',
        subcategory: product.subcategory?._id || product.subcategory || '',
        tags: product.tags || [],
        petType: product.petType || [],
        species: product.species?.map(s => s._id || s) || [],
        breeds: product.breeds?.map(b => b._id || b) || [],
        ageGroup: product.ageGroup || [],
        basePrice: product.pricing?.basePrice || '',
        salePrice: product.pricing?.salePrice || '',
        costPrice: product.pricing?.costPrice || '',
        sku: product.inventory?.sku || '',
        stock: product.inventory?.stock || '',
        lowStockThreshold: product.inventory?.lowStockThreshold || 10,
        brand: product.attributes?.brand || '',
        manufacturer: product.attributes?.manufacturer || '',
        weight: product.attributes?.weight || '',
        status: product.status || 'draft'
      });

      if (product.images && product.images.length > 0) {
        setImages(product.images);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load product');
      console.error('Error loading product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelect = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);
    
    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (imageFiles.length === 0) return [];
    
    setUploadingImages(true);
    const uploadedUrls = [];
    
    try {
      for (const file of imageFiles) {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await apiClient.post('/adoption/manager/pets/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (res.data?.data?.url) {
          uploadedUrls.push(res.data.data.url);
        }
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      throw new Error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
    
    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }
    if (!formData.description.trim()) {
      setError('Product description is required');
      return;
    }
    if (!formData.category) {
      setError('Category is required');
      return;
    }
    if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
      setError('Valid base price is required');
      return;
    }

    try {
      setLoading(true);

      // Upload new images
      let newImageUrls = [];
      if (imageFiles.length > 0) {
        newImageUrls = await uploadImages();
      }

      // Combine existing and new images
      const allImages = [...images, ...newImageUrls];

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        shortDescription: formData.shortDescription.trim(),
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        tags: formData.tags,
        petType: formData.petType.length > 0 ? formData.petType : ['all'],
        species: formData.species,
        breeds: formData.breeds,
        ageGroup: formData.ageGroup.length > 0 ? formData.ageGroup : ['all'],
        pricing: {
          basePrice: parseFloat(formData.basePrice),
          salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
          costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined
        },
        inventory: {
          sku: formData.sku || undefined,
          stock: formData.stock ? parseInt(formData.stock) : 0,
          lowStockThreshold: formData.lowStockThreshold || 10
        },
        attributes: {
          brand: formData.brand || undefined,
          manufacturer: formData.manufacturer || undefined,
          weight: formData.weight || undefined
        },
        images: allImages,
        status: formData.status
      };

      if (isEditMode) {
        await apiClient.put(`/ecommerce/manager/products/${id}`, productData);
        setSuccess('Product updated successfully!');
      } else {
        await apiClient.post('/ecommerce/manager/products', productData);
        setSuccess('Product created successfully!');
      }

      setTimeout(() => {
        navigate('/manager/ecommerce/products');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} product`);
      console.error('Error saving product:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/manager/ecommerce/products')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={700}>
          {isEditMode ? 'Edit Product' : 'Add New Product'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Product Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      helperText="Enter a clear and descriptive product name"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Short Description"
                      name="shortDescription"
                      value={formData.shortDescription}
                      onChange={handleChange}
                      multiline
                      rows={2}
                      helperText="Brief description for product listings"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Full Description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      multiline
                      rows={4}
                      required
                      helperText="Detailed product description with features and benefits"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Pet Recommendations
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Pet Types</InputLabel>
                      <Select
                        multiple
                        value={formData.petType}
                        onChange={(e) => handleMultiSelect('petType', e.target.value)}
                        input={<OutlinedInput label="Pet Types" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                        MenuProps={MenuProps}
                      >
                        {PET_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>
                            <Checkbox checked={formData.petType.indexOf(type) > -1} />
                            <ListItemText primary={type.charAt(0).toUpperCase() + type.slice(1)} />
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>Select pet types this product is suitable for</FormHelperText>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Age Groups</InputLabel>
                      <Select
                        multiple
                        value={formData.ageGroup}
                        onChange={(e) => handleMultiSelect('ageGroup', e.target.value)}
                        input={<OutlinedInput label="Age Groups" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                        MenuProps={MenuProps}
                      >
                        {AGE_GROUPS.map((age) => (
                          <MenuItem key={age} value={age}>
                            <Checkbox checked={formData.ageGroup.indexOf(age) > -1} />
                            <ListItemText primary={age.charAt(0).toUpperCase() + age.slice(1)} />
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>Select age groups this product is suitable for</FormHelperText>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Species (Optional)</InputLabel>
                      <Select
                        multiple
                        value={formData.species}
                        onChange={(e) => handleMultiSelect('species', e.target.value)}
                        input={<OutlinedInput label="Species (Optional)" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => {
                              const species = speciesList.find(s => s._id === value);
                              return <Chip key={value} label={species?.name || value} size="small" />;
                            })}
                          </Box>
                        )}
                        MenuProps={MenuProps}
                      >
                        {speciesList.map((species) => (
                          <MenuItem key={species._id} value={species._id}>
                            <Checkbox checked={formData.species.indexOf(species._id) > -1} />
                            <ListItemText primary={species.name} />
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>Recommend for specific species</FormHelperText>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Breeds (Optional)</InputLabel>
                      <Select
                        multiple
                        value={formData.breeds}
                        onChange={(e) => handleMultiSelect('breeds', e.target.value)}
                        input={<OutlinedInput label="Breeds (Optional)" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => {
                              const breed = breedsList.find(b => b._id === value);
                              return <Chip key={value} label={breed?.name || value} size="small" />;
                            })}
                          </Box>
                        )}
                        MenuProps={MenuProps}
                      >
                        {filteredBreeds.map((breed) => (
                          <MenuItem key={breed._id} value={breed._id}>
                            <Checkbox checked={formData.breeds.indexOf(breed._id) > -1} />
                            <ListItemText primary={`${breed.name} ${breed.species?.name ? `(${breed.species.name})` : ''}`} />
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>Recommend for specific breeds</FormHelperText>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Product Images
                </Typography>
                
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  sx={{ mb: 2 }}
                >
                  Upload Images
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                  />
                </Button>

                {/* Existing Images */}
                {images.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Current Images</Typography>
                    <ImageList cols={4} gap={8}>
                      {images.map((img, index) => (
                        <ImageListItem key={index}>
                          <img
                            src={resolveMediaUrl(img)}
                            alt={`Product ${index + 1}`}
                            style={{ height: 150, objectFit: 'cover' }}
                          />
                          <ImageListItemBar
                            actionIcon={
                              <IconButton
                                sx={{ color: 'white' }}
                                onClick={() => handleRemoveExistingImage(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            }
                          />
                        </ImageListItem>
                      ))}
                    </ImageList>
                  </Box>
                )}

                {/* New Image Previews */}
                {imagePreviews.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>New Images</Typography>
                    <ImageList cols={4} gap={8}>
                      {imagePreviews.map((preview, index) => (
                        <ImageListItem key={index}>
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            style={{ height: 150, objectFit: 'cover' }}
                          />
                          <ImageListItemBar
                            actionIcon={
                              <IconButton
                                sx={{ color: 'white' }}
                                onClick={() => handleRemoveImage(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            }
                          />
                        </ImageListItem>
                      ))}
                    </ImageList>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Categorization
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Category</InputLabel>
                      <Select
                        name="category"
                        value={formData.category}
                        label="Category"
                        onChange={handleChange}
                      >
                        {categories.map((cat) => (
                          <MenuItem key={cat._id} value={cat._id}>
                            {cat.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        name="status"
                        value={formData.status}
                        label="Status"
                        onChange={handleChange}
                      >
                        <MenuItem value="draft">Draft</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Pricing
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Base Price"
                      name="basePrice"
                      type="number"
                      value={formData.basePrice}
                      onChange={handleChange}
                      required
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Sale Price"
                      name="salePrice"
                      type="number"
                      value={formData.salePrice}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>
                      }}
                      helperText="Leave empty if no sale"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Cost Price"
                      name="costPrice"
                      type="number"
                      value={formData.costPrice}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>
                      }}
                      helperText="For profit calculation"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Inventory
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="SKU"
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      helperText="Stock Keeping Unit"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Stock Quantity"
                      name="stock"
                      type="number"
                      value={formData.stock}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Low Stock Alert"
                      name="lowStockThreshold"
                      type="number"
                      value={formData.lowStockThreshold}
                      onChange={handleChange}
                      helperText="Alert when stock falls below this"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Additional Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Brand"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Manufacturer"
                      name="manufacturer"
                      value={formData.manufacturer}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Weight"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      helperText="e.g., 1kg, 500g"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Box sx={{ mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                startIcon={<SaveIcon />}
                disabled={loading || uploadingImages}
              >
                {loading ? 'Saving...' : uploadingImages ? 'Uploading Images...' : isEditMode ? 'Update Product' : 'Create Product'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default ProductForm;
