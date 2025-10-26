import React, { useState } from 'react'
import { Box, Container, Paper, Typography, TextField, Button, Grid, Alert } from '@mui/material'
import { useAuth } from '../../contexts/AuthContext'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

const ForgotPassword = () => {
	const { requestPasswordResetOTP, verifyOTPAndResetPassword } = useAuth()
	const navigate = useNavigate()
	const [step, setStep] = useState('request') // 'request' | 'verify'
	const [email, setEmail] = useState('')
	const [otp, setOtp] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')

	const request = async (e) => {
		e.preventDefault()
		setError('')
		setSuccess('')
		setBusy(true)
		const res = await requestPasswordResetOTP(email)
		setBusy(false)
		if (res.success) {
			setSuccess('OTP sent to your email. It expires in 5 minutes.')
			setStep('verify')
		} else {
			setError(res.error || 'Failed to send OTP')
		}
	}

	const reset = async (e) => {
		e.preventDefault()
		setError('')
		setSuccess('')
		if (newPassword !== confirmPassword) {
			setError('Passwords do not match')
			return
		}
		setBusy(true)
		const res = await verifyOTPAndResetPassword({ email, otp, newPassword })
		setBusy(false)
		if (res.success) {
			setSuccess('Password has been reset successfully! Redirecting...')
			// Redirect to landing page after 2 seconds
			setTimeout(() => {
				setTimeout(() => {
					navigate('/')
				}, 100)
			}, 2000)

		} else {
			setError(res.error || 'Failed to reset password')
		}
	}

	return (
		<Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
			<Container maxWidth="sm">
				<Paper elevation={6} sx={{ p: 3, borderRadius: 3 }}>
					<Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Forgot Password</Typography>
					<Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
						{step === 'request' ? 'Enter your email to receive a 6-digit OTP.' : 'Enter the OTP sent to your email and set a new password.'}
					</Typography>
					{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
					{success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

					{step === 'request' && (
						<Box component="form" onSubmit={request}>
							<TextField fullWidth type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required sx={{ mb: 2 }} />
							<Button type="submit" variant="contained" fullWidth disabled={busy}>Send OTP</Button>
							<Button component={RouterLink} to="/login" sx={{ mt: 1 }} fullWidth>Back to Login</Button>
						</Box>
					)}

					{step === 'verify' && (
						<Box component="form" onSubmit={reset}>
							<Grid container spacing={2}>
								<Grid item xs={12}>
									<TextField fullWidth label="6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} inputProps={{ maxLength: 6 }} required />
								</Grid>
								<Grid item xs={12}>
									<TextField fullWidth type="password" label="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
								</Grid>
								<Grid item xs={12}>
									<TextField fullWidth type="password" label="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
								</Grid>
							</Grid>
							<Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={busy}>Reset Password</Button>
							<Button onClick={() => setStep('request')} sx={{ mt: 1 }} fullWidth>Resend OTP</Button>
							<Button component={RouterLink} to="/login" sx={{ mt: 1 }} fullWidth>Back to Login</Button>
						</Box>
					)}
				</Paper>
			</Container>
		</Box>
	)
}

export default ForgotPassword
