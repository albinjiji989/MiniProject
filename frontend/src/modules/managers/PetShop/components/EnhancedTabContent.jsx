import React from 'react'
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
  Tooltip,
  IconButton, 
  Pagination,
  Card,
  CardContent,
  Avatar,
  Divider
} from '@mui/material'
import PetAgeDisplay from './PetAgeDisplay'
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
  Close as CloseIcon,
  Info as InfoIcon,
  Pets as PetsIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { resolveMediaUrl } from '../../../../services/api'

const EnhancedTabContent = ({ 
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
  const navigate = useNavigate()

  // Helper function to build proper image URLs
  const buildImageUrl = (url) => {
    if (!url) return null
    return resolveMediaUrl(url)
  }

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'available_for_sale': return 'success'
      case 'sold': return 'secondary'
      case 'in_petshop': return 'primary'
      case 'reserved': return 'warning'
      case 'out_of_stock': return 'error'
      default: return 'default'
    }
  }

  // Helper function to format price
  const formatPrice = (price) => {
    return `₹${Number(price || 0).toLocaleString()}`
  }

  // Helper function to get pet image
  const getPetImage = (pet) => {
    if (pet.images && pet.images.length > 0) {
      // Try to get the primary image first
      const primaryImage = pet.images.find(img => img.isPrimary);
      if (primaryImage && primaryImage.url) {
        return buildImageUrl(primaryImage.url);
      }
      // Fallback to first image
      if (pet.images[0].url) {
        return buildImageUrl(pet.images[0].url);
      }
    }
    return null;
  }

  // Enhanced Pet Card Component
  const EnhancedPetCard = ({ pet, isSelected, onSelect, onAction, tabType, isPending = false }) => (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
        boxShadow: isSelected ? 4 : 1,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-4px)'
        }
      }}
    >
      {/* Pet Image */}
      <Box sx={{ position: 'relative', height: 160, bgcolor: '#f5f5f5' }}>
        {getPetImage(pet) ? (
          <img 
            src={getPetImage(pet)} 
            alt={pet.name || pet.petCode}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : (
          <Box 
            sx={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: '#eeeeee'
            }}
          >
            <AddPhotoAlternateIcon sx={{ fontSize: 48, color: '#9e9e9e' }} />
          </Box>
        )}
        
        {/* Status Badge */}
        <Chip 
          label={pet.status?.replace('_', ' ') || 'in stock'} 
          size="small" 
          color={getStatusColor(pet.status)}
          sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8,
            fontWeight: 'bold'
          }}
        />
        
        {/* Selection Checkbox */}
        <Checkbox
          checked={isSelected}
          onChange={() => onSelect(pet._id)}
          sx={{ 
            position: 'absolute', 
            top: 8, 
            left: 8,
            bgcolor: 'white',
            borderRadius: '50%',
            '& .MuiSvgIcon-root': { fontSize: 20 }
          }}
        />
        
        {/* Pending Image Badge */}
        {isPending && (
          <Chip 
            icon={<PendingIcon />}
            label="Needs Images"
            color="warning"
            size="small"
            sx={{ 
              position: 'absolute', 
              bottom: 8, 
              left: 8,
              fontWeight: 'bold'
            }}
          />
        )}
        
        {/* Image Count Badge */}
        {pet.images && pet.images.length > 0 && (
          <Chip 
            label={`${pet.images.length} image${pet.images.length > 1 ? 's' : ''}`}
            size="small"
            sx={{ 
              position: 'absolute', 
              bottom: 8, 
              right: 8,
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        )}
      </Box>
      
      {/* Pet Details */}
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold" noWrap>
            {pet.name || 'Unnamed Pet'}
          </Typography>
          <Chip 
            label={pet.petCode || `PET-${pet._id?.slice(-6)}`} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
        </Box>
        
        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" color="textSecondary" noWrap>
            {pet.speciesId?.displayName || pet.speciesId?.name || 'Unknown Species'} • {pet.breedId?.name || 'Unknown Breed'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {pet.age} {pet.ageUnit} • {pet.gender}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" color="primary" fontWeight="bold">
            {formatPrice(pet.price)}
          </Typography>
          {pet.ageGroup && (
            <Chip 
              label={pet.ageGroup} 
              size="small" 
              color="info" 
              variant="outlined"
            />
          )}
        </Box>
        
        {pet.notes && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="textSecondary" noWrap>
              {pet.notes}
            </Typography>
          </Box>
        )}
      </CardContent>
      
      {/* Action Buttons */}
      <CardActions sx={{ pt: 0, px: 1, pb: 1 }}>
        {tabType === 'pending' && (
          <>
            <Tooltip title="Edit Pet Details">
              <IconButton size="small" onClick={() => onAction('edit', pet)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Add Image">
              <IconButton 
                size="small" 
                color="secondary" 
                onClick={() => onAction('upload', pet)}
              >
                <AddPhotoAlternateIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Pet History">
              <IconButton 
                size="small" 
                color="info"
                onClick={() => onAction('history', pet)}
              >
                <HistoryIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove from Sale">
              <IconButton 
                size="small" 
                color="error"
                onClick={() => onAction('delete', pet._id)}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
        
        {tabType === 'ready' && (
          <>
            <Tooltip title="Edit Pet Details">
              <IconButton size="small" onClick={() => onAction('edit', pet)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Details">
              <IconButton 
                size="small"
                onClick={() => navigate(`/manager/petshop/pets/${pet._id}/history`)}
              >
                <ViewIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Pet History">
              <IconButton 
                size="small" 
                color="info"
                onClick={() => onAction('history', pet)}
              >
                <HistoryIcon />
              </IconButton>
            </Tooltip>
            {pet.status !== 'available_for_sale' && (
              <Tooltip title="Release to Public">
                <IconButton 
                  size="small" 
                  color="primary"
                  onClick={() => onAction('release', [pet._id])}
                >
                  <PublishIcon />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Remove from Sale">
              <IconButton 
                size="small" 
                color="error"
                onClick={() => onAction('delete', pet._id)}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
        
        {tabType === 'released' && (
          <>
            <Tooltip title="Purchase Pet">
              <IconButton 
                size="small" 
                color="success"
                onClick={() => navigate(`/manager/petshop/purchase/${pet._id}`)}
                sx={{ 
                  bgcolor: '#f1f8e9',
                  '&:hover': { bgcolor: '#dcedc8' }
                }}
              >
                <ShoppingCartIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Pet Details">
              <IconButton 
                size="small" 
                onClick={() => handleEditPet(pet)}
                sx={{ 
                  bgcolor: '#e3f2fd',
                  '&:hover': { bgcolor: '#bbdefb' }
                }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Details">
              <IconButton 
                size="small"
                onClick={() => navigate(`/manager/petshop/pets/${pet._id}/history`)}
                sx={{ 
                  bgcolor: '#e8f5e9',
                  '&:hover': { bgcolor: '#c8e6c9' }
                }}
              >
                <ViewIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Pet History">
              <IconButton 
                size="small" 
                color="info"
                onClick={() => navigate(`/manager/petshop/pets/${pet._id}/history`)}
                sx={{ 
                  bgcolor: '#e1f5fe',
                  '&:hover': { bgcolor: '#b3e5fc' }
                }}
              >
                <HistoryIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove from Sale">
              <IconButton 
                size="small" 
                color="error"
                onClick={() => handleDeletePet(pet._id)}
                sx={{ 
                  bgcolor: '#ffebee',
                  '&:hover': { bgcolor: '#ffcdd2' }
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
        
        {tabType === 'purchased' && (
          <>
            <Tooltip title="View Details">
              <IconButton 
                size="small"
                onClick={() => navigate(`/manager/petshop/pets/${pet._id}/history`)}
              >
                <ViewIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Pet Details">
              <IconButton size="small" onClick={() => onAction('edit', pet)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Pet History">
              <IconButton 
                size="small" 
                color="info"
                onClick={() => onAction('history', pet)}
              >
                <HistoryIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove from Sale">
              <IconButton 
                size="small" 
                color="error"
                onClick={() => onAction('delete', pet._id)}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
      </CardActions>
    </Card>
  )

  // Table View Component
  const TableView = ({ pets, selectedIds, handleSelectAll, tabType, isPending = false }) => (
    <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f7fa' }}>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={selectedIds.length > 0 && selectedIds.length < pets.length}
                checked={pets.length > 0 && selectedIds.length === pets.length}
                onChange={handleSelectAll}
                sx={{ color: '#1976d2' }}
              />
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Pet Code</TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Image</TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Species/Breed</TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Age/Gender</TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Price</TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pets.map(pet => (
            <TableRow 
              key={pet._id}
              selected={selectedIds.includes(pet._id)}
              sx={{ 
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                backgroundColor: selectedIds.includes(pet._id) ? 'rgba(25, 118, 210, 0.08)' : 'inherit',
                '&:nth-of-type(odd)': {
                  backgroundColor: selectedIds.includes(pet._id) ? 'rgba(25, 118, 210, 0.08)' : 'rgba(0, 0, 0, 0.02)'
                }
              }}
            >
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedIds.includes(pet._id)}
                  onChange={(e) => {
                    setSelectedIds(prev => 
                      e.target.checked 
                        ? [...new Set([...prev, pet._id])] 
                        : prev.filter(id => id !== pet._id)
                    )
                  }}
                  sx={{ color: '#1976d2' }}
                />
              </TableCell>
              <TableCell>
                <Chip 
                  label={pet.petCode || `PET-${pet._id.slice(-6)}`} 
                  size="small" 
                  color="primary" 
                  sx={{ fontWeight: 'bold' }}
                />
              </TableCell>
              <TableCell>
                {getPetImage(pet) ? (
                  <Avatar 
                    src={getPetImage(pet)} 
                    sx={{ width: 40, height: 40, boxShadow: 1 }}
                    onError={(e) => {
                      e.target.src = ''
                      e.target.style.display = 'none'
                    }}
                  />
                ) : (
                  <Avatar sx={{ width: 40, height: 40, bgcolor: '#e0e0e0', boxShadow: 1 }}>
                    <AddPhotoAlternateIcon sx={{ fontSize: 20, color: '#9e9e9e' }} />
                  </Avatar>
                )}
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight="bold" color="#1976d2">
                  {pet.name || 'Unnamed Pet'}
                </Typography>
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {pet.speciesId?.displayName || pet.speciesId?.name || 'Unknown Species'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {pet.breedId?.name || 'Unknown Breed'}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2">
                    <PetAgeDisplay petCode={pet.petCode} initialAge={pet.age} initialAgeUnit={pet.ageUnit} /> • {pet.gender}
                  </Typography>
                  {pet.ageGroup && (
                    <Chip 
                      label={pet.ageGroup}
                      size="small"
                      color="info"
                      variant="outlined"
                      sx={{ mt: 0.5 }}
                    />
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Typography 
                  variant="body2" 
                  color={pet.price > 0 ? 'text.primary' : 'text.secondary'}
                  fontWeight="bold"
                  sx={{ fontSize: '1.1rem' }}
                >
                  {formatPrice(pet.price)}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  <Chip 
                    label={pet.status?.replace('_', ' ') || 'in stock'} 
                    size="small" 
                    color={getStatusColor(pet.status)}
                    sx={{ fontWeight: 'bold' }}
                  />
                  {pet.images && pet.images.length > 0 && (
                    <Chip 
                      label={`${pet.images.length} image${pet.images.length > 1 ? 's' : ''}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 'bold' }}
                    />
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {tabType === 'pending' && (
                    <>
                      <Tooltip title="Edit Pet Details">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditPet(pet)}
                          sx={{ 
                            bgcolor: '#e3f2fd',
                            '&:hover': { bgcolor: '#bbdefb' }
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Add Image">
                        <IconButton 
                          size="small" 
                          color="secondary" 
                          onClick={() => handleOpenImageDialog(pet)}
                          sx={{ 
                            bgcolor: '#fff3e0',
                            '&:hover': { bgcolor: '#ffe0b2' }
                          }}
                        >
                          <AddPhotoAlternateIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Pet History">
                        <IconButton 
                          size="small" 
                          color="info"
                          onClick={() => navigate(`/manager/petshop/pets/${pet._id}/history`)}
                          sx={{ 
                            bgcolor: '#e1f5fe',
                            '&:hover': { bgcolor: '#b3e5fc' }
                          }}
                        >
                          <HistoryIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove from Sale">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeletePet(pet._id)}
                          sx={{ 
                            bgcolor: '#ffebee',
                            '&:hover': { bgcolor: '#ffcdd2' }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  
                  {tabType === 'ready' && (
                    <>
                      <Tooltip title="Edit Pet Details">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditPet(pet)}
                          sx={{ 
                            bgcolor: '#e3f2fd',
                            '&:hover': { bgcolor: '#bbdefb' }
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small"
                          onClick={() => navigate(`/manager/petshop/pets/${pet._id}/history`)}
                          sx={{ 
                            bgcolor: '#e8f5e9',
                            '&:hover': { bgcolor: '#c8e6c9' }
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Pet History">
                        <IconButton 
                          size="small" 
                          color="info"
                          onClick={() => navigate(`/manager/petshop/pets/${pet._id}/history`)}
                          sx={{ 
                            bgcolor: '#e1f5fe',
                            '&:hover': { bgcolor: '#b3e5fc' }
                          }}
                        >
                          <HistoryIcon />
                        </IconButton>
                      </Tooltip>
                      {pet.status !== 'available_for_sale' && (
                        <Tooltip title="Release to Public">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleReleaseToPublic([pet._id])}
                            sx={{ 
                              bgcolor: '#e8f5e9',
                              '&:hover': { bgcolor: '#c8e6c9' }
                            }}
                          >
                            <PublishIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Remove from Sale">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeletePet(pet._id)}
                          sx={{ 
                            bgcolor: '#ffebee',
                            '&:hover': { bgcolor: '#ffcdd2' }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  
                  {tabType === 'released' && (
                    <>
                      <Tooltip title="Purchase Pet">
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => navigate(`/manager/petshop/purchase/${pet._id}`)}
                          sx={{ 
                            bgcolor: '#f1f8e9',
                            '&:hover': { bgcolor: '#dcedc8' }
                          }}
                        >
                          <ShoppingCartIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Pet Details">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditPet(pet)}
                          sx={{ 
                            bgcolor: '#e3f2fd',
                            '&:hover': { bgcolor: '#bbdefb' }
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small"
                          onClick={() => navigate(`/manager/petshop/pets/${pet._id}/history`)}
                          sx={{ 
                            bgcolor: '#e8f5e9',
                            '&:hover': { bgcolor: '#c8e6c9' }
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Pet History">
                        <IconButton 
                          size="small" 
                          color="info"
                          onClick={() => navigate(`/manager/petshop/pets/${pet._id}/history`)}
                          sx={{ 
                            bgcolor: '#e1f5fe',
                            '&:hover': { bgcolor: '#b3e5fc' }
                          }}
                        >
                          <HistoryIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove from Sale">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeletePet(pet._id)}
                          sx={{ 
                            bgcolor: '#ffebee',
                            '&:hover': { bgcolor: '#ffcdd2' }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  
                  {tabType === 'purchased' && (
                    <>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small"
                          onClick={() => navigate(`/manager/petshop/pets/${pet._id}/history`)}
                          sx={{ 
                            bgcolor: '#e8f5e9',
                            '&:hover': { bgcolor: '#c8e6c9' }
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Pet Details">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditPet(pet)}
                          sx={{ 
                            bgcolor: '#e3f2fd',
                            '&:hover': { bgcolor: '#bbdefb' }
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Pet History">
                        <IconButton 
                          size="small" 
                          color="info"
                          onClick={() => navigate(`/manager/petshop/pets/${pet._id}/history`)}
                          sx={{ 
                            bgcolor: '#e1f5fe',
                            '&:hover': { bgcolor: '#b3e5fc' }
                          }}
                        >
                          <HistoryIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove from Sale">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeletePet(pet._id)}
                          sx={{ 
                            bgcolor: '#ffebee',
                            '&:hover': { bgcolor: '#ffcdd2' }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )

  // Empty State Component
  const EmptyState = ({ title, description, icon, actionText, onAction, showAction = true }) => (
    <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
      <Box sx={{ 
        width: 120, 
        height: 120, 
        borderRadius: '50%', 
        bgcolor: '#f5f5f5', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        margin: '0 auto 24px',
        boxShadow: 2
      }}>
        {icon}
      </Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
        {title}
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto', fontSize: '1.1rem' }}>
        {description}
      </Typography>
      {showAction && (
        <Button 
          variant="contained" 
          onClick={onAction}
          startIcon={<InfoIcon />}
          sx={{
            bgcolor: '#1976d2',
            '&:hover': {
              bgcolor: '#1565c0'
            },
            px: 3,
            py: 1.5,
            fontSize: '1rem'
          }}
        >
          {actionText}
        </Button>
      )}
    </Box>
  )

  // Pending Images Tab
  const renderPendingImagesTab = () => (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#f57c00' }}>
            Pets Pending Images
          </Typography>
          <Typography variant="body1" color="textSecondary">
            These pets need images before they can be released to users
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleSelectAllPending}
            startIcon={selectedIds.length === inventory.length && inventory.length > 0 ? <CloseIcon /> : <CheckIcon />}
            sx={{
              borderColor: '#f57c00',
              color: '#f57c00',
              '&:hover': {
                bgcolor: 'rgba(245, 124, 0, 0.04)',
                borderColor: '#e65100'
              }
            }}
          >
            {selectedIds.length === inventory.length && inventory.length > 0 ? 'Deselect All' : 'Select All'}
          </Button>
          <Button
            variant="contained"
            disabled={selectedIds.length === 0}
            onClick={() => {
              const firstSelected = inventory.find(item => selectedIds.includes(item._id))
              if (firstSelected) {
                handleOpenImageDialog(firstSelected)
              }
            }}
            startIcon={<CloudUploadIcon />}
            sx={{
              bgcolor: '#f57c00',
              '&:hover': {
                bgcolor: '#e65100'
              }
            }}
          >
            Upload Images ({selectedIds.length})
          </Button>
        </Box>
      </Box>
      
      {inventory.length === 0 ? (
        <EmptyState 
          title="No pets pending images"
          description="All pets have images and are ready for release, or there are no pets in inventory."
          icon={<AddPhotoAlternateIcon sx={{ fontSize: 60, color: '#1976d2' }} />}
          actionText="View Ready Pets"
          onAction={() => setActiveTab(1)}
        />
      ) : (
        <>
          {viewMode === 'grid' ? (
            <Grid container spacing={2}>
              {inventory.map(item => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                  <EnhancedPetCard 
                    pet={item}
                    isSelected={selectedIds.includes(item._id)}
                    onSelect={(id) => {
                      setSelectedIds(prev => 
                        prev.includes(id) 
                          ? prev.filter(i => i !== id) 
                          : [...prev, id]
                      )
                    }}
                    onAction={(action, data) => {
                      switch(action) {
                        case 'edit': handleEditPet(data); break
                        case 'upload': handleOpenImageDialog(data); break
                        case 'history': navigate(`/manager/petshop/pets/${data._id}/history`); break
                        case 'delete': handleDeletePet(data); break
                        default: break
                      }
                    }}
                    isPending={true}
                    tabType="pending"
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <>
              <TableView 
                pets={inventory} 
                selectedIds={selectedIds} 
                handleSelectAll={handleSelectAllPending} 
                tabType="pending" 
                isPending={true} 
              />
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
      )}
    </>
  )

  // Ready for Release Tab
  const renderReadyForReleaseTab = () => (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, p: 2, bgcolor: '#e8f5e9', borderRadius: 2 }}>
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#388e3c' }}>
            Ready for Release
          </Typography>
          <Typography variant="body1" color="textSecondary">
            These pets have images and can be released to users
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleSelectAllReady}
            startIcon={selectedReadyIds.length === readyForRelease.length && readyForRelease.length > 0 ? <CloseIcon /> : <CheckIcon />}
            sx={{
              borderColor: '#388e3c',
              color: '#388e3c',
              '&:hover': {
                bgcolor: 'rgba(56, 142, 60, 0.04)',
                borderColor: '#1b5e20'
              }
            }}
          >
            {selectedReadyIds.length === readyForRelease.length && readyForRelease.length > 0 ? 'Deselect All' : 'Select All'}
          </Button>
          <Button
            variant="contained"
            disabled={selectedReadyIds.length === 0}
            onClick={() => handleReleaseToPublic(selectedReadyIds)}
            startIcon={<PublishIcon />}
            sx={{
              bgcolor: '#388e3c',
              '&:hover': {
                bgcolor: '#1b5e20'
              }
            }}
          >
            Release to Public ({selectedReadyIds.length})
          </Button>
        </Box>
      </Box>
      
      {readyForRelease.length === 0 ? (
        <EmptyState 
          title="No pets ready for release"
          description="There are no pets with images that are ready to be released to users."
          icon={<CheckCircleIcon sx={{ fontSize: 60, color: '#388e3c' }} />}
          actionText="Add New Stock"
          onAction={() => navigate('/manager/petshop/wizard/basic')}
        />
      ) : (
        <>
          {viewMode === 'grid' ? (
            <Grid container spacing={2}>
              {readyForRelease.map(item => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                  <EnhancedPetCard 
                    pet={item}
                    isSelected={selectedReadyIds.includes(item._id)}
                    onSelect={(id) => {
                      setSelectedReadyIds(prev => 
                        prev.includes(id) 
                          ? prev.filter(i => i !== id) 
                          : [...prev, id]
                      )
                    }}
                    onAction={(action, data) => {
                      switch(action) {
                        case 'edit': handleEditPet(data); break
                        case 'history': navigate(`/manager/petshop/pets/${data._id}/history`); break
                        case 'release': handleReleaseToPublic(data); break
                        case 'delete': handleDeletePet(data); break
                        default: break
                      }
                    }}
                    tabType="ready"
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <>
              <TableView 
                pets={readyForRelease} 
                selectedIds={selectedReadyIds} 
                handleSelectAll={handleSelectAllReady} 
                tabType="ready" 
              />
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
      )}
    </>
  )

  // Released Pets Tab
  const renderReleasedPetsTab = () => (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, p: 2, bgcolor: '#e1f5fe', borderRadius: 2 }}>
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#0288d1' }}>
            Released Pets
          </Typography>
          <Typography variant="body1" color="textSecondary">
            These pets are available for users to view and purchase
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleSelectAllReleased}
            startIcon={selectedReleasedIds.length === releasedPets.length && releasedPets.length > 0 ? <CloseIcon /> : <CheckIcon />}
            sx={{
              borderColor: '#0288d1',
              color: '#0288d1',
              '&:hover': {
                bgcolor: 'rgba(2, 136, 209, 0.04)',
                borderColor: '#01579b'
              }
            }}
          >
            {selectedReleasedIds.length === releasedPets.length && releasedPets.length > 0 ? 'Deselect All' : 'Select All'}
          </Button>
        </Box>
      </Box>
      
      {releasedPets.length === 0 ? (
        <EmptyState 
          title="No pets released"
          description="There are no pets currently released to users."
          icon={<PetsIcon sx={{ fontSize: 60, color: '#0288d1' }} />}
          actionText="Release Pets"
          onAction={() => setActiveTab(1)}
          showAction={readyForRelease.length > 0}
        />
      ) : (
        <>
          {viewMode === 'grid' ? (
            <Grid container spacing={2}>
              {releasedPets.map(item => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                  <EnhancedPetCard 
                    pet={item}
                    isSelected={selectedReleasedIds.includes(item._id)}
                    onSelect={(id) => {
                      setSelectedReleasedIds(prev => 
                        prev.includes(id) 
                          ? prev.filter(i => i !== id) 
                          : [...prev, id]
                      )
                    }}
                    onAction={(action, data) => {
                      switch(action) {
                        case 'edit': handleEditPet(data); break
                        case 'history': navigate(`/manager/petshop/pets/${data._id}/history`); break
                        case 'delete': handleDeletePet(data); break
                        default: break
                      }
                    }}
                    tabType="released"
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <>
              <TableView 
                pets={releasedPets} 
                selectedIds={selectedReleasedIds} 
                handleSelectAll={handleSelectAllReleased} 
                tabType="released" 
              />
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
      )}
    </>
  )

  // Purchased Pets Tab
  const renderPurchasedPetsTab = () => (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, p: 2, bgcolor: '#fce4ec', borderRadius: 2 }}>
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#c2185b' }}>
            Purchased Pets
          </Typography>
          <Typography variant="body1" color="textSecondary">
            These pets have been purchased by users
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleSelectAllPurchased}
            startIcon={selectedPurchasedIds.length === purchasedPets.length && purchasedPets.length > 0 ? <CloseIcon /> : <CheckIcon />}
            sx={{
              borderColor: '#c2185b',
              color: '#c2185b',
              '&:hover': {
                bgcolor: 'rgba(194, 24, 91, 0.04)',
                borderColor: '#880e4f'
              }
            }}
          >
            {selectedPurchasedIds.length === purchasedPets.length && purchasedPets.length > 0 ? 'Deselect All' : 'Select All'}
          </Button>
        </Box>
      </Box>
      
      {purchasedPets.length === 0 ? (
        <EmptyState 
          title="No pets purchased"
          description="There are no pets that have been purchased by users."
          icon={<ShoppingCartIcon sx={{ fontSize: 60, color: '#c2185b' }} />}
          actionText="View Released Pets"
          onAction={() => setActiveTab(2)}
          showAction={releasedPets.length > 0}
        />
      ) : (
        <>
          {viewMode === 'grid' ? (
            <Grid container spacing={2}>
              {purchasedPets.map(item => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                  <EnhancedPetCard 
                    pet={item}
                    isSelected={selectedPurchasedIds.includes(item._id)}
                    onSelect={(id) => {
                      setSelectedPurchasedIds(prev => 
                        prev.includes(id) 
                          ? prev.filter(i => i !== id) 
                          : [...prev, id]
                      )
                    }}
                    onAction={(action, data) => {
                      switch(action) {
                        case 'edit': handleEditPet(data); break
                        case 'history': navigate(`/manager/petshop/pets/${data._id}/history`); break
                        case 'delete': handleDeletePet(data); break
                        default: break
                      }
                    }}
                    tabType="purchased"
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <>
              <TableView 
                pets={purchasedPets} 
                selectedIds={selectedPurchasedIds} 
                handleSelectAll={handleSelectAllPurchased} 
                tabType="purchased" 
              />
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
      )}
    </>
  )

  return (
    <>
      {activeTab === 0 && renderPendingImagesTab()}
      {activeTab === 1 && renderReadyForReleaseTab()}
      {activeTab === 2 && renderReleasedPetsTab()}
      {activeTab === 3 && renderPurchasedPetsTab()}
    </>
  )
}

export default EnhancedTabContent