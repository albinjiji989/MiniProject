import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import { AccessTime as TimeIcon } from '@mui/icons-material';
import { petAgeAPI } from '../../../../services/api';

/**
 * Pet Age Display Component
 * Displays current age of a pet with automatic updates
 */
const PetAgeDisplay = ({ petCode, initialAge, initialAgeUnit, variant = 'standard' }) => {
  const [currentAge, setCurrentAge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCurrentAge = async () => {
      if (!petCode) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const ageData = await petAgeAPI.getCurrentAge(petCode);
        setCurrentAge(ageData.data.currentAge);
      } catch (err) {
        console.warn(`Failed to fetch current age for pet ${petCode}:`, err);
        // Fallback to initial age if API fails
        setCurrentAge({ value: initialAge, unit: initialAgeUnit });
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentAge();
  }, [petCode, initialAge, initialAgeUnit]);

  // Format age for display
  const formatAge = (ageObj) => {
    if (!ageObj) return 'Unknown';
    
    const { value, unit } = ageObj;
    if (value === undefined || unit === undefined) return 'Unknown';
    
    // Pluralize unit if needed
    const pluralUnit = value !== 1 ? 
      (unit === 'month' ? 'months' : unit === 'year' ? 'years' : unit === 'week' ? 'weeks' : unit + 's') : 
      unit;
    
    return `${value} ${pluralUnit}`;
  };

  // Get color based on age
  const getAgeColor = (ageObj) => {
    if (!ageObj) return 'default';
    
    const { value, unit } = ageObj;
    
    // Convert to months for comparison
    let months = 0;
    switch (unit) {
      case 'days': months = value / 30; break;
      case 'weeks': months = value / 4; break;
      case 'months': months = value; break;
      case 'years': months = value * 12; break;
      default: return 'default';
    }
    
    if (months < 6) return 'success'; // Baby
    if (months < 24) return 'primary'; // Young
    if (months < 84) return 'warning'; // Adult
    return 'secondary'; // Senior
  };

  if (loading) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <TimeIcon fontSize="small" />
        <Typography variant="caption">Loading...</Typography>
      </Box>
    );
  }

  const ageToDisplay = currentAge || { value: initialAge, unit: initialAgeUnit };
  
  if (variant === 'chip') {
    return (
      <Tooltip title={`Pet Code: ${petCode}`}>
        <Chip
          icon={<TimeIcon />}
          label={formatAge(ageToDisplay)}
          color={getAgeColor(ageToDisplay)}
          size="small"
          variant="outlined"
        />
      </Tooltip>
    );
  }

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <TimeIcon fontSize="small" color="action" />
      <Typography variant="caption" color="textSecondary">
        {formatAge(ageToDisplay)}
      </Typography>
    </Box>
  );
};

export default PetAgeDisplay;