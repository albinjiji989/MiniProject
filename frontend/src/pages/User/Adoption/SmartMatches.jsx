import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, resolveMediaUrl } from '../../../services/api';
import AlgorithmInsights from '../../../components/Adoption/AlgorithmInsights';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogContent,
  Divider,
  Stack,
  Paper
} from '@mui/material';
import {
  Favorite,
  CheckCircle,
  Warning,
  Info,
  Settings,
  Refresh,
  EmojiEvents,
  Star,
  Close,
  Pets,
  Home,
  TrendingUp,
  Psychology
} from '@mui/icons-material';

const SmartMatches = () => {
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [profileStatus, setProfileStatus] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [error, setError] = useState('');
  const [mlServiceAvailable, setMlServiceAvailable] = useState(true);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  useEffect(() => {
    loadSmartMatches();
    loadProfileStatus();
  }, []);

  const loadProfileStatus = async () => {
    try {
      const res = await apiClient.get('/adoption/user/profile/adoption');
      if (res.data.success) {
        setProfileStatus(res.data.data);
      }
    } catch (error) {
      console.error('Error loading profile status:', error);
    }
  };

  const loadSmartMatches = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await apiClient.get('/adoption/user/matches/hybrid', {
        params: {
          topN: 20,
          algorithm: 'hybrid'
        }
      });
      
      if (res.data.success) {
        if (res.data.data?.needsProfile || res.data.needsProfile) {
          navigate('/user/adoption/profile-wizard');
          return;
        }
        
        const recommendations = res.data.data?.recommendations || 
                              res.data.data?.matches || 
                              res.data?.matches || 
                              [];
        
        console.log('📊 Received recommendations:', recommendations.length);
        console.log('📝 First recommendation:', recommendations[0]);
        console.log('📊 FULL API RESPONSE:', res.data.data);
        
        setMatches(recommendations);
        setMlServiceAvailable(res.data.data?.source !== 'fallback');
        
        if (recommendations.length === 0) {
          setError('No pets available at this time. Please check back later or try updating your preferences.');
        }
      } else {
        setError(res.data.message || 'Failed to load matches');
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      
      if (error.response?.data?.needsProfile || error.response?.status === 400) {
        navigate('/user/adoption/profile-wizard');
      } else {
        const errorMsg = error.response?.data?.message || 
                        error.message || 
                        'Failed to load matches. Please try again.';
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const viewMatchDetails = async (pet) => {
    await loadProfileStatus();
    setSelectedPet(pet);
    setDetailsOpen(true);
  };

  const getMatchColor = (score) => {
    if (score >= 85) return '#4caf50';
    if (score >= 70) return '#2196f3';
    if (score >= 55) return '#ff9800';
    return '#f44336';
  };

  const getMatchLabel = (score) => {
    if (score >= 85) return 'Excellent Match';
    if (score >= 70) return 'Great Match';
    if (score >= 55) return 'Good Match';
    return 'Fair Match';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 90) return 'Very High';
    if (confidence >= 70) return 'High';
    if (confidence >= 50) return 'Medium';
    return 'Low';
  };

  // Extract pet data handling both flat and nested structures
  const extractPetData = (match) => {
    const pet = match.pet || match;
    
    // Get images array
    const images = pet.images || [];
    
    // Get match scores with multiple fallbacks
    const hybridScore = match.hybridScore || 
                       match.match_score || 
                       match.matchScore || 
                       pet.hybridScore || 
                       pet.match_score || 
                       pet.matchScore || 
                       70; // Default score
    
    // Get match details
    const matchDetails = match.match_details || match.matchDetails || {};
    
    return {
      id: pet._id || pet.id || match.petId || `pet-${Date.now()}-${Math.random()}`,
      name: match.petName || pet.petName || pet.name || 'Lovely Pet',  // Support both petName and name
      breed: pet.breed || 'Mixed Breed',
      species: pet.species || 'Pet',
      gender: pet.gender || 'Unknown',
      age: pet.age || '',
      color: pet.color || '',
      weight: pet.weight || '',
      description: pet.description || 'This lovely pet is looking for a forever home.',
      adoptionFee: pet.adoptionFee || 0,
      vaccinationStatus: pet.vaccinationStatus || 'unknown',
      images: images,
      compatibilityProfile: pet.compatibilityProfile || {},
      temperamentTags: pet.temperamentTags || [],
      hybridScore: hybridScore,
      matchDetails: matchDetails,
      algorithmScores: match.algorithmScores || {},
      explanations: match.explanations || matchDetails.match_reasons || [],
      confidence: match.confidence || 50,
      clusterName: match.clusterName || '',
      successProbability: match.successProbability || 0,
      weights: match.weights || {}
    };
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} sx={{ color: '#4caf50' }} />
        <Typography sx={{ mt: 2, fontSize: '1.1rem', fontWeight: 500 }}>
          🔍 Finding your perfect companion...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Our AI is analyzing compatibility with available pets
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
          <Box
            sx={{
              bgcolor: '#4caf50',
              borderRadius: 3,
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Star sx={{ fontSize: 40, color: '#fff' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              Your Best Matches
            </Typography>
            <Typography variant="body1" color="text.secondary">
              AI-powered recommendations based on your lifestyle and preferences
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Settings />}
              onClick={() => navigate('/user/adoption/profile-wizard')}
              sx={{ 
                textTransform: 'none',
                borderRadius: 2,
                fontWeight: 600
              }}
            >
              Update Profile
            </Button>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={loadSmartMatches}
              sx={{ 
                textTransform: 'none',
                borderRadius: 2,
                fontWeight: 600,
                bgcolor: '#4caf50',
                '&:hover': { bgcolor: '#45a049' }
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>
      </Box>

      {/* AI System Status Banner */}
      {mlServiceAvailable && (
        <Alert 
          severity="success" 
          icon={<Psychology />}
          sx={{ 
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                🤖 AI-Powered Recommendations Active
              </Typography>
              <Typography variant="caption">
                Using 4 advanced algorithms: Profile Matching • Collaborative Filtering • Success Prediction • Personality Clustering
              </Typography>
            </Box>
            <Button 
              size="small" 
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              sx={{ textTransform: 'none', ml: 2 }}
            >
              {showTechnicalDetails ? 'Hide Details' : 'How it Works'}
            </Button>
          </Box>
          
          {showTechnicalDetails && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 1 }}>
                Our hybrid AI combines 4 machine learning algorithms:
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ bgcolor: '#e3f2fd', p: 1.5, borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#2196f3' }}>
                      📊 Profile Matching (30%)
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Compares your lifestyle with pet needs
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ bgcolor: '#e8f5e9', p: 1.5, borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#4caf50' }}>
                      👥 Collaborative (30%)
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Based on similar user preferences
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ bgcolor: '#f3e5f5', p: 1.5, borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#9c27b0' }}>
                      🎯 Success Predictor (25%)
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Predicts adoption success rate
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ bgcolor: '#fff3e0', p: 1.5, borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#ff9800' }}>
                      🏷️ Clustering (15%)
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Personality type matching
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </Alert>
      )}

      {!mlServiceAvailable && (
        <Alert severity="warning" icon={<Info />} sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            📊 Content-Based Match Algorithm Active
          </Typography>
          <Typography variant="caption">
            AI/ML service is temporarily unavailable. Using profile-based compatibility matching (Weighted Multi-Criteria Decision Analysis). 
            This algorithm scores pets based on: living space compatibility (20%), activity level match (25%), experience requirements (15%), 
            family safety (20%), budget (10%), and preferences (10%).
          </Typography>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Matches Grid */}
      {matches.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Pets sx={{ fontSize: 80, color: '#e0e0e0', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            No matches found
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            There are currently no pets available that match your criteria.
            Try updating your preferences or check back later.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/user/adoption')}
            sx={{ 
              bgcolor: '#4caf50',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2
            }}
          >
            View All Available Pets
          </Button>
        </Card>
      ) : (
        <>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              🎯 Found {matches.length} perfect matches for you!
            </Typography>
            {mlServiceAvailable && (
              <Chip 
                icon={<TrendingUp />}
                label="AI-Sorted by Best Match"
                color="success"
                size="small"
              />
            )}
          </Box>

          <Grid container spacing={3}>
            {matches.map((match, index) => {
              const pet = extractPetData(match);
              const matchScore = pet.hybridScore;
              
              // DEBUG: Log actual scores
              if (index < 5) {
                console.log(`🐾 Pet ${index + 1}:`, {
                  name: pet.name,
                  breed: pet.breed,
                  matchScore: matchScore,
                  raw_match: match,
                  warnings: pet.matchDetails?.warnings
                });
              }
              
              const topReasons = pet.explanations || 
                               pet.matchDetails.match_reasons || 
                               pet.matchDetails.reasons || 
                               [];
              const warnings = pet.matchDetails.warnings || [];
              
              const primaryImage = pet.images.length > 0 
                ? resolveMediaUrl(
                    typeof pet.images[0] === 'string' 
                      ? pet.images[0] 
                      : (pet.images[0].url || pet.images[0].path || pet.images[0]._id || '')
                  )
                : '/placeholder-pet.svg';
                
              // Only show "Best Match" if it's first AND has score >= 85
              const isBestMatch = index === 0 && matchScore >= 85;

              return (
                <Grid item xs={12} sm={6} md={4} key={pet.id || index}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      borderRadius: 3,
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      border: isBestMatch ? '2px solid #ffd700' : '1px solid #e0e0e0',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: isBestMatch 
                          ? '0 20px 40px rgba(255, 215, 0, 0.3)'
                          : '0 12px 24px rgba(0,0,0,0.15)',
                      }
                    }}
                  >
                    {/* Image Section */}
                    <Box sx={{ position: 'relative', paddingTop: '75%' }}>
                      <CardMedia
                        component="img"
                        image={primaryImage}
                        alt={pet.breed}
                        sx={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          cursor: 'pointer'
                        }}
                        onClick={() => viewMatchDetails(match)}
                        onError={(e) => {
                          e.target.src = '/placeholder-pet.svg';
                        }}
                      />
                      
                      {/* Gradient Overlay */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.7) 100%)',
                          pointerEvents: 'none'
                        }}
                      />

                      {/* Best Match Badge */}
                      {isBestMatch && (
                        <Chip
                          icon={<EmojiEvents />}
                          label="Best Match"
                          sx={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            bgcolor: '#ffd700',
                            color: '#000',
                            fontWeight: 700,
                            boxShadow: '0 4px 12px rgba(255, 215, 0, 0.5)',
                          }}
                        />
                      )}

                      {/* Match Score Badge */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          bgcolor: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: 2,
                          px: 1.5,
                          py: 0.5,
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 800,
                            color: getMatchColor(matchScore),
                            fontSize: '1.1rem'
                          }}
                        >
                          {matchScore}%
                        </Typography>
                      </Box>

                      {/* Pet Name Overlay */}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          color: 'white',
                          p: 2,
                        }}
                      >
                        <Chip
                          label={getMatchLabel(matchScore)}
                          size="small"
                          sx={{
                            bgcolor: getMatchColor(matchScore),
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            mb: 1,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                          }}
                        />
                        <Typography variant="h6" sx={{ fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                          {pet.name}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.95, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                          {pet.breed}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                          {pet.species} • {pet.gender} {pet.age ? `• ${pet.age}` : ''}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Card Content */}
                    <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                      {/* Match Progress Bar */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>
                            Compatibility Score
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: getMatchColor(matchScore) }}>
                            {getMatchLabel(matchScore)}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={matchScore}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#f0f0f0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getMatchColor(matchScore),
                              borderRadius: 4,
                            }
                          }}
                        />
                      </Box>

                      {/* Quick Stats */}
                      <Grid container spacing={1} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Box sx={{ bgcolor: '#f8f9fa', p: 1, borderRadius: 1, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">Age</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {pet.age || 'N/A'}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ bgcolor: '#f8f9fa', p: 1, borderRadius: 1, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">Fee</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              ${pet.adoptionFee || 0}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Top Match Reasons */}
                      {topReasons.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.85rem' }}>
                            ✨ Why This Works
                          </Typography>
                          <Stack spacing={0.5}>
                            {topReasons.slice(0, 2).map((reason, idx) => (
                              <Box 
                                key={idx} 
                                sx={{ 
                                  display: 'flex', 
                                  alignItems: 'flex-start', 
                                  bgcolor: '#f8f9fa',
                                  p: 1,
                                  borderRadius: 1
                                }}
                              >
                                <CheckCircle sx={{ fontSize: 16, color: '#4caf50', mr: 0.5, mt: 0.2, flexShrink: 0 }} />
                                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                                  {typeof reason === 'string' ? reason : reason.text || reason.reason || ''}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {/* Confidence Indicator */}
                      {pet.confidence > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Confidence:
                          </Typography>
                          <Chip 
                            label={`${getConfidenceLabel(pet.confidence)} (${pet.confidence}%)`}
                            size="small"
                            color={pet.confidence >= 70 ? 'success' : 'default'}
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                      )}

                      {/* Warnings */}
                      {warnings.length > 0 && (
                        <Alert 
                          severity="warning" 
                          icon={<Warning sx={{ fontSize: 16 }} />}
                          sx={{ 
                            py: 0.5, 
                            px: 1,
                            fontSize: '0.75rem',
                          }}
                        >
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            {warnings[0]}
                          </Typography>
                        </Alert>
                      )}
                    </CardContent>

                    {/* Action Buttons */}
                    <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
                      <Button
                        fullWidth
                        size="medium"
                        variant="outlined"
                        onClick={() => viewMatchDetails(match)}
                        startIcon={<Info />}
                        sx={{ 
                          textTransform: 'none',
                          fontWeight: 600,
                          borderRadius: 2
                        }}
                      >
                        Details
                      </Button>
                      <Button
                        fullWidth
                        size="medium"
                        variant="contained"
                        onClick={() => navigate(`/user/adoption/wizard/${pet.id}`)}
                        startIcon={<Favorite />}
                        sx={{ 
                          bgcolor: getMatchColor(matchScore),
                          textTransform: 'none',
                          fontWeight: 700,
                          borderRadius: 2,
                          '&:hover': {
                            bgcolor: getMatchColor(matchScore),
                            filter: 'brightness(0.9)'
                          }
                        }}
                      >
                        Apply
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}

      {/* Pet Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh'
          }
        }}
      >
        {selectedPet && (() => {
          const pet = extractPetData(selectedPet);
          const primaryImage = pet.images.length > 0 
            ? resolveMediaUrl(pet.images[0].url)
            : '/placeholder-pet.svg';

          return (
            <>
              {/* Header with Image */}
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  image={primaryImage}
                  alt={pet.breed}
                  sx={{ 
                    height: 300,
                    objectFit: 'cover'
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 50%, rgba(0,0,0,0.7) 100%)'
                  }}
                />
                
                <IconButton
                  onClick={() => setDetailsOpen(false)}
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    bgcolor: 'white',
                    '&:hover': { bgcolor: '#f5f5f5' }
                  }}
                >
                  <Close />
                </IconButton>

                {/* Match Score Badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    bgcolor: getMatchColor(pet.hybridScore),
                    color: 'white',
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    boxShadow: 3
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1 }}>
                    {pet.hybridScore}%
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700 }}>
                    MATCH
                  </Typography>
                </Box>

                {/* Pet Info Overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 3,
                    color: 'white'
                  }}
                >
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                    {pet.name}
                  </Typography>
                  <Typography variant="h6" sx={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                    {pet.breed}
                  </Typography>
                  <Typography variant="body2" sx={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                    {pet.species} • {pet.gender} • {pet.age || 'Age unknown'}
                  </Typography>
                </Box>
              </Box>

              <DialogContent sx={{ p: 3 }}>
                {/* Quick Stats Grid */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {pet.color && (
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f8f9fa' }} elevation={0}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{pet.color}</Typography>
                        <Typography variant="caption" color="text.secondary">Color</Typography>
                      </Paper>
                    </Grid>
                  )}
                  {pet.weight && (
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f8f9fa' }} elevation={0}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{pet.weight} kg</Typography>
                        <Typography variant="caption" color="text.secondary">Weight</Typography>
                      </Paper>
                    </Grid>
                  )}
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f8f9fa' }} elevation={0}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {pet.vaccinationStatus === 'up_to_date' ? '✓ Yes' : 
                         pet.vaccinationStatus === 'partial' ? '~ Partial' : '✗ No'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Vaccinated</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f8f9fa' }} elevation={0}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>${pet.adoptionFee}</Typography>
                      <Typography variant="caption" color="text.secondary">Adoption Fee</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Success Probability */}
                {pet.successProbability > 0 && (
                  <Alert 
                    severity="success" 
                    icon={<TrendingUp />}
                    sx={{ 
                      mb: 3, 
                      bgcolor: `${getMatchColor(pet.hybridScore)}15`,
                      border: `2px solid ${getMatchColor(pet.hybridScore)}`
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      🎯 {Math.round(pet.successProbability * 100)}% Predicted Success Rate
                    </Typography>
                    <Typography variant="caption">
                      Based on historical adoption data and compatibility analysis
                    </Typography>
                  </Alert>
                )}

                {/* Algorithm Insights */}
                {pet.algorithmScores && Object.keys(pet.algorithmScores).length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <AlgorithmInsights recommendation={pet} />
                  </Box>
                )}

                {/* Description */}
                {pet.description && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      About {pet.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.8 }}>
                      {pet.description}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Compatibility Overview */}
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Compatibility Overview
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {/* Your Profile */}
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, bgcolor: '#e3f2fd', height: '100%' }} elevation={0}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <Home sx={{ fontSize: 20, color: '#1976d2', mr: 1 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1976d2' }}>
                          Your Profile
                        </Typography>
                      </Box>
                      {profileStatus?.adoptionProfile ? (
                        <Stack spacing={0.5}>
                          <Typography variant="body2">
                            <strong>Home:</strong> {profileStatus.adoptionProfile.homeType} ({profileStatus.adoptionProfile.homeSize})
                          </Typography>
                          <Typography variant="body2">
                            <strong>Activity:</strong> {profileStatus.adoptionProfile.activityLevel}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Experience:</strong> {profileStatus.adoptionProfile.experienceLevel}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Children:</strong> {profileStatus.adoptionProfile.hasChildren ? 'Yes' : 'No'}
                          </Typography>
                          {profileStatus.adoptionProfile.monthlyBudget && (
                            <Typography variant="body2">
                              <strong>Budget:</strong> ${profileStatus.adoptionProfile.monthlyBudget}/month
                            </Typography>
                          )}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Loading profile...
                        </Typography>
                      )}
                    </Paper>
                  </Grid>

                  {/* Pet's Needs */}
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, bgcolor: '#fce4ec', height: '100%' }} elevation={0}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <Pets sx={{ fontSize: 20, color: '#c2185b', mr: 1 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#c2185b' }}>
                          {pet.name}'s Needs
                        </Typography>
                      </Box>
                      <Stack spacing={0.5}>
                        <Typography variant="body2">
                          <strong>Space:</strong> {pet.compatibilityProfile?.size || pet.compatibilityProfile?.spaceNeeded || 'Moderate'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Energy:</strong> {pet.compatibilityProfile?.energyLevel ? `Level ${pet.compatibilityProfile.energyLevel}/5` : 'Moderate'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Experience:</strong> {pet.compatibilityProfile?.requiresExperiencedOwner ? 'Required' : 'Beginner OK'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: pet.compatibilityProfile?.childFriendlyScore < 4 ? '#d32f2f' : 'inherit' }}>
                          <strong>Good with Kids:</strong> {(pet.compatibilityProfile?.childFriendlyScore ?? 5) >= 6 ? 'Yes' : (pet.compatibilityProfile?.childFriendlyScore ?? 5) >= 4 ? 'Maybe' : 'No'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: pet.compatibilityProfile?.petFriendlyScore < 4 ? '#d32f2f' : 'inherit' }}>
                          <strong>Good with Pets:</strong> {(pet.compatibilityProfile?.petFriendlyScore ?? 5) >= 6 ? 'Yes' : (pet.compatibilityProfile?.petFriendlyScore ?? 5) >= 4 ? 'Maybe' : 'No'}
                        </Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Match Reasons */}
                {pet.matchDetails?.match_reasons && pet.matchDetails.match_reasons.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                      ✨ Why This Match Works
                    </Typography>
                    <Stack spacing={1}>
                      {pet.matchDetails.match_reasons.map((reason, idx) => (
                        <Box 
                          key={idx}
                          sx={{ 
                            bgcolor: '#f8f9fa',
                            borderLeft: `4px solid ${getMatchColor(pet.hybridScore)}`,
                            p: 1.5,
                            borderRadius: 1
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <CheckCircle sx={{ color: getMatchColor(pet.hybridScore), fontSize: 20, mt: 0.2 }} />
                            <Typography variant="body2">
                              {reason.replace(/^[✓⚠️~]\s*/, '')}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Score Breakdown */}
                {pet.matchDetails?.score_breakdown && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                      📊 Detailed Score Breakdown
                    </Typography>
                    {Object.entries(pet.matchDetails.score_breakdown).map(([key, value]) => (
                      <Box key={key} sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                            {key.replace(/_/g, ' ')}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: getMatchColor(value) }}>
                            {Math.round(value)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={value}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getMatchColor(value),
                              borderRadius: 4
                            }
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Warnings */}
                {pet.matchDetails?.warnings && pet.matchDetails.warnings.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: '#f57c00' }}>
                      ⚠️ Important Considerations
                    </Typography>
                    <Stack spacing={1}>
                      {pet.matchDetails.warnings.map((warning, idx) => (
                        <Alert key={idx} severity="warning">
                          <Typography variant="body2">{warning}</Typography>
                        </Alert>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Additional Images */}
                {pet.images.length > 1 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                      More Photos
                    </Typography>
                    <Grid container spacing={1}>
                      {pet.images.slice(1, 5).map((img, idx) => (
                        <Grid item xs={6} sm={3} key={idx}>
                          <CardMedia
                            component="img"
                            image={resolveMediaUrl(img.url)}
                            alt={`${pet.name} ${idx + 2}`}
                            sx={{ 
                              borderRadius: 2, 
                              aspectRatio: '1',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              e.target.src = '/placeholder-pet.svg';
                            }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </DialogContent>

              {/* Action Footer */}
              <Box sx={{ p: 3, bgcolor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={8}>
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      onClick={() => {
                        setDetailsOpen(false);
                        navigate(`/user/adoption/wizard/${pet.id}`);
                      }}
                      startIcon={<Favorite />}
                      sx={{
                        bgcolor: getMatchColor(pet.hybridScore),
                        color: 'white',
                        py: 1.5,
                        fontWeight: 700,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem',
                        '&:hover': {
                          bgcolor: getMatchColor(pet.hybridScore),
                          filter: 'brightness(0.9)'
                        }
                      }}
                    >
                      Apply to Adopt {pet.name}
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button
                      variant="outlined"
                      fullWidth
                      size="large"
                      onClick={() => setDetailsOpen(false)}
                      sx={{
                        py: 1.5,
                        fontWeight: 600,
                        borderRadius: 2,
                        textTransform: 'none'
                      }}
                    >
                      Close
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </>
          );
        })()}
      </Dialog>
    </Container>
  );
};

export default SmartMatches;
