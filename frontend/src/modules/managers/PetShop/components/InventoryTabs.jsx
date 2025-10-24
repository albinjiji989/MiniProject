import React from 'react';
import { 
  Card, 
  Tabs, 
  Tab, 
  Badge, 
  Box 
} from '@mui/material';
import { 
  Pending as PendingIcon, 
  CheckCircle as CheckCircleIcon, 
  Publish as PublishIcon, 
  ShoppingCart as ShoppingCartIcon 
} from '@mui/icons-material';

const InventoryTabs = ({ activeTab, setActiveTab, inventory, readyForRelease, releasedPets, purchasedPets }) => {
  return (
    <Card sx={{ mb: 3 }}>
      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ 
          borderBottom: 2, 
          borderColor: 'divider',
          '& .MuiTabs-indicator': {
            bgcolor: '#1976d2',
            height: 3
          }
        }}
      >
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PendingIcon style={{ fontSize: 18 }} />
              <span>Pending Images</span>
              <Badge badgeContent={inventory.length} color="warning" showZero>
              </Badge>
            </Box>
          } 
          sx={{ 
            minHeight: 48,
            color: activeTab === 0 ? '#f57c00' : 'text.secondary',
            fontWeight: activeTab === 0 ? 'bold' : 'normal',
            textTransform: 'none',
            fontSize: '0.95rem',
            '&:hover': {
              bgcolor: activeTab === 0 ? 'rgba(245, 124, 0, 0.04)' : 'rgba(0, 0, 0, 0.04)'
            }
          }}
        />
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon style={{ fontSize: 18 }} />
              <span>Ready for Release</span>
              <Badge badgeContent={readyForRelease.length} color="success" showZero>
              </Badge>
            </Box>
          } 
          sx={{ 
            minHeight: 48,
            color: activeTab === 1 ? '#4caf50' : 'text.secondary',
            fontWeight: activeTab === 1 ? 'bold' : 'normal',
            textTransform: 'none',
            fontSize: '0.95rem',
            '&:hover': {
              bgcolor: activeTab === 1 ? 'rgba(76, 175, 80, 0.04)' : 'rgba(0, 0, 0, 0.04)'
            }
          }}
        />
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PublishIcon style={{ fontSize: 18 }} />
              <span>Released Pets</span>
              <Badge badgeContent={releasedPets.length} color="info" showZero>
              </Badge>
            </Box>
          } 
          sx={{ 
            minHeight: 48,
            color: activeTab === 2 ? '#0288d1' : 'text.secondary',
            fontWeight: activeTab === 2 ? 'bold' : 'normal',
            textTransform: 'none',
            fontSize: '0.95rem',
            '&:hover': {
              bgcolor: activeTab === 2 ? 'rgba(2, 136, 209, 0.04)' : 'rgba(0, 0, 0, 0.04)'
            }
          }}
        />
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShoppingCartIcon style={{ fontSize: 18 }} />
              <span>Purchased Pets</span>
              <Badge badgeContent={purchasedPets.length} color="secondary" showZero>
              </Badge>
            </Box>
          } 
          sx={{ 
            minHeight: 48,
            color: activeTab === 3 ? '#7b1fa2' : 'text.secondary',
            fontWeight: activeTab === 3 ? 'bold' : 'normal',
            textTransform: 'none',
            fontSize: '0.95rem',
            '&:hover': {
              bgcolor: activeTab === 3 ? 'rgba(123, 31, 162, 0.04)' : 'rgba(0, 0, 0, 0.04)'
            }
          }}
        />
      </Tabs>
    </Card>
  );
};

export default InventoryTabs;