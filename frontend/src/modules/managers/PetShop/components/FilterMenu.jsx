import React from 'react';
import { 
  Menu, 
  Box, 
  Typography, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Button,
  TextField
} from '@mui/material';

const FilterMenu = ({ 
  filterOpen,
  filterAnchorEl,
  closeFilterMenu,
  statusFilter, 
  setStatusFilter, 
  speciesFilter, 
  setSpeciesFilter, 
  breedFilter, 
  setBreedFilter, 
  priceMin, 
  setPriceMin, 
  priceMax, 
  setPriceMax, 
  genderFilter, 
  setGenderFilter, 
  ageMin, 
  setAgeMin, 
  ageMax, 
  setAgeMax, 
  speciesOptions, 
  breedOptions
}) => {
  return (
    <Menu
      anchorEl={filterAnchorEl}
      open={filterOpen}
      onClose={closeFilterMenu}
      PaperProps={{
        style: {
          maxHeight: 400,
          width: '350px',
        },
        sx: {
          borderRadius: 2,
          boxShadow: 4
        }
      }}
    >
      <Box sx={{ p: 2, bgcolor: '#fafafa' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
          Filters
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select 
                label="Status" 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{
                  borderRadius: 1
                }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="in_petshop">In PetShop</MenuItem>
                <MenuItem value="available_for_sale">Available for Sale</MenuItem>
                <MenuItem value="reserved">Reserved</MenuItem>
                <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                <MenuItem value="sold">Sold</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Species</InputLabel>
              <Select 
                label="Species" 
                value={speciesFilter} 
                onChange={(e) => setSpeciesFilter(e.target.value)}
                sx={{
                  borderRadius: 1
                }}
              >
                <MenuItem value="">All Species</MenuItem>
                {speciesOptions.map(s => (
                  <MenuItem key={s._id} value={s._id}>{s.displayName || s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth size="small" disabled={!speciesFilter}>
              <InputLabel>Breed</InputLabel>
              <Select 
                label="Breed" 
                value={breedFilter} 
                onChange={(e) => setBreedFilter(e.target.value)}
                sx={{
                  borderRadius: 1
                }}
              >
                <MenuItem value="">All Breeds</MenuItem>
                {breedOptions.map(b => (
                  <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField 
              fullWidth 
              size="small" 
              type="number" 
              label="Min Price" 
              value={priceMin} 
              onChange={(e) => setPriceMin(e.target.value)}
              sx={{
                borderRadius: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField 
              fullWidth 
              size="small" 
              type="number" 
              label="Max Price" 
              value={priceMax} 
              onChange={(e) => setPriceMax(e.target.value)}
              sx={{
                borderRadius: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField 
              fullWidth 
              size="small" 
              type="number" 
              label="Min Age" 
              value={ageMin} 
              onChange={(e) => setAgeMin(e.target.value)}
              sx={{
                borderRadius: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField 
              fullWidth 
              size="small" 
              type="number" 
              label="Max Age" 
              value={ageMax} 
              onChange={(e) => setAgeMax(e.target.value)}
              sx={{
                borderRadius: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Gender</InputLabel>
              <Select 
                label="Gender" 
                value={genderFilter} 
                onChange={(e) => setGenderFilter(e.target.value)}
                sx={{
                  borderRadius: 1
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Unknown">Unknown</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
          <Button 
            onClick={closeFilterMenu}
            sx={{
              color: '#666'
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={closeFilterMenu}
            sx={{
              bgcolor: '#1976d2',
              '&:hover': {
                bgcolor: '#1565c0'
              }
            }}
          >
            Apply Filters
          </Button>
        </Box>
      </Box>
    </Menu>
  );
};

export default FilterMenu;