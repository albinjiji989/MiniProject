import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Chip, 
  Checkbox, 
  IconButton, 
  Tooltip, 
  Pagination 
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Visibility as ViewIcon, 
  Publish as PublishIcon, 
  Delete as DeleteIcon, 
  History as HistoryIcon, 
  AddPhotoAlternate as AddPhotoAlternateIcon, 
  CloudUpload as CloudUploadIcon, 
  CheckCircle as CheckCircleIcon, 
  Pending as PendingIcon, 
  ShoppingCart as ShoppingCartIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PetCard from './PetCard';

const TabContent = ({ 
  activeTab, 
  inventory, 
  readyForRelease, 
  releasedPets, 
  purchasedPets, 
  selectedIds, 
  selectedReadyIds, 
  selectedReleasedIds, 
  selectedPurchasedIds, 
  viewMode, 
  pagination, 
  handleSelectAllPending, 
  handleSelectAllReady, 
  handleSelectAllReleased, 
  handleSelectAllPurchased, 
  handlePageChange, 
  handleEditPet, 
  handleOpenImageDialog, 
  handleDeletePet, 
  handleReleaseToPublic, 
  setActiveTab,
  setSelectedIds
}) => {
  const navigate = useNavigate();

  // Render Pending Images Tab
  const renderPendingImagesTab = () => (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Pets Pending Images
          </Typography>
          <Typography variant="body2" color="textSecondary">
            These pets need images before they can be released to users
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleSelectAllPending}
            startIcon={selectedIds.length === inventory.length && inventory.length > 0 ? <CloseIcon /> : <CheckIcon />}
          >
            {selectedIds.length === inventory.length && inventory.length > 0 ? 'Deselect All' : 'Select All'}
          </Button>
          <Button
            variant="contained"
            disabled={selectedIds.length === 0}
            onClick={() => {
              const firstSelected = inventory.find(item => selectedIds.includes(item._id));
              if (firstSelected) {
                handleOpenImageDialog(firstSelected);
              }
            }}
            startIcon={<CloudUploadIcon />}
          >
            Upload Images ({selectedIds.length})
          </Button>
        </Box>
      </Box>
      
      {inventory.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Box sx={{ 
            width: 120, 
            height: 120, 
            borderRadius: '50%', 
            bgcolor: '#e3f2fd', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <AddPhotoAlternateIcon sx={{ fontSize: 60, color: '#1976d2' }} />
          </Box>
          <Typography variant="h5" gutterBottom>
            No pets pending images
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
            All pets have images and are ready for release, or there are no pets in inventory.
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => setActiveTab(1)}
            startIcon={<CheckCircleIcon />}
          >
            View Ready Pets
          </Button>
        </Box>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <Grid container spacing={2}>
              {inventory.map(item => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                  <PetCard 
                    item={item}
                    isSelected={selectedIds.includes(item._id)}
                    onSelect={(id) => {
                      setSelectedIds(prev => 
                        prev.includes(id) 
                          ? prev.filter(i => i !== id) 
                          : [...prev, id]
                      );
                    }}
                    onAction={(action, data) => {
                      switch(action) {
                        case 'edit': handleEditPet(data); break;
                        case 'upload': handleOpenImageDialog(data); break;
                        case 'history': navigate(`/manager/petshop/pets/${data._id}/history`); break;
                        case 'delete': handleDeletePet(data); break;
                        default: break;
                      }
                    }}
                    isPending={true}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedIds.length > 0 && selectedIds.length < inventory.length}
                        checked={inventory.length > 0 && selectedIds.length === inventory.length}
                        onChange={handleSelectAllPending}
                      />
                    </TableCell>
                    <TableCell>Pet Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Species/Breed</TableCell>
                    <TableCell>Age/Gender</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory.map(item => (
                    <TableRow 
                      key={item._id}
                      selected={selectedIds.includes(item._id)}
                      sx={{ 
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                        backgroundColor: selectedIds.includes(item._id) ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(item._id)}
                          onChange={(e) => {
                            setSelectedIds(prev => 
                              e.target.checked 
                                ? [...new Set([...prev, item._id])] 
                                : prev.filter(id => id !== item._id)
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={item.petCode || `PET-${item._id.slice(-6)}`} 
                          size="small" 
                          color="primary" 
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.name || 'Unnamed Pet'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {item.speciesId?.displayName || item.speciesId?.name || 'Unknown Species'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.breedId?.name || 'Unknown Breed'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {item.age} {item.ageUnit} • {item.gender}
                          </Typography>
                          {item.ageGroup && (
                            <Typography variant="caption" color="textSecondary">
                              {item.ageGroup}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color={item.price > 0 ? 'text.primary' : 'text.secondary'}
                        >
                          ₹{Number(item.price || 0).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Chip 
                            label={item.status?.replace('_', ' ') || 'in stock'} 
                            size="small" 
                            color={item.status === 'available_for_sale' ? 'success' : 'default'}
                          />
                          {item.images && item.images.length > 0 && (
                            <Chip 
                              label={`${item.images.length} image${item.images.length > 1 ? 's' : ''}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Edit Pet Details">
                            <IconButton size="small" onClick={() => handleEditPet(item)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Add Image">
                            <IconButton size="small" color="secondary" onClick={() => handleOpenImageDialog(item)}>
                              <AddPhotoAlternateIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small"
                              onClick={() => navigate(`/manager/petshop/pets/${item._id}/history`)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="View Pet History">
                            <IconButton 
                              size="small" 
                              color="info"
                              onClick={() => navigate(`/manager/petshop/pets/${item._id}/history`)}
                            >
                              <HistoryIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Delete Pet">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeletePet(item._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {pagination.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination 
                count={pagination.pages} 
                page={pagination.current} 
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </>
  );

  // Render Ready for Release Tab
  const renderReadyForReleaseTab = () => (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Ready for Release
          </Typography>
          <Typography variant="body2" color="textSecondary">
            These pets have images and are ready to be released to users
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleSelectAllReady}
            startIcon={selectedReadyIds.length === readyForRelease.length && readyForRelease.length > 0 ? <CloseIcon /> : <CheckIcon />}
          >
            {selectedReadyIds.length === readyForRelease.length && readyForRelease.length > 0 ? 'Deselect All' : 'Select All'}
          </Button>
          <Button
            variant="contained"
            disabled={selectedReadyIds.length === 0}
            onClick={() => handleReleaseToPublic(selectedReadyIds)}
            startIcon={<PublishIcon />}
          >
            Release Selected ({selectedReadyIds.length})
          </Button>
        </Box>
      </Box>
      
      {readyForRelease.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Box sx={{ 
            width: 120, 
            height: 120, 
            borderRadius: '50%', 
            bgcolor: '#e8f5e9', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <CheckCircleIcon sx={{ fontSize: 60, color: '#4caf50' }} />
          </Box>
          <Typography variant="h5" gutterBottom>
            No pets ready for release
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
            Upload images for pets in the "Pending Images" tab to make them available for release.
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => setActiveTab(0)}
            startIcon={<PendingIcon />}
          >
            Add Pet Images
          </Button>
        </Box>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <Grid container spacing={2}>
              {readyForRelease.map(item => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                  <PetCard 
                    item={item}
                    isSelected={selectedReadyIds.includes(item._id)}
                    onSelect={(id) => {
                      setSelectedIds(prev => 
                        prev.includes(id) 
                          ? prev.filter(i => i !== id) 
                          : [...prev, id]
                      );
                    }}
                    onAction={(action, data) => {
                      switch(action) {
                        case 'edit': handleEditPet(data); break;
                        case 'view': navigate(`/manager/petshop/pets/${data._id}/history`); break;
                        case 'history': navigate(`/manager/petshop/pets/${data._id}/history`); break;
                        case 'release': handleReleaseToPublic(data); break;
                        case 'delete': handleDeletePet(data); break;
                        default: break;
                      }
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedReadyIds.length > 0 && selectedReadyIds.length < readyForRelease.length}
                        checked={readyForRelease.length > 0 && selectedReadyIds.length === readyForRelease.length}
                        onChange={handleSelectAllReady}
                      />
                    </TableCell>
                    <TableCell>Pet Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Species/Breed</TableCell>
                    <TableCell>Age/Gender</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {readyForRelease.map(item => (
                    <TableRow 
                      key={item._id}
                      selected={selectedReadyIds.includes(item._id)}
                      sx={{ 
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                        backgroundColor: selectedReadyIds.includes(item._id) ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedReadyIds.includes(item._id)}
                          onChange={(e) => {
                            setSelectedIds(prev => 
                              e.target.checked 
                                ? [...new Set([...prev, item._id])] 
                                : prev.filter(id => id !== item._id)
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={item.petCode || `PET-${item._id.slice(-6)}`} 
                          size="small" 
                          color="primary" 
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.name || 'Unnamed Pet'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {item.speciesId?.displayName || item.speciesId?.name || 'Unknown Species'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.breedId?.name || 'Unknown Breed'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {item.age} {item.ageUnit} • {item.gender}
                          </Typography>
                          {item.ageGroup && (
                            <Typography variant="caption" color="textSecondary">
                              {item.ageGroup}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color={item.price > 0 ? 'text.primary' : 'text.secondary'}
                        >
                          ₹{Number(item.price || 0).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Chip 
                            label={item.status?.replace('_', ' ') || 'in stock'} 
                            size="small" 
                            color={item.status === 'available_for_sale' ? 'success' : 'default'}
                          />
                          {item.images && item.images.length > 0 && (
                            <Chip 
                              label={`${item.images.length} image${item.images.length > 1 ? 's' : ''}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Edit Pet Details">
                            <IconButton size="small" onClick={() => handleEditPet(item)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="View Pet History">
                            <IconButton 
                              size="small" 
                              color="info"
                              onClick={() => navigate(`/manager/petshop/pets/${item._id}/history`)}
                            >
                              <HistoryIcon />
                            </IconButton>
                          </Tooltip>
                          
                          {item.status !== 'available_for_sale' && (
                            <Tooltip title="Release to Public">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => handleReleaseToPublic([item._id])}
                              >
                                <PublishIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          <Tooltip title="Delete Pet">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeletePet(item._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {pagination.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination 
                count={pagination.pages} 
                page={pagination.current} 
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </>
  );

  // Render Released Pets Tab
  const renderReleasedPetsTab = () => (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Released Pets
          </Typography>
          <Typography variant="body2" color="textSecondary">
            These pets are currently available for public viewing and purchase
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleSelectAllReleased}
            startIcon={selectedReleasedIds.length === releasedPets.length && releasedPets.length > 0 ? <CloseIcon /> : <CheckIcon />}
          >
            {selectedReleasedIds.length === releasedPets.length && releasedPets.length > 0 ? 'Deselect All' : 'Select All'}
          </Button>
        </Box>
      </Box>
      
      {releasedPets.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Box sx={{ 
            width: 120, 
            height: 120, 
            borderRadius: '50%', 
            bgcolor: '#e1f5fe', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <PublishIcon sx={{ fontSize: 60, color: '#0288d1' }} />
          </Box>
          <Typography variant="h5" gutterBottom>
            No pets released yet
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
            Release pets from the "Ready for Release" section to make them available to the public.
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => setActiveTab(1)}
            startIcon={<CheckCircleIcon />}
          >
            Prepare Pets for Release
          </Button>
        </Box>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <Grid container spacing={2}>
              {releasedPets.map(item => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                  <PetCard 
                    item={item}
                    isSelected={selectedReleasedIds.includes(item._id)}
                    onSelect={(id) => {
                      setSelectedIds(prev => 
                        prev.includes(id) 
                          ? prev.filter(i => i !== id) 
                          : [...prev, id]
                      );
                    }}
                    onAction={(action, data) => {
                      switch(action) {
                        case 'edit': handleEditPet(data); break;
                        case 'view': console.log('View details'); break;
                        case 'history': navigate(`/manager/petshop/pets/${data._id}/history`); break;
                        case 'delete': handleDeletePet(data); break;
                        default: break;
                      }
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedReleasedIds.length > 0 && selectedReleasedIds.length < releasedPets.length}
                        checked={releasedPets.length > 0 && selectedReleasedIds.length === releasedPets.length}
                        onChange={handleSelectAllReleased}
                      />
                    </TableCell>
                    <TableCell>Pet Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Species/Breed</TableCell>
                    <TableCell>Age/Gender</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {releasedPets.map(item => (
                    <TableRow 
                      key={item._id}
                      selected={selectedReleasedIds.includes(item._id)}
                      sx={{ 
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                        backgroundColor: selectedReleasedIds.includes(item._id) ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedReleasedIds.includes(item._id)}
                          onChange={(e) => {
                            setSelectedIds(prev => 
                              e.target.checked 
                                ? [...new Set([...prev, item._id])] 
                                : prev.filter(id => id !== item._id)
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={item.petCode || `PET-${item._id.slice(-6)}`} 
                          size="small" 
                          color="primary" 
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.name || 'Unnamed Pet'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {item.speciesId?.displayName || item.speciesId?.name || 'Unknown Species'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.breedId?.name || 'Unknown Breed'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {item.age} {item.ageUnit} • {item.gender}
                          </Typography>
                          {item.ageGroup && (
                            <Typography variant="caption" color="textSecondary">
                              {item.ageGroup}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color={item.price > 0 ? 'text.primary' : 'text.secondary'}
                        >
                          ₹{Number(item.price || 0).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Chip 
                            label={item.status?.replace('_', ' ') || 'in stock'} 
                            size="small" 
                            color={item.status === 'available_for_sale' ? 'success' : 'default'}
                          />
                          {item.images && item.images.length > 0 && (
                            <Chip 
                              label={`${item.images.length} image${item.images.length > 1 ? 's' : ''}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Purchase Pet">
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => navigate(`/manager/petshop/purchase/${item._id}`)}
                            >
                              <ShoppingCartIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Edit Pet Details">
                            <IconButton size="small" onClick={() => handleEditPet(item)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="View Pet History">
                            <IconButton 
                              size="small" 
                              color="info"
                              onClick={() => navigate(`/manager/petshop/pets/${item._id}/history`)}
                            >
                              <HistoryIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Delete Pet">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeletePet(item._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {pagination.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination 
                count={pagination.pages} 
                page={pagination.current} 
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </>
  );

  // Render Purchased Pets Tab
  const renderPurchasedPetsTab = () => (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Purchased Pets
          </Typography>
          <Typography variant="body2" color="textSecondary">
            These pets have been purchased by customers
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleSelectAllPurchased}
            startIcon={selectedPurchasedIds.length === purchasedPets.length && purchasedPets.length > 0 ? <CloseIcon /> : <CheckIcon />}
          >
            {selectedPurchasedIds.length === purchasedPets.length && purchasedPets.length > 0 ? 'Deselect All' : 'Select All'}
          </Button>
        </Box>
      </Box>
      
      {purchasedPets.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Box sx={{ 
            width: 120, 
            height: 120, 
            borderRadius: '50%', 
            bgcolor: '#f3e5f5', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <ShoppingCartIcon sx={{ fontSize: 60, color: '#7b1fa2' }} />
          </Box>
          <Typography variant="h5" gutterBottom>
            No pets purchased yet
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
            Pets will appear here after customers complete their purchases.
          </Typography>
        </Box>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <Grid container spacing={2}>
              {purchasedPets.map(item => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                  <PetCard 
                    item={item}
                    isSelected={selectedPurchasedIds.includes(item._id)}
                    onSelect={(id) => {
                      setSelectedIds(prev => 
                        prev.includes(id) 
                          ? prev.filter(i => i !== id) 
                          : [...prev, id]
                      );
                    }}
                    onAction={(action, data) => {
                      switch(action) {
                        case 'edit': handleEditPet(data); break;
                        case 'view': console.log('View details'); break;
                        case 'history': navigate(`/manager/petshop/pets/${data._id}/history`); break;
                        case 'delete': handleDeletePet(data); break;
                        default: break;
                      }
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedPurchasedIds.length > 0 && selectedPurchasedIds.length < purchasedPets.length}
                        checked={purchasedPets.length > 0 && selectedPurchasedIds.length === purchasedPets.length}
                        onChange={handleSelectAllPurchased}
                      />
                    </TableCell>
                    <TableCell>Pet Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Species/Breed</TableCell>
                    <TableCell>Age/Gender</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchasedPets.map(item => (
                    <TableRow 
                      key={item._id}
                      selected={selectedPurchasedIds.includes(item._id)}
                      sx={{ 
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                        backgroundColor: selectedPurchasedIds.includes(item._id) ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedPurchasedIds.includes(item._id)}
                          onChange={(e) => {
                            setSelectedIds(prev => 
                              e.target.checked 
                                ? [...new Set([...prev, item._id])] 
                                : prev.filter(id => id !== item._id)
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={item.petCode || `PET-${item._id.slice(-6)}`} 
                          size="small" 
                          color="primary" 
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.name || 'Unnamed Pet'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {item.speciesId?.displayName || item.speciesId?.name || 'Unknown Species'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.breedId?.name || 'Unknown Breed'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {item.age} {item.ageUnit} • {item.gender}
                          </Typography>
                          {item.ageGroup && (
                            <Typography variant="caption" color="textSecondary">
                              {item.ageGroup}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color={item.price > 0 ? 'text.primary' : 'text.secondary'}
                        >
                          ₹{Number(item.price || 0).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Chip 
                            label={item.status?.replace('_', ' ') || 'in stock'} 
                            size="small" 
                            color={item.status === 'sold' ? 'secondary' : 'default'}
                          />
                          {item.images && item.images.length > 0 && (
                            <Chip 
                              label={`${item.images.length} image${item.images.length > 1 ? 's' : ''}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Purchase Pet">
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => navigate(`/manager/petshop/purchase/${item._id}`)}
                            >
                              <ShoppingCartIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Edit Pet Details">
                            <IconButton size="small" onClick={() => handleEditPet(item)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="View Pet History">
                            <IconButton 
                              size="small" 
                              color="info"
                              onClick={() => navigate(`/manager/petshop/pets/${item._id}/history`)}
                            >
                              <HistoryIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Delete Pet">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeletePet(item._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {pagination.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination 
                count={pagination.pages} 
                page={pagination.current} 
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </>
  );

  return (
    <>
      {activeTab === 0 && renderPendingImagesTab()}
      {activeTab === 1 && renderReadyForReleaseTab()}
      {activeTab === 2 && renderReleasedPetsTab()}
      {activeTab === 3 && renderPurchasedPetsTab()}
    </>
  );
};

export default TabContent;