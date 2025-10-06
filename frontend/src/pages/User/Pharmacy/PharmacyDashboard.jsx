import React, { useEffect, useState } from 'react'
import ModuleDashboardLayout from '../../../components/Module/ModuleDashboardLayout'
import { pharmacyAPI } from '../../../services/api'

export default function PharmacyDashboard() {
  const [meds, setMeds] = useState([])
  const [orders, setOrders] = useState([])
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    const load = async () => {
      try {
        const [medsRes, ordersRes] = await Promise.all([
          pharmacyAPI?.list?.().catch(()=>({ data:{ data:{ items: [] }}})),
          pharmacyAPI?.myOrders?.().catch(()=>({ data:{ data:{ orders: [] }}})),
        ])
        setMeds(medsRes?.data?.data?.items || medsRes?.data?.items || [])
        setOrders(ordersRes?.data?.data?.orders || ordersRes?.data?.orders || [])
      } catch (_) {}
    }
    load()
  }, [])

  const actions = [
    { label: 'Browse Medicines', onClick: () => setTab('browse'), color: 'bg-emerald-600' },
    { label: 'My Orders', onClick: () => setTab('orders'), color: 'bg-blue-600' },
  ]

  const stats = [
    { label: 'Medicines', value: meds.length, icon: '💊' },
    { label: 'Orders', value: orders.length, icon: '🧾' },
  ]

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'browse', label: 'Browse' },
    { key: 'orders', label: 'My Orders' },
  ]

  const Overview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white border rounded p-4">
        <h3 className="font-semibold mb-2">Popular Medicines</h3>
        <ul className="text-sm space-y-2">
          {meds.slice(0,6).map((m,i)=> (
            <li key={i} className="flex justify-between"><span>{m.name || 'Medicine'}</span><span className="text-gray-500">₹{m.price || 0}</span></li>
          ))}
          {meds.length===0 && <li className="text-gray-500">No medicines available.</li>}
        </ul>
      </div>
      <div className="bg-white border rounded p-4">
        <h3 className="font-semibold mb-2">Recent Orders</h3>
        <ul className="text-sm space-y-2">
          {orders.slice(0,5).map((o,i)=> (
            <li key={i} className="flex justify-between"><span>#{o.orderNo || o._id}</span><span className="text-gray-500">{o.status || '-'}</span></li>
          ))}
          {orders.length===0 && <li className="text-gray-500">No orders found.</li>}
        </ul>
      </div>
    </div>
  )

  const Browse = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {meds.map((m,i)=> (
        <div key={i} className="bg-white border rounded p-4">
          <div className="font-semibold">{m.name || 'Medicine'}</div>
          <div className="text-gray-600 text-sm">{m.category || '-'}</div>
          <div className="mt-1 font-medium">₹{m.price || 0}</div>
        </div>
      ))}
      {meds.length===0 && <div className="text-gray-500">No medicines available.</div>}
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
    </div>
  )

  return (
    <ModuleDashboardLayout
      title="Pharmacy"
      description="Browse medicines and manage orders"
      actions={actions}
      stats={stats}
      tabs={tabs}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === 'overview' && <Overview />}
      {tab === 'browse' && <Browse />}
      {tab === 'orders' && <Orders />}
    </ModuleDashboardLayout>
  )
}
