import React, { useState, useEffect } from 'react'
import { AppBar, Toolbar, IconButton, Box, Container, Paper, Typography, Alert, Button, Divider, TextField, InputAdornment } from '@mui/material'
import { ArrowBack, CheckCircle, Favorite, LocalHospital, Google as GoogleIcon, Email as EmailIcon, Lock as LockIcon, Visibility, VisibilityOff } from '@mui/icons-material'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

import BrandMark from '../../components/BrandMark'

// UnifiedAuth component for login
const UnifiedAuth = ({ mode = 'signin', onSuccess, onError }) => {
  const { login, loginWithGoogle } = useAuth()
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const res = await login({ email, password })
    setBusy(false)
    if (res.success) onSuccess(res.user || {})
    else onError(res.error || 'Login failed')
  }

  const google = async () => {
    setBusy(true)
    try {
      const res = await loginWithGoogle()
      setBusy(false)
      if (res.success) onSuccess(res.user || {})
      else onError(res.error || 'Google login failed')
    } catch (error) {
      setBusy(false)
      onError('Google authentication is currently unavailable. Please use email/password login.')
    }
  }

  return (
    <Box>
      <Typography variant="h5" align="center" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: 0.2, background: 'linear-gradient(90deg,#06b6d4,#22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Welcome Back</Typography>
      <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 2 }}>Sign in to access your pet welfare dashboard</Typography>
      <Button onClick={google} fullWidth variant="outlined" startIcon={<GoogleIcon />} disabled={busy} sx={{ mb: 1.5, py: 1.05, borderRadius: 2, fontWeight: 700 }}>
        {busy ? 'Please wait...' : 'Sign in with Google'}
      </Button>
      <Divider sx={{ my: 1.5 }}><Typography variant="caption" color="text.secondary">Or continue with email</Typography></Divider>
      <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 1.5 }}>
        <TextField
          type="email"
          label="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          InputProps={{ startAdornment: (<InputAdornment position="start"><EmailIcon color="action" /></InputAdornment>) }}
          required
        />
        <TextField
          type={showPassword ? 'text' : 'password'}
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (<InputAdornment position="start"><LockIcon color="action" /></InputAdornment>),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton edge="end" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
          required
        />
        <Button type="submit" variant="contained" disabled={busy} sx={{ py: 1.15, borderRadius: 2, fontWeight: 700, boxShadow: '0 10px 25px rgba(14,165,233,0.35)', background: 'linear-gradient(90deg,#0ea5ea 0%, #34d399 100%)', '&:hover': { background: 'linear-gradient(90deg,#0ea5ea 0%, #22c55e 100%)', boxShadow: '0 12px 30px rgba(34,197,94,0.35)' } }}>
          {busy ? 'Signing in...' : 'Sign In'}
        </Button>
        <Button component={RouterLink} to="/forgot-password" color="inherit" sx={{ textTransform: 'none' }}>Forgot password?</Button>
      </Box>
    </Box>
  )
}

