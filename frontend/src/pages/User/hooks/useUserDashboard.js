import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { modulesAPI, userPetsAPI, apiClient, adoptionAPI } from '../../../services/api';

// Hook to fetch user pets from all sources
export const useUserPets = () => {
  return useQuery({
    queryKey: ['userPets'],
    queryFn: async () => {
      try {
        // Use unified API endpoint that includes temporaryCareStatus
        const response = await userPetsAPI.getAllPets();
        const pets = response.data?.data?.pets || [];
        
        console.log('🐾 Dashboard loaded pets:', pets.length);
        console.log('🐾 Sample pet:', pets[0]);
        console.log('🐾 Pets with temporary care:', pets.filter(p => p.temporaryCareStatus?.inCare));
        
        // Sort pets by creation date (newest first)
        const sortedPets = [...pets].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.updatedAt || 0);
          const dateB = new Date(b.createdAt || b.updatedAt || 0);
          return dateB - dateA;
        });
        
        return sortedPets;
      } catch (error) {
        console.error('Error fetching user pets:', error);
        return [];
      }
    },
    staleTime: 0, // Always fetch fresh data
    cacheTime: 1 * 60 * 1000, // 1 minute cache
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });
};

// Hook to fetch user dashboard stats
export const useUserStats = () => {
  const { data: pets = [] } = useUserPets();
  
  return useQuery({
    queryKey: ['userStats', pets.length],
    queryFn: async () => {
      try {
        // Fetch veterinary appointments
        const vetRes = await apiClient.get('/veterinary/user/appointments');
        const upcomingAppointments = vetRes.data?.data?.appointments || [];
        
        return {
          totalPets: pets.length,
          upcomingAppointments: upcomingAppointments.length,
          pendingAdoptions: 0,
          reservations: 0
        };
      } catch (error) {
        console.error('Error fetching user stats:', error);
        return {
          totalPets: pets.length,
          upcomingAppointments: 0,
          pendingAdoptions: 0,
          reservations: 0
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch user modules
export const useUserModules = () => {
  return useQuery({
    queryKey: ['userModules'],
    queryFn: async () => {
      try {
        const res = await modulesAPI.list();
        return res.data?.data || [];
      } catch (error) {
        console.error('Error fetching user modules:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to fetch recent activity
export const useRecentActivity = () => {
  return useQuery({
    queryKey: ['recentActivity'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/user-dashboard/activities');
        const items = res.data?.data?.activities || [];
        
        return items.map((a, idx) => ({
          id: a.id || `${a.type}-${idx}`,
          title: a.title,
          time: new Date(a.time).toLocaleString(),
          type: a.type,
        })).slice(0, 5); // Limit to 5 items
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch upcoming appointments
export const useUpcomingAppointments = () => {
  return useQuery({
    queryKey: ['upcomingAppointments'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/veterinary/user/appointments');
        const appointments = res.data?.data?.appointments || [];
        return appointments.slice(0, 5); // Limit to 5 appointments
      } catch (error) {
        console.error('Error fetching upcoming appointments:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Combined hook for the entire dashboard
export const useUserDashboard = () => {
  const { data: pets = [], isLoading: petsLoading, error: petsError } = useUserPets();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: modules = [], isLoading: modulesLoading, error: modulesError } = useUserModules();
  const { data: recentActivity = [], isLoading: activityLoading, error: activityError } = useRecentActivity();
  const { data: upcomingAppointments = [], isLoading: appointmentsLoading } = useUpcomingAppointments();
  
  const isLoading = petsLoading || statsLoading || modulesLoading || activityLoading || appointmentsLoading;
  
  return {
    pets,
    stats: stats || { totalPets: 0, upcomingAppointments: 0, pendingAdoptions: 0, reservations: 0 },
    modules,
    recentActivity,
    upcomingAppointments,
    isLoading,
    errors: {
      pets: petsError,
      modules: modulesError,
      activity: activityError
    }
  };
};