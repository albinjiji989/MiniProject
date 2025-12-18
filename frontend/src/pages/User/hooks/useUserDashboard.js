import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { modulesAPI, userPetsAPI, apiClient, adoptionAPI } from '../../../services/api';

// Hook to fetch user pets from all sources
export const useUserPets = () => {
  return useQuery({
    queryKey: ['userPets'],
    queryFn: async () => {
      try {
        // Fetch from all pet sources in parallel
        const [petNewRes, petRes, adoptedRes, purchasedRes] = await Promise.allSettled([
          userPetsAPI.list({
            page: 1,
            limit: 12,
          }),
          apiClient.get('/pets/my-pets'),
          adoptionAPI.getMyAdoptedPets(),
          apiClient.get('/petshop/user/my-purchased-pets')
        ]);
        
        // Process PetNew results
        let petNewPets = [];
        if (petNewRes.status === 'fulfilled') {
          const data = petNewRes.value.data;
          petNewPets = Array.isArray(data?.data) ? data.data : (data?.data?.pets || []);
        }
        
        // Process Pet results
        let corePets = [];
        if (petRes.status === 'fulfilled') {
          corePets = petRes.value.data?.data?.pets || [];
        }
        
        // Process adopted pets
        let adoptedPets = [];
        if (adoptedRes.status === 'fulfilled') {
          adoptedPets = adoptedRes.value.data?.data || [];
        }
        
        // Process purchased pets
        let purchasedPets = [];
        if (purchasedRes.status === 'fulfilled') {
          purchasedPets = purchasedRes.value.data?.data?.pets || [];
        }
        
        // Map adopted pets to pet-like objects
        const mappedAdoptedPets = adoptedPets.map(pet => ({
          _id: pet._id,
          name: pet.name || 'Pet',
          images: pet.images || [],
          petCode: pet.petCode,
          breed: pet.breed,
          species: pet.species,
          gender: pet.gender || 'Unknown',
          status: 'adopted',
          currentStatus: 'adopted',
          tags: ['adoption'],
          adoptionDate: pet.adoptionDate,
          age: pet.age,
          ageUnit: pet.ageUnit,
          color: pet.color,
          createdAt: pet.adoptionDate
        }));
        
        // Map purchased pets to pet-like objects
        const mappedPurchasedPets = purchasedPets.map(pet => ({
          _id: pet._id,
          name: pet.name || 'Pet',
          images: pet.images || [],
          petCode: pet.petCode,
          breed: pet.breed,
          species: pet.species,
          gender: pet.gender || 'Unknown',
          status: 'purchased',
          currentStatus: 'purchased',
          tags: ['purchased'],
          purchaseDate: pet.acquiredDate,
          age: pet.age,
          ageUnit: pet.ageUnit,
          color: pet.color,
          createdAt: pet.acquiredDate,
          source: pet.source,
          sourceLabel: pet.sourceLabel
        }));
        
        // Combine and deduplicate pets
        const combinedPets = [...petNewPets, ...corePets, ...mappedAdoptedPets, ...mappedPurchasedPets];
        const uniquePets = combinedPets.filter((pet, index, self) => 
          index === self.findIndex(p => (p.petCode || p._id) === (pet.petCode || pet._id))
        );
        
        // Sort pets by creation date (newest first)
        const sortedPets = [...uniquePets].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.adoptionDate || a.purchaseDate || 0);
          const dateB = new Date(b.createdAt || b.adoptionDate || b.purchaseDate || 0);
          return dateB - dateA;
        });
        
        return sortedPets;
      } catch (error) {
        console.error('Error fetching user pets:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
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