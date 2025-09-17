import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
// OTP reset now uses backend API to avoid CORS issues
import { auth, googleProvider } from '../config/firebase'
import { api } from './api'

class FirebaseAuthService {
  // Google Sign In
  async signInWithGoogle(role = 'public_user', assignedModule = null) {
    try {
      // First, complete any pending redirect result
      const redirected = await getRedirectResult(auth).catch(() => null)
      const result = redirected || await signInWithPopup(auth, googleProvider).catch(async (error) => {
        // Fallback to redirect for COOP/COEP or environment issues
        const coopBlocked = typeof error?.message === 'string' && error.message.toLowerCase().includes('cross-origin-opener')
        const notSupported = error?.code === 'auth/operation-not-supported-in-this-environment'
        const popupBlocked = error?.code === 'auth/popup-blocked'
        if (coopBlocked || notSupported || popupBlocked) {
          await signInWithRedirect(auth, googleProvider)
          return null
        }
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
          throw new Error('Sign-in was cancelled')
        }
        throw error
      })
      
      // If we initiated a redirect, exit now; onAuthStateChanged will finish login
      if (!result) {
        return { success: true, redirect: true }
      }

      // At this point Firebase sign-in succeeded. The AuthContext onAuthStateChanged
      // listener will call the backend (/auth/firebase-login) to create a JWT session.
      // Return success here without calling the backend twice to avoid 400s/race conditions.
      return { success: true }
    } catch (error) {
      console.error('Google sign-in error:', error)
      return {
        success: false,
        error: error.message || 'Google sign-in failed'
      }
    }
  }

  // Email/Password Sign In (using backend OAuth2)
  async signInWithEmail(email, password) {
    try {
      // Use backend login directly instead of Firebase
      const response = await api.post('/auth/login', { email, password })
      
      return {
        success: true,
        user: response.data.data.user,
        token: response.data.data.token
      }
    } catch (error) {
      console.error('Email sign-in error:', error)
      const message = error?.response?.data?.message || error.message
      return {
        success: false,
        error: message
      }
    }
  }

  // Email/Password Sign Up (using backend OAuth2)
  async signUpWithEmail(email, password, userData) {
    try {
      // Use backend registration directly instead of Firebase
      const backendUserData = {
        ...userData,
        email,
        password,
        authProvider: 'local'
      }
      
      const response = await api.post('/auth/register', backendUserData)
      
      return {
        success: true,
        user: response.data.data.user,
        token: response.data.data.token,
        message: 'Signup successful! Welcome email sent.'
      }
    } catch (error) {
      console.error('Email sign-up error:', error)
      const message = error?.response?.data?.message || error.message
      return {
        success: false,
        error: message
      }
    }
  }


  // Google Sign Up (same as sign in for Google)
  async signUpWithGoogle(role = 'public_user', assignedModule = null) {
    return await this.signInWithGoogle(role, assignedModule)
  }

  // Forgot Password
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email)
      return {
        success: true,
        message: 'Password reset email sent successfully'
      }
    } catch (error) {
      console.error('Password reset error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // OTP reset via backend API (uses Nodemailer with OAuth2)
  async requestPasswordResetOTP(email) {
    try {
      const { default: api } = await import('./api')
      await api.post('/auth/forgot-password', { email })
      return { success: true }
    } catch (error) {
      const message = error?.response?.data?.message || error.message
      return { success: false, error: message }
    }
  }

  async verifyOTPAndResetPassword(email, otp, newPassword) {
    try {
      const { default: api } = await import('./api')
      await api.post('/auth/reset-password', { email, otp, password: newPassword, confirmPassword: newPassword })
      return { success: true }
    } catch (error) {
      const message = error?.response?.data?.message || error.message
      return { success: false, error: message }
    }
  }

  // Sign Out
  async signOut() {
    try {
      await signOut(auth)
      return {
        success: true,
        message: 'Signed out successfully'
      }
    } catch (error) {
      console.error('Sign out error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Auth State Listener
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback)
  }

  // Get Current User
  getCurrentUser() {
    return auth.currentUser
  }
}

export default new FirebaseAuthService()
