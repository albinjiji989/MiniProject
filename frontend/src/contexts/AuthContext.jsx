import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import firebaseAuth from '../services/firebaseAuth'

const AuthContext = createContext()

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null
}

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null
      }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      }
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      }
    default:
      return state
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const navigate = useNavigate()

  const TOKEN_KEYS = ['token', 'authToken', 'accessToken', 'jwt', 'jwtToken', 'access_token']
  const clearAllAuthTokens = () => {
    try {
      for (const k of TOKEN_KEYS) {
        localStorage.removeItem(k)
        sessionStorage.removeItem(k)
      }
      localStorage.removeItem('user')
      sessionStorage.removeItem('user')
    } catch (_) {}
  }

  // Handle custom logout event
  useEffect(() => {
    const handleLogout = () => {
      clearAuthState()
    }

    window.addEventListener('auth:logout', handleLogout)
    
    return () => {
      window.removeEventListener('auth:logout', handleLogout)
    }
  }, [])

  // Check if user is a module manager with empty store name
  const needsStoreNameSetup = (user) => {
    if (!user) return false;
    const isModuleManager = typeof user.role === 'string' && user.role.endsWith('_manager');
    // For adoption, petshop, and veterinary managers, check if storeName is empty
    const isAdoptionOrPetshopOrVeterinaryManager = 
      user.role === 'adoption_manager' || 
      user.role === 'petshop_manager' || 
      user.role === 'veterinary_manager';
    return isModuleManager && isAdoptionOrPetshopOrVeterinaryManager && (!user.storeName || user.storeName.trim() === '');
  }

  // Simple initialization - verify token with backend; if cookies enabled, try session-based auth
  useEffect(() => {
    const token = localStorage.getItem('token')
    const cookiesEnabled = import.meta.env.VITE_API_COOKIES === 'true'
    if (token) {
      // Verify token with backend
      authAPI.getMe()
        .then(response => {
          console.log('AuthContext - getMe response:', response);
          const user = response.data.data.user
          console.log('AuthContext - user data:', user);
          // Check if user needs store name setup
          const shouldRedirectToStoreSetup = needsStoreNameSetup(user)
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: {...user, needsStoreNameSetup: shouldRedirectToStoreSetup},
              token
            }
          })
        })
        .catch((error) => {
          console.error('AuthContext - getMe error:', error);
          // Token is invalid, clear it
          localStorage.removeItem('token')
          dispatch({ type: 'AUTH_FAILURE', payload: null })
        })
    } else if (cookiesEnabled) {
      // Try cookie-based session restore
      authAPI.getMe()
        .then(response => {
          console.log('AuthContext - cookie getMe response:', response);
          const user = response.data?.data?.user
          console.log('AuthContext - cookie user data:', user);
          if (user) {
            // Check if user needs store name setup
            const shouldRedirectToStoreSetup = needsStoreNameSetup(user)
            dispatch({ 
              type: 'AUTH_SUCCESS', 
              payload: { 
                user: {...user, needsStoreNameSetup: shouldRedirectToStoreSetup}, 
                token: null 
              } 
            })
          } else {
            dispatch({ type: 'AUTH_FAILURE', payload: null })
          }
        })
        .catch((error) => {
          console.error('AuthContext - cookie getMe error:', error);
          dispatch({ type: 'AUTH_FAILURE', payload: null })
        })
    } else {
      dispatch({ type: 'AUTH_FAILURE', payload: null })
    }

    // Listen for Firebase auth state changes (for Google auth)
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
      // If a logout was just initiated, skip any auto-login
      if (sessionStorage.getItem('auth_logout') === '1') {
        // Best-effort: ensure firebase is signed out
        try { await firebaseAuth.signOut() } catch (_) {}
        sessionStorage.removeItem('auth_logout')
        return
      }

      // If user is on the login page and there's no token, do not auto-create a session from Firebase
      const onLoginPage = typeof window !== 'undefined' && window.location?.pathname?.toLowerCase().includes('/login')
      const googleFlow = sessionStorage.getItem('auth_google_flow') === '1'
      if (onLoginPage && !localStorage.getItem('token') && !googleFlow) {
        return
      }

      if (firebaseUser && !localStorage.getItem('token')) {
        // User signed in with Firebase, create backend session
        try {
          const userData = {
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            firebaseUid: firebaseUser.uid,
            profileImage: firebaseUser.photoURL,
            provider: 'google'
          }
          
          console.log('AuthContext - Firebase login attempt:', userData);
          const response = await authAPI.firebaseLogin(userData)
          console.log('AuthContext - Firebase login response:', response);
          const { user, token } = response.data.data
          console.log('AuthContext - Firebase user data:', user);
          
          localStorage.setItem('token', token)
          // Check if user needs store name setup
          const shouldRedirectToStoreSetup = needsStoreNameSetup(user)
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user: {...user, needsStoreNameSetup: shouldRedirectToStoreSetup}, token }
          })
          // Clear google flow flag after successful session creation
          sessionStorage.removeItem('auth_google_flow')
        } catch (error) {
          console.error('Firebase auth error:', error)
          console.error('Firebase auth error response:', error.response);
          // If account is deactivated, clear session and surface a message
          const msg = error?.response?.data?.message || error.message || 'Firebase authentication failed'
          const status = error?.response?.status
          if (status === 403 || String(msg).toLowerCase().includes('deactivated')) {
            try { await firebaseAuth.signOut() } catch (_) {}
            localStorage.removeItem('token')
            sessionStorage.setItem('auth_deactivated', '1')
            sessionStorage.setItem('auth_deactivated_msg', msg)
            try { window.dispatchEvent(new CustomEvent('auth:deactivated', { detail: { message: msg } })) } catch (_) {}
          }
          dispatch({
            type: 'AUTH_FAILURE',
            payload: msg
          })
          // Clear google flow flag on failure as well
          sessionStorage.removeItem('auth_google_flow')
        }
      }
    })

    return () => unsubscribe()
  }, [])

  const login = async (credentials) => {
    try {
      dispatch({ type: 'AUTH_START' })
      const response = await authAPI.login(credentials)
      console.log('Login response:', response);
      const data = response.data?.data || {}
      const cookiesEnabled = import.meta.env.VITE_API_COOKIES === 'true'
      
      // If token present (JWT flow)
      if (data.token) {
        // Check if user needs store name setup
        const shouldRedirectToStoreSetup = needsStoreNameSetup(data.user)
        localStorage.setItem('token', data.token)
        console.log('Login - user data:', data.user);
        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { 
            user: {...data.user, needsStoreNameSetup: shouldRedirectToStoreSetup}, 
            token: data.token 
          } 
        })
      } else if (cookiesEnabled) {
        // Cookie session flow: fetch user via /auth/me
        const me = await authAPI.getMe()
        console.log('Login - getMe response:', me);
        const user = me.data?.data?.user
        console.log('Login - getMe user data:', user);
        if (user) {
          // Check if user needs store name setup
          const shouldRedirectToStoreSetup = needsStoreNameSetup(user)
          dispatch({ 
            type: 'AUTH_SUCCESS', 
            payload: { 
              user: {...user, needsStoreNameSetup: shouldRedirectToStoreSetup}, 
              token: null 
            } 
          })
        } else {
          throw new Error('Session established but user not returned')
        }
      } else {
        throw new Error('No token returned from login and cookies are disabled')
      }
      
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed'
      dispatch({
        type: 'AUTH_FAILURE',
        payload: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  }

  const register = async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' })
      const response = await authAPI.register(userData)
      const { user, token } = response.data.data
      
      // Check if user needs store name setup
      const shouldRedirectToStoreSetup = needsStoreNameSetup(user)
      localStorage.setItem('token', token)
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: {...user, needsStoreNameSetup: shouldRedirectToStoreSetup}, token }
      })
      
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed'
      dispatch({
        type: 'AUTH_FAILURE',
        payload: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  }

  const logout = async () => {
    try {
      // Set a guard to prevent onAuthStateChanged from re-logging instantly
      sessionStorage.setItem('auth_logout', '1')
      // Call backend logout endpoint
      const token = localStorage.getItem('token')
      if (token) {
        try {
          await authAPI.logout()
        } catch (error) {
          console.error('Backend logout error:', error)
        }
      }
      
      // Sign out from Firebase
      try {
        await firebaseAuth.signOut()
      } catch (error) {
        console.error('Firebase logout error:', error)
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear all auth data
      clearAllAuthTokens()
      // keep the guard for this navigation tick, it will be removed by listener
      dispatch({ type: 'LOGOUT' })
      
      // Redirect to landing page (root path)
      navigate('/')
    }
  }

  const clearAuthState = () => {
    clearAllAuthTokens()
    dispatch({ type: 'LOGOUT' })
    navigate('/')
  }

  const updateProfile = async (profileData) => {
    try {
      // If profileData is provided, update it first
      if (profileData && Object.keys(profileData).length > 0) {
        await authAPI.updateProfile(profileData);
      }
      
      // Always fetch fresh user data to ensure consistency
      console.log('Updating profile and fetching fresh user data...');
      const freshUserData = await authAPI.getMe();
      console.log('Update profile response:', freshUserData);
      console.log('Update profile user data:', freshUserData.data.data.user);
      dispatch({
        type: 'UPDATE_USER',
        payload: freshUserData.data.data.user
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      return { success: false, error: errorMessage };
    }
  };

  const refreshUser = async () => {
    try {
      console.log('Refreshing user data...');
      const freshUserData = await authAPI.getMe();
      console.log('Refresh user response:', freshUserData);
      console.log('Refresh user data:', freshUserData.data.data.user);
      dispatch({
        type: 'UPDATE_USER',
        payload: freshUserData.data.data.user
      });
      return { success: true };
    } catch (error) {
      console.error('Refresh user error:', error);
      return { success: false, error: error.message };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData)
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password change failed'
      return { success: false, error: errorMessage }
    }
  }

  // Google Authentication Methods
  const loginWithGoogle = async (role = 'public_user') => {
    try {
      dispatch({ type: 'AUTH_START' })
      // Mark that we're in Google auth flow so onAuthStateChanged is allowed on /login
      sessionStorage.setItem('auth_google_flow', '1')
      const result = await firebaseAuth.signInWithGoogle(role)
      
      if (result.success) {
        // If it's a redirect, we need to wait for the auth state change
        if (result.redirect) {
          return { success: true, message: 'Redirecting to Google...' }
        }
        
        // If we have user data, proceed with backend login
        if (result.user) {
          const userData = {
            name: result.user.displayName,
            email: result.user.email,
            firebaseUid: result.user.uid,
            profileImage: result.user.photoURL,
            provider: 'google'
          }
          
          const response = await authAPI.firebaseLogin(userData)
          const { user, token } = response.data.data
          
          localStorage.setItem('token', token)
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, token }
          })
          
          return { success: true }
        } else {
          // No user data means we need to get it from Firebase auth state
          return { success: true, message: 'Google authentication successful' }
        }
      } else {
        dispatch({
          type: 'AUTH_FAILURE',
          payload: result.error
        })
        sessionStorage.removeItem('auth_google_flow')
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = error.message || 'Google login failed'
      dispatch({
        type: 'AUTH_FAILURE',
        payload: errorMessage
      })
      sessionStorage.removeItem('auth_google_flow')
      return { success: false, error: errorMessage }
    }
  }

  const signUpWithGoogle = async (role = 'public_user', assignedModule = null) => {
    try {
      dispatch({ type: 'AUTH_START' })
      const result = await firebaseAuth.signUpWithGoogle(role, assignedModule)
      
      if (result.success) {
        // If it's a redirect, we need to wait for the auth state change
        if (result.redirect) {
          return { success: true, message: 'Redirecting to Google...' }
        }
        
        // If we have user data, proceed with backend login
        if (result.user) {
          const userData = {
            name: result.user.displayName,
            email: result.user.email,
            firebaseUid: result.user.uid,
            profileImage: result.user.photoURL,
            provider: 'google',
            role,
            assignedModule
          }
          
          const response = await authAPI.firebaseLogin(userData)
          const { user, token } = response.data.data
          
          localStorage.setItem('token', token)
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, token }
          })
          
          return { success: true }
        } else {
          // No user data means we need to get it from Firebase auth state
          return { success: true, message: 'Google signup successful' }
        }
      } else {
        dispatch({
          type: 'AUTH_FAILURE',
          payload: result.error
        })
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = error.message || 'Google signup failed'
      dispatch({
        type: 'AUTH_FAILURE',
        payload: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  }

  // Password Reset Methods
  const forgotPassword = async (email) => {
    try {
      const response = await authAPI.forgotPassword(email)
      return { success: true, message: response.data.message }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset email'
      return { success: false, error: errorMessage }
    }
  }

  const resetPasswordWithOtp = async (email, otp, newPassword) => {
    try {
      const response = await authAPI.resetPasswordWithOtp({ email, otp, password: newPassword, confirmPassword: newPassword })
      return { success: true, message: response.data.message }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password reset failed'
      return { success: false, error: errorMessage }
    }
  }

  const value = {
    ...state,
    login,
    register,
    logout,
    clearAuthState,
    updateProfile,
    refreshUser,
    changePassword,
    // Google authentication
    loginWithGoogle,
    signUpWithGoogle,
    // Password reset
    forgotPassword,
    resetPasswordWithOtp
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Export AuthContext for direct use
export { AuthContext }