import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Avatar,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper
} from '@mui/material'
import {
  CheckCircle as ApprovedIcon,
  Pets as PetIcon,
  Payment as PaymentIcon,
  Cancel as CancelIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material'
import { apiClient } from '../../../services/api'

const PurchaseDecision = () => {
  const { reservationId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [reservation, setReservation] = useState(null)
  const [error, setError] = useState('')
  const [confirmDialog, setConfirmDialog] = useState({ open: false, decision: null })
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const buildImageUrl = (url) => {
    if (!url) return ''
    if (/^data:image\//i.test(url)) return url
    if (/^https?:\/\//i.test(url)) return url
    const apiBase = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL || ''
    const origin = apiBase.replace(/\/?api\/?$/, '')
    return `${origin}${url.startsWith('/') ? '' : '/'}${url}`
  }

  useEffect(() => {
    fetchReservation()
  }, [reservationId])

  const fetchReservation = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/petshop/public/reservations/track/${reservationId}`)
      const reservationData = response.data.data.reservation
      
      if (reservationData.status !== 'approved') {
        setError('This reservation is not available for purchase decision.')
        return
      }
      
      setReservation(reservationData)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reservation details')
    } finally {
      setLoading(false)
    }
  }

  const handleDecision = (wantsToBuy) => {
    setConfirmDialog({ open: true, decision: wantsToBuy })
  }

  const confirmDecision = async () => {
    try {
      setSubmitting(true)
      const response = await apiClient.post(`/petshop/reservations/${reservationId}/confirm-purchase`, {
        wantsToBuy: confirmDialog.decision,
        notes: notes
      })
      
      setConfirmDialog({ open: false, decision: null })
      
      if (confirmDialog.decision) {
        // User wants to buy - redirect to payment
        navigate(`/User/petshop/payment/${reservationId}`)
      } else {
        // User declined - show success message and redirect
        navigate('/User/petshop/reservations', { 
          state: { message: 'Reservation cancelled successfully.' }
        })
      }
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit decision')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
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

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/User/petshop/reservations')}>
          Back to Reservations
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/User/petshop/reservations')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Purchase Decision
        </Typography>
      </Box>

      {/* Approval Notice */}
      <Alert severity="success" sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ApprovedIcon />
          <Typography variant="h6">
            Great News! Your reservation has been approved!
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ mt: 1 }}>
          The pet shop manager has reviewed and approved your reservation. 
          Please confirm if you'd like to proceed with the purchase.
        </Typography>
      </Alert>

      {/* Pet Details Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              {reservation.itemId?.images?.length > 0 ? (
                <CardMedia
                  component="img"
                  height={200}
                  image={buildImageUrl((reservation.itemId.images.find(i=>i.isPrimary)?.url) || reservation.itemId.images[0]?.url)}
                  alt={reservation.itemId.name}
                  sx={{ borderRadius: 2, objectFit: 'cover' }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.100',
                    borderRadius: 2
                  }}
                >
                  <PetIcon sx={{ fontSize: 60, color: 'grey.400' }} />
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12} md={9}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                {reservation.itemId?.name || 'Pet'}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Pet Code</Typography>
                  <Typography variant="body1">{reservation.itemId?.petCode}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Price</Typography>
                  <Typography variant="h6" color="primary">
                    ₹{reservation.itemId?.price?.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Species</Typography>
                  <Typography variant="body1">
                    {reservation.itemId?.speciesId?.displayName || 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Breed</Typography>
                  <Typography variant="body1">
                    {reservation.itemId?.breedId?.name || 'Unknown'}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Reservation Details */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Reservation Details</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Reservation ID</Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                {reservation.reservationCode || reservation._id.slice(-8)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <Chip label="Approved" color="success" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Requested Date</Typography>
              <Typography variant="body1">{formatDate(reservation.createdAt)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Approved Date</Typography>
              <Typography variant="body1">
                {reservation.managerReview?.reviewedAt ? 
                  formatDate(reservation.managerReview.reviewedAt) : 
                  'Recently'
                }
              </Typography>
            </Grid>
            {reservation.notes && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Your Notes</Typography>
                <Typography variant="body1">{reservation.notes}</Typography>
              </Grid>
            )}
            {reservation.managerReview?.reviewNotes && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Manager Notes</Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body1">{reservation.managerReview.reviewNotes}</Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Decision Buttons */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Would you like to proceed with purchasing this pet?
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                startIcon={<PaymentIcon />}
                onClick={() => handleDecision(true)}
                sx={{ py: 2 }}
              >
                Yes, I want to buy this pet
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                You'll be redirected to the payment page
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                color="error"
                size="large"
                fullWidth
                startIcon={<CancelIcon />}
                onClick={() => handleDecision(false)}
                sx={{ py: 2 }}
              >
                No, cancel reservation
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                The pet will be available for others
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, decision: null })}>
        <DialogTitle>
          {confirmDialog.decision ? 'Confirm Purchase' : 'Cancel Reservation'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {confirmDialog.decision ? 
              'Are you sure you want to proceed with purchasing this pet? You will be redirected to the payment page.' :
              'Are you sure you want to cancel this reservation? The pet will become available for other customers.'
            }
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Additional Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional comments or questions..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, decision: null })}>
            Cancel
          </Button>
          <Button
            onClick={confirmDecision}
            variant="contained"
            color={confirmDialog.decision ? 'primary' : 'error'}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PurchaseDecision
