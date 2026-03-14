import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Card,
  CardContent,
  Typography,
  Divider,
  Box,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { temporaryCareAPI } from '../../../../services/api';

const PricingDialog = ({ open, onClose, application, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [pricingData, setPricingData] = useState({
    baseRate: 500,
    tax: 18,
    discount: 0
  });

  if (!application) return null;

  const handleSetPricing = async () => {
    try {
      setLoading(true);
      
      const petPricing = application.pets.map(pet => ({
        petId: pet.petId,
        petType: 'Dog',
        petSize: 'medium',
        baseRatePerDay: pricingData.baseRate,
        numberOfDays: application.numberOfDays,
        baseAmount: pricingData.baseRate * application.numberOfDays,
        specialCareAddons: [],
        totalAmount: pricingData.baseRate * application.numberOfDays
      }));

      const pricingPayload = {
        petPricing,
        additionalCharges: [],
        discount: { 
          amount: pricingData.discount, 
          reason: pricingData.discount > 0 ? 'Early booking discount' : '' 
        },
        tax: { percentage: pricingData.tax }
      };

      await temporaryCareAPI.managerSetPricing(application._id, pricingPayload);

      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error setting pricing:', err);
      alert(err?.response?.data?.message || 'Failed to set pricing');
    } finally {
      setLoading(false);
    }
  };

  const totalPets = application.pets?.length || 0;
  const subtotal = (pricingData.baseRate * application.numberOfDays * totalPets) - pricingData.discount;
  const taxAmount = (subtotal * pricingData.tax) / 100;
  const total = subtotal + taxAmount;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Set Pricing - {application.applicationNumber}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <TextField
            label="Base Rate Per Day (per pet)"
            type="number"
            value={pricingData.baseRate}
            onChange={(e) => setPricingData({ ...pricingData, baseRate: Number(e.target.value) })}
            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            fullWidth
          />
          <TextField
            label="Discount"
            type="number"
            value={pricingData.discount}
            onChange={(e) => setPricingData({ ...pricingData, discount: Number(e.target.value) })}
            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            fullWidth
          />
          <TextField
            label="Tax Percentage"
            type="number"
            value={pricingData.tax}
            onChange={(e) => setPricingData({ ...pricingData, tax: Number(e.target.value) })}
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            fullWidth
          />

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Calculation Summary</Typography>
              <Divider sx={{ my: 1 }} />
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    Pets: {totalPets} × Days: {application.numberOfDays} × Rate: ₹{pricingData.baseRate}
                  </Typography>
                  <Typography variant="body2" fontWeight="500">
                    ₹{(pricingData.baseRate * application.numberOfDays * totalPets).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Discount:</Typography>
                  <Typography variant="body2" color="success.main">
                    -₹{pricingData.discount.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Tax ({pricingData.tax}%):</Typography>
                  <Typography variant="body2">₹{taxAmount.toLocaleString()}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Total Amount:</Typography>
                  <Typography variant="h6" color="primary">₹{total.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: 'success.lighter', p: 1, borderRadius: 1 }}>
                  <Typography fontWeight="500">Advance (50%):</Typography>
                  <Typography fontWeight="600">₹{(total * 0.5).toLocaleString()}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSetPricing} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Set Pricing'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PricingDialog;