/**
 * ML Model Performance Dashboard (Admin)
 * Shows training metrics, algorithm comparison, and model statistics
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  Assessment,
  Refresh,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { apiClient } from '../../../services/api';

const ModelPerformanceDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchModelStats();
  }, []);

  const fetchModelStats = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/adoption/user/ml/stats');
      
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching model stats:', error);
      setError(error.response?.data?.message || 'Failed to load model statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography sx={{ mt: 2 }}>Loading ML model performance...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchModelStats} startIcon={<Refresh />}>
          Retry
        </Button>
      </Container>
    );
  }

  if (!stats) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="info">
          No model statistics available yet.
        </Alert>
      </Container>
    );
  }

  const { algorithm, algorithms_used, algorithm_availability, models } = stats;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            <Psychology sx={{ mr: 2, fontSize: 40, verticalAlign: 'middle' }} />
            ML Model Performance Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Hybrid adoption recommendation system - 4 AI/ML algorithms
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchModelStats}
        >
          Refresh
        </Button>
      </Box>

      {/* System Overview */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            📊 System Overview
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
            <strong>Algorithm:</strong> {algorithm}
          </Typography>
          
          <Grid container spacing={2}>
            {Object.entries(algorithms_used || {}).map(([key, value]) => (
              <Grid item xs={12} sm={6} md={3} key={key}>
                <Box sx={{ bgcolor: '#f8f9fa', p: 2, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, textTransform: 'capitalize' }}>
                    {key.replace(/_/g, ' ')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Algorithm Availability */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            🔧 Algorithm Availability
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(algorithm_availability || {}).map(([alg, available]) => (
              <Grid item xs={12} sm={6} md={3} key={alg}>
                <Card sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  border: available ? '2px solid #4caf50' : '2px solid #f44336',
                  bgcolor: available ? '#e8f5e9' : '#ffebee'
                }}>
                  {available ? (
                    <CheckCircle sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                  ) : (
                    <Warning sx={{ fontSize: 40, color: '#f44336', mb: 1 }} />
                  )}
                  <Typography variant="body1" sx={{ fontWeight: 700, textTransform: 'capitalize', mb: 0.5 }}>
                    {alg}
                  </Typography>
                  <Chip
                    label={available ? 'Trained' : 'Not Trained'}
                    size="small"
                    color={available ? 'success' : 'error'}
                    sx={{ fontWeight: 600 }}
                  />
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Individual Model Details */}
      {models && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            📈 Model Details
          </Typography>
          
          {/* Collaborative Filtering */}
          {models.collaborative && (
            <Card sx={{ mb: 3, borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
                    👥 Collaborative Filtering (SVD)
                  </Typography>
                  {models.collaborative.trained ? (
                    <Chip label="Trained" color="success" />
                  ) : (
                    <Chip label="Not Trained" color="error" />
                  )}
                </Box>

                {models.collaborative.trained ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#2196f3' }}>
                          {models.collaborative.metrics?.rmse?.toFixed(3) || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">RMSE</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#2196f3' }}>
                          {models.collaborative.metrics?.mae?.toFixed(3) || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">MAE</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                          {models.collaborative.total_interactions || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Interactions</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {models.collaborative.training_date 
                            ? new Date(models.collaborative.training_date).toLocaleDateString()
                            : 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Last Trained</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                ) : (
                  <Alert severity="warning">
                    Model not trained yet. Need at least 100 user-pet interactions to train.
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Success Predictor (XGBoost) */}
          {models.success && (
            <Card sx={{ mb: 3, borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
                    🎯 Success Predictor (XGBoost)
                  </Typography>
                  {models.success.trained ? (
                    <Chip label="Trained" color="success" />
                  ) : (
                    <Chip label="Not Trained" color="error" />
                  )}
                </Box>

                {models.success.trained ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#4caf50' }}>
                          {(models.success.metrics?.accuracy * 100)?.toFixed(1) || 'N/A'}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Accuracy</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#4caf50' }}>
                          {(models.success.metrics?.precision * 100)?.toFixed(1) || 'N/A'}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Precision</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#4caf50' }}>
                          {(models.success.metrics?.recall * 100)?.toFixed(1) || 'N/A'}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Recall</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#4caf50' }}>
                          {(models.success.metrics?.f1_score * 100)?.toFixed(1) || 'N/A'}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">F1-Score</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#4caf50' }}>
                          {(models.success.metrics?.auc_roc * 100)?.toFixed(1) || 'N/A'}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">AUC-ROC</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                ) : (
                  <Alert severity="warning">
                    Model not trained yet. Need at least 50 adoption records with outcomes.
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Clustering (K-Means) */}
          {models.clustering && (
            <Card sx={{ mb: 3, borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
                    🏷️ Pet Clustering (K-Means)
                  </Typography>
                  {models.clustering.trained ? (
                    <Chip label="Trained" color="success" />
                  ) : (
                    <Chip label="Not Trained" color="error" />
                  )}
                </Box>

                {models.clustering.trained ? (
                  <>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                          <Typography variant="h5" sx={{ fontWeight: 800, color: '#9c27b0' }}>
                            {models.clustering.optimal_k || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">Clusters Found</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                          <Typography variant="h5" sx={{ fontWeight: 800, color: '#9c27b0' }}>
                            {(models.clustering.metrics?.silhouette_score * 100)?.toFixed(1) || 'N/A'}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">Silhouette Score</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {models.clustering.training_date 
                              ? new Date(models.clustering.training_date).toLocaleDateString()
                              : 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">Last Trained</Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {models.clustering.cluster_names && models.clustering.cluster_names.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                          Discovered Personality Types:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {models.clustering.cluster_names.map((name, idx) => (
                            <Chip 
                              key={idx} 
                              label={name} 
                              sx={{ bgcolor: '#e3f2fd', fontWeight: 600 }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </>
                ) : (
                  <Alert severity="warning">
                    Model not trained yet. Need at least 30 pets to generate clusters.
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Training Recommendations */}
      <Card sx={{ borderRadius: 3, bgcolor: '#e3f2fd' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            💡 Training Recommendations
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {!algorithm_availability?.collaborative && (
              <Alert severity="info" icon={<TrendingUp />}>
                <strong>Collaborative Filtering:</strong> Collect at least 100 user-pet interactions (views, favorites, applications) to train SVD model.
              </Alert>
            )}
            {!algorithm_availability?.success && (
              <Alert severity="info" icon={<TrendingUp />}>
                <strong>Success Predictor:</strong> Need at least 50 completed adoptions with outcome data (successful or returned) to train XGBoost model.
              </Alert>
            )}
            {!algorithm_availability?.clustering && (
              <Alert severity="info" icon={<TrendingUp />}>
                <strong>Pet Clustering:</strong> Need at least 30 pets with complete compatibility profiles to generate personality clusters.
              </Alert>
            )}
            {algorithm_availability?.collaborative && algorithm_availability?.success && algorithm_availability?.clustering && (
              <Alert severity="success" icon={<CheckCircle />}>
                <strong>All models trained!</strong> The hybrid recommendation system is fully operational and using all 4 algorithms.
              </Alert>
            )}
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ModelPerformanceDashboard;
