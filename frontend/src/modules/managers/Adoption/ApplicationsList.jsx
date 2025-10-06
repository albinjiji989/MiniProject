import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient, adoptionAPI, resolveMediaUrl } from '../../../services/api'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Pagination
} from '@mui/material'

const ApplicationsList = () => {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [actionLoadingId, setActionLoadingId] = useState('')

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit])

  const load = async (signal) => {
    setLoading(true)
    try {
      const res = await apiClient.get('/adoption/manager/applications', { params: { status, page, limit, fields: 'status,paymentStatus,contractURL,userId.name,userId.email,petId.name,petId.breed,createdAt', lean: true }, signal })
      const raw = res.data?.data?.applications || []
      const minimal = raw.map(app => ({
        _id: app._id,
        status: app.status,
        createdAt: app.createdAt,
        paymentStatus: app.paymentStatus,
        contractURL: app.contractURL,
        userId: app.userId ? { name: app.userId.name, email: app.userId.email } : null,
        petId: app.petId ? { name: app.petId.name, breed: app.petId.breed } : null,
      }))
      setItems(minimal)
      setTotal(res.data?.data?.pagination?.total || 0)
    } catch (e) {
      if (e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED') {
        // silently ignore aborted requests
      } else {
        console.error('Load applications failed', e)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const ac = new AbortController()
    load(ac.signal)
    return () => ac.abort()
  }, [page, limit])

  useEffect(() => {
    let ac
    const t = setTimeout(() => {
      ac = new AbortController()
      setPage(1)
      load(ac.signal)
    }, 300)
    return () => { clearTimeout(t); if (ac) ac.abort() }
  }, [status])

  const StatusChip = ({ value }) => {
    const map = {
      pending: { color: 'warning', label: 'PENDING' },
      approved: { color: 'success', label: 'APPROVED' },
      rejected: { color: 'error', label: 'REJECTED' },
      payment_pending: { color: 'info', label: 'PAYMENT PENDING' },
      completed: { color: 'success', label: 'COMPLETED' },
    }
    const meta = map[value] || { color: 'default', label: (value || '').toUpperCase() }
    return <Chip size="small" color={meta.color} label={meta.label} variant="outlined" />
  }

  const generateCertificate = async (applicationId) => {
    try {
      setActionLoadingId(applicationId)
      // 1) Try to fetch existing contract
      let contractURL = ''
      try {
        const resGet = await apiClient.get(`/adoption/manager/contracts/${applicationId}`)
        contractURL = resGet?.data?.data?.contractURL || ''
      } catch (e) {
        // 2) If not found, generate it
        if (e?.response?.status === 404) {
          const resGen = await apiClient.post(`/adoption/manager/contracts/generate/${applicationId}`)
          contractURL = resGen?.data?.data?.contractURL || ''
        } else {
          throw e
        }
      }

      if (!contractURL) {
        throw new Error('Contract URL not available')
      }

      // 3) Generate certificate with agreementFile
      const res = await adoptionAPI.generateCertificate(applicationId, contractURL)
      const url = res?.data?.data?.agreementFile || res?.data?.data?.contractURL
      if (url) {
        await load()
        alert('Certificate generated')
      }
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || 'Failed to generate certificate')
    } finally {
      setActionLoadingId('')
    }
  }

  const viewCertificate = async (applicationId, fallbackUrl) => {
    try {
      setActionLoadingId(applicationId)
      // Directly stream from backend to avoid CORS
      const resp = await apiClient.get(`/adoption/certificates/${applicationId}/file`, { responseType: 'blob' })
      const blob = new Blob([resp.data], { type: resp.headers['content-type'] || 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      // Try to extract filename from Content-Disposition
      const dispo = resp.headers['content-disposition'] || ''
      const match = dispo.match(/filename="?([^";]+)"?/i)
      const fallback = `certificate_${applicationId}.pdf`
      const fname = (match && match[1]) ? match[1] : fallback
      a.href = blobUrl
      a.download = fname
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.open(blobUrl, '_blank')
    } catch (e) {
      // Fallback: attempt to open provided URL if present
      const resolved = fallbackUrl ? resolveMediaUrl(fallbackUrl) : ''
      if (resolved) window.open(resolved, '_blank')
      else alert(e?.response?.data?.error || e?.message || 'Failed to fetch certificate')
    } finally {
      setActionLoadingId('')
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={700}>Applications</Typography>
        <Stack direction="row" spacing={1}>
          <FormControl size="small">
            <InputLabel id="status-label">Status</InputLabel>
            <Select labelId="status-label" label="Status" value={status} onChange={(e)=>setStatus(e.target.value)} sx={{ minWidth: 180 }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="payment_pending">Payment Pending</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={()=>{ setPage(1) }}>Filter</Button>
        </Stack>
      </Box>

      <Card>
        <CardContent>
          <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Pet</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Applied</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5}>Loading...</TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={5}>No applications found</TableCell></TableRow>
                ) : (
                  items.map(app => (
                    <TableRow key={app._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{app.userId?.name || '-'}</Typography>
                        <Typography variant="caption" color="text.secondary">{app.userId?.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{app.petId?.name || '-'}</Typography>
                        <Typography variant="caption" color="text.secondary">{app.petId?.breed}</Typography>
                      </TableCell>
                      <TableCell><StatusChip value={app.status} /></TableCell>
                      <TableCell>{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={()=>navigate(`/manager/adoption/applications/${app._id}`)} sx={{ mr: 1 }}>View</Button>
                        {app.paymentStatus === 'completed' && (
                          <>
                            <Button size="small" variant="contained" color="success" disabled={actionLoadingId===app._id} onClick={()=>generateCertificate(app._id)} sx={{ mr: 1 }}>Generate Certificate</Button>
                            <Button size="small" variant="outlined" disabled={actionLoadingId===app._id} onClick={()=>viewCertificate(app._id, app.contractURL)}>View Certificate</Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
        </CardContent>
      </Card>

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">Total: {total}</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small">
            <Select value={limit} onChange={(e)=>{ setLimit(Number(e.target.value)); setPage(1); }}>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </FormControl>
          <Pagination count={totalPages} page={page} onChange={(_,p)=>setPage(p)} size="small" />
        </Stack>
      </Stack>
    </Box>
  )
}

export default ApplicationsList
