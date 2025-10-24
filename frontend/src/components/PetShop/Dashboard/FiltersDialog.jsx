import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Clear as ClearIcon,
  Male as MaleIcon,
  Female as FemaleIcon
} from '@mui/icons-material';

const FiltersDialog = ({ open, onClose, filters, setFilters }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Filters</Typography>
          <IconButton onClick={onClose}>
            <ClearIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {/* Price Range */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Price Range
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <TextField
                label="Min Price"
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters(prev => ({ ...prev, minPrice: Number(e.target.value) }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                size="small"
                fullWidth
              />
              <TextField
                label="Max Price"
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                size="small"
                fullWidth
              />
            </Box>
            <Slider
              value={[filters.minPrice, filters.maxPrice]}
              onChange={(e, newValue) => setFilters(prev => ({ ...prev, minPrice: newValue[0], maxPrice: newValue[1] }))}
              valueLabelDisplay="auto"
              min={0}
              max={100000}
              step={1000}
            />
          </Box>
          
          {/* Age Range */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Age Range
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <TextField
                label="Min Age"
                type="number"
                value={filters.minAge}
                onChange={(e) => setFilters(prev => ({ ...prev, minAge: Number(e.target.value) }))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">years</InputAdornment>,
                }}
                size="small"
                fullWidth
              />
              <TextField
                label="Max Age"
                type="number"
                value={filters.maxAge}
                onChange={(e) => setFilters(prev => ({ ...prev, maxAge: Number(e.target.value) }))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">years</InputAdornment>,
                }}
                size="small"
                fullWidth
              />
            </Box>
            <Slider
              value={[filters.minAge, filters.maxAge]}
              onChange={(e, newValue) => setFilters(prev => ({ ...prev, minAge: newValue[0], maxAge: newValue[1] }))}
              valueLabelDisplay="auto"
              min={0}
              max={20}
              step={0.5}
            />
          </Box>
          
          {/* Gender */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Gender
            </Typography>
            <ToggleButtonGroup
              value={filters.gender}
              onChange={(e, newGenders) => setFilters(prev => ({ ...prev, gender: newGenders }))}
              aria-label="gender"
              fullWidth
            >
              <ToggleButton value="male" aria-label="male">
                <MaleIcon sx={{ mr: 1 }} />
                Male
              </ToggleButton>
              <ToggleButton value="female" aria-label="female">
                <FemaleIcon sx={{ mr: 1 }} />
                Female
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onClose}>Apply Filters</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FiltersDialog;