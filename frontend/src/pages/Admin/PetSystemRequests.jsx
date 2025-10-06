import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Tabs,
  Tab,
  Badge
} from '@mui/material'
import {
  Visibility as ViewIcon,
  Check as ApproveIcon,
  Close as DeclineIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { apiClient } from '../../services/api'

const PetSystemRequests = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [viewDialog, setViewDialog] = useState(false)
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', request: null })
  const [declineReason, setDeclineReason] = useState('')
  const [currentTab, setCurrentTab] = useState(0)
  const [stats, setStats] = useState({})
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' })

  const statusFilters = ['all', 'pending', 'approved', 'declined']
  const statusColors = {
    pending: 'warning',
    approved: 'success',
    declined: 'error'
  }

  useEffect(() => {
    fetchRequests()
    fetchStats()
  }, [currentTab])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const status = statusFilters[currentTab] === 'all' ? '' : statusFilters[currentTab]
      const response = await apiClient.get('/admin/pet-system-requests', {
        params: { status, limit: 50 }
      })
      setRequests(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch requests:', error)
      showAlert('Failed to fetch requests', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/admin/pet-system-requests/stats/overview')
      setStats(response.data.data || {})
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleApprove = async (request) => {
    try {
      await apiClient.put(`/admin/pet-system-requests/${request._id}/approve`)
      showAlert('Request approved successfully', 'success')
      fetchRequests()
      fetchStats()
      setActionDialog({ open: false, type: '', request: null })
    } catch (error) {
      console.error('Failed to approve request:', error)
      showAlert(error.response?.data?.message || 'Failed to approve request', 'error')
    }
  }

  const handleDecline = async (request) => {
    try {
      await apiClient.put(`/admin/pet-system-requests/${request._id}/decline`, {
        reason: declineReason
      })
      showAlert('Request declined successfully', 'success')
      fetchRequests()
      fetchStats()
      setActionDialog({ open: false, type: '', request: null })
      setDeclineReason('')
    } catch (error) {
      console.error('Failed to decline request:', error)
      showAlert(error.response?.data?.message || 'Failed to decline request', 'error')
    }
  }

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity })
    setTimeout(() => setAlert({ open: false, message: '', severity: 'success' }), 5000)
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

  const getRequestTypeLabel = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  const renderRequestedData = (type, data) => {
    if (type === 'category') {
      return `Category: ${data.name || data.displayName || 'N/A'}`
    } else if (type === 'species') {
      return `Species: ${data.name || data.displayName || 'N/A'}${data.category ? ` (Category: ${data.category})` : ''}`
    } else if (type === 'breed') {
      return `Breed: ${data.name || data.displayName || 'N/A'}${data.species ? ` (Species: ${data.species})` : ''}`
    }
    return 'N/A'
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Pet System Requests
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => { fetchRequests(); fetchStats(); }}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Requests
              </Typography>
              <Typography variant="h4">
                {stats.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.pending || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Approved
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.approved || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Declined
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.declined || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label="All Requests" />
          <Tab 
            label={
              <Badge badgeContent={stats.pending || 0} color="warning">
                Pending
              </Badge>
            } 
          />
          <Tab label="Approved" />
          <Tab label="Declined" />
        </Tabs>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Requested Data</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell>
                        <Chip 
                          label={getRequestTypeLabel(request.type)} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {renderRequestedData(request.type, request.requestedData)}
                      </TableCell>
                      <TableCell>
                        {request.userId?.name || 'Unknown User'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={request.status.toUpperCase()} 
                          color={statusColors[request.status]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {formatDate(request.submittedAt)}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedRequest(request)
                            setViewDialog(true)
                          }}
                        >
                          <ViewIcon />
                        </IconButton>
                        {request.status === 'pending' && (
                          <>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => setActionDialog({ open: true, type: 'approve', request })}
                            >
                              <ApproveIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setActionDialog({ open: true, type: 'decline', request })}
                            >
                              <DeclineIcon />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Type</Typography>
                <Typography>{getRequestTypeLabel(selectedRequest.type)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Status</Typography>
                <Chip 
                  label={selectedRequest.status.toUpperCase()} 
                  color={statusColors[selectedRequest.status]}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">User</Typography>
                <Typography>{selectedRequest.userId?.name || 'Unknown'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Submitted</Typography>
                <Typography>{formatDate(selectedRequest.submittedAt)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Requested Data</Typography>
                <Typography>{renderRequestedData(selectedRequest.type, selectedRequest.requestedData)}</Typography>
              </Grid>
              {selectedRequest.explanation && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Explanation</Typography>
                  <Typography>{selectedRequest.explanation}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, type: '', request: null })}>
        <DialogTitle>
          {actionDialog.type === 'approve' ? 'Approve Request' : 'Decline Request'}
        </DialogTitle>
        <DialogContent>
          {actionDialog.type === 'approve' ? (
            <Typography>
              Are you sure you want to approve this request? This will create the requested {actionDialog.request?.type}.
            </Typography>
          ) : (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Decline Reason"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Please provide a reason for declining this request..."
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog({ open: false, type: '', request: null })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={actionDialog.type === 'approve' ? 'success' : 'error'}
            onClick={() => {
              if (actionDialog.type === 'approve') {
                handleApprove(actionDialog.request)
              } else {
                handleDecline(actionDialog.request)
              }
            }}
          >
            {actionDialog.type === 'approve' ? 'Approve' : 'Decline'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert */}
      {alert.open && (
        <Alert 
          severity={alert.severity}
          sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}
          onClose={() => setAlert({ open: false, message: '', severity: 'success' })}
        >
          {alert.message}
        </Alert>
      )}
    </Box>
  )
}

export default PetSystemRequests
