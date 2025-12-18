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
  Download as DownloadIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Pets as PetsIcon
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
          fields: 'status,paymentStatus,contractURL,userId.name,userId.email,petId.name,petId.breed,petId.species,petId.age,petId.ageUnit,petId.ageDisplay,petId.gender,petId.healthStatus,petId.adoptionFee,createdAt', 
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
          adoptionFee: app.petId.adoptionFee 
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Adoption Applications
        </Typography>
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
                      onClick={() => navigate(`/manager/adoption/applications/${app._id}`)}
                    >
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
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div">
              Application Details
            </Typography>
            {selectedApplication && (
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
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box sx={{ py: 2 }}>
              <Grid container spacing={3}>
                {/* Applicant Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Applicant Information</Typography>
                  <Box sx={{ display: 'grid', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">Name:</Typography>
                      <Typography variant="body2">{selectedApplication.userId?.name || '-'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DescriptionIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">Email:</Typography>
                      <Typography variant="body2">{selectedApplication.userId?.email || '-'}</Typography>
                    </Box>
                  </Box>
                </Grid>
                
                {/* Pet Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Pet Information</Typography>
                  <Box sx={{ display: 'grid', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Name:</Typography>
                      <Typography variant="body2">{selectedApplication.petId?.name || '-'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Breed:</Typography>
                      <Typography variant="body2">{selectedApplication.petId?.breed || '-'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Species:</Typography>
                      <Typography variant="body2">{selectedApplication.petId?.species || '-'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Age:</Typography>
                      <Typography variant="body2">{selectedApplication.petId?.ageDisplay || 'N/A'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Gender:</Typography>
                      <Typography variant="body2">
                        {selectedApplication.petId?.gender ? 
                          selectedApplication.petId.gender.charAt(0).toUpperCase() + selectedApplication.petId.gender.slice(1) : 
                          'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Health Status:</Typography>
                      <Typography variant="body2">
                        {selectedApplication.petId?.healthStatus ? 
                          selectedApplication.petId.healthStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
                          'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Adoption Fee:</Typography>
                      <Typography variant="body2">₹{selectedApplication.petId?.adoptionFee || 0}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Application Date:</Typography>
                      <Typography variant="body2">{new Date(selectedApplication.createdAt).toLocaleDateString()}</Typography>
                    </Box>
                  </Box>
                </Grid>
                
                {/* Status Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Status Information</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary" component="span">Application Status:</Typography>
                        <StatusChip value={selectedApplication.status} />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary" component="span">Payment Status:</Typography>
                        {getPaymentStatusChip(selectedApplication.paymentStatus)}
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setDetailsOpen(false)
              navigate(`/manager/adoption/applications/${selectedApplication._id}`)
            }}
          >
            Manage Application
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ApplicationsList