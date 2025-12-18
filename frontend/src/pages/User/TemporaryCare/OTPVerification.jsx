import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  TextField, 
  CircularProgress, 
  Alert,
  IconButton,
  InputAdornment,
  useTheme
} from '@mui/material'
import { 
  ArrowBack as BackIcon,
  Lock as LockIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material'
import { temporaryCareAPI } from '../../../services/api'

const OTPVerification = ({ type }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(0)

  const isDrop = type === 'drop'
  const title = isDrop ? 'Drop-off OTP Verification' : 'Pickup OTP Verification'
  const description = isDrop 
    ? 'Enter the 6-digit OTP provided by the care center for pet drop-off' 
    : 'Enter the 6-digit OTP provided by the care center for pet pickup'

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    
    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus()
    }
  }

  const handleSubmit = async () => {
    const otpString = otp.join('')
    
    if (otpString.length !== 6 || !/^\d{6}$/.test(otpString)) {
      setError('Please enter a valid 6-digit OTP')
      return
    }
    
    try {
      setLoading(true)
      setError('')
      
      const response = await temporaryCareAPI.verifyOTP(id, { otp: otpString, type })
      
      if (response.data.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/User/temporary-care')
        }, 2000)
      } else {
        setError(response.data.message || 'Invalid OTP')
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to verify OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    try {
      setLoading(true)
      setError('')
      await temporaryCareAPI.resendOTP(id, { type })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <IconButton 
          onClick={() => navigate('/User/temporary-care')}
          sx={{ mb: 2 }}
        >
          <BackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {description}
        </Typography>
      </Box>

      <Card>
        <CardContent>
          {success ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" sx={{ mb: 1 }}>
                {isDrop ? 'Drop-off Confirmed' : 'Pickup Confirmed'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {isDrop 
                  ? 'Your pet has been successfully dropped off at the care center.' 
                  : 'Your pet has been successfully picked up from the care center.'}
              </Typography>
            </Box>
          ) : (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
                {otp.map((digit, index) => (
                  <TextField
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onFocus={() => setFocusedIndex(index)}
                    variant="outlined"
                    inputProps={{
                      style: { textAlign: 'center', fontSize: '1.5rem', padding: '12px' },
                      maxLength: 1
                    }}
                    sx={{
                      width: 60,
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                          borderColor: theme.palette.primary.main,
                        },
                      },
                    }}
                  />
                ))}
              </Box>
              
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <LockIcon />}
                sx={{ mb: 2 }}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Didn't receive the OTP?
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleResendOTP}
                  disabled={loading}
                >
                  Resend OTP
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}

export default OTPVerification