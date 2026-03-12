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
  Alert,
  CircularProgress,
  Grid,
  Stack,
  Tooltip,
} from '@mui/material'
import {
  Add as AddIcon,
  Pets as PetsIcon,
  Assignment as AssignmentIcon,
  Verified as VerifiedIcon,
  PendingActions as PendingIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import { customBreedRequestsAPI } from '../../../services/petSystemAPI'
import BreedSpeciesRequestModal from '../../../components/Common/BreedSpeciesRequestModal'

const MyBreedRequests = () => {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showRequestModal, setShowRequestModal] = useState(false)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const response = await customBreedRequestsAPI.getMyRequests()
      const allRequests = response.data?.data || response.data || []
      setRequests(allRequests)
    } catch (err) {
      setError('Failed to load requests')
      console.error('Load requests error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestSuccess = () => {
    setSuccess('Request submitted successfully! Admin will review it.')
    setTimeout(() => setSuccess(''), 5000)
    loadRequests()
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              🧬 My Breed & Species Requests
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              View and manage your custom breed and species requests
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadRequests}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowRequestModal(true)}
            >
              New Request
            </Button>
          </Stack>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {stats.pending}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Pending Review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {stats.approved}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Approved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {stats.rejected}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Rejected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Requests Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              My Requests ({requests.length})
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
                      <TableCell>Description</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell>Admin Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {requests.map((request) => {
                      const requestName = request.requestType === 'species' 
                        ? (request.speciesDisplayName || request.speciesName)
                        : request.breedName
                      const requestDesc = request.requestType === 'species'
                        ? request.speciesDescription
                        : request.breedDescription
                        
                      return (
                      <TableRow key={request._id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {request.requestType === 'species' ? (
                              <Chip
                                icon={<PetsIcon />}
                                label="Species"
                                size="small"
                                color="primary"
                              />
                            ) : (
                              <Chip
                                icon={<AssignmentIcon />}
                                label="Breed"
                                size="small"
                                color="secondary"
                              />
                            )}
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
                        <TableCell>
                          {request.adminNotes ? (
                            <Tooltip title={request.adminNotes}>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                {request.adminNotes}
                              </Typography>
                            </Tooltip>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              </TableContainer>

              {requests.length === 0 && (
                <Box textAlign="center" py={4}>
                  <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    No requests yet
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    When you need a breed or species that's not in the system, submit a request here
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setShowRequestModal(true)}
                  >
                    Submit Your First Request
                  </Button>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Request Modal */}
      <BreedSpeciesRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={handleRequestSuccess}
      />
    </Container>
  )
}

export default MyBreedRequests
