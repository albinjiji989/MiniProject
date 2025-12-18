import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Alert,
  Paper
} from '@mui/material'

const KEY = 'petshop_wizard'

export default function StepGenderClassification() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    totalQuantity: 1,
    maleQuantity: 0,
    femaleQuantity: 0
  })

  // Load existing data
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '{}')
      const pricingData = saved.pricing || {}
      const genderData = saved.genderClassification || {}
      
      // Set total quantity from pricing step
      const totalQuantity = parseInt(pricingData.quantity) || 1
      
      setForm({
        totalQuantity,
        maleQuantity: genderData.maleQuantity || 0,
        femaleQuantity: genderData.femaleQuantity || 0
      })
    } catch (e) {
      console.error('Failed to load saved data', e)
    }
  }, [])

  const save = (newForm) => {
    const prev = JSON.parse(localStorage.getItem(KEY) || '{}')
    const next = { ...prev, genderClassification: newForm }
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  const updateQuantity = (field, value) => {
    const numValue = parseInt(value) || 0
    
    // Ensure the value doesn't exceed total quantity
    const clampedValue = Math.min(numValue, form.totalQuantity)
    
    let updatedForm
    if (field === 'maleQuantity') {
      // When male quantity changes, auto-calculate female quantity
      const femaleQuantity = form.totalQuantity - clampedValue
      updatedForm = { 
        ...form, 
        maleQuantity: clampedValue,
        femaleQuantity: Math.max(0, femaleQuantity) // Ensure it's not negative
      }
    } else if (field === 'femaleQuantity') {
      // When female quantity changes, auto-calculate male quantity
      const maleQuantity = form.totalQuantity - clampedValue
      updatedForm = { 
        ...form, 
        femaleQuantity: clampedValue,
        maleQuantity: Math.max(0, maleQuantity) // Ensure it's not negative
      }
    }
    
    setForm(updatedForm)
    save(updatedForm)
    
    // Clear error when user starts typing
    if (error) setError('')
  }

  const validate = () => {
    const totalAssigned = form.maleQuantity + form.femaleQuantity
    if (totalAssigned !== form.totalQuantity) {
      setError(`Total assigned quantity (${totalAssigned}) must equal the total stock quantity (${form.totalQuantity})`)
      return false
    }
    return true
  }

  const next = () => {
    if (!validate()) return
    navigate('/manager/petshop/wizard/review')
  }

  const back = () => navigate('/manager/petshop/wizard/pricing')

  return (
    <Box className="space-y-6">
      <Typography variant="h6" sx={{ mb: 2 }}>Gender Classification</Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Distribute your stock quantity by gender. The system will automatically calculate remaining quantities.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Stock Distribution</Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Total Stock Quantity: <strong>{form.totalQuantity}</strong>
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Male Quantity"
              value={form.maleQuantity}
              onChange={(e) => updateQuantity('maleQuantity', e.target.value)}
              InputProps={{
                inputProps: { min: 0, max: form.totalQuantity }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Female Quantity"
              value={form.femaleQuantity}
              onChange={(e) => updateQuantity('femaleQuantity', e.target.value)}
              InputProps={{
                inputProps: { min: 0, max: form.totalQuantity }
              }}
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Summary</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2">Male: {form.maleQuantity}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">Female: {form.femaleQuantity}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                Total: {form.maleQuantity + form.femaleQuantity} / {form.totalQuantity}
              </Typography>
            </Grid>
          </Grid>
        </Box>
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
          disabled={form.maleQuantity + form.femaleQuantity !== form.totalQuantity}
        >
          Next: Review & Submit
        </Button>
      </Box>
    </Box>
  )
}