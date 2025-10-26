import React, { useEffect, useState } from 'react'
import { 
  Box, 
  Container, 
  Typography, 
  Select, 
  MenuItem, 
  Button, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  CircularProgress, 
  Alert, 
  Chip,
  Card,
  CardContent,
  Grid,
  Avatar,
  Stack,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper
} from '@mui/material'
import { 
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  LocalShipping as DeliveryIcon,
  Receipt as ReceiptIcon,
  Pets as PetIcon
} from '@mui/icons-material'
import { petShopManagerAPI } from '../../services/api'
import { resolveMediaUrl } from '../../services/api'

const PetShopReservations = () => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusById, setStatusById] = useState({})
  const load = async () => {
    try {
      setLoading(true)
      const res = await petShopManagerAPI.listReservations()
      console.log('Reservations API response:', res);
      const list = res?.data?.data?.reservations || []
      console.log('Reservations list:', list);
      setRows(list)
      const map = {}
      list.forEach(r => { map[r._id] = r.status })
      setStatusById(map)
    } catch (e) {
      console.error('Error loading reservations:', e);
      setError(e?.response?.data?.message || 'Failed to load reservations')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() // eslint-disable-next-line
  }, [])

  const updateStatus = async (id) => {
    const status = statusById[id]
    await petShopManagerAPI.updateReservationStatus(id, status)
    await load()
  }

  const [openPetDialog, setOpenPetDialog] = useState(false)
  const [selectedPet, setSelectedPet] = useState(null)

  const handleViewPet = (pet) => {
    setSelectedPet(pet)
    setOpenPetDialog(true)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'manager_review': return 'info'
      case 'approved': return 'success'
      case 'rejected': return 'error'
      case 'going_to_buy': return 'info'
      case 'payment_pending': return 'warning'
      case 'paid': return 'success'
      case 'ready_pickup': return 'info'
      case 'delivered': return 'success'
      case 'at_owner': return 'success'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  const buildImageUrl = (url) => {
    if (!url) return '/placeholder-pet.svg'
    if (/^data:image\//i.test(url)) return url
    if (/^https?:\/\//i.test(url)) return url
    return resolveMediaUrl(url)
  }

  // For the table view
  if (rows.length > 0) {
    return (
      <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Pet Shop Reservations</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Reservation ID</TableCell>
                  <TableCell>Pet</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((reservation) => (
                  <TableRow key={reservation._id} hover>
                    <TableCell>
                      {reservation.reservationCode || reservation._id?.slice(-6) || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          sx={{ width: 40, height: 40 }}
                          src={reservation.itemId?.images?.[0]?.url ? buildImageUrl(reservation.itemId.images[0].url) : undefined}
                        >
                          {reservation.itemId?.images?.[0]?.url ? null : <PetIcon />}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {reservation.itemId?.name || 'Unknown Pet'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {reservation.itemId?.petCode || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {reservation.userId?.name || 'Customer'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {reservation.userId?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(reservation.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={reservation.status}
                        color={getStatusColor(reservation.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="View Pet Details">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleViewPet(reservation.itemId)}
                            disabled={!reservation.itemId}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Status">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => updateStatus(reservation._id)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
        
        {/* Pet Details Dialog */}
        <Dialog open={openPetDialog} onClose={() => setOpenPetDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Pet Details</DialogTitle>
          <DialogContent>
            {selectedPet && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  {selectedPet.images?.[0] ? (
                    <img 
                      src={buildImageUrl(selectedPet.images[0].url)} 
                      alt={selectedPet.name}
                      style={{ width: '100%', borderRadius: 8 }}
                    />
                  ) : (
                    <Box sx={{ 
                      width: '100%', 
                      height: 200, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      bgcolor: 'grey.100',
                      borderRadius: 1
                    }}>
                      <PetIcon sx={{ fontSize: 60, color: 'grey.400' }} />
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={8}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {selectedPet.name || 'Unknown Pet'}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Code:</strong> {selectedPet.petCode || 'N/A'}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Price:</strong> ₹{selectedPet.price?.toLocaleString() || 0}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Species:</strong> {selectedPet.speciesId?.name || 'N/A'}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Breed:</strong> {selectedPet.breedId?.name || 'N/A'}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Gender:</strong> {selectedPet.gender || 'N/A'}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Age:</strong> {selectedPet.age} {selectedPet.ageUnit || 'months'}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Color:</strong> {selectedPet.color || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPetDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    )
  }

  // For the card view (fallback)
  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Pet Shop Reservations</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {rows.map((reservation) => (
            <Grid item xs={12} key={reservation._id}>
              <Card>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={2}>
                      <Avatar
                        sx={{ width: 80, height: 80, mx: 'auto' }}
                        src={reservation.itemId?.images?.[0]?.url ? buildImageUrl(reservation.itemId.images[0].url) : undefined}
                      >
                        {reservation.itemId?.images?.[0]?.url ? null : <PetIcon />}
                      </Avatar>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Typography variant="h6" fontWeight="bold">
                        {reservation.itemId?.name || 'Unknown Pet'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Code: {reservation.itemId?.petCode || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Reservation: {reservation.reservationCode || reservation._id?.slice(-6) || 'N/A'}
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        ₹{reservation.itemId?.price?.toLocaleString() || 0}
                      </Typography>
                      {reservation.itemId && (
                        <Button 
                          size="small" 
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewPet(reservation.itemId)}
                          sx={{ mt: 1 }}
                        >
                          View Pet Details
                        </Button>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" fontWeight="medium">
                        {reservation.userId?.name || 'Customer'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {reservation.userId?.email}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(reservation.createdAt).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={2}>
                      <Chip 
                        label={reservation.status}
                        color={getStatusColor(reservation.status)}
                        sx={{ mb: 1 }}
                      />
                      <Select 
                        size="small" 
                        fullWidth
                        value={statusById[reservation._id] || reservation.status} 
                        onChange={(e) => setStatusById(prev => ({ ...prev, [reservation._id]: e.target.value }))}
                      >
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="manager_review">Manager Review</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                        <MenuItem value="going_to_buy">Going to Buy</MenuItem>
                        <MenuItem value="payment_pending">Payment Pending</MenuItem>
                        <MenuItem value="paid">Paid</MenuItem>
                        <MenuItem value="ready_pickup">Ready for Pickup</MenuItem>
                        <MenuItem value="delivered">Delivered</MenuItem>
                        <MenuItem value="at_owner">At Owner</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                      </Select>
                    </Grid>
                    
                    <Grid item xs={12} sm={1}>
                      <Stack direction="column" spacing={1}>
                        <Tooltip title="Update Status">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => updateStatus(reservation._id)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {reservation.status === 'paid' && (
                          <Tooltip title="Mark Ready for Delivery">
                            <IconButton size="small" color="success">
                              <DeliveryIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {['paid', 'delivered'].includes(reservation.status) && (
                          <Tooltip title="Generate Invoice">
                            <IconButton size="small" color="info">
                              <ReceiptIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                  
                  {reservation.notes && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2">
                        <strong>Notes:</strong> {reservation.notes}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
          
          {rows.length === 0 && (
            <Grid item xs={12}>
              <Box textAlign="center" py={8}>
                <Typography variant="h6" color="text.secondary">
                  No reservations found
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}
      
      {/* Pet Details Dialog */}
      <Dialog open={openPetDialog} onClose={() => setOpenPetDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Pet Details</DialogTitle>
        <DialogContent>
          {selectedPet && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                {selectedPet.images?.[0] ? (
                  <img 
                    src={buildImageUrl(selectedPet.images[0].url)} 
                    alt={selectedPet.name}
                    style={{ width: '100%', borderRadius: 8 }}
                  />
                ) : (
                  <Box sx={{ 
                    width: '100%', 
                    height: 200, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: 'grey.100',
                    borderRadius: 1
                  }}>
                    <PetIcon sx={{ fontSize: 60, color: 'grey.400' }} />
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} md={8}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {selectedPet.name || 'Unknown Pet'}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Code:</strong> {selectedPet.petCode || 'N/A'}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Price:</strong> ₹{selectedPet.price?.toLocaleString() || 0}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Species:</strong> {selectedPet.speciesId?.name || 'N/A'}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Breed:</strong> {selectedPet.breedId?.name || 'N/A'}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Gender:</strong> {selectedPet.gender || 'N/A'}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Age:</strong> {selectedPet.age} {selectedPet.ageUnit || 'months'}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Color:</strong> {selectedPet.color || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPetDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default PetShopReservations