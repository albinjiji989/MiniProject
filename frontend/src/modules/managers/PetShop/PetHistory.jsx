import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Paper,
  Chip,
  Avatar,
  Divider,
  Button,
  Alert,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Pets as PetIcon,
  Payment as PaymentIcon,
  LocalShipping as DeliveryIcon,
  Person as PersonIcon,
  MedicalServices as MedicalIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Receipt as ReceiptIcon,
  Home as HomeIcon,
  Store as StoreIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as ViewIcon
} from '@mui/icons-material'
import { apiClient } from '../../../services/api'

const PetHistory = () => {
  const { petId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState([])
  const [petDetails, setPetDetails] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPetHistory()
  }, [petId])

  const fetchPetHistory = async () => {
    try {
      setLoading(true)
      const [historyResponse, petResponse] = await Promise.all([
        apiClient.get(`/petshop/manager/pets/${petId}/history`),
        apiClient.get(`/petshop/inventory/${petId}`)
      ])
      
      setHistory(historyResponse.data.data.history || [])
      setPetDetails(petResponse.data.data.item || null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pet history')
    } finally {
      setLoading(false)
    }
  }

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'created': return <PetIcon />
      case 'reservation_made': return <ScheduleIcon />
      case 'reservation_approved': return <CheckIcon />
      case 'payment_initiated': return <PaymentIcon />
      case 'payment_completed': return <ReceiptIcon />
      case 'ownership_transferred': return <PersonIcon />
      case 'delivered': return <DeliveryIcon />
      case 'medical_checkup': return <MedicalIcon />
      case 'vaccination': return <MedicalIcon />
      case 'status_changed': return <EditIcon />
      case 'price_updated': return <EditIcon />
      case 'images_updated': return <EditIcon />
      case 'notes_added': return <EditIcon />
      default: return <PetIcon />
    }
  }

  const getEventColor = (eventType) => {
    switch (eventType) {
      case 'created': return 'primary'
      case 'reservation_made': return 'info'
      case 'reservation_approved': return 'success'
      case 'payment_initiated': return 'warning'
      case 'payment_completed': return 'success'
      case 'ownership_transferred': return 'success'
      case 'delivered': return 'success'
      case 'medical_checkup': return 'info'
      case 'vaccination': return 'success'
      case 'status_changed': return 'default'
      case 'price_updated': return 'warning'
      case 'images_updated': return 'info'
      case 'notes_added': return 'default'
      default: return 'default'
    }
  }

  const formatEventType = (eventType) => {
    return eventType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/manager/petshop/inventory')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          Pet History & Timeline
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Pet Details Summary */}
      {petDetails && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.light' }}>
                    <PetIcon sx={{ fontSize: 30 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {petDetails.name || 'Unnamed Pet'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Pet Code: {petDetails.petCode}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: <Chip label={petDetails.status} size="small" />
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                  <Typography variant="h6" color="primary">
                    ₹{petDetails.price?.toLocaleString() || 'Not set'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current Price
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon /> Event Timeline
          </Typography>

          {history.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No history events found for this pet
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {history.map((event, index) => (
                <Paper key={event._id} sx={{ p: 3, position: 'relative' }}>
                  {/* Event Icon and Status */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: `${getEventColor(event.eventType)}.main`,
                        width: 48,
                        height: 48
                      }}
                    >
                      {getEventIcon(event.eventType)}
                    </Avatar>
                    
                    <Box sx={{ flexGrow: 1 }}>
                      {/* Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {formatEventType(event.eventType)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(event.timestamp)}
                        </Typography>
                      </Box>
                      
                      {/* Description */}
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {event.eventDescription}
                      </Typography>

                      {/* Performed By */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          <PersonIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography variant="body2">
                          By: {event.performedBy?.name || 'System'} ({event.performedByRole})
                        </Typography>
                      </Box>

                      {/* Event Metadata */}
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="body2">View Details</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <List dense>
                              {event.metadata.paymentAmount && (
                                <ListItem>
                                  <ListItemIcon><PaymentIcon /></ListItemIcon>
                                  <ListItemText 
                                    primary="Payment Amount" 
                                    secondary={`₹${event.metadata.paymentAmount.toLocaleString()}`} 
                                  />
                                </ListItem>
                              )}
                              
                              {event.metadata.paymentMethod && (
                                <ListItem>
                                  <ListItemIcon><ReceiptIcon /></ListItemIcon>
                                  <ListItemText 
                                    primary="Payment Method" 
                                    secondary={event.metadata.paymentMethod} 
                                  />
                                </ListItem>
                              )}
                              
                              {event.metadata.deliveryMethod && (
                                <ListItem>
                                  <ListItemIcon>
                                    {event.metadata.deliveryMethod === 'delivery' ? <HomeIcon /> : <StoreIcon />}
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary="Delivery Method" 
                                    secondary={event.metadata.deliveryMethod === 'delivery' ? 'Home Delivery' : 'Store Pickup'} 
                                  />
                                </ListItem>
                              )}
                              
                              {event.metadata.deliveryAddress && (
                                <ListItem>
                                  <ListItemIcon><HomeIcon /></ListItemIcon>
                                  <ListItemText 
                                    primary="Delivery Address" 
                                    secondary={`${event.metadata.deliveryAddress.street}, ${event.metadata.deliveryAddress.city}, ${event.metadata.deliveryAddress.state} ${event.metadata.deliveryAddress.zipCode}`} 
                                  />
                                </ListItem>
                              )}
                              
                              {event.metadata.notes && (
                                <ListItem>
                                  <ListItemIcon><EditIcon /></ListItemIcon>
                                  <ListItemText 
                                    primary="Notes" 
                                    secondary={event.metadata.notes} 
                                  />
                                </ListItem>
                              )}
                            </List>
                          </AccordionDetails>
                        </Accordion>
                      )}

                      {/* Related Documents */}
                      {event.relatedDocuments && event.relatedDocuments.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Related Documents:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {event.relatedDocuments.map((doc, idx) => (
                              <Chip
                                key={idx}
                                label={doc.documentType}
                                size="small"
                                variant="outlined"
                                icon={<ViewIcon />}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                  
                  {/* Timeline connector line */}
                  {index < history.length - 1 && (
                    <Box 
                      sx={{ 
                        position: 'absolute',
                        left: 36,
                        bottom: -16,
                        width: 2,
                        height: 32,
                        bgcolor: 'divider',
                        zIndex: 0
                      }} 
                    />
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default PetHistory
