import React, { useEffect, useState } from 'react'
import { Container, Box, Typography, Card, CardContent, Grid, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Pagination, InputAdornment, Tooltip } from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Block as BlockIcon, RestartAlt as RestoreIcon, Search as SearchIcon } from '@mui/icons-material'
import { petCategoriesAPI } from '../../../services/petSystemAPI'

const PetCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', displayName: '', description: '' })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('active')

  const load = async () => {
    setLoading(true)
    try {
      // Convert status filter for backend API
      let isActiveParam
      if (status === 'active') isActiveParam = true
      else if (status === 'disabled') isActiveParam = false
      // For 'all', leave undefined to get both active and inactive

      const res = await petCategoriesAPI.list({ page, limit: 10, search, isActive: isActiveParam })
      const data = res.data?.data || []
      const pagination = res.data?.pagination || {}
      setCategories(Array.isArray(data) ? data : (data.categories || []))
      setPages(pagination.pages || 1)
      setTotal(pagination.total || 0)
    } catch (e) {
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, status])

  const openAdd = () => { setEditing(null); setForm({ name: '', displayName: '', description: '' }); setDialogOpen(true) }
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, displayName: c.displayName, description: c.description || '' }); setDialogOpen(true) }

  const toSlug = (text) => String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  const generateUniqueKey = (baseKey, currentId) => {
    const existing = new Set(
      (categories || [])
        .filter((c) => !currentId || c._id !== currentId)
        .map((c) => String(c.name).toLowerCase())
    )
    let k = baseKey
    let i = 2
    while (existing.has(k)) {
      k = `${baseKey}-${i}`
      i += 1
    }
    return k
  }

  useEffect(() => {
    if (!dialogOpen) return
    // Only auto-generate for new category; keep existing key for edits
    if (editing) return
    if (!form.displayName?.trim()) {
      setForm((f) => ({ ...f, name: '' }))
      return
    }
    const slug = toSlug(form.displayName)
    const unique = generateUniqueKey(slug)
    setForm((f) => ({ ...f, name: unique }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.displayName, dialogOpen, editing])

  const save = async () => {
    try {
      let payload = { ...form }
      if (!payload.displayName?.trim()) { setError('Display Name is required'); return }
      if (editing) {
        // Keep existing key unchanged on edit
        await petCategoriesAPI.update(editing._id, payload)
        setSuccess('Category updated')
      } else {
        // Generate unique key on create
        let base = toSlug(payload.displayName)
        base = generateUniqueKey(base)
        payload.name = base
        await petCategoriesAPI.create(payload)
        setSuccess('Category created')
      }
      setDialogOpen(false)
      load()
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save category')
    }
  }

  const disable = async (c) => {
    try {
      await petCategoriesAPI.delete(c._id)
      setSuccess('Category disabled')
      load()
    } catch (e) {
      setError('Failed to disable category')
    }
  }

  const restore = async (c) => {
    try {
      await petCategoriesAPI.restore(c._id)
      setSuccess('Category restored')
      load()
    } catch (e) {
      setError('Failed to restore category')
    }
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>Pet Categories</Typography>
          <Typography variant="subtitle1" color="text.secondary">Manage dynamic pet categories</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>Add Category</Button>
      </Box>

      <Card>
        <CardContent>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search by name or key"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); load() } }}
                InputProps={{ startAdornment: (
                  <InputAdornment position="start"><SearchIcon /></InputAdornment>
                )}}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <Chip label="Active" color={status==='active'?'primary':'default'} onClick={() => { setStatus('active'); setPage(1) }} clickable />
                <Chip label="Disabled" color={status==='disabled'?'primary':'default'} onClick={() => { setStatus('disabled'); setPage(1) }} clickable />
                <Chip label="All" color={status==='all'?'primary':'default'} onClick={() => { setStatus('all'); setPage(1) }} clickable />
              </Box>
            </Grid>
          </Grid>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Display Name</TableCell>
                <TableCell>Key</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((c) => (
                <TableRow key={c._id}>
                  <TableCell>{c.displayName}</TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.description || '-'}</TableCell>
                  <TableCell>
                    <Chip label={c.isActive ? 'Active' : 'Disabled'} color={c.isActive ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit"><span><IconButton size="small" color="primary" onClick={() => openEdit(c)}><EditIcon /></IconButton></span></Tooltip>
                    {c.isActive ? (
                      <Tooltip title="Disable"><span><IconButton size="small" color="error" onClick={() => disable(c)}><BlockIcon /></IconButton></span></Tooltip>
                    ) : (
                      <Tooltip title="Restore"><span><IconButton size="small" color="success" onClick={() => restore(c)}><RestoreIcon /></IconButton></span></Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pages > 1 && (
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
              <Typography variant="body2" color="text.secondary">Total: {total}</Typography>
              <Pagination count={pages} page={page} onChange={(_, v) => setPage(v)} />
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Display Name *" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Key (unique)" value={form.name} disabled helperText={editing ? 'Auto-generated key (immutable)' : 'Auto-generated from Display Name'} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={save} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {error && (
        <Snackbar open autoHideDuration={6000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>{error}</Alert>
        </Snackbar>
      )}
      {success && (
        <Snackbar open autoHideDuration={6000} onClose={() => setSuccess('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>{success}</Alert>
        </Snackbar>
      )}
    </Container>
  )
}

export default PetCategories


