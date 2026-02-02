import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  Chip,
  Button,
  LinearProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Rating,
  Stack
} from '@mui/material';
import {
  InfoOutlined as InfoIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Visibility as ViewIcon,
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  TrendingUp as TrendingIcon,
  Pets as PetsIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * XAI Product Recommendations Component
 * Displays AI-powered recommendations with transparent explanations
 */
const XAIRecommendations = ({ limit = 6, showExplanations = true }) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [explanationDialogOpen, setExplanationDialogOpen] = useState(false);
  const [sessionId] = useState(`session-${Date.now()}`);

  useEffect(() => {
    fetchRecommendations();
  }, [limit]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/ecommerce/recommendations', {
        params: { limit },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setRecommendations(response.data.recommendations);
        
        // Track that recommendations were shown
        response.data.recommendations.forEach(rec => {
          trackInteraction(rec.product._id, 'shown');
        });
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err.response?.data?.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const trackInteraction = async (productId, action) => {
    try {
      await axios.post(
        `/api/ecommerce/recommendations/${productId}/track`,
        { action, sessionId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
    } catch (err) {
      console.error('Error tracking interaction:', err);
    }
  };

  const handleProductClick = (recommendation) => {
    trackInteraction(recommendation.product._id, 'clicked');
    navigate(`/ecommerce/products/${recommendation.product.slug}`);
  };

  const handleViewExplanation = (recommendation) => {
    setSelectedProduct(recommendation);
    setExplanationDialogOpen(true);
  };

  const getConfidenceColor = (confidence) => {
    const colors = {
      very_high: 'success',
      high: 'info',
      medium: 'warning',
      low: 'error'
    };
    return colors[confidence] || 'default';
  };

  const getFeatureIcon = (featureName) => {
    const icons = {
      petMatch: <PetsIcon />,
      purchaseHistory: <CartIcon />,
      viewingHistory: <ViewIcon />,
      popularity: <TrendingIcon />,
      priceMatch: <MoneyIcon />
    };
    return icons[featureName] || <InfoIcon />;
  };

  const getFeatureLabel = (featureName) => {
    const labels = {
      petMatch: 'Pet Match',
      purchaseHistory: 'Purchase History',
      viewingHistory: 'Viewing History',
      popularity: 'Popularity',
      priceMatch: 'Price Match'
    };
    return labels[featureName] || featureName;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        No recommendations available at the moment. Check back later!
      </Alert>
    );
  }

  return (
    <Box sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            🤖 AI-Powered Recommendations
            <Tooltip title="These recommendations are powered by Explainable AI (XAI) - you can see exactly why each product is recommended">
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Personalized suggestions based on your pets, purchase history, and preferences
          </Typography>
        </Box>
      </Box>

      {/* Recommendations Grid */}
      <Grid container spacing={3}>
        {recommendations.map((recommendation, index) => (
          <Grid item xs={12} sm={6} md={4} key={recommendation.product._id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              {/* Confidence Badge */}
              <Chip
                label={`${recommendation.recommendationScore.toFixed(0)}% Match`}
                color={getConfidenceColor(recommendation.explanation.confidence)}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  zIndex: 1,
                  fontWeight: 'bold'
                }}
              />

              {/* Product Image */}
              <CardMedia
                component="img"
                height="200"
                image={recommendation.product.images?.[0] || '/placeholder-product.png'}
                alt={recommendation.product.name}
                sx={{ cursor: 'pointer', objectFit: 'cover' }}
                onClick={() => handleProductClick(recommendation)}
              />

              <CardContent sx={{ flexGrow: 1 }}>
                {/* Product Name */}
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { color: 'primary.main' }
                  }}
                  onClick={() => handleProductClick(recommendation)}
                >
                  {recommendation.product.name}
                </Typography>

                {/* Price */}
                <Box sx={{ mb: 2 }}>
                  {recommendation.product.pricing?.salePrice ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" color="primary">
                        ₹{recommendation.product.pricing.salePrice}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                      >
                        ₹{recommendation.product.pricing.basePrice}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="h6" color="primary">
                      ₹{recommendation.product.pricing?.basePrice}
                    </Typography>
                  )}
                </Box>

                {/* Rating */}
                {recommendation.product.ratings && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Rating 
                      value={recommendation.product.ratings.average || 0} 
                      precision={0.1} 
                      size="small" 
                      readOnly 
                    />
                    <Typography variant="body2" color="text.secondary">
                      ({recommendation.product.ratings.count || 0})
                    </Typography>
                  </Box>
                )}

                {/* Primary Explanation */}
                {showExplanations && (
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 1.5, 
                      backgroundColor: 'primary.lighter',
                      borderLeft: 3,
                      borderColor: 'primary.main',
                      mb: 2
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      💡 {recommendation.explanation.primary}
                    </Typography>
                  </Paper>
                )}

                {/* Secondary Reasons */}
                {showExplanations && recommendation.explanation.secondary.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {recommendation.explanation.secondary.slice(0, 2).map((reason, idx) => (
                        <Chip 
                          key={idx} 
                          label={reason} 
                          size="small" 
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* View Full Explanation Button */}
                <Button
                  size="small"
                  startIcon={<InfoIcon />}
                  onClick={() => handleViewExplanation(recommendation)}
                  sx={{ mb: 1 }}
                >
                  Why is this recommended?
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Explanation Dialog */}
      <Dialog
        open={explanationDialogOpen}
        onClose={() => setExplanationDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedProduct && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <InfoIcon color="primary" />
                <Box>
                  <Typography variant="h6">
                    Why "{selectedProduct.product.name}" is recommended
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Transparent AI Explanation
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            
            <DialogContent dividers>
              {/* Overall Score */}
              <Paper elevation={2} sx={{ p: 2, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <Typography variant="h4" gutterBottom>
                  {selectedProduct.recommendationScore.toFixed(1)}% Match
                </Typography>
                <Typography variant="body2">
                  Confidence: <strong>{selectedProduct.explanation.confidence.replace('_', ' ').toUpperCase()}</strong>
                </Typography>
              </Paper>

              {/* Primary Reason */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Primary Reason
                </Typography>
                <Alert severity="info" icon={<StarIcon />}>
                  {selectedProduct.explanation.primary}
                </Alert>
              </Box>

              {/* Secondary Reasons */}
              {selectedProduct.explanation.secondary.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Additional Reasons
                  </Typography>
                  <Stack spacing={1}>
                    {selectedProduct.explanation.secondary.map((reason, idx) => (
                      <Chip 
                        key={idx} 
                        label={reason} 
                        variant="outlined" 
                        color="primary"
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              {/* Feature Importance Breakdown */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Feature Importance Breakdown
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  How different factors contributed to this recommendation:
                </Typography>

                {Object.entries(selectedProduct.featureImportance)
                  .sort((a, b) => b[1].contribution - a[1].contribution)
                  .map(([featureName, featureData]) => (
                    <Box key={featureName} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getFeatureIcon(featureName)}
                          <Typography variant="body2" fontWeight="500">
                            {getFeatureLabel(featureName)}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {featureData.contribution.toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={featureData.contribution} 
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      
                      {/* Feature Details */}
                      {featureData.details && Object.keys(featureData.details).length > 0 && (
                        <Box sx={{ mt: 0.5, ml: 4 }}>
                          {Object.entries(featureData.details).map(([key, value]) => (
                            <Typography key={key} variant="caption" color="text.secondary" display="block">
                              • {key.replace(/([A-Z])/g, ' $1').trim()}: {String(value)}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Box>
                  ))}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Explainable AI Info */}
              <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon fontSize="small" />
                  About Explainable AI (XAI)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This recommendation is generated using transparent, rule-based logic. 
                  Every score and reason is explainable, ensuring ethical and fair AI practices. 
                  No black-box machine learning models are used.
                </Typography>
              </Paper>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setExplanationDialogOpen(false)}>
                Close
              </Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  setExplanationDialogOpen(false);
                  handleProductClick(selectedProduct);
                }}
              >
                View Product
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default XAIRecommendations;
