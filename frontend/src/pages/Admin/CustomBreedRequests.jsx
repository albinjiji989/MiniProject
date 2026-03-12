import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Stack,
  Divider,
  Tooltip,
  alpha,
  Breadcrumbs,
  Link,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Person as PersonIcon,
  Pets as PetsIcon,
  Assignment as AssignmentIcon,
  Store as StoreIcon,
  Favorite as AdoptionIcon,
  Dashboard as DashboardIcon,
  NavigateNext as NavigateNextIcon,
  Info as InfoIcon,
  Verified as VerifiedIcon,
  PendingActions as PendingIcon,
  Error as ErrorIcon,
} from '@mui/icons-material'
import { customBreedRequestsAPI, speciesAPI } from '../../services/petSystemAPI'
import { useNavigate } from 'react-router-dom'

const CustomBreedRequests = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [species, setSpecies] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  
  // Dialog states
  const [approveDialog, setApproveDialog] = useState(false)
  const [rejectDialog, setRejectDialog] = useState(false)
  const [viewDialog, setViewDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [requestsRes, speciesRes] = await Promise.all([
        customBreedRequestsAPI.getAll(),
        speciesAPI.getAll()
      ])

      setRequests(requestsRes.data?.data || requestsRes.data || [])
      setSpecies(speciesRes.data?.data || speciesRes.data || [])
    } catch (err) {
      setError('Failed to load requests data')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveClick = (request) => {
    setSelectedRequest(request)
    setApproveDialog(true)
    setAdminNotes('')
  }

  const handleRejectClick = (request) => {
    setSelectedRequest(request)
    setRejectDialog(true)
    setAdminNotes('')
  }

  const handleApproveConfirm = async () => {
    try {
      const requestName = selectedRequest.requestType === 'species' 
        ? (selectedRequest.speciesDisplayName || selectedRequest.speciesName)
        : selectedRequest.breedName
        
      await customBreedRequestsAPI.approve(selectedRequest._id, {
        adminNotes: adminNotes
      })
      loadInitialData()
      setApproveDialog(false)
      setSelectedRequest(null)
      setSuccess(`${selectedRequest.requestType === 'species' ? 'Species' : 'Breed'} "${requestName}" approved successfully!`)
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError('Failed to approve request')
      setTimeout(() => setError(''), 5000)
    }
  }

  const handleRejectConfirm = async () => {
    if (!adminNotes.trim()) {
      setError('Please provide a reason for rejection')
      return
    }
    
    try {
      await customBreedRequestsAPI.reject(selectedRequest._id, {
        rejectionReason: adminNotes,
        adminNotes: adminNotes
      })
      loadInitialData()
      setRejectDialog(false)
      setSelectedRequest(null)
      setSuccess('Request rejected successfully')
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError('Failed to reject request')
      setTimeout(() => setError(''), 5000)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error'
    }
    return colors[status] || 'default'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <VerifiedIcon />
      case 'rejected': return <ErrorIcon />
      case 'pending': return <PendingIcon />
      default: return <InfoIcon />
    }
  }
  const getSourceIcon = (source) => {
    if (source?.includes('adoption')) return <AdoptionIcon />
    if (source?.includes('petshop')) return <StoreIcon />
    return <PersonIcon />
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredRequests = requests.filter(request => {
    const requestName = request.requestType === 'species' 
      ? (request.speciesDisplayName || request.speciesName)
      : request.breedName
    const requestDesc = request.requestType === 'species'
      ? request.speciesDescription
      : request.breedDescription
      
    if (searchTerm && !requestName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !requestDesc?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    if (statusFilter && request.status !== statusFilter) {
      return false
    }
    if (typeFilter && request.requestType !== typeFilter) {
      return false
    }
    if (sourceFilter) {
      const requesterRole = request.requestedBy?.role || request.requester?.role || ''
      if (sourceFilter === 'adoption' && !requesterRole.includes('adoption')) return false
      if (sourceFilter === 'petshop' && !requesterRole.includes('petshop')) return false
    }
    return true
  })

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    species: requests.filter(r => r.requestType === 'species').length,
    breed: requests.filter(r => r.requestType === 'breed').length
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
          <Link color="inherit" href="/admin/dashboard" sx={{ display: 'flex', alignItems: 'center' }}>
            <DashboardIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Admin
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
            <AssignmentIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Breed & Species Requests
          </Typography>
        </Breadcrumbs>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              🧬 Breed & Species Requests
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Review and manage custom breed and species requests from adoption and pet shop managers
            </Typography>
          </Box>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.pending}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.approved}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Approved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.rejected}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Rejected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.species}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Species
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', color: '#333' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.breed}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Breeds
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4} md={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  label="Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="species">Species</MenuItem>
                  <MenuItem value="breed">Breed</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4} md={2}>
              <FormControl fullWidth>
                <InputLabel>Source</InputLabel>
                <Select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  label="Source"
                >
                  <MenuItem value="">All Sources</MenuItem>
                  <MenuItem value="adoption">Adoption Manager</MenuItem>
                  <MenuItem value="petshop">Pet Shop Manager</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('')
                  setTypeFilter('')
                  setSourceFilter('')
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Requests ({filteredRequests.length})
            </Typography>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Species</TableCell>
                      <TableCell>Requester</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Requested</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRequests.map((request) => {
                      const requestName = request.requestType === 'species' 
                        ? (request.speciesDisplayName || request.speciesName)
                        : request.breedName
                      const requestDesc = request.requestType === 'species'
                        ? request.speciesDescription
                        : request.breedDescription
                      const requester = request.requestedBy
                      
                      return (
                      <TableRow 
                        key={request._id} 
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedRequest(request)
                          setViewDialog(true)
                        }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ bgcolor: request.requestType === 'species' ? 'primary.main' : 'secondary.main', width: 32, height: 32 }}>
                              {request.requestType === 'species' ? <PetsIcon fontSize="small" /> : <AssignmentIcon fontSize="small" />}
                            </Avatar>
                            <Typography variant="body2" sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
                              {request.requestType}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" fontWeight="bold">
                            {requestName || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {request.speciesId?.displayName || request.speciesId?.name || (request.requestType === 'species' ? '-' : 'N/A')}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getSourceIcon(requester?.role)}
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {requester?.name || 'N/A'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {requester?.role?.replace('_', ' ') || 'N/A'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={requestDesc || request.reason || 'No description'}>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {requestDesc || request.reason || 'N/A'}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(request.status)}
                            label={request.status}
                            color={getStatusColor(request.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(request.submittedAt || request.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {request.status === 'pending' && (
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <Tooltip title="Approve">
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleApproveClick(request)
                                  }}
                                  size="small"
                                  color="success"
                                >
                                  <CheckCircleIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRejectClick(request)
                                  }}
                                  size="small"
                                  color="error"
                                >
                                  <CancelIcon />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          )}
                          {request.status !== 'pending' && (
                            <Typography variant="caption" color="text.secondary">
                              {request.status === 'approved' ? 'Approved' : 'Rejected'}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              </TableContainer>

              {filteredRequests.length === 0 && (
                <Box textAlign="center" py={4}>
                  <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary">
                    No requests found
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {searchTerm || statusFilter || typeFilter || sourceFilter
                      ? 'Try adjusting your filters'
                      : 'Requests from managers will appear here'}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <InfoIcon color="primary" />
              <Typography variant="h6">Request Details</Typography>
            </Box>
            <Chip
              icon={getStatusIcon(selectedRequest?.status)}
              label={selectedRequest?.status}
              color={getStatusColor(selectedRequest?.status)}
              size="small"
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Request Type & Name */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: alpha('#2196f3', 0.1) }}>
                <Typography variant="caption" color="text.secondary">Request Type</Typography>
                <Box display="flex" alignItems="center" gap={1} mt={1}>
                  <Avatar sx={{ bgcolor: selectedRequest?.requestType === 'species' ? 'primary.main' : 'secondary.main', width: 32, height: 32 }}>
                    {selectedRequest?.requestType === 'species' ? <PetsIcon fontSize="small" /> : <AssignmentIcon fontSize="small" />}
                  </Avatar>
                  <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                    {selectedRequest?.requestType}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: alpha('#4caf50', 0.1) }}>
                <Typography variant="caption" color="text.secondary">Name</Typography>
                <Typography variant="h6" mt={1}>
                  {selectedRequest?.requestType === 'species' 
                    ? (selectedRequest?.speciesDisplayName || selectedRequest?.speciesName)
                    : selectedRequest?.breedName}
                </Typography>
              </Paper>
            </Grid>

            {/* Species (for breed requests) */}
            {selectedRequest?.requestType === 'breed' && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: alpha('#ff9800', 0.1) }}>
                  <Typography variant="caption" color="text.secondary">Parent Species</Typography>
                  <Typography variant="body1" mt={1} fontWeight="bold">
                    {selectedRequest?.speciesId?.displayName || selectedRequest?.speciesId?.name || 'Not specified'}
                  </Typography>
                </Paper>
              </Grid>
            )}

            {/* Description */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: alpha('#9c27b0', 0.1) }}>
                <Typography variant="caption" color="text.secondary">Description / Reason</Typography>
                <Typography variant="body1" mt={1}>
                  {selectedRequest?.requestType === 'species'
                    ? selectedRequest?.speciesDescription
                    : selectedRequest?.breedDescription || selectedRequest?.reason || 'No description provided'}
                </Typography>
              </Paper>
            </Grid>

            {/* Requester Info */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: alpha('#00bcd4', 0.1) }}>
                <Typography variant="caption" color="text.secondary">Requested By</Typography>
                <Box display="flex" alignItems="center" gap={1} mt={1}>
                  {getSourceIcon(selectedRequest?.requestedBy?.role)}
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {selectedRequest?.requestedBy?.name || 'Unknown'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedRequest?.requestedBy?.role?.replace('_', ' ') || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
                {selectedRequest?.requestedBy?.email && (
                  <Typography variant="caption" display="block" mt={1}>
                    {selectedRequest?.requestedBy?.email}
                  </Typography>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: alpha('#795548', 0.1) }}>
                <Typography variant="caption" color="text.secondary">Submitted Date</Typography>
                <Typography variant="body1" mt={1} fontWeight="bold">
                  {formatDate(selectedRequest?.submittedAt || selectedRequest?.createdAt)}
                </Typography>
              </Paper>
            </Grid>

            {/* Admin Notes (if any) */}
            {selectedRequest?.adminNotes && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: alpha('#f44336', 0.1) }}>
                  <Typography variant="caption" color="text.secondary">Admin Notes</Typography>
                  <Typography variant="body1" mt={1}>
                    {selectedRequest?.adminNotes}
                  </Typography>
                </Paper>
              </Grid>
            )}

            {/* Rejection Reason (if rejected) */}
            {selectedRequest?.rejectionReason && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: alpha('#f44336', 0.1) }}>
                  <Typography variant="caption" color="text.secondary">Rejection Reason</Typography>
                  <Typography variant="body1" mt={1}>
                    {selectedRequest?.rejectionReason}
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
          {selectedRequest?.status === 'pending' && (
            <>
              <Button 
                onClick={() => {
                  setViewDialog(false)
                  handleRejectClick(selectedRequest)
                }}
                color="error" 
                variant="outlined"
                startIcon={<CancelIcon />}
              >
                Reject
              </Button>
              <Button 
                onClick={() => {
                  setViewDialog(false)
                  handleApproveClick(selectedRequest)
                }}
                color="success" 
                variant="contained"
                startIcon={<CheckCircleIcon />}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialog} onClose={() => setApproveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircleIcon color="success" />
            <Typography variant="h6">Approve Request</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to approve this request?
          </Typography>
          
          <Paper sx={{ p: 2, bgcolor: alpha('#4caf50', 0.1), mb: 2 }}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Type</Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                  {selectedRequest?.requestType}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Name</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {selectedRequest?.requestType === 'species' 
                    ? (selectedRequest?.speciesDisplayName || selectedRequest?.speciesName)
                    : selectedRequest?.breedName}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Description</Typography>
                <Typography variant="body2">
                  {selectedRequest?.requestType === 'species'
                    ? selectedRequest?.speciesDescription
                    : selectedRequest?.breedDescription || selectedRequest?.reason || 'No description provided'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <TextField
            fullWidth
            label="Admin Notes (Optional)"
            multiline
            rows={3}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Add any notes about the approval..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog(false)}>Cancel</Button>
          <Button onClick={handleApproveConfirm} color="success" variant="contained" startIcon={<CheckCircleIcon />}>
            Approve Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CancelIcon color="error" />
            <Typography variant="h6">Reject Request</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to reject this request?
          </Typography>
          
          <Paper sx={{ p: 2, bgcolor: alpha('#f44336', 0.1), mb: 2 }}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Type</Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                  {selectedRequest?.requestType}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Name</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {selectedRequest?.requestType === 'species' 
                    ? (selectedRequest?.speciesDisplayName || selectedRequest?.speciesName)
                    : selectedRequest?.breedName}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Description</Typography>
                <Typography variant="body2">
                  {selectedRequest?.requestType === 'species'
                    ? selectedRequest?.speciesDescription
                    : selectedRequest?.breedDescription || selectedRequest?.reason || 'No description provided'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <TextField
            fullWidth
            label="Rejection Reason (Required)"
            multiline
            rows={3}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Please provide a reason for rejection..."
            required
            error={!adminNotes.trim()}
            helperText={!adminNotes.trim() ? 'Rejection reason is required' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleRejectConfirm} 
            color="error" 
            variant="contained"
            disabled={!adminNotes.trim()}
            startIcon={<CancelIcon />}
          >
            Reject Request
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default CustomBreedRequests
