import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';

const QrCodeDialog = ({ open, onClose, selectedReservation }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>QR Code for Pickup</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
        <QRCodeSVG 
          value={`reservation:${selectedReservation?._id}`} 
          size={256} 
          level="H"
        />
        <Typography variant="body1" sx={{ mt: 2, textAlign: 'center' }}>
          Show this QR code at the store for pickup verification
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Reservation Code: {selectedReservation?.reservationCode}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default QrCodeDialog;