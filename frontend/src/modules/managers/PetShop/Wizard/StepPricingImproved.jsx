import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Alert,
  Divider,
  Paper
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
    if (error) setError('')
  }

  const next = () => {
    // Price is required
    if (!form.price || isNaN(form.price) || form.price <= 0) {
      setError('Selling price is required and must be a positive number')
      return
    }
    
    // Discount price validation (optional)
    if (form.discountPrice && (isNaN(form.discountPrice) || form.discountPrice < 0)) {
      setError('Discount price must be a valid positive number')
      return
    }
    
    navigate('/manager/petshop/wizard/gender')
  }

  const back = () => navigate('/manager/petshop/wizard/classification')

  return (
    <Box className="space-y-6">
      <Typography variant="h6" sx={{ mb: 2 }}>Pricing</Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Set the pricing for your pet stock.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
      )}
      
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Price (₹) *"
              name="price"
              value={form.price || ''}
              onChange={onChange}
              placeholder="0.00"
              InputProps={{
                inputProps: { min: 0, step: 0.01 }
              }}
              helperText="Required - Selling price per pet"
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Discount Price (₹)"
              name="discountPrice"
              value={form.discountPrice || ''}
              onChange={onChange}
              placeholder="0.00"
              InputProps={{
                inputProps: { min: 0, step: 0.01 }
              }}
              helperText="Optional - Discount price if applicable"
            />
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Tags"
              name="tags"
              value={form.tags || ''}
              onChange={onChange}
              placeholder="e.g., vaccinated, healthy, purebred"
              helperText="Optional - Comma-separated tags for this stock"
            />
          </Grid>
        </Grid>
      </Paper>
      
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
          Next: Gender & Images
        </Button>
      </Box>
    </Box>
  )
}