const LoginPage = () => {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deactivatedOpen, setDeactivatedOpen] = useState(false)
  const [deactivatedMessage, setDeactivatedMessage] = useState('Your account has been deactivated by an administrator. Please contact support or the admin to restore access.')
  const navigate = useNavigate()
  const location = useLocation()
  const { user, token } = useAuth()

  // Consider authenticated if we have a user (cookie session) or a token (JWT)
  const isAuthenticated = !!(user || token)

  useEffect(() => {
    if (location.state?.message) setSuccess(location.state.message)
    if (isAuthenticated) {
      // Redirect based on role
      const role = user?.role || ''
      if (role === 'admin' || role === 'super_admin') {
        navigate('/admin/dashboard', { replace: true })
      } else if (role === 'adoption_manager') {
        navigate('/manager/adoption/dashboard', { replace: true })
      } else if (role === 'rescue_manager') {
        navigate('/manager/rescue/dashboard', { replace: true })
      } else if (role === 'petshop_manager') {
        navigate('/manager/petshop/dashboard', { replace: true })
      } else if (role === 'veterinary_manager') {
        navigate('/manager/veterinary/dashboard', { replace: true })
      } else if (role === 'pharmacy_manager') {
        navigate('/manager/pharmacy/dashboard', { replace: true })
      } else if (role === 'ecommerce_manager') {
        navigate('/manager/ecommerce/dashboard', { replace: true })
      } else if (role === 'temporary-care_manager') {
        navigate('/manager/temporary-care/dashboard', { replace: true })
      } else if (typeof role === 'string' && role.endsWith('_manager')) {
        // Fallback for any other manager roles
        navigate('/manager/dashboard', { replace: true })
      } else {
        navigate('/User/dashboard', { replace: true })
      }
    }
    // Show deactivated note if flagged by context init
    const showIfFlagged = () => {
      const flag = sessionStorage.getItem('auth_deactivated')
      if (flag) {
        sessionStorage.removeItem('auth_deactivated')
        const msg = sessionStorage.getItem('auth_deactivated_msg') || 'Your account has been deactivated by an administrator. Please contact support or the admin to restore access.'
        sessionStorage.removeItem('auth_deactivated_msg')
        setDeactivatedMessage(msg)
        setDeactivatedOpen(true)
      }
    }
    showIfFlagged()
    const onDeactivated = (e) => {
      const msg = (e?.detail?.message) || 'Your account has been deactivated by an administrator. Please contact support or the admin to restore access.'
      setDeactivatedMessage(msg)
      setDeactivatedOpen(true)
    }
    window.addEventListener('auth:deactivated', onDeactivated)
    return () => window.removeEventListener('auth:deactivated', onDeactivated)
  }, [isAuthenticated, navigate, location.state, user])

  const handleAuthSuccess = (userData) => {
    // No success banner; navigation is handled by isAuthenticated effect
    setError('')
    setDeactivatedOpen(false)
  }

  const handleAuthError = (errorMessage) => {
    const msg = String(errorMessage || '')
    setError(msg)
    const lower = msg.toLowerCase()
    if (lower.includes('deactivated') || lower.includes('blocked') || lower.includes('disabled') || lower.includes('inactive')) {
      setDeactivatedMessage('Your account is blocked or deactivated by an administrator. Please contact support or the admin to restore access.')
      setDeactivatedOpen(true)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
      <AppBar elevation={0} position="fixed" sx={{ bgcolor: '#0b0b0d', color: 'white', boxShadow: '0 1px 8px rgba(0,0,0,0.25)' }}>
        <Toolbar variant="dense" disableGutters sx={{ maxWidth: 1200, mx: 'auto', px: 2, minHeight: 48 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BrandMark size={24} />
            <Typography variant="subtitle1" fontWeight={700}>PetWelfare Central</Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Button component={RouterLink} to="/" color="inherit" size="small" sx={{ textTransform: 'none' }}>Home</Button>
            <Button component={RouterLink} to="/about" color="inherit" size="small" sx={{ textTransform: 'none' }}>About</Button>
            <Button component={RouterLink} to="/contact" color="inherit" size="small" sx={{ textTransform: 'none' }}>Contact</Button>
            <Button component={RouterLink} to="/login" color="inherit" size="small" sx={{ textTransform: 'none' }}>Login</Button>
            <Button component={RouterLink} to="/register" variant="contained" color="primary" size="small" sx={{ textTransform: 'none', borderRadius: 2 }}>Register</Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Box sx={{ height: 56 }} />
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: { md: '50%' },
          p: { md: 8 },
          alignItems: 'center',
          color: 'white',
          background:
            'radial-gradient(1200px 600px at -10% -10%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%), linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
        }}
      >
        <Box sx={{ maxWidth: 520, pl: { md: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1.5 }}>
            <BrandMark size={44} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { md: '1.4rem' } }}>
                PetWelfare Central
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { md: '0.95rem' } }}>
                Caring for every paw
              </Typography>
            </Box>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 2, fontSize: { md: '2.4rem' } }}>
            Welcome back to our pet community
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.95, mb: 3, fontSize: { md: '1rem' } }}>
            Connect with pet shops, find veterinary care, and help create a better world for our furry friends.
          </Typography>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #00e5ff, #00c853)', display: 'grid', placeItems: 'center' }}>
                <CheckCircle sx={{ fontSize: 18, color: 'white' }} />
              </Box>
              <Typography>Find your perfect companion</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #ff9800, #ff3d00)', display: 'grid', placeItems: 'center' }}>
                <Favorite sx={{ fontSize: 18, color: 'white' }} />
              </Box>
              <Typography>Emergency rescue support</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #7c4dff, #2979ff)', display: 'grid', placeItems: 'center' }}>
                <LocalHospital sx={{ fontSize: 18, color: 'white' }} />
              </Box>
              <Typography>Expert veterinary care</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ width: { xs: '100%', md: '50%' }, display: 'flex', alignItems: 'center', justifyContent: 'center', py: { xs: 6, md: 0 }, background: { xs: 'linear-gradient(135deg, #eef2f3 0%, #e0eafc 100%)', md: 'transparent' } }}>
        <Container maxWidth={false} sx={{ px: 2 }}>
          <Paper elevation={0} sx={{ width: { xs: '100%', sm: 420 }, mx: 'auto', p: { xs: 3, sm: 4 }, borderRadius: 4, background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', boxShadow: '0 30px 80px rgba(31,38,135,0.25)' }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 1 }}>
                <BrandMark size={36} />
                <Typography variant="h5" fontWeight={700} color="primary">Pet Welfare</Typography>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}
            {/* No success alert */}

            <UnifiedAuth mode="signin" onSuccess={handleAuthSuccess} onError={handleAuthError} />

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button component={RouterLink} to="/" startIcon={<ArrowBack />} color="inherit" sx={{ textTransform: 'none' }}>
                Back to Home
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
      {/* Deactivated Account Dialog */}
      <Box>
        <div role="dialog" aria-modal="true" hidden={!deactivatedOpen}>
          <Paper elevation={3} sx={{ position: 'fixed', inset: 0, m: 'auto', width: 360, p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>Account Deactivated</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{deactivatedMessage}</Typography>
            <Button fullWidth variant="contained" onClick={() => setDeactivatedOpen(false)}>OK</Button>
          </Paper>
        </div>
      </Box>
    </Box>
  )
}

export default LoginPage
