import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material'

const KEY = 'petshop_wizard'

export default function StepBasicInfoImproved() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [form, setForm] = useState(() => {
    try { 
      return JSON.parse(localStorage.getItem(KEY))?.basic || {} 
    } catch { 
      return {} 
    }
  })

  const save = (patch) => {
    const prev = JSON.parse(localStorage.getItem(KEY) || '{}')
    const next = { ...prev, basic: { ...(prev.basic || {}), ...patch } }
    localStorage.setItem(KEY, JSON.stringify(next))
    setForm(next.basic)
  }

  const onChange = (e) => {
    const { name, value } = e.target
    save({ [name]: value })
    
    // Clear error when user starts typing
    if (error) setError('')
  }

  const next = () => {
    // Stock name is required
    if (!form.stockName || !form.stockName.trim()) {
      setError('Stock name is required')
      return
    }
    
    // Age is optional but if provided should be a positive number
    if (form.age && (isNaN(form.age) || form.age < 0)) {
      setError('Age must be a positive number')
      return
    }
    
    navigate('/manager/petshop/wizard/classification')
  }

  return (
    <Box className="space-y-6">
      <Typography variant="h6" sx={{ mb: 2 }}>Basic Information</Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Enter the basic details for the new pet stock. Stock name is required.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Stock Name *"
            name="stockName"
            value={form.stockName || ''}
            onChange={onChange}
            placeholder="e.g., Golden Retriever Puppies Batch 1"
            helperText="Required - A name to identify this stock"
            required
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Age"
            name="age"
            value={form.age || ''}
            onChange={onChange}
            placeholder="Enter pet age"
            InputProps={{
              inputProps: { min: 0, step: 0.1 }
            }}
            helperText="Optional - Enter age in the selected unit below"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Age Unit</InputLabel>
            <Select
              name="ageUnit"
              value={form.ageUnit || 'months'}
              onChange={onChange}
              label="Age Unit"
            >
              <MenuItem value="days">Days</MenuItem>
              <MenuItem value="weeks">Weeks</MenuItem>
              <MenuItem value="months">Months</MenuItem>
              <MenuItem value="years">Years</MenuItem>
            </Select>
            <FormHelperText>Unit for the age entered above</FormHelperText>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Color"
            name="color"
            value={form.color || ''}
            onChange={onChange}
            placeholder="e.g., Golden, Black, White"
            helperText="Optional - Color of the pets"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Size"
            name="size"
            value={form.size || ''}
            onChange={onChange}
            placeholder="e.g., Small, Medium, Large"
            helperText="Optional - Size of the pets"
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes"
            name="notes"
            value={form.notes || ''}
            onChange={onChange}
            placeholder="Add any special notes about this pet stock..."
            multiline
            rows={3}
            helperText="Optional - Any additional information about these pets"
          />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
        <Button 
          variant="contained" 
          onClick={next}
          size="large"
        >
          Next: Classification
        </Button>
      </Box>
    </Box>
  )
}