import React, { useState, useEffect } from 'react';
import { veterinaryAPI } from '../../../services/api';
import { 
  Calendar, Search, Filter, FileText, Activity, 
  TrendingUp, Clock, DollarSign, AlertCircle, User,
  Download, Eye, Edit, CheckCircle, XCircle, Heart
} from 'lucide-react';

export default function ComprehensiveMedicalRecords() {
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentStatus: '',
    followUpRequired: '',
    diagnosis: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });

  useEffect(() => {
    loadDashboardStats();
    loadMedicalRecords();
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm || Object.values(filters).some(v => v)) {
        loadMedicalRecords();
      }
    }, 500);
    return () => clearTimeout(delaySearch);
  }, [searchTerm, filters, pagination.page]);

  const loadDashboardStats = async () => {
    try {
      const response = await veterinaryAPI.managerGetMedicalHistoryDashboard();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  };

  const loadMedicalRecords = async () => {
    setLoading(true);
    try {
      const params = {
        search: searchTerm,
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      const response = await veterinaryAPI.managerSearchMedicalRecords(params);
      setRecords(response.data.data.records || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.data.pagination.total
      }));
    } catch (error) {
      console.error('Failed to load medical records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const viewRecordDetails = async (recordId) => {
    try {
      const response = await veterinaryAPI.managerGetDetailedMedicalRecord(recordId);
      setSelectedRecord(response.data.data.record);
    } catch (error) {
      console.error('Failed to load record details:', error);
    }
  };

  const exportRecords = async () => {
    try {
      const response = await veterinaryAPI.managerExportMedicalRecords({
        ...filters,
        startDate: filters.startDate,
        endDate: filters.endDate
      });
      // In production, this would trigger a download
      console.log('Export data:', response.data);
      alert('Export functionality will download a CSV/PDF file');
    } catch (error) {
      console.error('Failed to export records:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Paid' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
      partially_paid: { color: 'bg-blue-100 text-blue-800', icon: AlertCircle, text: 'Partial' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Failed' }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Medical Records</h1>
            <p className="text-gray-600 mt-1">Comprehensive patient medical history tracking</p>
          </div>
          <button
            onClick={exportRecords}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Records
          </button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Records</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.overview?.totalRecords || 0}
                  </p>
                  <p className="text-green-600 text-xs mt-1">
                    {stats.overview?.recordsThisMonth || 0} this month
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active Patients</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.overview?.activePatients || 0}
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    {stats.overview?.recordsToday || 0} seen today
                  </p>
                </div>
                <div className="bg-teal-100 p-3 rounded-lg">
                  <Heart className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Follow-ups Required</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.overview?.followUpsRequired || 0}
                  </p>
                  <p className="text-orange-600 text-xs mt-1">Needs attention</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">This Week</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.overview?.recordsThisWeek || 0}
                  </p>
                  <p className="text-purple-600 text-xs mt-1">Consultations</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search diagnosis, treatment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date Range */}
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Start Date"
            />

            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="End Date"
            />

            {/* Payment Status */}
            <select
              value={filters.paymentStatus}
              onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Payment Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Additional Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <input
              type="text"
              placeholder="Filter by diagnosis..."
              value={filters.diagnosis}
              onChange={(e) => setFilters({ ...filters, diagnosis: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={filters.followUpRequired}
              onChange={(e) => setFilters({ ...filters, followUpRequired: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Records</option>
              <option value="true">Follow-up Required</option>
              <option value="false">No Follow-up Needed</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setFilters({
                  startDate: '',
                  endDate: '',
                  paymentStatus: '',
                  followUpRequired: '',
                  diagnosis: ''
                });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Medical Records Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pet
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diagnosis
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Treatment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Loading records...</span>
                      </div>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      No medical records found
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(record.visitDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {record.pet?.images?.[0]?.url ? (
                            <img
                              src={record.pet.images[0].url}
                              alt={record.pet.name}
                              className="w-8 h-8 rounded-full object-cover mr-2"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                              <Heart className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {record.pet?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {record.pet?.species} • {record.pet?.breed}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{record.owner?.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{record.owner?.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {record.diagnosis || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {record.treatment || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(record.totalCost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentStatusBadge(record.paymentStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => viewRecordDetails(record._id)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title= "View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page * pagination.limit >= pagination.total}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Record Details Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Medical Record Details</h2>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Patient Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Patient Information</h3>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm text-gray-600">Pet Name</dt>
                        <dd className="text-sm font-medium">{selectedRecord.pet?.name}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-600">Species & Breed</dt>
                        <dd className="text-sm font-medium">
                          {selectedRecord.pet?.species} • {selectedRecord.pet?.breed}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-600">Age & Gender</dt>
                        <dd className="text-sm font-medium">
                          {selectedRecord.pet?.age} • {selectedRecord.pet?.gender}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Visit Information</h3>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm text-gray-600">Visit Date</dt>
                        <dd className="text-sm font-medium">{formatDate(selectedRecord.visitDate)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-600">Veterinarian</dt>
                        <dd className="text-sm font-medium">{selectedRecord.staff?.name || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-600">Payment Status</dt>
                        <dd className="text-sm">{getPaymentStatusBadge(selectedRecord.paymentStatus)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Diagnosis & Treatment */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Diagnosis & Treatment</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Diagnosis</p>
                      <p className="text-sm text-gray-900 mt-1">{selectedRecord.diagnosis}</p>
                    </div>
                    {selectedRecord.treatment && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Treatment</p>
                        <p className="text-sm text-gray-900 mt-1">{selectedRecord.treatment}</p>
                      </div>
                    )}
                    {selectedRecord.notes && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Notes</p>
                        <p className="text-sm text-gray-900 mt-1">{selectedRecord.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Medications */}
                {selectedRecord.medications && selectedRecord.medications.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Medications</h3>
                    <div className="space-y-2">
                      {selectedRecord.medications.map((med, idx) => (
                        <div key={idx} className="bg-blue-50 rounded-lg p-3">
                          <p className="font-medium text-sm">{med.name}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {med.dosage} • {med.frequency} {med.duration && `• ${med.duration}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Follow-up */}
                {selectedRecord.followUpRequired && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2 flex items-center text-orange-900">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Follow-up Required
                    </h3>
                    {selectedRecord.followUpDate && (
                      <p className="text-sm text-orange-800">
                        Scheduled: {formatDate(selectedRecord.followUpDate)}
                      </p>
                    )}
                    {selectedRecord.followUpNotes && (
                      <p className="text-sm text-orange-700 mt-1">
                        {selectedRecord.followUpNotes}
                      </p>
                    )}
                  </div>
                )}

                {/* Billing */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Billing Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Total Cost</span>
                      <span className="text-sm font-medium">{formatCurrency(selectedRecord.totalCost)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Amount Paid</span>
                      <span className="text-sm font-medium">{formatCurrency(selectedRecord.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-semibold text-gray-900">Balance Due</span>
                      <span className="text-sm font-bold text-red-600">
                        {formatCurrency(Math.max(0, (selectedRecord.totalCost || 0) - (selectedRecord.amountPaid || 0)))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
