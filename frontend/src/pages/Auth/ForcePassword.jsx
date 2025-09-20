import React, { useState } from 'react'
import { Box, Paper, Container, Typography, TextField, Button, Alert, InputAdornment, IconButton } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'

const ForcePassword = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    try {
      setBusy(true)
      await api.post('/auth/force-password', { currentPassword, newPassword })
      setSuccess('Password updated successfully! Redirecting to login...')
      setBusy(false)
      setTimeout(async () => {
        try { await logout() } catch (_) {}
        navigate('/login', { replace: true })
      }, 800)
    } catch (err) {
      setBusy(false)
      setError(err?.response?.data?.message || 'Could not update password')
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h5" fontWeight={800} gutterBottom>Update your password</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Hello {user?.name || ''}, you must set a new password before accessing the dashboard.
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 1.5 }}>
            <TextField
              type={showCurrent ? "text" : "password"}
              label="Current temporary password"
              value={currentPassword}
              onChange={(e)=>setCurrentPassword(e.target.value)}
              required
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle current password visibility"
                      onClick={() => setShowCurrent(!showCurrent)}
                      edge="end"
                    >
                      {showCurrent ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <TextField
              type={showNew ? "text" : "password"}
              label="New password"
              value={newPassword}
              onChange={(e)=>setNewPassword(e.target.value)}
              required
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle new password visibility"
                      onClick={() => setShowNew(!showNew)}
                      edge="end"
                    >
                      {showNew ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <TextField
              type={showConfirm ? "text" : "password"}
              label="Confirm new password"
              value={confirmPassword}
              onChange={(e)=>setConfirmPassword(e.target.value)}
              required
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() => setShowConfirm(!showConfirm)}
                      edge="end"
                    >
                      {showConfirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Button type="submit" variant="contained" disabled={busy}>{busy ? 'Updating...' : 'Update password'}</Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}

export default ForcePassword


