import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function VeterinaryDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to pet selection page
    navigate('/user/veterinary');
  }, [navigate]);

  // This component now just redirects to the pet selection page
  return null;

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        // Use the user appointments endpoint
        const apptRes = await veterinaryAPI.getAppointments().catch(() => ({ data: { data: { appointments: [] } } }))
        
        const rawAppts = apptRes.data?.data?.appointments || apptRes.data?.appointments || []
        setAppointments(rawAppts)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const actions = [
    { label: 'Book Appointment', onClick: () => navigate('/user/veterinary/book'), color: 'bg-emerald-600' },
    { label: 'Vaccinations', onClick: () => setTab('vaccinations'), color: 'bg-green-600' },
    { label: 'My Appointments', onClick: () => setTab('appointments'), color: 'bg-blue-600' },
    { label: 'Medical Records', onClick: () => setTab('records'), color: 'bg-purple-600' },
  ]

  const stats = [
    { label: 'Appointments', value: appointments.length, icon: '📅' },
    { label: 'Scheduled', value: appointments.filter(a => (a.status||'').toLowerCase()==='scheduled').length, icon: '⏱️' },
    { label: 'Emergency', value: appointments.filter(a => (a.bookingType||'').toLowerCase()==='emergency').length, icon: '🚨' },
  ]

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'appointments', label: 'My Appointments' },
    { key: 'records', label: 'Medical Records' },
    { key: 'vaccinations', label: 'Vaccinations' },
    { key: 'book', label: 'Book' },
  ]

  

  const getBookingTypeBadge = (bookingType) => {
    switch (bookingType?.toLowerCase()) {
      case 'emergency':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Emergency</span>;
      case 'walkin':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Walk-in</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Scheduled</span>;
    }
  };

  const Overview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white border rounded p-4">
        <h3 className="font-semibold mb-2">Recent Appointments</h3>
        <ul className="text-sm space-y-2">
          {appointments.slice(0,5).map((a,i)=> (
            <li key={i} className="flex justify-between items-center">
              <div>
                <div className="font-medium">{a.petName || 'Pet'}</div>
                <div className="text-xs text-gray-500">{a.date || '-'} {a.time || ''}</div>
              </div>
              <div className="flex space-x-1">
                {getBookingTypeBadge(a.bookingType)}
              </div>
            </li>
          ))}
          {appointments.length===0 && <li className="text-gray-500">No appointments found.</li>}
        </ul>
      </div>
    </div>
  )

  const MyAppointments = () => (
    <div className="bg-white border rounded">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 px-3">Pet</th>
            <th className="py-2 px-3">Clinic</th>
            <th className="py-2 px-3">Date & Time</th>
            <th className="py-2 px-3">Type</th>
            <th className="py-2 px-3">Booking Type</th>
            <th className="py-2 px-3">Status</th>
            <th className="py-2 px-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((a,i)=> (
            <tr key={i} className="border-b">
              <td className="py-2 px-3">{a.petName || 'Pet'}</td>
              <td className="py-2 px-3">{(a.clinic?.name)||a.clinicName||'-'}</td>
              <td className="py-2 px-3">
                <div>{a.date || '-'}</div>
                <div className="text-xs text-gray-500">{a.time || ''}</div>
              </td>
              <td className="py-2 px-3">
                <div className="text-xs">{getBookingTypeBadge(a.bookingType)}</div>
              </td>
              
              <td className="py-2 px-3">
                <span className={`px-2 py-1 rounded text-xs ${
                  a.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  a.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  a.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                  a.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {a.status || 'Scheduled'}
                </span>
              </td>
              <td className="py-2 px-3">
                <button 
                  onClick={() => navigate(`/user/veterinary/appointments/${a._id}`)}
                  className="text-blue-600 hover:text-blue-900 text-sm"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
          {appointments.length===0 && (
            <tr><td className="py-3 px-3 text-gray-500" colSpan={7}>No appointments found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )

  const MedicalRecords = () => (
    <div className="bg-white border rounded p-4 text-center">
      <div className="text-gray-500">
        <div className="text-4xl mb-2">📋</div>
        <h3 className="font-medium text-lg mb-1">Medical Records</h3>
        <p className="mb-4">View your pets' medical history and records</p>
        <button 
          onClick={() => navigate('/user/veterinary/records')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          View Medical Records
        </button>
      </div>
    </div>
  )

  const Vaccinations = () => (
    <div className="bg-white border rounded p-4 text-center">
      <div className="text-gray-500">
        <div className="text-4xl mb-2">💉</div>
        <h3 className="font-medium text-lg mb-1">Vaccination Records</h3>
        <p className="mb-4">Track your pets' vaccination history and upcoming appointments</p>
        <button 
          onClick={() => navigate('/user/veterinary/vaccinations')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          View Vaccinations
        </button>
      </div>
    </div>
  )

  const Book = () => (
    <div className="bg-white border rounded p-6">
      <h3 className="font-semibold text-lg mb-4">Book a Veterinary Appointment</h3>
      
      
      
      <div className="text-center">
        <button 
          onClick={() => navigate('/user/veterinary/book')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          Book Appointment
        </button>
      </div>
    </div>
  )

  return (
    <ModuleDashboardLayout
      title="Veterinary"
      description="Manage your veterinary appointments"
      actions={actions}
      stats={stats}
      tabs={tabs}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === 'overview' && <Overview />}
      {tab === 'appointments' && <MyAppointments />}
      {tab === 'records' && <MedicalRecords />}
      {tab === 'vaccinations' && <Vaccinations />}
      {tab === 'book' && <Book />}
    </ModuleDashboardLayout>
  )
}