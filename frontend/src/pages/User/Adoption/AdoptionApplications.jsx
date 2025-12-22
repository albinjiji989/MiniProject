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
  ArrowBack as ArrowBackIcon,
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
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [applicationToCancel, setApplicationToCancel] = useState(null)

  useEffect(() => {
    const loadApplications = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await adoptionAPI.listMyRequests()
        const items = res?.data?.data || res?.data || []
        // Removed debugging logs for production
        
        // Fetch pet data for each application to ensure we get the petCode
        const applicationsWithPetData = await Promise.all(
          (Array.isArray(items) ? items : []).map(async (a) => {
            try {
              // Fetch the full pet data to get the petCode
              if (a.petId) {
                // Extract the actual pet ID - it might be an object or string
                const petId = a.petId?._id || a.petId || '';
                if (petId && typeof petId === 'string' && petId.length > 5) {
                  // Validate that petId looks like a valid MongoDB ObjectId
                  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(petId);
                  if (isValidObjectId) {
                    const petResponse = await adoptionAPI.getPet(petId);
                    if (petResponse?.data?.data) {
                      const petData = petResponse.data.data;
                      return {
                        ...a,
                        petData: petData
                      };
                    }
                  } else {
                    console.warn('Invalid pet ID format for application:', a._id || a.id, 'Pet ID:', petId);
                  }
                } else {
                  console.warn('Missing or invalid pet ID for application:', a._id || a.id);
                }
              } else {
                console.warn('No petId found for application:', a._id || a.id);
              }
            } catch (err) {
              console.error('Failed to fetch pet data for application:', a._id || a.id, 'Pet ID:', a.petId?._id || a.petId, err);
            }
            return a;
          })
        );
        
        const normalized = applicationsWithPetData.map((a) => {
          // Get petCode and other data from either the populated data or the fetched petData
          let petCode = 'N/A';
          let petName = 'Unnamed Pet';
          let petSpecies = '-';
          let petBreed = '-';
          let adoptionFee = 0;
          
          // Try to get data from different sources
          if (a.petId) {
            if (typeof a.petId === 'object') {
              petCode = a.petId.petCode || petCode;
              petName = a.petId.name || petName;
              petSpecies = a.petId.species || petSpecies;
              petBreed = a.petId.breed || petBreed;
              adoptionFee = a.petId.adoptionFee || adoptionFee;
            }
          }
          
          if (a.petData) {
            petCode = a.petData.petCode || petCode;
            petName = a.petData.name || petName;
            petSpecies = a.petData.species || petSpecies;
            petBreed = a.petData.breed || petBreed;
            adoptionFee = a.petData.adoptionFee || adoptionFee;
          }
          
          // Fallback for petCode
          if (petCode === 'N/A' && a.petId) {
            const petId = a.petId?._id || a.petId || '';
            if (petId && typeof petId === 'string' && petId.length >= 8) {
              petCode = petId.substring(0, 8) + '...';
            }
          }
          
          return {
            id: a._id || a.id,
            petId: a.petId?._id || a.petId || '',
            petCode: petCode,
            petName: petName,
            petSpecies: petSpecies,
            petBreed: petBreed,
            status: a.status || 'pending',
            applicationDate: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '-',
            adoptionFee: adoptionFee,
            rejectionReason: a.rejectionReason || '',
            paymentStatus: a.paymentStatus || 'pending',
            documents: a.documents || [],
            applicationData: a.applicationData || {}
          }
        })
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

  const handleViewApplication = async () => {
    try {
      if (selectedApplication) {
        // Fetch fresh data for the selected application to ensure we have the latest information
        const res = await adoptionAPI.getMyRequest(selectedApplication.id);
        if (res?.data?.data) {
          // Also fetch the pet data to ensure we have the petCode
          try {
            // Extract the actual pet ID - it might be an object or string
            const petId = res.data.data.petId?._id || res.data.data.petId || '';
            if (petId && typeof petId === 'string' && petId.length > 5) {
              // Validate that petId looks like a valid MongoDB ObjectId
              const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(petId);
              if (isValidObjectId) {
                const petResponse = await adoptionAPI.getPet(petId);
                if (petResponse?.data?.data) {
                  const updatedApplication = {
                    ...res.data.data,
                    petData: petResponse.data.data,
                    petCode: petResponse.data.data.petCode || 'N/A',
                    petName: petResponse.data.data.name || 'Unnamed Pet',
                    petSpecies: petResponse.data.data.species || '-',
                    petBreed: petResponse.data.data.breed || '-',
                    adoptionFee: petResponse.data.data.adoptionFee || 0,
                    applicationDate: res.data.data.createdAt ? new Date(res.data.data.createdAt).toLocaleDateString() : '-'
                  };
                  setSelectedApplication(updatedApplication);
                } else {
                  setSelectedApplication(res.data.data);
                }
              } else {
                console.warn('Invalid pet ID format for application:', res.data.data._id, 'Pet ID:', petId);
                setSelectedApplication(res.data.data);
              }
            } else {
              console.warn('Missing or invalid pet ID for application:', res.data.data._id);
              setSelectedApplication(res.data.data);
            }
          } catch (petErr) {
            console.error('Failed to fetch pet data for application:', res.data.data._id, 'Pet ID:', petId, petErr);
            setSelectedApplication(res.data.data);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch application details:', err);
      // Fallback to existing data
      setDetailsOpen(true);
      handleMenuClose();
      return;
    }
    setDetailsOpen(true);
    handleMenuClose();
  }

  const handleCancelApplication = (application) => {
    // Open confirmation dialog instead of using window.confirm
    setApplicationToCancel(application)
    setCancelConfirmOpen(true)
  }
  
  const handleConfirmCancel = async () => {
    try {
      if (!applicationToCancel) return
      
      await adoptionAPI.cancelMyRequest(applicationToCancel.id)
      setApplications((apps) => apps.map(a => a.id === applicationToCancel.id ? { ...a, status: 'cancelled' } : a))
      setFilteredApplications((apps) => apps.map(a => a.id === applicationToCancel.id ? { ...a, status: 'cancelled' } : a))
      
      // Close dialog and menu
      setCancelConfirmOpen(false)
      setApplicationToCancel(null)
      handleMenuClose()
    } catch (e) {
      // Show error in dialog
      alert(e?.response?.data?.error || 'Failed to cancel application')
      setCancelConfirmOpen(false)
      setApplicationToCancel(null)
    }
  }
  
  const handleCancelCancel = () => {
    // Close dialog without cancelling
    setCancelConfirmOpen(false)
    setApplicationToCancel(null)
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
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Professional Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
            My Adoption Applications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track and manage your pet adoption applications
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => window.location.href = '/User/adoption'}
          sx={{ minWidth: 180 }}
        >
          New Application
        </Button>
      </Box>
      
      {/* Stats Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {applications.length}
              </Typography>
              <Typography variant="body2">
                Total Applications
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {applications.filter(a => a.status === 'pending').length}
              </Typography>
              <Typography variant="body2">
                Pending Review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {applications.filter(a => ['approved', 'payment_pending', 'payment_completed', 'completed'].includes(a.status)).length}
              </Typography>
              <Typography variant="body2">
                Approved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {applications.filter(a => ['rejected', 'cancelled'].includes(a.status)).length}
              </Typography>
              <Typography variant="body2">
                Closed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button 
          variant="outlined" 
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => window.location.href = '/User/adoption'}
        >
          Back to Adoption Center
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {/* Search and Filters */}
      <Card sx={{ mb: 3, boxShadow: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Search by pet name, species, or breed..."
              value={searchTerm}
              onChange={handleSearch}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={statusFilter} 
              onChange={handleStatusFilterChange}
              variant="scrollable"
              scrollButtons="auto"
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label="All Applications" value="all" />
              <Tab label="Pending" value="pending" />
              <Tab label="Approved" value="approved" />
              <Tab label="Payment Pending" value="payment_pending" />
              <Tab label="Completed" value="completed" />
              <Tab label="Rejected" value="rejected" />
              <Tab label="Cancelled" value="cancelled" />
            </Tabs>
          </Box>
        </CardContent>
      </Card>

      {/* Applications List */}
      {loading ? (
        <Typography>Loading applications...</Typography>
      ) : filteredApplications.length === 0 ? (
        <Card sx={{ boxShadow: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Box sx={{ 
              width: 120, 
              height: 120, 
              borderRadius: '50%', 
              bgcolor: 'grey.100', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              mx: 'auto',
              mb: 3
            }}>
              <PetsIcon sx={{ fontSize: 60, color: 'grey.400' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
              No Applications Found
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
              {searchTerm || statusFilter !== 'all' 
                ? 'No applications match your search criteria. Try adjusting your filters.' 
                : 'You haven\'t submitted any adoption applications yet. Start your journey to find your perfect companion.'}
            </Typography>
            {!searchTerm && statusFilter === 'all' && (
              <Button 
                variant="contained" 
                size="large"
                startIcon={<AddIcon />}
                onClick={() => window.location.href = '/User/adoption'}
                sx={{ px: 4, py: 1.5 }}
              >
                Browse Available Pets
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
                '&:hover': { boxShadow: 4 },
                transition: 'box-shadow 0.3s ease'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: 'primary.light', 
                        width: 56, 
                        height: 56 
                      }}>
                        <PetsIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {application.petName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {application.petSpecies} • {application.petBreed}
                        </Typography>
                        <Chip
                          label={getStatusLabel(application.status)}
                          color={getStatusColor(application.status)}
                          size="small"
                          sx={{ height: 20 }}
                        />
                      </Box>
                    </Box>
                    <IconButton size="small" onClick={(e) => handleMenuClick(e, application)}>
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" component="div">
                            Applied Date
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {application.applicationDate}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MoneyIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" component="div">
                            Adoption Fee
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            ₹{application.adoptionFee}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" component="div">
                            Applied Date
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {application.applicationDate}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PetsIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" component="div">
                            Pet Code
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {application.petCode || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    {application.status === 'rejected' && (
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 1 }}>
                          <InfoIcon sx={{ fontSize: 16, color: 'error.main', mt: 0.5 }} />
                          <Box>
                            <Typography variant="caption" color="error.main" component="div">
                              Rejection Reason
                            </Typography>
                            <Typography variant="body2" color="error.main">
                              {application.rejectionReason || 'Not provided'}
                            </Typography>
                          </Box>
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
                        sx={{ minWidth: 120 }}
                      >
                        Pay Now
                      </Button>
                    )}
                    {['payment_completed', 'certificate_generated', 'handover_scheduled', 'handed_over', 'completed'].includes(application.status) && (
                      <Button 
                        size="small" 
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadCertificate(application)}
                        sx={{ minWidth: 120 }}
                      >
                        Certificate
                      </Button>
                    )}
                    {['approved','payment_completed','certificate_generated','handover_scheduled','handed_over','completed'].includes(application.status) && (
                      <Button 
                        size="small" 
                        variant="outlined"
                        startIcon={<HomeIcon />}
                        onClick={() => handleViewHandover(application)}
                        sx={{ minWidth: 120 }}
                      >
                        Handover
                      </Button>
                    )}
                    {['pending', 'approved', 'payment_pending'].includes(application.status) && (
                      <Button 
                        size="small" 
                        color="error" 
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={() => handleCancelApplication(application)}
                        sx={{ minWidth: 120 }}
                      >
                        Cancel Application
                      </Button>
                    )}
                    <Button 
                      size="small" 
                      variant="contained"
                      color="primary"
                      startIcon={<ViewIcon />}
                      onClick={async () => {
                        try {
                          // Fetch fresh data for the selected application
                          const res = await adoptionAPI.getMyRequest(application.id);
                          if (res?.data?.data) {
                            // Also fetch the pet data to ensure we have the petCode
                            try {
                              // Extract the actual pet ID - it might be an object or string
                              const petId = res.data.data.petId?._id || res.data.data.petId || '';
                              if (petId) {
                                const petResponse = await adoptionAPI.getPet(petId);
                                if (petResponse?.data?.data) {
                                  const updatedApplication = {
                                    ...res.data.data,
                                    petData: petResponse.data.data,
                                    petCode: petResponse.data.data.petCode || 'N/A',
                                    petName: petResponse.data.data.name || 'Unnamed Pet',
                                    petSpecies: petResponse.data.data.species || '-',
                                    petBreed: petResponse.data.data.breed || '-',
                                    adoptionFee: petResponse.data.data.adoptionFee || 0,
                                    applicationDate: res.data.data.createdAt ? new Date(res.data.data.createdAt).toLocaleDateString() : '-'
                                  };
                                  setSelectedApplication(updatedApplication);
                                } else {
                                  setSelectedApplication(res.data.data);
                                }
                              } else {
                                setSelectedApplication(res.data.data);
                              }
                            } catch (petErr) {
                              console.error('Failed to fetch pet data:', petErr);
                              setSelectedApplication(res.data.data);
                            }
                          }
                        } catch (err) {
                          console.error('Failed to fetch application details:', err);
                          // Fallback to existing data
                          setSelectedApplication(application);
                        }
                        setDetailsOpen(true);
                      }}
                      sx={{ minWidth: 120 }}
                    >
                      Details
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
          <MenuItem onClick={() => handleCancelApplication(selectedApplication)} sx={{ color: 'error.main' }}>
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
                      <Typography variant="body2" color="text.secondary">Pet Code:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedApplication.petCode || 'N/A'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Adoption Fee:</Typography>
                      <Typography variant="body2">₹{selectedApplication.adoptionFee}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Application Date:</Typography>
                      <Typography variant="body2">{selectedApplication.applicationDate}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Status:</Typography>
                      <Chip 
                        label={getStatusLabel(selectedApplication.status)}
                        color={getStatusColor(selectedApplication.status)}
                        size="small"
                        sx={{ height: 20 }}
                      />
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
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Uploaded Documents</Typography>
                  {selectedApplication.documents && selectedApplication.documents.length > 0 ? (
                    <Grid container spacing={2}>
                      {selectedApplication.documents.map((doc, index) => {
                        const url = typeof doc === 'string' ? doc : (doc && doc.url ? doc.url : '')
                        const name = (typeof doc === 'object' && doc.name) ? doc.name : (url ? url.split('/').pop() : `Document ${index + 1}`)
                        const type = (typeof doc === 'object' && doc.type) ? doc.type : ''
                        const uploadedAt = (typeof doc === 'object' && doc.uploadedAt) ? new Date(doc.uploadedAt).toLocaleDateString() : ''
                        
                        return url ? (
                          <Grid item xs={12} sm={6} key={index}>
                            <Paper 
                              variant="outlined" 
                              sx={{ 
                                p: 2, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                '&:hover': { bgcolor: 'grey.50', boxShadow: 2 },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', color: 'primary.main' }}>
                                  <DescriptionIcon sx={{ fontSize: 16 }} />
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                                    {name}
                                  </Typography>
                                  {uploadedAt && (
                                    <Typography variant="caption" color="text.secondary">
                                      Uploaded: {uploadedAt}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                              <IconButton 
                                size="small" 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                sx={{ ml: 1 }}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Paper>
                          </Grid>
                        ) : null
                      })}
                    </Grid>
                  ) : (
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 3, 
                        textAlign: 'center', 
                        bgcolor: 'grey.50' 
                      }}
                    >
                      <DescriptionIcon sx={{ fontSize: 40, color: 'grey.400', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">No documents uploaded for this application</Typography>
                    </Paper>
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
      <Dialog open={handoverOpen} onClose={() => setHandoverOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>Adoption Handover Details</DialogTitle>
        <DialogContent>
          {handoverData ? (
            <Box sx={{ py: 1 }}>
              {/* Pet Information */}
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Pet Information</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Pet Name</Typography>
                      <Typography variant="body1">{handoverData.petId?.name || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Pet Code</Typography>
                      <Typography variant="body1">{handoverData.petId?.petCode || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Species & Breed</Typography>
                      <Typography variant="body1">{handoverData.petId?.species || '-'} • {handoverData.petId?.breed || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Age</Typography>
                      <Typography variant="body1">{handoverData.petId?.ageDisplay || '-'}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              
              {/* Handover Status */}
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Handover Status</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body1" color="text.secondary">Current Status:</Typography>
                    <Chip 
                      label={handoverData.handover?.status === 'scheduled' ? 'Scheduled' : 
                             handoverData.handover?.status === 'completed' ? 'Completed' : 
                             'Not Scheduled'} 
                      color={handoverData.handover?.status === 'completed' ? 'success' : 
                             handoverData.handover?.status === 'scheduled' ? 'warning' : 'default'} 
                      size="medium" 
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                  
                  {handoverData.handover?.status === 'scheduled' && (
                    <>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Scheduled Date & Time</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {handoverData.handover.scheduledAt ? new Date(handoverData.handover.scheduledAt).toLocaleString() : '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">OTP</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500, color: 'primary.main' }}>
                            {handoverData.handover.otpHistory && handoverData.handover.otpHistory.length > 0 
                              ? handoverData.handover.otpHistory[handoverData.handover.otpHistory.length - 1].otp 
                              : 'Not Generated'}
                          </Typography>
                        </Grid>
                      </Grid>
                      
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="warning.main" sx={{ mb: 1 }}>
                          Important Instructions
                        </Typography>
                        <Typography variant="body2" color="warning.dark">
                          Please arrive at the adoption center at least 15 minutes before your scheduled time. 
                          Bring a valid ID and the OTP sent to your email. Failure to present the OTP will result in 
                          denial of pet release.
                        </Typography>
                      </Box>
                    </>
                  )}
                  
                  {handoverData.handover?.status === 'completed' && (
                    <>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Completion Date & Time</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {handoverData.handoverCompletedAt ? new Date(handoverData.handoverCompletedAt).toLocaleString() : '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">Confirmation</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500, color: 'success.main' }}>
                            Confirmed
                          </Typography>
                        </Grid>
                      </Grid>
                      
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="success.main" sx={{ mb: 1 }}>
                          Adoption Completed Successfully
                        </Typography>
                        <Typography variant="body2" color="success.dark">
                          Congratulations! Your adoption is now complete. The pet is officially yours and will appear 
                          in your dashboard under "My Pets". Welcome your new family member!
                        </Typography>
                      </Box>
                    </>
                  )}
                  
                  {handoverData.handover?.status !== 'scheduled' && handoverData.handover?.status !== 'completed' && (
                    <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Handover has not been scheduled yet. Once your application is fully processed, 
                        the adoption manager will schedule a handover appointment.
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
              
              {/* Location & Contact Information */}
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Location & Contact</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Adoption Center Address</Typography>
                      <Typography variant="body1">
                        PetConnect Adoption Center<br />
                        123 Pet Welfare Road<br />
                        Animal City, AC 560001
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Phone</Typography>
                      <Typography variant="body1">+91-9876543210</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Email</Typography>
                      <Typography variant="body1">adoptions@petconnect.com</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              
              {/* Special Notes */}
              {handoverData.handover?.notes && (
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Special Notes</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {handoverData.handover.notes}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          ) : (
            <Typography variant="body2">No handover information available.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setHandoverOpen(false)} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Cancel Application Confirmation Dialog */}
      <Dialog open={cancelConfirmOpen} onClose={handleCancelCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Cancellation</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to cancel this adoption application?
          </Typography>
          {applicationToCancel && (
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Application for: {applicationToCancel.petName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pet Code: {applicationToCancel.petCode}
              </Typography>
            </Box>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This action cannot be undone. If you wish to reapply, you will need to submit a new application.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelCancel} color="inherit">
            Keep Application
          </Button>
          <Button onClick={handleConfirmCancel} color="error" variant="contained">
            Cancel Application
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AdoptionApplications