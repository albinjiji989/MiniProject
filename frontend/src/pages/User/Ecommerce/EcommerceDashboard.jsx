import React, { useEffect, useState } from 'react'
import ModuleDashboardLayout from '../../../components/Module/ModuleDashboardLayout'
import { useNavigate } from 'react-router-dom'
import { ecommerceAPI, shopAPI } from '../../../services/api'

export default function EcommerceDashboard() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [cartItems, setCartItems] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('shop')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load products
      const productsRes = await shopAPI.listProducts()
      setProducts(productsRes.data?.data?.products || [])
      
      // Load cart items
      const cartRes = await shopAPI.getCart()
      setCartItems(cartRes.data?.data?.items || [])
      
      // Load orders
      const ordersRes = await ecommerceAPI.listOrders()
      setOrders(ordersRes.data?.data?.orders || [])
    } catch (error) {
      console.error('Error loading ecommerce data:', error)
      setProducts([])
      setCartItems([])
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const actions = [
    { label: 'Shop Now', onClick: () => setTab('shop'), color: 'bg-emerald-600' },
    { label: 'My Cart', onClick: () => setTab('cart'), color: 'bg-blue-600' },
    { label: 'My Orders', onClick: () => setTab('orders'), color: 'bg-indigo-600' },
  ]

  const stats = [
    { label: 'Products', value: products.length, icon: '🛍️' },
    { label: 'Cart Items', value: cartItems.length, icon: '🛒' },
    { label: 'Orders', value: orders.length, icon: '📦' },
  ]

  const tabs = [
    { key: 'shop', label: 'Shop' },
    { key: 'cart', label: 'Cart' },
    { key: 'orders', label: 'Orders' },
  ]

  const Shop = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {products.map((p, i)=> (
        <div key={i} className="bg-white border rounded p-4">
          <div className="font-semibold">{p.name || 'Product'}</div>
          <div className="text-gray-600 text-sm">{p.category || '-'}</div>
          <div className="mt-1 font-medium">₹{p.price || 0}</div>
          <div className="mt-2">
            <button 
              className="px-3 py-1 bg-emerald-600 text-white rounded"
              onClick={() => shopAPI.addToCart(p._id)}
            >
              Add to Cart
            </button>
          </div>
        </div>
      ))}
      {products.length===0 && <div className="text-gray-500">No products available.</div>}
    </div>
  )

  const Cart = () => (
    <div className="bg-white border rounded">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 px-3">Item</th>
            <th className="py-2 px-3">Qty</th>
            <th className="py-2 px-3">Price</th>
            <th className="py-2 px-3">Total</th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map((c,i)=> (
            <tr key={i} className="border-b">
              <td className="py-2 px-3">{c.name || 'Item'}</td>
              <td className="py-2 px-3">{c.qty || 1}</td>
              <td className="py-2 px-3">₹{c.price || 0}</td>
              <td className="py-2 px-3">₹{(c.qty||1)*(c.price||0)}</td>
            </tr>
          ))}
          {cartItems.length===0 && (
            <tr><td className="py-3 px-3 text-gray-500" colSpan={4}>Your cart is empty.</td></tr>
          )}
        </tbody>
      </table>
      <div className="p-3 flex justify-end">
        <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={()=>navigate('/User/cart')}>Go to Cart</button>
      </div>
    </div>
  )

  const Orders = () => (
    <div className="bg-white border rounded">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 px-3">Order #</th>
            <th className="py-2 px-3">Date</th>
            <th className="py-2 px-3">Status</th>
            <th className="py-2 px-3">Amount</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o,i)=> (
            <tr key={i} className="border-b">
              <td className="py-2 px-3">{o.orderNo || o._id}</td>
              <td className="py-2 px-3">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '-'}</td>
              <td className="py-2 px-3">{o.status || '-'}</td>
              <td className="py-2 px-3">₹{o.amount || 0}</td>
            </tr>
          ))}
          {orders.length===0 && <tr><td className="py-3 px-3 text-gray-500" colSpan={4}>No orders found.</td></tr>}
        </tbody>
      </table>
      <div className="p-3 flex justify-end">
        <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={()=>navigate('/User/orders')}>Go to Orders</button>
      </div>
    </div>
  )

  return (
    <ModuleDashboardLayout
      title="Ecommerce"
      description="Shop products and manage your cart and orders"
      actions={actions}
      stats={stats}
      tabs={tabs}
      activeTab={tab}
      onTabChange={setTab}
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {tab === 'shop' && <Shop />}
          {tab === 'cart' && <Cart />}
          {tab === 'orders' && <Orders />}
        </>
      )}
    </ModuleDashboardLayout>
  )
}