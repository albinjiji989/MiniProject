import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Typography, Card, CardContent, CardMedia, Grid, Button, Alert, Chip, Tabs, Tab, Link } from '@mui/material'
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Pet Details
      </Typography>
      
      <Box sx={{ mb: 2, display:'flex', justifyContent:'flex-end' }}>
        <Button 
          variant="contained" 
          color="success" 
          onClick={() => navigate(`/User/adoption/apply/applicant?petId=${id}`)}
          sx={{ mr: 2 }}
        >
          Apply for Adoption
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/User/adoption')}
        >
          Back to Listings
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card>
            {pet?.primaryImage && (
              <CardMedia component="img" height="300" image={pet.primaryImage} alt={pet?.name || 'Pet'} />
            )}
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{pet?.name}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {pet?.petCode && <Chip size="small" label={pet.petCode} variant="outlined" />}
                {pet?.species && <Chip size="small" label={pet.species} />}
                {pet?.breed && <Chip size="small" label={pet.breed} />}
                {pet?.gender && <Chip size="small" label={pet.gender} />}
              </Box>
              
              <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 2 }}>
                <Tab label="Details" />
                <Tab label="Gallery" />
                {pet?.documents && pet.documents.length > 0 && <Tab label="Documents" />}
              </Tabs>
              
              {tabValue === 0 && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>{pet?.description}</Typography>
                  {typeof pet?.adoptionFee === 'number' && (
                    <Typography sx={{ mb: 2, fontWeight: 600, color: 'success.main' }}>
                      Adoption Fee: ₹{pet.adoptionFee}
                    </Typography>
                  )}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Age:</strong> {pet?.age} {pet?.ageUnit}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Color:</strong> {pet?.color}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Weight:</strong> {pet?.weight} kg
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Health Status:</strong> {pet?.healthStatus}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Vaccination Status:</strong> {pet?.vaccinationStatus}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Temperament:</strong> {pet?.temperament}
                    </Typography>
                    {pet?.createdBy && (
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        <strong>Managed by:</strong> {pet.createdBy.name || 'Adoption Manager'}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
              
              {tabValue === 1 && (
                <Box>
                  {pet?.images && pet.images.length > 0 ? (
                    <Grid container spacing={2}>
                      {pet.images.map((img, index) => (
                        <Grid item xs={6} key={index}>
                          <CardMedia 
                            component="img" 
                            height="120" 
                            image={img.url} 
                            alt={img.caption || `Image ${index + 1}`} 
                            sx={{ objectFit: 'cover', cursor: 'pointer' }}
                            onClick={() => window.open(img.url, '_blank')}
                          />
                          {img.caption && (
                            <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center' }}>
                              {img.caption}
                            </Typography>
                          )}
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography color="text.secondary">No images available</Typography>
                  )}
                </Box>
              )}
              
              {tabValue === 2 && pet?.documents && pet.documents.length > 0 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>Documents</Typography>
                  <Grid container spacing={2}>
                    {pet.documents.map((doc, index) => (
                      <Grid item xs={12} key={index}>
                        <Card sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography variant="body1">{doc.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {doc.type}
                              </Typography>
                            </Box>
                            <Link href={doc.url} target="_blank" rel="noopener" underline="none">
                              <Button variant="outlined" size="small">
                                View Document
                              </Button>
                            </Link>
                          </Box>
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
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Additional Information</Typography>
              <Box sx={{ minHeight: 300 }}>
                <Typography variant="body1" color="text.secondary">
                  This pet is available for adoption. Click the "Apply for Adoption" button to start the adoption process.
                </Typography>
                {pet?.createdBy && (
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    This pet is managed by <strong>{pet.createdBy.name || 'an adoption manager'}</strong>. 
                    If you have any questions about this pet, please contact our adoption team.
                  </Typography>
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