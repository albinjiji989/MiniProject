import React from 'react';
import {
  Button,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  Box
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Visibility as ViewIcon,
  Schedule as ScheduleIcon,
  LocalShipping as PickupIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';

const ActionButtons = ({ application, onAction, compact = false }) => {
  const getActionButtons = () => {
    const buttons = [];

    // Always show View Details
    buttons.push({
      key: 'view',
      label: 'View Details',
      icon: <ViewIcon />,
      action: () => onAction('view', application),
      variant: 'outlined',
      color: 'primary'
    });

    // Status-specific actions
    switch (application.status) {
      case 'submitted':
        buttons.push({
          key: 'pricing',
          label: 'Set Pricing',
          icon: <MoneyIcon />,
          action: () => onAction('setPricing', application),
          variant: 'contained',
          color: 'secondary',
          gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
        });
        break;

      case 'price_determined':
        buttons.push({
          key: 'waiting',
          label: 'Waiting for Payment',
          icon: <PaymentIcon />,
          disabled: true,
          variant: 'outlined',
          color: 'info'
        });
        break;

      case 'advance_paid':
        if (!application.checkIn?.otp) {
          buttons.push({
            key: 'generateOTP',
            label: compact ? 'Gen OTP' : 'Generate Check-in OTP',
            icon: <AddIcon />,
            action: () => onAction('generateOTP', application),
            variant: 'contained',
            color: 'primary',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          });
        } else if (!application.checkIn?.otpUsed) {
          buttons.push({
            key: 'verifyOTP',
            label: compact ? 'Verify' : 'Verify Check-in OTP',
            icon: <CheckIcon />,
            action: () => onAction('verifyOTP', application),
            variant: 'contained',
            color: 'success',
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
          });
        }
        break;

      case 'active_care':
        if (application.paymentStatus?.final?.status !== 'completed') {
          buttons.push({
            key: 'waitingFinal',
            label: 'Waiting for Final Payment',
            icon: <ScheduleIcon />,
            disabled: true,
            variant: 'outlined',
            color: 'warning'
          });
        } else if (!application.checkOut?.otp) {
          buttons.push({
            key: 'generatePickupOTP',
            label: compact ? 'Pickup OTP' : 'Generate Pickup OTP',
            icon: <PickupIcon />,
            action: () => onAction('generatePickupOTP', application),
            variant: 'contained',
            color: 'warning',
            gradient: 'linear-gradient(135deg, #FF8A80 0%, #FF5722 100%)'
          });
        } else if (!application.checkOut?.otpUsed) {
          buttons.push({
            key: 'verifyPickupOTP',
            label: compact ? 'Complete' : 'Complete Pickup',
            icon: <CheckIcon />,
            action: () => onAction('verifyPickupOTP', application),
            variant: 'contained',
            color: 'error',
            gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)'
          });
        }
        break;

      case 'completed':
        buttons.push({
          key: 'completed',
          label: 'Completed',
          icon: <CheckIcon />,
          disabled: true,
          variant: 'contained',
          color: 'success'
        });
        break;

      default:
        break;
    }

    return buttons;
  };

  const buttons = getActionButtons();

  if (compact) {
    return (
      <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
        {buttons.map((button) => (
          <Tooltip key={button.key} title={button.label}>
            <span>
              <IconButton
                size="small"
                onClick={button.action}
                disabled={button.disabled}
                sx={{
                  background: button.gradient || undefined,
                  color: button.gradient ? 'white' : undefined,
                  '&:hover': {
                    background: button.gradient ? button.gradient : undefined,
                    opacity: 0.8
                  }
                }}
              >
                {button.icon}
              </IconButton>
            </span>
          </Tooltip>
        ))}
      </Stack>
    );
  }

  return (
    <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
      {buttons.map((button) => (
        <Button
          key={button.key}
          variant={button.variant}
          color={button.color}
          startIcon={button.icon}
          onClick={button.action}
          disabled={button.disabled}
          size="small"
          sx={{
            borderRadius: 2,
            background: button.gradient || undefined,
            '&:hover': {
              background: button.gradient ? button.gradient : undefined,
              opacity: 0.8
            }
          }}
        >
          {button.label}
        </Button>
      ))}
    </Stack>
  );
};

export default ActionButtons;