import React from 'react'
import { Card, CardContent, Box, Typography, IconButton, Tooltip } from '@mui/material'
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon } from '@mui/icons-material'

const AdminStatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = '#3b82f6', 
  subtitle = null,
  growth = null,
  onClick = null
}) => {
  return (
    <Card sx={{ 
      background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: 3,
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.3s ease',
      '&:hover': onClick ? { 
        transform: 'translateY(-4px)', 
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)' 
      } : {}
    }}
    onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color, mb: 1 }}>
              {value}
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.primary', mb: 0.5 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {growth !== undefined && growth !== null && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {growth >= 0 ? (
                  <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                )}
                <Typography
                  variant="body2"
                  sx={{ 
                    color: growth >= 0 ? 'success.main' : 'error.main',
                    fontWeight: 'medium'
                  }}
                >
                  {Math.abs(growth)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ ml: 2 }}>
            {React.isValidElement(Icon) ? Icon : <Icon sx={{ fontSize: 40, color, opacity: 0.8 }} />}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default AdminStatCard
