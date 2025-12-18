import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  LinearProgress
} from '@mui/material';
import { AccessTime as TimeIcon, BarChart as ChartIcon } from '@mui/icons-material';
import { petAgeAPI } from '../../../services/api';

/**
 * Pet Age Statistics Component
 * Displays age distribution and statistics for pets
 */
const PetAgeStatistics = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAgeStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await petAgeAPI.getAgeStatistics();
        setStats(response.data.data || []);
      } catch (err) {
        console.error('Error loading age statistics:', err);
        setError(err.message || 'Failed to load age statistics');
      } finally {
        setLoading(false);
      }
    };

    loadAgeStats();
  }, []);

  // Get color based on age unit
  const getUnitColor = (unit) => {
    switch (unit) {
      case 'days': return 'success';
      case 'weeks': return 'info';
      case 'months': return 'warning';
      case 'years': return 'primary';
      default: return 'default';
    }
  };

  // Format unit for display
  const formatUnit = (unit) => {
    if (!unit) return 'Unknown';
    return unit.charAt(0).toUpperCase() + unit.slice(1);
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  // Calculate total pets for percentage calculations
  const totalPets = stats.reduce((sum, stat) => sum + (stat.count || 0), 0);

  return (
    <Card sx={{ height: '100%', boxShadow: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <ChartIcon color="primary" />
          <Typography variant="h6" fontWeight="bold" color="primary">
            Pet Age Distribution
          </Typography>
        </Box>
        
        {stats.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography color="textSecondary">
              No age statistics available
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {stats.map((stat, index) => {
              const percentage = totalPets > 0 ? Math.round((stat.count / totalPets) * 100) : 0;
              
              return (
                <Grid item xs={12} key={index}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={formatUnit(stat._id)}
                        color={getUnitColor(stat._id)}
                        size="small"
                        icon={<TimeIcon />}
                      />
                      <Typography variant="body2">
                        Avg: {stat.averageAge?.toFixed(1) || 'N/A'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="bold">
                      {stat.count} pets ({percentage}%)
                    </Typography>
                  </Box>
                  
                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    color={getUnitColor(stat._id)}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  
                  <Box display="flex" justifyContent="space-between" mt={0.5}>
                    <Typography variant="caption" color="textSecondary">
                      Min: {stat.minAge || 0}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Max: {stat.maxAge || 0}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
            
            <Grid item xs={12}>
              <Box mt={2} pt={2} borderTop={1} borderColor="divider">
                <Typography variant="body2" fontWeight="bold" textAlign="center">
                  Total Pets: {totalPets}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default PetAgeStatistics;