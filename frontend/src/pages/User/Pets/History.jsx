import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Grid, 
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  Paper
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Notes as NotesIcon
} from '@mui/icons-material'
import { userPetsAPI } from '../../../services/api'

const UserPetHistory = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadHistory()
  }, [id])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const res = await userPetsAPI.getOwnershipHistory(id)
      setHistory(res.data?.data || null)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    )
  }

  if (!history) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>History not found</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    )
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button variant="outlined" startIcon={<BackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Ownership History for {history.petName}
        </Typography>
        <Box />
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <HistoryIcon />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Ownership Timeline
            </Typography>
          </Box>
          
          {(!history.ownershipHistory || history.ownershipHistory.length === 0) ? (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No ownership history found
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {history.ownershipHistory.map((record, index) => (
                <Paper key={index} sx={{ p: 3, position: 'relative' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PersonIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {record.ownerName}
                        </Typography>
                      </Box>
                      <Chip 
                        label="Current Owner" 
                        color="success" 
                        size="small" 
                        sx={{ mb: 2 }} 
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={8}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body1">
                          <strong>Ownership Period:</strong> {new Date(record.startDate).toLocaleDateString()}
                          {record.endDate && ` - ${new Date(record.endDate).toLocaleDateString()}`}
                        </Typography>
                      </Box>
                      
                      {record.reason && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <NotesIcon sx={{ mr: 1, color: 'text.secondary', mt: 0.5 }} />
                          <Typography variant="body1">
                            <strong>Reason:</strong> {record.reason}
                          </Typography>
                        </Box>
                      )}
                      
                      {record.notes && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <NotesIcon sx={{ mr: 1, color: 'text.secondary', mt: 0.5 }} />
                          <Typography variant="body1">
                            <strong>Notes:</strong> {record.notes}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                  
                  {/* Timeline connector line */}
                  {index < history.ownershipHistory.length - 1 && (
                    <Box 
                      sx={{ 
                        position: 'absolute',
                        left: 36,
                        bottom: -24,
                        width: 2,
                        height: 48,
                        bgcolor: 'divider',
                        zIndex: 0
                      }} 
                    />
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}

export default UserPetHistory