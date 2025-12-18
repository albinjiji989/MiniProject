import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Pets as PetsIcon,
  Add as AddIcon,
  FileUpload as ImportIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  LocalHospital as MedicalIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Source as SourceIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { petsAPI, speciesAPI, breedsAPI, customBreedRequestsAPI } from '../../../services/petSystemAPI'

const PetManagementDashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPets: 0,
    totalSpecies: 0,
    totalBreeds: 0,
    pendingRequests: 0,
    availablePets: 0,
    adoptedPets: 0,
  })
  const [recentPets, setRecentPets] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all statistics in parallel
      const [
        petsResponse,
        speciesResponse,
        breedsResponse,
        requestsResponse,
      ] = await Promise.all([
        petsAPI.getStats(),
        speciesAPI.getStats(),
        breedsAPI.getStats(),
        customBreedRequestsAPI.getStats(),
      ])

      // Calculate pet statistics
      const petsStats = petsResponse.data || {}
      const availablePets = petsStats.available || 0
      const adoptedPets = petsStats.adopted || 0
      const totalPets = petsStats.total || 0

      setStats({
        totalPets,
        totalSpecies: speciesResponse.data?.total || 0,
        totalBreeds: breedsResponse.data?.total || 0,
        pendingRequests: requestsResponse.data?.pending || 0,
        availablePets,
        adoptedPets,
      })

      // Fetch recent pets
      const recentPetsResponse = await petsAPI.list({ limit: 5, sort: '-createdAt' })
      setRecentPets(recentPetsResponse.data?.pets || [])

      // Fetch pending requests
      const pendingRequestsResponse = await customBreedRequestsAPI.list({ 
        status: 'pending', 
        limit: 5 
      })
      setPendingRequests(pendingRequestsResponse.data?.requests || [])

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchDashboardData()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success'
      case 'adopted': return 'info'
      case 'pending': return 'warning'
      case 'approved': return 'success'
      case 'rejected': return 'error'
      default: return 'default'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Available'
      case 'adopted': return 'Adopted'
      case 'pending': return 'Pending'
      case 'approved': return 'Approved'
      case 'rejected': return 'Rejected'
      default: return status
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Pet Management Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Pet Management Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/pets/add')}
          >
            Add New Pet
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PetsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  {stats.totalPets}
                </Typography>
              </Box>
              <Typography color="text.secondary" variant="body2">
                Total Pets
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PetsIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  {stats.availablePets}
                </Typography>
              </Box>
              <Typography color="text.secondary" variant="body2">
                Available
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PetsIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  {stats.adoptedPets}
                </Typography>
              </Box>
              <Typography color="text.secondary" variant="body2">
                Adopted
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PetsIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  {stats.totalSpecies}
                </Typography>
              </Box>
              <Typography color="text.secondary" variant="body2">
                Species
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PetsIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  {stats.totalBreeds}
                </Typography>
              </Box>
              <Typography color="text.secondary" variant="body2">
                Breeds
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssignmentIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  {stats.pendingRequests}
                </Typography>
              </Box>
              <Typography color="text.secondary" variant="body2">
                Pending Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ViewIcon />}
                    onClick={() => navigate('/admin/pets')}
                  >
                    View All Pets
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ImportIcon />}
                    onClick={() => navigate('/admin/pets/import')}
                  >
                    Import Pets
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PetsIcon />}
                    onClick={() => navigate('/admin/species')}
                  >
                    Manage Species
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<PetsIcon />}
                    onClick={() => navigate('/admin/breeds')}
                  >
                    Manage Breeds
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<SourceIcon />}
                    onClick={() => navigate('/admin/pet-registry')}
                  >
                    View Pet Registry
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Health
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Species Coverage</Typography>
                  <Typography variant="body2">
                    {stats.totalSpecies > 0 ? 'Good' : 'Setup Required'}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.totalSpecies > 0 ? 100 : 0} 
                  color={stats.totalSpecies > 0 ? 'success' : 'warning'}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Breed Coverage</Typography>
                  <Typography variant="body2">
                    {stats.totalBreeds > 0 ? 'Good' : 'Setup Required'}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.totalBreeds > 0 ? 100 : 0} 
                  color={stats.totalBreeds > 0 ? 'success' : 'warning'}
                />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Pending Requests</Typography>
                  <Typography variant="body2">
                    {stats.pendingRequests > 0 ? `${stats.pendingRequests} Pending` : 'All Clear'}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.pendingRequests > 0 ? Math.min(stats.pendingRequests * 20, 100) : 0} 
                  color={stats.pendingRequests > 0 ? 'warning' : 'success'}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Recent Pets
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/admin/pets')}
                >
                  View All
                </Button>
              </Box>
              {recentPets.length > 0 ? (
                <List>
                  {recentPets.map((pet, index) => (
                    <React.Fragment key={pet._id}>
                      <ListItem
                        sx={{ px: 0 }}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={() => navigate(`/admin/pets/${pet._id}`)}
                          >
                            <ViewIcon />
                          </IconButton>
                        }
                      >
                        <ListItemIcon>
                          <PetsIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${pet.name} (${pet.petId})`}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                {pet.species?.name} • {pet.breed?.name}
                              </Typography>
                              <Chip
                                label={getStatusText(pet.status)}
                                size="small"
                                color={getStatusColor(pet.status)}
                                variant="outlined"
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < recentPets.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No pets found
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Pending Requests
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/admin/custom-breed-requests')}
                >
                  View All
                </Button>
              </Box>
              {pendingRequests.length > 0 ? (
                <List>
                  {pendingRequests.map((request, index) => (
                    <React.Fragment key={request._id}>
                      <ListItem
                        sx={{ px: 0 }}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={() => navigate(`/admin/custom-breed-requests`)}
                          >
                            <ViewIcon />
                          </IconButton>
                        }
                      >
                        <ListItemIcon>
                          <AssignmentIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${request.type}: ${request.requestedName}`}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                By: {request.userId?.name || 'Unknown User'}
                              </Typography>
                              <Chip
                                label={getStatusText(request.status)}
                                size="small"
                                color={getStatusColor(request.status)}
                                variant="outlined"
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < pendingRequests.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No pending requests
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default PetManagementDashboard