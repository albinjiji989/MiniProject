import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ModuleDashboardLayout from '../../../components/Module/ModuleDashboardLayout'
import { veterinaryAPI } from '../../../services/api'

export default function VeterinaryPetDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [appointments, setAppointments] = useState([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [selectedPet, setSelectedPet] = useState(null)

  // Get the selected pet from location state
  useEffect(() => {
    if (location.state && location.state.selectedPet) {
      setSelectedPet(location.state.selectedPet);
    } else {
      // If no pet selected, redirect to pet selection
      navigate('/user/veterinary');
    }
  }, [location, navigate]);

  // Load data for the selected pet
  useEffect(() => {
    if (selectedPet) {
      loadPetData();
    }
  }, [selectedPet]);

  const loadPetData = async () => {
    setLoading(true)
    try {
      // Load appointments for the selected pet
      const apptRes = await veterinaryAPI.getAppointments({ petId: selectedPet._id }).catch(() => ({ data: { data: { appointments: [] } } }))
      
      const rawAppts = apptRes.data?.data?.appointments || apptRes.data?.appointments || []
      setAppointments(rawAppts)
    } finally {
      setLoading(false)
    }
  }

  const handlePetSwitch = () => {
    // Navigate back to pet selection
    navigate('/user/veterinary');
  };

  const actions = [
    { label: 'Book Appointment', onClick: () => navigate('/user/veterinary/book', { state: { selectedPet } }), color: 'bg-emerald-600' },
    { label: 'My Appointments', onClick: () => setTab('appointments'), color: 'bg-blue-600' },
    { label: 'Medical Records', onClick: () => setTab('records'), color: 'bg-purple-600' },
    { label: 'Vaccinations', onClick: () => setTab('vaccinations'), color: 'bg-green-600' },
    { label: 'Switch Pet', onClick: handlePetSwitch, color: 'bg-gray-600' },
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

  // Function to get the primary image URL or first image URL
  const getPetImageUrl = (pet) => {
    if (!pet || !pet.images || pet.images.length === 0) {
      return '/placeholder-pet.svg';
    }
    
    // Find primary image first
    const primaryImage = pet.images.find(img => img.isPrimary);
    if (primaryImage && primaryImage.url) {
      // Handle relative URLs
      if (primaryImage.url.startsWith('http') || primaryImage.url.startsWith('/')) {
        return primaryImage.url;
      }
      // For relative paths, prepend the API origin
      const apiOrigin = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      return `${apiOrigin}${primaryImage.url.startsWith('/') ? '' : '/'}${primaryImage.url}`;
    }
    
    // Fallback to first image
    const firstImage = pet.images[0];
    if (firstImage && firstImage.url) {
      // Handle relative URLs
      if (firstImage.url.startsWith('http') || firstImage.url.startsWith('/')) {
        return firstImage.url;
      }
      // For relative paths, prepend the API origin
      const apiOrigin = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      return `${apiOrigin}${firstImage.url.startsWith('/') ? '' : '/'}${firstImage.url}`;
    }
    
    return '/placeholder-pet.svg';
  };

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
      {/* Pet Info Card */}
      {selectedPet && (
        <div className="bg-white border rounded p-4">
          <h3 className="font-semibold mb-2">Selected Pet</h3>
          <div className="flex items-center mb-3">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
              {/* Display pet image or default icon */}
              {selectedPet.images && selectedPet.images.length > 0 ? (
                <img 
                  src={getPetImageUrl(selectedPet)} 
                  alt={selectedPet.name}
                  className="h-12 w-12 rounded-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-pet.svg';
                  }}
                />
              ) : (
                <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <div className="font-medium">{selectedPet.name}</div>
              <div className="text-sm text-gray-600">{selectedPet.breed} • {selectedPet.species}</div>
            </div>
          </div>
          <div className="text-sm">
            <div>Age: {selectedPet.ageDisplay || `${selectedPet.age} ${selectedPet.ageUnit || 'years'}`}</div>
            <div>Gender: {selectedPet.gender}</div>
          </div>
          <button 
            onClick={handlePetSwitch}
            className="mt-3 text-xs px-3 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
          >
            Switch Pet
          </button>
        </div>
      )}
      
      <div className="bg-white border rounded p-4">
        <h3 className="font-semibold mb-2">Recent Appointments for {selectedPet?.name}</h3>
        <ul className="text-sm space-y-2">
          {appointments.slice(0,5).map((a,i)=> (
            <li key={i} className="flex justify-between items-center">
              <div>
                <div className="font-medium">{a.petName || selectedPet?.name || 'Pet'}</div>
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
      <div className="px-4 py-3 border-b">
        <h3 className="font-medium">Appointments for {selectedPet?.name}</h3>
      </div>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 px-3">Pet</th>
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
              <td className="py-2 px-3">{a.petName || selectedPet?.name || 'Pet'}</td>
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
            <tr><td className="py-3 px-3 text-gray-500" colSpan={6}>No appointments found for {selectedPet?.name}.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )

  const MedicalRecords = () => (
    <div className="bg-white border rounded p-4 text-center">
      <div className="text-gray-500">
        <div className="text-4xl mb-2">📋</div>
        <h3 className="font-medium text-lg mb-1">Medical Records for {selectedPet?.name}</h3>
        <p className="mb-4">View your pet's medical history and records</p>
        <button 
          onClick={() => navigate('/user/veterinary/records', { state: { selectedPet } })}
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
        <h3 className="font-medium text-lg mb-1">Vaccination Records for {selectedPet?.name}</h3>
        <p className="mb-4">Track your pet's vaccination history and upcoming appointments</p>
        <button 
          onClick={() => navigate('/user/veterinary/vaccinations', { state: { selectedPet } })}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          View Vaccinations
        </button>
      </div>
    </div>
  )

  const Book = () => (
    <div className="bg-white border rounded p-6">
      <h3 className="font-semibold text-lg mb-4">Book a Veterinary Appointment for {selectedPet?.name}</h3>
      
      <div className="text-center">
        <button 
          onClick={() => navigate('/user/veterinary/book', { state: { selectedPet } })}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          Book Appointment
        </button>
      </div>
    </div>
  )

  if (!selectedPet) {
    return (
      <div className="flex justify-center items-center h-64">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <ModuleDashboardLayout
      title={`Veterinary - ${selectedPet.name}`}
      description={`Veterinary services for ${selectedPet.name} (${selectedPet.breed}, ${selectedPet.species})`}
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