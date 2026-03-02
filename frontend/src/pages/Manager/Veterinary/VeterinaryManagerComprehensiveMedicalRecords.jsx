import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { veterinaryAPI, petsAPI } from '../../../services/api';
import ManagerLayout from '../../../components/Layout/ManagerLayout';

export default function VeterinaryManagerComprehensiveMedicalRecords() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [pets, setPets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'all');
  const [viewMode, setViewMode] = useState('table'); // table, cards, timeline

  useEffect(() => {
    loadPets();
  }, []);

  useEffect(() => {
    loadMedicalRecords();
  }, [selectedPet, filterStatus]);

  const loadPets = async () => {
    try {
      const response = await petsAPI.getPets({ limit: 1000 });
      setPets(response.data.data.pets || []);
    } catch (error) {
      console.error('Failed to load pets:', error);
    }
  };

  const loadMedicalRecords = async () => {
    setLoading(true);
    try {
      if (selectedPet) {
        const response = await veterinaryAPI.managerGetMedicalRecordsByPet(selectedPet._id);
        setMedicalRecords(response.data.data.medicalRecords || []);
      } else {
        const response = await veterinaryAPI.managerGetMedicalRecords();
        let records = response.data.data.medicalRecords || [];
        
        // Apply filters
        if (filterStatus !== 'all') {
          records = records.filter(r => r.paymentStatus === filterStatus);
        }
        
        setMedicalRecords(records);
      }
    } catch (error) {
      console.error('Failed to load medical records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecord = (recordId) => {
    navigate(`/manager/veterinary/medical-records/${recordId}`);
  };

  const handlePetSelect = (pet) => {
    setSelectedPet(pet);
  };

  const clearPetFilter = () => {
    setSelectedPet(null);
  };

  const filteredRecords = medicalRecords.filter(record => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      record.pet?.name?.toLowerCase().includes(search) ||
      record.owner?.name?.toLowerCase().includes(search) ||
      record.diagnosis?.toLowerCase().includes(search) ||
      record.treatment?.toLowerCase().includes(search)
    );
  });

  const TableView = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Owner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Visit Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Diagnosis
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Treatment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Medications
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading medical records...
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                  No medical records found
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {record.pet?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.pet?.species || 'Unknown'} • {record.pet?.breed || 'Unknown'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{record.owner?.name || 'Unknown'}</div>
                    <div className="text-sm text-gray-500">{record.owner?.email || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(record.visitDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {record.diagnosis || 'Not specified'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {record.treatment || 'Not specified'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.medications?.length || 0} med{record.medications?.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${record.totalCost || 0}
                    {record.balanceDue > 0 && (
                      <div className="text-xs text-red-600">
                        Due: ${record.balanceDue}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      record.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                      record.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      record.paymentStatus === 'partially_paid' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {record.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewRecord(record._id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const TimelineView = () => (
    <div className="space-y-6">
      {filteredRecords.map((record, index) => (
        <div key={record._id} className="relative">
          {/* Timeline line */}
          {index !== filteredRecords.length - 1 && (
            <div className="absolute top-10 left-8 w-0.5 h-full bg-gray-200" />
          )}
          
          <div className="flex gap-4">
            {/* Timeline dot */}
            <div className="relative z-10 flex-shrink-0">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center border-4 border-white shadow">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            
            {/* Content card */}
            <div className="flex-1 bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {record.pet?.name} - {record.diagnosis}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(record.visitDate).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  record.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                  record.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {record.paymentStatus}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Treatment</p>
                  <p className="text-sm text-gray-900 mt-1">{record.treatment || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Medications</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {record.medications?.length > 0 
                      ? record.medications.map(m => m.name).join(', ')
                      : 'None'}
                  </p>
                </div>
                {record.vaccinations?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Vaccinations</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {record.vaccinations.map(v => v.name).join(', ')}
                    </p>
                  </div>
                )}
                {record.tests?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tests</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {record.tests.map(t => t.testName).join(', ')}
                    </p>
                  </div>
                )}
              </div>
              
              {record.notes && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="text-sm text-gray-700 mt-1">{record.notes}</p>
                </div>
              )}
              
              {record.followUpRequired && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                  <div className="flex">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Follow-up required on {record.followUpDate ? new Date(record.followUpDate).toLocaleDateString() : 'TBD'}
                      </p>
                      {record.followUpNotes && (
                        <p className="text-sm text-yellow-600 mt-1">{record.followUpNotes}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm">
                  <span className="text-gray-500">Cost: </span>
                  <span className="font-semibold text-gray-900">${record.totalCost || 0}</span>
                  {record.balanceDue > 0 && (
                    <span className="ml-2 text-red-600 font-semibold">
                      (Due: ${record.balanceDue})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleViewRecord(record._id)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  View Full Record
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {filteredRecords.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No records</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new medical record.</p>
        </div>
      )}
    </div>
  );

  return (
    <ManagerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Medical Records Management
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Comprehensive medical history tracking for all patients
              </p>
            </div>
            <button
              onClick={() => navigate('/manager/veterinary/medical-records/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Medical Record
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Records
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by pet name, owner, diagnosis..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Payment Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* View Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View Mode
              </label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="table">Table View</option>
                <option value="timeline">Timeline View</option>
              </select>
            </div>
          </div>

          {/* Pet Filter */}
          {selectedPet ? (
            <div className="mt-4 flex items-center justify-between bg-blue-50 p-4 rounded-md">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-sm font-medium text-blue-900">
                  Filtered by: {selectedPet.name} ({selectedPet.species})
                </span>
              </div>
              <button
                onClick={clearPetFilter}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear Filter
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Pet
              </label>
              <select
                onChange={(e) => {
                  const pet = pets.find(p => p._id === e.target.value);
                  handlePetSelect(pet);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a pet...</option>
                {pets.map(pet => (
                  <option key={pet._id} value={pet._id}>
                    {pet.name} - {pet.species} ({pet.breed})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Records</p>
                <p className="text-2xl font-semibold text-gray-900">{medicalRecords.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Pending Payment</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {medicalRecords.filter(r => r.paymentStatus === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Follow-ups Needed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {medicalRecords.filter(r => r.followUpRequired).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${medicalRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Records Display */}
        {viewMode === 'table' ? <TableView /> : <TimelineView />}
      </div>
    </ManagerLayout>
  );
}
