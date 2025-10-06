import React, { useEffect, useState } from 'react'
import ModuleDashboardLayout from '../../../components/Module/ModuleDashboardLayout'
import { veterinaryAPI } from '../../../services/api'

export default function VeterinaryDashboard() {
  const [clinics, setClinics] = useState([])
  const [appointments, setAppointments] = useState([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [clinicsRes, apptRes] = await Promise.all([
          veterinaryAPI.getClinics().catch(() => ({ data: { data: { clinics: [] } } })),
          veterinaryAPI.getAppointments().catch(() => ({ data: { data: { appointments: [] } } })),
        ])
        const rawClinics = clinicsRes.data?.data?.clinics || clinicsRes.data?.clinics || []
        const rawAppts = apptRes.data?.data?.appointments || apptRes.data?.appointments || []
        setClinics(rawClinics)
        setAppointments(rawAppts)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const actions = [
    { label: 'Book Appointment', onClick: () => setTab('book'), color: 'bg-emerald-600' },
    { label: 'My Appointments', onClick: () => setTab('appointments'), color: 'bg-blue-600' },
    { label: 'Clinics', onClick: () => setTab('clinics'), color: 'bg-indigo-600' },
  ]

  const stats = [
    { label: 'Clinics', value: clinics.length, icon: '🏥' },
    { label: 'Appointments', value: appointments.length, icon: '📅' },
    { label: 'Scheduled', value: appointments.filter(a => (a.status||'').toLowerCase()==='scheduled').length, icon: '⏱️' },
  ]

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'clinics', label: 'Clinics' },
    { key: 'appointments', label: 'My Appointments' },
    { key: 'book', label: 'Book' },
  ]

  const Overview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white border rounded p-4">
        <h3 className="font-semibold mb-2">Featured Clinics</h3>
        <ul className="text-sm space-y-2">
          {clinics.slice(0,5).map((c,i)=> (
            <li key={i} className="flex justify-between">
              <span>{c.name || 'Clinic'} • {(c.location||c.address)||'-'}</span>
              <span className="text-gray-500">{c.rating || 0}★</span>
            </li>
          ))}
          {clinics.length===0 && <li className="text-gray-500">No clinics available.</li>}
        </ul>
      </div>
      <div className="bg-white border rounded p-4">
        <h3 className="font-semibold mb-2">Recent Appointments</h3>
        <ul className="text-sm space-y-2">
          {appointments.slice(0,5).map((a,i)=> (
            <li key={i} className="flex justify-between">
              <span>{a.petName || 'Pet'} @ {(a.clinic?.name)||a.clinicName||'-'}</span>
              <span className="text-gray-500">{a.date || '-'} {a.time || ''}</span>
            </li>
          ))}
          {appointments.length===0 && <li className="text-gray-500">No appointments found.</li>}
        </ul>
      </div>
    </div>
  )

  const Clinics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {clinics.map((c, i) => (
        <div key={i} className="bg-white border rounded p-4">
          <div className="font-semibold">{c.name || 'Clinic'}</div>
          <div className="text-sm text-gray-600">{(c.location||c.address)||'-'}</div>
          <div className="text-sm mt-1">⭐ {c.rating || 0} ({c.reviews || 0})</div>
          <div className="text-xs text-gray-500 mt-2">{(c.specialties||[]).join(', ')}</div>
        </div>
      ))}
      {clinics.length===0 && <div className="text-gray-500">No clinics available.</div>}
    </div>
  )

  const MyAppointments = () => (
    <div className="bg-white border rounded">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 px-3">Pet</th>
            <th className="py-2 px-3">Clinic</th>
            <th className="py-2 px-3">Date</th>
            <th className="py-2 px-3">Type</th>
            <th className="py-2 px-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((a,i)=> (
            <tr key={i} className="border-b">
              <td className="py-2 px-3">{a.petName || 'Pet'}</td>
              <td className="py-2 px-3">{(a.clinic?.name)||a.clinicName||'-'}</td>
              <td className="py-2 px-3">{a.date || '-'} {a.time || ''}</td>
              <td className="py-2 px-3">{a.type || 'Checkup'}</td>
              <td className="py-2 px-3">{a.status || 'Scheduled'}</td>
            </tr>
          ))}
          {appointments.length===0 && (
            <tr><td className="py-3 px-3 text-gray-500" colSpan={5}>No appointments found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )

  const Book = () => (
    <div className="bg-white border rounded p-4 text-sm text-gray-600">Booking flow will be added here (select pet → choose clinic → choose slot).</div>
  )

  return (
    <ModuleDashboardLayout
      title="Veterinary"
      description="Find clinics and manage appointments"
      actions={actions}
      stats={stats}
      tabs={tabs}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === 'overview' && <Overview />}
      {tab === 'clinics' && <Clinics />}
      {tab === 'appointments' && <MyAppointments />}
      {tab === 'book' && <Book />}
    </ModuleDashboardLayout>
  )
}
