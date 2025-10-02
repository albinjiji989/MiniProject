import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  Divider,
} from '@mui/material'
import {
  Pets as PetsIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { speciesAPI, breedsAPI, petsAPI, customBreedRequestsAPI } from '../../../services/petSystemAPI'

const PetManagementOverview = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    species: 0,
    breeds: 0,
    pets: 0,
    pendingRequests: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [speciesRes, breedsRes, petsRes, requestsRes] = await Promise.all([
        speciesAPI.getStats(),
        breedsAPI.getStats(),
        petsAPI.getStats(),
        customBreedRequestsAPI.getStats(),
      ])

      setStats({
        species: speciesRes.data?.total || 0,
        breeds: breedsRes.data?.total || 0,
        pets: petsRes.data?.total || 0,
        pendingRequests: requestsRes.data?.pending || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    {
      label: 'Setup Master Data',
      description: 'Configure species and breeds that will be available for pet registration',
      actions: [
        { label: 'Manage Species', path: '/admin/species', icon: <PetsIcon /> },
        { label: 'Manage Breeds', path: '/admin/breeds', icon: <PetsIcon /> },
      ],
      completed: stats.species > 0 && stats.breeds > 0,
      required: true,
    },
    {
      label: 'Review Custom Requests',
      description: 'Approve or reject user requests for new species and breeds',
      actions: [
        { label: 'Custom Requests', path: '/admin/custom-breed-requests', icon: <AssignmentIcon /> },
      ],
      completed: stats.pendingRequests === 0,
      required: false,
    },
    {
      label: 'Manage Pets',
      description: 'Add, edit, and manage individual pet records',
      actions: [
        { label: 'All Pets', path: '/admin/pets', icon: <PetsIcon /> },
        { label: 'Add New Pet', path: '/admin/pets/add', icon: <AddIcon /> },
        { label: 'Import Pets', path: '/admin/pets/import', icon: <AssignmentIcon /> },
      ],
      completed: stats.pets > 0,
      required: true,
    },
    {
      label: 'Track Pet History',
      description: 'Monitor medical records and ownership history',
      actions: [
        { label: 'Medical Records', path: '/admin/medical-records', icon: <AssignmentIcon /> },
        { label: 'Ownership History', path: '/admin/ownership-history', icon: <AssignmentIcon /> },
      ],
      completed: true,
      required: false,
    },
  ]

  const getStepIcon = (step, index) => {
    if (step.completed) {
      return <CheckCircleIcon color="success" />
    }
    if (step.required && !step.completed) {
      return <WarningIcon color="warning" />
    }
    return <InfoIcon color="info" />
  }

  const getStepColor = (step) => {
    if (step.completed) return 'success'
    if (step.required && !step.completed) return 'warning'
    return 'info'
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Pet Management System Overview
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Follow this logical workflow to set up and manage your pet welfare system effectively.
      </Typography>

      {/* System Status */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PetsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {stats.species}
                </Typography>
              </Box>
              <Typography color="text.secondary" variant="body2">
                Species
              </Typography>
              <Chip
                label={stats.species > 0 ? 'Configured' : 'Setup Required'}
                size="small"
                color={stats.species > 0 ? 'success' : 'warning'}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PetsIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {stats.breeds}
                </Typography>
              </Box>
              <Typography color="text.secondary" variant="body2">
                Breeds
              </Typography>
              <Chip
                label={stats.breeds > 0 ? 'Configured' : 'Setup Required'}
                size="small"
                color={stats.breeds > 0 ? 'success' : 'warning'}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PetsIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {stats.pets}
                </Typography>
              </Box>
              <Typography color="text.secondary" variant="body2">
                Total Pets
              </Typography>
              <Chip
                label={stats.pets > 0 ? 'Active' : 'No Pets Yet'}
                size="small"
                color={stats.pets > 0 ? 'success' : 'default'}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssignmentIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {stats.pendingRequests}
                </Typography>
              </Box>
              <Typography color="text.secondary" variant="body2">
                Pending Requests
              </Typography>
              <Chip
                label={stats.pendingRequests > 0 ? 'Needs Review' : 'All Clear'}
                size="small"
                color={stats.pendingRequests > 0 ? 'warning' : 'success'}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Setup Workflow */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Setup Workflow
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Follow these steps in order to set up your pet management system properly.
        </Typography>

        <Stepper orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label} completed={step.completed}>
              <StepLabel
                StepIconComponent={() => getStepIcon(step, index)}
                color={getStepColor(step)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {step.label}
                  {step.required && (
                    <Chip label="Required" size="small" color="primary" variant="outlined" />
                  )}
                </Box>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {step.description}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {step.actions.map((action) => (
                    <Button
                      key={action.label}
                      variant="outlined"
                      size="small"
                      startIcon={action.icon}
                      onClick={() => navigate(action.path)}
                      sx={{ mb: 1 }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </Box>

                {index < steps.length - 1 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                    <ArrowForwardIcon sx={{ mr: 1 }} />
                    <Typography variant="caption">
                      Complete this step to proceed to the next
                    </Typography>
                  </Box>
                )}
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Quick Actions */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Quick Actions
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<PetsIcon />}
              onClick={() => navigate('/admin/pets')}
              sx={{ py: 1.5 }}
            >
              View All Pets
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => navigate('/admin/pets/add')}
              sx={{ py: 1.5 }}
            >
              Add New Pet
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => navigate('/admin/species')}
              sx={{ py: 1.5 }}
            >
              Manage Species
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AssignmentIcon />}
              onClick={() => navigate('/admin/custom-breed-requests')}
              sx={{ py: 1.5 }}
            >
              Review Requests
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* System Recommendations */}
      {stats.species === 0 && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            System Setup Required
          </Typography>
          <Typography variant="body2">
            You need to add at least one species before you can start managing pets. 
            Click "Manage Species" to get started.
          </Typography>
        </Alert>
      )}

      {stats.pendingRequests > 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Pending Requests
          </Typography>
          <Typography variant="body2">
            You have {stats.pendingRequests} pending custom breed/species requests that need your review.
          </Typography>
        </Alert>
      )}
    </Box>
  )
}

export default PetManagementOverview
