/**
 * AlgorithmInsights Component
 * Shows detailed breakdown of ML algorithm scores and explanations
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Divider
} from '@mui/material';
import { 
  ExpandMore, 
  Info, 
  Psychology,
  Groups,
  Analytics,
  Category
} from '@mui/icons-material';

const AlgorithmInsights = ({ recommendation }) => {
  const [showTechnical, setShowTechnical] = useState(false);

  if (!recommendation || !recommendation.algorithmScores) {
    return null;
  }

  const { algorithmScores, hybridScore, confidence, explanations, weights, clusterName, successProbability } = recommendation;

  const getScoreColor = (score) => {
    if (score >= 85) return '#4caf50';
    if (score >= 70) return '#2196f3';
    if (score >= 55) return '#ff9800';
    return '#f44336';
  };

  const algorithmInfo = {
    content: {
      name: 'Content-Based Filtering',
      icon: <Analytics />,
      description: 'Matches your profile with pet characteristics',
      famous: 'Baseline algorithm used in most recommendation systems',
      color: '#2196f3'
    },
    collaborative: {
      name: 'SVD Collaborative Filtering',
      icon: <Groups />,
      description: 'Learns from similar users who adopted pets',
      famous: 'Netflix Prize winner - same algorithm Netflix uses',
      color: '#ff9800'
    },
    success: {
      name: 'XGBoost Success Predictor',
      icon: <Psychology />,
      description: 'Predicts adoption success probability',
      famous: 'Kaggle competition winner - industry standard ML',
      color: '#4caf50'
    },
    clustering: {
      name: 'K-Means Personality Clustering',
      icon: <Category />,
      description: 'Groups pets by personality type',
      famous: 'Classic unsupervised learning algorithm',
      color: '#9c27b0'
    }
  };

  const getExplanation = (algorithm, score) => {
    if (algorithm === 'content') {
      if (score >= 80) return 'Excellent match based on your lifestyle and preferences';
      if (score >= 60) return 'Good compatibility with your profile';
      return 'Some aspects align with your preferences';
    }
    if (algorithm === 'collaborative') {
      if (score >= 80) return 'Users similar to you highly recommend this pet';
      if (score >= 60) return 'Users like you showed interest in similar pets';
      return 'Limited collaborative data for this match';
    }
    if (algorithm === 'success') {
      if (score >= 80) return 'Very high probability of successful adoption';
      if (score >= 60) return 'Good success indicators based on historical data';
      return 'Moderate success probability';
    }
    if (algorithm === 'clustering') {
      if (score >= 70) return 'Perfect personality type match for your lifestyle';
      if (score >= 50) return 'Good fit within the pet\'s personality group';
      return 'Different personality type - may require adaptation';
    }
    return '';
  };

  return (
    <Card sx={{ borderRadius: 3, border: '2px solid #e0e0e0' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            🔬 Algorithm Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This recommendation is powered by 4 AI/ML algorithms working together
          </Typography>
        </Box>

        {/* Overall Hybrid Score */}
        <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Final Hybrid Score
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: getScoreColor(hybridScore) }}>
              {Math.round(hybridScore)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={hybridScore}
            sx={{
              height: 12,
              borderRadius: 6,
              bgcolor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                bgcolor: getScoreColor(hybridScore),
                borderRadius: 6
              }
            }}
          />
          {confidence && (
            <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
              Confidence: {Math.round(confidence)}% 
              {confidence >= 90 ? ' 🎯 (All algorithms agree!)' : 
               confidence >= 70 ? ' ✓ (High agreement)' : 
               ' ~ (Moderate agreement)'}
            </Typography>
          )}
        </Box>

        {/* Individual Algorithm Scores */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {Object.entries(algorithmScores).map(([alg, score]) => {
            const info = algorithmInfo[alg];
            const weight = weights?.[alg] || 0;
            
            return (
              <Grid item xs={12} sm={6} key={alg}>
                <Card sx={{ 
                  p: 2, 
                  bgcolor: `${info?.color}05`,
                  border: `2px solid ${info?.color}30`,
                  borderRadius: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ color: info?.color, mr: 1 }}>
                      {info?.icon}
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
                      {info?.name}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: getScoreColor(score) }}>
                      {Math.round(score)}%
                    </Typography>
                  </Box>
                  
                  <LinearProgress
                    variant="determinate"
                    value={score}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: '#e0e0e0',
                      mb: 1,
                      '& .MuiLinearProgress-bar': {
                        bgcolor: info?.color,
                        borderRadius: 3
                      }
                    }}
                  />
                  
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#666' }}>
                    {info?.description}
                  </Typography>
                  
                  {weight > 0 && (
                    <Chip 
                      label={`Weight: ${Math.round(weight * 100)}%`}
                      size="small"
                      sx={{ height: 20, fontSize: '0.65rem', bgcolor: `${info?.color}20` }}
                    />
                  )}
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Explanations */}
        {explanations && explanations.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Why This Match Works
            </Typography>
            {explanations.map((exp, idx) => (
              <Alert 
                key={idx} 
                severity="success" 
                icon={<Info />}
                sx={{ mb: 1, py: 0.5 }}
              >
                <Typography variant="body2">{exp}</Typography>
              </Alert>
            ))}
          </Box>
        )}

        {/* Additional Info */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {clusterName && (
            <Chip
              icon={<Category />}
              label={clusterName}
              sx={{ fontWeight: 600, bgcolor: '#e3f2fd' }}
            />
          )}
          {successProbability && (
            <Chip
              icon={<Psychology />}
              label={`${Math.round(successProbability * 100)}% Success Rate`}
              sx={{ fontWeight: 600, bgcolor: '#e8f5e9' }}
            />
          )}
        </Box>

        {/* Technical Details (Expandable) */}
        <Accordion 
          expanded={showTechnical}
          onChange={() => setShowTechnical(!showTechnical)}
          sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              📚 Technical Details (For Research)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              {Object.entries(algorithmScores).map(([alg, score]) => {
                const info = algorithmInfo[alg];
                return (
                  <Box key={alg} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: info?.color }}>
                      {info?.name}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#666' }}>
                      {info?.famous}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {getExplanation(alg, score)}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                  </Box>
                );
              })}

              <Alert severity="info" icon={false}>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Research Reference:
                </Typography>
                <Typography variant="caption">
                  • SVD: Netflix Prize winning algorithm (Koren et al., 2009)<br />
                  • XGBoost: Kaggle competition standard (Chen & Guestrin, 2016)<br />
                  • K-Means: Classic ML clustering (MacQueen, 1967)<br />
                  • Hybrid: Weighted ensemble approach (state-of-the-art)
                </Typography>
              </Alert>
            </Box>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default AlgorithmInsights;
