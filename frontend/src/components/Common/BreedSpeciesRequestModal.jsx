import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  Typography,
  Chip,
  Stack,
  alpha,
} from '@mui/material'
import {
  Pets as PetsIcon,
  Assignment as AssignmentIcon,
  Send as SendIcon,
} from '@mui/icons-material'
import { customBreedRequestsAPI, speciesAPI } from '../../services/petSystemAPI'

export default function BreedSpeciesRequestModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [species, setSpecies] = useState([])
  const [form, setForm] = useState({
    type: 'breed', // 'species' or 'breed'
    name: '',
    speciesId: '',
    description: ''
  })

  useEffect(() => {
    if (isOpen) {
      loadSpecies()
    }
  }, [isOpen])

  const loadSpecies = async () => {
    try {
      const response = await speciesAPI.getActive()
      setSpecies(response.data?.data || response.data || [])
    } catch (err) {
      console.error('Failed to load species:', err)
      // If active endpoint fails, show empty
      setSpecies([])
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!form.name.trim()) {
      setError('Name is required')
      return
    }
    
    if (form.type === 'breed' && !form.speciesId) {
      setError('Please select a species for the breed')
      return
    }

    setLoading(true)
    setError('')

    try {
      const requestData = {
        type: form.type,
        name: form.name.trim(),
        description: form.description.trim() || `Requested ${form.type} from manager`,
      }

      if (form.type === 'breed') {
        requestData.speciesId = form.speciesId
      }

      await customBreedRequestsAPI.create(requestData)
      
      onSuccess?.()
      onClose()
      
      // Reset form
      setForm({
        type: 'breed',
        name: '',
        speciesId: '',
        description: ''
      })
      
    } catch (error) {
      console.error('Failed to submit request:', error)
      setError(error.response?.data?.message || 'Failed to submit request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setForm({
        type: 'breed',
        name: '',
        speciesId: '',
        description: ''
      })
      setError('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          {form.type === 'species' ? <PetsIcon color="primary" /> : <AssignmentIcon color="secondary" />}
          <Typography variant="h6">
            Request New {form.type === 'species' ? 'Species' : 'Breed'}
          </Typography>
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Can't find the {form.type} you need? Submit a request and the admin will review it.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={3}>
            {/* Request Type */}
            <FormControl fullWidth>
              <InputLabel>Request Type *</InputLabel>
              <Select
                name="type"
                value={form.type}
                onChange={handleChange}
                label="Request Type *"
                required
              >
                <MenuItem value="species">
                  <Box display="flex" alignItems="center" gap={1}>
                    <PetsIcon fontSize="small" />
                    <Typography>New Species</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="breed">
                  <Box display="flex" alignItems="center" gap={1}>
                    <AssignmentIcon fontSize="small" />
                    <Typography>New Breed</Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            {/* Species Selection (only for breed requests) */}
            {form.type === 'breed' && (
              <FormControl fullWidth required>
                <InputLabel>Species *</InputLabel>
                <Select
                  name="speciesId"
                  value={form.speciesId}
                  onChange={handleChange}
                  label="Species *"
                  required
                >
                  <MenuItem value="">
                    <em>Select a species</em>
                  </MenuItem>
                  {species.map((s) => (
                    <MenuItem key={s._id || s.id} value={s._id || s.id}>
                      {s.displayName || s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Name */}
            <TextField
              fullWidth
              label={`${form.type === 'species' ? 'Species' : 'Breed'} Name *`}
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder={form.type === 'species' ? 'e.g., Chinchilla, Ferret' : 'e.g., Golden Retriever, Persian'}
              required
              helperText={`Enter the ${form.type} name you want to add`}
            />

            {/* Description */}
            <TextField
              fullWidth
              label="Description / Reason"
              name="description"
              value={form.description}
              onChange={handleChange}
              multiline
              rows={3}
              placeholder={`Why do you need this ${form.type}? Any specific characteristics or additional information...`}
              helperText="Optional - Help admin understand your request"
            />

            {/* Info Box */}
            <Box 
              sx={{ 
                p: 2, 
                bgcolor: alpha('#2196f3', 0.1), 
                borderRadius: 1,
                border: '1px solid',
                borderColor: alpha('#2196f3', 0.3)
              }}
            >
              <Typography variant="caption" color="text.secondary">
                <strong>Note:</strong> Your request will be sent to the admin for review. 
                You'll be notified once it's approved or if more information is needed.
              </Typography>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit"
            variant="contained" 
            disabled={loading}
            startIcon={<SendIcon />}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
