import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Paper,
  TextField,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Assignment as TaskIcon
} from '@mui/icons-material';

// OTP Display Dialog (Manager does NOT see the OTP - it's secret!)
export const OTPDisplayDialog = ({ open, onClose, otpData }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>
      <Box display="flex" alignItems="center" gap={1}>
        <CheckIcon color="success" />
        <Typography variant="h6">
          {otpData?.type === 'checkout' ? 'Pickup OTP Sent Successfully' : 'Check-in OTP Sent Successfully'}
        </Typography>
      </Box>
    </DialogTitle>
    <DialogContent>
      {otpData && (
        <>
          <Alert severity="success" sx={{ mb: 2 }}>
            <strong>
              {otpData.type === 'checkout' 
                ? 'Pickup OTP has been sent to user\'s email' 
                : 'Check-in OTP has been sent to user\'s email'
              }
            </strong>
          </Alert>
          
          <Paper elevation={2} sx={{ p: 3, bgcolor: 'info.lighter', mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>User Information:</Typography>
            <Box sx={{ pl: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Name:</strong> {otpData.userName}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Email:</strong> {otpData.emailSent}
              </Typography>
              {otpData.userPhone && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Phone:</strong> {otpData.userPhone}
                </Typography>
              )}
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Application:</strong> {otpData.applicationNumber}
              </Typography>
              <Typography variant="body2" color="warning.main">
                <strong>Expires:</strong> {new Date(otpData.expiresAt).toLocaleString()}
              </Typography>
            </Box>
          </Paper>

          <Alert severity="info" icon={<TaskIcon />}>
            <Typography variant="subtitle2" gutterBottom>
              <strong>Next Steps:</strong>
            </Typography>
            <Typography variant="body2" component="div">
              <ol style={{ margin: 0, paddingLeft: 20 }}>
                <li>User will receive the OTP via email</li>
                <li>Ask the user to check their email</li>
                <li>User will show/tell you the 6-digit OTP</li>
                <li>
                  Click "{otpData.type === 'checkout' ? 'Enter OTP & Complete Pickup' : 'Enter OTP & Check-in Pet'}" button and enter the code
                </li>
              </ol>
            </Typography>
          </Alert>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="caption">
              <strong>Security Note:</strong> Never share or display the OTP publicly. 
              The user must provide it from their email.
            </Typography>
          </Alert>
        </>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

// OTP Verification Dialog (Manager enters OTP from user)
export const OTPVerificationDialog = ({ 
  open, 
  onClose, 
  application, 
  otpInput, 
  setOtpInput, 
  onVerify, 
  loading,
  isCheckout = false 
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>
      <Box display="flex" alignItems="center" gap={1}>
        <CheckIcon color="primary" />
        <Typography variant="h6">
          {isCheckout ? 'Pet Pickup - Verify OTP' : 'Pet Check-in - Verify OTP'}
        </Typography>
      </Box>
    </DialogTitle>
    <DialogContent>
      {application && (
        <>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              <strong>Step 1:</strong> Ask the user to check their email for the 6-digit OTP
            </Typography>
            <Typography variant="body2">
              <strong>Step 2:</strong> Enter the OTP code below to {isCheckout ? 'complete pet pickup' : 'check-in the pet'}
            </Typography>
          </Alert>

          <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" gutterBottom>Application Details:</Typography>
            <Typography variant="body2"><strong>User:</strong> {application.userId?.name}</Typography>
            <Typography variant="body2"><strong>Email:</strong> {application.userId?.email}</Typography>
            <Typography variant="body2"><strong>Application:</strong> {application.applicationNumber}</Typography>
            <Typography variant="body2"><strong>Pets:</strong> {application.pets?.length || 0}</Typography>
          </Paper>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom color="primary">
              Enter the 6-digit OTP from user's email:
            </Typography>
            <TextField
              fullWidth
              label="OTP Code"
              variant="outlined"
              value={otpInput}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtpInput(value);
              }}
              placeholder="000000"
              inputProps={{
                maxLength: 6,
                style: { 
                  fontSize: 28, 
                  letterSpacing: 12, 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontFamily: 'monospace'
                }
              }}
              helperText={`${otpInput.length}/6 digits entered`}
              error={otpInput.length > 0 && otpInput.length < 6}
              disabled={loading}
              autoFocus
            />
          </Box>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="caption">
              <strong>Important:</strong> The OTP expires in 15 minutes. 
              Make sure the user provides the correct 6-digit code from their email.
            </Typography>
          </Alert>
        </>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button 
        onClick={onVerify} 
        variant="contained" 
        color="success"
        disabled={loading || otpInput.length !== 6}
        startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
        size="large"
      >
        {loading ? 'Verifying...' : `${isCheckout ? 'Complete Pickup' : 'Check-in Pet'}`}
      </Button>
    </DialogActions>
  </Dialog>
);