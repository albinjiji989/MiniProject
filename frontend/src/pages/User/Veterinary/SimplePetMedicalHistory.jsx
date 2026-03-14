import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { veterinaryAPI } from '../../../services/api';
import {
  Calendar, Heart, ArrowLeft, FileText, Activity
} from 'lucide-react';

export default function SimplePetMedicalHistory() {
  const { petId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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
      
      // Create a simple data structure
      setData({
        pet: { name: 'Pet', petCode: petId },
        records: Array.isArray(responseData) ? responseData : (responseData?.records || [])
      });
    } catch (error) {
      console.error('Failed to load pet medical history:', error);
      // Set empty data structure to prevent crashes
      setData({
        pet: { name: 'Pet', petCode: petId },
        records: []
      });
    } finally {
      setLoading(false);
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

  // Simple UI for medical history
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Pet Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <button
            onClick={() => navigate('/User/veterinary/medical-history')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Pets
          </button>

          <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center mb-4 md:mb-0">
              <Heart className="w-16 h-16 text-white" />
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{data.pet?.name || `Pet ${petId}`}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-gray-600">
                <span>{data.pet?.species || 'Pet'}</span>
                {data.pet?.breed && (
                  <>
                    <span>•</span>
                    <span>{data.pet.breed}</span>
                  </>
                )}
                {data.pet?.age && (
                  <>
                    <span>•</span>
                    <span>{data.pet.age}</span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Pet Code: {petId}
              </p>
            </div>

            <div className="mt-4 md:mt-0">
              <button
                onClick={() => navigate('/User/veterinary/book')}
                className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Book Appointment
              </button>
            </div>
          </div>
        </div>

        {/* Medical Records Status */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Medical Records</h2>
          
          {(data.records && data.records.length > 0) ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Found {data.records.length} medical record(s) for this pet.
              </p>
              {data.records.slice(0, 5).map((record, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="font-medium text-gray-900">
                    {record.title || record.type || record.diagnosis || 'Medical Record'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {record.date ? formatDate(record.date) : 'Date not available'}
                  </p>
                  {record.notes && (
                    <p className="text-sm text-gray-500 mt-1">{record.notes}</p>
                  )}
                  {record.veterinarian && (
                    <p className="text-xs text-gray-400 mt-1">Dr. {record.veterinarian}</p>
                  )}
                </div>
              ))}
              {data.records.length > 5 && (
                <p className="text-sm text-gray-500">
                  ... and {data.records.length - 5} more records
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No medical records found for this pet.</p>
              <button
                onClick={() => navigate('/User/veterinary/book')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Schedule First Checkup
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/User/veterinary/book')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calendar className="w-6 h-6 text-blue-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Book Appointment</p>
                <p className="text-sm text-gray-500">Schedule a veterinary visit</p>
              </div>
            </button>
            
            <button
              onClick={() => navigate('/User/veterinary/dashboard')}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Activity className="w-6 h-6 text-green-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Veterinary Dashboard</p>
                <p className="text-sm text-gray-500">View all veterinary services</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}