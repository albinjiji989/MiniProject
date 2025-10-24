import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ModuleDashboardLayout from '../../../components/Module/ModuleDashboardLayout'
import { temporaryCareAPI } from '../../../services/api'

export default function TemporaryCareDashboard() {
  const [hosts, setHosts] = useState([])
  const [stays, setStays] = useState([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load hosts
      const hostsRes = await temporaryCareAPI.listHosts()
      setHosts(hostsRes.data?.data?.hosts || [])
      
      // Load stays
      const staysRes = await temporaryCareAPI.listMyStays()
      setStays(staysRes.data?.data?.stays || [])
    } catch (error) {
      console.error('Error loading temporary care data:', error)
      setHosts([])
      setStays([])
    } finally {
      setLoading(false)
    }
  }

  const actions = [
    { label: 'Find Host', onClick: () => setTab('find'), color: 'bg-emerald-600' },
    { label: 'My Stays', onClick: () => setTab('stays'), color: 'bg-blue-600' },
  ]

  const stats = [
    { label: 'Available Hosts', value: hosts.length, icon: '🏠' },
    { label: 'My Stays', value: stays.length, icon: '🛏️' },
  ]

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'find', label: 'Find Host' },
    { key: 'stays', label: 'My Stays' },
  ]

  const Overview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white border rounded p-4">
        <h3 className="font-semibold mb-2">Featured Hosts</h3>
        <ul className="text-sm space-y-2">
          {hosts.slice(0,5).map((h,i)=> (
            <li key={i} className="flex justify-between"><span>{h.name || 'Host'}</span><span className="text-gray-500">{h.city || '-'}</span></li>
          ))}
          {hosts.length===0 && <li className="text-gray-500">No hosts available.</li>}
        </ul>
      </div>
      <div className="bg-white border rounded p-4">
        <h3 className="font-semibold mb-2">Upcoming Stays</h3>
        <ul className="text-sm space-y-2">
          {stays.slice(0,5).map((s,i)=> (
            <li key={i} className="flex justify-between"><span>{s.petName || 'Pet'}</span><span className="text-gray-500">{s.from} → {s.to}</span></li>
          ))}
          {stays.length===0 && <li className="text-gray-500">No stays scheduled.</li>}
        </ul>
      </div>
    </div>
  )

  const Find = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {hosts.map((h,i)=> (
        <div key={i} className="bg-white border rounded p-4">
          <div className="font-semibold">{h.name || 'Host'}</div>
          <div className="text-gray-600 text-sm">{h.city || '-'}</div>
          <div className="text-xs text-gray-500 mt-1">Capacity: {h.capacity || '-'}</div>
          <div className="mt-2">
            <button 
              className="px-3 py-1 bg-emerald-600 text-white rounded text-sm"
              onClick={() => window.location.href = `/User/temporary-care/hosts/${h._id}`}
            >
              View Details
            </button>
          </div>
        </div>
      ))}
      {hosts.length===0 && <div className="text-gray-500">No hosts available.</div>}
    </div>
  )

  const MyStays = () => (
    <div className="bg-white border rounded">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 px-3">Pet</th>
            <th className="py-2 px-3">Host</th>
            <th className="py-2 px-3">From</th>
            <th className="py-2 px-3">To</th>
            <th className="py-2 px-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {stays.map((s,i)=> (
            <tr key={i} className="border-b">
              <td className="py-2 px-3">{s.petName || 'Pet'}</td>
              <td className="py-2 px-3">{s.hostName || '-'}</td>
              <td className="py-2 px-3">{s.from ? new Date(s.from).toLocaleDateString() : '-'}</td>
              <td className="py-2 px-3">{s.to ? new Date(s.to).toLocaleDateString() : '-'}</td>
              <td className="py-2 px-3">
                <span className={`px-2 py-1 rounded text-xs ${
                  s.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  s.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  s.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {s.status || '-'}
                </span>
              </td>
            </tr>
          ))}
          {stays.length===0 && <tr><td className="py-3 px-3 text-gray-500" colSpan={5}>No stays found.</td></tr>}
        </tbody>
      </table>
    </div>
  )

  return (
    <ModuleDashboardLayout
      title="Temporary Care"
      description="Find hosts and manage your pet's temporary stays"
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
          {tab === 'overview' && <Overview />}
          {tab === 'find' && <Find />}
          {tab === 'stays' && <MyStays />}
        </>
      )}
    </ModuleDashboardLayout>
  )
}