import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Typography, Card, CardContent, CardMedia, Grid, TextField, Button, Alert, Chip } from '@mui/material'
import { adoptionAPI, resolveMediaUrl } from '../../../services/api'

const AdoptionDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pet, setPet] = useState(null)
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '',
    address: { street: '', city: '', state: '', pincode: '', country: '' },
    homeType: 'apartment', hasGarden: false, hasOtherPets: false, otherPetsDetails: '',
    petExperience: 'none', previousPets: '',
    workSchedule: 'full_time', timeAtHome: '4_8_hours',
    adoptionReason: '', expectations: '',
    emergencyContact: { name: '', relationship: '', phone: '' }
  })

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
        const img = resolveMediaUrl(data.images?.[0]?.url || '')
        setPet({ ...data, image: img })
      } catch (e) {
        console.error('AdoptionDetails: Failed to load pet =', e)
        setError('Failed to load pet details')
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id])

  const onChange = (field, value) => setForm((f) => ({ ...f, [field]: value }))
  const onAddress = (field, value) => setForm((f) => ({ ...f, address: { ...f.address, [field]: value } }))

  const submit = async () => {
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      // Validate the pet ID format (MongoDB ObjectId)
      console.log('AdoptionDetails: Submitting with pet ID =', id)
      console.log('AdoptionDetails: Pet object =', pet)
      
      if (!id || typeof id !== 'string' || id.length !== 24) {
        throw new Error('Invalid pet ID. Please refresh the page and try again.');
      }
      
      const payload = { petId: id, applicationData: form }
      console.log('AdoptionDetails: Payload =', payload)
      await adoptionAPI.submitRequest(payload)
      setSuccess('Application submitted successfully')
      // Redirect to my applications after short delay
      setTimeout(() => navigate('/User/adoption/applications'), 800)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Adoption Details
      </Typography>
      {/* Wizard CTA */}
      {id && (
        <Box sx={{ mb: 2, display:'flex', justifyContent:'flex-end' }}>
          <Button variant="contained" color="success" onClick={()=>navigate(`/User/adoption/apply/applicant?petId=${id}`)}>
            Apply via Wizard
          </Button>
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card>
            {pet?.image && (
              <CardMedia component="img" height="320" image={pet.image} alt={pet?.name || 'Pet'} />
            )}
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{pet?.name}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                {pet?.petCode && <Chip size="small" label={pet.petCode} variant="outlined" />}
                {pet?.species && <Chip size="small" label={pet.species} />}
                {pet?.breed && <Chip size="small" label={pet.breed} />}
                {pet?.gender && <Chip size="small" label={pet.gender} />}
              </Box>
              <Typography variant="body2" sx={{ mt: 2 }}>{pet?.description}</Typography>
              {typeof pet?.adoptionFee === 'number' && (
                <Typography sx={{ mt: 1, fontWeight: 600, color: 'success.main' }}>
                  Adoption Fee: ₹{pet.adoptionFee}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Application Form</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField label="Full Name" fullWidth value={form.fullName} onChange={(e) => onChange('fullName', e.target.value)} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Email" fullWidth value={form.email} onChange={(e) => onChange('email', e.target.value)} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Phone" fullWidth value={form.phone} onChange={(e) => onChange('phone', e.target.value)} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Adoption Reason" fullWidth value={form.adoptionReason} onChange={(e) => onChange('adoptionReason', e.target.value)} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Street" fullWidth value={form.address.street} onChange={(e) => onAddress('street', e.target.value)} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="City" fullWidth value={form.address.city} onChange={(e) => onAddress('city', e.target.value)} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="State" fullWidth value={form.address.state} onChange={(e) => onAddress('state', e.target.value)} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="Pincode" fullWidth value={form.address.pincode} onChange={(e) => onAddress('pincode', e.target.value)} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Country" fullWidth value={form.address.country} onChange={(e) => onAddress('country', e.target.value)} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Expectations" fullWidth multiline minRows={3} value={form.expectations} onChange={(e) => onChange('expectations', e.target.value)} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Previous Pets / Experience" fullWidth multiline minRows={2} value={form.previousPets} onChange={(e) => onChange('previousPets', e.target.value)} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Emergency Contact Name" fullWidth value={form.emergencyContact.name} onChange={(e) => setForm((f)=>({ ...f, emergencyContact: { ...f.emergencyContact, name: e.target.value } }))} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField label="Relationship" fullWidth value={form.emergencyContact.relationship} onChange={(e) => setForm((f)=>({ ...f, emergencyContact: { ...f.emergencyContact, relationship: e.target.value } }))} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField label="Contact Phone" fullWidth value={form.emergencyContact.phone} onChange={(e) => setForm((f)=>({ ...f, emergencyContact: { ...f.emergencyContact, phone: e.target.value } }))} />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" disabled={submitting || loading} onClick={submit} sx={{ backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#388e3c' } }}>
                    {submitting ? 'Submitting…' : 'Submit Adoption Application'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default AdoptionDetails
