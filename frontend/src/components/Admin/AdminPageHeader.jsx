import React from 'react'
import { Box, Typography } from '@mui/material'

const AdminPageHeader = ({ 
  title, 
  description, 
  icon: Icon, 
  color = '#3b82f6', 
  stats = null 
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {description}
      </Typography>
      {stats && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          p: 2,
          backgroundColor: `${color}10`,
          borderRadius: 2,
          border: `1px solid ${color}20`
        }}>
          <Icon sx={{ color }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {stats}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default AdminPageHeader
