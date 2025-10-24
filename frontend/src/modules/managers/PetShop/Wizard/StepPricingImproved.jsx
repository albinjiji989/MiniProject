import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Box, 
  Typography, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button, 
  Grid, 
  Alert,
  Divider
} from '@mui/material'

const KEY = 'petshop_wizard'

export default function StepPricingImproved() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [form, setForm] = useState(() => {
    try { 
      return JSON.parse(localStorage.getItem(KEY))?.pricing || {} 
    } catch { 
      return {} 
    }
  })

  const save = (patch) => {
    const prev = JSON.parse(localStorage.getItem(KEY) || '{}')
    const next = { ...prev, pricing: { ...(prev.pricing || {}), ...patch } }
    localStorage.setItem(KEY, JSON.stringify(next))
    setForm(next.pricing)
  }

  const onChange = (e) => {
    const { name, value } = e.target
    save({ [name]: value })
  }

  const next = async () => {
    // Validate numeric values if provided
    if (form.unitCost && (isNaN(form.unitCost) || form.unitCost < 0)) {
      setError('Unit cost must be a valid positive number')
      return
    }
    if (form.price && (isNaN(form.price) || form.price < 0)) {
      setError('Selling price must be a valid positive number')
      return
    }
    
    // At least one of unitCost or price must be provided
    if (!form.unitCost && !form.price) {
      setError('Please provide either unit cost or selling price')
      return
    }
    
    // Quantity is required
    if (!form.quantity || isNaN(form.quantity) || parseInt(form.quantity) < 1) {
      setError('Please provide a valid quantity (at least 1)')
      return
    }
    
    navigate('/manager/petshop/wizard/gender')
  }

  const back = () => navigate('/manager/petshop/wizard/classification')

  return (
    <Box className="space-y-6">
      <Typography variant="h6" sx={{ mb: 2 }}>Pricing & Stock</Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2 }}>Cost Information</Typography>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Unit Cost (₹)"
            name="unitCost"
            value={form.unitCost || ''}
            onChange={onChange}
            placeholder="0.00"
            InputProps={{
              inputProps: { min: 0, step: 0.01 }
            }}
            helperText="Optional - The cost you paid for this pet"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Selling Price (₹)"
            name="price"
            value={form.price || ''}
            onChange={onChange}
            placeholder="0.00"
            InputProps={{
              inputProps: { min: 0, step: 0.01 }
            }}
            helperText="Optional - The price you want to sell this pet for"
          />
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2 }}>Stock Information</Typography>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Quantity *"
            name="quantity"
            value={form.quantity || '1'}
            onChange={onChange}
            InputProps={{
              inputProps: { min: 1 }
            }}
            helperText="Required - Number of pets in this stock"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Source</InputLabel>
            <Select
              name="source"
              value={form.source || 'Other'}
              onChange={onChange}
              label="Source"
            >
              <MenuItem value="Breeder">Breeder</MenuItem>
              <MenuItem value="Rescue">Rescue</MenuItem>
              <MenuItem value="Previous Owner">Previous Owner</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="Arrival Date"
            name="arrivalDate"
            value={form.arrivalDate || ''}
            onChange={onChange}
            InputLabelProps={{
              shrink: true
            }}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button 
          variant="outlined" 
          onClick={back}
          size="large"
        >
          Back
        </Button>
        <Button 
          variant="contained" 
          onClick={next}
          size="large"
        >
          Next: Gender Classification
        </Button>
      </Box>
    </Box>
  )
}