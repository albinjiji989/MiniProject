import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useGlobalStore = create(
  persist(
    (set, get) => ({
      // User state
      user: null,
      setUser: (user) => set({ user }),
      
      // Notification state
      notifications: [],
      addNotification: (notification) => set((state) => ({
        notifications: [...state.notifications, notification]
      })),
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
      clearNotifications: () => set({ notifications: [] }),
      
      // Loading state
      loading: false,
      setLoading: (loading) => set({ loading }),
      
      // Error state
      error: null,
      setError: (error) => set({ error }),
      
      // UI state
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      // Reset store
      reset: () => set({
        user: null,
        notifications: [],
        loading: false,
        error: null
      })
    }),
    {
      name: 'pet-welfare-storage',
      partialize: (state) => ({ 
        user: state.user,
        sidebarOpen: state.sidebarOpen
      })
    }
  )
)

export default useGlobalStore