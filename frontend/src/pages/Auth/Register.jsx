import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AppBar, Toolbar, Box, Container, Paper, TextField, Button, Typography, Alert, InputAdornment, IconButton as MuiIconButton, Grid, Divider } from '@mui/material'
import { Visibility, VisibilityOff, Email, Lock, Person, Phone, Home, Google as GoogleIcon, ArrowBack } from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import BrandMark from '../../components/BrandMark'
import { useForm } from 'react-hook-form'

const Register = () => {
    const navigate = useNavigate()
    const { register: registerUser, signUpWithGoogle, error } = useAuth()
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [stateWarning, setStateWarning] = useState('')

    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm()

    const password = watch('password')
	const stateValue = watch('state')

    const onSubmit = async (data) => {
		setIsLoading(true)
		const payload = {
			firstName: data.firstName,
			lastName: data.lastName,
			email: data.email,
			password: data.password,
			confirmPassword: data.confirmPassword,
			phone: data.phone,
			address: {
				street: data.street,
				city: data.city,
				state: data.state,
				postalCode: data.postalCode,
			},
		}
		const result = await registerUser(payload)
		setIsLoading(false)
		if (result?.success) {
			// Show success message in a better way without alert
			console.log(result.message || 'Signup successful! Welcome email sent.')
			setTimeout(() => {
				navigate('/')
			}, 100)
		}
	}

	const handleGoogleSignUp = async () => {
		setIsLoading(true)
		const result = await signUpWithGoogle('public_user')
		setIsLoading(false)
		if (result?.success) navigate('/dashboard')
	}

	// Email validation function - accepts famous domains and educational institutions with subdomains
	const validateEmail = (email) => {
		// Basic format validation
		const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
		if (!emailRegex.test(email)) {
			return 'Invalid email address format';
		}
		
		const [localPart, domain] = email.split('@');
		
		// Local part validations
		if (localPart.length < 3) {
			return 'Email address is too short';
		}
		
		if (localPart.length > 64) {
			return 'Email local part is too long';
		}
		
		// Domain validations
		if (domain.length < 4) {
			return 'Invalid domain';
		}
		
		// List of famous, reputable email domains
		const famousDomains = [
			// International domains
			'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
			'icloud.com', 'aol.com', 'protonmail.com', 'mail.com',
			'live.com', 'yahoo.co.in', 'yahoo.in', 'rediffmail.com',
			'hotmail.co.uk', 'outlook.co.uk', 'gmail.co.uk',
			'msn.com', 'comcast.net', 'verizon.net', 'att.net',
			'rocketmail.com', 'ymail.com', 'sbcglobal.net',
			'yahoo.co.uk', 'btinternet.com', 'virginmedia.com',
			'gmail.fr', 'yahoo.fr', 'hotmail.fr', 
			'gmail.de', 'yahoo.de', 'hotmail.de',
			'gmail.it', 'yahoo.it', 'hotmail.it',
			'gmail.es', 'yahoo.es', 'hotmail.es',
			
			// Indian domains
			'gmail.co.in', 'yahoo.co.in', 'hotmail.co.in', 'outlook.co.in',
			'rediffmail.com', 'rediff.com', 'sify.com', 'bol.net.in',
			'in.com', 'indiatimes.com', 'hotmail.co.in', 'live.in',
			'yahoo.co.in', 'gmail.co.in', 'outlook.in', 'hotmail.in'
		];
		
		// Convert domain to lowercase for comparison
		const domainLower = domain.toLowerCase();
		
		// Check if domain is in our list of famous domains
		if (famousDomains.includes(domainLower)) {
			return true;
		}
		
		// Special handling for AJCE institution domains
		// Check if it's from AJCE (Amal Jyothi College of Engineering) with various subdomains
		const ajceDomains = [
			'ajce.in',
			'btech.ajce.in',
			'bca.ajce.in',
			'bba.ajce.in',
			'intmca.ajce.in',
			'mca.ajce.in',
			'mtech.ajce.in',
			'mba.ajce.in'
		];
		
		if (ajceDomains.includes(domainLower)) {
			// Additional check to ensure it's not a disposable pattern
			const disposablePatterns = [
				/^test/i,
				/^dummy/i,
				/^example/i
			];
			
			for (const pattern of disposablePatterns) {
				if (pattern.test(localPart)) {
					return 'Please use a valid real-world email address';
				}
			}
			return true;
		}
		
		// General handling for educational institutions (.ac.in, .edu.in)
		if (domainLower.endsWith('.ac.in') || domainLower.endsWith('.edu.in')) {
			// Additional check to ensure it's not a disposable pattern
			const disposablePatterns = [
				/^test/i,
				/^dummy/i,
				/^example/i
			];
			
			for (const pattern of disposablePatterns) {
				if (pattern.test(localPart)) {
					return 'Please use a valid real-world email address';
				}
			}
			return true;
		}
		
		// If we get here, it's not an accepted domain
		return 'Please use a well-known email service provider (Gmail, Yahoo, Outlook, educational institutions, etc.)';
	};

	// Name validation function (no numbers, minimum 2 characters)
	const validateName = (name) => {
		// Check if name contains any numbers
		if (/\d/.test(name)) {
			return 'Name cannot contain numbers';
		}
		
		// Check minimum length
		if (name.length < 2) {
			return 'Name must be at least 2 characters';
		}
		
		// Check if name contains only letters, spaces, hyphens, or apostrophes
		if (!/^[A-Za-z\s'-]+$/.test(name)) {
			return 'Name can only contain letters, spaces, hyphens, or apostrophes';
		}
		
		return true;
	};

	// City validation function (no numbers, minimum 2 characters)
	const validateCity = (city) => {
		// Check if city contains any numbers
		if (/\d/.test(city)) {
			return 'City cannot contain numbers';
		}
		
		// Check minimum length
		if (city.length < 2) {
			return 'City must be at least 2 characters';
		}
		
		// Check if city contains only letters, spaces, hyphens, or apostrophes
		if (!/^[A-Za-z\s'-]+$/.test(city)) {
			return 'City can only contain letters, spaces, hyphens, or apostrophes';
		}
		
		return true;
	};

	// State validation function (minimum 2 letters)
	const validateState = (state) => {
		// Check if state is empty
		if (!state || state.trim().length === 0) {
			return 'State is required';
		}
		
		// Check minimum length
		if (state.length < 2) {
			return 'State must be at least 2 characters';
		}
		
		// Check if state contains only letters, spaces, hyphens, or apostrophes
		if (!/^[A-Za-z\s'-]+$/.test(state)) {
			return 'State can only contain letters, spaces, hyphens, or apostrophes';
		}
		
		// Check for Kerala variations and set warning if not Kerala
		const keralaVariations = ['kerala', 'KERALA', 'Kerala'];
		if (!keralaVariations.includes(state.trim())) {
			setStateWarning('Pet welfare offline stores and services are currently only available in Kerala. You can still register, but some features may be limited.');
		} else {
			setStateWarning('');
		}
		
		return true;
	};

	// Postal code validation function (exactly 6 digits)
	const validatePostalCode = (postalCode) => {
		// Check if postal code is exactly 6 digits
		if (!/^\d{6}$/.test(postalCode)) {
			return 'Postal code must be exactly 6 digits';
		}
		
		return true;
	};

	// Phone number validation function for Indian numbers
	const validatePhone = (phone) => {
		// Remove all spaces, dashes, parentheses
		const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
		
		// Check if it starts with +
		if (cleanPhone.startsWith('+')) {
			// International format: +91 followed by 10 digits
			if (cleanPhone.length === 13 && cleanPhone.startsWith('+91')) {
				const indianNumber = cleanPhone.substring(3);
				// Check if it's 10 digits and starts with 6,7,8, or 9
				if (/^[6-9]\d{9}$/.test(indianNumber)) {
					return true;
				} else {
					return 'Indian mobile numbers must start with 6, 7, 8, or 9';
				}
			} else if (cleanPhone.startsWith('+91')) {
				return 'Indian mobile numbers with +91 must be followed by exactly 10 digits';
			} else {
				return 'Only +91 country code is accepted for Indian numbers';
			}
		} else {
			// Local formats:
			// 1. 10 digits starting with 6,7,8, or 9
			// 2. 11 digits starting with 0 followed by 10 digits (0XXXX XXX XXX)
			if (cleanPhone.length === 10) {
				// 10-digit format starting with 6,7,8, or 9
				if (/^[6-9]\d{9}$/.test(cleanPhone)) {
					return true;
				} else {
					return 'Indian mobile numbers must start with 6, 7, 8, or 9';
				}
			} else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
				// 11-digit format starting with 0
				const withoutZero = cleanPhone.substring(1);
				if (/^[6-9]\d{9}$/.test(withoutZero)) {
					return true;
				} else {
					return 'Indian mobile numbers with 0 prefix must have the remaining 10 digits start with 6, 7, 8, or 9';
				}
			} else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
				// Possibly missing +, suggest adding +
				const indianNumber = cleanPhone.substring(2);
				if (/^[6-9]\d{9}$/.test(indianNumber)) {
					return 'Please add + before 91 for international format';
				} else {
					return 'Invalid Indian mobile number format';
				}
			} else {
				return 'Indian mobile numbers must be either: 10 digits (starting with 6,7,8,9), 11 digits (starting with 0), or +91 followed by 10 digits';
			}
		}
	};

	// Street address validation function (minimum 2 characters, with number and letter requirements)
	const validateStreetAddress = (street) => {
		// Check if street address is empty
		if (!street || street.trim().length === 0) {
			return 'Street address is required';
		}
		
		// Check minimum length
		if (street.trim().length < 2) {
			return 'Street address must be at least 2 characters';
		}
		
		// Check if it contains valid characters
		if (!/^[a-zA-Z0-9\s\-\.,#]+$/.test(street)) {
			return 'Street address contains invalid characters';
		}
		
		// If it contains numbers, ensure it also contains at least 2 letters
		if (/\d/.test(street)) {
			const letters = street.match(/[a-zA-Z]/g);
			if (!letters || letters.length < 2) {
				return 'Street address with numbers must contain at least 2 letters';
			}
		}
		
		return true;
	};

	// Password validation function
	const validatePassword = (password) => {
		// Check minimum length
		if (password.length < 8) {
			return 'Password must be at least 8 characters';
		}
		
		// Check for at least one uppercase letter
		if (!/[A-Z]/.test(password)) {
			return 'Password must contain at least one uppercase letter';
		}
		
		// Check for at least one lowercase letter
		if (!/[a-z]/.test(password)) {
			return 'Password must contain at least one lowercase letter';
		}
		
		// Check for at least one number
		if (!/[0-9]/.test(password)) {
			return 'Password must contain at least one number';
		}
		
		// Check for at least one special character
		if (!/[^A-Za-z0-9]/.test(password)) {
			return 'Password must contain at least one special character';
		}
		
		return true;
	};

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

						<Button onClick={handleGoogleSignUp} startIcon={<GoogleIcon />} fullWidth variant="outlined" disabled={isLoading} sx={{ py: 1.25, borderRadius: 2, mb: 2, backdropFilter: 'blur(6px)', background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { background: 'rgba(255,255,255,0.75)', borderColor: 'rgba(255,255,255,0.7)' } }}>
							Sign up with Google
						</Button>
						<Divider sx={{ my: 2 }}><Typography variant="caption" color="text.secondary">Or continue with email</Typography></Divider>

                        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
						<Grid container spacing={2}>
								<Grid item xs={12} sm={6}>
								<TextField fullWidth label="First Name" margin="normal" autoComplete="given-name" InputProps={{ startAdornment: (<InputAdornment position="start"><Person color="action" /></InputAdornment>) }} {...register('firstName', { 
									required: 'First name is required', 
									validate: validateName
								})} error={!!errors.firstName} helperText={errors.firstName?.message} />
								</Grid>
								<Grid item xs={12} sm={6}>
								<TextField fullWidth label="Last Name" margin="normal" autoComplete="family-name" InputProps={{ startAdornment: (<InputAdornment position="start"><Person color="action" /></InputAdornment>) }} {...register('lastName', { 
									required: 'Last name is required', 
									validate: validateName
								})} error={!!errors.lastName} helperText={errors.lastName?.message} />
								</Grid>
							</Grid>

						<TextField fullWidth label="Email Address" type="email" margin="normal" autoComplete="email" InputProps={{ startAdornment: (<InputAdornment position="start"><Email color="action" /></InputAdornment>) }} {...register('email', { 
							required: 'Email is required', 
							validate: validateEmail
						})} error={!!errors.email} helperText={errors.email?.message} />

                        <TextField fullWidth label="Phone Number" type="tel" margin="normal" autoComplete="tel" InputProps={{ startAdornment: (<InputAdornment position="start"><Phone color="action" /></InputAdornment>) }} {...register('phone', { 
							required: 'Phone number is required', 
							validate: validatePhone
						})} error={!!errors.phone} helperText={errors.phone?.message} />

						<Grid container spacing={2}>
								<Grid item xs={12} sm={6}>
								<TextField fullWidth label="Street Address" margin="normal" autoComplete="street-address" InputProps={{ startAdornment: (<InputAdornment position="start"><Home color="action" /></InputAdornment>) }} {...register('street', { 
									required: 'Street address is required', 
									validate: validateStreetAddress
								})} error={!!errors.street} helperText={errors.street?.message} />
								</Grid>
								<Grid item xs={12} sm={6}>
								<TextField fullWidth label="City" margin="normal" autoComplete="address-level2" {...register('city', { 
									required: 'City is required', 
									validate: validateCity
								})} error={!!errors.city} helperText={errors.city?.message} />
								</Grid>
								<Grid item xs={12} sm={6}>
								<TextField fullWidth label="State" margin="normal" autoComplete="address-level1" {...register('state', { 
									required: 'State is required', 
									validate: validateState
								})} error={!!errors.state} helperText={errors.state?.message} 
								onBlur={(e) => validateState(e.target.value)} />
								{stateWarning && (
									<Alert severity="warning" sx={{ mt: 1 }}>
										{stateWarning}
									</Alert>
								)}
								</Grid>
								<Grid item xs={12} sm={6}>
								<TextField fullWidth label="Postal Code" margin="normal" autoComplete="postal-code" {...register('postalCode', { 
									required: 'Postal code is required', 
									validate: validatePostalCode
								})} error={!!errors.postalCode} helperText={errors.postalCode?.message} />
								</Grid>
							</Grid>

						<TextField fullWidth label="Password" type={showPassword ? 'text' : 'password'} margin="normal" autoComplete="new-password" InputProps={{ startAdornment: (<InputAdornment position="start"><Lock color="action" /></InputAdornment>), endAdornment: (<InputAdornment position="end"><MuiIconButton aria-label="toggle password visibility" onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</MuiIconButton></InputAdornment>) }} {...register('password', { 
							required: 'Password is required', 
							validate: validatePassword
						})} error={!!errors.password} helperText={errors.password?.message} />

						<TextField fullWidth label="Confirm Password" type={showConfirmPassword ? 'text' : 'password'} margin="normal" autoComplete="new-password" InputProps={{ startAdornment: (<InputAdornment position="start"><Lock color="action" /></InputAdornment>), endAdornment: (<InputAdornment position="end"><MuiIconButton aria-label="toggle confirm password visibility" onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">{showConfirmPassword ? <VisibilityOff /> : <Visibility />}</MuiIconButton></InputAdornment>) }} {...register('confirmPassword', { 
							required: 'Please confirm your password', 
							validate: (value) => value === password || 'Passwords do not match' 
						})} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} />

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