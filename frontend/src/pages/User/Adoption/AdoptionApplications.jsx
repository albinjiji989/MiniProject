import React, { useEffect, useState } from 'react'
import { adoptionAPI, resolveMediaUrl, apiClient } from '../../../services/api'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material'

const AdoptionApplications = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAnchor, setFilterAnchor] = useState(null)
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [applications, setApplications] = useState([])
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [handoverOpen, setHandoverOpen] = useState(false)
  const [handoverData, setHandoverData] = useState(null)

  useEffect(() => {
    const loadApplications = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await adoptionAPI.listMyRequests()
        const items = res?.data?.data || res?.data || []
        const normalized = (Array.isArray(items) ? items : []).map((a) => ({
          id: a._id || a.id,
          petId: a.petId?._id || a.petId || '',
          petName: a.petId?.name || 'Pet',
          petSpecies: a.petId?.species || '-',
          petBreed: a.petId?.breed || '-',
          status: a.status || 'pending',
          applicationDate: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '-',
          adoptionFee: a.petId?.adoptionFee || 0,
          rejectionReason: a.rejectionReason || '',
          paymentStatus: a.paymentStatus || 'pending'
        }))
        setApplications(normalized)
      } catch (e) {
        setApplications([])
        setError('Failed to load applications')
      } finally {
        setLoading(false)
      }
    }

    loadApplications()
  }, [])

  // Handover: fetch and show
  const handleViewHandover = async (application) => {
    try {
      setSelectedApplication(application)
      const res = await apiClient.get(`/adoption/user/applications/${application.id}/handover`)
      setHandoverData(res?.data?.data || null)
      setHandoverOpen(true)
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to load handover details')
    }
  }

  const handleConfirmHandover = async (application) => {
    try {
      await apiClient.post(`/adoption/user/applications/${application.id}/handover/confirm`)
      alert('Handover confirmed')
      setHandoverOpen(false)
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to confirm handover')
    }
  }

  const handleSearch = (event) => {
    setSearchTerm(event.target.value)
  }

  const handleFilterClick = (event) => {
    setFilterAnchor(event.currentTarget)
  }

  const handleMenuClick = (event, application) => {
    setMenuAnchor(event.currentTarget)
    setSelectedApplication(application)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setSelectedApplication(null)
  }

  const handleViewApplication = () => {
    setDetailsOpen(true)
    handleMenuClose()
  }

  const handleEditApplication = () => {
    // Navigate to edit application
    handleMenuClose()
  }

  const handleCancelApplication = async () => {
    try {
      if (!selectedApplication) return
      await adoptionAPI.cancelMyRequest(selectedApplication.id)
      setApplications((apps) => apps.map(a => a.id === selectedApplication.id ? { ...a, status: 'cancelled' } : a))
    } catch (_) {
      // silently ignore for now or surface toast
    } finally {
      handleMenuClose()
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'approved': return 'success'
      case 'completed': return 'info'
      case 'rejected': return 'error'
      default: return 'default'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending'
      case 'approved': return 'Approved'
      case 'completed': return 'Completed'
      case 'rejected': return 'Rejected'
      default: return status
    }
  }

  // Lazy load Razorpay script
  const loadRazorpay = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  const handlePayNow = async (application) => {
    try {
      const ok = await loadRazorpay()
      if (!ok) return alert('Payment SDK failed to load. Please check your connection.')
      const create = await adoptionAPI.createPaymentOrder(application.id)
      const { key, orderId, amount, currency } = create?.data?.data || {}
      if (!key || !orderId) return alert('Failed to create payment order')

      const rzp = new window.Razorpay({
        key,
        amount,
        currency,
        name: 'Pet Adoption',
        description: `Adoption fee for ${application.petName}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            await adoptionAPI.verifyPayment({
              applicationId: application.id,
              orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            })
            // Refresh list
            const res = await adoptionAPI.listMyRequests()
            const items = res?.data?.data || []
            setApplications(items.map((a) => ({
              id: a._id || a.id,
              petId: a.petId?._id || a.petId || '',
              petName: a.petId?.name || 'Pet',
              petSpecies: a.petId?.species || '-',
              petBreed: a.petId?.breed || '-',
              status: a.status || 'pending',
              applicationDate: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '-',
              adoptionFee: a.petId?.adoptionFee || 0
            })))
          } catch (e) {
            alert(e?.response?.data?.error || 'Payment verification failed')
          }
        },
        theme: { color: '#10b981' }
      })
      rzp.open()
    } catch (e) {
      alert(e?.response?.data?.error || 'Payment failed to start')
    }
  }

  const handleDownloadCertificate = async (application) => {
    try {
      // Stream via backend to avoid redirects/CORS and force download
      const resp = await apiClient.get(`/adoption/certificates/${application.id}/file`, { responseType: 'blob' })
      const blob = new Blob([resp.data], { type: resp.headers['content-type'] || 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const dispo = resp.headers['content-disposition'] || ''
      const match = dispo.match(/filename="?([^";]+)"?/i)
      const fname = (match && match[1]) ? match[1] : `certificate_${application.id}.pdf`
      a.href = blobUrl
      a.download = fname
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(blobUrl)
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to download certificate')
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Adoption Applications
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
        >
          New Application
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Search applications by pet name, adopter name, or email..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={handleFilterClick}
            >
              Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Details Modal */}
      {detailsOpen && selectedApplication && (
        <Card sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300 }} onClick={() => setDetailsOpen(false)}>
          <Card sx={{ width: 520 }} onClick={(e) => e.stopPropagation()}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Application Details</Typography>
                <Chip label={getStatusLabel(selectedApplication.status)} color={getStatusColor(selectedApplication.status)} size="small" />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1 }}>
                <Typography variant="body2"><strong>Pet:</strong> {selectedApplication.petName} ({selectedApplication.petSpecies} • {selectedApplication.petBreed})</Typography>
                <Typography variant="body2"><strong>Applied on:</strong> {selectedApplication.applicationDate}</Typography>
                <Typography variant="body2"><strong>Adoption Fee:</strong> ₹{selectedApplication.adoptionFee}</Typography>
                {selectedApplication.status === 'rejected' && (
                  <Typography variant="body2" color="error.main"><strong>Rejection Reason:</strong> {selectedApplication.rejectionReason || 'Not provided'}</Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button onClick={() => setDetailsOpen(false)}>Close</Button>
              </Box>
            </CardContent>
          </Card>
        </Card>
      )}

      {/* Applications Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Pet</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Application Date</TableCell>
                <TableCell>Adoption Fee</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {application.petName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {application.petSpecies} • {application.petBreed}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(application.status)}
                      color={getStatusColor(application.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {application.status === 'rejected' ? (
                      <Typography variant="body2" color="error.main" noWrap title={application.rejectionReason || 'No reason provided'}>
                        {application.rejectionReason || '-'}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {application.applicationDate}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      ₹{application.adoptionFee}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {application.status === 'approved' && (
                      <Button size="small" variant="contained" color="success" onClick={() => handlePayNow(application)} sx={{ mr: 1 }}>Pay Now</Button>
                    )}
                    {application.status === 'completed' && (
                      <Button size="small" onClick={() => handleDownloadCertificate(application)} sx={{ mr: 1 }}>Download Certificate</Button>
                    )}
                    {/* Show Handover button when not pending/rejected */}
                    {['approved','payment_completed','certificate_generated','handover_scheduled','handed_over','completed'].includes(application.status) && (
                      <Button size="small" variant="outlined" onClick={() => handleViewHandover(application)} sx={{ mr: 1 }}>View Handover</Button>
                    )}
                    {application.status === 'pending' && (
                      <Button size="small" color="error" onClick={handleCancelApplication} sx={{ mr: 1 }}>Cancel</Button>
                    )}
                    <IconButton size="small" onClick={(e) => handleMenuClick(e, application)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewApplication}>
          <ViewIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleCancelApplication} sx={{ color: 'error.main' }}>
          <RejectIcon sx={{ mr: 1 }} />
          Cancel Application
        </MenuItem>
      </Menu>

      {/* Handover Modal */}
      {handoverOpen && (
        <Card sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300 }} onClick={() => setHandoverOpen(false)}>
          <Card sx={{ width: 540 }} onClick={(e) => e.stopPropagation()}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Handover Details</Typography>
              </Box>
              {handoverData ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1 }}>
                  <Typography variant="body2"><strong>Status:</strong> {handoverData.handover?.status || handoverData.status || '-'}</Typography>
                  <Typography variant="body2"><strong>Scheduled At:</strong> {handoverData.handover?.scheduledAt ? new Date(handoverData.handover.scheduledAt).toLocaleString() : '-'}</Typography>
                  <Typography variant="body2"><strong>Location:</strong> Adoption Center - Main Branch, 123 Pet Welfare Road, Animal City</Typography>
                  <Typography variant="body2"><strong>Contact:</strong> +91-9876543210</Typography>
                  <Typography variant="body2"><strong>Notes:</strong> {handoverData.handover?.notes || '-'}</Typography>
                  {handoverData.handover?.confirmedByUserAt && (
                    <Typography variant="body2" color="success.main"><strong>Confirmed:</strong> {new Date(handoverData.handover.confirmedByUserAt).toLocaleString()}</Typography>
                  )}
                  {handoverData.handover?.status === 'scheduled' && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Important Information</Typography>
                      <Typography variant="body2">
                        Please note that pet pickup is only available at our adoption center. 
                        You must present the OTP sent to your email when picking up your pet.
                        Arrive 15 minutes before your scheduled time.
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Typography variant="body2">No handover information available.</Typography>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                <Button onClick={() => setHandoverOpen(false)}>Close</Button>
              </Box>
            </CardContent>
          </Card>
        </Card>
      )}

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={() => setFilterAnchor(null)}
      >
        <MenuItem>All Status</MenuItem>
        <MenuItem>Pending</MenuItem>
        <MenuItem>Approved</MenuItem>
        <MenuItem>Completed</MenuItem>
        <MenuItem>Rejected</MenuItem>
      </Menu>
    </Box>
  )
}

export default AdoptionApplications
