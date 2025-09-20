import React from 'react'
import { Box, Button } from '@mui/material'

const AdminActionBar = ({ actions = [] }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'outlined'}
            startIcon={action.icon}
            onClick={action.onClick}
            sx={action.sx || {}}
          >
            {action.label}
          </Button>
        ))}
      </Box>
    </Box>
  )
}

export default AdminActionBar
