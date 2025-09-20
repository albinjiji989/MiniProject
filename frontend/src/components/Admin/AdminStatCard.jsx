import React from 'react'
import { Card, CardContent, Box, Typography } from '@mui/material'

const AdminStatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = '#3b82f6', 
  subtitle = null 
}) => {
  return (
    <Card sx={{ 
      background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: 3,
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color, mb: 1 }}>
              {value}
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.primary' }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {React.isValidElement(Icon) ? Icon : <Icon sx={{ fontSize: 40, color }} />}
        </Box>
      </CardContent>
    </Card>
  )
}

export default AdminStatCard
