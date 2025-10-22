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
  Tabs,
  Tab,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Avatar,
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Cancel as CancelIcon,
  Payment as PaymentIcon,
  Download as DownloadIcon,
  CalendarToday as CalendarIcon,
  Pets as PetsIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  AttachMoney as MoneyIcon,
  Info as InfoIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material'

const AdoptionApplications = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [applications, setApplications] = useState([])
  const [filteredApplications, setFilteredApplications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [handoverOpen, setHandoverOpen] = useState(false)
  const [handoverData, setHandoverData] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

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
          paymentStatus: a.paymentStatus || 'pending',
          documents: a.documents || [],
          applicationData: a.applicationData || {}
        }))
        setApplications(normalized)
        setFilteredApplications(normalized)
      } catch (e) {
        setApplications([])
        setFilteredApplications([])
        setError('Failed to load applications')
      } finally {
        setLoading(false)
      }
    }

    loadApplications()
  }, [])

  // Filter applications based on search term and status
  useEffect(() => {
    let result = applications
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(app => 
        app.petName.toLowerCase().includes(term) ||
        app.petSpecies.toLowerCase().includes(term) ||
        app.petBreed.toLowerCase().includes(term)
      )
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(app => app.status === statusFilter)
    }
    
    setFilteredApplications(result)
  }, [searchTerm, statusFilter, applications])

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

  const handleStatusFilterChange = (event, newValue) => {
    setStatusFilter(newValue)
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

  const handleCancelApplication = async () => {
    try {
      if (!selectedApplication) return
      if (!window.confirm('Are you sure you want to cancel this application?')) return
      
      await adoptionAPI.cancelMyRequest(selectedApplication.id)
      setApplications((apps) => apps.map(a => a.id === selectedApplication.id ? { ...a, status: 'cancelled' } : a))
      setFilteredApplications((apps) => apps.map(a => a.id === selectedApplication.id ? { ...a, status: 'cancelled' } : a))
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to cancel application')
    } finally {
      handleMenuClose()
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'approved': return 'info'
      case 'payment_pending': return 'secondary'
      case 'payment_completed': return 'success'
      case 'completed': return 'success'
      case 'rejected': return 'error'
      case 'cancelled': return 'default'
      default: return 'default'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending Review'
      case 'approved': return 'Approved'
      case 'payment_pending': return 'Payment Pending'
      case 'payment_completed': return 'Payment Completed'
      case 'completed': return 'Completed'
      case 'rejected': return 'Rejected'
      case 'cancelled': return 'Cancelled'
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
            const normalized = items.map((a) => ({
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
            setFilteredApplications(normalized)
            alert('Payment successful!')
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
      // Use the new API method for downloading user certificates
      const resp = await adoptionAPI.getUserCertificate(application.id);
      const blob = new Blob([resp.data], { type: resp.headers['content-type'] || 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dispo = resp.headers['content-disposition'] || '';
      const match = dispo.match(/filename="?([^";]+)"?/i);
      const fname = (match && match[1]) ? match[1] : `certificate_${application.id}.pdf`;
      a.href = blobUrl;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      // Fallback to the existing method if the new endpoint fails
      try {
        const res = await adoptionAPI.getCertificate(application.id);
        const url = res?.data?.data?.agreementFile || res?.data?.data?.certificate?.agreementFile || res?.data?.data?.contractURL
        if (url) {
          const resolvedUrl = resolveMediaUrl(url)
          const a = document.createElement('a')
          a.href = resolvedUrl
          a.download = `certificate_${application.id}.pdf`
          document.body.appendChild(a)
          a.click()
          a.remove()
        } else {
          alert('Certificate not available')
        }
      } catch (fallbackError) {
        alert(e?.response?.data?.error || 'Failed to download certificate')
      }
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          My Adoption Applications
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => window.location.href = '/User/adoption'}
        >
          New Application
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search by pet name, species, or breed..."
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
          </Box>
          
          <Tabs 
            value={statusFilter} 
            onChange={handleStatusFilterChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All Applications" value="all" />
            <Tab label="Pending" value="pending" />
            <Tab label="Approved" value="approved" />
            <Tab label="Payment Pending" value="payment_pending" />
            <Tab label="Completed" value="completed" />
            <Tab label="Rejected" value="rejected" />
            <Tab label="Cancelled" value="cancelled" />
          </Tabs>
        </CardContent>
      </Card>

      {/* Applications List */}
      {loading ? (
        <Typography>Loading applications...</Typography>
      ) : filteredApplications.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <PetsIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>No Applications Found</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {searchTerm || statusFilter !== 'all' 
                ? 'No applications match your search criteria.' 
                : 'You haven\'t submitted any adoption applications yet.'}
            </Typography>
            {!searchTerm && statusFilter === 'all' && (
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => window.location.href = '/User/adoption'}
              >
                Apply for Adoption
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredApplications.map((application) => (
            <Grid item xs={12} key={application.id}>
              <Card sx={{ 
                borderLeft: 4, 
                borderLeftColor: getStatusColor(application.status),
                '&:hover': { boxShadow: 3 }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.light' }}>
                        <PetsIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {application.petName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {application.petSpecies} • {application.petBreed}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={getStatusLabel(application.status)}
                        color={getStatusColor(application.status)}
                        size="small"
                      />
                      <IconButton size="small" onClick={(e) => handleMenuClick(e, application)}>
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          <strong>Applied:</strong> {application.applicationDate}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MoneyIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          <strong>Fee:</strong> ₹{application.adoptionFee}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          <strong>Status:</strong> {getStatusLabel(application.status)}
                        </Typography>
                      </Box>
                    </Grid>
                    {application.status === 'rejected' && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <InfoIcon sx={{ fontSize: 16, color: 'error.main' }} />
                          <Typography variant="body2" color="error.main">
                            <strong>Reason:</strong> {application.rejectionReason || 'Not provided'}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'flex-end' }}>
                    {application.status === 'approved' && (
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="success" 
                        startIcon={<PaymentIcon />}
                        onClick={() => handlePayNow(application)}
                      >
                        Pay Now (₹{application.adoptionFee})
                      </Button>
                    )}
                    {['payment_completed', 'certificate_generated', 'handover_scheduled', 'handed_over', 'completed'].includes(application.status) && (
                      <Button 
                        size="small" 
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadCertificate(application)}
                      >
                        Download Certificate
                      </Button>
                    )}
                    {['approved','payment_completed','certificate_generated','handover_scheduled','handed_over','completed'].includes(application.status) && (
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => handleViewHandover(application)}
                      >
                        View Handover
                      </Button>
                    )}
                    {application.status === 'pending' && (
                      <Button 
                        size="small" 
                        color="error" 
                        startIcon={<CancelIcon />}
                        onClick={handleCancelApplication}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button 
                      size="small" 
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      onClick={() => {
                        setSelectedApplication(application)
                        setDetailsOpen(true)
                      }}
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

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
        {selectedApplication && selectedApplication.status === 'pending' && (
          <MenuItem onClick={handleCancelApplication} sx={{ color: 'error.main' }}>
            <CancelIcon sx={{ mr: 1 }} />
            Cancel Application
          </MenuItem>
        )}
      </Menu>

      {/* Application Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Application Details
          {selectedApplication && (
            <Chip 
              label={getStatusLabel(selectedApplication.status)} 
              color={getStatusColor(selectedApplication.status)} 
              size="small" 
              sx={{ ml: 2 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box sx={{ py: 2 }}>
              <Grid container spacing={3}>
                {/* Pet Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Pet Information</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.light' }}>
                      <PetsIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{selectedApplication.petName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedApplication.petSpecies} • {selectedApplication.petBreed}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'grid', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Adoption Fee:</Typography>
                      <Typography variant="body2">₹{selectedApplication.adoptionFee}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Application Date:</Typography>
                      <Typography variant="body2">{selectedApplication.applicationDate}</Typography>
                    </Box>
                  </Box>
                </Grid>
                
                {/* Applicant Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Your Information</Typography>
                  <Box sx={{ display: 'grid', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">Name:</Typography>
                      <Typography variant="body2">{selectedApplication.applicationData?.fullName || '-'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">Email:</Typography>
                      <Typography variant="body2">{selectedApplication.applicationData?.email || '-'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">Phone:</Typography>
                      <Typography variant="body2">{selectedApplication.applicationData?.phone || '-'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HomeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">Home Type:</Typography>
                      <Typography variant="body2">{selectedApplication.applicationData?.homeType || '-'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WorkIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">Work Schedule:</Typography>
                      <Typography variant="body2">{selectedApplication.applicationData?.workSchedule || '-'}</Typography>
                    </Box>
                  </Box>
                </Grid>
                
                {/* Documents */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Documents</Typography>
                  {selectedApplication.documents && selectedApplication.documents.length > 0 ? (
                    <Grid container spacing={1}>
                      {selectedApplication.documents.map((doc, index) => {
                        const url = typeof doc === 'string' ? doc : (doc && doc.url ? doc.url : '')
                        const name = (typeof doc === 'object' && doc.name) ? doc.name : (url ? url.split('/').pop() : `Document ${index + 1}`)
                        return url ? (
                          <Grid item xs={12} sm={6} key={index}>
                            <Paper 
                              variant="outlined" 
                              sx={{ 
                                p: 1.5, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                '&:hover': { bgcolor: 'grey.50' }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <DescriptionIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                <Typography variant="body2" noWrap>
                                  {name}
                                </Typography>
                              </Box>
                              <IconButton 
                                size="small" 
                                href={resolveMediaUrl(url)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <DownloadIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Paper>
                          </Grid>
                        ) : null
                      })}
                    </Grid>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No documents uploaded</Typography>
                  )}
                </Grid>
                
                {/* Rejection Reason (if applicable) */}
                {selectedApplication.status === 'rejected' && (
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'error.main' }}>Rejection Information</Typography>
                    <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                      <Typography variant="body2">
                        <strong>Reason:</strong> {selectedApplication.rejectionReason || 'No reason provided'}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Handover Modal */}
      <Dialog open={handoverOpen} onClose={() => setHandoverOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Handover Details</DialogTitle>
        <DialogContent>
          {handoverData ? (
            <Box sx={{ py: 2 }}>
              <Box sx={{ display: 'grid', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" color="text.secondary">Status:</Typography>
                  <Chip 
                    label={handoverData.handover?.status || handoverData.status || '-'} 
                    color={handoverData.handover?.status === 'completed' ? 'success' : 'info'} 
                    size="small" 
                  />
                </Box>
                
                {handoverData.handover?.scheduledAt && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" color="text.secondary">Scheduled At:</Typography>
                    <Typography variant="body1">
                      {new Date(handoverData.handover.scheduledAt).toLocaleString()}
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1" color="text.secondary">Location:</Typography>
                  <Typography variant="body1">
                    Adoption Center - Main Branch, 123 Pet Welfare Road, Animal City
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1" color="text.secondary">Contact:</Typography>
                  <Typography variant="body1">+91-9876543210</Typography>
                </Box>
                
                {handoverData.handover?.notes && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" color="text.secondary">Notes:</Typography>
                    <Typography variant="body1">{handoverData.handover.notes}</Typography>
                  </Box>
                )}
                
                {handoverData.handover?.confirmedByUserAt && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" color="text.secondary">Confirmed:</Typography>
                    <Typography variant="body1" color="success.main">
                      {new Date(handoverData.handover.confirmedByUserAt).toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Box>
              
              {handoverData.handover?.status === 'scheduled' && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHandoverOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AdoptionApplications