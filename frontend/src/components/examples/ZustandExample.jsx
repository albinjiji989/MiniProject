import React from 'react'
import useGlobalStore from '../../stores/useGlobalStore'

const ZustandExample = () => {
  const { user, setUser, notifications, addNotification, removeNotification, clearNotifications, loading, setLoading } = useGlobalStore()
  
  const handleAddNotification = () => {
    addNotification({
      id: Date.now(),
      message: 'This is a sample notification',
      type: 'info'
    })
  }
  
  const handleClearNotifications = () => {
    clearNotifications()
  }
  
  const handleSetUser = () => {
    setUser({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com'
    })
  }
  
  return (
    <div>
      <h2>Zustand Example</h2>
      <div>
        <h3>User Info:</h3>
        {user ? (
          <div>
            <p>Name: {user.name}</p>
            <p>Email: {user.email}</p>
          </div>
        ) : (
          <p>No user logged in</p>
        )}
        <button onClick={handleSetUser}>Set User</button>
      </div>
      
      <div>
        <h3>Notifications:</h3>
        <button onClick={handleAddNotification}>Add Notification</button>
        <button onClick={handleClearNotifications}>Clear Notifications</button>
        <ul>
          {notifications.map(notification => (
            <li key={notification.id}>
              {notification.message}
              <button onClick={() => removeNotification(notification.id)}>X</button>
            </li>
          ))}
        </ul>
      </div>
      
      <div>
        <h3>Loading State:</h3>
        <p>Loading: {loading ? 'true' : 'false'}</p>
        <button onClick={() => setLoading(!loading)}>
          Toggle Loading
        </button>
      </div>
    </div>
  )
}

export default ZustandExample