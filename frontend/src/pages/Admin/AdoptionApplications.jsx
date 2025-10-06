import React, { useEffect, useState } from 'react'
import { adoptionAPI, apiClient, resolveMediaUrl } from '../../services/api'
import { Box, Typography, Card, CardContent, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, Chip, TextField, Button, Drawer, Divider, Stack } from '@mui/material'

export default function AdoptionApplicationsAdmin() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [details, setDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adoptionAPI.getAllAdoptions({ q })
      const items = res?.data?.data || res?.data || []
      const normalized = (Array.isArray(items) ? items : []).map(a => ({
        id: a._id || a.id,
        status: a.status || '-',
        userName: a.userId?.name || a.user?.name || 'User',
        userEmail: a.userId?.email || a.user?.email || '-',
        petName: a.petId?.name || 'Pet',
        petSpecies: a.petId?.species || '-',
        petBreed: a.petId?.breed || '-',
        createdAt: a.createdAt ? new Date(a.createdAt).toLocaleString() : '-',
        fee: a.petId?.adoptionFee || 0,
      }))
      setApps(normalized)
    } catch (e) {
      setError('Failed to load adoption applications')
      setApps([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const color = (s) => {
    switch ((s||'').toLowerCase()) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'payment_completed':
      case 'completed': return 'info';
      default: return 'default';
    }
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>Adoption Applications (Admin)</Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display:'flex', gap: 1 }}>
          <TextField size="small" placeholder="Search by user/pet..." value={q} onChange={(e)=>setQ(e.target.value)} />
          <Button variant="outlined" onClick={load}>Search</Button>
        </CardContent>
      </Card>

      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      {loading && <Typography>Loading...</Typography>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Applicant</TableCell>
              <TableCell>Pet</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Applied At</TableCell>
              <TableCell>Fee</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {apps.map(a => (
              <TableRow key={a.id} hover sx={{ cursor: 'pointer' }} onClick={async ()=>{
                setSelectedId(a.id)
                setDrawerOpen(true)
                setDetails(null)
                setDetailsLoading(true)
                try {
                  const res = await apiClient.get(`/adoption/admin/applications/${a.id}`)
                  setDetails(res?.data?.data || null)
                } catch (_) {}
                setDetailsLoading(false)
              }}>
                <TableCell>
                  <Typography variant="subtitle2">{a.userName}</Typography>
                  <Typography variant="caption" color="text.secondary">{a.userEmail}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">{a.petName}</Typography>
                  <Typography variant="caption" color="text.secondary">{a.petSpecies} • {a.petBreed}</Typography>
                </TableCell>
                <TableCell><Chip size="small" label={a.status} color={color(a.status)} /></TableCell>
                <TableCell>{a.createdAt}</TableCell>
                <TableCell>₹{a.fee}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Details Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={()=>setDrawerOpen(false)}>
        <Box sx={{ width: 420, p: 2 }} role="presentation">
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Application Details</Typography>
          <Divider sx={{ my: 1 }} />
          {detailsLoading && <Typography>Loading...</Typography>}
          {!detailsLoading && !details && <Typography color="text.secondary">No data</Typography>}
          {!detailsLoading && details && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2">Applicant</Typography>
                <Typography variant="body2">{details.userId?.name}</Typography>
                <Typography variant="body2" color="text.secondary">{details.userId?.email} {details.userId?.phone ? '• '+details.userId?.phone : ''}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Pet</Typography>
                <Typography variant="body2">{details.petId?.name}</Typography>
                <Typography variant="body2" color="text.secondary">{details.petId?.breed} • {details.petId?.species}</Typography>
                <Typography variant="body2" color="text.secondary">Fee: ₹{details.petId?.adoptionFee || 0}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Status</Typography>
                <Typography variant="body2">{details.status}</Typography>
                <Typography variant="body2" color="text.secondary">Payment: {details.paymentStatus || 'n/a'}</Typography>
                {details.paymentDetails && (
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Order: {details.paymentDetails.razorpayOrderId}</Typography><br />
                    <Typography variant="caption" color="text.secondary">Payment: {details.paymentDetails.razorpayPaymentId}</Typography>
                  </Box>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2">Application Data</Typography>
                <Typography variant="body2" color="text.secondary">Home: {details.applicationData?.homeType} • Garden: {details.applicationData?.hasGarden ? 'Yes' : 'No'}</Typography>
                <Typography variant="body2" color="text.secondary">Experience: {details.applicationData?.petExperience}</Typography>
                <Typography variant="body2" color="text.secondary">Work: {details.applicationData?.workSchedule} • Time at home: {details.applicationData?.timeAtHome}</Typography>
                {details.applicationData?.adoptionReason && <Typography variant="body2">Reason: {details.applicationData.adoptionReason}</Typography>}
              </Box>
              <Box>
                <Typography variant="subtitle2">Documents</Typography>
                {Array.isArray(details.documents) && details.documents.length>0 ? (
                  details.documents.map((d, i) => (
                    <Typography key={i} variant="body2"><a href={resolveMediaUrl(d.url)} target="_blank" rel="noreferrer">{d.name || d.type || d.url}</a></Typography>
                  ))
                ) : (Array.isArray(details.applicationData?.documents) && details.applicationData.documents.length>0 ? (
                  details.applicationData.documents.map((u, i) => (
                    <Typography key={i} variant="body2"><a href={resolveMediaUrl(u)} target="_blank" rel="noreferrer">{u}</a></Typography>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">No documents</Typography>
                ))}
              </Box>
              <Box>
                <Typography variant="subtitle2">Contract</Typography>
                {details.contractURL ? (
                  <Button size="small" onClick={()=>window.open(resolveMediaUrl(details.contractURL), '_blank')}>Open Contract</Button>
                ) : (
                  <Typography variant="body2" color="text.secondary">Not generated</Typography>
                )}
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Quick Links</Typography>
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="outlined" onClick={()=>{
                    const email = details.userId?.email || ''
                    const target = email ? `/admin/users?email=${encodeURIComponent(email)}` : '/admin/users'
                    window.open(target, '_blank')
                  }}>Open User (Admin)</Button>
                  <Button size="small" variant="outlined" onClick={()=>{
                    const pid = details.petId?._id || details.petId?.id || details.petId
                    if (pid) window.open(`/manager/adoption/pets/${pid}`,'_blank')
                  }}>Open Pet (Manager)</Button>
                </Stack>
              </Box>
            </Stack>
          )}
        </Box>
      </Drawer>
    </Box>
  )
}
