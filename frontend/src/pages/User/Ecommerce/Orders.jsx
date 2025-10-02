import React, { useEffect, useState } from 'react'
import { api } from '../../../services/api'

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/ecommerce/orders')
        setOrders(res.data?.data?.orders || [])
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load orders')
      }
    })()
  }, [])

  if (error) return <div style={{ padding: 16, color: 'red' }}>{error}</div>

  return (
    <div style={{ padding: 16 }}>
      <h2>My Orders</h2>
      {!orders.length ? (
        <div>No orders yet.</div>
      ) : (
        <ul>
          {orders.map((o) => (
            <li key={o.id || o._id}>{o.number || o._id}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Orders


