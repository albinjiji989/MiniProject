import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { veterinaryAPI, userPetsAPI, adoptionAPI, petShopAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import UserLayout from '../../../components/Layout/UserLayout';

export default function ComprehensiveUserVeterinaryDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    totalMedicalRecords: 0
  });

  useEffect(() => {
    loadAllPets();
  }, []);

  useEffect(() => {
    if (selectedPet) {
      loadPetData();
    }
  }, [selectedPet]);

  const loadAllPets = async () => {
    setLoading(true);
    try {
      const [ownedRes, adoptedRes, purchasedRes] = await Promise.allSettled([
        userPetsAPI.list({}),
        adoptionAPI.getMyAdoptedPets(),
        petShopAPI.getMyPurchasedPets()
      ]);

      let allPets = [];
      
      if (ownedRes.status === 'fulfilled') {
        const userPets = Array.isArray(ownedRes.value.data?.data) 
          ? ownedRes.value.data.data 
          : (ownedRes.value.data?.data?.pets || []);
        userPets.forEach(pet => {
          allPets.push({ ...pet, source: 'owned', sourceBadge: 'bg-purple-100 text-purple-800' });
        });
      }

      if (adoptedRes.status === 'fulfilled') {
        const adoptedPets = Array.isArray(adoptedRes.value.data?.data) 
          ? adoptedRes.value.data.data 
          : (adoptedRes.value.data?.data?.pets || []);
        adoptedPets.forEach(pet => {
          allPets.push({ ...pet, source: 'adopted', sourceBadge: 'bg-green-100 text-green-800' });
        });
      }

      if (purchasedRes.status === 'fulfilled') {
        const purchasedPets = Array.isArray(purchasedRes.value.data?.data) 
          ? purchasedRes.value.data.data 
          : (purchasedRes.value.data?.data?.pets || []);
        purchasedPets.forEach(pet => {
          allPets.push({ ...pet, source: 'purchased', sourceBadge: 'bg-blue-100 text-blue-800' });
        });
      }

      setPets(allPets);
      if (allPets.length > 0 && !selectedPet) {
        setSelectedPet(allPets[0]);
      }
    } catch (error) {
      console.error('Failed to load pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPetData = async () => {
    if (!selectedPet) return;
    
    setLoading(true);
    try {
      // Load appointments for the selected pet
      const apptResponse = await veterinaryAPI.getAppointments({ petId: selectedPet._id });
      const petAppointments = apptResponse.data?.data?.appointments || [];
      setAppointments(petAppointments);

      // Load medical records for the selected pet  
      try {
        const recordsResponse = await veterinaryAPI.getMedicalRecords({ petId: selectedPet._id });
        const petRecords = recordsResponse.data?.data?.medicalRecords || [];
        setMedicalRecords(petRecords);
      } catch (err) {
        console.log('Medical records not available:', err);
        setMedicalRecords([]);
      }

      // Calculate stats
      const upcoming = petAppointments.filter(a => 
        ['scheduled', 'confirmed'].includes(a.status) &&
        new Date(a.appointmentDate) >= new Date()
      ).length;
      const completed = petAppointments.filter(a => a.status === 'completed').length;

      setStats({
        totalAppointments: petAppointments.length,
        upcomingAppointments: upcoming,
        completedAppointments: completed,
        totalMedicalRecords: medicalRecords.length
      });
    } catch (error) {
      console.error('Failed to load pet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPetImage = (pet) => {
    if (pet.images && pet.images.length > 0) {
      const primaryImage = pet.images.find(img => img.isPrimary);
      if (primaryImage) return primaryImage.url;
      return pet.images[0].url;
    }
    return '/placeholder-pet.svg';
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return badges[status] || badges.scheduled;
  };

  return (
    <UserLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Veterinary Care Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage appointments and medical records for your pets
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/user/veterinary/book')}
            className="bg-blue-600 text-white rounded-lg p-4 hover:bg-blue-700 transition-colors flex items-center justify-center gap-3"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-semibold">Book New Appointment</span>
          </button>
          <button
            onClick={() => navigate('/user/veterinary/appointments')}
            className="bg-green-600 text-white rounded-lg p-4 hover:bg-green-700 transition-colors flex items-center justify-center gap-3"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-semibold">View All Appointments</span>
          </button>
          <button
            onClick={() => navigate('/user/pets')}
            className="bg-purple-600 text-white rounded-lg p-4 hover:bg-purple-700 transition-colors flex items-center justify-center gap-3"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="font-semibold">Manage Pets</span>
          </button>
        </div>

        {/* Pet Selector */}
        {pets.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Pet to View Details
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {pets.map(pet => (
                <div
                  key={pet._id}
                  onClick={() => setSelectedPet(pet)}
                  className={`cursor-pointer rounded-lg border-2 p-3 transition-all ${
                    selectedPet?._id === pet._id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={getPetImage(pet)}
                    alt={pet.name}
                    className="w-full h-24 object-cover rounded-md mb-2"
                    onError={(e) => { e.target.src = '/placeholder-pet.svg'; }}
                  />
                  <p className="text-sm font-semibold text-gray-900 truncate">{pet.name}</p>
                  <p className="text-xs text-gray-600">{pet.species}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedPet ? (
          <>
            {/* Selected Pet Info */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-start gap-6">
                <img
                  src={getPetImage(selectedPet)}
                  alt={selectedPet.name}
                  className="w-32 h-32 rounded-lg object-cover"
                  onError={(e) => { e.target.src = '/placeholder-pet.svg'; }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedPet.name}</h2>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${selectedPet.sourceBadge}`}>
                      {selectedPet.source === 'owned' ? 'My Pet' : 
                       selectedPet.source === 'adopted' ? 'Adopted' : 'Purchased'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Species</p>
                      <p className="font-medium text-gray-900">{selectedPet.species}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Breed</p>
                      <p className="font-medium text-gray-900">{selectedPet.breed || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Age</p>
                      <p className="font-medium text-gray-900">
                        {selectedPet.age ? `${selectedPet.age} ${selectedPet.ageUnit || 'years'}` : 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Sex</p>
                      <p className="font-medium text-gray-900">{selectedPet.sex || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Total Appointments</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalAppointments}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Upcoming</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.upcomingAppointments}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Completed</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.completedAppointments}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Medical Records</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalMedicalRecords}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                  {['overview', 'appointments', 'medical-records', 'vaccinations'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                    >
                      {tab.replace('-', ' ')}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Appointments</h3>
                      {appointments
                        .filter(a => ['scheduled', 'confirmed'].includes(a.status) && new Date(a.appointmentDate) >= new Date())
                        .slice(0, 3)
                        .length > 0 ? (
                        <div className="space-y-3">
                          {appointments
                            .filter(a => ['scheduled', 'confirmed'].includes(a.status) && new Date(a.appointmentDate) >= new Date())
                            .slice(0, 3)
                            .map(appointment => (
                            <div key={appointment._id} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold text-gray-900">{appointment.reason}</p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                    {appointment.timeSlot && ` at ${appointment.timeSlot}`}
                                  </p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(appointment.status)}`}>
                                  {appointment.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No upcoming appointments</p>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Medical Records</h3>
                      {medicalRecords.slice(0, 3).length > 0 ? (
                        <div className="space-y-3">
                          {medicalRecords.slice(0, 3).map(record => (
                            <div key={record._id} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold text-gray-900">{record.diagnosis}</p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {new Date(record.visitDate).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </p>
                                  {record.treatment && (
                                    <p className="text-sm text-gray-700 mt-2">{record.treatment}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No medical records available</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Appointments Tab */}
                {activeTab === 'appointments' && (
                  <div>
                    {appointments.length > 0 ? (
                      <div className="space-y-4">
                        {appointments.map(appointment => (
                          <div key={appointment._id} className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-900">{appointment.reason}</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {appointment.appointmentDate && new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                  {appointment.timeSlot && ` at ${appointment.timeSlot}`}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Type: {appointment.bookingType} • Visit: {appointment.visitType?.replace('_', ' ')}
                                </p>
                              </div>
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(appointment.status)}`}>
                                {appointment.status}
                              </span>
                            </div>
                            {appointment.symptoms && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-gray-700">Symptoms:</p>
                                <p className="text-sm text-gray-600 mt-1">{appointment.symptoms}</p>
                              </div>
                            )}
                            <div className="mt-4 flex gap-2">
                              <button
                                onClick={() => navigate(`/user/veterinary/appointments/${appointment._id}`)}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                View Details
                              </button>
                              {['scheduled', 'confirmed'].includes(appointment.status) && (
                                <button
                                  onClick={async () => {
                                    if (confirm('Are you sure you want to cancel this appointment?')) {
                                      try {
                                        await veterinaryAPI.cancelAppointment(appointment._id);
                                        loadPetData();
                                      } catch (error) {
                                        console.error('Failed to cancel:', error);
                                        alert('Failed to cancel appointment');
                                      }
                                    }
                                  }}
                                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by booking a new appointment.</p>
                        <div className="mt-6">
                          <button
                            onClick={() => navigate('/user/veterinary/book', { state: { selectedPet } })}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            Book Appointment
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Medical Records Tab */}
                {activeTab === 'medical-records' && (
                  <div>
                    {medicalRecords.length > 0 ? (
                      <div className="space-y-4">
                        {medicalRecords.map(record => (
                          <div key={record._id} className="bg-gray-50 rounded-lg p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900">{record.diagnosis}</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {new Date(record.visitDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                              {record.staff && (
                                <p className="text-sm text-gray-600">Dr. {record.staff.name}</p>
                              )}
                            </div>
                            {record.treatment && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-gray-700">Treatment:</p>
                                <p className="text-sm text-gray-600 mt-1">{record.treatment}</p>
                              </div>
                            )}
                            {record.medications && record.medications.length > 0 && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-gray-700">Medications:</p>
                                <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                                  {record.medications.map((med, idx) => (
                                    <li key={idx}>{med.name} - {med.dosage} ({med.frequency})</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {record.notes && (
                              <div>
                                <p className="text-sm font-medium text-gray-700">Notes:</p>
                                <p className="text-sm text-gray-600 mt-1">{record.notes}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No medical records</h3>
                        <p className="mt-1 text-sm text-gray-500">Medical records will appear here after veterinary visits.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Vaccinations Tab */}
                {activeTab === 'vaccinations' && (
                  <div>
                    {medicalRecords.some(r => r.vaccinations && r.vaccinations.length > 0) ? (
                      <div className="space-y-4">
                        {medicalRecords
                          .filter(r => r.vaccinations && r.vaccinations.length > 0)
                          .map(record => record.vaccinations.map((vac, idx) => (
                            <div key={`${record._id}-${idx}`} className="bg-gray-50 rounded-lg p-6">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900">{vac.name}</h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    Administered: {new Date(record.visitDate).toLocaleDateString()}
                                  </p>
                                  {vac.nextDueDate && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      Next Due: {new Date(vac.nextDueDate).toLocaleDateString()}
                                    </p>
                                  )}
                                  {vac.batchNumber && (
                                    <p className="text-xs text-gray-500 mt-2">Batch: {vac.batchNumber}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No vaccinations recorded</h3>
                        <p className="mt-1 text-sm text-gray-500">Vaccination records will appear here.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No pets found</h3>
            <p className="mt-2 text-sm text-gray-500">
              Add a pet to start managing veterinary appointments and medical records
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/user/pets')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Add a Pet
              </button>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
