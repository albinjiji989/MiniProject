import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient, resolveMediaUrl } from '../../../services/api';
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia, 
  Grid, 
  Button, 
  Chip, 
  Alert, 
  CircularProgress, 
  IconButton, 
  Tooltip,
  Divider,
  Avatar
} from '@mui/material';
import { 
  ArrowBack as BackIcon, 
  Edit as EditIcon, 
  Pets as PetsIcon, 
  Info as InfoIcon, 
  AttachMoney as MoneyIcon, 
  HealthAndSafety as HealthIcon, 
  ColorLens as ColorIcon, 
  Scale as WeightIcon, 
  Cake as AgeIcon, 
  Wc as GenderIcon,
  AddPhotoAlternate as AddPhotoIcon,
  PictureAsPdf as PdfIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

const PetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingMedia, setSavingMedia] = useState(false);
  const [showAllImages, setShowAllImages] = useState(false);
  const [showAllDocs, setShowAllDocs] = useState(false);
  const imgInputRef = React.useRef(null);
  const docInputRef = React.useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/adoption/manager/pets/${id}`);
        setPet(res.data?.data);
      } catch (e) {
        console.error('Load pet failed', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const readAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const extractUrl = (item) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    if (typeof item.url === 'string') return item.url;
    if (item.url && typeof item.url.url === 'string') return item.url.url;
    return '';
  };

  const uploadAndLinkMedia = async (imageUrls, docUrls) => {
    try {
      // Update pet with new media URLs
      const payload = {};
      if (imageUrls.length > 0) payload.images = imageUrls;
      if (docUrls.length > 0) payload.documents = docUrls;
      
      if (Object.keys(payload).length === 0) return;
      
      await apiClient.put(`/adoption/manager/pets/${id}`, payload);
    } catch (e) {
      console.error('Failed to link media to pet:', e);
      throw e;
    }
  };

  const onAddImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !pet) return;
    
    setSavingMedia(true);
    try {
      const newImageIds = [];
      
      // Upload each image to server
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await apiClient.post('/adoption/manager/pets/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (res.data?.data?._id) {
          newImageIds.push(res.data.data._id);
        }
      }
      
      // Get current image IDs
      const currentImageIds = (pet.imageIds || []).filter(id => typeof id === 'string' && id.length > 0);
      
      // Link all images to pet (existing + new)
      if (newImageIds.length > 0) {
        await apiClient.put(`/adoption/manager/pets/${id}`, {
          imageIds: [...currentImageIds, ...newImageIds]
        });
        
        // Reload pet to show new images
        const res = await apiClient.get(`/adoption/manager/pets/${id}`);
        setPet(res.data?.data);
      }
    } catch (e) {
      console.error('Add images failed', e);
      alert('Failed to add images. Please try again.');
    } finally {
      setSavingMedia(false);
    }
  };

  const onAddDocuments = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !pet) return;
    
    setSavingMedia(true);
    try {
      const newDocIds = [];
      
      // Upload each document to server
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await apiClient.post('/adoption/manager/pets/upload-document', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (res.data?.data?._id) {
          newDocIds.push(res.data.data._id);
        }
      }
      
      // Get current document IDs
      const currentDocIds = (pet.documentIds || []).filter(id => typeof id === 'string' && id.length > 0);
      
      // Link all documents to pet (existing + new)
      if (newDocIds.length > 0) {
        await apiClient.put(`/adoption/manager/pets/${id}`, {
          documentIds: [...currentDocIds, ...newDocIds]
        });
        
        // Reload pet to show new documents
        const res = await apiClient.get(`/adoption/manager/pets/${id}`);
        setPet(res.data?.data);
      }
    } catch (e) {
      console.error('Add documents failed', e);
      alert('Failed to add documents. Please try again.');
    } finally {
      setSavingMedia(false);
    }
  };

  const removeImage = async (idx) => {
    if (!pet || !Array.isArray(pet.images)) return;
    
    setSavingMedia(true);
    try {
      const newImages = pet.images.filter((_, i) => i !== idx);
      const imageUrls = newImages.map(img => ({ url: extractUrl(img), caption: img.caption || '' }));
      const docUrls = (pet.documents || []).map(doc => ({ url: extractUrl(doc), name: doc.name || 'document' }));
      
      await uploadAndLinkMedia(imageUrls, docUrls);
      
      // Reload pet
      const res = await apiClient.get(`/adoption/manager/pets/${id}`);
      setPet(res.data?.data);
    } catch (e) {
      console.error('Remove image failed', e);
      alert('Failed to remove image. Please try again.');
    } finally {
      setSavingMedia(false);
    }
  };

  const removeDocument = async (idx) => {
    if (!pet || !Array.isArray(pet.documents)) return;
    
    setSavingMedia(true);
    try {
      const newDocs = pet.documents.filter((_, i) => i !== idx);
      const imageUrls = (pet.images || []).map(img => ({ url: extractUrl(img), caption: img.caption || '' }));
      const docUrls = newDocs.map(doc => ({ url: extractUrl(doc), name: doc.name || 'document' }));
      
      await uploadAndLinkMedia(imageUrls, docUrls);
      
      // Reload pet
      const res = await apiClient.get(`/adoption/manager/pets/${id}`);
      setPet(res.data?.data);
    } catch (e) {
      console.error('Remove document failed', e);
      alert('Failed to remove document. Please try again.');
    } finally {
      setSavingMedia(false);
    }
  };

  if (loading) return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    </Container>
  );
  
  if (!pet) return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Alert severity="error">Pet not found</Alert>
    </Container>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Incomplete Profile Alert */}
      {(!pet.age && !pet.weight && !pet.color && !pet.description) && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              variant="contained" 
              onClick={()=>navigate('profile')}
            >
              Complete Profile
            </Button>
          }
        >
          <Alert.title>Profile incomplete</Alert.title>
          Some key details are missing. Please complete the pet profile.
        </Alert>
      )}
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
            <PetsIcon color="primary" />
            {(!pet.name || String(pet.name).startsWith('Unknown-')) ? 'No name' : pet.name}
            {(pet.petCode || pet._id) && (
              <Chip 
                label={pet.petCode || pet._id} 
                size="small" 
                variant="outlined" 
                sx={{ fontFamily: 'monospace' }} 
              />
            )}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {pet.breed} • {pet.species}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            startIcon={<BackIcon />} 
            onClick={()=>navigate(-1)}
          >
            Back
          </Button>
          <Button 
            variant="contained" 
            startIcon={<EditIcon />} 
            onClick={()=>navigate('edit')}
          >
            Edit
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            onClick={()=>navigate('profile')}
          >
            Complete Profile
          </Button>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        {/* Basic Info Card */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoIcon /> Basic Information
              </Typography>
              <Grid container spacing={2}>
                {pet.petCode && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Pet Code</Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{pet.petCode}</Typography>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Breed</Typography>
                  <Typography variant="body1">{pet.breed}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Species</Typography>
                  <Typography variant="body1">{pet.species}</Typography>
                </Grid>
                {pet.ageDisplay && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AgeIcon fontSize="small" /> Age
                    </Typography>
                    <Typography variant="body1">{pet.ageDisplay}</Typography>
                  </Grid>
                )}
                {pet.gender && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <GenderIcon fontSize="small" /> Gender
                    </Typography>
                    <Typography variant="body1">{pet.gender}</Typography>
                  </Grid>
                )}
                {pet.color && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ColorIcon fontSize="small" /> Color
                    </Typography>
                    <Typography variant="body1">{pet.color}</Typography>
                  </Grid>
                )}
                {typeof pet.weight === 'number' && pet.weight > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <WeightIcon fontSize="small" /> Weight
                    </Typography>
                    <Typography variant="body1">{pet.weight} kg</Typography>
                  </Grid>
                )}
                {pet.healthStatus && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <HealthIcon fontSize="small" /> Health Status
                    </Typography>
                    <Typography variant="body1">{pet.healthStatus}</Typography>
                  </Grid>
                )}
                {pet.vaccinationStatus && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Vaccination Status</Typography>
                    <Typography variant="body1">{pet.vaccinationStatus}</Typography>
                  </Grid>
                )}
                {pet.temperament && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Temperament</Typography>
                    <Typography variant="body1">{pet.temperament}</Typography>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={pet.status} 
                    size="small" 
                    color={
                      pet.status === 'available' ? 'success' :
                      pet.status === 'adopted' ? 'info' :
                      pet.status === 'reserved' ? 'warning' :
                      'default'
                    } 
                  />
                </Grid>
                {typeof pet.adoptionFee === 'number' && pet.adoptionFee > 0 && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <MoneyIcon fontSize="small" /> Adoption Fee
                    </Typography>
                    <Typography variant="body1">₹{pet.adoptionFee}</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Description Card */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Description
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                {pet.description || 'No description provided.'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Media Section */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Media
              </Typography>
              
              <Grid container spacing={3}>
                {/* Images */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AddPhotoIcon /> Images
                    </Typography>
                    <input 
                      type="file" 
                      ref={imgInputRef} 
                      style={{ display: 'none' }} 
                      accept="image/*" 
                      multiple 
                      onChange={onAddImages}
                      disabled={savingMedia}
                    />
                    <Button 
                      variant="contained" 
                      size="small" 
                      startIcon={<AddPhotoIcon />} 
                      onClick={()=>imgInputRef.current?.click()} 
                      disabled={savingMedia}
                    >
                      {savingMedia ? 'Adding...' : 'Add Image'}
                    </Button>
                  </Box>
                  
                  {savingMedia && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                      <Typography variant="body2" sx={{ ml: 1 }}>Saving images...</Typography>
                    </Box>
                  )}
                  
                  {(!pet.images || pet.images.length === 0) && !savingMedia && (
                    <Box 
                      sx={{ 
                        py: 4, 
                        textAlign: 'center', 
                        color: 'text.secondary', 
                        border: '1px dashed', 
                        borderColor: 'divider', 
                        borderRadius: 1 
                      }}
                    >
                      No images added yet
                    </Box>
                  )}
                  
                  {pet.images && pet.images.length > 0 && (
                    <Grid container spacing={2}>
                      {pet.images.slice(0, showAllImages ? pet.images.length : 6).map((img, idx) => {
                        const url = extractUrl(img);
                        if (!url) return null;
                        return (
                          <Grid item xs={6} sm={4} key={idx}>
                            <Box sx={{ position: 'relative' }}>
                              <CardMedia 
                                component="img" 
                                height="140" 
                                image={url} 
                                alt={`Pet ${idx + 1}`} 
                                sx={{ borderRadius: 1 }}
                              />
                              <Box 
                                sx={{ 
                                  position: 'absolute', 
                                  top: 4, 
                                  right: 4,
                                  display: 'flex',
                                  gap: 0.5
                                }}
                              >
                                <Tooltip title="Delete image">
                                  <IconButton 
                                    size="small" 
                                    sx={{ 
                                      bgcolor: 'rgba(255,255,255,0.8)',
                                      '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                                    }}
                                    onClick={()=>removeImage(idx)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                              {img.isPrimary && (
                                <Chip 
                                  label="Primary" 
                                  size="small" 
                                  color="primary" 
                                  sx={{ 
                                    position: 'absolute', 
                                    bottom: 4, 
                                    left: 4 
                                  }} 
                                />
                              )}
                            </Box>
                          </Grid>
                        );
                      })}
                      {pet.images.length > 6 && !showAllImages && (
                        <Grid item xs={12} sx={{ textAlign: 'center', mt: 1 }}>
                          <Button 
                            size="small" 
                            onClick={()=>setShowAllImages(true)}
                          >
                            Show {pet.images.length - 6} more images
                          </Button>
                        </Grid>
                      )}
                    </Grid>
                  )}
                </Grid>
                
                {/* Documents */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PdfIcon /> Documents
                    </Typography>
                    <input 
                      type="file" 
                      ref={docInputRef} 
                      style={{ display: 'none' }} 
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                      multiple 
                      onChange={onAddDocuments}
                      disabled={savingMedia}
                    />
                    <Button 
                      variant="contained" 
                      size="small" 
                      startIcon={<PdfIcon />} 
                      onClick={()=>docInputRef.current?.click()} 
                      disabled={savingMedia}
                    >
                      {savingMedia ? 'Adding...' : 'Add Document'}
                    </Button>
                  </Box>
                  
                  {savingMedia && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                      <Typography variant="body2" sx={{ ml: 1 }}>Saving documents...</Typography>
                    </Box>
                  )}
                  
                  {(!pet.documents || pet.documents.length === 0) && !savingMedia && (
                    <Box 
                      sx={{ 
                        py: 4, 
                        textAlign: 'center', 
                        color: 'text.secondary', 
                        border: '1px dashed', 
                        borderColor: 'divider', 
                        borderRadius: 1 
                      }}
                    >
                      No documents added yet
                    </Box>
                  )}
                  
                  {pet.documents && pet.documents.length > 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {pet.documents.slice(0, showAllDocs ? pet.documents.length : 4).map((doc, idx) => {
                        const url = extractUrl(doc);
                        if (!url) return null;
                        return (
                          <Card 
                            key={idx} 
                            variant="outlined" 
                            sx={{ display: 'flex', alignItems: 'center', p: 1 }}
                          >
                            <Avatar 
                              sx={{ 
                                bgcolor: 'error.light', 
                                color: 'error.main',
                                width: 32,
                                height: 32,
                                mr: 1
                              }}
                            >
                              <PdfIcon fontSize="small" />
                            </Avatar>
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography 
                                variant="body2" 
                                noWrap
                                sx={{ fontWeight: 500 }}
                              >
                                {doc.name || url.split('/').pop()}
                              </Typography>
                              {doc.size && (
                                <Typography variant="caption" color="text.secondary">
                                  {(doc.size / 1024 / 1024).toFixed(2)} MB
                                </Typography>
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="View document">
                                <IconButton 
                                  size="small" 
                                  href={url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete document">
                                <IconButton 
                                  size="small" 
                                  onClick={()=>removeDocument(idx)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Card>
                        );
                      })}
                      {pet.documents.length > 4 && !showAllDocs && (
                        <Box sx={{ textAlign: 'center', mt: 1 }}>
                          <Button 
                            size="small" 
                            onClick={()=>setShowAllDocs(true)}
                          >
                            Show {pet.documents.length - 4} more documents
                          </Button>
                        </Box>
                      )}
                    </Box>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PetDetails;