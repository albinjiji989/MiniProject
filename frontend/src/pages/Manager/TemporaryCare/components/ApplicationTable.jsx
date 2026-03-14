import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  Typography,
  Box,
  Stack,
  IconButton,
  Tooltip,
  TablePagination,
  Collapse,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Pets as PetsIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { resolveMediaUrl } from '../../../../services/api';
import ActionButtons from './ActionButtons';

const ApplicationTable = ({ applications, onAction, loading }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const toggleRowExpansion = (appId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(appId)) {
      newExpanded.delete(appId);
    } else {
      newExpanded.add(appId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      submitted: { label: 'New', color: 'warning', bgColor: '#FFF3E0' },
      price_determined: { label: 'Priced', color: 'info', bgColor: '#E3F2FD' },
      advance_paid: { label: 'Paid', color: 'primary', bgColor: '#F3E5F5' },
      active_care: { label: 'In Care', color: 'success', bgColor: '#E8F5E8' },
      completed: { label: 'Done', color: 'success', bgColor: '#E8F5E8' },
      rejected: { label: 'Rejected', color: 'error', bgColor: '#FFEBEE' }
    };
    return statusMap[status] || statusMap.submitted;
  };

  const getPetImage = (pet) => {
    const petData = pet.petDetails || {};
    if (petData.profileImage) return resolveMediaUrl(petData.profileImage);
    if (petData.images && petData.images.length > 0) {
      return resolveMediaUrl(petData.images[0].url || petData.images[0]);
    }
    if (petData.image) return resolveMediaUrl(petData.image);
    return null;
  };

  const paginatedApplications = applications.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <TableContainer>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell width={50}></TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="600">
                  Application
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="600">
                  Owner
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="600">
                  Pets
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="600">
                  Duration
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="600">
                  Status
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="600">
                  Amount
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2" fontWeight="600">
                  Actions
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedApplications.map((app) => {
              const statusInfo = getStatusInfo(app.status);
              const isExpanded = expandedRows.has(app._id);
              
              return (
                <React.Fragment key={app._id}>
                  <TableRow 
                    hover 
                    sx={{ 
                      '&:hover': { bgcolor: 'grey.50' },
                      cursor: 'pointer'
                    }}
                  >
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => toggleRowExpansion(app._id)}
                      >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="600">
                          {app.applicationNumber || `APP-${app._id?.slice(-6)}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {app.userId?.name?.[0] || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="500">
                            {app.userId?.name || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {app.userId?.phone || app.userId?.email || 'No contact'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Stack direction="row" spacing={-1}>
                        {app.pets?.slice(0, 3).map((pet, index) => {
                          const petImage = getPetImage(pet);
                          const petData = pet.petDetails || {};
                          return (
                            <Tooltip key={index} title={petData.name || `Pet ${index + 1}`}>
                              <Avatar
                                src={petImage}
                                sx={{ 
                                  width: 28, 
                                  height: 28,
                                  border: '2px solid white',
                                  zIndex: 3 - index
                                }}
                              >
                                <PetsIcon fontSize="small" />
                              </Avatar>
                            </Tooltip>
                          );
                        })}
                        {app.pets?.length > 3 && (
                          <Avatar sx={{ 
                            width: 28, 
                            height: 28, 
                            bgcolor: 'grey.300',
                            fontSize: '12px',
                            fontWeight: 600
                          }}>
                            +{app.pets.length - 3}
                          </Avatar>
                        )}
                      </Stack>
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="600" color="primary">
                          {app.numberOfDays} days
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(app.startDate).toLocaleDateString()} - {new Date(app.endDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={statusInfo.label}
                        color={statusInfo.color}
                        size="small"
                        sx={{ 
                          fontWeight: 600,
                          minWidth: 70
                        }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      {app.pricing?.totalAmount ? (
                        <Box>
                          <Typography variant="body2" fontWeight="600">
                            ₹{app.pricing.totalAmount.toLocaleString()}
                          </Typography>
                          {app.paymentStatus?.advance?.status === 'completed' && (
                            <Chip label="Paid" size="small" color="success" sx={{ mt: 0.5 }} />
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Not set
                        </Typography>
                      )}
                    </TableCell>
                    
                    <TableCell align="right">
                      <ActionButtons 
                        application={app} 
                        onAction={onAction} 
                        compact={true}
                      />
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded Row Content */}
                  <TableRow>
                    <TableCell colSpan={8} sx={{ p: 0, border: 'none' }}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Card sx={{ borderRadius: 2 }}>
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                Application Details
                              </Typography>
                              
                              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                                {/* Pet Details */}
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle2" color="primary" gutterBottom>
                                    Pet Information
                                  </Typography>
                                  <Stack spacing={1}>
                                    {app.pets?.map((pet, index) => {
                                      const petData = pet.petDetails || {};
                                      const petImage = getPetImage(pet);
                                      return (
                                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                          <Avatar src={petImage} sx={{ width: 40, height: 40 }}>
                                            <PetsIcon />
                                          </Avatar>
                                          <Box>
                                            <Typography variant="body2" fontWeight="500">
                                              {petData.name || `Pet ${index + 1}`}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                              {petData.speciesId?.name || petData.species || 'Unknown'} • {petData.breed || petData.breedId?.name || 'Unknown breed'}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      );
                                    })}
                                  </Stack>
                                </Box>
                                
                                {/* Special Instructions */}
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle2" color="primary" gutterBottom>
                                    Special Instructions
                                  </Typography>
                                  {app.pets?.some(pet => pet.specialInstructions && 
                                    (pet.specialInstructions.food || pet.specialInstructions.medicine || 
                                     pet.specialInstructions.allergies || pet.specialInstructions.behavior)) ? (
                                    <Stack spacing={1}>
                                      {app.pets.map((pet, index) => {
                                        const instructions = pet.specialInstructions;
                                        if (!instructions) return null;
                                        
                                        return (
                                          <Box key={index}>
                                            {instructions.food && (
                                              <Typography variant="caption" display="block">
                                                🍽️ Food: {instructions.food}
                                              </Typography>
                                            )}
                                            {instructions.medicine && (
                                              <Typography variant="caption" display="block" color="warning.main">
                                                💊 Medicine: {instructions.medicine}
                                              </Typography>
                                            )}
                                            {instructions.allergies && (
                                              <Typography variant="caption" display="block" color="error.main">
                                                ⚠️ Allergies: {instructions.allergies}
                                              </Typography>
                                            )}
                                          </Box>
                                        );
                                      })}
                                    </Stack>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                      No special instructions
                                    </Typography>
                                  )}
                                </Box>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={applications.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{ borderTop: 1, borderColor: 'divider' }}
      />
    </Paper>
  );
};

export default ApplicationTable;