import React from 'react'
import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import { Box, Typography, Stepper, Step, StepLabel, Paper } from '@mui/material'

const STEPS = [
  { key: 'basic', label: 'Basic Info', path: '/manager/petshop/wizard/basic' },
  { key: 'classification', label: 'Classification', path: '/manager/petshop/wizard/classification' },
  { key: 'pricing', label: 'Pricing & Stock', path: '/manager/petshop/wizard/pricing' },
  { key: 'gender', label: 'Gender Distribution', path: '/manager/petshop/wizard/gender' },
  { key: 'review', label: 'Review & Submit', path: '/manager/petshop/wizard/review' },
]

export default function WizardLayoutImproved() {
  const navigate = useNavigate()
  const location = useLocation()

  const currentIndex = Math.max(0, STEPS.findIndex(s => location.pathname.includes(s.key)))

  const goTo = (path) => navigate(path)

  return (
    <Box className="max-w-5xl mx-auto">
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>Add Pet Stock</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Complete each step to add new pet stock to your inventory. Each stock represents a group of similar pets.
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={currentIndex} alternativeLabel>
          {STEPS.map((step, index) => (
            <Step key={step.key}>
              <StepLabel
                onClick={() => goTo(step.path)}
                sx={{ cursor: 'pointer' }}
              >
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Outlet />
      </Paper>
    </Box>
  )
}