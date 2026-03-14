import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import {
  PendingActions as PendingIcon,
  AttachMoney as MoneyIcon,
  CheckCircleOutline as ActiveIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

const StatsCards = ({ stats, loading }) => {
  if (loading) {
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={100}>
                  <CircularProgress />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  const statsData = [
    {
      title: 'New Applications',
      value: stats?.submitted || 0,
      subtitle: 'Awaiting pricing',
      icon: PendingIcon,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    },
    {
      title: 'Advance Paid',
      value: stats?.advancePaid || 0,
      subtitle: 'Ready for care',
      icon: MoneyIcon,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      color: 'white'
    },
    {
      title: 'Active Care',
      value: stats?.activeCare || 0,
      subtitle: 'Pets in facility',
      icon: ActiveIcon,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      color: 'white'
    },
    {
      title: 'Total Revenue',
      value: `₹${((stats?.revenue || 0) / 1000).toFixed(1)}k`,
      subtitle: 'From advances',
      icon: TrendingUpIcon,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      color: 'white'
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {statsData.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ background: stat.gradient, color: stat.color }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h4" fontWeight="bold">
                    {stat.value}
                  </Typography>
                  <IconComponent sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  {stat.title}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  {stat.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default StatsCards;