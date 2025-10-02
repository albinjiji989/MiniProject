import React, { useEffect, useState } from 'react'
import { Container, Box, Typography, Card, CardContent, Grid, TextField, InputAdornment, IconButton, Table, TableHead, TableRow, TableCell, TableBody, Button, Collapse, CircularProgress, Snackbar, Alert, Pagination } from '@mui/material'
import { Search as SearchIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon, Pets as PetsIcon, History as HistoryIcon, LocalHospital as LocalHospitalIcon, Info as InfoIcon } from '@mui/icons-material'
import { usersAPI } from '../../../services/api'
import { useNavigate } from 'react-router-dom'

const OwnershipByUser = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [expandedUserIds, setExpandedUserIds] = useState({})
  const [userIdToPets, setUserIdToPets] = useState({})
  const [loading, setLoading] = useState(false)
  const [petsLoading, setPetsLoading] = useState({})
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')

  const loadUsers = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 10, search, role: 'public_user' }
      const res = await usersAPI.getUsers(params)
      const data = res.data?.data || []
      const pagination = res.data?.pagination || {}
      setUsers(Array.isArray(data) ? data : (data.users || []))
      setPages(pagination.pages || 1)
      setTotal(pagination.total || 0)
    } catch (e) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [page])

  const toggleExpand = async (user) => {
    const currentlyExpanded = !!expandedUserIds[user._id]
    const newState = { ...expandedUserIds, [user._id]: !currentlyExpanded }
    setExpandedUserIds(newState)
    if (!currentlyExpanded && !userIdToPets[user._id]) {
      try {
        setPetsLoading((p) => ({ ...p, [user._id]: true }))
        const res = await usersAPI.getUserPets(user._id)
        setUserIdToPets((m) => ({ ...m, [user._id]: res.data?.data || [] }))
      } catch (e) {
        setError('Failed to load pets for user')
      } finally {
        setPetsLoading((p) => ({ ...p, [user._id]: false }))
      }
    }
  }

  const doSearch = (e) => {
    e?.preventDefault?.()
    setPage(1)
    loadUsers()
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>Ownership by User</Typography>
          <Typography variant="subtitle1" color="text.secondary">Browse public users, view their pets, and jump to details, medical and ownership history</Typography>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search users by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') doSearch(e) }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={doSearch}>
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>

          {loading ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width={60}></TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Pets</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => {
                    const expanded = !!expandedUserIds[u._id]
                    const pets = userIdToPets[u._id] || []
                    return (
                      <React.Fragment key={u._id}>
                        <TableRow>
                          <TableCell>
                            <IconButton onClick={() => toggleExpand(u)} size="small">
                              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </TableCell>
                          <TableCell>{u.name || '-'}</TableCell>
                          <TableCell>{u.email || '-'}</TableCell>
                          <TableCell>{u.petCount ?? (Array.isArray(pets) ? pets.length : 0)}</TableCell>
                          <TableCell>{u.isActive ? 'Active' : 'Inactive'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                            <Collapse in={expanded} timeout="auto" unmountOnExit>
                              <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                                {petsLoading[u._id] ? (
                                  <Box display="flex" justifyContent="center" py={3}><CircularProgress size={20} /></Box>
                                ) : (
                                  <Grid container spacing={2}>
                                    {pets.length === 0 && (
                                      <Grid item xs={12}><Typography color="text.secondary">No pets found</Typography></Grid>
                                    )}
                                    {pets.map((p) => (
                                      <Grid item xs={12} md={6} lg={4} key={p._id}>
                                        <Card variant="outlined">
                                          <CardContent>
                                            <Typography variant="h6" gutterBottom>{p.name || 'Unnamed Pet'}</Typography>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                              {(p.category?.displayName || p.category || 'Category') + ' • ' + (p.species?.displayName || p.species?.name || 'Species') + ' • ' + (p.breed?.displayName || p.breed?.name || 'Breed')}
                                            </Typography>
                                            <Box display="flex" gap={1} mt={1}>
                                              <Button size="small" startIcon={<InfoIcon />} onClick={() => navigate(`/admin/pets/${p._id}`)}>Details</Button>
                                              <Button size="small" startIcon={<LocalHospitalIcon />} onClick={() => navigate(`/admin/pets/${p._id}/medical-records`)}>Medical</Button>
                                              <Button size="small" startIcon={<HistoryIcon />} onClick={() => navigate(`/admin/pets/${p._id}/ownership-history`)}>Ownership</Button>
                                            </Box>
                                          </CardContent>
                                        </Card>
                                      </Grid>
                                    ))}
                                  </Grid>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    )
                  })}
                </TableBody>
              </Table>
              <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                <Typography variant="body2" color="text.secondary">Total: {total}</Typography>
                <Pagination count={pages} page={page} onChange={(_, v) => setPage(v)} />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {error && (
        <Snackbar open autoHideDuration={6000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>{error}</Alert>
        </Snackbar>
      )}
    </Container>
  )
}

export default OwnershipByUser


