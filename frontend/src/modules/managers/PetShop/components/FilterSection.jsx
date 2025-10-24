import React from 'react';
import { 
  Card, 
  CardContent, 
  Box, 
  TextField, 
  Button, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { 
  Search as SearchIcon, 
  FilterList as FilterListIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const FilterSection = ({ 
  searchText, 
  setSearchText, 
  openFilterMenu, 
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
  breedOptions, 
  resetFilters,
  viewMode,
  setViewMode
}) => {
  return (
    <>
      <Card sx={{ mb: 3, boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, maxWidth: 400 }}>
              <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              <TextField
                fullWidth
                placeholder="Search by code, name, species, breed..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                size="small"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Box>
            
            <Button
              variant="contained"
              startIcon={<FilterListIcon />}
              onClick={openFilterMenu}
              sx={{ 
                minWidth: 120,
                bgcolor: '#1976d2',
                '&:hover': {
                  bgcolor: '#1565c0'
                }
              }}
            >
              Filters
            </Button>
            
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newValue) => newValue && setViewMode(newValue)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  borderColor: '#1976d2',
                  '&.Mui-selected': {
                    bgcolor: '#1976d2',
                    color: 'white',
                    '&:hover': {
                      bgcolor: '#1565c0'
                    }
                  }
                }
              }}
            >
              <ToggleButton value="table" title="Table View">
                <ViewListIcon />
              </ToggleButton>
              <ToggleButton value="grid" title="Grid View">
                <ViewModuleIcon />
              </ToggleButton>
            </ToggleButtonGroup>
            
            <Button 
              variant="outlined" 
              color="info" 
              onClick={resetFilters}
              startIcon={<RefreshIcon />}
              sx={{
                borderColor: '#2196f3',
                color: '#2196f3',
                '&:hover': {
                  borderColor: '#1976d2',
                  bgcolor: '#e3f2fd'
                }
              }}
            >
              Reset
            </Button>
          </Box>
        </CardContent>
      </Card>
    </>
  );
};

export default FilterSection
