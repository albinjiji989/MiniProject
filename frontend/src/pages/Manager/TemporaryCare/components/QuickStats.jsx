import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  LinearProgress,
  Fade,
  Skeleton
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Add as AddIcon,
  Pets as PetsIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const QuickStats = ({ applications, loading }) => {
  if (loading) {
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item}>
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 3 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  const calculateStats = () => {
    const total = applications.length;
    const newApps = applications.filter(a => a.status === 'submitted').length;
    const activeCare = applications.filter(a => a.status === 'active_care').length;
    const completed = applications.filter(a => a.status === 'completed').length;
    const pendingPayment = applications.filter(a => a.status === 'price_determined').length;
    const revenue = applications.reduce((sum, a) => sum + (a.pricing?.totalAmount || 0), 0);
    
    return {
      total,
      newApps,
      activeCare,
      completed,
      pendingPayment,
      revenue,
      completionRate: total > 0 ? (completed / total) * 100 : 0
    };
  };

  const stats = calculateStats();

  const statsData = [
    {
      title: 'Total Applications',
      value: stats.total,
      subtitle: `${stats.completionRate.toFixed(1)}% completion rate`,
      icon: DashboardIcon,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      progress: stats.completionRate,
      color: '#667eea'
    },
    {
      title: 'New Applications',
      value: stats.newApps,
      subtitle: 'Awaiting pricing',
      icon: AddIcon,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      progress: stats.total > 0 ? (stats.newApps / stats.total) * 100 : 0,
      color: '#f093fb',
      urgent: stats.newApps > 0
    },
    {
      title: 'Pets in Care',
      value: stats.activeCare,
      subtitle: 'Currently boarding',
      icon: PetsIcon,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      progress: stats.total > 0 ? (stats.activeCare / stats.total) * 100 : 0,
      color: '#4facfe'
    },
    {
      title: 'Revenue',
      value: `₹${(stats.revenue / 1000).toFixed(1)}k`,
      subtitle: `From ${stats.completed} completed`,
      icon: TrendingUpIcon,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      progress: 100,
      color: '#43e97b'
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {statsData.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Fade in timeout={500 + index * 200}>
              <Card sx={{ 
                height: '100%',
                background: stat.gradient,
                color: 'white',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': { 
                  transform: 'translateY(-8px)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                }
              }}>
                {stat.urgent && (
                  <Box sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 2
                  }}>
                    <Avatar sx={{ 
                      width: 24, 
                      height: 24, 
                      bgcolor: 'rgba(255,255,255,0.2)',
                      animation: 'pulse 2s infinite'
                    }}>
                      <WarningIcon sx={{ fontSize: 14 }} />
                    </Avatar>
                  </Box>
                )}
                
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="h3" fontWeight="bold" sx={{ mb: 0.5 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
                        {stat.title}
                      </Typography>
                    </Box>
                    <Avatar sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      width: 56, 
                      height: 56,
                      backdropFilter: 'blur(10px)'
                    }}>
                      <IconComponent sx={{ fontSize: 28 }} />
                    </Avatar>
                  </Box>
                  
                  <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 1 }}>
                    {stat.subtitle}
                  </Typography>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={stat.progress}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: 'rgba(255,255,255,0.8)',
                        borderRadius: 2
                      }
                    }}
                  />
                </CardContent>
                
                {/* Background decoration */}
                <Box sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  zIndex: 0
                }} />
              </Card>
            </Fade>
          </Grid>
        );
      })}
      
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </Grid>
  );
};

export default QuickStats;