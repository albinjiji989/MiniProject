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
  Avatar
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  MedicalServices as MedicalIcon,
  Vaccines as VaccinesIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  AttachMoney as CostIcon
} from '@mui/icons-material'
import { userPetsAPI } from '../../../services/api'

const UserPetMedicalHistory = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [medicalHistory, setMedicalHistory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadMedicalHistory()
  }, [id])

  const loadMedicalHistory = async () => {
    try {
      setLoading(true)
      const res = await userPetsAPI.getMedicalHistory(id)
      setMedicalHistory(res.data?.data || null)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load medical history')
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

  if (!medicalHistory) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>Medical history not found</Alert>
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
          Medical History for {medicalHistory.petName}
        </Typography>
        <Box />
      </Box>

      <Grid container spacing={3}>
        {/* Medical Records */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <MedicalIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Medical Records
                </Typography>
              </Box>
              
              {(!medicalHistory.medicalHistory || medicalHistory.medicalHistory.length === 0) ? (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No medical records found
                </Typography>
              ) : (
                <List>
                  {medicalHistory.medicalHistory.map((record, index) => (
                    <React.Fragment key={index}>
                      <ListItem alignItems="flex-start">
                        <ListItemIcon>
                          <CalendarIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={new Date(record.date).toLocaleDateString()}
                          secondary={
                            <React.Fragment>
                              <Typography component="span" variant="body2" color="text.primary">
                                {record.type}
                              </Typography>
                              {record.description && (
                                <Typography component="p" variant="body2" sx={{ mt: 1 }}>
                                  {record.description}
                                </Typography>
                              )}
                              {record.veterinarian && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                  <PersonIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                  <Typography component="span" variant="body2">
                                    {record.veterinarian}
                                  </Typography>
                                </Box>
                              )}
                              {record.cost && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                  <CostIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                  <Typography component="span" variant="body2">
                                    ₹{record.cost}
                                  </Typography>
                                </Box>
                              )}
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      {index < medicalHistory.medicalHistory.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Vaccination Records */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <VaccinesIcon />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Vaccination Records
                </Typography>
              </Box>
              
              {(!medicalHistory.vaccinations || medicalHistory.vaccinations.length === 0) ? (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No vaccination records found
                </Typography>
              ) : (
                <List>
                  {medicalHistory.vaccinations.map((vaccination, index) => (
                    <React.Fragment key={index}>
                      <ListItem alignItems="flex-start">
                        <ListItemIcon>
                          <CalendarIcon color="secondary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={vaccination.name}
                          secondary={
                            <React.Fragment>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                <Typography component="span" variant="body2">
                                  Given: {new Date(vaccination.date).toLocaleDateString()}
                                </Typography>
                              </Box>
                              {vaccination.nextDue && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                  <CalendarIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                  <Typography component="span" variant="body2">
                                    Due: {new Date(vaccination.nextDue).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              )}
                              {vaccination.veterinarian && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                  <PersonIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                  <Typography component="span" variant="body2">
                                    {vaccination.veterinarian}
                                  </Typography>
                                </Box>
                              )}
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      {index < medicalHistory.vaccinations.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default UserPetMedicalHistory