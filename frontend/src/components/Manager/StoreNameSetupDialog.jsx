import React, { useState, useContext } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Chip
} from '@mui/material';
import { authAPI } from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';

const StoreNameSetupDialog = ({ open, onClose, user, moduleKey }) => {
  const { dispatch } = useContext(AuthContext);
  const [storeNameInput, setStoreNameInput] = useState(user?.storeName || '');
  const [pincodeInput, setPincodeInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const name = storeNameInput.trim();
    if (!name || name.length < 3) {
      setError('Store name must be at least 3 characters');
      return;
    }

    // Validate pincode if provided
    if (pincodeInput && pincodeInput.length !== 6) {
      setError('Pincode must be exactly 6 digits');
      return;
    }

    if (pincodeInput && !/^\d{6}$/.test(pincodeInput)) {
      setError('Pincode must contain only digits');
      return;
    }

    try {
      setSaving(true);
      setError('');

      // Prepare data for update
      const updateData = { storeName: name };
      if (pincodeInput && pincodeInput.length === 6) {
        updateData.pincode = pincodeInput;
      }

      // Use the authAPI to update user profile directly
      await authAPI.updateProfile(updateData);

      // Refresh the user data from the backend to get updated store info
      const res = await authAPI.getMe();
      if (res?.data?.data?.user) {
        // Update the AuthContext with fresh user data
        dispatch({
          type: 'UPDATE_USER',
          payload: res.data.data.user
        });
      }

      onClose();
    } catch (error) {
      setError(error?.response?.data?.message || 'Failed to update store info');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Set Your Store Name</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Store ID: <strong>{user?.storeId || 'Pending assignment'}</strong>
        </Typography>
        <TextField
          autoFocus
          fullWidth
          label="Store Name"
          placeholder={`e.g., Happy Paws ${moduleKey?.charAt(0)?.toUpperCase() + moduleKey?.slice(1) || 'Pet'} Center`}
          value={storeNameInput}
          onChange={(e) => setStoreNameInput(e.target.value)}
          sx={{ mb: 2 }}
          disabled={saving}
        />
        <TextField
          fullWidth
          label="Pincode (Optional)"
          placeholder="e.g., 123456"
          value={pincodeInput}
          onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputProps={{ maxLength: 6 }}
          disabled={saving}
        />
        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !storeNameInput.trim() || storeNameInput.trim().length < 3}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StoreNameSetupDialog;