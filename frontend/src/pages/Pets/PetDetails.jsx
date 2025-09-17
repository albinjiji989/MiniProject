import React, { useEffect, useState } from 'react'
import { Box, Typography, Card, CardContent, Button, Grid, Divider, TextField, MenuItem, Alert, Tabs, Tab, List, ListItem, ListItemText } from '@mui/material'
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import { petsAPI } from '../../services/api'

const PetDetails = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [pet, setPet] = useState(null)
  const [history, setHistory] = useState({ ownershipHistory: [], medicalHistory: [], vaccinationRecords: [], medicationRecords: [] })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)
  const [changelog, setChangelog] = useState([])

  // forms
  const [vaccination, setVaccination] = useState({ vaccineName: '', dateGiven: '', veterinarian: '' })
  const [medication, setMedication] = useState({ medicationName: '', dosage: '', frequency: '', startDate: '', endDate: '', prescribedBy: '' })
  const [owner, setOwner] = useState({ ownerType: 'other', ownerName: '', startDate: '' })

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const [petRes, histRes, logRes] = await Promise.all([petsAPI.getPet(id), petsAPI.getHistory(id), petsAPI.getChangeLog(id)])
      setPet(petRes.data.data.pet)
      setHistory(histRes.data.data)
      setChangelog(logRes.data?.data?.logs || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load pet')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/pets')}
          sx={{ mr: 2 }}
        >
          Back to Pets
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Pet Details
        </Typography>
      </Box>

      <Card>
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography variant="h6" sx={{ mb: 2 }}>
            {loading ? 'Loading...' : (pet?.name || 'Pet Details')}
          </Typography>
          {!loading && pet && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Created by {pet.createdBy?.name || 'Unknown'} on {pet.createdAt ? new Date(pet.createdAt).toLocaleString() : '-'} • Last updated by {pet.lastUpdatedBy?.name || 'Unknown'} on {pet.updatedAt ? new Date(pet.updatedAt).toLocaleString() : '-'}
            </Typography>
          )}
          {!loading && pet && (
            <Box>
              <Tabs value={tab} onChange={(e, v)=>setTab(v)} sx={{ mb: 2 }}>
                <Tab label="Details" />
                <Tab label="History" />
                <Tab label="Change Log" />
              </Tabs>
              {tab === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><strong>Species:</strong> {pet.species}</Grid>
                <Grid item xs={12} sm={6}><strong>Breed:</strong> {pet.breed || '-'}</Grid>
                <Grid item xs={12} sm={6}><strong>Gender:</strong> {pet.gender}</Grid>
                <Grid item xs={12} sm={6}><strong>Age (years):</strong> {pet.ageYears ?? '-'}</Grid>
                <Grid item xs={12} sm={6}><strong>Size:</strong> {pet.size}</Grid>
                <Grid item xs={12} sm={6}><strong>Weight (kg):</strong> {pet.weightKg ?? '-'}</Grid>
                <Grid item xs={12} sm={6}><strong>Status:</strong> {pet.currentStatus}</Grid>
                <Grid item xs={12} sm={6}><strong>Microchip:</strong> {pet.microchipId || '-'}</Grid>
              </Grid>
              )}
              {tab === 1 && (
              <>
              <Divider sx={{ my: 1 }} />

              <Typography variant="subtitle1" sx={{ mb: 1 }}>Vaccination Records</Typography>
              {(history.vaccinationRecords || []).map((v, idx) => (
                <Typography key={idx} variant="body2">• {v.vaccineName} on {new Date(v.dateGiven).toLocaleDateString()} ({v.veterinarian || 'N/A'})</Typography>
              ))}
              <Box component="form" onSubmit={async (e)=>{e.preventDefault(); try{ await petsAPI.addVaccination(id, vaccination); setVaccination({ vaccineName:'', dateGiven:'', veterinarian:'' }); await load(); }catch(err){ setError(err?.response?.data?.message||'Failed to add vaccination') } }} sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <TextField size="small" label="Vaccine" value={vaccination.vaccineName} onChange={(e)=>setVaccination(v=>({...v, vaccineName:e.target.value}))} />
                <TextField size="small" type="date" label="Date" InputLabelProps={{ shrink: true }} value={vaccination.dateGiven} onChange={(e)=>setVaccination(v=>({...v, dateGiven:e.target.value}))} />
                <TextField size="small" label="Veterinarian" value={vaccination.veterinarian} onChange={(e)=>setVaccination(v=>({...v, veterinarian:e.target.value}))} />
                <Button type="submit" variant="outlined" size="small">Add</Button>
              </Box>

              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Medication Records</Typography>
              {(history.medicationRecords || []).map((m, idx) => (
                <Typography key={idx} variant="body2">• {m.medicationName} {m.dosage ? `(${m.dosage})` : ''} {m.frequency ? `- ${m.frequency}` : ''}</Typography>
              ))}
              <Box component="form" onSubmit={async (e)=>{e.preventDefault(); try{ await petsAPI.addMedication(id, medication); setMedication({ medicationName:'', dosage:'', frequency:'', startDate:'', endDate:'', prescribedBy:'' }); await load(); }catch(err){ setError(err?.response?.data?.message||'Failed to add medication') } }} sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <TextField size="small" label="Medication" value={medication.medicationName} onChange={(e)=>setMedication(v=>({...v, medicationName:e.target.value}))} />
                <TextField size="small" label="Dosage" value={medication.dosage} onChange={(e)=>setMedication(v=>({...v, dosage:e.target.value}))} />
                <TextField size="small" label="Frequency" value={medication.frequency} onChange={(e)=>setMedication(v=>({...v, frequency:e.target.value}))} />
                <TextField size="small" type="date" label="Start" InputLabelProps={{ shrink: true }} value={medication.startDate} onChange={(e)=>setMedication(v=>({...v, startDate:e.target.value}))} />
                <TextField size="small" type="date" label="End" InputLabelProps={{ shrink: true }} value={medication.endDate} onChange={(e)=>setMedication(v=>({...v, endDate:e.target.value}))} />
                <Button type="submit" variant="outlined" size="small">Add</Button>
              </Box>

              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Ownership History</Typography>
              {(history.ownershipHistory || []).map((o, idx) => (
                <Typography key={idx} variant="body2">• {o.ownerName || o.ownerType} from {o.startDate ? new Date(o.startDate).toLocaleDateString() : '-'} {o.endDate ? `to ${new Date(o.endDate).toLocaleDateString()}` : '(present)'}</Typography>
              ))}
              <Box component="form" onSubmit={async (e)=>{e.preventDefault(); try{ await petsAPI.addOwnership(id, owner); setOwner({ ownerType:'other', ownerName:'', startDate:'' }); await load(); }catch(err){ setError(err?.response?.data?.message||'Failed to add owner') } }} sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <TextField select size="small" label="Owner Type" value={owner.ownerType} onChange={(e)=>setOwner(v=>({...v, ownerType:e.target.value}))}>
                  {['public_user','shelter','adoption_center','rescue','temporary_care','veterinary','pharmacy','pet_shop','other'].map(t => (<MenuItem key={t} value={t}>{t}</MenuItem>))}
                </TextField>
                <TextField size="small" label="Owner Name" value={owner.ownerName} onChange={(e)=>setOwner(v=>({...v, ownerName:e.target.value}))} />
                <TextField size="small" type="date" label="Start Date" InputLabelProps={{ shrink: true }} value={owner.startDate} onChange={(e)=>setOwner(v=>({...v, startDate:e.target.value}))} />
                <Button type="submit" variant="outlined" size="small">Add</Button>
              </Box>
              </>
              )}
              {tab === 2 && (
                <Box>
                  <List>
                    {changelog.map((log) => (
                      <ListItem key={log._id} alignItems="flex-start">
                        <ListItemText
                          primary={`${log.action} by ${log.changedBy?.name || 'Unknown'} on ${new Date(log.createdAt).toLocaleString()}`}
                          secondary={
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(log.changes && Object.keys(log.changes).length ? log.changes : log.meta, null, 2)}</pre>
                          }
                        />
                      </ListItem>
                    ))}
                    {(!changelog || changelog.length === 0) && (
                      <ListItem><ListItemText primary="No change log entries yet." /></ListItem>
                    )}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default PetDetails
