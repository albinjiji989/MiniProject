import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
} from '@mui/material'
import {
  Assignment as AssignmentIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { customBreedRequestsAPI } from '../../../services/petSystemAPI'

const RequestBreed = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    type: 'breed',
    requestedName: '',
    description: '',
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.requestedName.trim()) {
      setError('Please enter the name of the breed or species you want to request.')
      return
    }

    if (!formData.description.trim()) {
      setError('Please provide a description for your request.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      await customBreedRequestsAPI.create(formData)
      setSubmitted(true)

    } catch (err) {
      console.error('Error submitting request:', err)
      setError(err.response?.data?.message || 'Failed to submit request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleNewRequest = () => {
    setSubmitted(false)
    setFormData({
      type: 'breed',
      requestedName: '',
      description: '',
    })
    setError(null)
  }

  if (submitted) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Request Submitted Successfully!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Thank you for your request. Our team will review it and add the new {formData.type} to our system if approved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={handleNewRequest}
            >
              Submit Another Request
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/pets')}
            >
              Back to My Pets
            </Button>
          </Box>
        </Paper>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Request New Breed or Species
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Can't find your pet's breed or species in our system? Submit a request and we'll add it for you!
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Request Form
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Request Type</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  label="Request Type"
                >
                  <MenuItem value="breed">New Breed</MenuItem>
                  <MenuItem value="species">New Species</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                name="requestedName"
                label={`${formData.type === 'breed' ? 'Breed' : 'Species'} Name`}
                value={formData.requestedName}
                onChange={handleInputChange}
                placeholder={`Enter the name of the ${formData.type} you want to request`}
                sx={{ mb: 3 }}
                required
              />

              <TextField
                fullWidth
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={4}
                placeholder="Please provide details about this breed/species, such as:
• Physical characteristics
• Temperament
• Size range
• Any other relevant information"
                sx={{ mb: 3 }}
                required
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/pets')}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                How It Works
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  1. Submit Request
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fill out the form with details about the breed or species you want to add.
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  2. Admin Review
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Our team will review your request and verify the information.
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  3. Approval & Addition
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  If approved, the breed/species will be added to our system for everyone to use.
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="text.secondary">
                <strong>Note:</strong> This helps us build a comprehensive database of pet breeds and species for the entire community.
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Request Guidelines
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 1 }}>
                <Chip label="Provide accurate information" size="small" sx={{ mb: 1 }} />
              </Box>
              <Box sx={{ mb: 1 }}>
                <Chip label="Include physical characteristics" size="small" sx={{ mb: 1 }} />
              </Box>
              <Box sx={{ mb: 1 }}>
                <Chip label="Mention temperament traits" size="small" sx={{ mb: 1 }} />
              </Box>
              <Box sx={{ mb: 1 }}>
                <Chip label="Specify size range" size="small" sx={{ mb: 1 }} />
              </Box>
              <Box>
                <Chip label="Add any special care needs" size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default RequestBreed
