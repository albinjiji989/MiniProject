import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { veterinaryAPI } from '../../../services/api';
import {
  Calendar, Heart, Syringe, Activity, FileText, ArrowLeft, Download,
  Clock, DollarSign, AlertCircle, CheckCircle, Pill, TestTube, User,
  MapPin, Phone, Mail, CreditCard, TrendingUp
} from 'lucide-react';

export default function UserPetMedicalHistoryDetail() {
  const { petId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    if (petId) {
      loadPetMedicalHistory();
    }
  }, [petId]);

  const loadPetMedicalHistory = async () => {
    setLoading(true);
    try {
      // Use the existing working endpoint for user medical records
      const response = await veterinaryAPI.userListMedicalRecordsForPet(petId);
      
      // Handle different possible response structures
      const responseData = response.data?.data || response.data;
      
      console.log('🏥 Medical History API Response:', responseData);
      
      // If the response is just an array of records, wrap it in an object
      if (Array.isArray(responseData)) {
        setData({
          pet: { name: 'Pet', petCode: petId },
          records: responseData,
          timeline: responseData,
          currentMedications: [],
          pendingFollowUps: [],
          upcomingAppointments: [],
          statistics: {
            totalVisits: responseData.length || 0,
            completedVaccinations: 0,
            pendingVaccinations: 0,
            lastVisit: responseData.length > 0 ? responseData[0].date : null,
            nextAppointment: null,
            totalExpenses: 0,
            outstandingBalance: 0
          }
        });
      } else {
        // Ensure statistics object exists
        const dataWithStats = {
          ...responseData,
          timeline: responseData.timeline || responseData.records || [],
          currentMedications: responseData.currentMedications || [],
          pendingFollowUps: responseData.pendingFollowUps || [],
          upcomingAppointments: responseData.upcomingAppointments || [],
          statistics: responseData.statistics || {
            totalVisits: responseData.records?.length || 0,
            completedVaccinations: 0,
            pendingVaccinations: 0,
            lastVisit: responseData.records?.length > 0 ? responseData.records[0].date : null,
            nextAppointment: null,
            totalExpenses: 0,
            outstandingBalance: 0
          }
        };
        setData(dataWithStats);
      }
    } catch (error) {
      console.error('Failed to load pet medical history:', error);
      // Set empty data structure to prevent crashes
      setData({
        pet: { name: 'Pet', petCode: petId },
        records: [],
        timeline: [],
        currentMedications: [],
        pendingFollowUps: [],
        upcomingAppointments: [],
        statistics: {
          totalVisits: 0,
          completedVaccinations: 0,
          pendingVaccinations: 0,
          lastVisit: null,
          nextAppointment: null,
          totalExpenses: 0,
          outstandingBalance: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const viewRecordDetail = async (recordId) => {
    try {
      // Try the existing endpoint, but handle if it doesn't exist
      const response = await veterinaryAPI.userGetMedicalRecordDetail(recordId);
      setSelectedRecord(response.data.data.record);
    } catch (error) {
      console.error('Failed to load record details:', error);
      // Show a simple alert instead of crashing
      alert('Unable to load detailed record information. This feature may not be available yet.');
    }
  };

  const downloadRecord = async (recordId) => {
    try {
      // Try the download endpoint, but handle if it doesn't exist
      const response = await veterinaryAPI.userDownloadMedicalRecord(recordId);
      console.log('Download data:', response.data);
      alert('Download functionality will generate a PDF of the medical record');
    } catch (error) {
      console.error('Failed to download record:', error);
      // Show a simple alert instead of crashing
      alert('Download feature is not available yet. Please contact your veterinarian for records.');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getTimelineIcon = (type) => {
    const icons = {
      medical_visit: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
      vaccination: { icon: Syringe, color: 'text-green-600', bg: 'bg-green-100' },
      appointment: { icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' }
    };
    return icons[type] || icons.medical_visit;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading medical history...</p>
        </div>
      </div>
    );
  }

  if (!data || (!data.pet && !data.records && !data.timeline)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Medical History</h2>
          <p className="text-gray-600 mb-4">
            Medical history for pet {petId} is not available yet.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/User/veterinary/book')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Book Veterinary Appointment
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Pet Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <button
            onClick={() => navigate('/user/veterinary/medical-history')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Pets
          </button>

          <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
            {data.pet?.image ? (
              <img
                src={data.pet.image}
                alt={data.pet?.name || 'Pet'}
                className="w-32 h-32 rounded-full object-cover border-4 border-blue-100 mb-4 md:mb-0"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center mb-4 md:mb-0">
                <Heart className="w-16 h-16 text-white" />
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{data.pet?.name || `Pet ${petId}`}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-gray-600">
                <span>{data.pet?.species || 'Unknown Species'}</span>
                <span>•</span>
                <span>{data.pet?.breed || 'Unknown Breed'}</span>
                {data.pet?.age && (
                  <>
                    <span>•</span>
                    <span>{data.pet.age}</span>
                  </>
                )}
                {data.pet?.gender && (
                  <>
                    <span>•</span>
                    <span>{data.pet.gender}</span>
                  </>
                )}
                {data.pet?.weight && (
                  <>
                    <span>•</span>
                    <span>{data.pet.weight} lbs</span>
                  </>
                )}
              </div>
              {data.pet?.microchipId && (
                <p className="text-sm text-gray-500 mt-2">
                  <span className="font-medium">Microchip ID:</span> {data.pet.microchipId}
                </p>
              )}
              {data.pet?.color && (
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Color:</span> {data.pet.color}
                </p>
              )}
            </div>

            <div className="mt-4 md:mt-0">
              <button
                onClick={() => navigate('/User/veterinary/book', { state: { selectedPet: data.pet } })}
                className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Book Appointment
              </button>
            </div>
          </div>
        </div>

        {/* Health Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Visits</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {data.statistics?.totalVisits || 0}
                </p>
                {data.statistics?.lastVisit && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last: {formatDate(data.statistics.lastVisit)}
                  </p>
                )}
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Vaccinations</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {data.statistics?.completedVaccinations || 0}
                </p>
                {(data.statistics?.pendingVaccinations || 0) > 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    {data.statistics.pendingVaccinations} pending
                  </p>
                )}
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Syringe className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Next Appointment</p>
                {data.statistics?.nextAppointment ? (
                  <>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {formatDate(data.statistics?.nextAppointment)}
                    </p>
                    <p className="text-xs text-green-600 mt-1">Scheduled</p>
                  </>
                ) : (
                  <p className="text-lg font-medium text-gray-400 mt-1">None</p>
                )}
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(data.statistics?.totalExpenses || 0)}
                </p>
                {(data.statistics?.outstandingBalance || 0) > 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    {formatCurrency(data.statistics?.outstandingBalance || 0)} due
                  </p>
                )}
              </div>
              <div className="bg-teal-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Alerts - Pending Follow-ups */}
        {data.pendingFollowUps && data.pendingFollowUps.length > 0 && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-orange-900 mb-2">
                  Pending Follow-ups ({(data.pendingFollowUps || []).length})
                </h3>
                <div className="space-y-2">
                  {(data.pendingFollowUps || []).map((followUp, idx) => (
                    <div key={idx} className="text-sm text-orange-800">
                      • {followUp.diagnosis} - Due: {formatDate(followUp.followUpDate)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex flex-wrap px-6">
              {[
                { key: 'timeline', label: 'Timeline' },
                { key: 'medications', label: 'Medications' },
                { key: 'vaccinations', label: 'Vaccinations' },
                { key: 'appointments', label: 'Appointments' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-6">
                {(data.timeline || []).length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No medical history available yet</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                    {(data.timeline || []).map((item, idx) => {
                      const iconData = getTimelineIcon(item.type);
                      const Icon = iconData.icon;

                      return (
                        <div key={idx} className="relative flex items-start space-x-4 mb-8">
                          <div className={`relative z-10 ${iconData.bg} p-3 rounded-full`}>
                            <Icon className={`w-5 h-5 ${iconData.color}`} />
                          </div>

                          <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                                <p className="text-sm text-gray-500">{formatDate(item.date)}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {item.cost && (
                                  <span className="text-sm font-medium text-gray-900">
                                    {formatCurrency(item.cost)}
                                  </span>
                                )}
                                {item.recordId && (
                                  <button
                                    onClick={() => viewRecordDetail(item.recordId)}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                  >
                                    View Details
                                  </button>
                                )}
                              </div>
                            </div>

                            {item.type === 'medical_visit' && (
                              <div className="space-y-2 text-sm">
                                {item.diagnosis && (
                                  <div>
                                    <span className="font-medium text-gray-700">Diagnosis:</span>
                                    <p className="text-gray-600">{item.diagnosis}</p>
                                  </div>
                                )}
                                {item.treatment && (
                                  <div>
                                    <span className="font-medium text-gray-700">Treatment:</span>
                                    <p className="text-gray-600">{item.treatment}</p>
                                  </div>
                                )}
                                {item.clinic && (
                                  <div className="flex items-center text-gray-600 mt-2">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    <span className="text-xs">{item.clinic}</span>
                                    {item.clinicLocation && (
                                      <span className="text-xs ml-1">• {item.clinicLocation}</span>
                                    )}
                                  </div>
                                )}
                                {item.veterinarian && (
                                  <div className="flex items-center text-gray-600">
                                    <User className="w-3 h-3 mr-1" />
                                    <span className="text-xs">Dr. {item.veterinarian}</span>
                                  </div>
                                )}
                                {item.medications && item.medications.length > 0 && (
                                  <div className="mt-3">
                                    <p className="font-medium text-gray-700 mb-1">Medications:</p>
                                    <div className="space-y-1">
                                      {item.medications.map((med, i) => (
                                        <div key={i} className="bg-blue-50 rounded px-3 py-2">
                                          <p className="text-xs font-medium">{med.name}</p>
                                          <p className="text-xs text-gray-600">
                                            {med.dosage} • {med.frequency}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {item.paymentStatus && (
                                  <div className="mt-2">
                                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                      item.paymentStatus === 'paid'
                                        ? 'bg-green-100 text-green-800'
                                        : item.paymentStatus === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {item.paymentStatus}
                                    </span>
                                    {item.balanceDue > 0 && (
                                      <span className="ml-2 text-xs text-red-600">
                                        Balance: {formatCurrency(item.balanceDue)}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {item.followUp && (
                                  <div className="mt-2 bg-orange-50 border border-orange-200 rounded p-2">
                                    <p className="text-orange-800 text-xs flex items-center">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      Follow-up scheduled: {formatDate(item.followUp.date)}
                                    </p>
                                    {item.followUp.notes && (
                                      <p className="text-xs text-orange-700 mt-1">{item.followUp.notes}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {item.type === 'vaccination' && (
                              <div className="space-y-1 text-sm">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                  item.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {item.status}
                                </span>
                                {item.nextDueDate && (
                                  <p className="text-gray-600 mt-1">
                                    Next due: {formatDate(item.nextDueDate)}
                                  </p>
                                )}
                                {item.batchNumber && (
                                  <p className="text-gray-500 text-xs">Batch: {item.batchNumber}</p>
                                )}
                              </div>
                            )}

                            {item.type === 'appointment' && (
                              <div className="space-y-1 text-sm">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                  item.status === 'confirmed'
                                    ? 'bg-green-100 text-green-800'
                                    : item.status === 'pending_approval'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.status}
                                </span>
                                {item.reason && (
                                  <p className="text-gray-600 mt-1">{item.reason}</p>
                                )}
                                {item.clinic && (
                                  <div className="flex items-center text-gray-600 mt-1">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    <span className="text-xs">{item.clinic}</span>
                                    {item.clinicLocation && (
                                      <span className="text-xs ml-1">• {item.clinicLocation}</span>
                                    )}
                                  </div>
                                )}
                                {item.timeSlot && (
                                  <div className="flex items-center text-gray-600">
                                    <Clock className="w-3 h-3 mr-1" />
                                    <span className="text-xs">Time: {item.timeSlot}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Current Medications Tab */}
            {activeTab === 'medications' && (
              <div className="space-y-4">
                {(data.currentMedications || []).length === 0 ? (
                  <div className="text-center py-12">
                    <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No current medications</p>
                  </div>
                ) : (
                  (data.currentMedications || []).map((med, idx) => (
                    <div key={idx} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <Pill className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-gray-900">{med.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {med.dosage} • {med.frequency}
                            </p>
                            {med.duration && (
                              <p className="text-xs text-gray-500 mt-1">Duration: {med.duration}</p>
                            )}
                            {med.notes && (
                              <p className="text-xs text-gray-600 mt-1">{med.notes}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          Prescribed: {formatDate(med.prescribedDate)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Vaccinations Tab */}
            {activeTab === 'vaccinations' && (
              <div className="space-y-4">
                {(data.timeline || []).filter(item => item.type === 'vaccination').length === 0 ? (
                  <div className="text-center py-12">
                    <Syringe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No vaccination records</p>
                  </div>
                ) : (
                  (data.timeline || [])
                    .filter(item => item.type === 'vaccination')
                    .map((vac, idx) => (
                      <div key={idx} className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <Syringe className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-gray-900">{vac.vaccineName || vac.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {formatDate(vac.date)}
                              </p>
                              {vac.nextDueDate && (
                                <p className="text-xs text-green-700 mt-1 font-medium">
                                  Next due: {formatDate(vac.nextDueDate)}
                                </p>
                              )}
                              {vac.notes && (
                                <p className="text-xs text-gray-600 mt-1">{vac.notes}</p>
                              )}
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            vac.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {vac.status}
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <div className="space-y-4">
                {(data.upcomingAppointments || []).length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No upcoming appointments</p>
                    <button
                      onClick={() => navigate('/user/veterinary/booking', { state: { selectedPet: data.pet } })}
                      className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Book Appointment
                    </button>
                  </div>
                ) : (
                  (data.upcomingAppointments || []).map((apt, idx) => (
                    <div key={idx} className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {apt.service || apt.reason || 'Appointment'}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {formatDate(apt.date)} {apt.time && `• ${apt.time}`}
                            </p>
                            {apt.clinic && (
                              <div className="flex items-center text-gray-600 mt-1">
                                <MapPin className="w-3 h-3 mr-1" />
                                <span className="text-xs">{apt.clinic}</span>
                                {apt.clinicLocation && (
                                  <span className="text-xs ml-1">• {apt.clinicLocation}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          apt.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full my-8">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-2xl font-bold text-gray-900">Medical Record Details</h2>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Visit Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Visit Information</h3>
                <dl className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <dt className="text-sm text-gray-600">Date</dt>
                    <dd className="text-sm font-medium">{formatDate(selectedRecord.visitDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">Veterinarian</dt>
                    <dd className="text-sm font-medium">{selectedRecord.staff?.name || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">Clinic</dt>
                    <dd className="text-sm font-medium">{selectedRecord.veterinary?.name || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600">Location</dt>
                    <dd className="text-sm font-medium">
                      {selectedRecord.veterinary?.address 
                        ? `${selectedRecord.veterinary.address.street || ''}, ${selectedRecord.veterinary.address.city || ''}, ${selectedRecord.veterinary.address.state || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',') || 'N/A'
                        : selectedRecord.veterinary?.storeName || 'N/A'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Diagnosis & Treatment */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Diagnosis & Treatment</h3>
                <div className="bg-blue-50 rounded-lg p-4 space-y-3">
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
                  <h3 className="text-lg font-semibold mb-3">Medications Prescribed</h3>
                  <div className="space-y-2">
                    {selectedRecord.medications.map((med, idx) => (
                      <div key={idx} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <p className="font-medium text-sm">{med.name}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {med.dosage} • {med.frequency} {med.duration && `• ${med.duration}`}
                        </p>
                        {med.notes && (
                          <p className="text-xs text-gray-600 mt-1">{med.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
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
                    <span className={`text-sm font-bold ${selectedRecord.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(selectedRecord.balanceDue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={() => downloadRecord(selectedRecord._id)}
                className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Record (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
