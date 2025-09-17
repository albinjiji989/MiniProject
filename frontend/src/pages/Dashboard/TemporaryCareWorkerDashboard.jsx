import React, { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Button,
} from '@mui/material'
import {
  Support as TemporaryCareIcon,
  People as PeopleIcon,
  Assignment as TaskIcon,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { temporaryCareAPI } from '../../services/api'

const TemporaryCareWorkerDashboard = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalRequests: 0, activeCare: 0 })
  const [requests, setRequests] = useState([])
  const [caregivers, setCaregivers] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [statsRes, reqRes, cgRes] = await Promise.all([
          temporaryCareAPI.getStats().catch(() => ({ data: { data: { totalRequests: 0, activeCare: 0 } } })),
          temporaryCareAPI.listCareRequests({ limit: 10 }).catch(() => ({ data: { data: { temporaryCares: [] } } })),
          temporaryCareAPI.listCaregivers({ limit: 10 }).catch(() => ({ data: { data: { caregivers: [] } } })),
        ])
        setStats(statsRes.data.data || { totalRequests: 0, activeCare: 0 })
        setRequests(reqRes.data.data?.temporaryCares || [])
        setCaregivers(cgRes.data.data?.caregivers || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center' }}>
          <TemporaryCareIcon sx={{ mr: 1 }} /> Temporary Care - Worker
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome {user?.name}. View assigned requests and available caregivers.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Total Requests</Typography>
              <Typography variant="h4">{stats.totalRequests || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Active Care</Typography>
              <Typography variant="h4">{stats.activeCare || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <TaskIcon sx={{ mr: 1 }} /> Recent Care Requests
                </Typography>
              </Box>
              {requests.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No requests yet.</Typography>
              ) : (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Pet</TableCell>
                        <TableCell>Owner</TableCell>
                        <TableCell>Caregiver</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Start</TableCell>
                        <TableCell>End</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {requests.map((r) => (
                        <TableRow key={r._id}>
                          <TableCell>{r.pet?.name || '-'}</TableCell>
                          <TableCell>{r.owner?.name || '-'}</TableCell>
                          <TableCell>{r.caregiver?.name || '-'}</TableCell>
                          <TableCell>
                            <Chip label={r.careType} size="small" />
                          </TableCell>
                          <TableCell>{r.startDate ? new Date(r.startDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{r.endDate ? new Date(r.endDate).toLocaleDateString() : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ mr: 1 }} /> Caregivers
              </Typography>
              {caregivers.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No caregivers found.</Typography>
              ) : (
                caregivers.slice(0, 5).map((c) => (
                  <Box key={c._id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
                    <Box>
                      <Typography variant="subtitle2">{c.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.email}</Typography>
                    </Box>
                    <Chip label={c.status} size="small" />
                  </Box>
                ))
              )}
              <Button size="small" sx={{ mt: 1 }} onClick={() => { /* future: navigate to caregivers page */ }}>View all</Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default TemporaryCareWorkerDashboard


