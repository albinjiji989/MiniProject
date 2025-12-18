import React, { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Avatar,
  Tooltip,
  alpha,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Pets as PetsIcon,
  CalendarToday as CalendarIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
  Help as HelpIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { userPetsAPI, apiClient, adoptionAPI, resolveMediaUrl, temporaryCareAPI } from '../../../services/api'

const UserPetsList = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAnchor, setFilterAnchor] = useState(null)
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [selectedPet, setSelectedPet] = useState(null)
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [filters, setFilters] = useState({ status: '' })
  const [sortBy, setSortBy] = useState('createdAt')

  const loadPets = async (pageParam = 1) => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch from PetNew, Pet, adopted pets, purchased pets, and temporary care pets models in parallel
      const [petNewRes, petRes, adoptedRes, purchasedRes, temporaryCareRes] = await Promise.allSettled([
        userPetsAPI.list({
          page: pageParam,
          limit: 12,
          search: searchTerm || undefined,
          status: filters.status || undefined,
        }),
        apiClient.get('/pets/my-pets'),
        adoptionAPI.getMyAdoptedPets(),
        apiClient.get('/petshop/user/my-purchased-pets'), // Add pet shop purchased pets
        temporaryCareAPI.getPetsInCare() // Add pets in temporary care
      ])
      
      // Process PetNew results
      let petNewPets = []
      let petNewPagination = {}
      if (petNewRes.status === 'fulfilled') {
        const data = petNewRes.value.data
        petNewPets = Array.isArray(data?.data) ? data.data : (data?.data?.pets || [])
        petNewPagination = data?.pagination || {}
      }
      
      // Process Pet results
      let corePets = []
      if (petRes.status === 'fulfilled') {
        corePets = petRes.value.data?.data?.pets || []
      }
      
      // Process adopted pets
      let adoptedPets = []
      if (adoptedRes.status === 'fulfilled') {
        adoptedPets = adoptedRes.value.data?.data || []
      }
      
      // Process purchased pets
      let purchasedPets = []
      if (purchasedRes.status === 'fulfilled') {
        purchasedPets = purchasedRes.value.data?.data?.pets || []
      }
      
      // Process pets in temporary care
      let temporaryCarePets = []
      if (temporaryCareRes.status === 'fulfilled') {
        temporaryCarePets = temporaryCareRes.value.data?.data?.pets || []
      }
      
      // Map adopted pets to pet-like objects
      const mappedAdoptedPets = adoptedPets.map(pet => ({
        _id: pet._id,
        name: pet.name || 'Pet',
        images: pet.images || [],
        petCode: pet.petCode,
        breed: pet.breed,
        species: pet.species,
        gender: pet.gender || 'Unknown',
        status: 'adopted',
        currentStatus: 'adopted',
        tags: ['adoption'],
        adoptionDate: pet.adoptionDate,
        age: pet.age,
        ageUnit: pet.ageUnit,
        color: pet.color,
        createdAt: pet.adoptionDate
      }))
      
      // Map purchased pets to pet-like objects
      const mappedPurchasedPets = purchasedPets.map(pet => ({
        _id: pet._id,
        name: pet.name || 'Pet',
        images: pet.images || [],
        petCode: pet.petCode,
        breed: pet.breed,
        species: pet.species,
        gender: pet.gender || 'Unknown',
        status: 'purchased',
        currentStatus: 'purchased',
        tags: ['purchased'],
        purchaseDate: pet.acquiredDate,
        age: pet.age,
        ageUnit: pet.ageUnit,
        color: pet.color,
        createdAt: pet.acquiredDate,
        source: pet.source,
        sourceLabel: pet.sourceLabel
      }))
      
      // Map temporary care pets to pet-like objects
      const mappedTemporaryCarePets = temporaryCarePets.map(pet => ({
        _id: pet._id,
        name: pet.name || 'Pet',
        images: pet.images || [],
        petCode: pet.petCode,
        breed: pet.breed,
        species: pet.species,
        gender: pet.gender || 'Unknown',
        status: 'in_care',
        currentStatus: 'in_care',
        tags: ['temporary-care'],
        careStartDate: pet.careStartDate,
        careEndDate: pet.careEndDate,
        careCenter: pet.careCenter,
        age: pet.age,
        ageUnit: pet.ageUnit,
        color: pet.color,
        createdAt: pet.careStartDate,
        temporaryCareId: pet.temporaryCareId
      }))
      
      // Combine and deduplicate pets
      const combinedPets = [...petNewPets, ...corePets, ...mappedAdoptedPets, ...mappedPurchasedPets, ...mappedTemporaryCarePets]
      const uniquePets = combinedPets.filter((pet, index, self) => 
        index === self.findIndex(p => (p.petCode || p._id) === (pet.petCode || pet._id))
      )
      
      // Sort pets
      const sortedPets = [...uniquePets].sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name)
        } else if (sortBy === 'age') {
          return (a.age || 0) - (b.age || 0)
        } else {
          // Default sort by creation date (newest first)
          const dateA = new Date(a.createdAt || a.adoptionDate || a.purchaseDate || a.careStartDate || 0)
          const dateB = new Date(b.createdAt || b.adoptionDate || b.purchaseDate || b.careStartDate || 0)
          return dateB - dateA
        }
      })
      
      setPets(sortedPets)
      setPage(petNewPagination?.current || 1)
      setPages(petNewPagination?.pages || 1)
      setTotal(petNewPagination?.total || (sortedPets?.length || 0))
    } catch (err) {
      console.error('Error loading pets:', err)
      setError(err?.response?.data?.message || 'Failed to load pets')
      setPets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    loadPets(1) 
  }, [])

  const handleSearch = (event) => {
    setSearchTerm(event.target.value)
  }

  const applySearch = () => {
    loadPets(1)
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      applySearch()
    }
  }

  const handleFilterClick = (event) => {
    setFilterAnchor(event.currentTarget)
  }

  const handleMenuClick = (event, pet) => {
    event.stopPropagation()
    setMenuAnchor(event.currentTarget)
    setSelectedPet(pet)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setSelectedPet(null)
  }

  const handleViewPet = () => {
    // Check if this is an adopted pet by looking for the 'adoption' tag
    if (selectedPet?.tags?.includes('adoption')) {
      // For adopted pets, navigate to the adoption details page
      navigate(`/User/adoption/my-adopted-pets/${selectedPet._id}`)
    } 
    // Check if this is a purchased pet by looking for the 'purchased' tag
    else if (selectedPet?.tags?.includes('purchased')) {
      // For purchased pets, navigate using the petCode if available, otherwise use _id
      const petId = selectedPet.petCode || selectedPet._id;
      navigate(`/User/pets/${petId}`)
    }
    // Check if this is a pet in temporary care
    else if (selectedPet?.tags?.includes('temporary-care')) {
      // For pets in temporary care, navigate to the temporary care details page
      navigate(`/User/temporary-care/${selectedPet.temporaryCareId}`)
    }
    else {
      // For regular user pets, use the existing navigation
      navigate(`/User/pets/${selectedPet._id}`)
    }
    handleMenuClose()
  }

  const handleEditPet = () => {
    // Check if this is an adopted pet by looking for the 'adoption' tag
    if (selectedPet?.tags?.includes('adoption')) {
      // For adopted pets, show a message that they can't be edited
      alert('Adopted pets cannot be edited. Please contact the adoption center if you need to make changes.')
    } 
    // Check if this is a pet in temporary care
    else if (selectedPet?.tags?.includes('temporary-care')) {
      // For pets in temporary care, show a message that they can't be edited
      alert('Pets in temporary care cannot be edited. Please contact the care center if you need to make changes.')
    }
    else {
      // For regular user pets, use the existing navigation
      navigate(`/User/pets/${selectedPet._id}/edit`)
    }
    handleMenuClose()
  }

  const handleDeletePet = async () => {
    if (!selectedPet) return;
    
    if (!window.confirm('Are you sure you want to delete this pet? This action cannot be undone.')) {
      handleMenuClose();
      return;
    }
    
    try {
      // Check if this is an adopted pet
      if (selectedPet?.tags?.includes('adoption')) {
        alert('Adopted pets cannot be deleted. Please contact the adoption center if you need to make changes.');
        handleMenuClose();
        return;
      }
      
      // Check if this is a pet in temporary care
      if (selectedPet?.tags?.includes('temporary-care')) {
        alert('Pets in temporary care cannot be deleted. Please contact the care center if you need to make changes.');
        handleMenuClose();
        return;
      }
      
      // Delete the pet
      await userPetsAPI.delete(selectedPet._id);
      
      // Reload the pets list
      await loadPets(page);
      
      // Show success message
      alert('Pet deleted successfully');
    } catch (error) {
      console.error('Error deleting pet:', error);
      alert('Failed to delete pet. Please try again.');
    } finally {
      handleMenuClose();
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'success'
      case 'in_care':
        return 'info'
      case 'adopted':
        return 'primary'
      case 'rescued':
        return 'warning'
      case 'deceased':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'Available'
      case 'in_care':
        return 'In Care'
      case 'adopted':
        return 'Adopted'
      case 'rescued':
        return 'Rescued'
      case 'deceased':
        return 'Deceased'
      case 'not_available':
        return 'Not Available'
      default:
        return status || 'Unknown'
    }
  }

  const getGenderIcon = (gender) => {
    switch (gender?.toLowerCase()) {
      case 'male':
        return <MaleIcon sx={{ fontSize: 16, color: 'primary.main' }} />
      case 'female':
        return <FemaleIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
      default:
        return <HelpIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const getPetType = (pet) => {
    if (pet?.tags?.includes('adoption')) {
      return 'Adopted'
    }
    if (pet?.tags?.includes('purchased')) {
      return 'Purchased'
    }
    if (pet?.tags?.includes('temporary-care')) {
      return 'In Temporary Care'
    }
    return 'My Pet'
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            My Pets
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and view all your pets in one place
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/User/pets/add')}
          size={isMobile ? 'small' : 'medium'}
        >
          Add New Pet
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
            color: 'white',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {pets.length}
                  </Typography>
                  <Typography variant="body2">
                    Total Pets
                  </Typography>
                </Box>
                <PetsIcon sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.success.light} 0%, ${theme.palette.success.main} 100%)`,
            color: 'white',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {pets.filter(p => p.currentStatus === 'available' || p.status === 'available').length}
                  </Typography>
                  <Typography variant="body2">
                    Available
                  </Typography>
                </Box>
                <PetsIcon sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.info.light} 0%, ${theme.palette.info.main} 100%)`,
            color: 'white',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {pets.filter(p => p.currentStatus === 'in_care' || p.status === 'in_care').length}
                  </Typography>
                  <Typography variant="body2">
                    In Care
                  </Typography>
                </Box>
                <CalendarIcon sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
            color: 'white',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {pets.filter(p => p.tags?.includes('adoption')).length}
                  </Typography>
                  <Typography variant="body2">
                    Adopted
                  </Typography>
                </Box>
                <PetsIcon sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            alignItems: { xs: 'stretch', sm: 'flex-end' }
          }}>
            <TextField
              fullWidth
              placeholder="Search pets by name, breed, or species..."
              value={searchTerm}
              onChange={handleSearch}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              width: { xs: '100%', sm: 'auto' }
            }}>
              <Button 
                variant="contained" 
                onClick={applySearch}
                sx={{ minWidth: 100 }}
              >
                Search
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<FilterIcon />} 
                onClick={handleFilterClick}
                sx={{ minWidth: 100 }}
              >
                Filters
              </Button>
            </Box>
          </Box>
          
          <Box sx={{ 
            mt: 2, 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            alignItems: { xs: 'stretch', sm: 'flex-end' }
          }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={filters.status}
                onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="in_care">In Care</MenuItem>
                <MenuItem value="adopted">Adopted</MenuItem>
                <MenuItem value="rescued">Rescued</MenuItem>
                <MenuItem value="deceased">Deceased</MenuItem>
                <MenuItem value="not_available">Not Available</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                label="Sort By"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="createdAt">Date Added</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="age">Age</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              ml: 'auto'
            }}>
              <Button 
                variant="outlined" 
                onClick={() => { 
                  setFilters({ status: '' }); 
                  setSortBy('createdAt');
                  loadPets(1) 
                }}
              >
                Clear
              </Button>
              <Button 
                variant="contained" 
                onClick={() => loadPets(1)}
              >
                Apply
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/User/pets/my-pets')}
              >
                My Pets
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/User/adoption/adopted')}
              >
                Adopted Pets
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/User/petshop/purchased')}
              >
                Purchased Pets
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card sx={{ mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <CardContent>
            <Typography>{error}</Typography>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : pets.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <PetsIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 1 }}>No pets found</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              You haven't added any pets yet or no pets match your search criteria
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/User/pets/add')}
              size="large"
            >
              Add Your First Pet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Pets Grid */}
          <Grid container spacing={3}>
            {pets.map((pet) => (
              <Grid item xs={12} sm={6} md={4} key={pet._id || pet.petCode}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    }
                  }}
                  onClick={() => {
                    // Check if this is an adopted pet by looking for the 'adoption' tag
                    if (pet?.tags?.includes('adoption')) {
                      // For adopted pets, navigate to the adoption details page
                      navigate(`/User/adoption/my-adopted-pets/${pet._id}`)
                    } 
                    // Check if this is a purchased pet by looking for the 'purchased' tag
                    else if (pet?.tags?.includes('purchased')) {
                      // For purchased pets, navigate to the purchased pet details page
                      navigate(`/User/petshop/my-purchased-pets/${pet._id || pet.petCode}`)
                    }
                    // Check if this is a pet in temporary care
                    else if (pet?.tags?.includes('temporary-care')) {
                      // For pets in temporary care, navigate to the temporary care details page
                      navigate(`/User/temporary-care/${pet.temporaryCareId}`)
                    }
                    else {
                      // For regular user pets, use the existing navigation
                      navigate(`/User/pets/${pet._id}`)
                    }
                  }}
                >
                  {/* Pet Type Badge */}
                  <Chip
                    label={getPetType(pet)}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 1,
                      bgcolor: pet.tags?.includes('adoption') ? 'secondary.main' : 
                               pet.tags?.includes('purchased') ? 'success.main' :
                               pet.tags?.includes('temporary-care') ? 'info.main' : 'primary.main',
                      color: 'white',
                      fontWeight: 600
                    }}
                  />
                  
                  {/* Menu Button */}
                  <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 1 }}>
                    <IconButton 
                      size="small" 
                      sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.8)',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' }
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMenuClick(e, pet)
                      }}
                    >
                      <MoreVertIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                  
                  <CardContent sx={{ pt: 6 }}>
                    {/* Pet Image */}
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 100,
                          height: 100,
                          margin: '0 auto 16px',
                          border: `4px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                          boxShadow: 3,
                          bgcolor: 'background.paper'
                        }}
                        src={pet.images && pet.images.length > 0 ? 
                          resolveMediaUrl(pet.images[0]?.url || pet.images[0]) : 
                          undefined
                        }
                        onError={(e) => { 
                          console.log('Avatar image load error for pet:', pet.name, 'Image data:', pet.images);
                          e.currentTarget.src = '/placeholder-pet.svg' 
                        }}
                      >
                        <PetsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                      </Avatar>
                      
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {pet.name || 'Unnamed Pet'}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 1 }}>
                        {getGenderIcon(pet.gender)}
                        <Typography variant="body2" color="text.secondary">
                          {pet.gender || 'Unknown'} • {pet.age || '-'} {pet.ageUnit || 'months'}
                        </Typography>
                      </Box>
                      
                      <Chip 
                        label={getStatusLabel(pet.currentStatus || pet.status || 'available')} 
                        color={getStatusColor(pet.currentStatus || pet.status || 'available')} 
                        size="small" 
                        sx={{ mb: 1 }}
                      />
                    </Box>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    {/* Pet Details */}
                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Species:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {/* Handle case where species might be an object */}
                          {typeof pet.species === 'object' && pet.species !== null ? 
                            (pet.species.name || pet.species.displayName || pet.species._id || JSON.stringify(pet.species)) : 
                            (pet.species?.name || pet.species?.displayName || pet.speciesId?.displayName || pet.speciesId?.name || pet.species || '-')}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Breed:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {/* Handle case where breed might be an object */}
                          {typeof pet.breed === 'object' && pet.breed !== null ? 
                            (pet.breed.name || pet.breed._id || JSON.stringify(pet.breed)) : 
                            (pet.breed?.name || pet.breedId?.name || pet.breed || '-')}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Color:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {/* Handle case where color might be an object */}
                          {typeof pet.color === 'object' && pet.color !== null ? 
                            (pet.color.name || pet.color._id || JSON.stringify(pet.color)) : 
                            (pet.color?.name || pet.color || '-')}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Adoption Date for adopted pets */}
                    {pet.tags?.includes('adoption') && pet.adoptionDate && (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        mt: 1,
                        p: 1,
                        bgcolor: alpha(theme.palette.secondary.main, 0.1),
                        borderRadius: 1
                      }}>
                        <CalendarIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                        <Typography variant="caption" sx={{ color: 'secondary.main' }}>
                          Adopted: {formatDate(pet.adoptionDate)}
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Care dates for pets in temporary care */}
                    {pet.tags?.includes('temporary-care') && pet.careStartDate && (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: 0.5,
                        mt: 1,
                        p: 1,
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        borderRadius: 1
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarIcon sx={{ fontSize: 16, color: 'info.main' }} />
                          <Typography variant="caption" sx={{ color: 'info.main' }}>
                            Care Start: {formatDate(pet.careStartDate)}
                          </Typography>
                        </Box>
                        {pet.careEndDate && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarIcon sx={{ fontSize: 16, color: 'info.main' }} />
                            <Typography variant="caption" sx={{ color: 'info.main' }}>
                              Care End: {formatDate(pet.careEndDate)}
                            </Typography>
                          </Box>
                        )}
                        {pet.careCenter && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PetsIcon sx={{ fontSize: 16, color: 'info.main' }} />
                            <Typography variant="caption" sx={{ color: 'info.main' }}>
                              {pet.careCenter}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {/* Pagination */}
          {pages > 1 && (
            <Box sx={{ 
              mt: 4, 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2
            }}>
              <Typography variant="body2" color="text.secondary">
                Showing {Math.min(pets.length, 12)} of {total} pets
              </Typography>
              <Pagination 
                count={pages} 
                page={page} 
                onChange={(e, value) => loadPets(value)}
                color="primary"
                siblingCount={isMobile ? 0 : 1}
              />
            </Box>
          )}
        </>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleViewPet}>
          <ViewIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleEditPet}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeletePet} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={() => setFilterAnchor(null)}
      >
        <MenuItem onClick={() => { setFilters({ status: '' }); setFilterAnchor(null) }}>All Status</MenuItem>
        <MenuItem onClick={() => { setFilters({ status: 'available' }); setFilterAnchor(null) }}>Available</MenuItem>
        <MenuItem onClick={() => { setFilters({ status: 'in_care' }); setFilterAnchor(null) }}>In Care</MenuItem>
        <MenuItem onClick={() => { setFilters({ status: 'adopted' }); setFilterAnchor(null) }}>Adopted</MenuItem>
      </Menu>
    </Box>
  )
}

export default UserPetsList