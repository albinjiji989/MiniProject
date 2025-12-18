import React, { useState, useEffect, useContext } from 'react'
import {
  Box,
  CssBaseline,
  useTheme,
  useMediaQuery,
  createTheme,
  ThemeProvider
} from '@mui/material'
import RoleBasedSidebar from './RoleBasedSidebar'
import TopNavbar from '../Navigation/TopNavbar'
import { useAuth } from '../../contexts/AuthContext'

const DRAWER_WIDTH = 280

// Custom theme with modern colors
const createCustomTheme = (isDarkMode) => createTheme({
  palette: {
    mode: isDarkMode ? 'dark' : 'light',
    primary: {
      main: isDarkMode ? '#90caf9' : '#1976d2',
      light: isDarkMode ? '#bbdefb' : '#42a5f5',
      dark: isDarkMode ? '#64b5f6' : '#1565c0',
    },
    secondary: {
      main: isDarkMode ? '#f48fb1' : '#dc004e',
    },
    background: {
      default: isDarkMode ? '#121212' : '#f8fafc',
      paper: isDarkMode ? '#1e1e1e' : '#ffffff',
    },
    text: {
      primary: isDarkMode ? '#ffffff' : '#1a202c',
      secondary: isDarkMode ? '#b0b0b0' : '#718096',
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    }
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: isDarkMode 
            ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: isDarkMode
              ? '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)'
              : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontWeight: 500,
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        }
      }
    }
  }
})

const UserLayout = ({ children }) => {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false) // Start closed by default
  const [isDarkMode, setIsDarkMode] = useState(false)
  const isMobile = useMediaQuery('(max-width:900px)')
  
  // Auto-close sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [isMobile])

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
    }
  }, [])

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleThemeToggle = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    localStorage.setItem('theme', newMode ? 'dark' : 'light')
  }

  const customTheme = createCustomTheme(isDarkMode)

  return (
    <ThemeProvider theme={customTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
        {/* Top Navigation - Fixed */}
        <TopNavbar 
          onMenuClick={handleSidebarToggle}
          user={user}
          onThemeToggle={handleThemeToggle}
          isDarkMode={isDarkMode}
        />

        {/* Sidebar - Overlay on mobile, persistent on desktop */}
        <Drawer
          variant={isMobile ? 'temporary' : 'persistent'}
          anchor="left"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          <RoleBasedSidebar onClose={() => setSidebarOpen(false)} />
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: '100%',
            minHeight: '100vh',
            pt: '64px', // Fixed top navbar height
            ml: 0, // Remove any margin
            pl: 0, // Remove padding-left completely
            bgcolor: 'background.default',
            position: 'relative'
          }}
        >
          <Box sx={{ 
            p: { xs: 2, sm: 3, md: 4 },
            maxWidth: '1400px',
            mx: 'auto',
            width: '100%'
          }}>
            {children}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}

export default UserLayout