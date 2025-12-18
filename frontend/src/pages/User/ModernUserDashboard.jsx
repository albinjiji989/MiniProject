import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import UserLayout from '../../components/Layout/UserLayout';
import { useUserDashboard } from './hooks/useUserDashboard';
import WelcomeSection from './components/WelcomeSection';
import StatsCards from './components/StatsCards';
import QuickActions from './components/QuickActions';
import PetList from './components/PetList';
import ServiceCategories from './components/ServiceCategories';
import ActivitySection from './components/ActivitySection';

const ModernUserDashboard = () => {
  const { user } = useAuth();
  const { 
    pets, 
    stats, 
    modules, 
    recentActivity, 
    upcomingAppointments, 
    isLoading, 
    errors 
  } = useUserDashboard();

  return (
    <UserLayout user={user}>
      <WelcomeSection user={user} stats={stats} />
      
      {/* Stats Cards */}
      <StatsCards stats={stats} />
      
      {/* Quick Actions */}
      <QuickActions />
      
      {/* My Pets Section */}
      <PetList pets={pets} loading={isLoading} />
      
      {/* Service Categories */}
      <ServiceCategories />
      
      {/* Recent Activity and Upcoming Appointments */}
      <ActivitySection 
        recentActivity={recentActivity} 
        upcomingAppointments={upcomingAppointments} 
        activityLoading={isLoading} 
        activityError={errors.activity}
      />
    </UserLayout>
  );
};

export default ModernUserDashboard;