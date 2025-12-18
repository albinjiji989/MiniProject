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
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  MedicalServices as MedicalIcon,
  History as HistoryIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
  Help as HelpIcon,
  Pets as PetsIcon
} from '@mui/icons-material'
import { adoptionAPI, resolveMediaUrl } from '../../../services/api'

const UserAdoptedPetDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [pet, setPet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [medicalHistory, setMedicalHistory] = useState([])
  const [medicalHistoryLoading, setMedicalHistoryLoading] = useState(false)
  const [showMedicalForm, setShowMedicalForm] = useState(false)
  const [medicalForm, setMedicalForm] = useState({
    description: '',
    veterinarian: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [menuAnchor, setMenuAnchor] = useState(null)

  useEffect(() => {
    const loadPet = async () => {
      try {
        setLoading(true)
        const res = await adoptionAPI.getMyAdoptedPet(id)
        const petData = res.data?.data || res.data
        console.log('Adopted pet data received:', petData)
        setPet(petData)
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load pet details')
      } finally {
        setLoading(false)
      }
    }

    const loadMedicalHistory = async () => {
      try {
        setMedicalHistoryLoading(true)
        const res = await adoptionAPI.getMedicalHistoryOfAdoptedPet(id)
        setMedicalHistory(res.data?.data?.medicalHistory || [])
      } catch (e) {
        console.error('Failed to load medical history:', e)
      } finally {
        setMedicalHistoryLoading(false)
      }
    }

    if (id) {
      loadPet()
      loadMedicalHistory()
    }
  }, [id])

  const getPrimaryImageUrl = () => {
    try {
      if (pet?.images && Array.isArray(pet.images) && pet.images.length > 0) {
        const primaryImage = pet.images.find(img => img?.isPrimary) || pet.images[0]
        if (primaryImage?.url) {
          return resolveMediaUrl(primaryImage.url)
        }
      }
    } catch (error) {
      console.error('Error getting primary image URL:', error)
    }
    return '/placeholder-pet.svg'
  }

  const handleAddMedicalRecord = async () => {
    try {
      const res = await adoptionAPI.addMedicalHistoryToAdoptedPet(id, medicalForm)
      setMedicalHistory(res.data?.data?.pet?.medicalHistory || [])
      setShowMedicalForm(false)
      setMedicalForm({
        description: '',
        veterinarian: '',
        date: new Date().toISOString().split('T')[0]
      })
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to add medical record')
    }
  }

  const handleDownloadCertificate = async () => {
    try {
      // First, we need to find the adoption application for this pet to get the certificate
      const applicationsRes = await adoptionAPI.listMyRequests()
      const applications = applicationsRes.data?.data || []
      
      // Find the application for this pet
      const app = applications.find(application => 
        application.petId?._id === id || application.petId === id
      )
      
      if (!app) {
        alert('Adoption application not found for this pet')
        return
      }
      
      // Use the user certificate endpoint to download
      const resp = await adoptionAPI.getUserCertificate(app._id)
      const blob = new Blob([resp.data], { type: resp.headers['content-type'] || 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const dispo = resp.headers['content-disposition'] || ''
      const match = dispo.match(/filename="?([^";]+)"?/i)
      const fname = (match && match[1]) ? match[1] : `adoption_certificate_${app._id}.pdf`
      a.href = blobUrl
      a.download = fname
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(blobUrl)
    } catch (e) {
      console.error('Certificate download error:', e)
      alert(e?.response?.data?.error || 'Failed to download certificate')
    }
  }

  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
  }

  const getGenderIcon = (gender) => {
    switch (gender?.toLowerCase()) {
      case 'male':
        return <MaleIcon sx={{ fontSize: 18, color: 'primary.main' }} />
      case 'female':
        return <FemaleIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
      default:
        return <HelpIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
    }
  }

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/User/pets')}>
          Back to My Pets
        </Button>
      </Container>
    )
  }

  if (!pet) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>Pet not found</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/User/pets')}>
          Back to My Pets
        </Button>
      </Container>
    )
  }

  return (
    <Container sx={{ py: { xs: 2, sm: 4 } }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2
      }}>
        <Button 
          variant="outlined" 
          startIcon={<BackIcon />} 
          onClick={() => navigate('/User/pets')}
          sx={{ alignSelf: 'flex-start' }}
        >
          Back to My Pets
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadCertificate}
          >
            Download Certificate
          </Button>
          <IconButton 
            onClick={handleMenuOpen}
            sx={{ 
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': { bgcolor: 'background.paper' }
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Box>

      <Card sx={{ mb: 3, boxShadow: 4 }}>
        <CardContent>
          <Grid container spacing={4}>
            {/* Pet Image */}
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 200,
                    height: 200,
                    margin: '0 auto 16px',
                    border: `6px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    boxShadow: 4,
                    bgcolor: 'background.paper'
                  }}
                  src={getPrimaryImageUrl()}
                  onError={(e) => { e.currentTarget.src = '/placeholder-pet.svg' }}
                >
                  <PetsIcon sx={{ fontSize: 80, color: 'primary.main' }} />
                </Avatar>
                
                <Chip 
                  label="Adopted Pet" 
                  color="secondary"
                  size="medium"
                  sx={{ 
                    fontWeight: 700,
                    fontSize: '1rem',
                    height: 32
                  }}
                />
              </Box>
            </Grid>
            
            {/* Pet Details */}
            <Grid item xs={12} md={8}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                  {pet.name}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getGenderIcon(pet.gender)}
                    <Typography variant="h6" color="text.secondary">
                      {pet.gender || 'Unknown'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="h6" color="text.secondary">
                      {pet.age || '-'} {pet.ageUnit || 'months'}
                    </Typography>
                  </Box>
                </Box>
                
                {pet.petCode && (
                  <Box sx={{ 
                    display: 'inline-block',
                    p: 1,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: 1,
                    mb: 2
                  }}>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      Pet Code: {pet.petCode}
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Species</Typography>
                  <Typography variant="h6">{pet.species || '-'}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Breed</Typography>
                  <Typography variant="h6">{pet.breed || '-'}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Color</Typography>
                  <Typography variant="h6">{pet.color || '-'}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Health Status</Typography>
                  <Typography variant="h6">{pet.healthStatus || '-'}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Adoption Date</Typography>
                  <Typography variant="h6">
                    {pet.adoptionDate ? new Date(pet.adoptionDate).toLocaleDateString() : '-'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Temperament</Typography>
                  <Typography variant="h6">{pet.temperament || '-'}</Typography>
                </Grid>
              </Grid>
              
              {pet.description && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Description</Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    {pet.description}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        <Button 
          variant="contained"
          startIcon={<MedicalIcon />}
          onClick={() => setShowMedicalForm(true)}
          size="large"
          fullWidth={isMobile}
        >
          Add Medical Record
        </Button>
        <Button 
          variant="outlined"
          startIcon={<HistoryIcon />}
          onClick={() => {
            // Refresh medical history
            adoptionAPI.getMedicalHistoryOfAdoptedPet(id)
              .then(res => setMedicalHistory(res.data?.data?.medicalHistory || []))
              .catch(e => console.error('Failed to refresh medical history:', e))
          }}
          size="large"
          fullWidth={isMobile}
        >
          Refresh History
        </Button>
      </Box>

      {/* Medical History Section */}
      <Card sx={{ mb: 3, boxShadow: 2 }}>
        <CardContent>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Medical History ({medicalHistory.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {medicalHistoryLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : medicalHistory.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <MedicalIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">No medical history records found.</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add your first medical record using the button above.
                  </Typography>
                </Box>
              ) : (
                <List>
                  {medicalHistory.map((record, index) => (
                    <React.Fragment key={index}>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {record.description}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography component="span" variant="body1" color="text.primary" sx={{ display: 'block', mb: 0.5 }}>
                                {record.veterinarian}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography component="span" variant="body2" color="text.secondary">
                                  {record.date ? new Date(record.date).toLocaleDateString() : 'Date not specified'}
                                </Typography>
                              </Box>
                            </>
                          }
                        />
                      </ListItem>
                      {index < medicalHistory.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>

      {/* Add Medical Record Dialog */}
      <Dialog open={showMedicalForm} onClose={() => setShowMedicalForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Medical Record</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={medicalForm.description}
                onChange={(e) => setMedicalForm({...medicalForm, description: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Veterinarian"
                value={medicalForm.veterinarian}
                onChange={(e) => setMedicalForm({...medicalForm, veterinarian: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={medicalForm.date}
                onChange={(e) => setMedicalForm({...medicalForm, date: e.target.value})}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMedicalForm(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAddMedicalRecord}
            disabled={!medicalForm.description || !medicalForm.veterinarian}
          >
            Add Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleMenuClose()
          handleDownloadCertificate()
        }}>
          <DownloadIcon sx={{ mr: 1 }} /> Download Certificate
        </MenuItem>
      </Menu>
    </Container>
  )
}

export default UserAdoptedPetDetails