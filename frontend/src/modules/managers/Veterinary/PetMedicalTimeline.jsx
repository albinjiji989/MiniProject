import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { veterinaryAPI } from '../../../services/api';
import {
  Calendar, Heart, Syringe, Activity, FileText, ArrowLeft,
  Clock, DollarSign, AlertCircle, CheckCircle, Pill, TestTube,
  Scissors, Download, TrendingUp, User
} from 'lucide-react';

export default function PetMedicalTimeline() {
  const { petId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');

  useEffect(() => {
    if (petId) {
      loadPetMedicalHistory();
    }
  }, [petId]);

  const loadPetMedicalHistory = async () => {
    setLoading(true);
    try {
      const response = await veterinaryAPI.managerGetPetMedicalHistory(petId);
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to load pet medical history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
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

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No medical history found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
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
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>

          <div className="flex items-start space-x-6">
            {data.pet.image ? (
              <img
                src={data.pet.image}
                alt={data.pet.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center">
                <Heart className="w-12 h-12 text-white" />
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{data.pet.name}</h1>
              <div className="flex items-center space-x-4 mt-2 text-gray-600">
                <span>{data.pet.species}</span>
                <span>•</span>
                <span>{data.pet.breed}</span>
                <span>•</span>
                <span>{data.pet.age}</span>
                <span>•</span>
                <span>{data.pet.gender}</span>
                {data.pet.weight && (
                  <>
                    <span>•</span>
                    <span>{data.pet.weight} lbs</span>
                  </>
                )}
              </div>
              {data.pet.microchipId && (
                <p className="text-sm text-gray-500 mt-1">
                  Microchip: {data.pet.microchipId}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Visits</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {data.statistics.totalVisits}
                </p>
                {data.statistics.lastVisit && (
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
                  {data.statistics.totalVaccinations}
                </p>
                {data.statistics.pendingVaccinations > 0 && (
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
                {data.statistics.nextAppointment ? (
                  <>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {formatDate(data.statistics.nextAppointment)}
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
                <p className="text-gray-600 text-sm">Health Score</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {data.statistics.totalVisits > 0 ? 'Good' : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Overall status</p>
              </div>
              <div className="bg-teal-100 p-3 rounded-lg">
                <Heart className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {['timeline', 'diagnoses', 'medications', 'vaccinations'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-6">
                {data.timeline.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No medical history available</p>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                    {data.timeline.map((item, idx) => {
                      const iconData = getTimelineIcon(item.type);
                      const Icon = iconData.icon;

                      return (
                        <div key={idx} className="relative flex items-start space-x-4 mb-8">
                          {/* Icon */}
                          <div className={`relative z-10 ${iconData.bg} p-3 rounded-full`}>
                            <Icon className={`w-5 h-5 ${iconData.color}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                                <p className="text-sm text-gray-500">{formatDate(item.date)}</p>
                              </div>
                              {item.cost && (
                                <span className="text-sm font-medium text-gray-900">
                                  {formatCurrency(item.cost)}
                                </span>
                              )}
                            </div>

                            {item.type === 'medical_visit' && (
                              <div className="space-y-2 text-sm">
                                {item.diagnosis && (
                                  <p><strong>Diagnosis:</strong> {item.diagnosis}</p>
                                )}
                                {item.treatment && (
                                  <p><strong>Treatment:</strong> {item.treatment}</p>
                                )}
                                {item.veterinarian && (
                                  <p className="text-gray-600">
                                    <User className="w-3 h-3 inline mr-1" />
                                    Dr. {item.veterinarian}
                                  </p>
                                )}
                                {item.medications && item.medications.length > 0 && (
                                  <div className="mt-2">
                                    <p className="font-medium">Medications:</p>
                                    <ul className="list-disc list-inside ml-2 text-gray-600">
                                      {item.medications.map((med, i) => (
                                        <li key={i}>{med.name} - {med.dosage}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {item.followUp && (
                                  <div className="mt-2 bg-orange-50 border border-orange-200 rounded p-2">
                                    <p className="text-orange-800 text-xs flex items-center">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      Follow-up: {formatDate(item.followUp.date)}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {item.type === 'vaccination' && (
                              <div className="space-y-1 text-sm">
                                {item.status && (
                                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                    item.status === 'completed'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {item.status}
                                  </span>
                                )}
                                {item.nextDueDate && (
                                  <p className="text-gray-600">
                                    Next Due: {formatDate(item.nextDueDate)}
                                  </p>
                                )}
                                {item.batchNumber && (
                                  <p className="text-gray-500 text-xs">
                                    Batch: {item.batchNumber}
                                  </p>
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
                                  <p className="text-gray-600">{item.reason}</p>
                                )}
                                {item.timeSlot && (
                                  <p className="text-gray-500 text-xs">Time: {item.timeSlot}</p>
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

            {/* Recent Diagnoses Tab */}
            {activeTab === 'diagnoses' && (
              <div className="space-y-4">
                {data.recentDiagnoses.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No diagnoses recorded</p>
                ) : (
                  data.recentDiagnoses.map((diagnosis, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="font-medium text-gray-900">{diagnosis}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Current Medications Tab */}
            {activeTab === 'medications' && (
              <div className="space-y-4">
                {data.ongoingMedications.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No ongoing medications</p>
                ) : (
                  data.ongoingMedications.map((med, idx) => (
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
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(med.prescribedDate)}
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
                {data.timeline.filter(item => item.type === 'vaccination').length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No vaccination records</p>
                ) : (
                  data.timeline
                    .filter(item => item.type === 'vaccination')
                    .map((vac, idx) => (
                      <div key={idx} className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <Syringe className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-gray-900">{vac.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {formatDate(vac.date)}
                              </p>
                              {vac.nextDueDate && (
                                <p className="text-xs text-green-700 mt-1">
                                  Next due: {formatDate(vac.nextDueDate)}
                                </p>
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
          </div>
        </div>

        {/* Upcoming Appointments */}
        {data.upcomingAppointments && data.upcomingAppointments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Appointments</h2>
            <div className="space-y-3">
              {data.upcomingAppointments.map((apt, idx) => (
                <div key={idx} className="flex items-center justify-between bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">{apt.service || apt.reason}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(apt.date)} {apt.time && `• ${apt.time}`}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
