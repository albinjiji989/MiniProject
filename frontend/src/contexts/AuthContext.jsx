import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { authAPI, api } from '../services/api'
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
  const firebaseSessionHandledRef = useRef(false)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          dispatch({ type: 'AUTH_START' })
          console.log('Checking existing token:', token.substring(0, 20) + '...')
          const response = await authAPI.getMe()
          console.log('getMe response:', response.data)
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: response.data.data.user,
              token
            }
          })
          console.log('Auth state restored successfully')
        } catch (error) {
          console.error('Token verification failed:', error)
          localStorage.removeItem('token')
          dispatch({
            type: 'AUTH_FAILURE',
            payload: error.response?.data?.message || 'Authentication failed'
          })
        }
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: null })
      }
    }


    // Listen for Firebase auth state changes
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // If we already have a backend session (token) or handled a Firebase session, skip
        const existingToken = localStorage.getItem('token')
        if (existingToken || firebaseSessionHandledRef.current) {
          return
        }
        // User is signed in with Firebase
        try {
          dispatch({ type: 'AUTH_START' })
          // Prevent auto-login to backend for unverified email/password accounts
          const providers = (firebaseUser.providerData || []).map(p => p.providerId)
          const isPasswordProvider = providers.includes('password')
          if (isPasswordProvider && !firebaseUser.emailVerified) {
            // Skip backend session creation until verified
            dispatch({ type: 'AUTH_FAILURE', payload: null })
            return
          }
          const userData = {
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            firebaseUid: firebaseUser.uid,
            profileImage: firebaseUser.photoURL,
            provider: providers[0] || 'firebase'
          }
          
          const response = await api.post('/auth/firebase-login', userData)
          const { user, token } = response.data.data
          
          localStorage.setItem('token', token)
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, token }
          })
          firebaseSessionHandledRef.current = true
        } catch (error) {
          console.error('Firebase auth error:', error)
          dispatch({
            type: 'AUTH_FAILURE',
            payload: error.response?.data?.message || 'Firebase authentication failed'
          })
        // Sign out of Firebase to avoid repeated onAuthStateChanged loops
        try { await firebaseAuth.signOut() } catch (_) {}
        }
      } else {
        // User is signed out
        if (!localStorage.getItem('token')) {
          dispatch({ type: 'AUTH_FAILURE', payload: null })
        }
        firebaseSessionHandledRef.current = false
      }
    })

    initAuth()

    return () => unsubscribe()
  }, [])

  const login = async (credentials) => {
    try {
      dispatch({ type: 'AUTH_START' })
      const response = await authAPI.login(credentials)
      console.log('Login response:', response.data)
      const { user, token } = response.data.data
      
      localStorage.setItem('token', token)
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      })
      
      console.log('Login successful, user:', user)
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
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
      
      localStorage.setItem('token', token)
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
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
    try { await firebaseAuth.signOut() } catch (_) {}
    localStorage.removeItem('token')
    firebaseSessionHandledRef.current = false
    dispatch({ type: 'LOGOUT' })
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData)
      dispatch({
        type: 'UPDATE_USER',
        payload: response.data.data.user
      })
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed'
      return { success: false, error: errorMessage }
    }
  }

  const changePassword = async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData)
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password change failed'
      return { success: false, error: errorMessage }
    }
  }

  // Firebase Authentication Methods
  const loginWithGoogle = async (role = 'public_user') => {
    try {
      dispatch({ type: 'AUTH_START' })
      const result = await firebaseAuth.signInWithGoogle(role)
      
      if (result.success) {
        // We no longer expect a token immediately; onAuthStateChanged will
        // post to /auth/firebase-login and populate user/token.
        return { success: true }
      } else {
        dispatch({
          type: 'AUTH_FAILURE',
          payload: result.error
        })
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = error.message || 'Google login failed'
      dispatch({
        type: 'AUTH_FAILURE',
        payload: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  }


  const signUpWithGoogle = async (role = 'public_user', assignedModule = null) => {
    try {
      dispatch({ type: 'AUTH_START' })
      const result = await firebaseAuth.signUpWithGoogle(role, assignedModule)
      
      if (result.success) {
        // Same as login: wait for onAuthStateChanged to complete backend session
        return { success: true }
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

  const loginWithEmail = async (credentials) => {
    try {
      dispatch({ type: 'AUTH_START' })
      const result = await firebaseAuth.signInWithEmail(credentials.email, credentials.password)
      
      if (result.success) {
        localStorage.setItem('token', result.token)
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: result.user, token: result.token }
        })
        return { success: true }
      } else {
        dispatch({
          type: 'AUTH_FAILURE',
          payload: result.error
        })
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = error.message || 'Email login failed'
      dispatch({
        type: 'AUTH_FAILURE',
        payload: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  }

  const signUpWithEmail = async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' })
      const result = await firebaseAuth.signUpWithEmail(userData.email, userData.password, userData)
      
      if (result.success) {
        if (result.token) {
          localStorage.setItem('token', result.token)
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user: result.user, token: result.token }
          })
        } else {
          dispatch({ type: 'AUTH_FAILURE', payload: null })
        }
        return { success: true, message: result.message }
      } else {
        dispatch({
          type: 'AUTH_FAILURE',
          payload: result.error
        })
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = error.message || 'Email signup failed'
      dispatch({
        type: 'AUTH_FAILURE',
        payload: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  }

  const resetPassword = async (email) => {
    try {
      const result = await firebaseAuth.resetPassword(email)
      return result
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // OTP Password Reset via Firebase Functions
  const requestPasswordResetOTP = async (email) => {
    try {
      return await firebaseAuth.requestPasswordResetOTP(email)
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const verifyOTPAndResetPassword = async ({ email, otp, newPassword }) => {
    try {
      return await firebaseAuth.verifyOTPAndResetPassword(email, otp, newPassword)
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const logoutFirebase = async () => {
    try {
      await firebaseAuth.signOut()
      localStorage.removeItem('token')
      dispatch({ type: 'LOGOUT' })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    // Firebase methods
    loginWithGoogle,
    signUpWithGoogle,
    loginWithEmail,
    signUpWithEmail,
    resetPassword,
    requestPasswordResetOTP,
    verifyOTPAndResetPassword,
    logoutFirebase
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
