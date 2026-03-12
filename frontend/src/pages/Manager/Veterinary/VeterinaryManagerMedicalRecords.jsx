import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ManagerModuleLayout from '../../../components/Manager/ManagerModuleLayout';
import { veterinaryAPI } from '../../../services/api';

export default function VeterinaryManagerMedicalRecords() {
  const navigate = useNavigate();
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [visitTypeFilter, setVisitTypeFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  useEffect(() => {
    loadMedicalRecords();
  }, []);

  const loadMedicalRecords = async () => {
    setLoading(true);
    try {
      const response = await veterinaryAPI.managerGetMedicalRecords();
      setMedicalRecords(response.data?.data?.records || []);
    } catch (error) {
      console.error('Failed to load medical records:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = medicalRecords.filter(record => {
    const matchesSearch = 
      (record.pet?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.owner?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.diagnosis || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVisitType = visitTypeFilter === 'all' || record.visitType === visitTypeFilter;
    const matchesPayment = paymentFilter === 'all' || record.paymentStatus === paymentFilter;
    
    let matchesDate = true;
    if (dateFilter) {
      const recordDate = new Date(record.visitDate).toISOString().split('T')[0];
      matchesDate = recordDate === dateFilter;
    }
    
    return matchesSearch && matchesVisitType && matchesPayment && matchesDate;
  });

  const getVisitTypeBadge = (visitType) => {
    const types = {
      routine_checkup: { label: 'Routine Checkup', color: 'bg-blue-100 text-blue-800', icon: '🩺' },
      vaccination: { label: 'Vaccination', color: 'bg-green-100 text-green-800', icon: '💉' },
      surgery: { label: 'Surgery', color: 'bg-red-100 text-red-800', icon: '🏥' },
      emergency: { label: 'Emergency', color: 'bg-red-100 text-red-800', icon: '🚨' },
      follow_up: { label: 'Follow-up', color: 'bg-purple-100 text-purple-800', icon: '📋' },
      consultation: { label: 'Consultation', color: 'bg-indigo-100 text-indigo-800', icon: '👨‍⚕️' },
      examination: { label: 'Examination', color: 'bg-cyan-100 text-cyan-800', icon: '🔍' },
      dental: { label: 'Dental', color: 'bg-teal-100 text-teal-800', icon: '🦷' },
      grooming: { label: 'Grooming', color: 'bg-pink-100 text-pink-800', icon: '✂️' },
      diagnostic: { label: 'Diagnostic', color: 'bg-yellow-100 text-yellow-800', icon: '🔬' },
      other: { label: 'Other', color: 'bg-gray-100 text-gray-800', icon: '📝' }
    };
    const type = types[visitType] || types.other;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${type.color}`}>
        <span className="mr-1">{type.icon}</span>
        {type.label}
      </span>
    );
  };

  const getPaymentBadge = (status) => {
    const statuses = {
      paid: { label: 'Paid', color: 'bg-green-100 text-green-800', icon: '✓' },
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      partially_paid: { label: 'Partial', color: 'bg-blue-100 text-blue-800', icon: '◐' },
      failed: { label: 'Failed', color: 'bg-red-100 text-red-800', icon: '✗' },
      refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800', icon: '↩' }
    };
    const paymentStatus = statuses[status] || statuses.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatus.color}`}>
        <span className="mr-1">{paymentStatus.icon}</span>
        {paymentStatus.label}
      </span>
    );
  };

  // Statistics
  const totalRecords = medicalRecords.length;
  const paidRecords = medicalRecords.filter(r => r.paymentStatus === 'paid').length;
  const pendingPayments = medicalRecords.filter(r => r.paymentStatus === 'pending').length;
  const emergencyRecords = medicalRecords.filter(r => r.visitType === 'emergency').length;
  const totalRevenue = medicalRecords
    .filter(r => r.paymentStatus === 'paid')
    .reduce((sum, record) => sum + (record.totalCost || 0), 0);
  const pendingRevenue = medicalRecords
    .filter(r => r.paymentStatus === 'pending')
    .reduce((sum, record) => sum + (record.totalCost || 0), 0);

  return (
    <ManagerModuleLayout
      title="Medical Records"
      subtitle="Comprehensive veterinary medical records management"
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Records</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{totalRecords}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Paid Records</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{paidRecords}</dd>
                  <dd className="text-sm text-green-600 font-medium">${totalRevenue.toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-yellow-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Payment</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{pendingPayments}</dd>
                  <dd className="text-sm text-yellow-600 font-medium">${pendingRevenue.toFixed(2)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-red-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Emergency Cases</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{emergencyRecords}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Pet, owner, diagnosis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
            <input
              type="date"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label>
            <select
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={visitTypeFilter}
              onChange={(e) => setVisitTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="routine_checkup">Routine Checkup</option>
              <option value="vaccination">Vaccination</option>
              <option value="consultation">Consultation</option>
              <option value="examination">Examination</option>
              <option value="emergency">Emergency</option>
              <option value="surgery">Surgery</option>
              <option value="dental">Dental</option>
              <option value="follow_up">Follow-up</option>
              <option value="diagnostic">Diagnostic</option>
              <option value="grooming">Grooming</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
            <select
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
        
        {(searchTerm || dateFilter || visitTypeFilter !== 'all' || paymentFilter !== 'all') && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {filteredRecords.length} of {totalRecords} records
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setDateFilter('');
                setVisitTypeFilter('all');
                setPaymentFilter('all');
              }}
              className="text-sm text-indigo-600 hover:text-indigo-900"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Medical Records Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient Info
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visit Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Diagnosis
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Treatment
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Loading medical records...</p>
                  </td>
                </tr>
              ) : filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">{record.pet?.name?.charAt(0) || 'P'}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{record.pet?.name || 'Unknown Pet'}</div>
                          <div className="text-xs text-gray-500">{record.pet?.species || 'N/A'} • {record.pet?.breed || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.owner?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{record.owner?.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {record.visitDate ? new Date(record.visitDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        }) : 'N/A'}
                      </div>
                      <div className="mt-1">
                        {getVisitTypeBadge(record.visitType)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={record.diagnosis}>
                        {record.diagnosis || 'Not specified'}
                      </div>
                      {record.medications && record.medications.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          💊 {record.medications.length} medication(s)
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 max-w-xs truncate" title={record.treatment}>
                        {record.treatment || 'Not specified'}
                      </div>
                      {record.followUpRequired && (
                        <div className="text-xs text-yellow-600 mt-1 flex items-center">
                          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          Follow-up needed
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ${record.totalCost ? record.totalCost.toFixed(2) : '0.00'}
                      </div>
                      {record.amountPaid > 0 && record.amountPaid < record.totalCost && (
                        <div className="text-xs text-gray-500">
                          Paid: ${record.amountPaid.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentBadge(record.paymentStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/manager/veterinary/records/${record._id}`)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No medical records found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm || dateFilter || visitTypeFilter !== 'all' || paymentFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Medical records will appear here once consultations are completed'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ManagerModuleLayout>
  );
}
