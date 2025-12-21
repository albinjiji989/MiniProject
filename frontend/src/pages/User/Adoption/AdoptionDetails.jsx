import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Typography, Card, CardContent, CardMedia, Grid, Button, Alert, Chip, Tabs, Tab, Link } from '@mui/material'
import { 
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon,
  Palette as PaletteIcon,
  Scale as ScaleIcon,
  Healing as HealingIcon,
  Vaccines as VaccinesIcon,
  Psychology as PsychologyIcon,
  Favorite as FavoriteIcon,
  Description as DescriptionIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material'
import { adoptionAPI, resolveMediaUrl } from '../../../services/api'

const AdoptionDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pet, setPet] = useState(null)
  const [tabValue, setTabValue] = useState(0)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        console.log('AdoptionDetails: Loading pet with ID =', id)
        const res = await adoptionAPI.getPet(id)
        const data = res?.data?.data || res?.data
        if (!data) throw new Error('Pet not found')
        console.log('AdoptionDetails: Loaded pet data =', data)
        
        // Process all images
        const images = (data.images || []).map(img => ({
          url: resolveMediaUrl(img?.url || ''),
          caption: img?.caption || ''
        })).filter(img => img.url)
        
        // Process documents
        const documents = (data.documents || []).map(doc => ({
          url: resolveMediaUrl(doc?.url || ''),
          name: doc?.name || 'Document',
          type: doc?.type || 'document'
        })).filter(doc => doc.url)
        
        setPet({ 
          ...data, 
          images: images,
          documents: documents,
          primaryImage: images.length > 0 ? images[0].url : ''
        })
      } catch (e) {
        console.error('AdoptionDetails: Failed to load pet =', e)
        setError(`Pet with ID ${id} not found. This pet may have been adopted, removed by the adoption manager, or the link you're using may be outdated. Please go back to the pet listings and select a different pet.`)
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id])

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  if (loading) return <Box sx={{ p: 3 }}><Typography>Loading...</Typography></Box>
  
  if (error) return (
    <Box sx={{ p: 3 }}>
      <Alert severity="error">{error}</Alert>
      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={() => navigate('/User/adoption')}>
          Back to Adoption Listings
        </Button>
        <Button variant="outlined" onClick={() => navigate('/User/adoption/debug')}>
          Debug Pet Issues
        </Button>
      </Box>
    </Box>
  )

  if (!pet) return (
    <Box sx={{ p: 3 }}>
      <Typography>Pet not found</Typography>
      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={() => navigate('/User/adoption')}>
          Back to Adoption Listings
        </Button>
        <Button variant="outlined" onClick={() => navigate('/User/adoption/debug')}>
          Debug Pet Issues
        </Button>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        mb: 3,
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
            Pet Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Learn more about this adorable companion
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            color="success" 
            onClick={() => {
              console.log('Adopt Me clicked, id:', id);
              navigate(`/User/adoption/apply?petId=${id}`);
            }}
            startIcon={<FavoriteIcon />}
            sx={{ minWidth: 120 }}
          >
            Adopt Me
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/User/adoption')}
            startIcon={<ArrowBackIcon />}
          >
            Back to Pets
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card>
            {pet?.primaryImage && (
              <CardMedia component="img" height="300" image={pet.primaryImage} alt={pet?.name || 'Pet'} />
            )}
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>{pet?.name || 'Unnamed Pet'}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  {pet?.petCode && <Chip size="small" label={`ID: ${pet.petCode}`} color="primary" variant="filled" />}
                  {pet?.species && <Chip size="small" label={pet.species} color="info" />}
                  {pet?.breed && <Chip size="small" label={pet.breed} color="secondary" />}
                  {pet?.gender && <Chip size="small" label={pet.gender} color="success" />}
                </Box>
                
                {typeof pet?.adoptionFee === 'number' && (
                  <Box sx={{ 
                    display: 'inline-block',
                    bgcolor: 'success.light',
                    color: 'success.dark',
                    px: 2,
                    py: 1,
                    borderRadius: 1,
                    mb: 1
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0 }}>
                      Adoption Fee: ₹{pet.adoptionFee}
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 2 }}>
                <Tab label="Details" />
                <Tab label="Gallery" />
                {pet?.documents && pet.documents.length > 0 && <Tab label="Documents" />}
              </Tabs>
              
              {tabValue === 0 && (
                <Box>
                  <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>{pet?.description || 'No description available for this pet.'}</Typography>
                  
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 2,
                    mt: 2 
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon sx={{ color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Age</Typography>
                        <Typography variant="body1">{pet?.age} {pet?.ageUnit}</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PaletteIcon sx={{ color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Color</Typography>
                        <Typography variant="body1">{pet?.color || 'Not specified'}</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScaleIcon sx={{ color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Weight</Typography>
                        <Typography variant="body1">{pet?.weight ? `${pet.weight} kg` : 'Not specified'}</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HealingIcon sx={{ color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Health Status</Typography>
                        <Typography variant="body1">{pet?.healthStatus || 'Not specified'}</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VaccinesIcon sx={{ color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Vaccination</Typography>
                        <Typography variant="body1">{pet?.vaccinationStatus || 'Not specified'}</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PsychologyIcon sx={{ color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Temperament</Typography>
                        <Typography variant="body1">{pet?.temperament || 'Not specified'}</Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  {pet?.createdBy && (
                    <Box sx={{ 
                      mt: 3, 
                      pt: 2, 
                      borderTop: '1px solid', 
                      borderColor: 'divider' 
                    }}>
                      <Typography variant="body2" color="text.secondary">
                        Managed by <strong>{pet.createdBy.name || 'Adoption Manager'}</strong>. If you have any questions about this pet, please contact our adoption team.
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
              
              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>Photo Gallery</Typography>
                  {pet?.images && pet.images.length > 0 ? (
                    <Grid container spacing={2}>
                      {pet.images.map((img, index) => (
                        <Grid item xs={6} sm={4} key={index}>
                          <Card 
                            sx={{ 
                              cursor: 'pointer',
                              transition: 'transform 0.2s',
                              '&:hover': { transform: 'scale(1.02)' }
                            }}
                            onClick={() => window.open(img.url, '_blank')}
                          >
                            <CardMedia 
                              component="img" 
                              height="140" 
                              image={img.url} 
                              alt={img.caption || `Image ${index + 1}`} 
                              sx={{ objectFit: 'cover' }}
                            />
                            {img.caption && (
                              <CardContent sx={{ p: 1, pb: '8px !important' }}>
                                <Typography variant="caption" display="block" align="center">
                                  {img.caption}
                                </Typography>
                              </CardContent>
                            )}
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">No images available for this pet</Typography>
                    </Box>
                  )}
                </Box>
              )}
              
              {tabValue === 2 && pet?.documents && pet.documents.length > 0 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>Important Documents</Typography>
                  <Grid container spacing={2}>
                    {pet.documents.map((doc, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Card 
                          sx={{ 
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            transition: 'box-shadow 0.2s',
                            '&:hover': { boxShadow: 2 }
                          }}
                        >
                          <DescriptionIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{doc.name}</Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {doc.type}
                            </Typography>
                          </Box>
                          <Link href={doc.url} target="_blank" rel="noopener" underline="none">
                            <Button 
                              variant="outlined" 
                              size="small"
                              startIcon={<VisibilityIcon />}
                            >
                              View
                            </Button>
                          </Link>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>About Adoption</Typography>
              <Box sx={{ minHeight: 300 }}>
                <Box sx={{ 
                  bgcolor: 'info.light', 
                  borderRadius: 2, 
                  p: 3, 
                  mb: 3 
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'info.dark' }}>
                    Ready to Give Love a Home?
                  </Typography>
                  <Typography variant="body2" color="info.dark" sx={{ mb: 2 }}>
                    This wonderful pet is waiting for a loving family. By adopting, you're not just gaining a companion - 
                    you're saving a life and making room for another animal in need.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="success" 
                    onClick={() => {
                      console.log('Start Adoption Process clicked, id:', id);
                      navigate(`/User/adoption/apply?petId=${id}`);
                    }}
                    startIcon={<FavoriteIcon />}
                    sx={{ mt: 1 }}
                  >
                    Start Adoption Process
                  </Button>
                </Box>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Our adoption process is designed to ensure the best match between pets and families. 
                  We'll guide you through each step to make your adoption experience smooth and rewarding.
                </Typography>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Adoption Benefits</Typography>
                  <ul style={{ paddingLeft: 20 }}>
                    <li style={{ marginBottom: 8 }}>
                      <Typography variant="body2">
                        <strong>Pre-adoption support:</strong> Our team provides guidance throughout the process
                      </Typography>
                    </li>
                    <li style={{ marginBottom: 8 }}>
                      <Typography variant="body2">
                        <strong>Post-adoption care:</strong> Continued support and resources after adoption
                      </Typography>
                    </li>
                    <li style={{ marginBottom: 8 }}>
                      <Typography variant="body2">
                        <strong>Health guarantee:</strong> All pets are health-checked before adoption
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        <strong>Lifetime support:</strong> We're here for you and your new pet for life
                      </Typography>
                    </li>
                  </ul>
                </Box>
                
                {pet?.createdBy && (
                  <Box sx={{ 
                    mt: 3, 
                    pt: 2, 
                    borderTop: '1px solid', 
                    borderColor: 'divider' 
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      For questions about this specific pet, contact <strong>{pet.createdBy.name || 'our adoption team'}</strong>.
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default AdoptionDetails