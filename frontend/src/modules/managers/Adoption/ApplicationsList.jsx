import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient, adoptionAPI, resolveMediaUrl } from '../../../services/api'
import ApplicationDetailsImproved from './ApplicationDetailsImproved'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Pagination,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Avatar,
  IconButton,
  Menu,
  Divider
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Image as ImageIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Pets as PetsIcon,
  ManageAccounts as ManageAccountsIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material'

const ApplicationsList = () => {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [actionLoadingId, setActionLoadingId] = useState('')
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [error, setError] = useState('')

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit])

  const load = async (signal) => {
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.get('/adoption/manager/applications', { 
        params: { 
          status: statusFilter === 'all' ? '' : statusFilter, 
          page, 
          limit, 
          fields: 'status,paymentStatus,contractURL,userId.name,userId.email,petId.name,petId.breed,petId.species,petId.age,petId.ageUnit,petId.ageDisplay,petId.gender,petId.healthStatus,petId.adoptionFee,petId.petCode,createdAt',
          lean: true 
        }, 
        signal 
      })
      const raw = res.data?.data?.applications || []
      const minimal = raw.map(app => ({
        _id: app._id,
        status: app.status,
        createdAt: app.createdAt,
        paymentStatus: app.paymentStatus,
        contractURL: app.contractURL,
        userId: app.userId ? { name: app.userId.name, email: app.userId.email } : null,
        petId: app.petId ? { 
          name: app.petId.name, 
          breed: app.petId.breed, 
          species: app.petId.species,
          age: app.petId.age,
          ageUnit: app.petId.ageUnit,
          ageDisplay: app.petId.ageDisplay,
          gender: app.petId.gender,
          healthStatus: app.petId.healthStatus,
          adoptionFee: app.petId.adoptionFee,
          petCode: app.petId.petCode
        } : null,
      }))
      setItems(minimal)
      setTotal(res.data?.data?.pagination?.total || 0)
    } catch (e) {
      if (e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED') {
        // silently ignore aborted requests
      } else {
        console.error('Load applications failed', e)
        setError('Failed to load applications')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const ac = new AbortController()
    load(ac.signal)
    return () => ac.abort()
  }, [page, limit])

  useEffect(() => {
    let ac
    const t = setTimeout(() => {
      ac = new AbortController()
      setPage(1)
      load(ac.signal)
    }, 300)
    return () => { clearTimeout(t); if (ac) ac.abort() }
  }, [statusFilter, searchTerm])

  const StatusChip = ({ value }) => {
    const map = {
      pending: { color: 'warning', label: 'Pending Review', icon: <PendingIcon /> },
      approved: { color: 'info', label: 'Approved', icon: <CheckCircleIcon /> },
      rejected: { color: 'error', label: 'Rejected', icon: <CancelIcon /> },
      payment_pending: { color: 'secondary', label: 'Payment Pending', icon: <ScheduleIcon /> },
      completed: { color: 'success', label: 'Completed', icon: <CheckCircleIcon /> },
    }
    const meta = map[value] || { color: 'default', label: (value || '').toUpperCase() }
    return <Chip size="small" color={meta.color} label={meta.label} icon={meta.icon} variant="outlined" />
  }

  const getPaymentStatusChip = (status) => {
    const map = {
      pending: { color: 'default', label: 'Not Started' },
      processing: { color: 'warning', label: 'Processing' },
      completed: { color: 'success', label: 'Completed' },
      failed: { color: 'error', label: 'Failed' },
    }
    const meta = map[status] || { color: 'default', label: 'Unknown' }
    return <Chip size="small" color={meta.color} label={meta.label} variant="outlined" />
  }

  const generateCertificate = async (applicationId) => {
    try {
      setActionLoadingId(applicationId)
      // 1) Try to fetch existing contract
      let contractURL = ''
      try {
        const resGet = await apiClient.get(`/adoption/manager/contracts/${applicationId}`)
        contractURL = resGet?.data?.data?.contractURL || ''
      } catch (e) {
        // 2) If not found, generate it
        if (e?.response?.status === 404) {
          const resGen = await apiClient.post(`/adoption/manager/contracts/generate/${applicationId}`)
          contractURL = resGen?.data?.data?.contractURL || ''
        } else {
          throw e
        }
      }

      if (!contractURL) {
        throw new Error('Contract URL not available')
      }

      // 3) Generate certificate with agreementFile
      const res = await adoptionAPI.generateCertificate(applicationId, contractURL)
      const url = res?.data?.data?.agreementFile || res?.data?.data?.contractURL
      if (url) {
        await load()
        alert('Certificate generated')
      }
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || 'Failed to generate certificate')
    } finally {
      setActionLoadingId('')
    }
  }

  const viewCertificate = async (applicationId, fallbackUrl) => {
    try {
      setActionLoadingId(applicationId)
      // Directly stream from backend to avoid CORS
      const resp = await apiClient.get(`/adoption/manager/certificates/${applicationId}/file`, { responseType: 'blob' })
      const blob = new Blob([resp.data], { type: resp.headers['content-type'] || 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      // Try to extract filename from Content-Disposition
      const dispo = resp.headers['content-disposition'] || ''
      const match = dispo.match(/filename="?([^";]+)"?/i)
      const fallback = `certificate_${applicationId}.pdf`
      const fname = (match && match[1]) ? match[1] : fallback
      a.href = blobUrl
      a.download = fname
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.open(blobUrl, '_blank')
    } catch (e) {
      // Fallback: attempt to open provided URL if present
      const resolved = fallbackUrl ? resolveMediaUrl(fallbackUrl) : ''
      if (resolved) window.open(resolved, '_blank')
      else alert(e?.response?.data?.error || e?.message || 'Failed to fetch certificate')
    } finally {
      setActionLoadingId('')
    }
  }

  // Approve application with notes
  const approveApplication = async (applicationId) => {
    const notes = prompt('Add any notes for approval (optional):')
    if (notes !== null) {
      try {
        setActionLoadingId(applicationId)
        await apiClient.patch(`/adoption/manager/applications/${applicationId}`, {
          status: 'approved',
          notes: notes || ''
        })
        await load()
        alert('Application approved successfully')
      } catch (e) {
        alert(e?.response?.data?.error || 'Failed to approve application')
      } finally {
        setActionLoadingId('')
      }
    }
  }

  // Reject application with reason
  const rejectApplication = async (applicationId) => {
    const reason = prompt('Reason for rejection:')
    if (reason) {
      try {
        setActionLoadingId(applicationId)
        await apiClient.patch(`/adoption/manager/applications/${applicationId}`, {
          status: 'rejected',
          reason: reason
        })
        await load()
        alert('Application rejected')
      } catch (e) {
        alert(e?.response?.data?.error || 'Failed to reject application')
      } finally {
        setActionLoadingId('')
      }
    }
  }

  // Download user document
  const downloadUserDocument = (url, name) => {
    const link = document.createElement('a');
    link.href = resolveMediaUrl(url);
    link.download = name || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // View user document
  const viewUserDocument = (url) => {
    const resolvedUrl = resolveMediaUrl(url);
    window.open(resolvedUrl, '_blank');
  };

  const handleMenuClick = (event, application) => {
    setMenuAnchor(event.currentTarget)
    setSelectedApplication(application)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setSelectedApplication(null)
  }

  const handleViewDetails = () => {
    setDetailsOpen(true)
    handleMenuClose()
  }

  const handleSearch = (event) => {
    setSearchTerm(event.target.value)
  }

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items
    
    const term = searchTerm.toLowerCase()
    return items.filter(app => 
      (app.userId?.name && app.userId.name.toLowerCase().includes(term)) ||
      (app.userId?.email && app.userId.email.toLowerCase().includes(term)) ||
      (app.petId?.name && app.petId.name.toLowerCase().includes(term)) ||
      (app.petId?.breed && app.petId.breed.toLowerCase().includes(term))
    )
  }, [items, searchTerm])

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Adoption Applications
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage and review adoption applications from potential pet owners
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button 
            variant="outlined" 
            startIcon={<FilterListIcon />} 
            onClick={() => {}}
          >
            Advanced Filters
          </Button>
          <Button 
            variant="contained" 
            startIcon={<DownloadIcon />} 
            onClick={() => {}}
          >
            Export Data
          </Button>
        </Box>
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
              placeholder="Search by applicant name, email, pet name, or breed..."
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
            onChange={(e, newValue) => setStatusFilter(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All Applications" value="all" />
            <Tab label="Pending" value="pending" />
            <Tab label="Approved" value="approved" />
            <Tab label="Rejected" value="rejected" />
            <Tab label="Payment Pending" value="payment_pending" />
            <Tab label="Completed" value="completed" />
          </Tabs>
        </CardContent>
      </Card>

      {/* Applications List */}
      {loading ? (
        <Typography>Loading applications...</Typography>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <AssignmentIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>No Applications Found</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {searchTerm || statusFilter !== 'all' 
                ? 'No applications match your search criteria.' 
                : 'No adoption applications have been submitted yet.'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredItems.map((app) => (
            <Grid item xs={12} key={app._id}>
              <Card sx={{ 
                borderLeft: 4, 
                borderLeftColor: app.status === 'pending' ? 'warning.main' : 
                                app.status === 'approved' ? 'info.main' : 
                                app.status === 'rejected' ? 'error.main' : 
                                app.status === 'completed' ? 'success.main' : 'grey.400',
                '&:hover': { boxShadow: 3 }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.light' }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {app.userId?.name || 'Applicant'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {app.userId?.email || 'No email provided'}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StatusChip value={app.status} />
                      <IconButton size="small" onClick={(e) => handleMenuClick(e, app)}>
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.light' }}>
                          <PetsIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {app.petId?.name || 'Pet'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {app.petId?.breed || 'Breed not specified'}
                          </Typography>
                          {app.petId?.petCode && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Code: {app.petId.petCode}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          <strong>Applied:</strong> {new Date(app.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MoneyIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          <strong>Fee:</strong> ₹{app.petId?.adoptionFee || 0}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DescriptionIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="body2" component="span">
                            <strong>Payment:</strong>
                          </Typography>
                          {getPaymentStatusChip(app.paymentStatus)}
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {/* Additional Pet Information */}
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          <strong>Age:</strong> {app.petId?.ageDisplay || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PetsIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          <strong>Gender:</strong> {app.petId?.gender ? app.petId.gender.charAt(0).toUpperCase() + app.petId.gender.slice(1) : 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          <strong>Health:</strong> {app.petId?.healthStatus ? app.petId.healthStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'flex-end' }}>
                    <Button 
                      size="small" 
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      onClick={() => {
                        setSelectedApplication(app)
                        setDetailsOpen(true)
                      }}
                    >
                      View Details
                    </Button>
                    {app.status === 'pending' && (
                      <>
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="success" 
                          disabled={actionLoadingId === app._id} 
                          onClick={() => approveApplication(app._id)}
                        >
                          {actionLoadingId === app._id ? 'Approving...' : 'Approve'}
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="error"
                          disabled={actionLoadingId === app._id} 
                          onClick={() => rejectApplication(app._id)}
                        >
                          {actionLoadingId === app._id ? 'Rejecting...' : 'Reject'}
                        </Button>
                      </>
                    )}
                    {app.paymentStatus === 'completed' && (
                      <>
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="success" 
                          disabled={actionLoadingId === app._id} 
                          onClick={() => generateCertificate(app._id)} 
                          startIcon={<DownloadIcon />}
                        >
                          {actionLoadingId === app._id ? 'Generating...' : 'Generate Certificate'}
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          disabled={actionLoadingId === app._id} 
                          onClick={() => viewCertificate(app._id, app.contractURL)}
                          startIcon={<ViewIcon />}
                        >
                          {actionLoadingId === app._id ? 'Opening...' : 'View Certificate'}
                        </Button>
                      </>
                    )}
                    <Button 
                      size="small" 
                      variant="contained"
                      sx={{
                        backgroundColor: '#3b82f6',
                        '&:hover': {
                          backgroundColor: '#2563eb'
                        }
                      }}
                      onClick={() => navigate(`/manager/adoption/applications/${app._id}`)}
                    >
                      <ManageAccountsIcon sx={{ mr: 1 }} />
                      Manage
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 3 }}>
        <Typography variant="caption" color="text.secondary">Total: {total}</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small">
            <Select value={limit} onChange={(e)=>{ setLimit(Number(e.target.value)); setPage(1); }}>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </FormControl>
          <Pagination count={totalPages} page={page} onChange={(_,p)=>setPage(p)} size="small" />
        </Stack>
      </Stack>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <ViewIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
      </Menu>

      {/* Application Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" component="div">
              Application Details
            </Typography>
            {selectedApplication && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip 
                  label={
                    selectedApplication.status === 'pending' ? 'Pending Review' :
                    selectedApplication.status === 'approved' ? 'Approved' :
                    selectedApplication.status === 'rejected' ? 'Rejected' :
                    selectedApplication.status === 'completed' ? 'Completed' :
                    selectedApplication.status
                  } 
                  color={
                    selectedApplication.status === 'pending' ? 'warning' :
                    selectedApplication.status === 'approved' ? 'info' :
                    selectedApplication.status === 'rejected' ? 'error' :
                    selectedApplication.status === 'completed' ? 'success' : 'default'
                  } 
                  size="small"
                />
                <Chip 
                  label={
                    selectedApplication.paymentStatus === 'pending' ? 'Payment Pending' :
                    selectedApplication.paymentStatus === 'processing' ? 'Processing' :
                    selectedApplication.paymentStatus === 'completed' ? 'Payment Completed' :
                    selectedApplication.paymentStatus === 'failed' ? 'Payment Failed' :
                    selectedApplication.paymentStatus
                  } 
                  color={
                    selectedApplication.paymentStatus === 'pending' ? 'default' :
                    selectedApplication.paymentStatus === 'processing' ? 'warning' :
                    selectedApplication.paymentStatus === 'completed' ? 'success' :
                    selectedApplication.paymentStatus === 'failed' ? 'error' : 'default'
                  } 
                  size="small"
                />
                {selectedApplication.handover?.status && (
                  <Chip 
                    label={
                      selectedApplication.handover.status === 'none' ? 'Not Scheduled' :
                      selectedApplication.handover.status === 'scheduled' ? 'Scheduled' :
                      selectedApplication.handover.status === 'completed' ? 'Completed' :
                      selectedApplication.handover.status
                    } 
                    color={
                      selectedApplication.handover.status === 'none' ? 'default' :
                      selectedApplication.handover.status === 'scheduled' ? 'info' :
                      selectedApplication.handover.status === 'completed' ? 'success' : 'default'
                    } 
                    size="small"
                  />
                )}
              </Box>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box sx={{ py: 2 }}>
              <Grid container spacing={4}>
                {/* Applicant Information */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
                        <PersonIcon />
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Applicant Information
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">Name:</Typography>
                          <Typography variant="body2" fontWeight={500}>{selectedApplication.userId?.name || '-'}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DescriptionIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">Email:</Typography>
                          <Typography variant="body2" fontWeight={500}>{selectedApplication.userId?.email || '-'}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">Application Date:</Typography>
                          <Typography variant="body2" fontWeight={500}>{new Date(selectedApplication.createdAt).toLocaleDateString()}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AssignmentIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">Application ID:</Typography>
                          <Typography variant="body2" fontWeight={500} sx={{ fontFamily: 'monospace' }}>#{selectedApplication._id?.slice(-8)}</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                        
                {/* Pet Information */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Avatar sx={{ bgcolor: 'secondary.light', mr: 2 }}>
                        <PetsIcon />
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Pet Information
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Name:</Typography>
                          <Typography variant="body2" fontWeight={500}>{selectedApplication.petId?.name || '-'}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Breed:</Typography>
                          <Typography variant="body2" fontWeight={500}>{selectedApplication.petId?.breed || '-'}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Species:</Typography>
                          <Typography variant="body2" fontWeight={500}>{selectedApplication.petId?.species || '-'}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Age:</Typography>
                          <Typography variant="body2" fontWeight={500}>{selectedApplication.petId?.ageDisplay || 'N/A'}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Gender:</Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {selectedApplication.petId?.gender ? 
                              selectedApplication.petId.gender.charAt(0).toUpperCase() + selectedApplication.petId.gender.slice(1) : 
                              'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Health Status:</Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {selectedApplication.petId?.healthStatus ? 
                              selectedApplication.petId.healthStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
                              'N/A'}
                          </Typography>
                        </Box>
                      </Grid>
                      {selectedApplication.petId?.petCode && (
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Pet Code:</Typography>
                            <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                              {selectedApplication.petId.petCode}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Adoption Fee:</Typography>
                          <Typography variant="body2" fontWeight={500}>₹{selectedApplication.petId?.adoptionFee || 0}</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                        
                {/* Status Information */}
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Status Overview</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" color="text.secondary" component="div" sx={{ mb: 1 }}>Application Status</Typography>
                          <Box sx={{ mt: 'auto' }}>
                            <StatusChip value={selectedApplication.status} />
                          </Box>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" color="text.secondary" component="div" sx={{ mb: 1 }}>Payment Status</Typography>
                          <Box sx={{ mt: 'auto' }}>
                            {getPaymentStatusChip(selectedApplication.paymentStatus)}
                          </Box>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" color="text.secondary" component="div" sx={{ mb: 1 }}>Handover Status</Typography>
                          <Box sx={{ mt: 'auto' }}>
                            {selectedApplication.handover?.status ? (
                              <Chip 
                                label={
                                  selectedApplication.handover.status === 'none' ? 'Not Scheduled' :
                                  selectedApplication.handover.status === 'scheduled' ? 'Scheduled' :
                                  selectedApplication.handover.status === 'completed' ? 'Completed' :
                                  selectedApplication.handover.status
                                } 
                                color={
                                  selectedApplication.handover.status === 'none' ? 'default' :
                                  selectedApplication.handover.status === 'scheduled' ? 'info' :
                                  selectedApplication.handover.status === 'completed' ? 'success' : 'default'
                                } 
                                size="small"
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">N/A</Typography>
                            )}
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* User Documents */}
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>User Documents</Typography>
                    {(selectedApplication.documents && selectedApplication.documents.length > 0) || 
                     (selectedApplication.applicationData && selectedApplication.applicationData.documents && selectedApplication.applicationData.documents.length > 0) ? (
                      <Grid container spacing={2}>
                        {[...(selectedApplication.documents || []), ...(selectedApplication.applicationData?.documents || [])].map((doc, index) => {
                          const docObj = typeof doc === 'string' ? { url: doc } : doc;
                          const url = resolveMediaUrl(docObj.url);
                          const type = docObj.type || (url.match(/\.(pdf|doc|docx)$/i) ? 'application/' + (url.match(/\.pdf$/i) ? 'pdf' : url.match(/\.docx$/i) ? 'vnd.openxmlformats-officedocument.wordprocessingml.document' : 'msword') : 'image');
                          
                          return (
                            <Grid item xs={12} sm={6} md={4} key={`user-doc-${index}`}>
                              <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  {type === 'application/pdf' ? (
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'red.100', color: 'red.600', mr: 1 }}>
                                      <DescriptionIcon sx={{ fontSize: 16 }} />
                                    </Avatar>
                                  ) : type.startsWith('image') ? (
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'blue.100', color: 'blue.600', mr: 1 }}>
                                      <ImageIcon sx={{ fontSize: 16 }} />
                                    </Avatar>
                                  ) : (
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.100', color: 'grey.600', mr: 1 }}>
                                      <InsertDriveFileIcon sx={{ fontSize: 16 }} />
                                    </Avatar>
                                  )}
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {docObj.name || `Document ${index + 1}`}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {type.split('/')[1]?.toUpperCase() || 'FILE'}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                                  <Button 
                                    size="small" 
                                    variant="outlined" 
                                    startIcon={<VisibilityIcon />} 
                                    onClick={() => viewUserDocument(docObj.url)}
                                    sx={{ flex: 1 }}
                                  >
                                    View
                                  </Button>
                                  <Button 
                                    size="small" 
                                    variant="contained" 
                                    startIcon={<DownloadIcon />} 
                                    onClick={() => downloadUserDocument(docObj.url, docObj.name || `user-document-${index + 1}`)}
                                    sx={{ flex: 1 }}
                                  >
                                    Download
                                  </Button>
                                </Box>
                              </Paper>
                            </Grid>
                          );
                        })}
                      </Grid>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <DescriptionIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">No documents uploaded by the applicant</Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'background.paper' }}>
          <Button onClick={() => setDetailsOpen(false)} sx={{ mr: 1 }}>
            Close
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setDetailsOpen(false)
              navigate(`/manager/adoption/applications/${selectedApplication._id}`)}
            }
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': {
                backgroundColor: '#2563eb'
              }
            }}
          >
            <ManageAccountsIcon sx={{ mr: 1 }} />
            Manage Application
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ApplicationsList