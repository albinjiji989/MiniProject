import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, resolveMediaUrl } from '../../../services/api';
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
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
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
  Close
} from '@mui/icons-material';

const SmartMatches = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [profileStatus, setProfileStatus] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSmartMatches();
    loadProfileStatus();
  }, []);

  const loadProfileStatus = async () => {
    try {
      const res = await apiClient.get('/adoption/user/profile/adoption');
      console.log('Profile API Response:', res.data);
      if (res.data.success) {
        setProfileStatus(res.data.data);
        console.log('Profile data set:', res.data.data);
      }
    } catch (error) {
      console.error('Error loading profile status:', error);
    }
  };

  const loadSmartMatches = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/adoption/user/matches/smart?topN=10');
      
      if (res.data.success) {
        if (res.data.data.needsProfile) {
          navigate('/user/adoption/profile-wizard');
          return;
        }
        setMatches(res.data.data.matches || []);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      if (error.response?.data?.needsProfile) {
        navigate('/user/adoption/profile-wizard');
      } else {
        setError(error.response?.data?.message || 'Failed to load matches');
      }
    } finally {
      setLoading(false);
    }
  };

  const viewMatchDetails = async (pet) => {
    // Reload profile to ensure we have latest data
    await loadProfileStatus();
    setSelectedPet(pet);
    setDetailsOpen(true);
  };

  const getMatchColor = (score) => {
    if (score >= 85) return '#4caf50'; // Green
    if (score >= 70) return '#2196f3'; // Blue
    if (score >= 55) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };

  const getMatchLabel = (score) => {
    if (score >= 85) return 'Excellent Match';
    if (score >= 70) return 'Great Match';
    if (score >= 55) return 'Good Match';
    return 'Fair Match';
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography sx={{ mt: 2 }}>Finding your perfect matches...</Typography>
        <Typography variant="body2" color="text.secondary">
          Our AI is analyzing {matches.length > 0 ? matches.length : 'available'} pets
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <EmojiEvents sx={{ fontSize: 40, color: '#ffd700', mr: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Your Smart Matches
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            AI-powered recommendations based on your lifestyle and preferences
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => navigate('/user/adoption/profile-wizard')}
          >
            Update Profile
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadSmartMatches}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Profile Completion Banner */}
      {profileStatus && !profileStatus.isComplete && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Your profile is {profileStatus.completionPercentage}% complete. 
          <Button size="small" onClick={() => navigate('/user/adoption/profile-wizard')} sx={{ ml: 2 }}>
            Complete Now
          </Button>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Matches Grid */}
      {matches.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
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
            sx={{ bgcolor: '#4caf50' }}
          >
            View All Available Pets
          </Button>
        </Card>
      ) : (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Found {matches.length} perfect matches for you! 🎯
          </Typography>

          <Grid container spacing={3}>
            {matches.map((pet, index) => {
              const matchScore = pet.match_score || 0;
              const matchDetails = pet.match_details || {};
              const topReasons = matchDetails.match_reasons || [];
              const warnings = matchDetails.warnings || [];

              return (
                <Grid item xs={12} sm={6} md={4} key={pet._id || pet.id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      position: 'relative',
                      borderRadius: 3,
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: index === 0 ? '2px solid #ffd700' : '1px solid #e0e0e0',
                      '&:hover': {
                        transform: 'translateY(-12px)',
                        boxShadow: index === 0 
                          ? '0 20px 40px rgba(255, 215, 0, 0.3)' 
                          : '0 16px 32px rgba(0,0,0,0.12)'
                      }
                    }}
                  >
                    {/* Image Container with Overlay */}
                    <Box sx={{ position: 'relative', height: 280 }}>
                      <CardMedia
                        component="img"
                        image={resolveMediaUrl(pet.images?.[0]?.url || pet.image || '/placeholder-pet.svg')}
                        alt={pet.breed}
                        sx={{ 
                          height: '100%',
                          objectFit: 'cover',
                          cursor: 'pointer'
                        }}
                        onClick={() => viewMatchDetails(pet)}
                      />
                      
                      {/* Gradient Overlay */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.6) 100%)',
                          pointerEvents: 'none'
                        }}
                      />

                      {/* Top Left - Rank Badge (only for top 3) */}
                      {index === 0 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            bgcolor: '#ffd700',
                            color: '#000',
                            borderRadius: 2,
                            px: 2,
                            py: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            boxShadow: '0 4px 12px rgba(255, 215, 0, 0.5)',
                            zIndex: 2
                          }}
                        >
                          <span>🏆</span>
                          <span>Best Match</span>
                        </Box>
                      )}

                      {/* Top Right - Match Score */}
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
                          border: '1px solid rgba(255,255,255,0.3)',
                          zIndex: 2
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

                      {/* Bottom Info Bar */}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          color: 'white',
                          p: 2,
                          zIndex: 2
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
                            height: 26,
                            mb: 1,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                          }}
                        />
                        <Typography variant="body1" sx={{ fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                          {pet.breed}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.95, fontSize: '0.85rem', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                          {pet.species} • {pet.gender} {pet.age ? `• ${pet.age}` : ''}
                        </Typography>
                      </Box>
                    </Box>

                    <CardContent sx={{ flexGrow: 1, p: 2.5, pb: 1.5 }}>
                      {/* Match Progress Bar */}
                      <Box sx={{ mb: 2.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', fontSize: '0.75rem' }}>
                            Compatibility Score
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: getMatchColor(matchScore), fontSize: '0.75rem' }}>
                            {matchScore}%
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
                              backgroundImage: `linear-gradient(90deg, ${getMatchColor(matchScore)}, ${getMatchColor(matchScore)}ee)`
                            }
                          }}
                        />
                      </Box>

                      {/* Top Match Reasons */}
                      {topReasons.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, color: '#333', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <span>✨</span> Why This Match Works
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {topReasons.slice(0, 2).map((reason, idx) => (
                              <Box 
                                key={idx} 
                                sx={{ 
                                  display: 'flex', 
                                  alignItems: 'flex-start', 
                                  bgcolor: '#f8f9fa',
                                  p: 1,
                                  borderRadius: 1.5,
                                  border: '1px solid #e9ecef'
                                }}
                              >
                                <CheckCircle sx={{ fontSize: 16, color: '#4caf50', mr: 1, mt: 0.2, flexShrink: 0 }} />
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                                  {reason}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Warnings */}
                      {warnings.length > 0 && (
                        <Alert 
                          severity="warning" 
                          icon={false}
                          sx={{ 
                            py: 0.75, 
                            px: 1.5,
                            fontSize: '0.75rem',
                            bgcolor: '#fff8e1',
                            border: '1px solid #ffe082',
                            borderRadius: 1.5
                          }}
                        >
                          <Typography variant="caption" sx={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
                            ⚠️ {warnings[0]}
                          </Typography>
                        </Alert>
                      )}
                    </CardContent>

                    <CardActions sx={{ p: 2.5, pt: 0, gap: 1 }}>
                      <Button
                        fullWidth
                        size="large"
                        variant="outlined"
                        onClick={() => viewMatchDetails(pet)}
                        startIcon={<Info />}
                        sx={{ 
                          borderColor: '#e0e0e0',
                          color: '#666',
                          fontWeight: 600,
                          borderRadius: 2,
                          textTransform: 'none',
                          '&:hover': { 
                            borderColor: '#bdbdbd',
                            bgcolor: '#fafafa'
                          }
                        }}
                      >
                        View Details
                      </Button>
                      <Button
                        fullWidth
                        size="large"
                        variant="contained"
                        onClick={() => navigate(`/user/adoption/wizard/${pet._id || pet.id}`)}
                        startIcon={<Favorite />}
                        sx={{ 
                          bgcolor: getMatchColor(matchScore),
                          boxShadow: `0 4px 14px ${getMatchColor(matchScore)}40`,
                          fontWeight: 700,
                          borderRadius: 2,
                          textTransform: 'none',
                          '&:hover': {
                            bgcolor: getMatchColor(matchScore),
                            filter: 'brightness(0.92)',
                            boxShadow: `0 6px 20px ${getMatchColor(matchScore)}50`,
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        Apply Now
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}

      {/* Match Details Dialog */}
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
        {selectedPet && (
          <>
            {/* Header with Pet Image */}
            <Box sx={{ position: 'relative' }}>
              <CardMedia
                component="img"
                image={resolveMediaUrl(selectedPet.images?.[0]?.url || selectedPet.image || '/placeholder-pet.svg')}
                alt={selectedPet.breed}
                sx={{ 
                  height: 280,
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
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 40%, rgba(0,0,0,0.7) 100%)'
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

              <Box
                sx={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  bgcolor: getMatchColor(selectedPet.match_score),
                  color: 'white',
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  boxShadow: 3
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1 }}>
                  {selectedPet.match_score}%
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700 }}>
                  MATCH
                </Typography>
              </Box>

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
                  {selectedPet.breed}
                </Typography>
                <Typography variant="body1" sx={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                  {selectedPet.species} • {selectedPet.gender} • {selectedPet.age || 'Age unknown'}
                </Typography>
              </Box>
            </Box>

            <DialogContent sx={{ p: 3 }}>
              {/* Quick Stats */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {selectedPet.color && (
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', bgcolor: '#f8f9fa', p: 1.5, borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedPet.color}</Typography>
                      <Typography variant="caption" color="text.secondary">Color</Typography>
                    </Box>
                  </Grid>
                )}
                {selectedPet.weight && (
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', bgcolor: '#f8f9fa', p: 1.5, borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedPet.weight} kg</Typography>
                      <Typography variant="caption" color="text.secondary">Weight</Typography>
                    </Box>
                  </Grid>
                )}
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', bgcolor: '#f8f9fa', p: 1.5, borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {selectedPet.vaccinationStatus === 'up_to_date' ? '✓ Yes' : selectedPet.vaccinationStatus === 'partial' ? '~ Partial' : '✗ No'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Vaccinated</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', bgcolor: '#f8f9fa', p: 1.5, borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>${selectedPet.adoptionFee || 0}</Typography>
                    <Typography variant="caption" color="text.secondary">Fee</Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Success Prediction */}
              {selectedPet.match_details?.success_probability && (
                <Alert 
                  severity="success" 
                  icon={false}
                  sx={{ mb: 3, bgcolor: `${getMatchColor(selectedPet.match_score)}15`, border: `2px solid ${getMatchColor(selectedPet.match_score)}` }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    🎯 {selectedPet.match_details.success_probability}% Success Rate
                  </Typography>
                  <Typography variant="body2">
                    High compatibility for successful adoption
                  </Typography>
                </Alert>
              )}

              {/* Description */}
              {selectedPet.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    About {selectedPet.breed}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.7 }}>
                    {selectedPet.description}
                  </Typography>
                </Box>
              )}

              {/* Your Profile vs Pet Needs - Compact */}
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Compatibility Overview
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ bgcolor: '#e3f2fd', p: 2, borderRadius: 2, height: '100%' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1976d2' }}>
                      👤 Your Profile
                    </Typography>
                    {profileStatus?.adoptionProfile ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                            <strong>Budget:</strong> ${profileStatus.adoptionProfile.monthlyBudget}/mo
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Loading profile...
                      </Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ bgcolor: '#fce4ec', p: 2, borderRadius: 2, height: '100%' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#c2185b' }}>
                      🐾 Pet's Needs
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        <strong>Space:</strong> {selectedPet.compatibilityProfile?.spaceNeeded || 'Moderate'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Energy:</strong> {selectedPet.compatibilityProfile?.energyLevel || 'Moderate'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Experience:</strong> {selectedPet.compatibilityProfile?.requiresExperiencedOwner ? 'Required' : 'Beginner OK'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Kids:</strong> {selectedPet.compatibilityProfile?.goodWithKids ? 'Yes' : 'No'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Other Pets:</strong> {selectedPet.compatibilityProfile?.goodWithPets ? 'Yes' : 'No'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              {/* Match Reasons */}
              {selectedPet.match_details?.match_reasons && selectedPet.match_details.match_reasons.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                    ✨ Why This Match Works
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selectedPet.match_details.match_reasons.slice(0, 4).map((reason, idx) => (
                      <Box 
                        key={idx}
                        sx={{ 
                          bgcolor: '#f8f9fa',
                          borderLeft: `3px solid ${getMatchColor(selectedPet.match_score)}`,
                          p: 1.5,
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1
                        }}
                      >
                        <CheckCircle sx={{ color: getMatchColor(selectedPet.match_score), fontSize: 20, mt: 0.2, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {reason.replace(/^[✓⚠️~]\s*/, '')}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Score Breakdown */}
              {selectedPet.match_details?.score_breakdown && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                    📊 Compatibility Breakdown
                  </Typography>
                  {Object.entries(selectedPet.match_details.score_breakdown).map(([key, value]) => (
                    <Box key={key} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                          {key.replace(/_/g, ' ')}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: getMatchColor(value) }}>
                          {Math.round(value)}%
                        </Typography>
                      </Box>
                      <Box sx={{ bgcolor: '#e0e0e0', borderRadius: 1, height: 6, overflow: 'hidden' }}>
                        <Box 
                          sx={{ 
                            bgcolor: getMatchColor(value),
                            height: '100%',
                            width: `${value}%`,
                            borderRadius: 1
                          }} 
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Warnings */}
              {selectedPet.match_details?.warnings && selectedPet.match_details.warnings.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: '#f57c00' }}>
                    ⚠️ Important Notes
                  </Typography>
                  {selectedPet.match_details.warnings.map((warning, idx) => (
                    <Alert 
                      key={idx} 
                      severity="warning"
                      sx={{ mb: 1, py: 0.5 }}
                    >
                      <Typography variant="body2">
                        {warning}
                      </Typography>
                    </Alert>
                  ))}
                </Box>
              )}
            </DialogContent>

            {/* Action Buttons */}
            <Box sx={{ p: 3, bgcolor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={7}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={() => {
                      setDetailsOpen(false);
                      navigate(`/user/adoption/wizard/${selectedPet._id || selectedPet.id}`);
                    }}
                    startIcon={<Favorite />}
                    sx={{
                      bgcolor: getMatchColor(selectedPet.match_score),
                      color: 'white',
                      py: 1.5,
                      fontWeight: 700,
                      borderRadius: 2,
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: getMatchColor(selectedPet.match_score),
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    Apply to Adopt
                  </Button>
                </Grid>
                <Grid item xs={12} sm={5}>
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
        )}
      </Dialog>
    </Container>
  );
};

export default SmartMatches;
