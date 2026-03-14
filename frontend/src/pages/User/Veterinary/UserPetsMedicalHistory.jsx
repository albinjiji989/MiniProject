import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { veterinaryAPI } from '../../../services/api';
import { Heart, Calendar, Syringe, FileText, Eye, TrendingUp, AlertCircle } from 'lucide-react';

export default function UserPetsMedicalHistory() {
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    setLoading(true);
    try {
      const response = await veterinaryAPI.userGetPetsMedicalHistory();
      setPets(response.data.data.pets || []);
    } catch (error) {
      console.error('Failed to load pets medical history:', error);
      setPets([]);
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

  const viewPetHistory = (petId) => {
    navigate(`/user/veterinary/medical-history/${petId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your pets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900">My Pets Medical History</h1>
          <p className="text-gray-600 mt-2">
            View comprehensive medical records, vaccinations, and upcoming appointments for all your pets
          </p>
        </div>

        {/* Pets Grid */}
        {pets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pets Found</h3>
            <p className="text-gray-600 mb-6">
              You don't have any pets registered for medical history tracking yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <div
                key={pet._id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer"
                onClick={() => viewPetHistory(pet._id)}
              >
                {/* Pet Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-400 to-teal-400">
                  {pet.image ? (
                    <img
                      src={pet.image}
                      alt={pet.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Heart className="w-20 h-20 text-white opacity-50" />
                    </div>
                  )}
                  {pet.upcomingAppointments > 0 && (
                    <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {pet.upcomingAppointments} upcoming
                    </div>
                  )}
                </div>

                {/* Pet Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{pet.name}</h3>
                      <p className="text-gray-600 text-sm">
                        {pet.species} • {pet.breed}
                      </p>
                      {pet.age && (
                        <p className="text-gray-500 text-xs mt-1">
                          Age: {pet.age} • {pet.gender}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Medical Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-xs text-gray-600">Records</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{pet.recordCount}</p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-gray-600">Appointments</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {pet.upcomingAppointments}
                      </p>
                    </div>
                  </div>

                  {/* Last Visit */}
                  {pet.lastVisit ? (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-xs text-gray-600 mb-1">Last Visit</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(pet.lastVisit.date)}
                      </p>
                      {pet.lastVisit.diagnosis && (
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {pet.lastVisit.diagnosis}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-xs text-gray-500">No visit history yet</p>
                    </div>
                  )}

                  {/* View Details Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      viewPetHistory(pet._id);
                    }}
                    className="w-full flex items-center justify-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Medical History
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/user/veterinary/book')}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 text-left"
          >
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Book Appointment</h3>
            <p className="text-gray-600 text-sm">Schedule a veterinary consultation for your pet</p>
          </button>

          <button
            onClick={() => navigate('/user/veterinary/appointments')}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 text-left"
          >
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">View Appointments</h3>
            <p className="text-gray-600 text-sm">Check all your upcoming and past appointments</p>
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-start space-x-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Keep Your Pets Healthy</h3>
              <p className="text-blue-50 text-sm">
                Regular check-ups and vaccinations are essential for your pet's health. 
                Book an appointment today if your pet hasn't been seen in the last 6 months.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
