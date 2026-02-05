/**
 * Session Management Utility
 * Provides persistent session tracking for analytics and recommendations
 */

const SESSION_KEY = 'app_session_id';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Get or create a persistent session ID
 * Sessions expire after 30 minutes of inactivity
 */
export const getSessionId = () => {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    
    if (stored) {
      const { id, timestamp } = JSON.parse(stored);
      const now = Date.now();
      
      // Check if session is still valid (within 30 minutes)
      if (now - timestamp < SESSION_DURATION) {
        // Update timestamp to extend session
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, timestamp: now }));
        return id;
      }
    }
    
    // Create new session
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      id: newSessionId,
      timestamp: Date.now()
    }));
    
    return newSessionId;
  } catch (error) {
    // Fallback if sessionStorage is unavailable
    return `session-${Date.now()}`;
  }
};

/**
 * Get device type based on screen width
 */
export const getDeviceType = () => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

/**
 * Clear current session (useful for logout)
 */
export const clearSession = () => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.debug('Failed to clear session:', error);
  }
};
