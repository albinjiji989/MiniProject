import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress, Alert, Grid, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { apiClient } from '../../services/api';

export default function BlockchainStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/blockchain/stats');
      setStats(res.data.data);
      setError('');
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load blockchain stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!stats) return null;

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <span role="img" aria-label="blockchain">⛓️</span> Blockchain Analytics
        </Typography>

        <Grid container spacing={2}>
          {/* Chain Status */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: stats.isValid ? 'success.light' : 'error.light', borderRadius: 1 }}>
              {stats.isValid ? (
                <CheckCircleIcon sx={{ fontSize: 40, color: 'success.dark', mb: 1 }} />
              ) : (
                <ErrorIcon sx={{ fontSize: 40, color: 'error.dark', mb: 1 }} />
              )}
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {stats.isValid ? 'Valid' : 'Invalid'}
              </Typography>
              <Typography variant="body2" color="text.secondary">Chain Status</Typography>
            </Box>
          </Grid>

          {/* Total Blocks */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.dark' }}>
                {stats.totalBlocks}
              </Typography>
              <Typography variant="body2" color="text.secondary">Total Blocks</Typography>
            </Box>
          </Grid>

          {/* Difficulty */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.dark' }}>
                {stats.difficulty}
              </Typography>
              <Typography variant="body2" color="text.secondary">Mining Difficulty</Typography>
            </Box>
          </Grid>

          {/* First Block Date */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {stats.firstBlock ? new Date(stats.firstBlock).toLocaleDateString() : 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">Chain Started</Typography>
            </Box>
          </Grid>

          {/* Event Type Breakdown */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, mt: 1 }}>
              Event Types
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(stats.eventTypeCounts || {}).map(([eventType, count]) => (
                <Chip
                  key={eventType}
                  label={`${eventType}: ${count}`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Grid>

          {/* Last Block */}
          {stats.lastBlock && (
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                Last block added: {new Date(stats.lastBlock).toLocaleString()}
              </Typography>
            </Grid>
          )}
        </Grid>

        <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            💡 This blockchain ledger provides tamper-proof tracking of all adoption events. 
            Each block is cryptographically linked and mined with proof-of-work for security.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
