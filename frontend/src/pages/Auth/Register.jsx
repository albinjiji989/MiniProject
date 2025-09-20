import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AppBar, Toolbar, Box, Container, Paper, TextField, Button, Typography, Alert, InputAdornment, IconButton as MuiIconButton, Grid, Divider } from '@mui/material'
import { Visibility, VisibilityOff, Email, Lock, Person, Phone, Home, Google as GoogleIcon, ArrowBack } from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import BrandMark from '../../components/BrandMark'
import { useForm } from 'react-hook-form'

const Register = () => {
	const navigate = useNavigate()
    const { signUpWithEmail, signUpWithGoogle, error } = useAuth()
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [isLoading, setIsLoading] = useState(false)

	const {
		register,
		handleSubmit,
		formState: { errors },
		watch,
	} = useForm()

	const password = watch('password')

    const onSubmit = async (data) => {
		setIsLoading(true)
        const userData = {
			name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
			email: data.email,
			password: data.password,
            phone: data.phone
		}
        const result = await signUpWithEmail(userData)
		setIsLoading(false)
        if (result.success) {
            if (result.message) {
                alert(result.message)
            } else {
                alert('Signup successful! Welcome email sent.')
            }
            navigate('/login')
        }
	}

	const handleGoogleSignUp = async () => {
		setIsLoading(true)
		const result = await signUpWithGoogle('public_user')
		setIsLoading(false)
		if (result.success) navigate('/dashboard')
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
						<Button component={Link} to="/" color="inherit" size="small" sx={{ textTransform: 'none' }}>Home</Button>
						<Button component={Link} to="/about" color="inherit" size="small" sx={{ textTransform: 'none' }}>About</Button>
						<Button component={Link} to="/contact" color="inherit" size="small" sx={{ textTransform: 'none' }}>Contact</Button>
						<Button component={Link} to="/login" color="inherit" size="small" sx={{ textTransform: 'none' }}>Login</Button>
						<Button component={Link} to="/register" variant="contained" color="primary" size="small" sx={{ textTransform: 'none', borderRadius: 2 }}>Register</Button>
					</Box>
				</Toolbar>
			</AppBar>
			<Box sx={{ height: 96 }} />

			<Box sx={{ display: { xs: 'none', md: 'flex' }, width: { md: '50%' }, p: { md: 8 }, alignItems: 'center', color: 'white', background: 'radial-gradient(1200px 600px at -10% -10%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%), linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)' }}>
				<Box sx={{ maxWidth: 520, pl: { md: 2 } }}>
					<Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 2, fontSize: { md: '2.4rem' } }}>
						Join thousands of pet lovers worldwide
					</Typography>
					<Typography variant="body1" sx={{ opacity: 0.95, mb: 3, fontSize: { md: '1rem' } }}>
						Connect with shelters, find veterinary care, and help create a better world for our furry friends.
					</Typography>
					<Box sx={{ display: 'grid', gap: 2 }}>
						<Typography>Find your perfect companion</Typography>
						<Typography>Emergency rescue support</Typography>
						<Typography>Expert veterinary care</Typography>
					</Box>
				</Box>
			</Box>

			<Box sx={{ width: { xs: '100%', md: '50%' }, display: 'flex', alignItems: 'center', justifyContent: 'center', py: { xs: 6, md: 0 }, background: { xs: 'linear-gradient(135deg, #eef2f3 0%, #e0eafc 100%)', md: 'transparent' } }}>
				<Container maxWidth={false} sx={{ px: 2, pt: { xs: 1, md: 0 } }}>
					<Paper elevation={0} sx={{ width: { xs: '100%', sm: 520 }, mx: 'auto', mt: { xs: 1, md: 6 }, p: { xs: 3, sm: 4 }, borderRadius: 4, background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px) saturate(160%)', border: '1px solid rgba(255,255,255,0.55)', boxShadow: '0 30px 80px rgba(31,38,135,0.25)' }}>
						<Box sx={{ textAlign: 'center', mb: 2 }}>
							<Typography variant="h5" fontWeight={800} sx={{ letterSpacing: 0.2, background: 'linear-gradient(90deg,#06b6d4,#22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Create Account</Typography>
							<Typography variant="body2" color="text.secondary">Join our community of pet lovers today</Typography>
						</Box>

						{error && (
							<Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
						)}

						<Button onClick={handleGoogleSignUp} startIcon={<GoogleIcon />} fullWidth variant="outlined" disabled={isLoading} sx={{ py: 1.25, borderRadius: 2, mb: 2, backdropFilter: 'blur(6px)', background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { background: 'rgba(255,255,255,0.75)', borderColor: 'rgba(255,255,255,0.7)' } }}>
							Sign up with Google
						</Button>
						<Divider sx={{ my: 2 }}><Typography variant="caption" color="text.secondary">Or continue with email</Typography></Divider>

                        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
						<Grid container spacing={2}>
								<Grid item xs={12} sm={6}>
								<TextField fullWidth label="First Name" margin="normal" autoComplete="given-name" InputProps={{ startAdornment: (<InputAdornment position="start"><Person color="action" /></InputAdornment>) }} {...register('firstName', { required: 'First name is required', minLength: { value: 2, message: 'First name must be at least 2 characters' } })} error={!!errors.firstName} helperText={errors.firstName?.message} />
								</Grid>
								<Grid item xs={12} sm={6}>
								<TextField fullWidth label="Last Name" margin="normal" autoComplete="family-name" InputProps={{ startAdornment: (<InputAdornment position="start"><Person color="action" /></InputAdornment>) }} {...register('lastName', { required: 'Last name is required', minLength: { value: 2, message: 'Last name must be at least 2 characters' } })} error={!!errors.lastName} helperText={errors.lastName?.message} />
								</Grid>
							</Grid>

						<TextField fullWidth label="Email Address" type="email" margin="normal" autoComplete="email" InputProps={{ startAdornment: (<InputAdornment position="start"><Email color="action" /></InputAdornment>) }} {...register('email', { required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' } })} error={!!errors.email} helperText={errors.email?.message} />

                        <TextField fullWidth label="Phone Number" type="tel" margin="normal" autoComplete="tel" InputProps={{ startAdornment: (<InputAdornment position="start"><Phone color="action" /></InputAdornment>) }} {...register('phone', { required: 'Phone number is required', pattern: { value: /^[\+]?[1-9][\d]{0,15}$/, message: 'Invalid phone number' } })} error={!!errors.phone} helperText={errors.phone?.message} />

						<Grid container spacing={2}>
								<Grid item xs={12} sm={6}>
								<TextField fullWidth label="Street Address" margin="normal" autoComplete="street-address" InputProps={{ startAdornment: (<InputAdornment position="start"><Home color="action" /></InputAdornment>) }} {...register('street', { required: 'Street address is required' })} error={!!errors.street} helperText={errors.street?.message} />
								</Grid>
								<Grid item xs={12} sm={6}>
								<TextField fullWidth label="City" margin="normal" autoComplete="address-level2" {...register('city', { required: 'City is required' })} error={!!errors.city} helperText={errors.city?.message} />
								</Grid>
								<Grid item xs={12} sm={6}>
								<TextField fullWidth label="State" margin="normal" autoComplete="address-level1" {...register('state', { required: 'State is required' })} error={!!errors.state} helperText={errors.state?.message} />
								</Grid>
								{/* ZIP Code removed per request */}
							</Grid>

						<TextField fullWidth label="Password" type={showPassword ? 'text' : 'password'} margin="normal" autoComplete="new-password" InputProps={{ startAdornment: (<InputAdornment position="start"><Lock color="action" /></InputAdornment>), endAdornment: (<InputAdornment position="end"><MuiIconButton aria-label="toggle password visibility" onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</MuiIconButton></InputAdornment>) }} {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' }, pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' } })} error={!!errors.password} helperText={errors.password?.message} />

						<TextField fullWidth label="Confirm Password" type={showConfirmPassword ? 'text' : 'password'} margin="normal" autoComplete="new-password" InputProps={{ startAdornment: (<InputAdornment position="start"><Lock color="action" /></InputAdornment>), endAdornment: (<InputAdornment position="end"><MuiIconButton aria-label="toggle confirm password visibility" onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">{showConfirmPassword ? <VisibilityOff /> : <Visibility />}</MuiIconButton></InputAdornment>) }} {...register('confirmPassword', { required: 'Please confirm your password', validate: (value) => value === password || 'Passwords do not match' })} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} />

						<Button type="submit" fullWidth variant="contained" size="large" disabled={isLoading} sx={{ mt: 2, mb: 2, py: 1.25, fontSize: '1rem', fontWeight: 700, textTransform: 'none', borderRadius: 2, boxShadow: '0 10px 25px rgba(14,165,233,0.35)', background: 'linear-gradient(90deg,#0ea5ea 0%, #34d399 100%)', '&:hover': { background: 'linear-gradient(90deg,#0ea5ea 0%, #22c55e 100%)', boxShadow: '0 12px 30px rgba(34,197,94,0.35)' } }}>
								{isLoading ? 'Creating Account...' : 'Create Account'}
							</Button>

						
						</Box>

						<Box sx={{ textAlign: 'center', mt: 3 }}>
							<Typography variant="body2" sx={{ color: 'text.secondary' }}>
								Already have an account? <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}><Typography component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>Sign in here</Typography></Link>
							</Typography>
						</Box>

					</Paper>
				</Container>
			</Box>
		</Box>
	)
}

export default Register
